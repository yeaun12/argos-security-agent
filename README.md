# ARGOS — 보안 Agent (학생 개발·검증 및 코드 탐색 안내)

ARGOS는 기존 접속·XDR 사건 기록을 보여 주고, 별도 승인을 받은 경우에만 사건 근거에 관한 AI 설명을 요청하는 학생 보안 Agent 프로젝트입니다. **실제 AI 연결 성공이나 ALEPH 단계 통과를 증명하는 문서는 아닙니다.**

앱 실행·운영 안내는 [on-client/README.md](on-client/README.md), 학생 구현은 [on-client/student/extension.mjs](on-client/student/extension.mjs)에 있습니다. 제공 서버·AI 전송 파일은 학생 구현과 분리하여 보존합니다.

## 21단계 학생용 실행 설명서와 시스템 구성도

**[ARGOS 학생 실행 설명서·Mermaid 구성도·검증 기록](on-client/docs/STUDENT_RUNBOOK.md)**

- **기능:** 사용자 계정·기기·세션, 접근 제어·XDR 기록, 근거 기반 AI 참고 설명, 조치 요청 상태, OSV 취약점 조회 결과를 분리 표시한다. 실제 원천 판정과 조치 집행은 제공 시스템의 책임이다.
- **환경·버전:** Windows PowerShell, Git, Node.js 22~24(기준 24.19.0). `on-client/package.json`은 **0.2.11**이고 Native Host 실행 스크립트만 별도 보완했다. 실제 학생 PC에서 확인한 Node.js는 **v24.21.0**, Git은 **2.55.0.windows.3**이다.
- **실행 위치:** `%LOCALAPPDATA%\ALEPH\Workbench\projects\아르고스-방어전\on-client`.
- **기존에 사용한 실행 명령:** `powershell -NoProfile -ExecutionPolicy Bypass -File ".\tools\start-alekov.ps1" -Port 5190`. 주소 `http://127.0.0.1:5190/`. 2026-10-23 새 PowerShell에서 서버 시작·브라우저 세 탭 확인·종료·재실행 후 세 탭 복귀까지 **학생이 직접 확인했다**.
- **시스템 관계:** `public/app.js` → `src/server.mjs` → 기존 SDP/XDR(운영 승인 시)·AI 게이트(승인 시); 별도 OSV 검사가 있다. 학생 `student/extension.mjs`는 표시만 담당한다.
- **검증 기록:** 2026-10-23 학생 PC에서 `node --test` **42/42 PASS**, 0 FAIL. 실제 AI 모델 호출·원천 조치·OSV 조회 및 21단계 공식 통과는 미확인이다.

---

## 17단계: 모델 목록 점검과 사건 설명은 다른 요청

- **모델 목록 점검:** 제공 UI의 `POST /api/ai/check`는 현재 앱 권한과 모델 목록을 점검합니다. 모델 목록 응답은 사건 설명의 모델 추론이 아닙니다.
- **실제 사건 설명:** 보안 기록에서 사건을 선택한 후, 제공 UI가 `POST /api/ai/explain`에 `{eventId}`를 전달합니다. 요청 경로와 검증은 다음 원문에 있습니다.

| 단계 | 소스 원문 위치 | 동작 |
| --- | --- | --- |
| 브라우저 요청 | [`on-client/public/app.js` 978~1012행](on-client/public/app.js#L978-L1012) | 선택 사건 검증, `aiRequest('/api/ai/explain', …)`, 취소·이전 요청 무효화 |
| HTTP 경로·권한 및 사건 검증 | [`on-client/src/server.mjs` 466~544행](on-client/src/server.mjs#L466-L544) | `POST /api/ai/explain`를 두 분기로 처리: native host 연결 시 466행 분기, 그 외 527행 분기. 각각 `service.explainIncident(incident, options)`(504행), `mappedService().explainIncident(…)`(541행)를 호출 |
| native 자격 보관함 연동 | [`on-client/src/ai/vault-service.mjs` 103~147행](on-client/src/ai/vault-service.mjs#L103-L147) | 앱 전용 자격을 검증해 `createOnAiService`로 연결하고 `explainIncident` 실행. 인증 정보는 브라우저에 전달하지 않음 |
| 권한 확인·모델 호출 | [`on-client/src/ai/service.mjs` 337~389행](on-client/src/ai/service.mjs#L337-L389) | `authorize('explain','ai.explain', …)`, 사건 증거·규칙 검증, 허용 모델에 `chat()` 요청 후 응답 검증 |
| HTTP AI 전송 | [`on-client/vendor/clco-http.mjs` 119~124행](on-client/vendor/clco-http.mjs#L119-L124) | `chat()`가 `POST /chat/completions`를 수행 |
| 학생 결과 표시 | [`on-client/student/extension.mjs`](on-client/student/extension.mjs) | `renderAiConnection`은 점검 상태·오류·모델 수를 표시. `renderExplanation`은 **유효한 사건 설명 성공 시에만** `data-student-explanation-event`를 부여하고 실패 시 기존 기록을 유지한다고 안내 |

> 위 표는 **저장소 코드에 구현된 호출 경로**를 찾아보기 위한 색인입니다. 단순히 표나 설명이 있다고 원문 확인이나 런타임 검증이 완료된 것은 아닙니다. 정확한 의미는 각 링크의 원문을 기준으로 판단해야 합니다.

## 확인된 범위와 남은 조건

- 17단계 당시 **별도** 모의 DOM 검사의 기록과 로컬 브라우저 초기 화면 관측은 과거 시점의 자료다. 현재 17~20단계 누적 `node --test`는 2026-10-23 학생 PC에서 **42/42 통과**했다. 이 수치는 실제 AI 호출 성공이 아니다.
- 기본 실행(`start-alekov.ps1` 옵션 없음)에서 계정 연결 요청은 `NATIVE_HOST_DISABLED`를 반환. 이는 native host 기능을 지정하지 않은 기본 서버 실행 상태를 뜻합니다.
- **미확인:** 현재 최종 소스에서 실서비스 SDP·AI·OSV 연결 및 `ai.explain` 실제 모델 응답, 원천 조치 효과. 모델 목록 점검은 사건 설명 생성과 다르다. 이 문서의 21단계 공식 판정은 아직 확인하지 않았다.
- 실제 운영 연결은 관리자가 준비한 native host와 (사건 원천 검증을 위한) SDP host 설정에 의존할 수 있습니다. 설정·열쇠를 임의로 만들거나 Git에 추가하지 않습니다.

원본 계약: [AI 연결 안내](on-client/docs/AI_SETUP_GUIDE.md), [학생 실행 안내](on-client/docs/STUDENT_LAUNCH_GUIDE.md). 제공 서버·전송 모듈은 수정하지 않았습니다.
