#!/usr/bin/env bash
# A2S MVP — Droplet bootstrap.
# Idempotent. Run as root on a fresh Ubuntu 22.04 / 24.04 DO Droplet.
#
# Usage:
#   ssh root@<DROPLET_IP>
#   curl -fsSL https://raw.githubusercontent.com/Asha0509/A2S-MVP-Hykr/main/infra/bootstrap.sh | bash
#   # ... then follow infra/deploy.sh

set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

echo "▶ A2S Droplet bootstrap starting at $(date -u)"

# 1. Refresh apt + base tools
apt-get update -qq
apt-get install -y -qq \
    ca-certificates curl gnupg lsb-release \
    git ufw debian-keyring debian-archive-keyring apt-transport-https

# 2. Docker engine + compose plugin
if ! command -v docker >/dev/null 2>&1; then
    echo "▶ Installing Docker"
    curl -fsSL https://get.docker.com | sh
else
    echo "✓ Docker already installed"
fi
systemctl enable --now docker

# 3. Caddy (Cloudsmith APT repo)
if ! command -v caddy >/dev/null 2>&1; then
    echo "▶ Installing Caddy"
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
        | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
        > /etc/apt/sources.list.d/caddy-stable.list
    apt-get update -qq
    apt-get install -y -qq caddy
else
    echo "✓ Caddy already installed"
fi
systemctl enable --now caddy

# 4. UFW firewall — SSH + HTTP + HTTPS only
echo "▶ Configuring UFW"
ufw --force reset >/dev/null
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
ufw allow 22/tcp  >/dev/null
ufw allow 80/tcp  >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null

# 5. Workspace dir
mkdir -p /opt/a2s
chown root:root /opt/a2s
mkdir -p /var/log/caddy

echo
echo "✓ Bootstrap complete."
echo
echo "Versions:"
docker --version
docker compose version
caddy version
echo
echo "Next step: run infra/deploy.sh after the repo is cloned to /opt/a2s."
