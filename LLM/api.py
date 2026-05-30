import math
from flask import Flask, request, jsonify
from flask_cors import CORS

def sanitize_nans(obj):
    """Recursively replace NaN values with None for JSON compliance."""
    if isinstance(obj, dict):
        return {k: sanitize_nans(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_nans(x) for x in obj]
    elif isinstance(obj, float) and math.isnan(obj):
        return None
    return obj

app = Flask(__name__)
CORS(app)
import sys
import os
from dotenv import load_dotenv

# Load .env file from LLM folder first, then root
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Add parent directory to path to import LLM modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agent.core import process_message, process_vastu
from vastu_score import analyse_vastu_score
from data.loader import load_product_catalog
from utils.formatters import format_product_summary
from staging import (
    stage_room,
    StagingError,
    _resolve_flux_prompt,
    FAL_API_KEY,
    DEFAULT_STYLE,
)
from vastu_overlay import generate_vastu_overlay, OverlayError
import base64 as _base64
import requests as _requests

# Load catalog lazily to prevent startup timeouts
_catalog = None

def get_catalog():
    global _catalog
    if _catalog is None:
        print("[LLM] Loading catalog...")
        _catalog = load_product_catalog()
        print(f"[LLM] Catalog loaded: {len(_catalog)} products.")
    return _catalog

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "catalog_loaded": _catalog is not None})

@app.route('/ping', methods=['GET'])
def ping():
    return "pong"

@app.route('/api/chat', methods=['POST'])
@app.route('/api/chat/consultant', methods=['POST'])
def chat():
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"error": "Invalid or missing JSON body"}), 400
    message = data.get('message')
    if not message:
        return jsonify({"error": "No message provided"}), 400
    print(f"[CHAT] Received message: {str(message)[:50]}...")
    try:
        response = process_message(message, get_catalog())
        return jsonify(sanitize_nans(response))
    except Exception as e:
        print(f"[CHAT] Error: {e}")
        return jsonify({"error": "An internal error occurred"}), 500

@app.route('/api/vastu', methods=['POST'])
def vastu():
    # Handle both JSON and Multipart/Form-Data
    if request.is_json:
        data = request.get_json(silent=True)
        if data is None:
            return jsonify({"error": "Invalid or missing JSON body"}), 400
        room_type = data.get('roomType')
        description = data.get('description')
        image_data = None
        mime_type = "image/jpeg"
        print(f"[VASTU] Received JSON request: {room_type}")
    else:
        room_type = request.form.get('roomType')
        description = request.form.get('description')
        image_file = request.files.get('image')
        if image_file:
            print(f"[VASTU] Received image file: {image_file.filename} ({image_file.content_type})")
            image_data = image_file.read()
            mime_type = image_file.content_type
        else:
            print("[VASTU] No image file received in multipart request")
            image_data = None
            mime_type = "image/jpeg"
    
    if not room_type or not description:
        return jsonify({"error": "roomType and description are required"}), 400
    
    try:
        print(f"[VASTU] Processing {room_type} with description: {description[:50]}...")
        response = process_vastu(room_type, description, image_data, mime_type)
        return jsonify(sanitize_nans(response))
    except Exception as e:
        print(f"[VASTU] Error: {e}")
        return jsonify({"error": "An internal error occurred"}), 500


@app.route('/api/vastu/analyse', methods=['POST'])
def vastu_score_analyse():
    room_type = request.form.get('room_type')
    facing_direction = request.form.get('facing_direction')
    floor = request.form.get('floor', '')
    images = request.files.getlist('images')

    if not room_type or not facing_direction:
        return jsonify({"message": "room_type and facing_direction are required"}), 400

    if not images or len(images) == 0 or len(images) > 3:
        return jsonify({"message": "Please upload between 1 and 3 images."}), 400

    try:
        image_bytes = []
        for img in images:
            data = img.read()
            if not data:
                return jsonify({"message": "One of the uploaded images is empty."}), 400
            image_bytes.append(data)

        result = analyse_vastu_score(room_type, facing_direction, floor, image_bytes)
        if result.get("error"):
            # User-correctable errors map to 422 to help frontend show upload retry state.
            return jsonify(result), 422
        return jsonify(sanitize_nans(result)), 200
    except Exception as e:
        print(f"[VASTU_SCORE] Error: {e}")
        return jsonify({"message": "Taking a bit longer than usual. Please try again."}), 503

@app.route('/api/stage', methods=['POST'])
def stage():
    """
    AI room staging via Gemini 2.5 Flash Image.

    Multipart form:
        image      (file)   — required, the room photo (jpg/png/webp)
        style      (text)   — optional: modern | minimal | contemporary | classic | ethnic | functional
        roomType   (text)   — optional: bedroom, living_room, dining_room, etc.
        hint       (text)   — optional: free-text buyer notes (≤400 chars)
    """
    image_file = request.files.get('image')
    if not image_file:
        return jsonify({"error": "image file is required"}), 400

    image_bytes = image_file.read()
    if not image_bytes:
        return jsonify({"error": "uploaded image is empty"}), 400
    if len(image_bytes) > 12 * 1024 * 1024:  # 12 MB safety cap
        return jsonify({"error": "image is too large (max 12 MB)"}), 413

    mime_type = image_file.content_type or "image/jpeg"
    style = request.form.get('style')
    room_type = request.form.get('roomType') or request.form.get('room_type')
    hint = request.form.get('hint') or request.form.get('notes')

    print(f"[STAGE] {image_file.filename} ({len(image_bytes)} bytes, {mime_type}) "
          f"style={style!r} room={room_type!r}")

    try:
        result = stage_room(
            image_bytes=image_bytes,
            mime_type=mime_type,
            style=style,
            room_type=room_type,
            hint=hint,
        )
        return jsonify(result), 200
    except StagingError as exc:
        status = getattr(exc, "status", 502)
        retry_after = getattr(exc, "retry_after", None)
        print(f"[STAGE] StagingError ({status}): {exc}")
        payload = {"error": str(exc)}
        if retry_after is not None:
            payload["retry_after"] = retry_after
        response = jsonify(payload)
        if retry_after is not None:
            response.headers["Retry-After"] = str(retry_after)
        return response, status
    except Exception as exc:
        print(f"[STAGE] Unexpected: {exc}")
        return jsonify({"error": "Internal staging failure"}), 500


