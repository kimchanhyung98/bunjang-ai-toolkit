# bunjang-assistant

이 문서는 설치된 `bunjang` 번들이 어떤 역할을 하는지 설명합니다.

## 역할

- 공개 진입점 스킬 `bunjang`
- capability 레지스트리와 실행 계약
- 시세 조회, 판매글 초안, 번개장터 운영 참조 문서
- Codex/Claude Code 메타데이터
- `bunjang-cli` 래퍼

## 경계

- 이 번들은 번개장터 서비스나 `bunjang-cli` 자체를 포함하지 않습니다.
- 실제 실행은 npm dependency `bunjang-cli`와 저장소 로컬 래퍼가 담당합니다.
- 최종 구매, 최종 판매글 등록, 계정 설정 변경은 수동 전용입니다.
- macOS Intel, Apple Silicon, Codex, Claude Code만 지원 대상으로 둡니다.

## 읽는 순서

1. `SKILL.md`
2. `docs/capability-registry.md`
3. `docs/execution-contract.md`
4. `references/routing.md`
5. 요청별 참조 문서
