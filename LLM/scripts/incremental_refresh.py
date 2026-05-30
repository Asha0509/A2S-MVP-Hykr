"""
Incremental catalog refresh (B6 in ENHANCEMENTS.md).

Re-scrapes only the products whose `scraped_date` is older than --max-age-days
(default 14). Designed to be invoked from a GitHub Actions cron weekly so the
catalog stays fresh without spending the full multi-hour cost of a clean rebuild
every time.

Usage (from repo root):
    python LLM/scripts/incremental_refresh.py \\
        --catalog-path LLM/data/catalog.json \\
        --max-age-days 14

Exit code 0 = success. Non-zero = at least one scraper failed; logs name it.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable

LOG = logging.getLogger("incremental_refresh")


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--catalog-path", required=True, type=Path,
                   help="Path to the merged catalog JSON file.")
    p.add_argument("--max-age-days", type=int, default=14,
                   help="Products older than this are re-scraped.")
    p.add_argument("--dry-run", action="store_true",
                   help="Print what would be refreshed without scraping.")
    return p.parse_args(argv)


def load_catalog(path: Path) -> list[dict]:
    if not path.exists():
        raise FileNotFoundError(f"catalog not found at {path}")
    with path.open("r", encoding="utf-8") as fh:
        data = json.load(fh)
    if not isinstance(data, list):
        raise ValueError(f"expected a JSON list, got {type(data).__name__}")
    return data


def is_stale(product: dict, cutoff: datetime) -> bool:
    """A product is stale if it has no scraped_date or one older than cutoff."""
    raw = product.get("scraped_date")
    if not raw:
        return True
    # Accept either ISO-8601 with timezone or naive (treat naive as UTC).
    try:
        ts = datetime.fromisoformat(str(raw).replace("Z", "+00:00"))
    except ValueError:
        LOG.warning("Unparseable scraped_date=%r on product id=%s; "
                    "marking stale", raw, product.get("product_id"))
        return True
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    return ts < cutoff


def select_stale(catalog: Iterable[dict], max_age_days: int) -> list[dict]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=max_age_days)
    return [p for p in catalog if is_stale(p, cutoff)]


def group_by_source(products: list[dict]) -> dict[str, list[dict]]:
    out: dict[str, list[dict]] = {}
    for p in products:
        src = p.get("source") or "unknown"
        out.setdefault(src, []).append(p)
    return out


def refresh_source(source: str, products: list[dict], dry_run: bool) -> bool:
    """Trigger a single source-specific re-scrape. Returns True on success.

    The existing crawler entry point `run_scraper` operates at the source
    granularity rather than per product_id, so we re-crawl the whole source
    and let the dedup engine merge new rows over the existing catalog.
    """
    LOG.info("Refreshing %d stale rows from %s", len(products), source)
    if dry_run:
        return True
    # Lazy import so dry-run mode doesn't need the scraper dependencies
    # (pandas, requests, scraper-specific deps).
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
    from scraper.run_crawler import run_scraper  # type: ignore  # noqa: E402
    try:
        df = run_scraper(sites=[source])
        LOG.info("Source %s yielded %d rows", source, len(df))
        return True
    except Exception as exc:
        LOG.error("Source %s failed: %s", source, exc, exc_info=True)
        return False


def main(argv: list[str] | None = None) -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    args = parse_args(argv)

    catalog = load_catalog(args.catalog_path)
    LOG.info("Loaded %d products from %s", len(catalog), args.catalog_path)

    stale = select_stale(catalog, args.max_age_days)
    LOG.info("%d products older than %d days", len(stale), args.max_age_days)
    if not stale:
        return 0

    by_source = group_by_source(stale)
    LOG.info("Stale by source: %s", {k: len(v) for k, v in by_source.items()})

    failed: list[str] = []
    for source, group in by_source.items():
        if not refresh_source(source, group, args.dry_run):
            failed.append(source)

    if failed:
        LOG.error("Refresh failed for sources: %s", ", ".join(failed))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
