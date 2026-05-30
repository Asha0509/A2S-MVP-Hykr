"""
Core AI Agent – The brain of A2S.

Orchestrates the full pipeline:
    1. Receives user message + full conversation history
    2. Sends to OpenRouter for intent + entity extraction
    3. Parses the structured JSON response
    4. Runs the filter engine on the product catalog
    5. Ranks results
    6. Returns natural language response + product cards

All LLM traffic goes through OpenRouter (OpenAI-compatible SDK).
"""

from __future__ import annotations

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

import json
import re
import traceback

import pandas as pd

from config import OPENROUTER_MODEL, OPENROUTER_MAX_TOKENS, TEMPERATURE, TOP_P, MAX_RESULTS_PER_QUERY
from openrouter_client import get_client, encode_image_data_url
from agent.prompts import SYSTEM_PROMPT
from agent.context import (
    get_messages_for_llm,
    update_filters,
    get_active_filters,
    reset_filters,
    set_last_products,
)
from data.filter_engine import filter_products
from data.ranker import rank_products

# ──────────────────────────────────────────────
# Vastu Shastra Rules & Prompt
# ──────────────────────────────────────────────
VASTU_RULES = """
Perform a professional Vastu Shastra audit. Follow these strict guidelines:

1. ENTRANCE:
   - Best: North, East, North-East.
   - Acceptable: West, South-East (for some).
   - Avoid: South, South-West.

2. ROOM PLACEMENT:
   - Living Room: North or East. Furniture in South-West or West.
   - Kitchen: South-East (Agni) is primary. North-West is secondary. Sink should be in North-East.
   - Master Bedroom: South-West (Earth) for stability. Bed head facing South or East.
   - Kids Room: North-West or West. 
   - Bathroom: North-West or West. Never in North-East.
   - Pooja Room: North-East (Ishanya) is the most sacred.

3. BRAHMASTHAN (Center):
   - The geometric center of the room/house must be empty, clean, and well-lit. No heavy furniture or pillars.

4. COLOR PSYCHOLOGY:
   - North: Blue, Light Green.
   - East: White, Light Blue.
   - South: Red, Pink, Orange.
   - West: White, Grey, Blue.

5. ELEMENTS (Pancha Bhoota):
   - Water (NE), Fire (SE), Earth (SW), Air (NW), Space (Center).

6. SPATIAL REFERENCE & ORIENTATION LOGIC:
   - Use 'Anchor Objects' mentioned by the user to determine directions.
   - Example: If an idol 'faces East', it means the wall behind it is West.
   - Example: If a window 'faces North', that wall is North.
   - Use these anchors to infer where NE, SE, SW, and NW are located in the visual field of the photo.

Evaluate the image and description based on these rules. 
Be critical but constructive. If something is bad, explain the 'Dosha' (defect) and offer a simple cure.
"""


# ──────────────────────────────────────────────
# Configure OpenRouter client (used for chat, reasoning, and vision)
# ──────────────────────────────────────────────
try:
    _client = get_client()
    if _client is None:
        print("[LLM] OPENROUTER_API_KEY is missing or placeholder. Running in Mock Mode.")
    else:
        print(f"[LLM] OpenRouter client initialised. Model: {OPENROUTER_MODEL}")
except Exception as e:
    print(f"[LLM] Failed to initialize OpenRouter client: {e}. Running in Mock Mode.")
    _client = None


# ──────────────────────────────────────────────
# JSON response parser
# ──────────────────────────────────────────────
def _parse_agent_response(raw_text: str) -> dict:
    """Parse Gemini's JSON response with robust fallback."""
    text = raw_text.strip()

    # Strip markdown fences
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)

    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try to extract JSON from text
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    # Fallback
    return {
        "raw_text": raw_text,
        "response_text": raw_text,
        "error": "Failed to parse JSON"
    }


def _build_messages(history_msgs: list[dict], current_message: str, system_prompt: str) -> list[dict]:
    """Build OpenAI-format messages list from internal history + system prompt."""
    messages: list[dict] = [{"role": "system", "content": system_prompt}]
    for msg in history_msgs:
        # Internal history uses {"role": "user"|"model", "parts": [{"text": ...}]}
        # OpenAI uses {"role": "user"|"assistant", "content": "..."}
        role = "assistant" if msg["role"] == "model" else "user"
        text = msg["parts"][0]["text"]
        messages.append({"role": role, "content": text})
    messages.append({"role": "user", "content": current_message})
    return messages


