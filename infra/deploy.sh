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
COMPOSE="docker compose -f docker-compose.yml -f infra/docker-compose.prod.yml"

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

# 2. Build images locally (compose builds because of the prod override)
echo "▶ Building service images (will take ~5-7 min on a 4GB Droplet)"
DOCKER_BUILDKIT=0 $COMPOSE build --pull

# 3. Bring up stack (admin is in a profile, so it's skipped by default)
echo "▶ Starting stack"
$COMPOSE up -d --remove-orphans

# 4. Install the Caddyfile with the live IP substituted
echo "▶ Installing Caddyfile for $DOMAIN"
sed "s/168-144-151-227/$DASHED_IP/g" infra/Caddyfile > /etc/caddy/Caddyfile
caddy fmt --overwrite /etc/caddy/Caddyfile || true
systemctl reload caddy

# 5. Wait for backend to be ready
echo "▶ Waiting for backend health (max 180s — Spring Boot startup)"
for i in $(seq 1 60); do
    if curl -fsS -o /dev/null http://localhost:8080/api/products 2>/dev/null; then
        echo "  backend healthy after ${i} retries"
        break
    fi
    sleep 3
done

# 6. Show URL + container state
echo
echo "════════════════════════════════════════════════════════════"
echo "  ✓ Deploy complete"
echo
echo "  Public URL :  https://$DOMAIN"
echo
echo "  Containers:"
$COMPOSE ps
echo
echo "  Resource snapshot:"
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}\t{{.CPUPerc}}"
echo "════════════════════════════════════════════════════════════"
