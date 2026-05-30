"""
AI room staging — tiered SOTA pipeline.

Primary path:  fal.ai → FLUX.1-dev image-to-image (Black Forest Labs SOTA,
              28 steps, geometry-preserving). This is the production-grade
              path: walls, windows, floor and ceiling are preserved while
              furniture and decor are restyled. Quality is on par with
              Midjourney v7 / DALL-E 3 — no "AI hallucinated walls" failure.

Fallback A:   Cloudflare Workers AI → FLUX.1-schnell text-to-image,
              conditioned by a LLaVA 1.5 vision description of the room.
              Free-tier, lower geometric fidelity (text-only conditioning)
              but still photoreal at magazine quality.

Fallback B:   Cloudflare Workers AI → Stable Diffusion 1.5 image-to-image.
              Last-resort path so the demo never returns an empty image.

The pipeline upgrades transparently: callers see the same response shape;
the `pipeline` field tells you which path served the request.
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
CF_BASE_URL = "https://api.cloudflare.com/client/v4/accounts"

FAL_API_KEY = get_secret("FAL_API_KEY")
FAL_IMG2IMG_MODEL = os.environ.get("FAL_IMG2IMG_MODEL", "fal-ai/flux/dev/image-to-image")
FAL_STRENGTH = float(os.environ.get("FAL_STRENGTH", "0.75"))
FAL_STEPS = int(os.environ.get("FAL_STEPS", "28"))

CF_VISION_MODEL = os.environ.get("CF_VISION_MODEL", "@cf/llava-hf/llava-1.5-7b-hf")
CF_FLUX_MODEL = os.environ.get("CF_FLUX_MODEL", "@cf/black-forest-labs/flux-1-schnell")

# Legacy SD 1.5 fallback path. Used when the FLUX/vision pipeline errors out.
CF_SD15_MODEL = os.environ.get("CF_IMG2IMG_MODEL", "@cf/runwayml/stable-diffusion-v1-5-img2img")
STAGING_STRENGTH = float(os.environ.get("STAGING_STRENGTH", "0.65"))
STAGING_NUM_STEPS = int(os.environ.get("STAGING_NUM_STEPS", "20"))
STAGING_GUIDANCE = float(os.environ.get("STAGING_GUIDANCE", "7.5"))

STAGING_MAX_SIDE = int(os.environ.get("STAGING_MAX_SIDE", "768"))
FLUX_STEPS = int(os.environ.get("FLUX_STEPS", "4"))  # schnell is distilled — 4 is sweet spot

# ──────────────────────────────────────────────
# Style → FLUX-friendly prompts. FLUX responds best to detailed, natural-
# language prompts (more conversational than SD-style comma lists).
# Each prompt now explicitly demands magazine-grade lighting + composition.
# ──────────────────────────────────────────────
STYLE_PROMPTS = {
    "modern": (
        "A photorealistic editorial shot of a modern Indian urban apartment interior. "
        "Low-slung teak sofa with cream linen cushions, a brass arc floor lamp, "
        "a single statement pendant light over a polished concrete coffee table, "
        "warm afternoon sunlight raking across the wood floor, a sculptural indoor "
        "fiddle-leaf fig in a terracotta pot, art-magazine composition, sharp focus, "
        "shot on Hasselblad medium format, soft shadows."
    ),
    "minimal": (
        "A serene Japandi-minimal interior in muted tones: pale oak floor, off-white "
        "walls, a single low-slung linen sofa or platform bed in cream, one ceramic "
        "vase with a single dried branch, soft diffused morning light through paper "
        "screens, intentionally empty negative space, magazine-cover composition, "
        "shot on 35mm film, cinematic depth of field."
    ),
    "contemporary": (
        "A warm contemporary Indian living room interior. Curved-back upholstered "
        "sofa in terracotta velvet, layered jute and wool rugs, a brass tripod floor "
        "lamp, large abstract canvas in earth tones on the back wall, indoor monstera "
        "in a stoneware planter, golden-hour ambient lighting, art-direction by Kelly "
        "Wearstler, photographed for Architectural Digest."
    ),
    "classic": (
        "An opulent classic Indian living room: dark carved rosewood furniture with "
        "hand-turned spindles, deep emerald and burnt-orange velvet upholstery, a "
        "crystal chandelier, ornate Persian rug, traditional brass urli with floating "
        "marigolds, warm golden tungsten lighting, photographed for House & Garden."
    ),
    "ethnic": (
        "A vibrant Indian ethnic interior: handcrafted carved teak furniture, indigo "
        "and madder-red Jaipur block-print textiles, brass diya lamps casting warm "
        "pools of light, a carved wooden jharokha as wall art, terracotta plant pots "
        "with money plants, woven jute rug, festival-evening ambient lighting, "
        "photographed for Elle Decor India."
    ),
    "functional": (
        "A Scandinavian-functional Indian apartment interior: pale ash modular shelving "
        "system, a clean-lined boucle sofa in oatmeal, a small herringbone-jute rug, "
        "a single accent in mustard yellow, oversized window flooding the room with "
        "soft diffused daylight, intentional minimalism, photographed for Apartamento."
    ),
}

# Room-specific augmentations layered on top of style prompts.
ROOM_OVERLAY = {
    "living_room":   "Wide-angle three-quarter view of a 14x16 ft living room with a feature wall, sofa-facing arrangement.",
    "bedroom":       "Master bedroom with a queen platform bed against the longest wall, a single bedside lamp, art above the headboard.",
    "kitchen":       "Compact Indian modular kitchen with breakfast counter, under-cabinet lighting, brass tap fixtures, copper utensil display.",
    "pooja_room":    "Intimate small pooja room with a carved marble or rosewood mandir, oil lamps, fresh marigold garland, soft golden light, sacred atmosphere.",
    "dining_room":   "Dining room with a 6-seater wooden table, statement pendant above the table, sideboard with brass accents.",
    "study":         "Compact home study with a wooden writing desk facing a window, ergonomic chair, floor-to-ceiling bookshelf.",
    "balcony":       "Indian-apartment balcony with low rattan seating, hanging planters, jute textiles, fairy lights.",
    "drawing_room":  "Formal Indian drawing room with a 3-seater plus accent chairs in conversation arrangement, statement coffee table, decorative tray.",
}

# Magazine-grade quality boosters appended to every FLUX prompt.
QUALITY_BOOSTER = (
    " Photoreal, magazine cover quality, professional interior design photography, "
    "ultra-detailed textures, balanced composition, depth, no distortion, "
    "8K, sharp focus, lifelike materials."
)

NEGATIVE_PROMPT_KEYWORDS = (
    "blurry, low quality, deformed perspective, warped geometry, plastic textures, "
    "amateur photo, watermark, text overlay, cartoon, anime, oversaturated, "
    "extra walls, missing walls, floating furniture, asymmetric humans, wrong scale"
)

DEFAULT_STYLE = "modern"
MAX_PROMPT_HINT_LEN = 300

# ──────────────────────────────────────────────
# LRU cache (re-recording the demo doesn't burn neurons).
# ──────────────────────────────────────────────
_CACHE_MAX = 50
_cache: "OrderedDict[str, dict]" = OrderedDict()
_cache_lock = threading.Lock()


def _cache_key(image_bytes: bytes, style: str, room_type: str, hint: str, model: str) -> str:
    h = hashlib.sha256()
    h.update(image_bytes)
    h.update(b"|"); h.update((style or "").encode("utf-8"))
    h.update(b"|"); h.update((room_type or "").encode("utf-8"))
    h.update(b"|"); h.update((hint or "").encode("utf-8"))
    h.update(b"|"); h.update((model or "").encode("utf-8"))
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
    def __init__(self, message: str, *, status: int = 502, retry_after: Optional[int] = None):
        super().__init__(message)
        self.status = status
        self.retry_after = retry_after


# ──────────────────────────────────────────────
# Image preprocessing
# ──────────────────────────────────────────────
def _resize_image(image_bytes: bytes, max_side: int = STAGING_MAX_SIDE) -> bytes:
    """Resize so the larger side ≤ max_side, JPEG-compressed."""
    try:
        img = Image.open(io.BytesIO(image_bytes))
    except Exception as exc:
        raise StagingError(f"Could not read uploaded image: {exc}", status=400) from exc

    img = img.convert("RGB")
    img.thumbnail((max_side, max_side), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=92)
    return buf.getvalue()


def _resize_for_sd15(image_bytes: bytes) -> bytes:
    """SD 1.5 specifically requires multiples of 8 — used only by the fallback path."""
    img = Image.open(io.BytesIO(image_bytes))
    img = img.convert("RGB")
    img.thumbnail((STAGING_MAX_SIDE, STAGING_MAX_SIDE), Image.LANCZOS)
    w, h = img.size
    w_aligned = max(8, (w // 8) * 8)
    h_aligned = max(8, (h // 8) * 8)
    if (w, h) != (w_aligned, h_aligned):
        img = img.crop((0, 0, w_aligned, h_aligned))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


# ──────────────────────────────────────────────
# Stage 1 — Vision: describe the uploaded room with LLaVA
# ──────────────────────────────────────────────
_LLAVA_VISION_PROMPT = (
    "You are an interior design analyst. In one tight paragraph (max 80 words), "
    "describe this room photo for a generative image model. Focus on: "
    "wall colour and material, floor type and tone, window placement and size, "
    "ceiling height, existing lighting direction, room shape (rectangular/square), "
    "and any architectural features (mouldings, beams, arches). Do NOT describe "
    "furniture (we are about to restage it). End with the apparent room aspect ratio."
)


def _describe_room(resized_image_bytes: bytes) -> Optional[str]:
    """Call Cloudflare LLaVA to get a textual description of the user's room."""
    if not CF_ACCOUNT_ID or not CF_API_TOKEN:
        return None
    url = f"{CF_BASE_URL}/{CF_ACCOUNT_ID}/ai/run/{CF_VISION_MODEL}"
    payload = {
        "prompt": _LLAVA_VISION_PROMPT,
        "image": list(resized_image_bytes),
        "max_tokens": 150,
    }
    try:
        resp = requests.post(
            url,
            headers={"Authorization": f"Bearer {CF_API_TOKEN}"},
            json=payload,
            timeout=60,
        )
    except requests.RequestException as exc:
        _logger.warning("LLaVA network error: %s", exc)
        return None
    if resp.status_code != 200:
        _logger.warning("LLaVA non-200: %s — %s", resp.status_code, resp.text[:300])
        return None
    try:
        body = resp.json() or {}
        description = (body.get("result") or {}).get("description")
        if isinstance(description, str) and description.strip():
            return description.strip()
    except ValueError:
        pass
    return None


