"""
Input Validators.

Validates and sanitizes user input before processing.
Ensures safety and correctness of data flowing through the agent.
"""

from __future__ import annotations


def sanitize_message(message: str) -> str:
    """
    Clean and validate user message input.

    - Strips whitespace
    - Limits length to 2000 chars
    - Removes potentially harmful content

    Args:
        message: Raw user input string.

    Returns:
        Cleaned message string.
    """
    if not message:
        return ""

    message = str(message).strip()

    # Limit length
    if len(message) > 2000:
        message = message[:2000]

    return message


def validate_filters(filters: dict) -> dict:
    """
    Validate and clean extracted filter values.

    Ensures:
        - Numeric values are actually numeric
        - Text values are stripped and lowered
        - Unknown keys are removed

    Args:
        filters: Raw filter dict from LLM.

    Returns:
        Cleaned filter dict.
    """
    valid_keys = {
        "room_type", "style", "color_palette", "product_type",
        "brand", "budget_min", "budget_max",
        "min_width", "max_width", "min_depth", "max_depth",
        "min_height", "max_height",
        "decor_type", "role_in_design", "keyword",
    }

    numeric_keys = {
        "budget_min", "budget_max",
        "min_width", "max_width", "min_depth", "max_depth",
        "min_height", "max_height",
    }

    cleaned = {}

    for key, value in filters.items():
        if key not in valid_keys:
            continue
        if value is None:
            continue

        if key in numeric_keys:
            try:
                cleaned[key] = float(value)
            except (ValueError, TypeError):
                continue
        else:
            cleaned[key] = str(value).strip().lower()

    return cleaned


def is_valid_url(url: str) -> bool:
    """Check if a string looks like a valid URL."""
    if not url:
        return False
    return str(url).startswith(("http://", "https://"))
