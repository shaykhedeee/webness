#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
# Webness OS — Oracle Cloud VPS Setup Script
# Ubuntu 24.04 LTS ARM (4 OCPUs, 24GB RAM)
# Run as root: sudo bash setup-vps.sh
# ─────────────────────────────────────────────────────────

set -euo pipefail

echo "🚀 Webness OS — VPS Setup Starting..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─── System Updates ────────────────────────────────────────
echo "📦 Updating system..."
apt update && apt upgrade -y
apt install -y curl wget git build-essential unzip software-properties-common \
  ca-certificates gnupg lsb-release ufw fail2ban

# ─── Create webness user ──────────────────────────────────
echo "👤 Creating webness user..."
if ! id "webness" &>/dev/null; then
  adduser --disabled-password --gecos "Webness" webness
  usermod -aG sudo webness
  echo "webness ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/webness
fi

# Create log directory
mkdir -p /home/webness/logs
chown webness:webness /home/webness/logs

# ─── Firewall (UFW) ───────────────────────────────────────
echo "🔥 Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
# Do NOT expose 3000-3003 directly — nginx handles reverse proxy
ufw --force enable

# ─── Fail2Ban ─────────────────────────────────────────────
echo "🛡️ Configuring Fail2Ban..."
cat > /etc/fail2ban/jail.local << 'JAIL'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400

[nginx-req-limit]
enabled = true
filter = nginx-req-limit
logpath = /var/log/nginx/*.log
findtime = 600
maxretry = 10
bantime = 7200
JAIL

cat > /etc/fail2ban/filter.d/nginx-req-limit.conf << 'FILTER'
[Definition]
failregex = limiting requests, excess:.* by zone.*client: <HOST>
FILTER

systemctl enable fail2ban
systemctl restart fail2ban

# ─── Node.js 22 LTS ───────────────────────────────────────
echo "📗 Installing Node.js 22 LTS..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# ─── pnpm ─────────────────────────────────────────────────
echo "📦 Installing pnpm..."
npm install -g pnpm@latest

# ─── PM2 ──────────────────────────────────────────────────
echo "⚙️ Installing PM2..."
npm install -g pm2
pm2 startup systemd -u webness --hp /home/webness

# ─── PostgreSQL 16 ─────────────────────────────────────────
echo "🐘 Installing PostgreSQL 16..."
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
apt update
apt install -y postgresql-16 postgresql-16-pgvector

# Configure PostgreSQL
sudo -u postgres psql -c "CREATE USER webness WITH PASSWORD 'CHANGE_ME_STRONG_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE webness_db OWNER webness;"
sudo -u postgres psql -d webness_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
sudo -u postgres psql -d webness_db -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

# Tune PostgreSQL for 24GB RAM
cat >> /etc/postgresql/16/main/conf.d/webness.conf << 'PGCONF'
# Webness OS tuning (24GB RAM, 4 OCPUs)
shared_buffers = 6GB
effective_cache_size = 18GB
maintenance_work_mem = 1GB
work_mem = 64MB
max_connections = 200
max_worker_processes = 4
max_parallel_workers_per_gather = 2
max_parallel_workers = 4
random_page_cost = 1.1
effective_io_concurrency = 200
PGCONF

systemctl restart postgresql

# ─── Redis 7 ──────────────────────────────────────────────
echo "🔴 Installing Redis 7..."
curl -fsSL https://packages.redis.io/gpg | gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/redis.list
apt update
apt install -y redis-server

# Configure Redis
sed -i 's/^# maxmemory .*/maxmemory 2gb/' /etc/redis/redis.conf
sed -i 's/^# maxmemory-policy .*/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf
sed -i 's/^bind .*/bind 127.0.0.1 ::1/' /etc/redis/redis.conf
# Set Redis password
REDIS_PASS=$(openssl rand -hex 32)
sed -i "s/^# requirepass .*/requirepass ${REDIS_PASS}/" /etc/redis/redis.conf
echo "🔑 Redis password: ${REDIS_PASS}" >> /home/webness/credentials.txt
chmod 600 /home/webness/credentials.txt
chown webness:webness /home/webness/credentials.txt

systemctl enable redis-server
systemctl restart redis-server

# ─── Nginx ─────────────────────────────────────────────────
echo "🌐 Installing Nginx..."
apt install -y nginx

# SSL params snippet
cat > /etc/nginx/snippets/ssl-params.conf << 'SSL'
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_stapling on;
ssl_stapling_verify on;
resolver 1.1.1.1 1.0.0.1 valid=300s;
resolver_timeout 5s;
SSL

# Copy nginx config (from infra/nginx/webness.conf after git clone)
echo "⚠️  Copy webness.conf to /etc/nginx/sites-available/ after cloning repo"

systemctl enable nginx

# ─── Certbot (Let's Encrypt) ──────────────────────────────
echo "🔐 Installing Certbot..."
apt install -y certbot python3-certbot-nginx

echo "⚠️  Run after DNS is pointed:"
echo "  certbot --nginx -d app.webness.in -d admin.webness.in"

# ─── Swap File (safety net) ───────────────────────────────
echo "💾 Creating 4GB swap..."
if [ ! -f /swapfile ]; then
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ─── Summary ──────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Webness OS VPS Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Installed:"
echo "  • Node.js $(node --version)"
echo "  • pnpm $(pnpm --version)"
echo "  • PostgreSQL 16 + pgvector"
echo "  • Redis 7"
echo "  • Nginx"
echo "  • PM2"
echo "  • Certbot"
echo "  • UFW + Fail2Ban"
echo ""
echo "Next steps:"
echo "  1. Clone repo:    su - webness && git clone <repo> ~/webness-os"
echo "  2. Install deps:  cd ~/webness-os && pnpm install"
echo "  3. Setup .env:    cp .env.example .env && nano .env"
echo "  4. Run migrations: pnpm db:push && pnpm db:seed"
echo "  5. Build:         pnpm build"
echo "  6. Nginx config:  cp infra/nginx/webness.conf /etc/nginx/sites-available/"
echo "  7. SSL:           certbot --nginx -d app.webness.in -d admin.webness.in"
echo "  8. Start:         pm2 start infra/pm2/ecosystem.config.cjs"
echo "  9. Save PM2:      pm2 save"
echo ""
echo "Credentials saved to: /home/webness/credentials.txt"