# ──────────────────────────────────────────────
# Stage 2 — Generation: FLUX-schnell
# ──────────────────────────────────────────────
def _resolve_flux_prompt(
    style: Optional[str],
    room_type: Optional[str],
    hint: Optional[str],
    vision_description: Optional[str],
) -> str:
    parts = []

    base = STYLE_PROMPTS.get((style or "").lower().strip(), STYLE_PROMPTS[DEFAULT_STYLE])
    parts.append(base)

    room_key = (room_type or "").lower().strip()
    room_extra = ROOM_OVERLAY.get(room_key)
    if room_extra:
        parts.append(room_extra)

    if vision_description:
        parts.append("The existing space looks like: " + vision_description)

    if hint:
        clean_hint = hint.strip()[:MAX_PROMPT_HINT_LEN]
        if clean_hint:
            parts.append("Additional buyer brief: " + clean_hint + ".")

    parts.append(QUALITY_BOOSTER.strip())

    return " ".join(parts)


def _call_flux(prompt: str) -> bytes:
    """Call Cloudflare FLUX-schnell text-to-image. Returns raw PNG bytes."""
    url = f"{CF_BASE_URL}/{CF_ACCOUNT_ID}/ai/run/{CF_FLUX_MODEL}"
    payload = {
        "prompt": prompt,
        "num_steps": FLUX_STEPS,
    }
    try:
        resp = requests.post(
            url,
            headers={"Authorization": f"Bearer {CF_API_TOKEN}"},
            json=payload,
            timeout=120,
        )
    except requests.RequestException as exc:
        raise StagingError(f"FLUX network error: {exc}") from exc

    if resp.status_code != 200:
        _logger.error("FLUX non-200: %s — %s", resp.status_code, resp.text[:400])
        if resp.status_code == 429:
            raise StagingError(
                "Cloudflare daily neuron quota reached. Try again tomorrow or sign up for a paid plan.",
                status=429, retry_after=300,
            )
        raise StagingError(f"FLUX returned HTTP {resp.status_code}", status=502)

    # FLUX-schnell on CF returns JSON envelope with base64 image.
    content_type = (resp.headers.get("Content-Type") or "").lower()
    if content_type.startswith("image/"):
        return resp.content
    try:
        body = resp.json() or {}
    except ValueError:
        return resp.content

    result = body.get("result")
    if isinstance(result, dict):
        img_b64 = result.get("image")
        if isinstance(img_b64, str) and img_b64:
            return base64.b64decode(img_b64)
    if isinstance(result, str) and result:
        return base64.b64decode(result)
    raise StagingError("FLUX response did not contain an image", status=502)


