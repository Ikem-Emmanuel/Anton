# How to Restore from Backup

Backup created: 2026-04-10
Location: `$HOME/Development/backups/openclaw-mc-v2-20260410-122023/`

## Full Restore (nuclear option)

```bash
BACKUP_ROOT="$HOME/Development/backups/openclaw-mc-v2-20260410-122023"
cd "$HOME/Development" || exit 1
tar -xzf "$BACKUP_ROOT/full-project-backup.tar.gz"
cd openclaw-mc-v2 && npm install
```

## Restore Individual Configs

```bash
BACKUP="$HOME/Development/backups/openclaw-mc-v2-20260410-122023/configs"
cp "$BACKUP/CLAUDE.md" ./CLAUDE.md
cp "$BACKUP/.mcp.json" ./.mcp.json
cp -r "$BACKUP/.claude/" ./.claude/
cp -r "$BACKUP/.github/" ./.github/
```

## Restore via Git

```bash
git checkout backup/pre-ai-org-v3-20260410
```

## Remove AI Org Only (keep source code)

```bash
# Remove the entire .anton/ directory
rm -rf .anton/

# Remove prefixed agents (keep original MC v2.5 agents)
rm -f .claude/agents/eng--*.md
rm -f .claude/agents/mktg--*.md
rm -f .claude/agents/seo--*.md
rm -f .claude/agents/auto--*.md
rm -f .claude/agents/data--*.md
rm -f .claude/agents/growth--*.md

# Remove new department skills
rm -rf .claude/skills/{engineering,marketing,seo,automation,data,growth}

# Remove GitHub Action
rm -f .github/workflows/claude.yml

# Restore original configs
BACKUP="$HOME/Development/backups/openclaw-mc-v2-20260410-122023/configs"
cp "$BACKUP/CLAUDE.md" ./CLAUDE.md
if [ -f "$BACKUP/.mcp.json" ]; then
  cp "$BACKUP/.mcp.json" ./.mcp.json
else
  echo "Warning: .mcp.json backup not found, skipping"
fi
cp "$BACKUP/.claude/settings.json" ./.claude/settings.json
```
