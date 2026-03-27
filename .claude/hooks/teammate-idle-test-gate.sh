#!/bin/bash
# TeammateIdle hook: テスト・lint通過を確認してからアイドルを許可
# exit 2 でアイドルを阻止し、フィードバックを返す

cd "$(dirname "$0")/../.." || exit 0

if ! docker compose run --rm app pnpm test 2>&1; then
  echo "Tests not passing. Fix failing tests before going idle." >&2
  exit 2
fi

if ! docker compose run --rm app pnpm lint 2>&1; then
  echo "Lint errors found. Fix lint issues before going idle." >&2
  exit 2
fi

exit 0