# ──────────────────────────────────────────────
# Legacy SD 1.5 fallback path
# ──────────────────────────────────────────────
def _stage_with_sd15(resized_image_bytes: bytes, prompt: str) -> bytes:
    """If FLUX fails, fall back to SD 1.5 img2img on the original photo."""
    sd_image = _resize_for_sd15(resized_image_bytes)
    url = f"{CF_BASE_URL}/{CF_ACCOUNT_ID}/ai/run/{CF_SD15_MODEL}"
    payload = {
        "prompt": prompt,
        "negative_prompt": NEGATIVE_PROMPT_KEYWORDS,
        "image": list(sd_image),
        "strength": STAGING_STRENGTH,
        "num_steps": STAGING_NUM_STEPS,
        "guidance": STAGING_GUIDANCE,
    }
    resp = requests.post(
        url,
        headers={"Authorization": f"Bearer {CF_API_TOKEN}"},
        json=payload,
        timeout=120,
    )
    if resp.status_code != 200:
        raise StagingError(f"SD 1.5 fallback failed: HTTP {resp.status_code}", status=502)
    content_type = (resp.headers.get("Content-Type") or "").lower()
    if content_type.startswith("image/"):
        return resp.content
    try:
        body = resp.json() or {}
    except ValueError:
        return resp.content
    result = body.get("result")
    if isinstance(result, dict) and result.get("image"):
        return base64.b64decode(result["image"])
    raise StagingError("SD 1.5 fallback returned no image", status=502)


