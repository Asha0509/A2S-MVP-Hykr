"""
OpenRouter client wrapper.

OpenRouter exposes an OpenAI-compatible chat completions API at
https://openrouter.ai/api/v1, which lets us address Claude, GPT, Llama,
DeepSeek, Gemini, etc. through a single SDK and a single API key.

This module returns a lazily-initialized openai.OpenAI client. Callers
use it for chat (text + vision) and structured JSON output.
"""

from __future__ import annotations

import base64
from typing import Optional

from openai import OpenAI

from config import OPENROUTER_API_KEY, OPENROUTER_BASE_URL

_client: Optional[OpenAI] = None


def get_client() -> Optional[OpenAI]:
    """Return a singleton OpenAI client pointed at OpenRouter, or None if no key."""
    global _client
    if _client is not None:
        return _client
    if not OPENROUTER_API_KEY or OPENROUTER_API_KEY == "PLACEHOLDER_API_KEY":
        return None
    _client = OpenAI(
        base_url=OPENROUTER_BASE_URL,
        api_key=OPENROUTER_API_KEY,
        default_headers={
            "HTTP-Referer": "https://aestheticstospaces.com",
            "X-Title": "A2S",
        },
    )
    return _client


def encode_image_data_url(image_bytes: bytes, mime_type: str = "image/jpeg") -> str:
    """Encode raw image bytes as a data URL for OpenAI-format multimodal messages."""
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    return f"data:{mime_type};base64,{b64}"
