#!/bin/sh
# Links the bausk-style agent skill into the global skill folders (Codex/opencode: ~/.agents/skills,
# Claude Code: ~/.claude/skills). Symlinks, so editing the repo updates the skill. Re-run safely.
set -e
src="$(cd "$(dirname "$0")/.." && pwd)/skill/bausk-style"
for d in "$HOME/.agents/skills" "$HOME/.claude/skills"; do
  mkdir -p "$d"
  ln -sfn "$src" "$d/bausk-style"
  echo "linked $d/bausk-style -> $src"
done
