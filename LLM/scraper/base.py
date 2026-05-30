"""
Base scraper with shared utilities: headers rotation, retry logic,
rate limiting, and data normalization.
"""

import time
import random
import logging
import os
from typing import Optional
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Rotating User-Agents to avoid detection
USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
]


def get_session() -> requests.Session:
    """Create a requests session with retry logic and connection pooling."""
    session = requests.Session()
    retries = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
    )
    adapter = HTTPAdapter(max_retries=retries)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


def get_headers() -> dict:
    """Return randomized browser headers."""
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-IN,en-US;q=0.9,en;q=0.8,hi;q=0.7",
        "Accept-Encoding": "gzip, deflate",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Cache-Control": "max-age=0",
    }


def fetch_page(url: str, session: Optional[requests.Session] = None, delay: float = 1.5) -> Optional[str]:
    """
    Fetch a page with rate limiting and error handling.

    Args:
        url: URL to fetch.
        session: Optional requests session (creates new if None).
        delay: Seconds to wait before request (rate limiting).

    Returns:
        HTML content as string, or None on failure.
    """
    time.sleep(delay + random.uniform(0.5, 1.5))  # Polite delay

    sess = session or get_session()
    headers = get_headers()

    try:
        resp = sess.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
        logger.info(f"OK {resp.status_code} — {url[:80]}")
        return resp.text
    except requests.exceptions.HTTPError as e:
        logger.warning(f"HTTP {e.response.status_code} — {url[:80]}")
    except requests.exceptions.ConnectionError:
        logger.warning(f"Connection error — {url[:80]}")
    except requests.exceptions.Timeout:
        logger.warning(f"Timeout — {url[:80]}")
    except Exception as e:
        logger.warning(f"Error fetching {url[:80]}: {e}")

    return None


def clean_price(text: str) -> Optional[float]:
    """Extract numeric price from text like '₹12,990', 'Rs. 12990', etc."""
    import re
    if not text:
        return None
    # Remove currency symbols, commas, spaces
    cleaned = re.sub(r"[₹,\s]", "", str(text))
    cleaned = re.sub(r"^(Rs\.?|INR)\s*", "", cleaned)
    # Extract first number
    match = re.search(r"(\d+(?:\.\d+)?)", cleaned)
    return float(match.group(1)) if match else None


def clean_text(text: str) -> str:
    """Remove extra whitespace and clean text."""
    if not text:
        return ""
    import re
    text = str(text).strip()
    text = re.sub(r"\s+", " ", text)
    return text


def build_affiliate_url(source_url: str, source: str) -> str:
    """
    Build an affiliate URL from a source URL.

    This only becomes revenue-generating when valid affiliate account IDs
    are configured via environment variables.

    Supported env vars:
    - AMAZON_ASSOCIATE_TAG
    - FLIPKART_AFFILIATE_ID
    - IKEA_AFFILIATE_CODE
    - PEPPERFRY_AFFILIATE_ID
    - URBANLADDER_AFFILIATE_ID
    - WOODENSTREET_AFFILIATE_ID
    - HOMELANE_AFFILIATE_ID
    - NILKAMAL_AFFILIATE_ID
    - GODREJINTERIO_AFFILIATE_ID
    - MIRADORHOME_AFFILIATE_ID
    """
    if not source_url:
        return ""

    src = (source or "").lower().strip()

    try:
        parsed = urlparse(source_url)
        query = parse_qs(parsed.query)

        if "amazon" in src:
            tag = os.getenv("AMAZON_ASSOCIATE_TAG", "").strip()
            if tag:
                query["tag"] = [tag]

        elif "flipkart" in src:
            aff = os.getenv("FLIPKART_AFFILIATE_ID", "").strip()
            if aff:
                query["affid"] = [aff]

        elif "ikea" in src:
            code = os.getenv("IKEA_AFFILIATE_CODE", "").strip()
            if code:
                query["utm_source"] = ["a2s"]
                query["utm_medium"] = ["affiliate"]
                query["utm_campaign"] = [code]

        elif "pepperfry" in src:
            aff = os.getenv("PEPPERFRY_AFFILIATE_ID", "").strip()
            if aff:
                query["aff_id"] = [aff]

        elif "urbanladder" in src:
            aff = os.getenv("URBANLADDER_AFFILIATE_ID", "").strip()
            if aff:
                query["aff_id"] = [aff]

        elif "woodenstreet" in src:
            aff = os.getenv("WOODENSTREET_AFFILIATE_ID", "").strip()
            if aff:
                query["aff_id"] = [aff]

        elif "homelane" in src:
            aff = os.getenv("HOMELANE_AFFILIATE_ID", "").strip()
            if aff:
                query["aff_id"] = [aff]

        elif "nilkamal" in src:
            aff = os.getenv("NILKAMAL_AFFILIATE_ID", "").strip()
            if aff:
                query["aff_id"] = [aff]

        elif "godrejinterio" in src:
            aff = os.getenv("GODREJINTERIO_AFFILIATE_ID", "").strip()
            if aff:
                query["aff_id"] = [aff]

        elif "miradorhome" in src:
            aff = os.getenv("MIRADORHOME_AFFILIATE_ID", "").strip()
            if aff:
                query["aff_id"] = [aff]

        updated = parsed._replace(query=urlencode(query, doseq=True))
        return urlunparse(updated)
    except Exception:
        return source_url


