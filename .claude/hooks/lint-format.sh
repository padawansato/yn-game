#!/bin/bash

# PostToolUse hook for lint & format
# Runs asynchronously after Edit/Write operations

# Get the edited file path from environment variable
FILE_PATH="${CLAUDE_FILE_PATH:-}"

# Only process TypeScript, TSX, and Vue files
if [[ ! "$FILE_PATH" =~ \.(ts|tsx|vue)$ ]]; then
  exit 0
fi

# Run lint and format via Docker
cd "$(dirname "$0")/../.." || exit 1
docker compose run --rm app sh -c "pnpm lint && pnpm format"
