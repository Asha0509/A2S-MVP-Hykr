"""
AI room staging via Cloudflare Workers AI (SD 1.5 img2img).

Takes an empty/cluttered room photo + a style prompt and returns a fully
furnished render in the chosen style. This is the "wow" feature of the
HyKr MVP: buyer uploads photo → gets a magazine-quality staged room back.

Why Cloudflare Workers AI:
  - Truly free (10,000 neurons/day on the free Cloudflare plan, no card)
  - SD 1.5 img2img preserves room composition when `strength` is 0.55–0.7
  - Latency 3–8 sec, well within the demo window

We resize the input photo to a multiple-of-8 size (max 768) before sending
because SD 1.5 strictly needs that, and a smaller image keeps the JSON
payload and inference time small.
"""

from __future__ import annotations

import base64
import hashlib
import io
import logging
import os
import threading
from collections import OrderedDict
from typing import Optional

import requests
from PIL import Image

from config import get_secret

_logger = logging.getLogger(__name__)

CF_ACCOUNT_ID = get_secret("CF_ACCOUNT_ID")
CF_API_TOKEN = get_secret("CF_API_TOKEN")
CF_IMG2IMG_MODEL = os.environ.get("CF_IMG2IMG_MODEL", "@cf/runwayml/stable-diffusion-v1-5-img2img")
CF_BASE_URL = "https://api.cloudflare.com/client/v4/accounts"

# img2img generation knobs. Strength 0.65 keeps room geometry recognisable
# while replacing furniture/decor; 20 steps balances speed and quality.
STAGING_STRENGTH = float(os.environ.get("STAGING_STRENGTH", "0.65"))
STAGING_NUM_STEPS = int(os.environ.get("STAGING_NUM_STEPS", "20"))
STAGING_GUIDANCE = float(os.environ.get("STAGING_GUIDANCE", "7.5"))
STAGING_MAX_SIDE = int(os.environ.get("STAGING_MAX_SIDE", "768"))

# ──────────────────────────────────────────────
# Style → SD 1.5 prompt. Tuned for SD-style descriptive prompts (comma-
# separated phrases, emphasis on lighting/material keywords) rather than
# the conversational prompts Gemini liked.
# ──────────────────────────────────────────────
STYLE_PROMPTS = {
    "modern": (
        "modern Indian apartment, low-profile teak sofa, neutral linen upholstery, "
        "statement pendant light, indoor plant, warm afternoon daylight, "
        "wood floor, clean walls, photorealistic interior photography, 4k"
    ),
    "minimal": (
        "Japandi minimal interior, light oak floor, off-white walls, low-slung "
        "linen sofa or platform bed, single indoor plant, soft diffused daylight, "
        "almost no clutter, calm composition, photorealistic, 4k"
    ),
    "contemporary": (
        "contemporary Indian interior, warm beige and terracotta tones, curved-back "
        "upholstered sofa, brass floor lamp, layered rug, large abstract wall art, "
        "warm ambient lighting, photorealistic interior photography, 4k"
    ),
    "classic": (
        "classic Indian interior, dark carved teak furniture, jewel-tone upholstery, "
        "chandelier, ornate persian rug, traditional brass accents, warm golden hour "
        "lighting, photorealistic, 4k"
    ),
    "ethnic": (
        "vibrant Indian ethnic interior, handcrafted wooden furniture, block-print "
        "textiles, brass diya lamps, jharokha wall art, terracotta plant pots, "
        "warm earthy lighting, photorealistic, 4k"
    ),
    "functional": (
        "functional Scandinavian interior, light wood modular storage, clean-lined "
        "sofa or platform bed, neutral textiles, single accent colour, bright "
        "diffused daylight, photorealistic, 4k"
    ),
}

# SD's `negative_prompt` keeps the model from regressing into common failure modes.
NEGATIVE_PROMPT = (
    "blurry, low quality, deformed, distorted geometry, wrong perspective, "
    "ugly, cartoon, watermark, text, signature, frame, extra walls, missing walls"
)

DEFAULT_STYLE = "modern"
MAX_PROMPT_HINT_LEN = 300

# ──────────────────────────────────────────────
# LRU cache so re-recording the demo with the same photo + style doesn't
# burn neurons on every take.
# ──────────────────────────────────────────────
_CACHE_MAX = 50
_cache: "OrderedDict[str, dict]" = OrderedDict()
_cache_lock = threading.Lock()


def _cache_key(image_bytes: bytes, style: str, room_type: str, hint: str) -> str:
    h = hashlib.sha256()
    h.update(image_bytes)
    h.update(b"|"); h.update((style or "").encode("utf-8"))
    h.update(b"|"); h.update((room_type or "").encode("utf-8"))
    h.update(b"|"); h.update((hint or "").encode("utf-8"))
    return h.hexdigest()


def _cache_get(key: str) -> Optional[dict]:
    with _cache_lock:
        if key in _cache:
            _cache.move_to_end(key)
            return _cache[key]
    return None


def _cache_put(key: str, value: dict) -> None:
    with _cache_lock:
        _cache[key] = value
        _cache.move_to_end(key)
        while len(_cache) > _CACHE_MAX:
            _cache.popitem(last=False)


class StagingError(Exception):
    """Raised when the staging API fails or returns unusable output."""

    def __init__(self, message: str, *, status: int = 502, retry_after: Optional[int] = None):
        super().__init__(message)
        self.status = status
        self.retry_after = retry_after


