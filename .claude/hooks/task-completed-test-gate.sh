#!/bin/bash
# TaskCompleted hook: テスト・lint通過を強制
# exit 2 でタスク完了を阻止し、フィードバックを返す

cd "$(dirname "$0")/../.." || exit 0

if ! docker compose run --rm app pnpm test 2>&1; then
  echo "Tests not passing. Fix failing tests before completing this task." >&2
  exit 2
fi

if ! docker compose run --rm app pnpm lint 2>&1; then
  echo "Lint errors found. Fix lint issues before completing this task." >&2
  exit 2
fi

exit 0
