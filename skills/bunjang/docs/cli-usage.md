# CLI 사용 빠른 안내

이 문서는 설치된 번들 안에서 빠르게 다시 볼 최소 CLI 사용 안내서입니다. 사용자에게 `/bunjang` 같은 별도 명령어를 제공하지 않고, 자연어 요청을 스킬이 해석한 뒤 필요한 경우에만 래퍼를 실행합니다.

## 공통 시작점

```bash
npm install
npm run bunjang -- auth.status
```

## 대표 capability

```bash
npm run bunjang -- search.listings '{"query":"아이폰","maxItems":20,"withDetail":true}'
npm run bunjang -- agent-search-rank '{"query":"아이폰","maxItems":10}'
npm run bunjang -- item.get '{"listingId":"123456"}'
npm run bunjang -- item.list '{"listingIds":["123456","789012"]}'
npm run bunjang -- chat.list
npm run bunjang -- favorite.list
npm run bunjang -- purchase.prepare '{"listingId":"123456"}'
```

## 설치 메타데이터

```bash
node install/bunjang-assistant-install.mjs --tool cli
node install/bunjang-assistant-install.mjs --tool codex --dry-run
node install/bunjang-assistant-install.mjs --tool claude-code --dry-run
node install/bunjang-assistant-install.mjs --tool both --dry-run
```

## 원칙

- 세부 인자 형태는 `src/cli.js`와 테스트를 기준으로 확인합니다.
- 자동화는 래퍼 JSON 결과를 우선 사용합니다.
- 원시 `bunjang-cli` 명령 문자열을 직접 조합하지 않습니다.
