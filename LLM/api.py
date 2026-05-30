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
from staging import stage_room, StagingError
from vastu_overlay import generate_vastu_overlay, OverlayError

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


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"[LLM] Starting service on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