@app.route('/api/vastu/overlay', methods=['POST'])
def vastu_overlay():
    """
    Vastu HUD overlay analysis.

    Multipart form:
        image    (file)   — required, the room photo
        roomType (text)   — optional, default 'bedroom'
        facing   (text)   — optional, default 'N' (N|NE|E|SE|S|SW|W|NW)
    """
    image_file = request.files.get('image')
    if not image_file:
        return jsonify({"error": "image file is required"}), 400
    image_bytes = image_file.read()
    if not image_bytes:
        return jsonify({"error": "uploaded image is empty"}), 400
    if len(image_bytes) > 12 * 1024 * 1024:
        return jsonify({"error": "image too large (max 12 MB)"}), 413

    room_type = (request.form.get('roomType') or request.form.get('room_type') or 'bedroom').strip()
    facing = (request.form.get('facing') or 'N').strip().upper()

    print(f"[OVERLAY] {image_file.filename} ({len(image_bytes)} bytes) "
          f"room={room_type!r} facing={facing!r}")

    try:
        result = generate_vastu_overlay(image_bytes, room_type=room_type, facing=facing)
        return jsonify(result), 200
    except OverlayError as exc:
        return jsonify({"error": str(exc)}), getattr(exc, 'status', 502)
    except Exception as exc:
        print(f"[OVERLAY] Unexpected: {exc}")
        return jsonify({"error": "Internal overlay failure"}), 500


@app.route('/api/stage/from-prompt', methods=['POST'])
def stage_from_prompt():
    """
    Text-to-image staging for pre-possession buyers (no source photo).

    The buyer has only a floor plan, not a unit photo. We synthesise a room
    from the style + room-type prompt using fal.ai FLUX.1-dev text-to-image,
    and return the same response shape as /api/stage so the journey UI can
    treat both paths identically.

    JSON body:
        style    (str)  — modern | minimal | contemporary | classic | ethnic | functional
        roomType (str)  — living_room | bedroom | kitchen | pooja_room | dining_room | ...
        hint     (str)  — optional free-text buyer brief (≤300 chars)
    """
    data = request.get_json(silent=True) or {}
    style = (data.get('style') or DEFAULT_STYLE).lower().strip()
    room_type = (data.get('roomType') or data.get('room_type') or '').lower().strip()
    hint = data.get('hint') or data.get('notes')

    if not FAL_API_KEY:
        return jsonify({"error": "Text-to-image staging requires FAL_API_KEY"}), 500

    prompt = _resolve_flux_prompt(style, room_type, hint, vision_description=None)
    print(f"[STAGE-T2I] style={style!r} room={room_type!r} prompt_len={len(prompt)}")

    fal_model = "fal-ai/flux/dev"
    payload = {
        "prompt": prompt,
        "image_size": "landscape_4_3",
        "num_inference_steps": 28,
        "guidance_scale": 3.5,
        "num_images": 1,
        "enable_safety_checker": False,
    }
    headers = {
        "Authorization": f"Key {FAL_API_KEY}",
        "Content-Type": "application/json",
    }
    try:
        resp = _requests.post(
            f"https://fal.run/{fal_model}",
            headers=headers,
            json=payload,
            timeout=180,
        )
    except _requests.RequestException as exc:
        print(f"[STAGE-T2I] network error: {exc}")
        return jsonify({"error": f"fal.ai network error: {exc}"}), 502

    if resp.status_code != 200:
        print(f"[STAGE-T2I] fal.ai non-200: {resp.status_code} — {resp.text[:300]}")
        return jsonify({"error": f"fal.ai returned HTTP {resp.status_code}"}), 502

    try:
        body = resp.json() or {}
    except ValueError:
        return jsonify({"error": "fal.ai returned non-JSON body"}), 502

    images = body.get("images") or []
    if not images or not images[0].get("url"):
        return jsonify({"error": "fal.ai returned no image"}), 502

    img_url = images[0]["url"]
    try:
        img_resp = _requests.get(img_url, timeout=60)
        if img_resp.status_code != 200:
            return jsonify({"error": "Failed to fetch generated image"}), 502
        raw_bytes = img_resp.content
    except _requests.RequestException as exc:
        return jsonify({"error": f"Image fetch failed: {exc}"}), 502

    image_b64 = _base64.b64encode(raw_bytes).decode("ascii")
    result = {
        "image_base64": image_b64,
        "image_mime": "image/jpeg",
        "style": style,
        "room_type": room_type,
        "model": fal_model,
        "pipeline": "fal-flux-dev-t2i",
        "prompt": prompt,
        "vision_description": None,
        "caption": None,
        "cached": False,
    }
    return jsonify(result), 200


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"[LLM] Starting service on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
