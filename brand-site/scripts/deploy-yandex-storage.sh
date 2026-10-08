#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUCKET="${BRAND_SITE_BUCKET:-brand-site-frontend}"
CDN_RESOURCE_ID="${BRAND_SITE_CDN_RESOURCE_ID:-bc8re4mba3htlaup7sa5}"

cd "$ROOT"

echo "Building brand-site…"
VITE_BADMINTON_USE_MOCKS=false \
VITE_BADMINTON_SHOW_MOCK_USERS=false \
VITE_BADMINTON_API_BASE_URL=https://badminton-service.website \
VITE_YANDEX_OAUTH_CLIENT_ID="${VITE_YANDEX_OAUTH_CLIENT_ID:-f438411329254ba6a65baf6ff00ba62d}" \
  npm run build

DIST="$ROOT/dist"
if [[ ! -d "$DIST" ]]; then
  echo "dist/ not found after build" >&2
  exit 1
fi

echo "Ensuring website settings (SPA error → index.html)…"
yc storage bucket update "$BUCKET" \
  --website-settings '{"index":"index.html","error":"index.html"}' >/dev/null

echo "Uploading dist/ → bucket $BUCKET …"
# Drop previous objects (best-effort) then upload fresh tree.
while IFS= read -r key; do
  [[ -z "$key" ]] && continue
  yc storage s3api delete-object --bucket "$BUCKET" --key "$key" >/dev/null || true
done < <(yc storage s3api list-objects --bucket "$BUCKET" --format json 2>/dev/null \
  | python3 -c 'import sys,json; data=json.load(sys.stdin) or {}; 
objs=data.get("contents") or data.get("Contents") or [];
print("\n".join(o.get("key") or o.get("Key") or "" for o in objs))' 2>/dev/null || true)

content_type_for() {
  case "$1" in
    *.html) echo "text/html; charset=utf-8" ;;
    *.js) echo "application/javascript; charset=utf-8" ;;
    *.css) echo "text/css; charset=utf-8" ;;
    *.json) echo "application/json; charset=utf-8" ;;
    *.svg) echo "image/svg+xml" ;;
    *.png) echo "image/png" ;;
    *.jpg|*.jpeg) echo "image/jpeg" ;;
    *.webp) echo "image/webp" ;;
    *.woff2) echo "font/woff2" ;;
    *.woff) echo "font/woff" ;;
    *.ico) echo "image/x-icon" ;;
    *.map) echo "application/json" ;;
    *) echo "application/octet-stream" ;;
  esac
}

while IFS= read -r -d '' file; do
  rel="${file#$DIST/}"
  ctype="$(content_type_for "$rel")"
  yc storage s3api put-object \
    --bucket "$BUCKET" \
    --key "$rel" \
    --body "$file" \
    --content-type "$ctype" >/dev/null
  echo "  + $rel"
done < <(find "$DIST" -type f -print0)

echo "Purging CDN cache ($CDN_RESOURCE_ID)…"
yc cdn cache purge --resource-id "$CDN_RESOURCE_ID" --all 2>/dev/null \
  || yc cdn cache purge --resource-id "$CDN_RESOURCE_ID" --path '/*' 2>/dev/null \
  || echo "CDN purge skipped (manual purge may be needed)"

echo "Done. https://app.badminton-service.website/"
