import hashlib
import io
import json
import os
import base64
import re
from dataclasses import dataclass
from typing import Dict, List, Tuple

from PIL import Image, ImageFilter, ImageStat

from config import OPENROUTER_MODEL, OPENROUTER_MAX_TOKENS
from openrouter_client import get_client

try:
    from ultralytics import YOLO  # type: ignore
except Exception:  # pragma: no cover
    YOLO = None


CONFIDENCE_THRESHOLD = float(os.getenv("VASTU_YOLO_CONF", "0.45"))
AUTO_DIRECTION_MIN_CONFIDENCE = float(os.getenv("VASTU_AUTO_MIN_CONFIDENCE", "0.55"))
AUTO_DIRECTION_TARGET_ACCURACY = float(os.getenv("VASTU_AUTO_TARGET_ACCURACY", "0.87"))
MAX_SIDE = 1024
MAX_BYTES = 2 * 1024 * 1024
ROOM_LABELS = {
    "living room": "living room",
    "bedroom": "bedroom",
    "kitchen": "kitchen",
    "pooja room": "pooja room",
    "study": "study",
    "study room": "study",
    "home office": "study",
}

ZONE_PROFILES = {
    "N": {"element": "Water", "focus": "career movement and opportunities"},
    "NE": {"element": "Water-Ether", "focus": "clarity, prayer, and spiritual alignment"},
    "E": {"element": "Air", "focus": "social harmony and vitality"},
    "SE": {"element": "Fire", "focus": "drive, energy output, and controlled ambition"},
    "S": {"element": "Fire-Earth", "focus": "stability through discipline and structure"},
    "SW": {"element": "Earth", "focus": "grounding, authority, and long-term security"},
    "W": {"element": "Air-Water", "focus": "relationships and emotional processing"},
    "NW": {"element": "Air", "focus": "movement, transitions, and communication"},
    "Center": {"element": "Ether", "focus": "overall balance and energetic circulation"},
}

CATEGORY_INTENT = {
    "furniture": "spatial anchoring and load balance",
    "entry": "incoming energy and first impressions",
    "light": "clarity, optimism, and circadian harmony",
    "elements": "fire-water element harmony",
    "decor": "subtle emotional tone and flow",
}

CATEGORY_ASTRO_BASIS = {
    "furniture": "Anchoring of heavy objects influences prana circulation and Brahmasthan stability.",
    "entry": "Main threshold governs energy intake (pravesh shakti) and daily opportunity flow.",
    "light": "Sunlight and illumination quality influence Agni tattva and mental clarity.",
    "elements": "Balance of Pancha Mahabhuta (earth, water, fire, air, ether) prevents elemental dosha.",
    "decor": "Color, texture, and symbolic objects influence rasa (emotional field) and sattva quality.",
}

CATEGORY_RISK_EXPOSURE = {
    "furniture": "stagnation, fatigue, and recurring friction due to blocked movement corridors",
    "entry": "missed opportunities, visitor discomfort, and weak financial inflow impression",
    "light": "low motivation, irregular routines, and reduced cognitive freshness",
    "elements": "emotional volatility, sleep disturbance, and decision inconsistency",
    "decor": "subtle stress buildup, restlessness, and low emotional comfort in the room",
}

CATEGORY_PLACEMENT_PLAYBOOK = {
    "entry": {
        "what": "entry anchor + soft light + clean threshold",
        "where": "at the room entry edge, with clear 2-3 ft movement path",
        "how": "keep entry zone clutter-free, add a warm light source, and define threshold with rug/console",
    },
    "furniture": {
        "what": "heavy seating and storage mass",
        "where": "toward stable wall-backed zones; avoid floating all heavy pieces in circulation paths",
        "how": "push primary sofa to a stable wall plane and maintain uninterrupted movement channels",
    },
    "light": {
        "what": "layered lighting (ambient + task + accent)",
        "where": "ambient overhead center, task lighting in dim corners, accent near artwork/plants",
        "how": "remove harsh hotspots and dark pockets; keep evening light warm and balanced",
    },
    "elements": {
        "what": "element-balancing objects (wood, metal, water, earth textures)",
        "where": "distribute across room quadrants instead of clustering in one corner",
        "how": "add missing element cues gradually so no single element dominates the room mood",
    },
    "decor": {
        "what": "calming focal decor and wall rhythm",
        "where": "main visual axis and blank wall pockets with visual imbalance",
        "how": "reduce visual clutter, create one dominant focal wall, and keep color temperature coherent",
    },
}


