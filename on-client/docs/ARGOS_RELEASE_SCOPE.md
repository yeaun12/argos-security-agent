# ARGOS 포트폴리오 리디자인 — 공식 제출 경계와 재현 범위

- 대상: `post22/argos-portfolio-ux-20261027`; 기준 `297ed3217c5fca0ea68c6ac6ff42e37a82b49d39`.
- 기존 ALEPH 공식 22단계 제출 SHA: `600f8e36aa29979df2882fd26d69da2c74c49b77`; 이 SHA를 변경하지 않음.
- Patch 1: `public/index.html`, `public/style.css`의 다크 테마와 3개 핵심 바로가기. 사용자 Windows 브라우저 5/5, 이전 커밋 기준 96/96 테스트 통과 보고.
- Patch 2: `public/index.html`, `public/style.css`, `public/app.js`의 Windows CPU/메모리/디스크 실측 수치, 게이지, 최대 12회 페이지 내 이력. 실패·조회 전은 `--`로 표시. 자동 수집·원격 업로드 아님. 새 테스트 5개.
- Patch 3: `public/style.css`에 사건 타임라인, AI 연결/승인 안내의 시각적 구획을 추가. 전송·권한·AI 호출 로직 수정 없음. 새 테스트 4개.
- 학생이 직접 작성한 표시 로직: 기존 `student/extension.mjs`; Patch 1~3은 해당 파일을 덮어쓰지 않음. `src/`/`packaging/`/인증 설정도 수정하지 않음.
- `student/appearance.json`: 현재 검증된 0.2.11 소스에 없는 파일이며 공식 0.2.21의 문법/적용 경로를 검증하지 못해 임의 생성하지 않음. 최신 시작 틀을 기존 프로젝트에 덮어쓰지 말 것.
- 공식 사이트의 완료 안내: 마무리 과제는 공개 GitHub 저장소 URL와 40자리 커밋을 제출. 설치 프로그램/포장 필수 아님. `public/**`만 수정한 결과의 공식 설치형 반영은 보장되지 않으며 별도 승인된 실행 환경 검증 필요.
- 실측과 Demo 구별: Windows 로컬 CPU/RAM/디스크 조회는 실측, Demo XDR/접속 샘플은 실제 위협 탐지가 아님. 미확인 연결/OSV/실제 원천 집행은 성공으로 표시하지 않음.
- 배포 결과: 최종 UX 버전은 사용자 Windows PC에서 `node --test` 및 시연 항목 확인한 후에만 커밋·push 가능. 자동 회귀 테스트가 제공/학생 경계를 공식적으로 승인하는 것은 아님.
- 복구: 이전 Git 검증 기준점 `297ed32`와 기존 백업 폴더 보존. 새 브랜치에서만 작업. `.env`, Native Host 비밀설정, `node_modules`, 로컬 백업 및 사용자 로그를 Git에 포함하지 않음.

- v2 적용 오류 복구: 초기 통합 ZIP은 중복 압축 해제 및 Patch 2 들여쓰기 고정 앵커 오류가 있었고, v2에서 ZIP 경로 분리와 앵커 검색을 수정함. Windows 적용 검증 전 통과라고 쓰지 않음.
