#!/bin/bash

# --- A2S Admin Terminal Launcher ---
# Independent of frontend/backend folders.
# Uses root .env for credentials.

# Set Working Directory
cd "$(dirname "$0")"

# Check if root venv exists
if [ -d "../venv" ]; then
    echo "[ADMIN] Using project's Python Virtual Environment."
    source ../venv/bin/activate
else
    echo "[ADMIN] Warning: No root venv found. Using system Python."
fi

# Install dependencies if needed
echo "[ADMIN] Checking for mandatory dependencies..."
pip install -r requirements.txt --quiet

# Launch Dashboard
echo "[ADMIN] Initializing Command Center..."
streamlit run admin_app.py --server.port 8501
