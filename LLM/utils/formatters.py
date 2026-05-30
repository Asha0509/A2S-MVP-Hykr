"""
Product Card Formatters – Compact Edition.

Formats product data into compact, space-efficient Streamlit display cards
with small thumbnails, prices, dimensions, and affiliate links.
"""

from __future__ import annotations

import pandas as pd


def display_product_cards(products: list[dict]) -> None:
    """
    Render product cards in a 3-column compact grid.
    Each card has a small thumbnail, name, price, source badge, and buy link.
    """
    import streamlit as st

    if not products:
        st.info("No products to display.")
        return

    for i in range(0, len(products), 3):
        cols = st.columns(3, gap="small")
        for j, col in enumerate(cols):
            idx = i + j
            if idx >= len(products):
                break
            product = products[idx]
            with col:
                _render_card(product, st)


def _render_card(product: dict, st) -> None:
    """Render a single compact product card."""
    with st.container(border=True):
        # ── Image (small thumbnail) ──
        image_url = product.get("image_url", "")
        if image_url and str(image_url).startswith("http"):
            try:
                st.markdown(
                    f'<div style="width:100%; height:140px; overflow:hidden; border-radius:8px; '
                    f'background:#111; display:flex; align-items:center; justify-content:center;">'
                    f'<img src="{image_url}" style="max-width:100%; max-height:140px; object-fit:contain;" /></div>',
                    unsafe_allow_html=True,
                )
            except Exception:
                pass

        # ── Source badge (inline, top) ──
        source = product.get("source", "")
        source_html = ""
        if source and str(source) not in ("None", "nan", "original_data", ""):
            src_colors = {
                "amazon.in": ("#ff9900", "#232f3e"),
                "flipkart.com": ("#2874f0", "#fff"),
                "ikea.com": ("#0058a3", "#ffdb00"),
            }
            bg, fg = src_colors.get(source, ("#6366f1", "#fff"))
            src_label = source.replace(".com", "").replace(".in", "").upper()
            source_html = (
                f'<span style="background:{bg}; color:{fg}; padding:1px 6px; '
                f'border-radius:4px; font-size:0.6rem; font-weight:700; '
                f'letter-spacing:0.4px; vertical-align:middle;">{src_label}</span> '
            )

        # ── Name (truncated) + Brand ──
        name = product.get("product_name", "Unknown Product")
        brand = product.get("brand", "")
        display_name = str(name).title()[:65]
        if len(str(name)) > 65:
            display_name += "…"

        st.markdown(
            f'<p style="font-size:0.82rem; font-weight:600; color:#e2e8f0; '
            f'margin:0.4rem 0 0.15rem 0; line-height:1.3;">{source_html}{display_name}</p>',
            unsafe_allow_html=True,
        )

        if brand and brand != "Unknown":
            st.markdown(
                f'<span style="color:#8b5cf6; font-size:0.72rem; font-weight:600;">{brand}</span>',
                unsafe_allow_html=True,
            )

        # ── Price ──
        price = product.get("price_value")
        if price and not pd.isna(price):
            st.markdown(
                f'<span style="font-size:1.2rem; font-weight:800; color:#a78bfa;">₹{float(price):,.0f}</span>',
                unsafe_allow_html=True,
            )

        # ── Dimensions (compact) ──
        width = product.get("width_cm")
        depth = product.get("depth_cm")
        height = product.get("height_cm")
        dims = []
        if width and not pd.isna(width):
            dims.append(f"{int(width)}")
        if depth and not pd.isna(depth):
            dims.append(f"{int(depth)}")
        if height and not pd.isna(height):
            dims.append(f"{int(height)}")

        raw_dim = product.get("dimensions")
        if dims:
            st.caption(f"📐 {' × '.join(dims)} cm")
        elif raw_dim and str(raw_dim) not in ("None", "nan", ""):
            st.caption(f"📐 {raw_dim}")

        # ── Tags (compact row) ──
        tags = []
        for field, icon in [("product_type", "🪑"), ("style", "🎨")]:
            val = product.get(field)
            if val and str(val) not in ("None", "nan"):
                tags.append(f'{icon} {str(val).replace("_"," ").title()}')

        if tags:
            tags_str = " · ".join(tags)
            st.markdown(
                f'<span style="font-size:0.65rem; color:#9ca3af;">{tags_str}</span>',
                unsafe_allow_html=True,
            )

        # ── Buy Link ──
        url = product.get("affiliate_url") or product.get("source_url")
        if url and str(url).startswith("http"):
            st.link_button("🛒 Buy", str(url), use_container_width=True)


def format_product_summary(products: list[dict]) -> str:
    """Text summary of products for conversation history."""
    if not products:
        return ""

    lines = [f"\n**Showing {len(products)} product(s):**\n"]
    for i, p in enumerate(products, 1):
        name = p.get("product_name", "Unknown")
        price = p.get("price_value", "N/A")
        brand = p.get("brand", "")
        price_str = f"₹{float(price):,.0f}" if price and not pd.isna(price) else "N/A"
        line = f"{i}. **{str(name).title()[:60]}** — {price_str}"
        if brand and brand != "Unknown":
            line += f" ({brand})"
        lines.append(line)

    return "\n".join(lines)