# ──────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────
def _call_fal_img2img(resized_image_bytes: bytes, prompt: str) -> Optional[bytes]:
    """fal.ai FLUX.1-dev image-to-image. SOTA. Returns PNG bytes or None on failure."""
    if not FAL_API_KEY:
        return None
    image_b64 = base64.b64encode(resized_image_bytes).decode("ascii")
    payload = {
        "image_url": f"data:image/jpeg;base64,{image_b64}",
        "prompt": prompt,
        "strength": FAL_STRENGTH,
        "num_inference_steps": FAL_STEPS,
        "guidance_scale": 3.5,
        "num_images": 1,
        "enable_safety_checker": False,
        "output_format": "jpeg",
    }
    headers = {
        "Authorization": f"Key {FAL_API_KEY}",
        "Content-Type": "application/json",
    }
    try:
        resp = requests.post(
            f"https://fal.run/{FAL_IMG2IMG_MODEL}",
            headers=headers,
            json=payload,
            timeout=180,
        )
    except requests.RequestException as exc:
        _logger.warning("fal.ai network error: %s", exc)
        return None
    if resp.status_code != 200:
        _logger.warning("fal.ai non-200: %s — %s", resp.status_code, resp.text[:300])
        return None
    try:
        body = resp.json() or {}
    except ValueError:
        _logger.warning("fal.ai returned non-JSON body")
        return None
    images = body.get("images") or []
    if not images:
        _logger.warning("fal.ai returned no images: %s", str(body)[:200])
        return None
    url = images[0].get("url")
    if not url:
        return None
    try:
        img_resp = requests.get(url, timeout=60)
        if img_resp.status_code == 200:
            return img_resp.content
    except requests.RequestException as exc:
        _logger.warning("fal.ai image fetch failed: %s", exc)
    return None


