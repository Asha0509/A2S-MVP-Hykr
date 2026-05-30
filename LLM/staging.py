"""
AI room staging via Google Gemini 2.5 Flash Image.

Takes an empty/cluttered room photo + a style prompt and returns a fully
furnished render in the chosen style. This is the "wow" feature of the
HyKr MVP: buyer uploads photo → gets a magazine-quality staged room back.

The Gemini Image API returns base64 PNG bytes inline in the response.
"""

from __future__ import annotations

import base64
import hashlib
import logging
import os
import re
import threading
from collections import OrderedDict
from typing import Optional

import requests

from config import get_secret

_logger = logging.getLogger(__name__)

# Tiny LRU cache so re-recording the demo with the same photo + style doesn't
# burn Gemini quota on every take. Keyed by SHA-256 of (image bytes, style,
# room_type, hint). Capped at 50 entries (each is ~1–3 MB of base64).
_CACHE_MAX = 50
_cache: "OrderedDict[str, dict]" = OrderedDict()
_cache_lock = threading.Lock()


def _cache_key(image_bytes: bytes, style: str, room_type: str, hint: str) -> str:
    h = hashlib.sha256()
    h.update(image_bytes)
    h.update(b"|")
    h.update((style or "").encode("utf-8"))
    h.update(b"|")
    h.update((room_type or "").encode("utf-8"))
    h.update(b"|")
    h.update((hint or "").encode("utf-8"))
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

GEMINI_API_KEY = get_secret("GEMINI_API_KEY")
GEMINI_IMAGE_MODEL = os.environ.get("GEMINI_IMAGE_MODEL", "gemini-2.5-flash-image")
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

# Style → detailed staging prompt. Keep these specific so Gemini produces
# coherent, magazine-quality renders instead of a generic furnished room.
STYLE_PROMPTS = {
    "modern": (
        "Restage this room in a modern Indian apartment style: clean lines, "
        "low-profile teak or oak furniture, neutral walls, a single statement "
        "pendant light, a low sofa or bed depending on the room, indoor plant, "
        "warm afternoon lighting through the window. Preserve the room's "
        "architecture, windows, doors and floor exactly."
    ),
    "minimal": (
        "Restage this room in a Japandi minimal style: light wood floors, "
        "off-white walls, a single low-slung sofa or platform bed, one plant, "
        "natural linen textiles, soft diffused daylight. Almost no clutter. "
        "Preserve the room's architecture, windows, doors and floor exactly."
    ),
    "contemporary": (
        "Restage this room in a contemporary Indian style: warm beige and "
        "terracotta tones, a curved-back sofa or upholstered bed, a brass "
        "floor lamp, layered rug, a piece of large wall art, soft warm "
        "lighting. Preserve the room's architecture, windows, doors and "
        "floor exactly."
    ),
    "classic": (
        "Restage this room in a classic Indian style: dark wood furniture "
        "with carved details, jewel-tone upholstery, a chandelier or pendant, "
        "ornate rug, traditional accents, warm golden lighting. Preserve "
        "the room's architecture, windows, doors and floor exactly."
    ),
    "ethnic": (
        "Restage this room in a vibrant Indian ethnic style: handcrafted "
        "wooden furniture, block-print textiles, brass accents, jharokha "
        "wall art, a low charpai or jhoola if appropriate, terracotta plant "
        "pots, warm earthy lighting. Preserve the room's architecture, "
        "windows, doors and floor exactly."
    ),
    "functional": (
        "Restage this room in a functional Scandinavian style: light wood "
        "modular storage, a clean-lined sofa or platform bed, a desk if "
        "appropriate, neutral textiles, a single accent colour, bright "
        "diffused daylight. Preserve the room's architecture, windows, "
        "doors and floor exactly."
    ),
}

DEFAULT_STYLE = "modern"
MAX_PROMPT_HINT_LEN = 400


class StagingError(Exception):
    """Raised when the Gemini API fails or returns unusable output."""

    def __init__(self, message: str, *, status: int = 502, retry_after: Optional[int] = None):
        super().__init__(message)
        self.status = status
        self.retry_after = retry_after


def _resolve_prompt(style: Optional[str], room_type: Optional[str], hint: Optional[str]) -> str:
    base = STYLE_PROMPTS.get((style or "").lower().strip(), STYLE_PROMPTS[DEFAULT_STYLE])
    room = (room_type or "").strip().lower()
    if room:
        base = f"Treat this room as a {room}. " + base
    if hint:
        clean_hint = hint.strip()[:MAX_PROMPT_HINT_LEN]
        if clean_hint:
            base = base + f" Additional buyer notes: {clean_hint}."
    return base


