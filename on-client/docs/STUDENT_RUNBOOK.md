# ARGOS 학생 실행 설명서 및 시스템 구성도

> 21단계 학생 작성 · 2026-10-23 · 코드 기준: `97a3e0dcec35d875daedad28358124c784e898ee`.
> **아르고스(ARGOS)**는 이 학생 Agent의 이름이며, 원래 시작 틀의 UI·실행 로그에는 **케셰브**라고 표시될 수 있다. 원본 함수명·파일명·버튼명을 바꾸지 않는다.
> **확인 상태:** [사용자 실행] 직접 전달된 Windows 로그, [원문 검토] GitHub 코드, [미확인] 실제로 수행하지 않은 단계. 이 문서는 실제 계정 연결·유료 AI·조치·OSV·공식 통과의 증명이 아니다.

## 1. 프로젝트 소개와 지원 범위

ARGOS는 현재 사용자 본인의 로그인 계정·기기·세션 상태, 업무 앱의 접근 판정, 접속 이력과 XDR 경보를 표시하는 Windows 로컬 보안 앱이다. 승인된 환경에서는 AI가 **현재 사건의 근거를 인용한 참고 설명**을 만들고, 조치 준비·사람 확인·요청 접수(ACK)·원천 효과 관측을 서로 구별해 표시한다. 실제 접근 판정·탐지·조치 집행은 **기존 SDP·XDR 원천**의 역할이며 학생 함수가 직접 하지 않는다. 설치 패키지 점검은 운영자가 승인한 공개 패키지의 정확한 버전을 OSV 조회 결과와 대조해 표시한다.

**현재 소스와 버전:** `on-client/package.json`은 `alekov-client-starter` **0.2.11**이며 `"type": "module"`, `"engines": {"node":"24.19.0"}`, `scripts`는 `start`·`demo`·`check`다. 외부 npm 의존성 선언이 없고, 저장소의 `on-client`에 `package-lock.json`이 추적되어 있지 않다. `npm test` 스크립트가 아니라 `node --test`를 사용한다. 실행 도구 중 `tools/start-alekov.ps1`와 `tools/prepare-native-host.ps1`만 과거 Native Host 자동 준비 호환 보완이 반영되어 있다([변경 기록](ARGOS_NATIVE_HOST_UPDATE.md)). **시작 틀 전체가 0.2.15로 갱신됐다고 주장하지 않는다.**

| 실행 조건 | 확인 상태 |
| --- | --- |
| Windows, PowerShell, Git | [사용자 실행] 2026-10-23 새 Windows PowerShell 창에서 환경 확인·서버 시작·종료·재실행 완료. Git 실제 버전 `2.55.0.windows.3` |
| Node.js **22~24**(실행 스크립트 허용), 수업 기준 **24.19.0** | [사용자 실행] 실제 `node --version`은 **`v24.21.0`**. 지원 범위에 속하지만 기준 버전과 달라 참고 문구 출력 |
| 로컬 서버: `127.0.0.1` / 포트 기본값 **5189**, 검증 포트 **5190** | [사용자 실행] 새 PowerShell 창에서 5190 HTTP 응답 확인, 세 탭 표시, `Ctrl+C` 종료 후 연결 끊김 및 재실행 후 세 탭 재표시 확인 |
| macOS·Linux, 외부 운영 SDP·CLCO·OSV | [미확인] 이 문서에서 지원·재현 확인으로 표시하지 않음 |

## 2. 기존 폴더와 파일 구조

- **Git 루트:** `%LOCALAPPDATA%\ALEPH\Workbench\projects\아르고스-방어전`
- **앱 실행 폴더:** `%LOCALAPPDATA%\ALEPH\Workbench\projects\아르고스-방어전\on-client`
- Git은 위 프로젝트 루트에서 관리한다. PowerShell 실행 스크립트와 Node 테스트는 `on-client`에서 수행한다. 다른 프로젝트 파일을 삭제·초기화·복제하여 덮어쓰지 않는다.

