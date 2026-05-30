# 번개장터 운영

이 문서는 번개장터 검색, 조회, 채팅, 관심상품, 구매 가능 여부 확인 내부 실행 지침입니다.

## 검색

사용자가 “번개장터에서 A 찾아줘”, “A 매물 검색해줘”라고 요청하면:

1. 검색어 `query`를 확정합니다.
2. 가격, 정렬, 최대 개수 조건이 있으면 params에 반영합니다.
3. 일반 목록은 `search.listings`를 사용합니다.
4. 후보 선별이 목적이면 `agent-search-rank`를 사용합니다.
5. 결과에는 listing ID, 제목, 가격, 상태 단서, 다음 확인 액션을 포함합니다.

대표 호출:

```bash
npx -y --package=github:kimchanhyung98/bunjang-assistant -- bunjang-assistant-run search.listings '{"query":"아이폰 15 128GB","maxItems":20,"withDetail":true}'
```

구조화된 검색 결과 요약 기준을 검증해야 하면 [`search-result-fixture.md`](./search-result-fixture.md)를 읽습니다.

## 상세 조회

- 단일 매물: `listingId`로 `item.get`
- 여러 매물: `listingIds`로 `item.list`

상세 결과를 보고할 때는 실제 결과에 없는 하자, 구성품, 직거래 가능 여부를 추정하지 않습니다.

## 채팅

- `chat.list`
- `chat.read`
- `chat.start`
- `chat.send`

채팅은 로그인 사전 확인이 필요합니다. `login_required`면 메시지를 보내지 않고 멈춥니다.

## 관심상품

- `favorite.list`
- `favorite.add`
- `favorite.remove`

관심상품 변경은 상태 변경입니다. 실행 뒤 어떤 listing에 어떤 변경을 했는지 보고합니다.

## 찜한 상품 가격 보강

"찜한 상품 가격 알려줘", "찜했던거 가격 알려줘", "관심상품 시세" 요청은 다음 순서로 처리합니다.

1. `favorite.list`로 현재 관심상품 목록을 조회합니다.
2. 결과에서 `listingId`를 모읍니다.
3. 가격이나 상태 정보가 누락되어 있거나 사용자가 최신가를 원하면 `item.list`에 `listingIds`를 전달해 상세를 보강합니다.
4. 응답에는 각 listing의 `listingId`, 제목, 현재가, 품절/삭제 여부를 요약합니다.
5. 가격 변동은 CLI 결과나 사용자가 제공한 이전 가격 스냅샷이 있을 때만 보고합니다.

호출 예:

```bash
npx -y --package=github:kimchanhyung98/bunjang-assistant -- bunjang-assistant-run favorite.list
npx -y --package=github:kimchanhyung98/bunjang-assistant -- bunjang-assistant-run item.list '{"listingIds":["123456","789012"]}'
```

`favorite.list`는 로그인 사전 확인이 필요합니다. `login_required`면 보강 단계로 넘어가지 않고 멈춥니다.

## 구매 가능 여부

- `listingId`로 `purchase.prepare`

구매 가능 여부만 확인합니다. 구매 시작과 최종 확정은 수동 전용입니다.
