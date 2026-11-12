# AX 운영 안내

AX 운영 앱을 둘러싼 네 영역 — **GitHub · DB · Azure · 모니터링** — 에서 현업과 전산팀이 각각 무엇을 하는지 정리한 문서입니다.

| 읽는 사람 | 읽을 곳 |
| --- | --- |
| 현업(앱 담당 팀) | 「현업용」 묶음만 |
| 전산팀 | 「현업용」 + 「전산팀용」 전부 |

## 읽는 법

| 방법 | 어떻게 |
| --- | --- |
| 사이트 | <https://sinokorofficial.github.io/ax-ops-guide/> |
| GitHub 에서 바로 | [docs/index.md](docs/index.md) 부터 |
| 내 PC 에서 | `uv run mkdocs serve` |

## 고치는 법

- 전산팀이 가지를 만들어 PR 로 올립니다. main 에 합치면 사이트가 다시 배포됩니다.
- 틀린 곳 · 빠진 곳은 이 저장소에 이슈로 남깁니다.
- 올리기 전에 `uv run mkdocs build --strict` 가 통과해야 합니다.
- **공개 문서입니다.** 사람 이름 · 계정 · 자원 이름 · 접속 주소 · 채널 ID · 실제 장애 수치 · 업무 데이터를 적지 않습니다.
- 카드 예시 화면(`docs/assets/cards/*.png`)은 `docs/assets/cards/src/cards.html` 을 고친 뒤 `NODE_PATH=<playwright 가 설치된 node_modules> node docs/assets/cards/src/shoot.js` 로 다시 찍습니다.
