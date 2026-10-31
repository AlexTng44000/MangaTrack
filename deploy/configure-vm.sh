#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
domain=${1:-}
if [[ ! "$domain" =~ ^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$ || "$domain" != *.* ]]; then
  echo 'Usage: bash deploy/configure-vm.sh mymangatracker.your-domain.tld' >&2
  exit 1
fi
if [[ -e .env.production ]]; then
  echo '.env.production already exists; preserve and edit it instead of overwriting.' >&2
  exit 1
fi
command -v openssl >/dev/null
umask 077
set -o noclobber
mmt_database_password=$(openssl rand -hex 24)
mmt_jwt_secret=$(openssl rand -hex 32)
sed -e "s|^SITE_ADDRESS=.*|SITE_ADDRESS=$domain|" \
    -e "s|^PUBLIC_ORIGIN=.*|PUBLIC_ORIGIN=https://$domain|" \
    -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$mmt_database_password|" \
    -e "s|^JWT_SECRET=.*|JWT_SECRET=$mmt_jwt_secret|" \
    deploy/production.env.example > .env.production
unset mmt_database_password mmt_jwt_secret
echo 'Created private .env.production with random database/JWT secrets. SMTP delivery remains disabled until configured.'
