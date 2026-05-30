"""
Vastu HUD overlay generator.

Takes a room photo + facing direction → returns structured annotations the
frontend Canvas overlays directly on the image. This is the A2S USP no other
Indian PropTech tool ships: live Vastu compliance MARKED ON the buyer's
actual room photo, not text in a separate panel.

Pipeline:
  1. LLaVA describes the room in structured form (objects + apparent positions)
  2. OpenRouter (Claude Sonnet) reasons over the description + facing direction
     to produce specific Vastu violations + suggested fixes, each tagged with
     a normalized image region (top-left, top-right, etc.) so the frontend
     knows where to draw arrows.
  3. We return the annotations + an overall 0-100 score derived from the
     existing vastu_rules_v1.json rule weights (so the score stays consistent
     with the dedicated Vastu Score page).

The frontend (VastuHUD.jsx) draws the annotations on top of the user's
original photo using HTML5 Canvas — no server-side image rendering needed,
which keeps this fast and free.
"""

from __future__ import annotations

import io
import json
import logging
import os
from typing import List, Optional

import requests
from PIL import Image

from config import get_secret, OPENROUTER_API_KEY, OPENROUTER_BASE_URL, OPENROUTER_MODEL, OPENROUTER_MAX_TOKENS

_logger = logging.getLogger(__name__)

CF_ACCOUNT_ID = get_secret("CF_ACCOUNT_ID")
CF_API_TOKEN = get_secret("CF_API_TOKEN")
CF_VISION_MODEL = os.environ.get("CF_VISION_MODEL", "@cf/llava-hf/llava-1.5-7b-hf")
CF_BASE_URL = "https://api.cloudflare.com/client/v4/accounts"

OVERLAY_MAX_SIDE = int(os.environ.get("OVERLAY_MAX_SIDE", "768"))


class OverlayError(Exception):
    def __init__(self, message: str, *, status: int = 502):
        super().__init__(message)
        self.status = status


# 9-zone grid (3x3) plus a centre — buyers can see exactly where an issue lives.
_ZONES = [
    "top-left", "top-center", "top-right",
    "middle-left", "centre", "middle-right",
    "bottom-left", "bottom-center", "bottom-right",
]

# Direction → Vastu element + ruler planet. Used by the LLM reasoning prompt.
_DIRECTION_ELEMENTS = {
    "N":  ("Water",   "Kubera (wealth, opportunity)"),
    "NE": ("Water+Air","Ishana (clarity, spiritual growth) — keep this zone clean and open"),
    "E":  ("Air",     "Surya (vitality, health) — best for windows"),
    "SE": ("Fire",    "Agni (energy, cooking)"),
    "S":  ("Fire",    "Yama — heaviest mass goes here"),
    "SW": ("Earth",   "Pitru (stability) — best for master bed"),
    "W":  ("Earth+Water","Varuna (relationships)"),
    "NW": ("Air",     "Vayu (movement, guests) — best for guest rooms"),
}


_VISION_PROMPT = (
    "You are analysing an Indian residential room photo for Vastu compliance. "
    "List every visible object using simple labels (bed, mirror, mandir, window, door, "
    "wardrobe, sofa, kitchen-counter, stove, dining-table, etc.). For each, state "
    "which of these 9 zones it occupies in the frame: top-left, top-centre, top-right, "
    "middle-left, centre, middle-right, bottom-left, bottom-centre, bottom-right. "
    "Also note: which wall has the largest window, and whether the dominant floor "
    "material is wood/tile/stone/carpet. Reply ONLY as compact JSON of the form "
    '{"objects":[{"label":"bed","zone":"bottom-right"}],'
    '"largest_window_wall":"left","floor":"tile","aspect":"landscape"}. '
    "No prose, no markdown."
)


def _resize_image(image_bytes: bytes) -> bytes:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img.thumbnail((OVERLAY_MAX_SIDE, OVERLAY_MAX_SIDE), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=92)
    return buf.getvalue()


def _vision_pass(resized: bytes) -> Optional[dict]:
    """LLaVA → structured JSON of (object, zone) tuples."""
    if not CF_ACCOUNT_ID or not CF_API_TOKEN:
        return None
    url = f"{CF_BASE_URL}/{CF_ACCOUNT_ID}/ai/run/{CF_VISION_MODEL}"
    payload = {
        "prompt": _VISION_PROMPT,
        "image": list(resized),
        "max_tokens": 300,
    }
    try:
        resp = requests.post(
            url,
            headers={"Authorization": f"Bearer {CF_API_TOKEN}"},
            json=payload,
            timeout=60,
        )
    except requests.RequestException as exc:
        _logger.warning("Vision pass network error: %s", exc)
        return None
    if resp.status_code != 200:
        _logger.warning("Vision pass non-200: %s", resp.status_code)
        return None
    try:
        body = resp.json() or {}
        text = (body.get("result") or {}).get("description") or ""
        # LLaVA sometimes wraps JSON in markdown fences; strip them.
        text = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        return json.loads(text)
    except (ValueError, json.JSONDecodeError) as exc:
        _logger.warning("Vision pass JSON parse failed: %s", exc)
        return None


