# AI 에이전트 설치

## 로컬 클론

```bash
npm install
npm test
```

## 설치 진입점

```bash
node install/bunjang-assistant-install.mjs --tool cli
node install/bunjang-assistant-install.mjs --tool codex
node install/bunjang-assistant-install.mjs --tool claude
node install/bunjang-assistant-install.mjs --tool both
```

플러그인 연결을 검증할 때는 먼저 `--dry-run`을 사용합니다.
Codex와 Claude 설치는 기본적으로 CLI 의존성 설치와 `auth.status` 확인을 먼저 수행합니다. 표면 연결만 확인하려면 `--no-install-cli`를 함께 사용합니다.

## 설치 범위

- `--scope user`: 사용자 도구 설정에 스킬과 플러그인을 설치합니다.
- `--scope project`: 현재 프로젝트 탐색 경로에 스킬을 설치합니다.
- `--scope local`: 프로젝트 스킬 설치와 같은 의미입니다.

## 지원하지 않는 범위

Cursor, Claude Desktop MCP, Windows, Linux 설치기는 제공하지 않습니다.
