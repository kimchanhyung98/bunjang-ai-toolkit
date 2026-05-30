# CLI 사용 빠른 안내

이 문서는 설치된 번들 안에서 빠르게 다시 볼 최소 CLI 사용 안내서입니다. 사용자는 Claude 플러그인 표면에서 `/bunjang [작업]` 슬래시 커맨드로 진입하거나 자연어 요청을 그대로 보낼 수 있으며, 둘 모두 같은 스킬이 해석한 뒤 필요한 경우에만 래퍼를 실행합니다.

## 공통 시작점

```bash
npx -y github:kimchanhyung98/bunjang-assistant bunjang-assistant-run auth.status
```

## 대표 capability

`npx -y github:kimchanhyung98/bunjang-assistant bunjang-assistant-run` 뒤에 capability ID와 paramsJson을 붙입니다.

```bash
npx -y --package=github:kimchanhyung98/bunjang-assistant bunjang-assistant-run search.listings '{"query":"아이폰","maxItems":20,"withDetail":true}'
npx -y --package=github:kimchanhyung98/bunjang-assistant bunjang-assistant-run agent-search-rank '{"query":"아이폰","maxItems":10}'
npx -y --package=github:kimchanhyung98/bunjang-assistant bunjang-assistant-run item.get '{"listingId":"123456"}'
npx -y --package=github:kimchanhyung98/bunjang-assistant bunjang-assistant-run item.list '{"listingIds":["123456","789012"]}'
npx -y --package=github:kimchanhyung98/bunjang-assistant bunjang-assistant-run chat.list
npx -y --package=github:kimchanhyung98/bunjang-assistant bunjang-assistant-run favorite.list
npx -y --package=github:kimchanhyung98/bunjang-assistant bunjang-assistant-run purchase.prepare '{"listingId":"123456"}'
```

## 설치 메타데이터

Claude Code에서는 채팅창에 슬래시 명령으로 plugin install을 실행합니다.

```text
/plugin marketplace add kimchanhyung98/bunjang-assistant
/plugin install bunjang-assistant@bunjang-assistant
```

Codex에서는 마켓플레이스를 등록한 뒤 Plugins UI에서 활성화합니다.

```bash
codex plugin marketplace add --ref main https://github.com/kimchanhyung98/bunjang-assistant.git
codex plugin add bunjang-assistant@bunjang-assistant
```

스킬만 별도로 복사해야 할 때만 헬퍼를 사용합니다.

```bash
./install/install-skills.sh --tool codex --scope user
./install/install-skills.sh --tool claude --scope user
```

Node 설치기는 CLI 준비나 dry-run 검증이 필요할 때만 사용합니다. `--tool cli` 또는 `--install-cli`가 CLI 의존성을 설치합니다.

## 원칙

- 세부 인자 형태는 `src/cli.js`와 테스트를 기준으로 확인합니다.
- 자동화는 래퍼 JSON 결과를 우선 사용합니다.
- 원시 `bunjang-cli` 명령 문자열을 직접 조합하지 않습니다.
