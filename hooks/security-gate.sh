#!/bin/bash
# Fast security gate — pattern-match sensitive paths and content
# Replaces the prompt-type PreToolUse hook (~10s) with regex matching (~10ms)
# Defense-in-depth: sharp-edges security scan at PR time catches edge cases
#
# Uses node for JSON parsing (always available in Claude Code) with jq fallback

# Respect bypass mode
if [ "$BYPASS_SAFETY_HOOKS" = "1" ]; then
  echo '{"decision":"allow"}'
  exit 0
fi

INPUT=$(cat)

# Parse JSON using node (always available in Claude Code env)
FILE_PATH=$(echo "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{process.stdout.write(JSON.parse(d).tool_input.file_path||'')}catch(e){}})" 2>/dev/null)

# Block sensitive file paths
case "$FILE_PATH" in
  *.env|*.env.*|*credentials*|*id_rsa*|*id_ed25519*|*.pem|*.key|*secret*|*.keystore|*.jks|*.p12|*.pfx)
    echo '{"decision":"block","reason":"Sensitive file path detected: '"$FILE_PATH"'"}'
    exit 0 ;;
esac

# Block content with common secret patterns (Write: content, Edit: new_string, MultiEdit: operations[].new_string)
CONTENT=$(echo "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const t=JSON.parse(d).tool_input;let c=t.content||t.new_string||'';if(t.operations)c+=t.operations.map(o=>o.new_string||'').join(' ');process.stdout.write(c)}catch(e){}})" 2>/dev/null)
if echo "$CONTENT" | grep -qiE '(AKIA[0-9A-Z]{16}|sk-[a-zA-Z0-9]{48}|sk-ant-[a-zA-Z0-9-]{95}|ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82}|xoxb-[0-9]{10,}-[a-zA-Z0-9-]+|password\s*[:=]\s*["\x27][^\x27"]{8,}|(mongodb|postgres|mysql|redis)://[^:]+:[^@]+@|-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----|((token|api_key|apikey|secret_key)\s*[:=]\s*["\x27][A-Za-z0-9+/=]{40,}))'; then
  echo '{"decision":"block","reason":"Potential secret detected in file content"}'
  exit 0
fi

echo '{"decision":"allow"}'
