import {INSTALL_TARGETS, DEFAULT_TARGET_ID} from '@/lib/targets';
import {SITE_NAME, siteOrigin} from '@/lib/site';

/**
 * Bash installer. Usage:
 *   curl -fsSL <origin>/install.sh | bash -s -- <skill> [<skill>...] [--target <id>] [--project] [--dir <path>]
 * It downloads each file listed in /skills/<slug>/files.txt into the target directory.
 */
export async function GET(request: Request) {
  const origin = siteOrigin(request);
  const targetCases = INSTALL_TARGETS.map(
    t => `    ${t.id}) GLOBAL_DIR="${t.globalDir}"; PROJECT_DIR="${t.projectDir}" ;;`,
  ).join('\n');
  const targetIds = INSTALL_TARGETS.map(t => t.id).join('|');

  const script = `#!/usr/bin/env bash
# ${SITE_NAME} installer. Source of truth: ${origin}
# Usage: curl -fsSL ${origin}/install.sh | bash -s -- <skill> [<skill>...] [--target ${targetIds}] [--project] [--dir <path>]
set -euo pipefail

BASE="\${NIKSYSKILLS_URL:-${origin}}"
TARGET="${DEFAULT_TARGET_ID}"
SCOPE="global"
CUSTOM_DIR=""
SKILLS=()

usage() {
  cat <<USAGE
Usage: install.sh <skill> [<skill>...] [options]

Options:
  --target <id>   Agent to install for: ${targetIds} (default: ${DEFAULT_TARGET_ID})
  --project       Install into the current project instead of your home directory
  --dir <path>    Install into an explicit directory (overrides --target/--project)
  --list          List available skills and exit
  -h, --help      Show this help

Examples:
  curl -fsSL ${origin}/install.sh | bash -s -- git-commit-message
  curl -fsSL ${origin}/install.sh | bash -s -- session-handoff --target codex --project
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) TARGET="$2"; shift 2 ;;
    --target=*) TARGET="\${1#*=}"; shift ;;
    --project) SCOPE="project"; shift ;;
    --dir) CUSTOM_DIR="$2"; shift 2 ;;
    --dir=*) CUSTOM_DIR="\${1#*=}"; shift ;;
    --list) curl -fsSL "$BASE/llms.txt"; exit 0 ;;
    -h|--help) usage; exit 0 ;;
    -*) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
    *) SKILLS+=("$1"); shift ;;
  esac
done

if [[ \${#SKILLS[@]} -eq 0 ]]; then
  usage >&2
  exit 2
fi

case "$TARGET" in
${targetCases}
    *) echo "Unknown target: $TARGET (expected ${targetIds})" >&2; exit 2 ;;
esac

if [[ -n "$CUSTOM_DIR" ]]; then
  ROOT="$CUSTOM_DIR"
elif [[ "$SCOPE" == "project" ]]; then
  ROOT="$PWD/$PROJECT_DIR"
else
  ROOT="\${GLOBAL_DIR/#\\~/$HOME}"
fi

for SKILL in "\${SKILLS[@]}"; do
  if ! [[ "$SKILL" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
    echo "Invalid skill name: $SKILL" >&2
    exit 2
  fi
  DEST="$ROOT/$SKILL"
  if ! FILES="$(curl -fsSL "$BASE/skills/$SKILL/files.txt")"; then
    echo "Skill not found: $SKILL (see $BASE/llms.txt)" >&2
    exit 1
  fi
  mkdir -p "$DEST"
  COUNT=0
  while IFS= read -r FILE; do
    [[ -z "$FILE" ]] && continue
    case "$FILE" in
      *..*|/*) echo "Refusing unsafe path: $FILE" >&2; exit 1 ;;
    esac
    mkdir -p "$DEST/$(dirname "$FILE")"
    curl -fsSL "$BASE/skills/$SKILL/raw/$FILE" -o "$DEST/$FILE"
    COUNT=$((COUNT + 1))
  done <<< "$FILES"
  echo "Installed $SKILL ($COUNT files) -> $DEST"
done

echo "Done. Restart your agent session if it caches the skill list."
`;

  return new Response(script, {
    headers: {
      'Content-Type': 'text/x-shellscript; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=600',
    },
  });
}