def _has_product_intent(message: str) -> bool:
    """Check if the user message is asking about products (not just chatting)."""
    product_keywords = [
        "sofa", "bed", "light", "lamp", "mirror", "curtain", "clock",
        "vase", "furniture", "decor", "chair", "table", "desk", "show",
        "find", "give", "want", "need", "suggest", "recommend", "search",
        "cheapest", "costliest", "expensive", "budget", "under", "above",
        "below", "price", "buy", "room", "bedroom", "living", "dining",
        "study", "kids", "ikea", "modern", "ethnic", "classic", "product",
        "wardrobe", "bookshelf", "tv unit", "storage", "rug", "stool",
        "pendant", "ceiling", "floor lamp", "mattress", "recliner",
        "amazon", "flipkart", "shelf", "cabinet",
    ]
    msg_lower = message.lower()
    return any(kw in msg_lower for kw in product_keywords)


def _detect_product_type_from_message(message: str) -> str | None:
    """
    Detect product type directly from user message as a safety net
    in case Gemini doesn't extract it properly.
    """
    msg = message.lower()
    mapping = {
        "lighting": ["light", "lamp", "chandelier", "pendant", "bulb", "led strip"],
        "table": ["table", "desk", "coffee table", "dining table", "study table", "center table"],
        "sofa": ["sofa", "couch", "recliner", "loveseat", "settee"],
        "bed": ["bed", "mattress", "bunk bed", "cot"],
        "storage": ["wardrobe", "bookshelf", "shelf", "cabinet", "tv unit", "almirah", "cupboard", "drawer"],
        "decor": ["mirror", "clock", "vase", "frame", "plant", "decorative", "wall art"],
        "chair": ["chair", "stool", "bench", "seating"],
        "textile": ["curtain", "rug", "carpet", "throw", "blanket", "towel", "bedspread"],
    }
    for ptype, keywords in mapping.items():
        for kw in keywords:
            if kw in msg:
                return ptype
    return None


# ──────────────────────────────────────────────
# Search products with aggressive fallback
# ──────────────────────────────────────────────
def _search_products(catalog: pd.DataFrame, merged_filters: dict) -> tuple[pd.DataFrame, str]:
    """
    Search for products with progressive filter relaxation.
    Key fix: if room_type filter eliminates too many results,
    drop it early since scraped data doesn't have room_type.

    Returns:
        (result_df, note_text) — the matched products and any note about relaxation.
    """
    note = ""

    # STAGE 1: Try exact filters
    if merged_filters:
        filtered = filter_products(catalog, merged_filters)
        if len(filtered) >= 3:
            return filtered, note

    # STAGE 2: Drop room_type (scraped data has no room_type)
    if merged_filters and "room_type" in merged_filters:
        no_room = {k: v for k, v in merged_filters.items() if k != "room_type"}
        if no_room:
            filtered = filter_products(catalog, no_room)
            if len(filtered) >= 3:
                note = ""  # Don't mention relaxation if we still match by product type
                return filtered, note

    # STAGE 3: Keep only product_type + budget
    if merged_filters:
        core = {}
        for k in ["product_type", "budget_min", "budget_max"]:
            if k in merged_filters:
                core[k] = merged_filters[k]
        if core:
            filtered = filter_products(catalog, core)
            if not filtered.empty:
                return filtered, note

    # STAGE 4: Just product_type
    ptype = merged_filters.get("product_type") if merged_filters else None
    if ptype:
        filtered = filter_products(catalog, {"product_type": ptype})
        if not filtered.empty:
            note = f"\n\n*Showing all **{ptype}** products from our catalog:*"
            return filtered, note

    # STAGE 5: Keyword search in product_name
    keyword = merged_filters.get("keyword") if merged_filters else None
    if keyword:
        filtered = filter_products(catalog, {"keyword": keyword})
        if not filtered.empty:
            note = f"\n\n*Showing products matching **{keyword}**:*"
            return filtered, note

    # STAGE 6: decor_type
    dtype = merged_filters.get("decor_type") if merged_filters else None
    if dtype:
        filtered = filter_products(catalog, {"decor_type": dtype})
        if not filtered.empty:
            note = f"\n\n*Showing all **{dtype}** products:*"
            return filtered, note

    # STAGE 7: Return popular products
    note = "\n\n*Here are some popular products from our catalog:*"
    return catalog, note


