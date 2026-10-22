# ARGOS — 보안 Agent (ALEPH 17단계 코드 탐색 안내)

ARGOS는 기존 접속·XDR 사건 기록을 보여 주고, 별도 승인을 받은 경우에만 사건 근거에 관한 AI 설명을 요청하는 학생 보안 Agent 프로젝트입니다. **실제 AI 연결 성공이나 ALEPH 단계 통과를 증명하는 문서는 아닙니다.**

앱 실행·운영 안내는 [on-client/README.md](on-client/README.md), 학생 구현은 [on-client/student/extension.mjs](on-client/student/extension.mjs)에 있습니다. 제공 서버·AI 전송 파일은 학생 구현과 분리하여 보존합니다.

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

- 17단계 학생 함수의 로컬 모의 DOM 검사 **47개 통과**, 로컬 브라우저에서 `AI 연결 점검 전` 초기 화면 표시 확인.
- 기본 실행(`start-alekov.ps1` 옵션 없음)에서 계정 연결 요청은 `NATIVE_HOST_DISABLED`를 반환. 이는 native host 기능을 지정하지 않은 기본 서버 실행 상태를 뜻합니다.
- **미확인:** 운영 계정 연결, `ai.explain` 실권한, 실제 사건 설명 모델 호출·응답 및 ALEPH 공식 판정 통과. 모델 목록 점검만으로 이 조건을 대체할 수 없습니다.
- 실제 운영 연결은 관리자가 준비한 native host와 (사건 원천 검증을 위한) SDP host 설정에 의존할 수 있습니다. 설정·열쇠를 임의로 만들거나 Git에 추가하지 않습니다.

원본 계약: [AI 연결 안내](on-client/docs/AI_SETUP_GUIDE.md), [학생 실행 안내](on-client/docs/STUDENT_LAUNCH_GUIDE.md). 제공 서버·전송 모듈은 수정하지 않았습니다.