~~~text
아르고스-방어전/                        [Git 최상위]
├─ README.md                            학생 최상위 안내
└─ on-client/
   ├─ README.md                         제공 시작 틀 안내(v0.2.11)
   ├─ package.json                      Node 실행 스크립트와 엔진 선언
   ├─ .env.example                      비밀 없는 설정 견본
   ├─ tools/start-alekov.ps1            Windows 로컬 실행 도구
   ├─ tools/prepare-native-host.ps1     별도 개인 Native Host 준비
   ├─ public/index.html                 제공 화면과 버튼 원문
   ├─ public/app.js                     제공 HTTP 요청·취소·렌더링
   ├─ public/vulnerabilities-view.mjs   OSV 응답 정규화 및 제공 표시
   ├─ src/server.mjs                    loopback HTTP·API
   ├─ src/engine.mjs                    기존 엔진/예제/미연결
   ├─ src/engine/sdp-host.mjs           SDP 연동 조건부 호스트
   ├─ src/connection/native-context.mjs Native 계정 연결
   ├─ src/ai/service.mjs                AI 권한·근거 설명 검증
   ├─ src/ai/vault-service.mjs          별도 앱 자격 경계
   ├─ src/vulnerabilities/project-scan.mjs lock·설치 메타 대조
   ├─ vendor/clco-http.mjs              CLCO HTTP 호출
   ├─ student/extension.mjs             학생 render* 구현
   ├─ test/stage17-integrated.test.mjs
   ├─ test/stage18-evidence.test.mjs
   ├─ test/stage19-action.test.mjs
   ├─ test/stage20-vulnerabilities.test.mjs
   └─ docs/STUDENT_RUNBOOK.md          이 문서
~~~

`on-client/package.json`의 자체 설치 의존성과 **운영자 지정 외부 프로젝트의 `package-lock.json`·`node_modules` 검증 대상**은 다른 개념이다. OSV에서 사용하는 `ON_PROJECT_DIRECTORY`와 `ON_APPROVED_PUBLIC_PACKAGES`는 운영자 승인 사항이다. 취약점 사례를 만들려고 `npm install`하거나 버전을 낮추지 않는다.

## 3. 새 PowerShell에서 실행하는 절차

### 3.1 사전 점검: 새 PowerShell 창

아래 절차는 코드와 실제 학생 로그를 바탕으로 한다. **2026-10-23 새 PowerShell 창에서 환경 검사, 5190 서버 시작, 브라우저 확인, 종료, 재실행까지 학생이 직접 확인했다.** 실제 버전은 Node.js `v24.21.0`, Git `2.55.0.windows.3`이었다. 오류가 나면 다음 단계로 넘어가지 않는다.

~~~powershell
Set-Location -LiteralPath "$env:LOCALAPPDATA\ALEPH\Workbench\projects\아르고스-방어전"
git status --short
git rev-parse --show-toplevel
Set-Location -LiteralPath ".\on-client"
node --version
git --version
Test-Path -LiteralPath ".\package.json"
Test-Path -LiteralPath ".\src\server.mjs"
Test-Path -LiteralPath ".\tools\start-alekov.ps1"
~~~

`git status --short`가 빈 출력이면 현재 추적 작업 파일에 미커밋 변경이 없는 상태다. 변경 사항이 있다면 보존하고 확인한다. `Test-Path` 세 건은 모두 `True`여야 한다. 실제 `node --version`·`git --version` 값을 실행 후 기록해야 하며, 문서에는 미리 정해 넣지 않는다.

### 3.2 앱 시작

기존에 접근한 포트 5190을 사용하며, **현재 PowerShell 위치는 `on-client`**여야 한다.

~~~powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\tools\start-alekov.ps1" -Port 5190
~~~

**[사용자 실행] 2026-10-23 실제 PowerShell에서 확인한 정상 출력(핵심 3줄):**

~~~text
케셰브가 켜졌습니다. 브라우저에서 http://127.0.0.1:5190/ 을 여세요.
서버가 응답한 것만 확인했습니다. AI 연결 상태는 화면에서 따로 확인해 주세요.
끄려면 이 창에서 Ctrl+C 를 누르세요.
~~~

