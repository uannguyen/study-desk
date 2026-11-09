#!/usr/bin/env bash
# Lấy sơ đồ + thẻ mới từ interview-pre, commit web/ và push (Vercel tự deploy khi có push).
set -euo pipefail
cd "$(dirname "$0")"

python3 build.py
git add -A web
if git diff --cached --quiet; then
  echo "Không có gì mới."
  exit 0
fi
git diff --cached --stat | tail -1
git commit -q -m "sync: cập nhật sơ đồ và thẻ $(date +%F)"
if git remote | grep -q .; then
  git push -q && echo "Đã push, Vercel sẽ deploy."
else
  echo "Đã commit. Chưa có remote nên chưa push."
fi
