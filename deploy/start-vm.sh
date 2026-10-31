#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
if [[ ! -f .env.production ]]; then
  echo 'Create .env.production from deploy/production.env.example and configure domain and random secrets.' >&2
  exit 1
fi
compose=(docker compose --env-file .env.production -f compose.production.yml)
"${compose[@]}" config --quiet
"${compose[@]}" build backend web
"${compose[@]}" up -d --wait postgres redis
"${compose[@]}" run --rm migrate
"${compose[@]}" up -d --wait backend web
"${compose[@]}" ps
# Optional email worker, only after configuring real SMTP credentials:
# docker compose --env-file .env.production -f compose.production.yml --profile notifications up -d worker
