# CLI 툴킷 연동

`bunjang-assistant`는 로컬 Node 래퍼를 통해 AI 에이전트와 `bunjang-cli`를 연결합니다.

## 래퍼 명령

에이전트/플러그인 런타임(설치 없이 어디서나):

```bash
npx -y --package=github:kimchanhyung98/bunjang-assistant -- bunjang-assistant-run <capabilityId> '<paramsJson>'
```

레포를 clone한 로컬 개발:

```bash
npm run bunjang -- <capabilityId> '<paramsJson>'
```

래퍼의 역할:

- `--json`을 자동으로 붙입니다.
- capability ID를 문서화된 `bunjang-cli` 인자로 변환합니다.
- 수동 전용 capability는 CLI 실행 전에 거절합니다.
- 채팅, 관심상품, 구매 가능 여부 확인 전에 로그인 상태를 먼저 확인합니다.
- JSON 출력을 파싱하고, 파싱 실패 시 capability 문맥을 함께 보고합니다.

## 기준 파일

- capability 목록: `src/config.js`
- 인자 변환: `src/cli.js`
- CLI 진입점: `src/index.js`
- 테스트: `test/bunjang-cli.test.js`
