#!/usr/bin/env bash
# A2S MVP — deploy from /opt/a2s on a bootstrapped Droplet.
#
# Prerequisites:
#   - infra/bootstrap.sh has been run successfully
#   - /opt/a2s contains a `.env` with the required secrets (see .env.example)
#
# Usage:
#   cd /opt/a2s
#   bash infra/deploy.sh
#
# Idempotent: safe to re-run after pulling new commits.

set -euo pipefail

REPO_DIR=/opt/a2s
DROPLET_IP=$(curl -fsSL https://ipv4.icanhazip.com)
DASHED_IP=${DROPLET_IP//./-}
DOMAIN="${DASHED_IP}.sslip.io"

cd "$REPO_DIR"

# 1. .env sanity check
if [ ! -f .env ]; then
    echo "✗ .env missing at $REPO_DIR/.env"
    echo "  Copy .env.example to .env and fill in:"
    echo "    OPENROUTER_API_KEY, GEMINI_API_KEY, JWT_SECRET, GOOGLE_CLIENT_ID/SECRET (optional), OAUTH2_REDIRECT_URI"
    exit 1
fi
echo "✓ .env present"

# 2. Bring up the stack with the prod override
echo "▶ Pulling base images + building services"
docker compose -f docker-compose.yml -f infra/docker-compose.prod.yml pull --quiet || true
docker compose -f docker-compose.yml -f infra/docker-compose.prod.yml build --pull

echo "▶ Starting stack"
docker compose -f docker-compose.yml -f infra/docker-compose.prod.yml up -d --remove-orphans

# 3. Install the Caddyfile with the live IP substituted
echo "▶ Installing Caddyfile for $DOMAIN"
sed "s/168-144-151-227/$DASHED_IP/g" infra/Caddyfile > /etc/caddy/Caddyfile
caddy fmt --overwrite /etc/caddy/Caddyfile || true
systemctl reload caddy

# 4. Wait for backend to be ready before catalog seed
echo "▶ Waiting for backend health (max 120s)"
for i in $(seq 1 40); do
    if curl -fsS -o /dev/null http://localhost:8080/api/products; then
        echo "  backend healthy after ${i} retries"
        break
    fi
    sleep 3
done

# 5. Show URL + container state
echo
echo "════════════════════════════════════════════════════════════"
echo "  ✓ Deploy complete"
echo
echo "  Public URL :  https://$DOMAIN"
echo "  Direct API :  http://$DROPLET_IP:8080/api/products  (loopback only — needs SSH tunnel)"
echo
echo "  Containers:"
docker compose -f docker-compose.yml -f infra/docker-compose.prod.yml ps
echo "════════════════════════════════════════════════════════════"
