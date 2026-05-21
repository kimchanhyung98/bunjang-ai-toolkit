#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH='' cd -- "$SCRIPT_DIR/.." && pwd)
SOURCE_DIR="$REPO_ROOT/skills"
PUBLIC_SKILL_NAME="bunjang"

TOOL=""
SCOPE=""
MODE="copy"
TARGET=""

usage() {
  cat <<'USAGE'
bunjang skills self-install helper

Usage:
  ./install/install-skills.sh --tool codex|claude --scope user|project [--mode copy|symlink] [--target PATH]
  ./install/install-skills.sh --help

Options:
  --tool    설치 대상 도구. codex 또는 claude
  --scope   설치 범위. user 또는 project
  --mode    설치 방식. copy 또는 symlink. 기본값: copy
  --target  기본 discovery 경로 대신 사용할 대상 경로
  --help    도움말 출력

동작 원칙:
  - source-of-truth는 항상 레포의 skills/
  - 공개 설치 대상은 bunjang skill 하나
  - copy는 기존 공개 skill 경로가 있으면 덮어쓰지 않고 실패
  - symlink는 같은 source를 가리키는 기존 symlink만 성공으로 건너뜀
USAGE
}

fail() {
  printf '오류: %s\n' "$1" >&2
  exit 1
}

canonical_path() {
  python3 - "$1" <<'PY'
import os
import sys

print(os.path.realpath(sys.argv[1]))
PY
}

resolve_default_target() {
  case "$TOOL:$SCOPE" in
    codex:user) printf '%s/skills' "${CODEX_HOME:-$HOME/.codex}" ;;
    codex:project) printf '%s/.codex/skills' "$REPO_ROOT" ;;
    claude:user) printf '%s/.claude/skills' "$HOME" ;;
    claude:project) printf '%s/.claude/skills' "$REPO_ROOT" ;;
    *) return 1 ;;
  esac
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --tool)
      [ "$#" -ge 2 ] || fail '--tool 값이 필요합니다.'
      TOOL="$2"
      shift 2
      ;;
    --scope)
      [ "$#" -ge 2 ] || fail '--scope 값이 필요합니다.'
      SCOPE="$2"
      shift 2
      ;;
    --mode)
      [ "$#" -ge 2 ] || fail '--mode 값이 필요합니다.'
      MODE="$2"
      shift 2
      ;;
    --target)
      [ "$#" -ge 2 ] || fail '--target 값이 필요합니다.'
      TARGET="$2"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      fail "알 수 없는 옵션입니다: $1"
      ;;
  esac
done

[ -n "$TOOL" ] || fail '--tool은 필수입니다.'
[ -n "$SCOPE" ] || fail '--scope는 필수입니다.'
[ "$TOOL" = 'codex' ] || [ "$TOOL" = 'claude' ] || fail '--tool은 codex 또는 claude여야 합니다.'
[ "$SCOPE" = 'user' ] || [ "$SCOPE" = 'project' ] || fail '--scope는 user 또는 project여야 합니다.'
[ "$MODE" = 'copy' ] || [ "$MODE" = 'symlink' ] || fail '--mode는 copy 또는 symlink여야 합니다.'
[ -d "$SOURCE_DIR" ] || fail "source skills 디렉터리가 없습니다: $SOURCE_DIR"

if [ -z "$TARGET" ]; then
  TARGET=$(resolve_default_target) || fail '기본 대상 경로를 계산하지 못했습니다.'
fi

mkdir -p "$TARGET"

SOURCE_SKILL="$SOURCE_DIR/$PUBLIC_SKILL_NAME"
[ -d "$SOURCE_SKILL" ] || fail "공개 skill 디렉터리가 없습니다: $SOURCE_SKILL"
[ -f "$SOURCE_SKILL/SKILL.md" ] || fail "공개 skill 엔트리 파일이 없습니다: $SOURCE_SKILL/SKILL.md"

TARGET_SKILL="$TARGET/$PUBLIC_SKILL_NAME"
if [ -e "$TARGET_SKILL" ] || [ -L "$TARGET_SKILL" ]; then
  if [ "$MODE" = 'symlink' ] && [ -L "$TARGET_SKILL" ]; then
    target_real=$(canonical_path "$TARGET_SKILL")
    source_real=$(canonical_path "$SOURCE_SKILL")
    if [ "$target_real" = "$source_real" ]; then
      printf '설치 완료\n'
      printf '  installed_skills: 0\n'
      printf '  skipped_existing: 1\n'
      exit 0
    fi
  fi
  fail "기존 skill 경로와 충돌합니다: $TARGET_SKILL"
fi

if [ "$MODE" = 'copy' ]; then
  cp -R "$SOURCE_SKILL" "$TARGET_SKILL"
else
  ln -s "$SOURCE_SKILL" "$TARGET_SKILL" || fail "심볼릭 링크를 만들지 못했습니다: $TARGET_SKILL"
fi

printf '설치 완료\n'
printf '  tool: %s\n' "$TOOL"
printf '  scope: %s\n' "$SCOPE"
printf '  mode: %s\n' "$MODE"
printf '  target: %s\n' "$TARGET"
printf '  installed_skills: 1\n'
printf '  skipped_existing: 0\n'
