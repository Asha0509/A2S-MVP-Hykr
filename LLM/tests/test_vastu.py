#!/usr/bin/env python3
import io
import json

import requests
from PIL import Image


img = Image.new("RGB", (512, 512), (180, 180, 180))
b = io.BytesIO()
img.save(b, format="JPEG")
b.seek(0)

files = [("images", ("test.jpg", b.getvalue(), "image/jpeg"))]
data = {"room_type": "Living Room", "facing_direction": "Auto detect"}

try:
    r = requests.post("http://localhost:5001/api/vastu/analyse", data=data, files=files, timeout=45)
    print(f"STATUS: {r.status_code}")
    print(f"Headers: {dict(r.headers)}")
    if r.status_code != 200:
        print(f"ERROR: {r.text[:2000]}")
    else:
        print("SUCCESS")
        try:
            resp_json = r.json()
            print(json.dumps(resp_json, indent=2)[:1500])
        except Exception:
            print(r.text[:1500])
except Exception as e:
    import traceback
    print(f"EXCEPTION: {str(e)}")
    traceback.print_exc()