스크립트는 Node/경로/포트 점유를 검사하고 `src/server.mjs`를 시작한 뒤 `http://127.0.0.1:5190/` HTTP 200을 확인한다. **[사용자 실행]** 실제 출력에 `계정 연결 준비가 끝났습니다. 앱에서 확인 번호로 로그인·승인을 진행하세요.`와 `참고: 지금 Node.js 는 v24.21.0 입니다. 수업 기준은 v24.19.0 입니다.`가 표시됐다. **Native Host 설정 준비≠계정 승인 성공**이고, 서버 HTTP 200도 실서비스 AI·SDP 성공을 증명하지 않는다.

브라우저 주소창에서 **http://127.0.0.1:5190/** 을 열어 `보호 현황` / `업무 앱` / `보안 기록` 탭과 `다시 불러오기` 버튼을 확인한다. **[사용자 실행] 세 탭이 정상 표시되는 것을 확인했다.** 처음에 주소에 `?utm_source=chatgpt.com`이 붙은 상태에서는 `QUERY_REJECTED`가 보였고, 이후 기본 주소로 다시 열어 정상 화면을 확인했다. **추적 파라미터 없는 URL을 직접 입력**한다. `disconnected`·`unknown`·`demo`이면 연결 성공이나 안전 상태로 바꾸지 않는다.

기본 실행 포트는 5189이며 5190이 점유된 경우 기존 프로그램을 종료하지 않는다. 빈 포트를 골라 `-Port 5191`처럼 새 포트를 지정할 수 있으나 **5191의 실제 재현은 미확인**이다. 포트를 바꾸면 브라우저 주소도 맞춘다.

### 3.3 종료와 재실행

1. 위 서버를 실행한 **같은 PowerShell 창**에서 `Ctrl+C`로 종료한다(`-Background`는 사용하지 않음). **[사용자 실행] 수행함.**
2. 브라우저에서 `http://127.0.0.1:5190/`을 새로고침해 `서버에 연결되지 않음`을 확인한다. **[사용자 실행] 확인함.**
3. `on-client`에서 3.2의 실행 명령을 반복한 뒤 **추적 파라미터 없는 기본 주소**를 연다. **[사용자 실행] 재실행 후 세 탭이 다시 정상 표시되는 것을 확인함.** 재시작 콘솔 전문은 수집하지 않았다.
4. 시작·종료·다시 시작하기는 코드 및 학생 작성 파일을 삭제하는 작업이 아니다. 실패했다고 Git을 초기화하지 않는다.

### 3.4 문법·회귀 테스트

~~~powershell
node --check student/extension.mjs
node --test
~~~

[사용자 실행, **2026-10-23**] 20단계 커밋 `97a3e0dcec35d875daedad28358124c784e898ee`의 Windows CMD에서 문법 검사 통과, `node --test` **42 tests / 42 pass / 0 fail / 0 skipped**. 구성: 17단계 11개, 18단계 9개, 19단계 10개, 20단계 12개. 이 결과는 **합성 입력·모의 AI/로컬 HTTP** 기반이다. [미확인] 21단계 문서 커밋으로 새 PowerShell 창에서 재실행한 결과.

## 4. 글로 쓴 시스템 구성도

**실선:** 저장소에서 확인한 로컬 코드/호출 관계. **점선:** 운영자 승인·외부 환경이 있는 경우에만 가능한 연결. 연결 가능 경로가 존재한다는 것과 실제 성공은 다르다.