@dataclass
class Detection:
    label: str
    confidence: float
    bbox: Tuple[float, float, float, float]
    zone: str


_rules_cache = None
_model = None


def _load_rules() -> Dict:
    global _rules_cache
    if _rules_cache is None:
        rules_path = os.path.join(os.path.dirname(__file__), "data", "vastu_rules_v1.json")
        with open(rules_path, "r", encoding="utf-8") as f:
            _rules_cache = json.load(f)
    return _rules_cache


def _load_model():
    global _model
    if _model is None and YOLO is not None:
        model_name = os.getenv("VASTU_YOLO_MODEL", "yolov8n.pt")
        _model = YOLO(model_name)
    return _model


def _normalize_room_type(room_type: str) -> str:
    return ROOM_LABELS.get((room_type or "").strip().lower(), (room_type or "other").strip().lower())


def _normalize_direction(direction: str) -> str:
    norm = (direction or "N").strip().upper()
    if norm in {"AUTO", "AUTODETECT", "AUTO DETECT"}:
        return "AUTO"
    if norm in {"N", "S", "E", "W", "NE", "NW", "SE", "SW"}:
        return norm
    return "N"


def _infer_direction_from_images(processed_images: List[Tuple[bytes, int, int]]) -> Dict[str, object]:
    if not processed_images:
        return {
            "direction": "N",
            "confidence": 0.0,
            "method": "fallback-default",
            "reasoning": "No image data was available for direction inference.",
        }

    aggregate = {"N": 0.0, "S": 0.0, "E": 0.0, "W": 0.0}
    quality_scores: List[float] = []
    for image_bytes, _, _ in processed_images:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((256, 256), Image.Resampling.LANCZOS)
        grayscale = image.convert("L")
        pixels = grayscale.load()
        stats = ImageStat.Stat(grayscale)
        std = float(stats.stddev[0]) / 64.0
        edge_map = grayscale.filter(ImageFilter.FIND_EDGES)
        edge_stats = ImageStat.Stat(edge_map)
        edge_density = float(edge_stats.mean[0]) / 255.0
        detail_score = max(0.0, min(1.0, 0.65 * edge_density + 0.35 * min(1.0, std)))
        quality_scores.append(detail_score)

        strip = 32
        aggregate["N"] += sum(pixels[x, y] for x in range(256) for y in range(strip)) / (256 * strip)
        aggregate["S"] += sum(pixels[x, y] for x in range(256) for y in range(256 - strip, 256)) / (256 * strip)
        aggregate["W"] += sum(pixels[x, y] for x in range(strip) for y in range(256)) / (256 * strip)
        aggregate["E"] += sum(pixels[x, y] for x in range(256 - strip, 256) for y in range(256)) / (256 * strip)

    image_count = float(len(processed_images))
    scores = {direction: value / image_count for direction, value in aggregate.items()}
    ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    inferred = ranked[0][0]

    confidence = 0.0
    if len(ranked) > 1 and ranked[0][1] > 0:
        spread = max(0.0, min(1.0, (ranked[0][1] - ranked[1][1]) / max(ranked[0][1], 1e-6)))
        quality = sum(quality_scores) / max(len(quality_scores), 1)
        confidence = max(0.25, min(0.95, (0.45 * spread) + (0.55 * quality)))

    reasoning = (
        f"Direction inferred from average edge brightness across {len(processed_images)} image(s); "
        f"the {inferred} edge was brightest."
    )

    return {
        "direction": inferred,
        "confidence": round(confidence, 3),
        "method": "edge-brightness-average",
        "reasoning": reasoning,
    }


