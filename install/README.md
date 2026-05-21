# 설치 스크립트

이 디렉토리는 macOS와 Codex, Claude Code만 지원하는 설치 스크립트를 둡니다.

## 통합 설치기

```bash
node install/bunjang-assistant-install.mjs --tool cli
node install/bunjang-assistant-install.mjs --tool codex --dry-run
node install/bunjang-assistant-install.mjs --tool claude-code --dry-run
node install/bunjang-assistant-install.mjs --tool both --dry-run
```

`--tool cli`는 `npm install`을 실행한 뒤 `npm run bunjang -- auth.status`로 준비 상태를 확인합니다.

## 스킬 설치 헬퍼

```bash
./install/install-skills.sh --tool codex --scope project
./install/install-skills.sh --tool claude --scope project
```

`install-skills.sh`는 `bunjang-assistant-install.mjs`가 내부에서 호출하는 스킬 복사/심볼릭 링크 전용 헬퍼입니다.