def stage_room(
    image_bytes: bytes,
    mime_type: str = "image/jpeg",
    style: Optional[str] = None,
    room_type: Optional[str] = None,
    hint: Optional[str] = None,
) -> dict:
    """
    Send a room photo to Gemini 2.5 Flash Image with a styling prompt.

    Returns a dict:
        {
          "image_base64": "<png base64>",
          "image_mime": "image/png",
          "style": "modern",
          "model": "gemini-2.5-flash-image",
          "prompt": "<the full prompt that was sent>"
        }

    Raises StagingError on any failure (no API key, bad response, no image
    in response).
    """
    if not GEMINI_API_KEY:
        raise StagingError("GEMINI_API_KEY is not configured", status=500)
    if not image_bytes:
        raise StagingError("No image bytes provided", status=400)

    prompt = _resolve_prompt(style, room_type, hint)

    cache_key = _cache_key(image_bytes, style or "", room_type or "", hint or "")
    cached = _cache_get(cache_key)
    if cached is not None:
        _logger.info("Staging cache HIT (%s…)", cache_key[:12])
        return {**cached, "cached": True}

    b64_image = base64.b64encode(image_bytes).decode("ascii")

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": mime_type or "image/jpeg",
                            "data": b64_image,
                        }
                    },
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.7,
            "responseModalities": ["IMAGE", "TEXT"],
        },
    }

    url = f"{GEMINI_BASE_URL}/models/{GEMINI_IMAGE_MODEL}:generateContent"
    try:
        resp = requests.post(
            url,
            params={"key": GEMINI_API_KEY},
            json=payload,
            timeout=120,
        )
    except requests.RequestException as exc:
        raise StagingError(f"Network error talking to Gemini: {exc}") from exc

    if resp.status_code != 200:
        _logger.error("Gemini API non-200: %s — %s", resp.status_code, resp.text[:500])
        if resp.status_code == 429:
            retry_after = _extract_retry_after(resp)
            wait_msg = f"about {retry_after} seconds" if retry_after else "a minute"
            raise StagingError(
                f"Gemini's free tier rate limit reached. Try again in {wait_msg}, "
                f"or enable billing on Google AI Studio for higher per-minute limits.",
                status=429,
                retry_after=retry_after,
            )
        if resp.status_code in (401, 403):
            raise StagingError("Gemini rejected the API key (auth error). Check GEMINI_API_KEY.", status=502)
        raise StagingError(f"Gemini API returned HTTP {resp.status_code}", status=502)

    body = resp.json()
    candidates = body.get("candidates") or []
    if not candidates:
        raise StagingError("Gemini returned no candidates")

    parts = (candidates[0].get("content") or {}).get("parts") or []
    image_b64 = None
    image_mime = "image/png"
    text_caption = None
    for part in parts:
        inline = part.get("inlineData") or part.get("inline_data")
        if inline and inline.get("data"):
            image_b64 = inline["data"]
            image_mime = inline.get("mimeType") or inline.get("mime_type") or "image/png"
        elif part.get("text"):
            text_caption = part["text"]

    if not image_b64:
        raise StagingError("Gemini response did not include an image", status=502)

    result = {
        "image_base64": image_b64,
        "image_mime": image_mime,
        "style": (style or DEFAULT_STYLE).lower(),
        "room_type": (room_type or "").lower().strip(),
        "model": GEMINI_IMAGE_MODEL,
        "prompt": prompt,
        "caption": text_caption,
        "cached": False,
    }
    _cache_put(cache_key, result)
    return result


def _extract_retry_after(resp: requests.Response) -> Optional[int]:
    """Pull a retry-delay (seconds) out of a Gemini 429 response if present."""
    header = resp.headers.get("Retry-After")
    if header and header.strip().isdigit():
        return int(header.strip())
    try:
        body = resp.json() or {}
        details = (body.get("error") or {}).get("details") or []
        for entry in details:
            delay = entry.get("retryDelay") or entry.get("retry_delay")
            if not delay:
                continue
            match = re.match(r"^(\d+(?:\.\d+)?)s$", str(delay).strip())
            if match:
                return int(float(match.group(1)))
    except (ValueError, KeyError, AttributeError):
        pass
    return None