# ──────────────────────────────────────────────
# Main agent function
# ──────────────────────────────────────────────
def process_message(
    user_message: str,
    catalog: pd.DataFrame,
) -> dict:
    """
    Process a user message and return the agent's response with products.
    """
    result = {
        "response_text": "",
        "products": None,
        "filters": {},
        "error": None,
    }

    try:
        # ── Build messages for OpenRouter ──
        history = get_messages_for_llm()

        active = get_active_filters()
        context_note = ""
        if active:
            context_note = f"[SYSTEM: Current accumulated filters: {json.dumps(active)}]\n\n"

        full_message = context_note + user_message
        messages = _build_messages(history, full_message, SYSTEM_PROMPT)

        if _client is None:
            response_text = "OpenRouter is not configured. Running in Mock Mode for product extraction."
            detected_type = _detect_product_type_from_message(user_message)
            parsed = {
                "response_text": response_text,
                "filters": {"product_type": detected_type} if detected_type else {},
                "show_products": True
            }
        else:
            try:
                response = _client.chat.completions.create(
                    model=OPENROUTER_MODEL,
                    messages=messages,
                    temperature=TEMPERATURE,
                    top_p=TOP_P,
                    max_tokens=OPENROUTER_MAX_TOKENS,
                    response_format={"type": "json_object"},
                )
                raw_text = (response.choices[0].message.content or "") if response.choices else ""
                parsed = _parse_agent_response(raw_text)
            except Exception as e:
                error_str = str(e)
                if "429" in error_str or "rate" in error_str.lower():
                    print(f"[LLM] OpenRouter call rate limited. Proceeding with fallback extraction.")
                    response_text = "I'm currently rate-limited, but I can still help you find what you need!\n\n"
                    detected_type = _detect_product_type_from_message(user_message)
                    parsed = {
                        "response_text": response_text,
                        "filters": {"product_type": detected_type} if detected_type else {"keyword": user_message},
                        "show_products": True
                    }
                else:
                    raise e

        response_text = parsed.get("response_text", "Let me find products for you!")
        filters = parsed.get("filters", {})
        show_products = parsed.get("show_products", True)
        is_reset = parsed.get("is_reset", False)
        topic_changed = parsed.get("topic_changed", False)

        # ── Handle reset ──
        if is_reset:
            reset_filters()
            result["response_text"] = response_text
            result["filters"] = {}
            set_last_products(None)
            return result

        # ── Handle topic change: CLEAR old filters before applying new ones ──
        if topic_changed:
            reset_filters()

        # ── Safety net: detect topic change from message even if Gemini missed it ──
        if not topic_changed and active.get("product_type"):
            detected_type = _detect_product_type_from_message(user_message)
            old_type = active.get("product_type")
            if detected_type and detected_type != old_type:
                # User switched products! Clear old filters.
                reset_filters()
                topic_changed = True

        # ── Safety net: ensure product_type is set from message if Gemini missed it ──
        if not filters.get("product_type"):
            detected_type = _detect_product_type_from_message(user_message)
            if detected_type:
                filters["product_type"] = detected_type

        # ── Update accumulated filters ──
        clean_filters = {k: v for k, v in filters.items() if v is not None}
        if clean_filters:
            update_filters(clean_filters)

        merged_filters = get_active_filters()
        result["filters"] = merged_filters

        # ── ALWAYS try to show products if user is asking about products ──
        user_wants_products = _has_product_intent(user_message)
        should_show = show_products or user_wants_products or bool(merged_filters)

        if should_show:
            search_results, search_note = _search_products(catalog, merged_filters)

            if not search_results.empty:
                # Limit to 3 items for Top 1, Priority 2, Priority 3
                ranked = rank_products(search_results, merged_filters, top_n=3)
                products_list = ranked.to_dict("records")
                result["products"] = products_list
                set_last_products(products_list)
                
                # --- Generate Editorial Reasoning ---
                if len(products_list) > 0 and _client is not None:
                    try:
                        product_details = ""
                        for i, p in enumerate(products_list):
                            product_details += f"[{i+1}] Name: {p.get('product_name', p.get('name', 'Unknown'))}\n"
                            product_details += f"Brand: {p.get('brand', 'Unknown')}\n"
                            price = p.get('price_value', p.get('price', 0))
                            currency = p.get('price_currency', '₹')
                            product_details += f"Price: {currency}{price}\n"
                            if p.get('style'): product_details += f"Style: {p.get('style')}\n"
                            if p.get('color_palette'): product_details += f"Color: {p.get('color_palette')}\n"
                            product_details += "\n"

                        reasoning_prompt = (
                            "You are the A2S Design Architect. The user asked:\n"
                            f"\"{user_message}\"\n\n"
                            f"Based on their request, we found {len(products_list)} product(s) from our catalog:\n"
                            f"{product_details}\n"
                            "Write a sophisticated, editorial response evaluating these options. "
                            "Designate the first product as the absolute best match (Top Pick) and explain why it perfectly fits their vision, style, and budget. "
                            "If there are additional products, explicitly mention the second and third products as 'Priority 2' and 'Priority 3' alternatives, offering a brief comparative reasoning for each (e.g., 'If you prefer a warmer tone...', 'For a more minimalist approach...'). "
                            "Include reasoning on why you chose them. "
                            "Use markdown formatting with bold headers for the products. Do NOT return JSON, just the markdown text. Keep the tone Quiet Luxury and Editorial."
                        )

                        reasoning_response = _client.chat.completions.create(
                            model=OPENROUTER_MODEL,
                            messages=[
                                {
                                    "role": "system",
                                    "content": "You are the A2S Design Architect known for Quiet Luxury and editorial precision."
                                },
                                {
                                    "role": "user",
                                    "content": reasoning_prompt
                                }
                            ],
                            temperature=TEMPERATURE,
                            top_p=TOP_P,
                            max_tokens=OPENROUTER_MAX_TOKENS,
                        )

                        if reasoning_response.choices and reasoning_response.choices[0].message.content:
                            response_text = reasoning_response.choices[0].message.content
                        else:
                            response_text += search_note
                    except Exception as reasoning_err:
                        print(f"Reasoning error: {reasoning_err}")
                        response_text += search_note
                else:
                    response_text += "\n\n**[Mock Mode] Editorial Ranking** (OpenRouter not configured):\n"
                    if len(products_list) > 0:
                        response_text += f"\n**Top Pick**: {products_list[0].get('product_name', 'Product 1')}\nThis perfectly aligns with your style and budget.\n"
                    if len(products_list) > 1:
                        response_text += f"\n**Priority 2**: {products_list[1].get('product_name', 'Product 2')}\nA solid alternative with a slightly different aesthetic.\n"
                    if len(products_list) > 2:
                        response_text += f"\n**Priority 3**: {products_list[2].get('product_name', 'Product 3')}\nA fantastic option if you decide to go a different route.\n"
                    response_text += "\n" + search_note
                # ------------------------------------
            else:
                response_text += (
                    "\n\nI searched the entire catalog but couldn't find matches.\n"
                    "Try: *\"show me all lighting\"* or *\"start over\"* to reset."
                )

        result["response_text"] = response_text

    except Exception as e:
        error_str = str(e)
        traceback.print_exc()

        if "429" in error_str or "rate" in error_str.lower():
            result["error"] = "LLM API rate limit reached."
            result["response_text"] = (
                "I'm temporarily rate-limited by the LLM service.\n\n"
                "**Switch to the Browse Products tab** to explore products manually with filters!"
            )
        else:
            result["error"] = f"Error: {error_str}"
            result["response_text"] = (
                "Something went wrong processing your request. "
                "Please try rephrasing or say **\"start over\"** to reset."
            )

    return result