def _resolve_prompt(style: Optional[str], room_type: Optional[str], hint: Optional[str]) -> str:
    base = STYLE_PROMPTS.get((style or "").lower().strip(), STYLE_PROMPTS[DEFAULT_STYLE])
    room = (room_type or "").strip().lower().replace("_", " ")
    parts = [base]
    if room:
        parts.append(f"interior of a {room}")
    if hint:
        clean_hint = hint.strip()[:MAX_PROMPT_HINT_LEN]
        if clean_hint:
            parts.append(clean_hint)
    return ", ".join(parts)


def _resize_for_sd(image_bytes: bytes) -> bytes:
    """Resize so the larger side is ≤ STAGING_MAX_SIDE and both dims are multiples of 8."""
    try:
        img = Image.open(io.BytesIO(image_bytes))
    except Exception as exc:
        raise StagingError(f"Could not read uploaded image: {exc}", status=400) from exc

    img = img.convert("RGB")
    img.thumbnail((STAGING_MAX_SIDE, STAGING_MAX_SIDE), Image.LANCZOS)

    # Crop bottom-right to nearest multiple of 8 — SD 1.5 requires this.
    w, h = img.size
    w_aligned = max(8, (w // 8) * 8)
    h_aligned = max(8, (h // 8) * 8)
    if (w, h) != (w_aligned, h_aligned):
        img = img.crop((0, 0, w_aligned, h_aligned))

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


def stage_room(
    image_bytes: bytes,
    mime_type: str = "image/jpeg",
    style: Optional[str] = None,
    room_type: Optional[str] = None,
    hint: Optional[str] = None,
) -> dict:
    """
    Send a room photo + style prompt to Cloudflare Workers AI's SD 1.5
    img2img model. Returns the same dict shape the old Gemini implementation
    used so the API layer / frontend don't need to change.
    """
    if not CF_ACCOUNT_ID or not CF_API_TOKEN:
        raise StagingError(
            "Cloudflare Workers AI credentials are not configured "
            "(CF_ACCOUNT_ID + CF_API_TOKEN).",
            status=500,
        )
    if not image_bytes:
        raise StagingError("No image bytes provided", status=400)

    prompt = _resolve_prompt(style, room_type, hint)
    cache_key = _cache_key(image_bytes, style or "", room_type or "", hint or "")
    cached = _cache_get(cache_key)
    if cached is not None:
        _logger.info("Staging cache HIT (%s…)", cache_key[:12])
        return {**cached, "cached": True}

    resized = _resize_for_sd(image_bytes)

    payload = {
        "prompt": prompt,
        "negative_prompt": NEGATIVE_PROMPT,
        "image": list(resized),  # SD img2img on CF expects an array of uint8
        "strength": STAGING_STRENGTH,
        "num_steps": STAGING_NUM_STEPS,
        "guidance": STAGING_GUIDANCE,
    }
    url = f"{CF_BASE_URL}/{CF_ACCOUNT_ID}/ai/run/{CF_IMG2IMG_MODEL}"

    try:
        resp = requests.post(
            url,
            headers={"Authorization": f"Bearer {CF_API_TOKEN}"},
            json=payload,
            timeout=120,
        )
    except requests.RequestException as exc:
        raise StagingError(f"Network error talking to Cloudflare: {exc}") from exc

    if resp.status_code != 200:
        _logger.error("Workers AI non-200: %s — %s", resp.status_code, resp.text[:500])

        # Try to surface CF's error message
        cf_msg = ""
        try:
            body = resp.json() or {}
            errs = body.get("errors") or []
            if errs:
                cf_msg = " ".join(str(e.get("message") or "") for e in errs).strip()
        except ValueError:
            cf_msg = resp.text[:200]

        if resp.status_code == 429:
            raise StagingError(
                cf_msg or "Cloudflare daily neuron quota reached. Resets at midnight UTC.",
                status=429,
                retry_after=60,
            )
        if resp.status_code in (401, 403):
            raise StagingError(
                cf_msg or "Cloudflare rejected the API token. Check CF_API_TOKEN scope.",
                status=502,
            )
        raise StagingError(
            cf_msg or f"Cloudflare Workers AI returned HTTP {resp.status_code}",
            status=502,
        )

    # ── Success path ─────────────────────────────────────────────
    # Workers AI returns the image either as raw binary PNG bytes or
    # (when called via the JSON body API) as a JSON envelope. Detect both.
    content_type = (resp.headers.get("Content-Type") or "").lower()
    raw_image: Optional[bytes] = None

    if content_type.startswith("image/"):
        raw_image = resp.content
        image_mime = content_type
    else:
        # JSON envelope path: { "result": { "image": "<base64>" } } on some models,
        # or a base64 string directly.
        try:
            body = resp.json() or {}
        except ValueError:
            raw_image = resp.content
            image_mime = "image/png"
        else:
            result = body.get("result")
            if isinstance(result, dict) and result.get("image"):
                raw_image = base64.b64decode(result["image"])
                image_mime = "image/png"
            elif isinstance(result, str):
                raw_image = base64.b64decode(result)
                image_mime = "image/png"
            else:
                _logger.error("Workers AI unexpected JSON shape: %s", str(body)[:300])
                raise StagingError("Cloudflare returned no image in response", status=502)

    if not raw_image:
        raise StagingError("Cloudflare response did not contain an image", status=502)

    image_b64 = base64.b64encode(raw_image).decode("ascii")
    result_payload = {
        "image_base64": image_b64,
        "image_mime": image_mime or "image/png",
        "style": (style or DEFAULT_STYLE).lower(),
        "room_type": (room_type or "").lower().strip(),
        "model": CF_IMG2IMG_MODEL,
        "prompt": prompt,
        "caption": None,
        "cached": False,
    }
    _cache_put(cache_key, result_payload)
    return result_payload