def _infer_direction_from_exif(image_bytes: bytes) -> Dict[str, object]:
    try:
        image = Image.open(io.BytesIO(image_bytes))
        exif = image.getexif()
        if not exif:
            return {"direction": "", "confidence": 0.0, "method": "exif", "reasoning": "No EXIF metadata found."}

        gps_info = exif.get(34853)
        if not gps_info:
            return {"direction": "", "confidence": 0.0, "method": "exif", "reasoning": "No GPS heading metadata in EXIF."}

        heading = gps_info.get(17) if isinstance(gps_info, dict) else None
        if heading is None:
            return {"direction": "", "confidence": 0.0, "method": "exif", "reasoning": "No GPS image direction field found."}

        if isinstance(heading, tuple) and len(heading) == 2 and heading[1] != 0:
            deg = float(heading[0]) / float(heading[1])
        else:
            deg = float(heading)

        deg = deg % 360.0
        directions = [
            ("N", 337.5, 360.0),
            ("N", 0.0, 22.5),
            ("NE", 22.5, 67.5),
            ("E", 67.5, 112.5),
            ("SE", 112.5, 157.5),
            ("S", 157.5, 202.5),
            ("SW", 202.5, 247.5),
            ("W", 247.5, 292.5),
            ("NW", 292.5, 337.5),
        ]

        direction = "N"
        for label, start, end in directions:
            if start <= deg < end:
                direction = label
                break

        return {
            "direction": direction,
            "confidence": 0.92,
            "method": "exif-heading",
            "reasoning": f"Camera EXIF heading detected at {deg:.1f} degrees.",
        }
    except Exception:
        return {"direction": "", "confidence": 0.0, "method": "exif", "reasoning": "EXIF heading parse failed."}


def _parse_nim_json(raw_text: str) -> Dict[str, object]:
    if not raw_text:
        return {}
    text = raw_text.strip()
    try:
        return json.loads(text)
    except Exception:
        pass

    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        return {}
    try:
        return json.loads(match.group(0))
    except Exception:
        return {}


def _infer_direction_with_nim(processed_images: List[Tuple[bytes, int, int]]) -> Dict[str, object]:
    """
    Vision-based direction inference. Routes through OpenRouter — function name
    kept as `_with_nim` for call-site stability; the upstream model is whatever
    OPENROUTER_MODEL points at (default: anthropic/claude-sonnet-4.5).
    """
    client = get_client()
    if client is None:
        return {"direction": "", "confidence": 0.0, "method": "openrouter", "reasoning": "OpenRouter not configured."}

    votes: Dict[str, float] = {"N": 0.0, "S": 0.0, "E": 0.0, "W": 0.0, "NE": 0.0, "NW": 0.0, "SE": 0.0, "SW": 0.0}
    reasoning_bits: List[str] = []
    used = 0

    for image_bytes, _, _ in processed_images[:2]:
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        prompt = (
            "You are a Vastu direction estimator. Infer camera-facing direction as one of "
            "N,S,E,W,NE,NW,SE,SW from this room photo. Return strict JSON only with keys: "
            "direction, confidence, reasoning. Confidence must be 0 to 1."
        )

        try:
            resp = client.chat.completions.create(
                model=OPENROUTER_MODEL,
                temperature=0.1,
                max_tokens=OPENROUTER_MAX_TOKENS,
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
                        ],
                    }
                ],
                timeout=20,
            )

            text = ""
            if resp.choices:
                text = resp.choices[0].message.content or ""

            parsed = _parse_nim_json(text)
            direction = _normalize_direction(str(parsed.get("direction", "")))
            if direction == "AUTO":
                direction = ""
            confidence = float(parsed.get("confidence", 0.0) or 0.0)
            confidence = max(0.0, min(1.0, confidence))

            if direction:
                votes[direction] += confidence if confidence > 0 else 0.5
                used += 1
                reasoning_bits.append(str(parsed.get("reasoning", "vision inference")))
        except Exception:
            continue

    if used == 0:
        return {"direction": "", "confidence": 0.0, "method": "openrouter", "reasoning": "Vision inference unavailable."}

    ranked = sorted(votes.items(), key=lambda item: item[1], reverse=True)
    best_dir, best_score = ranked[0]
    total = sum(votes.values())
    confidence = 0.0 if total <= 0 else max(0.0, min(1.0, best_score / total))
    return {
        "direction": best_dir,
        "confidence": round(confidence, 3),
        "method": "openrouter-vision",
        "reasoning": "; ".join(reasoning_bits[:2]) or "OpenRouter vision direction inference.",
    }


