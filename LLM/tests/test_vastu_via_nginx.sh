#!/bin/bash
python3 << 'PYSCRIPT'
from PIL import Image

img = Image.new('RGB', (512, 512), (180, 180, 180))
img.save('/tmp/test.jpg', 'JPEG')
print('Test image created')
PYSCRIPT

TOKEN="eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJyaXZhczIyNTU4OEBnbWFpbC5jb20iLCJpYXQiOjE3NzUxMjM4NzgsImV4cCI6MTc3NTIxMDI3OH0.b4xmb7WPUADiDVCTdPl53VzgcpLsoxUCJMxo9Mg5DLs"

echo "=== Testing via nginx (frontend) ==="
curl -v -X POST "http://localhost/api/vastu/analyse" \
  -H "Authorization: Bearer $TOKEN" \
  -F "room_type=Living Room" \
  -F "facing_direction=Auto detect" \
  -F "floor=1" \
  -F "images=@/tmp/test.jpg" \
  2>&1 | head -100