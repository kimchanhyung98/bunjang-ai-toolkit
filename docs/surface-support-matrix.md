# 지원 표면 매트릭스

이 문서는 번개장터 작업에 필요한 지원 표면만 정리합니다.

`bunjang-assistant`는 고객 대상 멀티플랫폼 서비스가 아니라, 개인 또는 소규모 공유 환경의 macOS 로컬 사용을 대상으로 합니다.

| 표면 | 주요 파일 | 상태 |
| --- | --- | --- |
| Codex | `.codex-plugin/plugin.json`, `.agents/plugins/marketplace.json`, `skills/bunjang/` | 지원 |
| Claude | `.claude-plugin/plugin.json`, `skills/bunjang/` | 지원 |
| 패키지 내부 스킬 경로 | `skills/bunjang/` | 내부 구성 |
| Claude Desktop local MCP | 제공하지 않음 | 범위 밖 |
| Cursor | 제공하지 않음 | 범위 밖 |
| Windows/Linux 설치기 | 제공하지 않음 | 범위 밖 |

## 원칙

- macOS Intel과 Apple Silicon만 실행 대상으로 둡니다.
- 실행 엔진은 `bunjang-cli`이며, 이 저장소는 스킬 메타데이터, 설치 메타데이터, 안전한 Node 래퍼를 제공합니다.
- 명시적으로 필요하지 않으면 MCP 브리지, 웹 문서 사이트, 패키지 번들러, 스케줄러, 기업형 승인 흐름을 추가하지 않습니다.
