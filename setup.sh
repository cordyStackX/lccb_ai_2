#!/bin/bash
set -e

GREEN="\033[32m"
BLUE="\033[34m"
YELLOW="\033[33m"
RESET="\033[0m"

echo -e "${BLUE}<==> Starting installation... <==>${RESET}"

# Update package lists
echo -e "${YELLOW}==> Updating package lists...${RESET}"
sudo apt-get update
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install essential packages (optional if already present in Codespaces)
echo -e "${YELLOW}==> Installing Essential Packages...${RESET}"

sudo apt-get install -y nodejs python3 python3-pip

# Verify installations

echo -e "${GREEN}==> Checking Node.js version:${RESET}"
node -v
npm -v
npx -v

echo -e "${YELLOW}==> Installing NPM packages...${RESET}"
sudo npm install -g pnpm
pnpm install

echo -e "${GREEN}==> Python version:${RESET}"
python3 -V

# Upgrade pip
echo -e "${YELLOW}==> Upgrading pip...${RESET}"
python3 -m pip install --upgrade pip

# Install Python packages
echo -e "${YELLOW}==> Installing Python packages...${RESET}"
pip install -r python/requirements.txt

echo -e "${BLUE}<==> Building Next.js app... <==>${RESET}"
echo -e "${YELLOW}==> Running lint...${RESET}"
pnpm run lint
echo -e "${YELLOW}==> Running build...${RESET}"
pnpm run build

# Start FastAPI in background
echo -e "${GREEN}==> Starting FastAPI server...${RESET}"
nohup python3 python/main.py >> /tmp/fastapi.log 2>&1 & disown

# Start Next.js server (this will block)
echo -e "${GREEN}==> Starting Next.js at http://localhost:3000...${RESET}"
pnpm run start