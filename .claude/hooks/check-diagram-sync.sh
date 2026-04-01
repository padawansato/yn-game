#!/bin/bash

# PreToolUse hook for Bash: git commit 時に spec 変更があるのに
# docs/diagrams が更新されていない場合に警告する

TOOL_INPUT="${CLAUDE_TOOL_INPUT:-}"

# git commit コマンド以外は無視
if ! echo "$TOOL_INPUT" | grep -q 'git commit'; then
  exit 0
fi

# staged files を取得
STAGED=$(git diff --cached --name-only 2>/dev/null)

# openspec/specs/ の変更があるか
SPEC_CHANGED=$(echo "$STAGED" | grep -c '^openspec/specs/')

# docs/diagrams/ の変更があるか
DIAGRAM_CHANGED=$(echo "$STAGED" | grep -c '^docs/diagrams/')

if [ "$SPEC_CHANGED" -gt 0 ] && [ "$DIAGRAM_CHANGED" -eq 0 ]; then
  echo "WARNING: openspec/specs/ が変更されていますが docs/diagrams/ が更新されていません。"
  echo "関連する図への影響を確認してください（versioning.md のルール参照）。"
fi

exit 0