def _infer_auto_direction(original_images: List[bytes], processed_images: List[Tuple[bytes, int, int]]) -> Dict[str, object]:
    nim_signal = _infer_direction_with_nim(processed_images)
    exif_signal = _infer_direction_from_exif(original_images[0]) if original_images else {
        "direction": "", "confidence": 0.0, "method": "exif", "reasoning": "No original image available."
    }
    cv_signal = _infer_direction_from_images(processed_images)

    image_quality = 0.0
    if processed_images:
        quality_components = []
        for image_bytes, _, _ in processed_images:
            image = Image.open(io.BytesIO(image_bytes)).convert("L")
            stats = ImageStat.Stat(image)
            mean = float(stats.mean[0]) / 255.0
            std = float(stats.stddev[0]) / 64.0
            quality_components.append(max(0.0, min(1.0, 0.55 * min(1.0, std) + 0.45 * (1.0 - abs(mean - 0.55)))))
        image_quality = sum(quality_components) / max(len(quality_components), 1)

    weighted_votes: Dict[str, float] = {"N": 0.0, "S": 0.0, "E": 0.0, "W": 0.0, "NE": 0.0, "NW": 0.0, "SE": 0.0, "SW": 0.0}
    signals = [
        (nim_signal, 0.65),
        (exif_signal, 0.25),
        (cv_signal, 0.10),
    ]

    for signal, weight in signals:
        direction = _normalize_direction(str(signal.get("direction", "")))
        if direction in {"", "AUTO"}:
            continue
        confidence = float(signal.get("confidence", 0.0) or 0.0)
        if confidence < 0.25 and direction != str(cv_signal.get("direction", "")):
            continue
        weighted_votes[direction] += weight * max(0.0, min(1.0, confidence))

    ranked = sorted(weighted_votes.items(), key=lambda item: item[1], reverse=True)
    if ranked[0][1] <= 0.0:
        return {
            "direction": "",
            "confidence": 0.0,
            "method": "ensemble",
            "reasoning": "Could not derive a stable direction from NIM/EXIF/CV signals.",
            "signals": {
                "nim": nim_signal,
                "exif": exif_signal,
                "cv": cv_signal,
            },
        }

    best_dir, best_weight = ranked[0]
    total_weight = sum(weighted_votes.values())
    confidence = 0.0 if total_weight <= 0 else max(0.0, min(1.0, best_weight / total_weight))

    if image_quality > 0:
        confidence = max(confidence, min(0.90, 0.45 + (0.35 * image_quality)))

    agreeing_signals = 0
    for signal, _weight in signals:
        signal_direction = _normalize_direction(str(signal.get("direction", "")))
        if signal_direction and signal_direction == best_dir:
            agreeing_signals += 1

    if agreeing_signals >= 2:
        confidence = min(0.96, confidence + 0.12)

    return {
        "direction": best_dir,
        "confidence": round(confidence, 3),
        "method": "ensemble-nim-exif-cv",
        "reasoning": "Combined direction inference from NIM vision, EXIF heading, and CV edge analysis.",
        "signals": {
            "nim": nim_signal,
            "exif": exif_signal,
            "cv": cv_signal,
        },
        "target_accuracy": AUTO_DIRECTION_TARGET_ACCURACY,
        "meets_confidence_gate": confidence >= AUTO_DIRECTION_MIN_CONFIDENCE,
        "image_quality": round(image_quality, 3),
    }


def _preprocess(image_bytes: bytes) -> Tuple[bytes, int, int]:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    width, height = image.size

    ratio = min(1.0, float(MAX_SIDE) / float(max(width, height)))
    if ratio < 1.0:
        image = image.resize((int(width * ratio), int(height * ratio)), Image.Resampling.LANCZOS)

    out = io.BytesIO()
    quality = 90
    while True:
        out.seek(0)
        out.truncate(0)
        image.save(out, format="JPEG", quality=quality, optimize=True)
        if out.tell() <= MAX_BYTES or quality <= 55:
            break
        quality -= 8

    final = out.getvalue()
    w, h = image.size
    return final, w, h


def _zone_for_centroid(cx: float, cy: float, width: int, height: int, facing: str) -> str:
    col = 0 if cx < width / 3 else 1 if cx < (2 * width) / 3 else 2
    row = 0 if cy < height / 3 else 1 if cy < (2 * height) / 3 else 2

    north_grid = [
        ["NW", "N", "NE"],
        ["W", "C", "E"],
        ["SW", "S", "SE"],
    ]

    rotate_steps = {
        "N": 0,
        "E": 1,
        "S": 2,
        "W": 3,
        "NE": 0,
        "SE": 1,
        "SW": 2,
        "NW": 3,
    }[facing]

    matrix = [r[:] for r in north_grid]
    for _ in range(rotate_steps):
        matrix = [list(row_vals) for row_vals in zip(*matrix[::-1])]

    zone = matrix[row][col]
    if zone == "C":
        return "Center"
    return zone


