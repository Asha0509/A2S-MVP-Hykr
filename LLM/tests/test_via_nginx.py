#!/usr/bin/env python3
import io

import requests
from PIL import Image


img = Image.new("RGB", (512, 512), (180, 180, 180))
b = io.BytesIO()
img.save(b, format="JPEG")
b.seek(0)

token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJyaXZhczIyNTU4OEBnbWFpbC5jb20iLCJpYXQiOjE3NzUxMjM4NzgsImV4cCI6MTc3NTIxMDI3OH0.b4xmb7WPUADiDVCTdPl53VzgcpLsoxUCJMxo9Mg5DLs"

files = [("images", ("test.jpg", b.getvalue(), "image/jpeg"))]
data = {
    "room_type": "Living Room",
    "facing_direction": "Auto detect",
    "floor": "1",
}
headers = {"Authorization": f"Bearer {token}"}

print("=== Testing via nginx (frontend reverseproxy) ===")
try:
    r = requests.post("http://a2s-frontend/api/vastu/analyse", data=data, files=files, headers=headers, timeout=60)
    print(f"STATUS CODE: {r.status_code}")
    print(f"RESPONSE HEADERS: {dict(r.headers)}")
    print(f"RESPONSE BODY:\n{r.text}")
except Exception as e:
    import traceback
    print(f"ERROR: {str(e)}")
    traceback.print_exc()