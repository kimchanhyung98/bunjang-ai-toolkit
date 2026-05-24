# bunjang-assistant

이 저장소는 번개장터 운영을 로컬 AI 에이전트와 함께 처리하기 위한 툴킷입니다.

## 역할

- 공개 진입점 스킬: `bunjang`
- Codex와 Claude 플러그인 메타데이터
- macOS 로컬 설치 메타데이터
- `bunjang-cli`를 안전하게 호출하는 Node 래퍼
- 시세 조회와 판매글 초안 실행 지침
- 사용자가 지정한 상품 디렉토리 기반 판매글 작성 흐름

## 경계

- 이 툴킷은 호스팅 백엔드나 번개장터 자동 운영 서비스를 포함하지 않습니다.
- 실행 엔진은 npm `bunjang-cli` 패키지입니다.
- 래퍼는 `src/config.js`에 등록된 capability만 실행합니다.
- 최종 구매, 최종 판매글 등록, 계정 설정 변경은 수동으로만 처리합니다.
- macOS Intel과 Apple Silicon에서 Codex와 Claude만 지원합니다.

## 읽는 순서

1. `skills/bunjang/SKILL.md`
2. `skills/bunjang/docs/capability-registry.md`
3. `skills/bunjang/docs/execution-contract.md`
4. `skills/bunjang/references/routing.md`
5. `skills/bunjang/references/` 아래의 요청별 참조 문서
