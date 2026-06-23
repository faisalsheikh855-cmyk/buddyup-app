#!/usr/bin/env bash
# Build the Expo web export and publish it to the gh-pages branch,
# which GitHub Pages serves at https://faisalsheikh855-cmyk.github.io/buddyup-app/
#
# Usage: npm run deploy:web   (or: bash scripts/deploy-web.sh)
#
# Requires .env.local with EXPO_PUBLIC_SUPABASE_URL and
# EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. The publishable key is RLS-protected
# and safe to embed in a public browser build.
set -euo pipefail

BASE_PATH="${EXPO_BASE_URL:-/buddyup-app}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REMOTE="$(git config --get remote.origin.url)"
SRC_SHA="$(git rev-parse --short HEAD)"

echo "==> Building web export (base path: $BASE_PATH)"
rm -rf dist
EXPO_BASE_URL="$BASE_PATH" npm run build:web

echo "==> Preparing GitHub Pages files"
cp dist/index.html dist/404.html   # SPA fallback so deep links don't 404
touch dist/.nojekyll               # serve _expo/ and underscore dirs verbatim

echo "==> Publishing dist/ to gh-pages"
(
  cd dist
  rm -rf .git
  git init -q
  git checkout -q -b gh-pages
  git add -A
  git -c user.name="aigfsol" -c user.email="arnav23apr@gmail.com" \
    commit -qm "Deploy buddyup web app ($SRC_SHA)"
  git push --force "$REMOTE" gh-pages
)

echo "==> Done. Live in ~1-2 min at:"
echo "    https://faisalsheikh855-cmyk.github.io/buddyup-app/"