def _detect_objects(processed_images: List[Tuple[bytes, int, int]], facing: str) -> List[Detection]:
    model = _load_model()
    detections: List[Detection] = []

    if model is None:
        return detections

    for image_bytes, width, height in processed_images:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        results = model.predict(image, verbose=False)
        for result in results:
            names = result.names
            for box in result.boxes:
                conf = float(box.conf[0])
                if conf < CONFIDENCE_THRESHOLD:
                    continue
                cls_id = int(box.cls[0])
                label = names.get(cls_id, str(cls_id)).lower()
                x1, y1, x2, y2 = [float(v) for v in box.xyxy[0].tolist()]
                cx = (x1 + x2) / 2.0
                cy = (y1 + y2) / 2.0
                zone = _zone_for_centroid(cx, cy, width, height, facing)
                detections.append(Detection(label=label, confidence=conf, bbox=(x1, y1, x2, y2), zone=zone))

    return detections


def _evaluate(room_type: str, detections: List[Detection], facing: str) -> Dict:
    rules_doc = _load_rules()
    room_type_norm = _normalize_room_type(room_type)

    category_weights = rules_doc.get("category_weights", {
        "furniture": 0.30,
        "entry": 0.20,
        "light": 0.20,
        "elements": 0.15,
        "decor": 0.15,
    })

    applicable_rules = [
        r for r in rules_doc.get("rules", [])
        if room_type_norm in [rt.lower() for rt in r.get("room_types", [])]
    ]

    if not applicable_rules:
        return {
            "score": 0,
            "category_scores": {k: 0 for k in category_weights},
            "detected_objects": [],
            "suggestions": [],
            "summary": "No rules are configured for this room type yet.",
            "parameters_assessed": 0,
            "parameters_total": 0,
        }

    detections_by_label: Dict[str, List[Detection]] = {}
    for d in detections:
        detections_by_label.setdefault(d.label, []).append(d)

    score_acc = 0.0
    score_weight = 0.0
    category_acc = {k: 0.0 for k in category_weights}
    category_weight_acc = {k: 0.0 for k in category_weights}

    detected_objects = []
    suggestions = []
    assessed = 0
    pass_count = 0
    fail_count = 0
    partial_count = 0
    not_detected_count = 0

    for rule in applicable_rules:
        label = rule["label"].lower()
        matched = detections_by_label.get(label, [])
        category = rule.get("category", "furniture")
        weight = float(rule.get("weight", 1.0))

        status = "not_detected"
        value = 0.7
        confidence = 0.0
        zone = "not_detected"

        if matched:
            assessed += 1
            best = max(matched, key=lambda x: x.confidence)
            zone = best.zone
            confidence = best.confidence
            if zone in rule.get("correct_zones", []):
                status = "pass"
                value = 1.0
                pass_count += 1
            elif zone in rule.get("incorrect_zones", []):
                status = "fail"
                value = 0.0
                fail_count += 1
                suggestions.append({
                    "issue": rule.get("issue"),
                    "fix": rule.get("fix"),
                    "score_impact": int(rule.get("score_impact", 5)),
                    "catalog_filter": rule.get("catalog_filter"),
                })
            else:
                status = "partial"
                value = 0.5
                partial_count += 1
                suggestions.append({
                    "issue": rule.get("issue"),
                    "fix": rule.get("fix"),
                    "score_impact": int(max(2, int(rule.get("score_impact", 5)) // 2)),
                    "catalog_filter": rule.get("catalog_filter"),
                })
        else:
            not_detected_count += 1

        detected_objects.append({
            "label": label,
            "zone": zone,
            "vastu_status": status,
            "confidence": round(confidence, 3),
        })

        score_acc += value * weight
        score_weight += weight

        if category in category_acc:
            category_acc[category] += value * weight
            category_weight_acc[category] += weight

    final_score = int(round((score_acc / max(score_weight, 1e-6)) * 100))
    final_score = max(0, min(100, final_score))

    category_scores = {}
    for cat, pct_weight in category_weights.items():
        cat_raw = category_acc.get(cat, 0.0)
        cat_w = category_weight_acc.get(cat, 0.0)
        category_scores[cat] = int(round((cat_raw / max(cat_w, 1e-6)) * 100)) if cat_w > 0 else int(round(70 * pct_weight + 30))

    suggestions = sorted(suggestions, key=lambda s: s["score_impact"], reverse=True)[:5]

    parameters_total = len(applicable_rules)
    parameters_assessed = assessed

    if final_score <= 40:
        level = "Poor"
    elif final_score <= 65:
        level = "Needs Improvement"
    elif final_score <= 85:
        level = "Good"
    else:
        level = "Excellent Vastu"

    if parameters_assessed == 0:
        summary = (
            f"The current photos do not provide enough visible anchors for a reliable {room_type_norm} Vastu verdict. "
            "Please upload 2-3 brighter doorway or corner-angle images to unlock a precise zone-level assessment."
        )
        report_mode = "insufficient_evidence"
    else:
        summary = (
            f"Your {room_type_norm} currently scores {final_score}/100 and is rated {level}. "
            f"The strongest alignment is in zones where objects matched expected directions for {facing}. "
            f"Assessment covers {parameters_assessed} of {parameters_total} Vastu parameters based on your photos."
        )
        report_mode = "full"

    return {
        "score": final_score,
        "category_scores": category_scores,
        "detected_objects": detected_objects,
        "suggestions": suggestions,
        "summary": summary,
        "parameters_assessed": parameters_assessed,
        "parameters_total": parameters_total,
        "report_mode": report_mode,
        "diagnostics": {
            "pass": pass_count,
            "fail": fail_count,
            "partial": partial_count,
            "not_detected": not_detected_count,
        },
    }


def _build_detailed_report(result: Dict, room_type: str, facing: str, direction_meta: Dict[str, object], floor: str = "") -> Dict[str, object]:
    score = int(result.get("score", 0))
    category_scores = result.get("category_scores", {})
    suggestions = result.get("suggestions", [])
    diagnostics = result.get("diagnostics", {})
    parameters_assessed = int(result.get("parameters_assessed", 0))
    parameters_total = int(result.get("parameters_total", 0))

    profile = ZONE_PROFILES.get(facing, ZONE_PROFILES["N"])
    sorted_categories = sorted(category_scores.items(), key=lambda item: item[1], reverse=True)
    top_categories = sorted_categories[:2]
    weak_categories = sorted(category_scores.items(), key=lambda item: item[1])[:2]

    strong_lines = [
        (
            f"{name.replace('_', ' ').title()} shows relative strength at {value}/100, supporting "
            f"{CATEGORY_INTENT.get(name, 'overall alignment')} and healthy prana continuity."
        )
        for name, value in top_categories
    ]

    concern_lines = [
        (
            f"{name.replace('_', ' ').title()} is currently at {value}/100 and needs correction to avoid drift in "
            f"{CATEGORY_INTENT.get(name, 'directional balance')} and related dosha pressure."
        )
        for name, value in weak_categories
    ]

    scoring_basis = []
    for name, value in sorted_categories:
        band = "strong" if value >= 80 else "moderate" if value >= 60 else "weak"
        scoring_basis.append({
            "category": name,
            "score": int(value),
            "band": band,
            "why_it_matters": CATEGORY_ASTRO_BASIS.get(name, "General energetic harmony consideration."),
            "assessment_basis": (
                f"This category is evaluated by comparing classical Vastu zone logic, object placement, circulation flow, "
                f"and how strongly the visible layout supports the facing {facing} direction."
            ),
        })

    potential_risks = []
    for name, value in weak_categories:
        severity = "high" if value < 45 else "medium" if value < 65 else "low"
        potential_risks.append({
            "category": name,
            "severity": severity,
            "risk": CATEGORY_RISK_EXPOSURE.get(name, "minor energetic inconsistency"),
            "if_ignored": (
                f"If uncorrected for 6-12 weeks, {name.replace('_', ' ')} imbalance may amplify {CATEGORY_RISK_EXPOSURE.get(name, 'energetic instability')}."
            ),
        })

    placement_plan = []
    for idx, (name, value) in enumerate(weak_categories, start=1):
        playbook = CATEGORY_PLACEMENT_PLAYBOOK.get(name, {
            "what": "supporting corrective object set",
            "where": "underperforming visual zone",
            "how": "realign placement and rescan after stabilization",
        })
        placement_plan.append({
            "priority": idx,
            "category": name,
            "current_score": int(value),
            "what_to_place": playbook["what"],
            "where_to_place": playbook["where"],
            "placement_instruction": playbook["how"],
        })

    remedies = []
    for idx, suggestion in enumerate(suggestions[:5], start=1):
        timing = "within 48 hours" if idx <= 2 else "this week"
        remedies.append({
            "priority": idx,
            "title": suggestion.get("issue", "Directional adjustment recommended"),
            "action": suggestion.get("fix", "Make a zone correction and reassess."),
            "impact": int(suggestion.get("score_impact", 0)),
            "timing": timing,
            "astro_note": f"This supports {profile['element']} balance linked to {profile['focus']}.",
            "catalog_filter": suggestion.get("catalog_filter", ""),
        })

    correction_protocol = [
        {
            "step": 1,
            "title": "Direction Validation",
            "instruction": "Retake one doorway-wide photo in natural daylight to validate facing and reduce inference noise.",
        },
        {
            "step": 2,
            "title": "High-Impact Dosha Fixes",
            "instruction": "Resolve the top two weak categories first; these provide most of the score recovery.",
        },
        {
            "step": 3,
            "title": "Elemental Balancing",
            "instruction": "Balance water-fire-earth-air cues with lighting, materials, and decor placement by direction.",
        },
        {
            "step": 4,
            "title": "Stability Check",
            "instruction": "Rescan after 7 days to confirm score stabilization and reduced risk outlook.",
        },
    ]

    if score <= 40:
        tone = "critical reset"
    elif score <= 65:
        tone = "corrective phase"
    elif score <= 85:
        tone = "stabilization phase"
    else:
        tone = "high-alignment phase"

    direction_conf = int(round(float(direction_meta.get("confidence", 0.0)) * 100))
    direction_method = str(direction_meta.get("method", "unknown"))
    floor_label = floor or "unspecified floor"

    confidence_band = "high" if direction_conf >= 85 else "moderate" if direction_conf >= 60 else "low"

    consultation_intro = (
        f"Your {room_type.lower()} on {floor_label} is in a {tone}. In Vastu terms, the facing {facing} carries "
        f"{profile['element']} influence and is traditionally read for {profile['focus']}. The reading below is based "
        f"on directional balance, entry behavior, furniture mass, light flow, and visible stability cues."
    )

    confidence_note = (
        f"Direction confidence is {direction_conf}% using {direction_method.replace('-', ' ')}. "
        f"Assessed {parameters_assessed} out of {parameters_total} rule points with weighted category scoring."
    )

    directional_reasoning = [
        (
            f"Facing interpretation: {facing} direction with {profile['element']} dominance suggests emphasis on "
            f"{profile['focus']} in day-to-day room outcomes."
        ),
        (
            f"Confidence context: current directional confidence is {confidence_band} ({direction_conf}%). "
            f"This indicates how strongly the visible layout supports the inferred facing."
        ),
        (
            "Scoring method: category scores blend rule compliance, object-zone fit, and weighted impact on circulation, "
            "threshold behavior, and elemental balance."
        ),
    ]

    category_diagnostics = []
    for name, value in sorted_categories:
        state = "stable" if value >= 80 else "watch" if value >= 60 else "critical"
        category_diagnostics.append({
            "category": name,
            "score": int(value),
            "state": state,
            "expert_read": (
                f"{name.replace('_', ' ').title()} is in {state} range at {value}/100, linked to "
                f"{CATEGORY_INTENT.get(name, 'overall room coherence')}."
            ),
            "likely_manifestation": (
                f"In this state, the room may show {CATEGORY_RISK_EXPOSURE.get(name, 'minor energetic inconsistency')} if unchanged."
            ),
            "corrective_principle": (
                f"Primary correction principle: strengthen {name.replace('_', ' ')} alignment before secondary styling changes."
            ),
        })

    implementation_roadmap = [
        {
            "phase": "Phase 1 (Week 1)",
            "focus": "Anchor corrections",
            "details": "Resolve the two weakest categories first and stabilize traffic pathways and entry behavior.",
            "success_signal": "At least one weak category moves by +8 to +12 points on rescoring.",
        },
        {
            "phase": "Phase 2 (Week 2)",
            "focus": "Element balancing",
            "details": "Calibrate light-material-color relationships to reduce elemental conflict and visual strain.",
            "success_signal": "Reduction in medium/high risk markers and improved consistency in room comfort.",
        },
        {
            "phase": "Phase 3 (Week 3-4)",
            "focus": "Performance lock-in",
            "details": "Refine decor and placement symmetry to retain gains and prevent fallback drift.",
            "success_signal": "Score stability over two scans with improved pass/partial diagnostics.",
        },
    ]

    monitoring_checklist = [
        "Confirm entry threshold remains uncluttered and visually defined.",
        "Check that primary seating and heavy mass stay in stable supportive zones.",
        "Maintain day-evening light balance to avoid dull or over-harsh patches.",
        "Review weekly whether weak categories show measurable improvement.",
    ]

    conversation = [
        f"I reviewed your {room_type.lower()} using the facing {facing} as the reference axis. In classical Vastu, the first check is whether the room supports entry flow, stable seating, and clear circulation before looking at styling.",
        f"Your current score is {score}/100, with {int(diagnostics.get('pass', 0))} clear alignments and {int(diagnostics.get('fail', 0))} direct conflicts. This means the room is usable, but the weakest zones still need correction before the layout can be called fully balanced.",
        "The strongest improvements will come from fixing the top two zone mismatches first, because those carry the biggest impact on daily movement, visual comfort, and the room's energetic center.",
        "If the weak zones remain untouched, the room may continue to feel uneven in practical terms: harder movement, less visual calm, and less support from the directional setup.",
    ]

    if not suggestions:
        conversation.append("No major directional conflicts were detected from the visible objects, so focus on consistency and decluttering.")

    return {
        "consultation_intro": consultation_intro,
        "confidence_note": confidence_note,
        "directional_reasoning": directional_reasoning,
        "directional_snapshot": {
            "facing": facing,
            "element": profile["element"],
            "focus": profile["focus"],
            "inference": direction_meta,
        },
        "strengths": strong_lines,
        "concerns": concern_lines,
        "scoring_basis": scoring_basis,
        "category_diagnostics": category_diagnostics,
        "potential_risks": potential_risks,
        "placement_plan": placement_plan,
        "conversation": conversation,
        "remedies": remedies,
        "correction_protocol": correction_protocol,
        "implementation_roadmap": implementation_roadmap,
        "monitoring_checklist": monitoring_checklist,
        "diagnostics": diagnostics,
    }


def analyse_vastu_score(room_type: str, facing_direction: str, floor: str, image_files: List[bytes]) -> Dict:
    processed = [_preprocess(b) for b in image_files]
    facing = _normalize_direction(facing_direction)

    direction_meta = {
        "direction": facing,
        "confidence": 1.0,
        "method": "user-selected",
    }

    if facing == "AUTO":
        inferred = _infer_auto_direction(image_files, processed)
        if not inferred.get("direction"):
            return {
                "error": True,
                "error_code": "DIRECTION_INFERENCE_FAILED",
                "message": "Auto direction detection could not determine a stable facing. Please select direction manually.",
                "auto_direction": inferred,
            }
        direction_meta = inferred
        if float(inferred.get("confidence", 0.0) or 0.0) < AUTO_DIRECTION_MIN_CONFIDENCE:
            return {
                "error": True,
                "error_code": "LOW_DIRECTION_CONFIDENCE",
                "message": "Auto direction confidence is too low for a reliable report. Please choose direction manually or upload clearer images.",
                "required_confidence": AUTO_DIRECTION_MIN_CONFIDENCE,
                "auto_direction": inferred,
            }
        facing = str(direction_meta["direction"])

    detections = _detect_objects(processed, facing)

    result = _evaluate(room_type=room_type, detections=detections, facing=facing)

    result["floor"] = floor
    result["model"] = "yolov8"
    result["rule_engine_version"] = "v1.0"
    result["auto_direction"] = direction_meta
    result["detection_count"] = len(detections)
    result["analysis_quality"] = "low" if (len(detections) < 2 and result["auto_direction"].get("image_quality", 0.0) < 0.18) else "normal"
    result["analysis_warnings"] = []
    if result["analysis_quality"] == "low":
        result["analysis_warnings"].append(
            "This is a preliminary scan because the frame is visually under-detailed. For a final astrological report, upload 2-3 brighter doorway-angle photos from the doorway or wider corner view."
        )
    result["detailed_report"] = _build_detailed_report(result, room_type, facing, direction_meta, floor)
    result["cache_key_hint"] = hashlib.md5((room_type + facing_direction + (floor or "")).encode("utf-8")).hexdigest()
    return result
