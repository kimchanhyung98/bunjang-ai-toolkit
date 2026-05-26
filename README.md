# bunjang-assistant

번개장터 시세 조회, 매물 검색, 채팅, 찜 관리, 판매글 초안 작성을 위한 스킬입니다.

`bunjang-cli`를 안전하게 호출하는 Node 래퍼와 Codex/Claude 플러그인 메타데이터를 제공합니다.

## 설치

Codex 또는 Claude CLI가 설치된 상태에서 실행합니다.

```bash
node install/bunjang-assistant-install.mjs --tool codex
node install/bunjang-assistant-install.mjs --tool claude
node install/bunjang-assistant-install.mjs --tool both
```

## 사용

Codex 또는 Claude를 실행하고, 다음과 같이 요청합니다.

```text
번개장터에서 아이폰 15 시세 알려줘
이 매물 상세 확인해줘: 123456
찜했던 상품들 가격 알려줘
~/products 경로의 상품들 판매글 작성해
```

`번개장터`, `번장`, `bunjang tool`, `bunjang assistant`처럼 짧게 불러도 같은 스킬로 라우팅됩니다.

## 동작 범위

- AI가 대신 처리하는 작업: 매물 검색, 시세 조회, 상품 상세 확인, 찜·채팅 관리, 구매 가능 여부 확인, 판매글 초안 작성.
- 사용자가 직접 해야 하는 작업: 번개장터 브라우저 로그인, 판매글 `등록하기` 클릭, 최종 구매 확정, 계정 설정 변경.
- 채팅·찜·구매 가능 여부 확인은 번개장터 로그인이 필요합니다. macOS만 지원합니다.

## 자세히

- 동작 원칙과 라우팅: [`skills/bunjang/SKILL.md`](skills/bunjang/SKILL.md)
- 판매글 절차: [`skills/bunjang/references/sales.md`](skills/bunjang/references/sales.md)
- 시세 조회 절차: [`skills/bunjang/references/price.md`](skills/bunjang/references/price.md)
