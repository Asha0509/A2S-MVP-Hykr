"""Tests for the incremental catalog refresh selector (B6)."""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

# Match the import style used by sibling tests (e.g. test_dedup_engine.py).
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from scripts.incremental_refresh import (  # noqa: E402
    group_by_source,
    is_stale,
    load_catalog,
    select_stale,
)


# ── is_stale ─────────────────────────────────────────────────────────────────

def _cutoff(days: int = 14) -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=days)


def test_is_stale_missing_date_is_stale():
    assert is_stale({"product_id": "p1"}, _cutoff()) is True


def test_is_stale_empty_date_is_stale():
    assert is_stale({"product_id": "p1", "scraped_date": ""}, _cutoff()) is True


def test_is_stale_old_date_is_stale():
    old = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    assert is_stale({"product_id": "p1", "scraped_date": old}, _cutoff(14)) is True


def test_is_stale_recent_date_is_fresh():
    recent = (datetime.now(timezone.utc) - timedelta(days=3)).isoformat()
    assert is_stale({"product_id": "p1", "scraped_date": recent}, _cutoff(14)) is False


def test_is_stale_naive_timestamp_treated_as_utc():
    naive = (datetime.utcnow() - timedelta(days=30)).isoformat()
    assert is_stale({"product_id": "p1", "scraped_date": naive}, _cutoff(14)) is True


def test_is_stale_garbage_date_is_stale():
    assert is_stale({"product_id": "p1", "scraped_date": "not-a-date"}, _cutoff()) is True


# ── select_stale ─────────────────────────────────────────────────────────────

def test_select_stale_returns_only_old_rows():
    fresh = {"product_id": "fresh",
             "scraped_date": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()}
    stale = {"product_id": "stale",
             "scraped_date": (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()}
    missing = {"product_id": "missing"}
    out = select_stale([fresh, stale, missing], max_age_days=14)
    assert [p["product_id"] for p in out] == ["stale", "missing"]


# ── group_by_source ──────────────────────────────────────────────────────────

def test_group_by_source_buckets_correctly():
    products = [
        {"product_id": "a", "source": "amazon.in"},
        {"product_id": "b", "source": "flipkart.com"},
        {"product_id": "c", "source": "amazon.in"},
        {"product_id": "d"},  # missing source -> "unknown"
    ]
    out = group_by_source(products)
    assert sorted(out.keys()) == ["amazon.in", "flipkart.com", "unknown"]
    assert {p["product_id"] for p in out["amazon.in"]} == {"a", "c"}
    assert {p["product_id"] for p in out["unknown"]} == {"d"}


# ── load_catalog ─────────────────────────────────────────────────────────────

def test_load_catalog_missing_file_raises(tmp_path: Path):
    with pytest.raises(FileNotFoundError):
        load_catalog(tmp_path / "nope.json")


def test_load_catalog_non_list_raises(tmp_path: Path):
    p = tmp_path / "cat.json"
    p.write_text(json.dumps({"not": "a list"}))
    with pytest.raises(ValueError):
        load_catalog(p)


def test_load_catalog_happy_path(tmp_path: Path):
    p = tmp_path / "cat.json"
    p.write_text(json.dumps([{"product_id": "x"}]))
    assert load_catalog(p) == [{"product_id": "x"}]
