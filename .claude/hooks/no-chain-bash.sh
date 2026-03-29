#!/bin/bash
# PreToolUse hook: Block chained Bash commands (;, &&, ||)
# so each command matches permission patterns individually.

# Read tool input from stdin
COMMAND=$(jq -r '.tool_input.command // empty')

# Skip if no command
[ -z "$COMMAND" ] && exit 0

# Strip single-quoted strings to avoid false positives
STRIPPED=$(echo "$COMMAND" | sed "s/'[^']*'//g")

# Check for ;, &&, || (but not | alone, which is piping)
if echo "$STRIPPED" | grep -qE '(;|&&|\|\|)'; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "コマンド連結（;, &&, ||）は禁止です。各コマンドを個別のBash呼び出しに分けてください。"
    }
  }'
else
  exit 0
fi
