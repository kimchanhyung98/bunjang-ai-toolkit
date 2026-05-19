---
name: bunjang-cli
description: 번개장터 상점 운영을 로컬 bunjang-cli 래퍼로 처리할 때 사용한다. 상품 검색, 상품 상세 조회, 후보 순위화, 채팅 조회/전송, 관심상품 관리, 구매 가능 여부 확인처럼 CLI로 실행 가능한 운영 요청에 적용하며, 판매글 작성 브라우저 자동화에는 사용하지 않는다.
---

# 번개장터 CLI 운영

## 목적

`src/`의 Node 래퍼로 `bunjang-cli`를 호출해 번개장터 운영 작업을 수행한다. 판매글 작성은 이 스킬의 책임이 아니며, 상품 사진 분석과 브라우저 폼 입력은 `/bunjang-sales`를 사용한다.

## 원칙

- 직접 요청된 CLI 운영 작업은 별도 사용자 컨펌 없이 실행한다.
- 모든 CLI 실행은 `src/config.js`의 capability allow/deny 설정을 거친다. 임의의 `bunjang-cli` 명령 문자열을 직접 조합하지 않는다.
- 로그인 상태가 필요한 작업은 래퍼의 로그인 사전 확인을 사용한다. 로그인되지 않았으면 작업을 실행하지 않고 로그인 필요 상태를 보고한다.
- 구매 시작, 최종 구매 확정, 계정 설정 변경은 실행하지 않는다.
- 판매글 작성, 게시, 수정, 삭제는 처리하지 않는다. `bunjang-cli@0.2.1`에는 해당 명령이 없다.
- 스케줄러는 이 스킬의 현재 범위 밖이다. 별도로 추가되기 전까지 반복 실행이나 approval 흐름을 만들지 않는다.

## 준비

1. repo 루트에서 작업한다.
2. 의존성이 없으면 `npm install`을 실행한다.
3. `src/config.js`에서 지원 capability와 deny 정책을 확인한다.
4. 터미널에서는 `npm run bunjang -- <capabilityId> '<paramsJson>'`를 사용한다.
5. 코드에서 직접 사용할 때는 `src/cli.js`의 `executeCapability` 또는 `createBunjangCli().execute`를 사용한다.

## 지원 작업

- 검색/조회: `search.listings`, `agent-search-rank`, `item.get`, `item.list`.
- 채팅: `chat.list`, `chat.read`, `chat.start`, `chat.send`.
- 관심상품: `favorite.list`, `favorite.add`, `favorite.remove`.
- 구매 확인: `purchase.prepare`.
- 인증: `auth.status`, `auth.login`, `auth.logout`.

`src/config.js`의 capability 목록이 이 문서와 다르면 `src/config.js`를 우선한다.

## 호출 예시

```bash
npm run bunjang -- search.listings '{"query":"아이폰","maxItems":5}'
npm run bunjang -- item.get '{"listingId":"123456"}'
npm run bunjang -- chat.send '{"threadId":"thread-1","message":"답변입니다."}'
```

## 완료 보고

- 실행한 capability와 주요 파라미터를 보고한다.
- `executed`, `login_required`, `manual_only` 상태를 구분한다.
- 상태가 바뀌는 작업은 결과 요약을 함께 보고한다.
