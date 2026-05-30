#!/usr/bin/env python3
import io

import requests
from PIL import Image


img = Image.new("RGB", (512, 512), (180, 180, 180))
b = io.BytesIO()
img.save(b, format="JPEG")
b.seek(0)

files = [("images", ("test.jpg", b.getvalue(), "image/jpeg"))]
data = {
    "room_type": "Living Room",
    "facing_direction": "Auto detect",
    "userId": "test-user-123",
    "floor": "1",
}

print("Testing backend Vastu endpoint...")
try:
    r = requests.post("http://localhost:8080/api/vastu/analyse", data=data, files=files, timeout=45)
    print(f"STATUS: {r.status_code}")
    if r.status_code >= 400:
        print(f"ERROR RESPONSE:\n{r.text[:3000]}")
    else:
        print("SUCCESS - Response received")
        try:
            resp = r.json()
            print(f"Keys: {list(resp.keys())}")
        except Exception:
            pass
except Exception as e:
    print(f"EXCEPTION: {str(e)}")