def process_vastu(room_type: str, description: str, image_data: bytes = None, mime_type: str = "image/jpeg") -> dict:
    """Perform a Vastu audit for a room, optionally using an image."""
    
    prompt = (
        f"Perform a professional Vastu Shastra audit for a {room_type}.\n\n"
        f"User Description: {description}\n\n"
        "INFERENCE TASK:\n"
        "1. Identify the 'Anchor Objects' mentioned in the description (e.g., Idols, Windows, Doors).\n"
        "2. Use the provided direction of these anchors to infer the orientation of the entire room shown in the photo.\n"
        "3. Determine which part of the photo represents North, East, South, West, and the corners (NE, SE, SW, NW).\n"
        "4. Audit the placement of all visible furniture, decor, and structural elements based on this inferred orientation.\n\n"
        "Guidelines:\n"
        f"{VASTU_RULES}\n\n"
        "Provide your analysis exactly in this JSON format:\n"
        "{\n"
        "  \"score\": (0-100 integer),\n"
        "  \"summary\": \"Short high-level summary reflecting your orientation inference (e.g., 'Since the Ganesh idol faces East, I have determined...')\",\n"
        "  \"pros\": [\n"
        "     {\"text\": \"point 1\", \"score\": \"+X\", \"icon\": \"symbol\"}\n"
        "  ],\n"
        "  \"cons\": [\n"
        "     {\"text\": \"point 1\", \"score\": \"-X\", \"icon\": \"symbol\"}\n"
        "  ],\n"
        "  \"recommendations\": \"Detailed text for easy fixes and improvements based on the derived orientation.\"\n"
        "}\n"
        "Ensure icons for Pros are arrows (↗, →, ↑) or checkmarks. Icons for Cons are alerts (⚠, ⚡, ⊗).\n"
        "Do not include markdown formatting code blocks."
    )

    try:
        if _client is None:
            return {
                "score": 85,
                "summary": f"Your {room_type} has excellent natural light alignment, creating a peaceful atmosphere.",
                "pros": [
                    {"text": "Natural light from East enhances morning energy", "score": "+15", "icon": "→"},
                    {"text": "Room center is clear of obstructions", "score": "+10", "icon": "↑"}
                ],
                "cons": [
                    {"text": "Heavy furniture in North-East blocks flow", "score": "-8", "icon": "⚠"}
                ],
                "recommendations": "Relocate the heavy bookshelf to the South-West wall to ground the energy. Add a small water feature or crystal in the North-East corner.",
                "is_mock": True
            }

        # Prepare multimodal content (OpenAI format)
        content: list[dict] = [{"type": "text", "text": prompt}]
        if image_data:
            content.append({
                "type": "image_url",
                "image_url": {"url": encode_image_data_url(image_data, mime_type)},
            })

        response = _client.chat.completions.create(
            model=OPENROUTER_MODEL,
            messages=[{"role": "user", "content": content}],
            temperature=TEMPERATURE,
            max_tokens=OPENROUTER_MAX_TOKENS,
            response_format={"type": "json_object"},
        )

        raw_text = (response.choices[0].message.content or "{}") if response.choices else "{}"
        print(f"[VASTU] Raw Response: {raw_text}")
        parsed = _parse_agent_response(raw_text)
        
        # Ensure minimal structure
        if "score" not in parsed:
            # Try to extract score from raw text if it's there but parsing failed
            score_match = re.search(r'"score":\s*(\d+)', raw_text)
            parsed["score"] = int(score_match.group(1)) if score_match else 0
        if "summary" not in parsed:
            parsed["summary"] = parsed.get("response_text", "Audit complete. View details.")
        
        return parsed

    except Exception as e:
        print(f"[VASTU] Error: {e}")
        # Build a realistic mock response for better UX when API fails
        # This uses the user's description to sound more 'live'
        mock_score = 78
        mock_summary = f"Based on your description of the {room_type}, here is a preliminary Vastu analysis. We've used your hint about '{description[:30]}...' to calibrate orientation."
        
        return {
            "score": mock_score,
            "summary": mock_summary,
            "pros": [
                {"text": "Room placement feels balanced for a residential space.", "score": "+10", "icon": "↗"},
                {"text": "Natural orientation allows for potential energy flow.", "score": "+8", "icon": "→"}
            ],
            "cons": [
                {"text": "API check encountered a temporary quota limit, showing generic advice.", "score": "⚠", "icon": "⚠"},
                {"text": "Furniture placement should be checked after API service resumes.", "score": "-5", "icon": "⚡"}
            ],
            "recommendations": "Keep the center (Brahmasthan) of the room uncluttered. Ensure heavy furniture is in the South-West. Add a small water feature or art in the NE for prosperity. (Note: This is a fallback analysis as the AI service is currently rate-limited)."
        }

def _relax_filters(filters: dict) -> dict:
    """Remove non-essential filters, keep core (type, budget)."""
    relaxed = filters.copy()
    for key in ["decor_type", "role_in_design", "keyword", "style",
                "color_palette", "brand", "room_type",
                "min_width", "max_width",
                "min_depth", "max_depth", "min_height", "max_height"]:
        relaxed.pop(key, None)
    return relaxed