def extract_color(text: str) -> tuple[str, Optional[str]]:
    """
    Extract color name and hex code from text.
    
    Args:
        text: Product description or name.
        
    Returns:
        Tuple of (color_name, color_hex).
    """
    import re
    
    COLOR_MAP = {
        r'\b(black|jet|ebony|charcoal)\b': ('Black', '#000000'),
        r'\b(white|ivory|cream|off.?white)\b': ('White', '#FFFFFF'),
        r'\b(gray|grey|silver|ash|slate)\b': ('Gray', '#808080'),
        r'\b(brown|walnut|oak|teak|mahogany|chocolate)\b': ('Brown', '#8B4513'),
        r'\b(gold|golden|brass)\b': ('Gold', '#FFD700'),
        r'\b(beige|tan|taupe|sand|khaki)\b': ('Beige', '#F5F5DC'),
        r'\b(blue|navy|cobalt|azure|teal)\b': ('Blue', '#0000FF'),
        r'\b(green|emerald|olive|sage)\b': ('Green', '#008000'),
        r'\b(red|crimson|burgundy|maroon)\b': ('Red', '#FF0000'),
        r'\b(pink|rose|blush|dusty pink)\b': ('Pink', '#FFC0CB'),
        r'\b(orange|terra|rust)\b': ('Orange', '#FFA500'),
        r'\b(yellow|golden|mustard)\b': ('Yellow', '#FFFF00'),
        r'\b(purple|violet|lavender|mauve)\b': ('Purple', '#800080'),
    }
    
    text_lower = text.lower() if text else ""
    
    for pattern, (color_name, color_hex) in COLOR_MAP.items():
        if re.search(pattern, text_lower):
            return (color_name, color_hex)
    
    return (None, None)


def extract_material(text: str) -> Optional[str]:
    """
    Extract material/construction from product text.
    
    Args:
        text: Product description or name.
        
    Returns:
        Material string (wood, leather, fabric, metal, glass, etc.).
    """
    import re
    
    MATERIALS = [
        r'\b(solid wood|hardwood|teak|oak|walnut|pine|plywood)\b',
        r'\b(leather|genuine leather|faux leather|pu leather)\b',
        r'\b(fabric|linen|cotton|velvet|microfiber|polyester)\b',
        r'\b(metal|stainless steel|aluminum|iron|brass|chrome)\b',
        r'\b(glass|tempered glass)\b',
        r'\b(plywood|particle board|engineered wood|mdf)\b',
        r'\b(ceramic|porcelain|marble|granite)\b',
    ]
    
    text_lower = text.lower() if text else ""
    
    for pattern in MATERIALS:
        match = re.search(pattern, text_lower)
        if match:
            return clean_text(match.group(1))
    
    return None


def map_aesthetic_style(product_type: str, product_name: str, description: str = "") -> str:
    """
    Map product to aesthetic style category.
    
    Args:
        product_type: Category like 'sofa', 'bed', 'lighting', etc.
        product_name: Product name.
        description: Product description.
        
    Returns:
        Aesthetic style: Minimal, Contemporary, Luxury, Boho, Industrial, Scandinavian, Traditional, etc.
    """
    import re
    
    full_text = f"{product_name} {description}".lower()
    
    # Style keyword patterns
    STYLE_PATTERNS = {
        "Minimal": r'\b(minimal|simple|sleek|modern|clean|minimalist)\b',
        "Contemporary": r'\b(contemporary|modern|current|recent|current trends)\b',
        "Luxury": r'\b(luxury|premium|high.?end|designer|exclusive)\b',
        "Boho": r'\b(boho|bohemian|eclectic|ethnic|tribal|macrame)\b',
        "Industrial": r'\b(industrial|warehouse|loft|metal|rustic|vintage)\b',
        "Scandinavian": r'\b(scandinavian|nordic|scandi|minimalist|danish)\b',
        "Traditional": r'\b(traditional|classic|vintage|antique|ornate|victorian)\b',
        "Rustic": r'\b(rustic|farmhouse|countryside|weathered|distressed)\b',
    }
    
    # Check patterns
    for style, pattern in STYLE_PATTERNS.items():
        if re.search(pattern, full_text):
            return style
    
    # Fallback based on product type
    TYPE_DEFAULT_STYLE = {
        "sofa": "Contemporary",
        "bed": "Contemporary",
        "lighting": "Minimal",
        "table": "Contemporary",
        "storage": "Minimal",
        "decor": "Contemporary",
        "chair": "Contemporary",
        "textile": "Boho",
    }
    
    return TYPE_DEFAULT_STYLE.get(product_type, "Contemporary")