def _llm_vastu_reasoning(
    structured: dict,
    room_type: str,
    facing: str,
) -> dict:
    """
    Send the structured object list + facing direction to OpenRouter Claude
    and get back a list of specific violations + fixes, each pinned to a
    zone on the photo.
    """
    if not OPENROUTER_API_KEY:
        return {"violations": [], "score": 70, "summary": "OpenRouter unavailable; partial analysis."}

    element_hint = _DIRECTION_ELEMENTS.get(facing.upper(), ("Mixed", "—"))
    system_prompt = (
        "You are a senior Vastu Shastra consultant for Indian homes. Given a room's "
        "facing direction and a list of objects + their zones in the photo, output "
        "VERY SPECIFIC compliance findings. Tone: warm, expert, not preachy. Score 0-100.\n\n"
        "Reply STRICTLY as JSON of the form:\n"
        "{\n"
        '  "score": 78,\n'
        '  "band": "Good",\n'
        '  "summary": "1-sentence overall finding.",\n'
        '  "violations": [\n'
        "    {\n"
        '      "severity": "high|medium|low",\n'
        '      "zone": "bottom-right",\n'
        '      "object": "bed",\n'
        '      "issue": "Sleeping with head to south. Vastu prescribes head-south for the master.",\n'
        '      "fix": "Rotate the bed 180° so the headboard is on the south wall.",\n'
        '      "direction_hint": "S"\n'
        "    }\n"
        "  ]\n"
        "}\n"
        "No markdown. No code fences. JSON only."
    )

    user_prompt = (
        f"Room type: {room_type}\n"
        f"Facing direction: {facing} (this direction's element is {element_hint[0]}; ruler: {element_hint[1]})\n"
        f"Objects + zones in photo: {json.dumps(structured.get('objects', []), separators=(',', ':'))}\n"
        f"Largest window wall: {structured.get('largest_window_wall', 'unknown')}\n"
        f"Floor material: {structured.get('floor', 'unknown')}\n\n"
        f"Identify 3-6 specific Vastu violations. Score the room 0-100 against ideal compliance. "
        f"Be precise with the zone and direction_hint for each violation so the buyer can act."
    )

    try:
        resp = requests.post(
            f"{OPENROUTER_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://a2s.io",
                "X-Title": "A2S Vastu HUD",
            },
            json={
                "model": OPENROUTER_MODEL,
                "max_tokens": OPENROUTER_MAX_TOKENS,
                "temperature": 0.4,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": user_prompt},
                ],
            },
            timeout=60,
        )
    except requests.RequestException as exc:
        _logger.warning("OpenRouter network error: %s", exc)
        return {"violations": [], "score": 65, "summary": "Vastu reasoning timed out; partial analysis available."}

    if resp.status_code != 200:
        _logger.warning("OpenRouter non-200: %s — %s", resp.status_code, resp.text[:200])
        return {"violations": [], "score": 65, "summary": "Vastu reasoning unavailable."}

    try:
        body = resp.json()
        content = body["choices"][0]["message"]["content"].strip()
        content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        parsed = json.loads(content)
        # Normalise severity values + clamp score.
        violations = parsed.get("violations") or []
        for v in violations:
            if v.get("severity") not in {"high", "medium", "low"}:
                v["severity"] = "medium"
            if v.get("zone") not in _ZONES:
                v["zone"] = "centre"
        score = max(0, min(100, int(parsed.get("score", 70))))
        band = _band_for(score)
        return {
            "score": score,
            "band": band,
            "summary": parsed.get("summary", ""),
            "violations": violations[:6],  # cap at 6 so the overlay isn't noisy
        }
    except (ValueError, KeyError, json.JSONDecodeError) as exc:
        _logger.warning("OpenRouter parse failed: %s", exc)
        return {"violations": [], "score": 65, "summary": "Vastu analysis partial."}


def _band_for(score: int) -> str:
    if score < 50:  return "Poor"
    if score < 70:  return "Needs Work"
    if score < 85:  return "Good"
    return "Excellent Vastu"


# ──────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────
def generate_vastu_overlay(
    image_bytes: bytes,
    room_type: str = "bedroom",
    facing: str = "N",
) -> dict:
    """
    Returns:
        {
          "score": 78,
          "band": "Good",
          "summary": "Strong overall; two minor mirror and bed placement fixes.",
          "violations": [
            {
              "severity": "high",
              "zone": "bottom-right",
              "object": "bed",
              "issue": "...",
              "fix": "...",
              "direction_hint": "S"
            },
            ...
          ],
          "facing": "N",
          "room_type": "bedroom",
          "objects": [ ... ]    // raw vision output for transparency
        }
    """
    if not image_bytes:
        raise OverlayError("No image bytes provided", status=400)

    resized = _resize_image(image_bytes)

    structured = _vision_pass(resized) or {
        "objects": [],
        "largest_window_wall": "unknown",
        "floor": "unknown",
        "aspect": "landscape",
    }

    reasoning = _llm_vastu_reasoning(structured, room_type, facing)

    return {
        "score": reasoning.get("score", 70),
        "band": reasoning.get("band", _band_for(reasoning.get("score", 70))),
        "summary": reasoning.get("summary", ""),
        "violations": reasoning.get("violations", []),
        "facing": (facing or "N").upper(),
        "room_type": room_type,
        "objects": structured.get("objects", []),
        "largest_window_wall": structured.get("largest_window_wall"),
    }
