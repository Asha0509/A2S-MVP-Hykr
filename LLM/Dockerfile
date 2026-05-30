FROM python:3.11-slim

WORKDIR /app

ENV PIP_REQUIRE_HASHES=0

RUN apt-get update && apt-get install -y \
    build-essential \
    freetds-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch==2.3.1 torchvision==0.18.1
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5001

CMD ["python", "api.py"]
