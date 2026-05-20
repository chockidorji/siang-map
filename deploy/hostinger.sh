#!/usr/bin/env bash
# Deploy siang-mou-map to https://pfr.dhpdap.online/ (Hostinger VPS).
#
# Run from anywhere — the script cd's to the repo root by itself.
#
# Notes:
#   - vite.config.ts sets base='/siang-map/' for the GitHub Pages mirror.
#     This script overrides with --base=/ at build time, so the config file
#     stays correct for GH Pages.
#   - Uses rsync --delay-updates --delete-delay so the live site never has a
#     moment where the new index.html references not-yet-uploaded assets.

set -euo pipefail

SSH_KEY="${HOME}/.ssh/id_ed25519_hostinger_auto"
SSH_HOST="root@srv1332547.hstgr.cloud"
REMOTE_DIR="/var/www/siang-pfr"
URL="https://pfr.dhpdap.online/"
PROJECT_DIR="siang-mou-map"

cd "$(dirname "$0")/.."

log() { printf '==> %s\n' "$*"; }
fail() { printf 'FATAL: %s\n' "$*" >&2; exit 1; }

log "Pre-flight checks"
[[ -f "${SSH_KEY}" ]] || fail "SSH key not found at ${SSH_KEY}"
[[ -d "${PROJECT_DIR}" ]] || fail "project dir '${PROJECT_DIR}' not found (cwd=$(pwd))"
command -v rsync >/dev/null || fail "rsync not installed"
command -v npm >/dev/null || fail "npm not installed"

ssh -i "${SSH_KEY}" -o BatchMode=yes -o ConnectTimeout=10 "${SSH_HOST}" "true" \
  || fail "cannot SSH to ${SSH_HOST} with ${SSH_KEY}"

# Require >200 MB free on /var/www so we don't half-fill the disk.
FREE_KB=$(ssh -i "${SSH_KEY}" "${SSH_HOST}" "df -k --output=avail /var/www | tail -1 | tr -d ' '")
if [[ "${FREE_KB}" =~ ^[0-9]+$ ]] && (( FREE_KB < 200000 )); then
  fail "server has only ${FREE_KB} KB free on /var/www (need >=200000)"
fi

# Warn (don't block) if working tree has uncommitted siang-mou-map changes —
# means the deploy can't be reproduced from git later.
if ! git diff --quiet HEAD -- "${PROJECT_DIR}" 2>/dev/null \
   || ! git diff --quiet --cached HEAD -- "${PROJECT_DIR}" 2>/dev/null; then
  printf 'WARN: %s has uncommitted changes — deploying current working tree\n' "${PROJECT_DIR}" >&2
fi

log "Building ${PROJECT_DIR} (--base=/)"
(
  cd "${PROJECT_DIR}"
  rm -rf dist
  npm ci --silent
  npm run build -- --base=/
)

log "Validating build output"
DIST="${PROJECT_DIR}/dist"
[[ -f "${DIST}/index.html" ]] || fail "${DIST}/index.html missing — build produced no entry point"

# Must NOT contain the GH Pages base path — that would 404 on pfr.dhpdap.online.
if grep -q '/siang-map/' "${DIST}/index.html"; then
  fail "${DIST}/index.html still references /siang-map/ — --base=/ override didn't take"
fi

# Find the hashed JS bundle and confirm it actually exists on disk.
JS_BUNDLE=$(grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' "${DIST}/index.html" | head -1)
[[ -n "${JS_BUNDLE}" ]] || fail "couldn't find JS bundle reference in ${DIST}/index.html"
[[ -f "${DIST}${JS_BUNDLE}" ]] || fail "JS bundle ${JS_BUNDLE} missing from ${DIST}/"

log "Uploading to ${SSH_HOST}:${REMOTE_DIR}"
# --delay-updates: stage in .~tmp~/, rename at end → near-atomic per-file
# --delete-delay:  defer deletions until after uploads, same reason
# --chmod:         force perms so nginx can always read (no 403s from a stray 0600)
rsync -av \
  --delay-updates \
  --delete-delay \
  --chmod=Du=rwx,Dgo=rx,Fu=rw,Fgo=r \
  -e "ssh -i ${SSH_KEY}" \
  "${DIST}/" "${SSH_HOST}:${REMOTE_DIR}/"

log "Smoke test"
# Brief settle — rsync rename is atomic but nginx open_file_cache may briefly
# hold a stale stat result for the root index.html on busy servers.
sleep 1

HTTP_CODE=$(curl -s --max-time 15 -o /dev/null -w "%{http_code}" "${URL}")
[[ "${HTTP_CODE}" == "200" ]] || fail "${URL} returned HTTP ${HTTP_CODE} (expected 200)"

LIVE_BUNDLE=$(curl -s --max-time 15 "${URL}" | grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' | head -1)
[[ "${LIVE_BUNDLE}" == "${JS_BUNDLE}" ]] \
  || fail "live HTML references ${LIVE_BUNDLE:-<none>} but we built ${JS_BUNDLE}"

ASSET_CODE=$(curl -s --max-time 15 -o /dev/null -w "%{http_code}" "https://pfr.dhpdap.online${JS_BUNDLE}")
[[ "${ASSET_CODE}" == "200" ]] || fail "asset ${JS_BUNDLE} returned HTTP ${ASSET_CODE}"

# Probe one geojson too — these are loaded at runtime, a missing one = blank map.
GEO_CODE=$(curl -s --max-time 15 -o /dev/null -w "%{http_code}" "https://pfr.dhpdap.online/geo/district-siang.geojson")
[[ "${GEO_CODE}" == "200" ]] || fail "geo/district-siang.geojson returned HTTP ${GEO_CODE}"

log "Deploy OK"
printf '    URL:    %s\n' "${URL}"
printf '    Bundle: %s\n' "${JS_BUNDLE}"
printf '    Commit: %s\n' "$(git rev-parse --short HEAD)"
