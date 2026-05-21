# Capability 레지스트리

`src/config.js`가 기준 파일입니다. 이 문서는 설치된 번들 안에서 capability 기준을 읽는 최소 안내서입니다.

## 먼저 확인할 파일

1. `src/config.js`
2. `src/cli.js`
3. `npm run bunjang -- auth.status`

## 로그인 없이 허용

- `auth.status`
- `auth.logout`
- `search.listings`
- `agent-search-rank`
- `item.get`
- `item.list`

## 로그인 사전 확인 필요

이 capability들은 래퍼가 먼저 `auth.status`를 호출합니다. 미로그인이면 `login_required`를 보고하고 실행하지 않습니다.

- `chat.list`
- `chat.read`
- `chat.start`
- `chat.send`
- `favorite.list`
- `favorite.add`
- `favorite.remove`
- `purchase.prepare`

## 수동 전용

래퍼가 `manual_only`를 반환하고 `bunjang-cli`를 실행하지 않습니다.

- `auth.login`
- `purchase.start`
- `purchase.confirm`
- `account.settings.update`

## 핵심 해석 원칙

- capability ID가 공개 계약입니다.
- 원시 `bunjang-cli` 명령 문자열을 직접 조합하지 않습니다.
- `paramsJson`은 생략 가능하지만, 전달하면 JSON 객체여야 합니다.
- 이 문서와 `src/config.js`가 다르면 `src/config.js`를 우선합니다.