~~~mermaid
flowchart LR
  B["PC 브라우저 / public/index.html · public/app.js<br/>http://127.0.0.1:5190/"]
  U["학생 렌더러<br/>student/extension.mjs"]
  S["로컬 HTTP 서버<br/>src/server.mjs"]
  E["접근 제어 엔진<br/>src/engine.mjs · src/engine/sdp-host.mjs"]
  X["기존 SDP·XDR 원천<br/>운영자 권한 필요"]
  A["AI 설명·권한 검증<br/>src/ai/service.mjs · src/ai/vault-service.mjs"]
  N["계정 연결<br/>src/connection/native-context.mjs"]
  G["CLCO AI 게이트<br/>운영 승인 필요"]
  P["ALEPH 포털 승인 페이지<br/>운영 계정 확인 필요"]
  V["설치 패키지 검사<br/>src/vulnerabilities/project-scan.mjs"]
  L["운영자 지정 프로젝트<br/>package-lock.json · node_modules"]
  O["OSV API<br/>https://api.osv.dev/v1/querybatch"]
  B -->|HTTP /api/*| S
  B -->|렌더링 호출| U
  S --> E
  E -.->|승인된 SDP 연결| X
  S --> A
  S --> N
  A -.->|앱 권한 승인 시| G
  N -.->|계정 로그인 승인 확인| P
  S --> V
  V -.->|운영자 지정 경로| L
  V -.->|허용된 공개 이름·버전만| O
~~~

Mermaid가 표시되지 않아도 이해할 수 있는 **동일한 텍스트 구조**:

1. 브라우저가 제공 UI `public/app.js`에서 로컬 `src/server.mjs`의 `/api/*`를 호출한다. 제공 UI가 받은 상태를 학생 `student/extension.mjs`로 전달하여 **상태 표시만** 수행한다.
2. 로컬 서버는 `src/engine.mjs` 계약으로 업무 앱 판정·보안 기록을 읽는다. `src/engine/sdp-host.mjs`를 통한 기존 SDP·XDR 실원천 연결에는 승인된 개인 설정(`-SdpHostConfig`)이 필요하다. **해당 실원천의 현재 사용자·XDR 연결 성공은 미확인**이다.
3. `src/connection/native-context.mjs`의 계정 연결과 `src/ai/service.mjs`/`src/ai/vault-service.mjs`의 AI 설명·권한 검증이 승인되면 `vendor/clco-http.mjs`를 통해 CLCO로 모델 요청이 가능하다. **실제 계정의 모델 생성 호출은 미확인**이다.
4. `src/vulnerabilities/project-scan.mjs`가 허용된 프로젝트의 lock 파일과 설치 메타데이터를 확인하고 승인된 공개 패키지에 한해서 OSV `https://api.osv.dev/v1/querybatch`를 호출한다. **운영 환경 OSV 조회·실제 설치 버전 대조는 미확인**이다.
5. **ALEPH 포털**은 Git 커밋 원문을 접수·AI 판정하는 별도 과정이다. 서버가 이 문서의 PowerShell 명령을 실행하지 않는다.

## 5. 제공 코드와 학생 구현의 경계

| 파일/모듈 | 역할 | 21단계 수정 여부 |
| --- | --- | --- |
| `public/index.html`, `public/app.js` | 3개 탭, 제공 버튼, 요청·취소·오래된 응답 무효화, 학생 렌더러 호출 | 제공 코드·변경 안 함 |
| `src/server.mjs`, `src/engine.mjs`, `src/engine/sdp-host.mjs` | 로컬 API, 기존 판정·이벤트·원천 연동 | 제공 코드·변경 안 함 |
| `src/ai/service.mjs`, `src/ai/vault-service.mjs`, `vendor/clco-http.mjs` | 권한 검사, 근거 제한 AI, AI 게이트 전송 | 제공 코드·변경 안 함 |
| `src/vulnerabilities/project-scan.mjs`, `public/vulnerabilities-view.mjs` | 정확한 설치 정보·OSV 응답 검증 및 제공 화면 | 제공 코드·변경 안 함 |
| `tools/start-alekov.ps1`, `tools/prepare-native-host.ps1` | Windows 실행, Native Host 개인 설정 준비 | 기존 변경 보존·이번 단계 변경 안 함 |
| `student/extension.mjs` | 13~20단계 렌더러 구현; 원천 보안 조치나 API 요청을 새로 만들지 않음 | 학생 작성 코드 보존 |
| `test/stage17-integrated.test.mjs`, `test/stage18-evidence.test.mjs`, `test/stage19-action.test.mjs`, `test/stage20-vulnerabilities.test.mjs` | 학생 측 모의·회귀 검증 | 기존 테스트 보존 |
| `docs/STUDENT_RUNBOOK.md`, Git 루트 `README.md`의 학생 안내 | 21단계 실행·구성·증거·장애 대응 문서 | 이번 단계 학생 문서만 변경 |

### 학생 작성 함수 (모두 `student/extension.mjs`)

| 단계·함수 | 지금 표시하는 내용 | 확인 범위 |
| --- | --- | --- |
| 13 `renderIdentity` | 현재 계정·기기·세션, 로딩/오류/unknown | 코드 확인, 실원천 미확인 |
| 14 `renderDecision` | 업무 앱 접근 허용/거절/추가 확인/확인 불가 | 코드 확인, 실원천 미확인 |
| 15 `renderEvents` | 접속·XDR 이벤트, 근거·규칙 및 상태 | 코드 확인, 실원천 미확인 |
| 16 `renderStatus` | 알림·진단·기기·세션·불명 상태 | 코드 확인, 실원천 미확인 |
| 17 `renderAiConnection` | 권한/모델 목록 점검과 실제 사건 추론의 분리 | 오프라인 기존 테스트 포함 |
| 18 `renderExplanation` | 현재 사건 ID, 근거 ID·원문, 규칙, unknown, 참고용 AI 요약 | 학생 PC 모의 9/9 |
| 19 `renderAction` | 제안/사람 확인/ACK/실제 관측·unknown·재전달 구분 | 학생 PC 모의 10/10, 실집행 없음 |
| 20 `renderVulnerabilities` | 정확한 버전·OSV ID·수정 시각·부분 실패·미조회 | 학생 PC 모의 12/12, 외부 조회 미확인 |

**버튼은 제공 UI만 담당한다.** 확인 티켓·실행 버튼·POST 요청을 학생 렌더러가 추가하지 않는다.

## 6. 실제 화면의 버튼·상태와 관찰 대상

버튼명은 제공 `public/index.html` 원문과 대조했다. 실제 클릭 완료는 해당 기능별로 별도 기록해야 한다.

| 탭 / 기능 | 실제 버튼 | 확인해야 하는 사실 |
| --- | --- | --- |
| 공통 | `다시 불러오기` | 이전 조회 값이 현재 세대 결과로 남지 않는지 |
| 보호 현황/진단 | `도움정보 불러오기` → `확인했으며 복사합니다` | 비밀 없는 도움 정보만 사람이 읽고 복사 |
| AI 계정 연결 | `계정 연결 시작` → `로그인 확인 완료` → `현재 로그인 확인` | 포털 승인 번호·설정 비밀을 공개하지 않음 |
| AI 앱 승인 | `AI 연결 시작` → `승인 페이지 열기` → `승인했으며 연결 확인` / `상태 다시 확인` | 운영자 권한 필요, 앱 실행만으로 승인 아님 |
| AI 점검 | `현재 API 연결 점검` / `AI 연결 점검` | 모델 목록 확인은 실제 사건 설명 생성이 아님 |
| 취약점 조회 | `설치 패키지 조회` / `패키지 조회 취소` | 조회 중·미조회·부분·오류, 이전 표 제거 |
| 보안 기록 | `AI 설명 취소` | 완료 전 취소가 과거 성공을 재사용하지 않는지 |
| 조치 상태 | `대상과 조치를 확인했으며 집행합니다` / `원천 결과만 재조회` / `조치 화면 취소` | **실제 집행 시험 금지.** 취소는 이미 서버에 전달된 효과를 되돌리지 않음 |

`조치 준비` 버튼은 지원 조치·제안이 있을 때만 표시되는 조건부 제공 기능이다. 현재 사건의 `supportedActions`가 빈 배열이므로 기본 화면에서 나타나지 않는 것이 정상이다.

## 7. 장애 발생 시 실제 코드 기준 확인·복구

| 오류 코드 또는 증상 | 확인할 것 / 조치 | 기록 상태 |
| --- | --- | --- |
| `Node.js 가 없습니다`, `지금 Node.js 는 ...` | `node --version` 결과와 스크립트 허용 22~24 비교. 지원 버전 준비 후 새 창에서 재시작 | 환경 오류 |
| `포트 ... 를 다른 프로그램이 쓰고 있습니다` | 해당 프로세스 강제 종료하지 말고 다른 사용 가능한 `-Port` 지정 | 서버 미시작 |
| `앱 폴더가 아닙니다`, `시작 틀 폴더가 아닙니다` | `on-client` 경로·`package.json`·`src/server.mjs` 확인. 기존 파일 삭제 금지 | 경로 오류 |
| `...초 안에 뜨지 않았습니다` | 서버가 HTTP 200에 도달하지 못함. PowerShell 오류 출력 확인 | 서버 미확인 |
| `NATIVE_LOGIN_STATUS_ONLY` / `NATIVE_LOGIN_PENDING` | 포털 승인 대기. 동일 계정·현재 확인 상태 점검. 6자리 번호 공개 금지 | 승인 미완료 |
| `NATIVE_HOST_UNVERIFIED` / `NATIVE_LOGIN_SERVER_UNKNOWN` | Native Host/포털 결과 확인 불가. 안전한 코드만 담당자에 전달, 설정 재생성 금지 | 미확인(UNV) |
| `ON_AI_PROVISIONING_PENDING` / `WB_CLCO_AUTH_REQUIRED` | 계정 연결·AI 앱 승인·운영자 앱 권한 확인 | AI 연결 미확인 |
| `WB_CLCO_RATE_LIMITED` / `WB_CLCO_TIMEOUT` / `WB_CLCO_NETWORK_ERROR` | 요청 제한/지연. 유료 요청을 연달아 반복하지 않음 | 조회 실패/대기 |
| `ENGINE_NOT_CONNECTED` / `SUBJECT_SCOPE_UNVERIFIED` | 담당자가 준 SDP 호스트·학생/프로젝트 범위 확인. 임의 키 생성 금지 | 기존 원천 연결 미확인 |
| `CONTRACT_MISMATCH` | 제공 API 응답 계약 불일치. 한 번 직접 `다시 불러오기` 후 같은 오류면 담당자 문의 | 계약 확인 불가 |
| `QUERY_REJECTED` (URL에 `?utm_source=chatgpt.com`) | **[사용자 관찰]** 지원하지 않는 쿼리 문자열이 붙은 루트 요청. `http://127.0.0.1:5190/` 주소를 추적 파라미터 없이 직접 입력. 실서비스 연결 문제로 해석하지 않음 | URL 형식 오류, 이후 정상 화면 확인 |
| `ACTION_UNSUPPORTED`, `pending`, `unknown` | 미지원/ACK/결과 불명을 효과 확인으로 변경 금지. 지원 환경일 때 원천 결과 재조회 | 집행 미지원/효과 미확인 |
| `not_configured` / `not_checked` | 운영자 프로젝트 지정 없음 / 승인 조회 패키지 없음. 학생이 허용 목록 조작 금지 | OSV 미조회 |
| `partial` / `unverifiable` / `none_found` | 발견된 ID 유지 / 확인 불가 / 조회 범위·시점의 알려진 결과 없음 | 일부/미확인/범위 한정 |

상세 매핑은 제공 [CONNECTION_TROUBLESHOOT.md](CONNECTION_TROUBLESHOOT.md)를 따른다. 도움정보의 비밀값·개인 설정 파일 원문은 커밋하지 않는다.

## 8. 직접 확인 증거와 미확인 기능

| 근거와 시점 | 상태 | 증명하는 범위 |
| --- | --- | --- |
| 사용자 제공 Windows CMD 로그(2026-10-23) `node --check` | **[사용자 실행] PASS** | 20단계 당시 `student/extension.mjs`·20단계 테스트 파일 문법 |
| 같은 로그 `node --test` | **[사용자 실행] 42/42 PASS, 0 FAIL** | 17단계 11 + 18단계 9 + 19단계 10 + 20단계 12. 모의 입력·로컬 서버 테스트 |
| 사용자 `git rev-parse HEAD` / `git status --short` | **[사용자 실행]** `97a3e0dcec35d875daedad28358124c784e898ee` / Clean | 20단계 로컬 Git 작업 상태 |
| 이전 로컬 `http://127.0.0.1:5190/` 접근 | **[이전 작업 관찰]** | 당시 앱 서버 접근 및 계정 연결 시도. **새 문서 절차 재현 아님** |
| 사용자 제공 PowerShell 로그(2026-10-23) 환경 확인 | **[사용자 실행] 확인** | Node.js `v24.21.0`, Git `2.55.0.windows.3`; `package.json`, `src/server.mjs`, `tools/start-alekov.ps1`는 각각 `True` |
| URL 추적 파라미터 관련 화면(2026-10-23) | **[사용자 관찰] 복구 확인** | `/?utm_source=chatgpt.com`에서 `QUERY_REJECTED` 표시; 기본 `http://127.0.0.1:5190/`으로 접근해 세 탭 표시 |
| **21단계 새 PowerShell 창에서 실행→종료→재시작** | **[사용자 실행] 확인** | 5190 서버 시작·HTTP 정상 신호·세 탭 표시→`Ctrl+C` 종료 후 브라우저 연결 실패→재실행 후 세 탭 다시 표시. 두 번째 실행의 콘솔 전문은 미수집 |
| 실제 SDP 계정·앱 접근 판정 및 XDR 기록 | **[미확인]** | 사용자 범위 실원천과의 연결 미검증 |
| 실제 CLCO 모델 사건 설명·앱 권한 | **[미확인]** | 17~18단계 모의 표시 ≠ 실모델 호출 |
| 실제 원천 조치·효과 확인 | **[지원 미준비/미확인]** | 기본 기록의 지원 조치 없음; 실행 시도하지 않음 |
| 운영자 프로젝트의 lock 파일·`node_modules` 대조 및 실제 OSV 조회 | **[미확인]** | 20단계 12개 오프라인 화면 테스트와 분리 |
| 21단계 서버 AI 판정 | **[미확인/미제출]** | 서버는 소스를 읽으며 명령을 실행하지 않음 |

기록에 없는 Node/Git 버전, 실제 외부 주소, API 호출 횟수, 조치 성공·단계 점수는 임의로 채우지 않는다.

## 9. 개인정보·설정·원문 제출

- 실제 `.env`, 개인 `NativeHostConfig`/`SdpHostConfig`, CA/인증서/키, JWT, 토큰, 암호, 확인 번호·브라우저 쿠키는 **프로젝트·Git·제출물 밖에서만** 관리한다. `.env.example`은 민감값 없는 설정 견본이다.
- 브라우저에는 토큰 입력 기능을 추가하지 않는다. Workbench 열쇠를 재사용·복사하지 않는다. 오류 시 코드는 전송해도 민감 정보·전체 설정 원문은 보내지 않는다.
- 21·22단계 공식 포털은 **저장소 주소와 40자리 커밋을 수동 입력**한다. 현재 Workbench의 `포털 제출 준비`는 13~20단계까지만 지원한다는 21단계 공식 안내를 따른다. [제공 실행 안내](STUDENT_LAUNCH_GUIDE.md)의 과거 21/22 미확정 설명보다 이번 공식 과제 화면을 우선한다.
- 이 저장소는 공개 원문 직접 확인 방식으로 제출 가능하다. **비공개 저장소**일 경우에만 과제 화면의 원문 전달 도구 안내대로, 학생 **Git 최상위**에서 정확한 `--commit`을 지정하고 프로젝트 밖에 JSON 파일을 생성한 뒤 직접 선택한다. 도구를 실행하거나 JSON을 생성했다고 가정하지 않는다.
- **실제 사용자 PC 재현 결과, GitHub 커밋 생성, 서버 원문 전달, 공식 AI 통과, 운영 연결**은 서로 다른 검증 단계다.

## 10. 근거가 되는 제공 문서

- [시작 틀 README](../README.md) · [실행 안내](STUDENT_LAUNCH_GUIDE.md) · [처음 시작하기](GETTING_STARTED_STUDENT.md)
- [단계별 함수 계약](STUDENT_PROMPTS.md) · [최종 제품 역할 범위](FINAL_PRODUCT_GUIDE.md)
- [Native Host 별도 호환 변경](ARGOS_NATIVE_HOST_UPDATE.md) · [연결 오류 코드](CONNECTION_TROUBLESHOOT.md)
- [SDP Host 연결 계약](SDP_HOST_CONNECTION.md) · [AI 연결](AI_SETUP_GUIDE.md)
- [ARGOS 학생 저장소 README](../../README.md)
