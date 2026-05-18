#!/bin/bash
set -e

GREEN="\033[32m"
BLUE="\033[34m"
YELLOW="\033[33m"
RESET="\033[0m"

echo -e "${BLUE}<==> Starting FULL production setup... <==>${RESET}"

# =========================
# UPDATE SYSTEM
# =========================
echo -e "${YELLOW}==> Updating packages...${RESET}"
sudo apt-get update -y

# =========================
# NODE INSTALL
# =========================
echo -e "${YELLOW}==> Installing Node.js...${RESET}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# =========================
# BASE PACKAGES
# =========================
echo -e "${YELLOW}==> Installing base packages...${RESET}"
sudo apt-get install -y python3 python3-pip nginx certbot python3-certbot-nginx

# =========================
# PNPM
# =========================
echo -e "${YELLOW}==> Installing PNPM...${RESET}"
sudo npm install -g pnpm

# =========================
# VERIFY
# =========================
echo -e "${GREEN}Node:${RESET}"
node -v
npm -v

echo -e "${GREEN}Python:${RESET}"
python3 -V

# =========================
# PYTHON DEPENDENCIES
# =========================
echo -e "${YELLOW}==> Installing Python requirements...${RESET}"
python3 -m pip install --upgrade pip
pip install -r python/python_txt_file/requirements.txt

# =========================
# NODE DEPENDENCIES
# =========================
echo -e "${YELLOW}==> Installing Node dependencies...${RESET}"
pnpm install --frozen-lockfile

# =========================
# ENV CHECK
# =========================
echo -e "${YELLOW}==> Checking env file...${RESET}"
if [ ! -f ".env.productions" ]; then
    echo -e "${YELLOW}Missing .env.productions file${RESET}"
    exit 1
fi

# =========================
# BUILD NEXT.JS
# =========================
echo -e "${BLUE}==> Building Next.js... <==${RESET}"
pnpm run lint
pnpm run build

# =========================
# NGINX SETUP
# =========================
echo -e "${YELLOW}==> Configuring Nginx...${RESET}"

sudo rm -f /etc/nginx/sites-enabled/default

sudo tee /etc/nginx/sites-available/app > /dev/null <<EOF
server {
    listen 80;
    server_name yourdomain.com;

    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/app /etc/nginx/sites-enabled/app

sudo nginx -t
sudo systemctl restart nginx

# =========================
# START BACKENDS
# =========================
echo -e "${GREEN}==> Starting FastAPI...${RESET}"
nohup uvicorn python.main:app \
  --host 127.0.0.1 \
  --port 8000 \
  --workers 2 \
  >> /tmp/fastapi.log 2>&1 &
disown

echo -e "${GREEN}==> Starting Next.js...${RESET}"
nohup pnpm run start >> /tmp/next.log 2>&1 &
disown

# =========================
# HTTPS SETUP (CERTBOT)
# =========================
echo -e "${YELLOW}==> Enabling HTTPS (Certbot)...${RESET}"

sudo certbot --nginx \
  -d yourdomain.com \
  --non-interactive \
  --agree-tos \
  -m youremail@example.com \
  --redirect

# =========================
# AUTO RENEW
# =========================
echo -e "${YELLOW}==> Enabling auto-renew...${RESET}"
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# =========================
# DONE
# =========================
echo -e "${BLUE}<==> SERVER READY 🚀 HTTPS + Nginx + API + Next.js <==>${RESET}"
echo -e "${GREEN}https://yourdomain.com${RESET}"