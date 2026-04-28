#!/usr/bin/env bash
# deploy.sh — Apply database migrations then deploy the frontend to Vercel.
#
# Usage:
#   ./scripts/deploy.sh                  # full deploy (migrate + build + deploy)
#   ./scripts/deploy.sh --migrate-only   # apply SQL migrations only
#   ./scripts/deploy.sh --deploy-only    # skip migrations, deploy frontend only
#
# Prerequisites:
#   - Supabase CLI installed:  npm install -g supabase  (or brew install supabase/tap/supabase)
#   - Vercel CLI installed:    npm install -g vercel
#   - pnpm installed:          npm install -g pnpm
#   - SUPABASE_DB_URL env var set (Postgres connection string from Supabase dashboard)
#     Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
#   - Vercel project linked:   cd packages/frontend && vercel link
#
# Environment variables:
#   SUPABASE_DB_URL   — Direct Postgres connection string (required for migrations)
#   VERCEL_TOKEN      — Vercel deploy token (optional; uses interactive login if not set)
#   VERCEL_ORG_ID     — Vercel org/team ID (optional; reads from .vercel/project.json)
#   VERCEL_PROJECT_ID — Vercel project ID (optional; reads from .vercel/project.json)
#
set -euo pipefail

# ── Colours for output ──────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Colour

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ── Resolve repo root (script lives in <root>/scripts/) ─────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SCHEMA_DIR="$REPO_ROOT/packages/backend/src/db/schema"
FRONTEND_DIR="$REPO_ROOT/packages/frontend"

# ── Parse flags ──────────────────────────────────────────────
MIGRATE_ONLY=false
DEPLOY_ONLY=false

for arg in "$@"; do
  case "$arg" in
    --migrate-only) MIGRATE_ONLY=true ;;
    --deploy-only)  DEPLOY_ONLY=true ;;
    --help|-h)
      echo "Usage: $0 [--migrate-only | --deploy-only | --help]"
      exit 0
      ;;
    *)
      error "Unknown flag: $arg"
      echo "Usage: $0 [--migrate-only | --deploy-only | --help]"
      exit 1
      ;;
  esac
done

# ── Step 1: Apply database migrations ────────────────────────
run_migrations() {
  info "Starting database migrations..."

  if [ -z "${SUPABASE_DB_URL:-}" ]; then
    error "SUPABASE_DB_URL is not set."
    error "Set it to your Supabase Postgres connection string:"
    error "  export SUPABASE_DB_URL='postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres'"
    exit 1
  fi

  if ! command -v psql &>/dev/null; then
    error "psql is not installed. Install PostgreSQL client tools."
    error "  macOS:   brew install libpq && brew link --force libpq"
    error "  Ubuntu:  sudo apt-get install postgresql-client"
    error "  Windows: Install PostgreSQL or use the Supabase Dashboard SQL Editor instead."
    exit 1
  fi

  # Apply each SQL file in order (001 → 008)
  local migration_files
  migration_files=$(find "$SCHEMA_DIR" -name '*.sql' -not -name '007_seed*' | sort)

  if [ -z "$migration_files" ]; then
    warn "No migration files found in $SCHEMA_DIR"
    return 0
  fi

  local failed=0
  for sql_file in $migration_files; do
    local filename
    filename=$(basename "$sql_file")
    info "  Applying: $filename"
    if psql "$SUPABASE_DB_URL" -f "$sql_file" --quiet --no-psqlrc 2>&1; then
      info "  ✓ $filename applied successfully"
    else
      error "  ✗ $filename failed"
      failed=1
    fi
  done

  if [ "$failed" -ne 0 ]; then
    error "One or more migrations failed. Fix the errors above before deploying."
    exit 1
  fi

  info "All migrations applied successfully."
}

# ── Step 2: Build and deploy frontend ────────────────────────
deploy_frontend() {
  info "Starting frontend deployment..."

  # Check prerequisites
  if ! command -v pnpm &>/dev/null; then
    error "pnpm is not installed. Run: npm install -g pnpm"
    exit 1
  fi

  if ! command -v vercel &>/dev/null; then
    error "Vercel CLI is not installed. Run: npm install -g vercel"
    exit 1
  fi

  # Install dependencies
  info "  Installing dependencies..."
  (cd "$REPO_ROOT" && pnpm install --frozen-lockfile)

  # Build the frontend
  info "  Building frontend..."
  (cd "$FRONTEND_DIR" && pnpm run build)

  if [ $? -ne 0 ]; then
    error "Frontend build failed. Fix build errors before deploying."
    exit 1
  fi

  info "  Build successful. Deploying to Vercel..."

  # Deploy to Vercel
  local vercel_args="--prod"

  if [ -n "${VERCEL_TOKEN:-}" ]; then
    vercel_args="$vercel_args --token $VERCEL_TOKEN"
  fi

  (cd "$FRONTEND_DIR" && vercel $vercel_args)

  if [ $? -ne 0 ]; then
    error "Vercel deployment failed."
    exit 1
  fi

  info "Frontend deployed successfully."
}

# ── Main ─────────────────────────────────────────────────────
main() {
  info "=== Appointment Booking System — Deploy ==="
  info ""

  if [ "$DEPLOY_ONLY" = true ]; then
    warn "Skipping migrations (--deploy-only)"
  else
    run_migrations
  fi

  info ""

  if [ "$MIGRATE_ONLY" = true ]; then
    warn "Skipping frontend deploy (--migrate-only)"
  else
    deploy_frontend
  fi

  info ""
  info "=== Deploy complete ==="
}

main