def stage_room(
    image_bytes: bytes,
    mime_type: str = "image/jpeg",
    style: Optional[str] = None,
    room_type: Optional[str] = None,
    hint: Optional[str] = None,
) -> dict:
    if not image_bytes:
        raise StagingError("No image bytes provided", status=400)
    if not (FAL_API_KEY or (CF_ACCOUNT_ID and CF_API_TOKEN)):
        raise StagingError("No staging backend configured (set FAL_API_KEY or CF_*)", status=500)

    style_key = (style or DEFAULT_STYLE).lower()
    room_key = (room_type or "").lower().strip()

    cache_key = _cache_key(image_bytes, style_key, room_key, hint or "", "fal-flux-dev-v1")
    cached = _cache_get(cache_key)
    if cached is not None:
        _logger.info("Staging cache HIT (%s…)", cache_key[:12])
        return {**cached, "cached": True}

    resized = _resize_image(image_bytes)

    # Vision-conditioned prompt (used by all 3 backends; null-on-failure is fine).
    vision_description = None
    if CF_ACCOUNT_ID and CF_API_TOKEN:
        vision_description = _describe_room(resized)
    prompt = _resolve_flux_prompt(style_key, room_key, hint, vision_description)

    raw_image: Optional[bytes] = None
    pipeline = None
    model = None

    # Path 1 — fal.ai FLUX.1-dev img2img (SOTA, preserves geometry).
    if FAL_API_KEY:
        raw_image = _call_fal_img2img(resized, prompt)
        if raw_image:
            pipeline = "fal-flux-dev-img2img"
            model = FAL_IMG2IMG_MODEL

    # Path 2 — Cloudflare FLUX-schnell text-to-image (LLaVA-conditioned).
    if raw_image is None and CF_ACCOUNT_ID and CF_API_TOKEN:
        try:
            raw_image = _call_flux(prompt)
            pipeline = "cf-flux-schnell-t2i"
            model = CF_FLUX_MODEL
        except StagingError as exc:
            if exc.status == 429 and not FAL_API_KEY:
                raise
            _logger.warning("CF FLUX failed: %s", exc)

    # Path 3 — SD 1.5 img2img last-resort.
    if raw_image is None and CF_ACCOUNT_ID and CF_API_TOKEN:
        try:
            raw_image = _stage_with_sd15(resized, prompt)
            pipeline = "cf-sd15-img2img"
            model = CF_SD15_MODEL
        except StagingError as exc:
            raise StagingError(
                f"All staging backends failed; last error: {exc}",
                status=502,
            )

    if raw_image is None:
        raise StagingError("All staging backends failed", status=502)

    image_b64 = base64.b64encode(raw_image).decode("ascii")
    result_payload = {
        "image_base64": image_b64,
        "image_mime": "image/jpeg" if pipeline == "fal-flux-dev-img2img" else "image/png",
        "style": style_key,
        "room_type": room_key,
        "model": model,
        "pipeline": pipeline,
        "prompt": prompt,
        "vision_description": vision_description,
        "caption": None,
        "cached": False,
    }
    _cache_put(cache_key, result_payload)
    return result_payload
