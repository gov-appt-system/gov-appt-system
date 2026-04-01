#!/usr/bin/env bash
# setup.sh — run once after cloning to get the project ready
set -e

echo "==> Checking prerequisites..."

if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is not installed. Install Node 18+ from https://nodejs.org"
  exit 1
fi

NODE_MAJOR=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "ERROR: Node.js 18+ required (found $(node -v))"
  exit 1
fi

if ! command -v pnpm &>/dev/null; then
  echo "==> pnpm not found. Installing..."
  npm install -g pnpm
fi

echo "==> Installing dependencies..."
pnpm install

echo "==> Setting up backend environment..."
if [ ! -f packages/backend/.env ]; then
  cp packages/backend/.env.example packages/backend/.env
  echo "  Created packages/backend/.env — fill in your values before running the app."
else
  echo "  packages/backend/.env already exists, skipping."
fi

echo ""
echo "Done. Next steps:"
echo "  1. Edit packages/backend/.env with your Supabase credentials"
echo "  2. Run migrations:  cd packages/backend && pnpm run migrate"
echo "  3. (Optional) Seed: cd packages/backend && pnpm run seed"
echo "  4. Start backend:   cd packages/backend && pnpm run dev"
