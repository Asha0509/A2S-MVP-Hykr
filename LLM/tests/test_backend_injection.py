#!/usr/bin/env python3
"""
Test backend product injection with sample catalog.
"""

import os
import json
import sys

import requests


def test_backend_injection():
    with open(os.path.join(os.path.dirname(__file__), "..", "sample_catalog.json"), "r", encoding="utf-8") as f:
        payload = json.load(f)

    print("\n" + "=" * 70)
    print("  🧪 TESTING BACKEND PRODUCT INJECTION")
    print("=" * 70)
    print(f"  Payload size: {len(payload)} products")
    print("  Backend URL: http://localhost:8080")
    print("=" * 70 + "\n")

    for i, product in enumerate(payload, 1):
        if "roomType" not in product:
            print(f"❌ Product {i} missing roomType field!")
            return False

    response = requests.post("http://localhost:8080/api/products/import", json=payload, timeout=30)
    response.raise_for_status()
    result = response.json()
    print(f"✅ Backend response: created={result.get('created', 0)} updated={result.get('updated', 0)} total={result.get('total', 0)}")
    return True


if __name__ == "__main__":
    raise SystemExit(0 if test_backend_injection() else 1)