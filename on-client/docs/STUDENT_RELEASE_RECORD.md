# ARGOS 22단계 · 새 폴더 재현 및 최종 인수인계 기록

> 2026-10-23 시작 · 학생 작성 · **검증 중(release candidate), v1.0 아님**
>
> **작성 원칙:** [원문 확인] GitHub에 커밋된 파일을 읽은 사실, [과거 사용자 실행] 기존 작업 폴더의 로그, [별도 폴더 사용자 실행] 실제로 새 클론에서 확인한 사실, [미확인] 아직 하지 않은 검사로 구분한다. ALEPH AI는 원문을 읽어 판정하지만 이 명령들을 실행하지 않는다. **[별도 폴더 사용자 실행] 2026-10-23 후보 커밋 `8931fc6e5dc444b12cd9064581d762ed9f1469ca`에서 clone·문법 검사·42개 테스트·5192 시작/종료/재시작·세 탭을 확인했다.** 이후 **2026-10-23 문서 개정 커밋 `e4fff2d8c323ef853d608a065c858179e6941a13`의 새 클론에서도** 문법·42개 테스트·서버 시작/종료/재실행과 세 탭 복귀를 학생이 확인했다. 아래 기록을 추가하는 새 커밋은 **문서만 수정하므로**, 커밋 갱신 후 원문/HEAD와 기존 코드 동일성을 별도로 대조한다.
>
> **이번 인수인계의 코드 기준:** 21단계 소스 `72c024f920ba54aa8c284acc7d8d4d3fa4e2d0ee`에서 22단계 문서만 추가한 별도 Git 커밋. 22단계 최종 40자리 검증 대상은 문서의 `git rev-parse HEAD`와 제출 화면에 직접 기록한 SHA가 **완전히 일치**해야 한다. 이 문서에 미래 커밋 해시를 임의 기입하지 않는다. **새 폴더 테스트 뒤 문서를 바꾸면 새로운 커밋이 되므로, 최종 커밋으로 새 폴더를 다시 맞추고 검증한다.**

## 1. 제품·버전·지원 환경

- 제품명 **아르고스(ARGOS)**. 제공 UI·서버 시작 로그에는 기본 제품명 **케셰브**가 보일 수 있다. 프로젝트 파일·버튼·API 이름은 변경하지 않는다.
- 저장소: `https://github.com/yeaun12/argos-security-agent`, 작업 브랜치: `stage22/reproducible-release-20261023`. **기존 프로젝트 원본:** `%LOCALAPPDATA%\ALEPH\Workbench\projects\아르고스-방어전`. 원래 폴더를 삭제·이동·초기화하지 않는다.
- 앱 루트는 **Git 루트/`on-client`**. `package.json`의 실제 선언은 `alekov-client-starter`, **0.2.11**, ES Module, `node` 엔진 표시 **24.19.0**. 실행 스크립트는 **Node.js 22~24 허용**, 기준 24.19.0. **별도 재현 폴더를 만든 같은 사용자 PC에서 Node.js `v24.21.0`, Git `2.55.0.windows.3`을 확인**했다. 다른 PC에의 이식은 검증하지 않았다.
- [과거 사용자 실행/원본 PC] Windows PowerShell, Node.js **v24.21.0**, Git **2.55.0.windows.3**. 20단계 **42/42 통과**, 21단계 원본 폴더의 서버·세 탭·종료·재실행 확인. [별도 폴더 사용자 실행/2026-10-23] **새 clone 후보 커밋 `8931fc6…`에서 독립적으로** Node/Git 버전과 필수 파일 3개·문법 검사·**42/42 통과** 및 서버 시작·종료·재시작을 확인했다. **추가로 `e4fff2d8c323ef853d608a065c858179e6941a13` 새 클론에서 문법/42개 테스트/시작·종료·재실행을 재확인**했다. 확인 기록을 저장한 후속 문서 커밋과 코드 실행 결과는 SHA별로 구분한다.
- 지원 범위: Windows PowerShell·Node.js 22~24·개인 PC의 127.0.0.1 서버. **macOS/Linux·운영 환경 인증·실원천 집행·운영 안전성·v1.0은 미확인**.
- 코드상의 npm 스크립트: `npm start` = `node src/server.mjs`, `npm run demo` = 예제 서버, `npm run check` = 학생 모듈 문법 검사. `npm test` 스크립트 없음. 코드 의존성 선언이 없고 **`on-client/package-lock.json`도 Git에 없다**. 이 앱 복원에 `npm install`을 필수로 추가하지 않으며 필요하지 않은 설치로 lock 파일을 생성하지 않는다. 20단계 OSV는 관리자가 승인한 **별도 대상 프로젝트의 package-lock.json·설치된 node_modules**를 검증하는 경로다.

## 2. 보존 원칙과 이동 가능한 파일

| 범주 | 필수 파일 또는 위치 | 이동·복원 정책 |
| --- | --- | --- |
| 소스/학생 함수 | `README.md`, `on-client/student/extension.mjs`, `on-client/public`, `on-client/src`, `on-client/vendor` | 공개 저장소의 **정확한 커밋**에서 `git clone`/`git checkout --detach`로 복구 |
| 구성/실행 도구 | `on-client/package.json`, `.env.example`, `tools/start-alekov.ps1`, `tools/prepare-native-host.ps1` | 동일 커밋 원문을 그대로 사용, 샘플값을 실제 비밀로 사용하지 않음 |
| 설명·증거 | `on-client/docs/STUDENT_RUNBOOK.md`, `on-client/docs/STUDENT_RELEASE_RECORD.md`, 단계별 테스트 | 같은 커밋의 문서만 인수인계, 서로 다른 커밋의 PASS를 합쳐 쓰지 않음 |
| 실행 중인 개인정보/세션/계정 자격 | 원래 환경의 Native Host 개인 설정·SDP 인증서/JWT·브라우저 쿠키·`.env` | **Git에 넣거나 무작정 복사 금지**. 원래 환경에서 보존, 새 환경에는 운영자가 정식 재발급·재승인한 설정만 별도 안전 저장 |
| 외부 원천의 업무·보안 로그 | 운영자가 관리하는 SDP·XDR DB/원천 | 이 저장소에 전체 백업이 없으며, **이 문서로 원천 데이터 복구 가능하다고 주장하지 않음** |
| OSV 조회 메타데이터 | 운영자가 지정한 외부 프로젝트의 잠금 파일·실제 설치 메타데이터 | 별도 승인·검증된 대상에 한해 조회. 새 클론에서는 자동으로 옮기거나 설정하지 않음 |

### 백업·복원 계획(문서상 계획, 실제 복원 테스트 미실시)

1. **백업 범위:** 학생이 커밋·푸시한 Git 원문(README, 코드, 문서, 테스트)과 40자리 커밋을 확인한다. 원래 워크벤치 폴더와 사용자 개인 정보·설정은 **그대로 보존**한다. 원래 작업에 미커밋 파일이 있다면 먼저 목록을 확인하며 자동 삭제·초기화·무단 커밋하지 않는다.
2. **소스 복원:** 새로운 빈 폴더에 `git clone`하고, 확인받을 **같은 SHA**를 `git checkout --detach`하여 복원한다. `git rev-parse HEAD`와 `git status --short`로 원문·작업 트리를 확인한다. `git reset --hard`, `git clean -fd`, 원본 `.git` 복사로 강제로 되돌리지 않는다.
3. **환경 복원:** Node.js 지원 버전을 설치하고 `on-client`에서 스크립트를 시작한다. 계정 없는 독립 검증은 `-NoNativeHost`를 **명시적으로** 지정하되, 일반 `start-alekov.ps1` 실행과 결과를 혼동하지 않는다. 일반 스크립트는 개인 Native Host 설정을 **자동 생성/검증·재사용**하고 `--native-host-config`로 서버에 전달하며, 실패하면 서버 시작을 멈춘다. `npm start`는 이 자동 준비를 하지 않는다.
4. **학생 데이터/기록 복원 한계:** Git으로 복원할 수 있는 것은 추적된 코드·문서·테스트뿐이다. Native Host 보관소, 인증/승인 상태, 실사용자 SDP/XDR 기록, AI 요청 결과는 Git에 포함되지 않으므로 **이 절차로 복구하지 않는다**. 이런 데이터는 해당 원천 관리자에게 보존·재승인·백업/복구 절차를 확인해야 한다. 수업용 프로젝트가 실제 운영 복원을 수행했다고 주장하지 않는다.
5. **검증:** 동일 최종 커밋에서 문법 검사·`node --test`·로컬 HTTP 200·화면 세 탭·종료·재실행을 각각 결과로 기록한다. 실패 시 테스트 결과는 실패/미확인으로 기록하고 데이터·자격을 삭제하지 않는다.

## 3. 동일 커밋을 새 빈 폴더에서 받기

> **[별도 폴더 사용자 실행] 후보 커밋 `8931fc6e5dc444b12cd9064581d762ed9f1469ca`를 2026-10-23 GitHub에서 새 폴더에 clone하여 확인했다.** 아래 명령은 재현 및 새 최종 커밋 검사용으로 남긴 안내이며 실제 사용자의 clone 명령은 `git clone --branch stage22/reproducible-release-20261023 --single-branch ... $newRoot`와 `git -C $newRoot checkout --detach 8931fc6e5dc444b12cd9064581d762ed9f1469ca`였다. 아래 명령은 기존 원본 폴더를 유지한다. 새 대상 폴더가 이미 있으면 **즉시 멈추고** 이름을 다시 정한다. 프로젝트 폴더 안이나 비밀 설정 폴더를 대상으로 삼지 않는다. PowerShell 창에서 실행한다.

~~~powershell
# 0. 원본 보존과 작업 상태 확인 (원래 프로젝트를 수정하지 않음)
$original = Join-Path $env:LOCALAPPDATA "ALEPH\Workbench\projects\아르고스-방어전"
git -C $original rev-parse HEAD
git -C $original status --short
Test-Path -LiteralPath "$original\on-client\student\extension.mjs"

# 1. 별도 비어 있는 새 위치: 파일은 만들어 두지 않음
$newRoot = Join-Path ([Environment]::GetFolderPath('MyDocuments')) "argos-stage22-repro-20261023"
if (Test-Path -LiteralPath $newRoot) { throw "새 재현 폴더 경로가 이미 있습니다. 삭제하지 말고 다른 이름을 선택하세요." }

# 2. 공개 GitHub에서 소스만 클론. 아래 SHA는 실제 이번 제출 커밋으로 확인한 후 대체한다.
git clone https://github.com/yeaun12/argos-security-agent.git $newRoot
Set-Location -LiteralPath $newRoot
git checkout --detach <제출할_40자리_SHA>
git rev-parse HEAD
git status --short
~~~

**주의:** `<제출할_40자리_SHA>`는 자리표시자이며 실제 명령에 그대로 입력하면 안 된다. 작업 브랜치명 `stage22/reproducible-release-20261023`만 맞다고 동일 원문이 증명되지는 않는다. 제출 SHA와 **출력된 HEAD 40자리**를 비교한다. GitHub 접근 또는 커밋 확인에 실패하면 별도 폴더 재현도 [미확인]으로 남긴다. 원본 21단계 커밋 `72c024f920ba54aa8c284acc7d8d4d3fa4e2d0ee`은 **새 22단계 최종 SHA가 아니다.**

## 4. 새 폴더에서의 확인 절차 — 후보 커밋에서 직접 검증, 최종 문서 커밋은 별도 확인

`Set-Location "$newRoot\on-client"` 후 테스트한다. 새 클론에 비밀 설정을 옮기지 않으며 학생이 임의 계정 로그인·유료 AI·실보안 조치를 시도하지 않는다.

~~~powershell
Set-Location -LiteralPath (Join-Path $newRoot "on-client")
node --version
git --version
Test-Path -LiteralPath ".\package.json"
Test-Path -LiteralPath ".\src\server.mjs"
Test-Path -LiteralPath ".\tools\start-alekov.ps1"
node --check student\extension.mjs
node --test
~~~

[별도 폴더 사용자 실행/2026-10-23, 후보 커밋 `8931fc6e5dc444b12cd9064581d762ed9f1469ca`] 경로 `C:\Users\User\Documents\argos-stage22-repro-20261023\on-client`, Node.js `v24.21.0`, Git `2.55.0.windows.3`, 필수 파일 3개 모두 `True`, `node --check student\extension.mjs` 오류 없이 종료, `node --test` **42 tests / 42 pass / 0 fail / 0 skipped / 0 cancelled**, 사용자 로그의 소요 시간 **216.6349ms**. 이는 같은 PC의 **새 Git clone**에서 실행한 모의 입력·로컬 HTTP 테스트다. 실제 운영 SDP·AI·OSV 연결 성공으로 해석하지 않는다. **이 기록 후 새 문서 커밋은 별도로 검증해야 한다.**

### 안전한 UI 시작/종료/재시작

원본에서 `5190` 포트 서버가 계속 실행 중일 수 있으므로, 새 클론은 **다른 루프백 포트 5192**를 사용했다. [별도 폴더 사용자 실행/2026-10-23] 포트 `5192` 시작 스크립트의 로컬 서버 HTTP 응답 확인 출력, 브라우저 3개 탭 표시, `Ctrl+C` 후 서버 연결 실패, **같은 명령으로 재실행 후 3개 탭 정상 복귀**를 학생이 보고했다. **재시작의 콘솔 출력 전문은 별도로 수집하지 않았다.**

~~~powershell
# on-client 위치, 개인 호스트 자동 생성·재사용을 건너뛰는 격리 확인
powershell -NoProfile -ExecutionPolicy Bypass -File ".\tools\start-alekov.ps1" -NoNativeHost -Port 5192
~~~

- **[별도 폴더 사용자 실행] 실제 전달된 시작 로그:** `참고: 지금 Node.js 는 v24.21.0 입니다. 수업 기준은 v24.19.0 입니다.`, `케셰브 연결 확인: http://127.0.0.1:5192`, `케셰브가 켜졌습니다. 브라우저에서 http://127.0.0.1:5192/ 을 여세요.`, `서버가 응답한 것만 확인했습니다. AI 연결 상태는 화면에서 따로 확인해 주세요.`, `끄려면 이 창에서 Ctrl+C 를 누르세요.`. 이는 로컬 서버 준비 확인이지 Native Host 승인 성공이 아니다.
- 브라우저 주소를 **`http://127.0.0.1:5192/`**로 직접 입력한다(`?utm_source=...` 같은 추가 쿼리 금지). `보호 현황` / `업무 앱` / `보안 기록` 탭과 학생 표시의 초기/미연결 상태를 확인한다.
- `-NoNativeHost`를 사용했으므로 Native Host 연결·실AI·SDP 원천 데이터가 **없거나 확인 불가**인 것이 예상되며, `NATIVE_HOST_DISABLED`는 이 **명시적 미연결 모드에서만** 계정 연결 API 호출 시 가능하다.
- 실행 PowerShell에서 `Ctrl+C` → 브라우저 새로고침 연결 실패 확인 → 동일 포트와 동일 옵션으로 재실행 → 세 탭 정상 복귀 확인. 새 클론을 여러 번 만들 필요는 없다.
- 브라우저 클릭/초기 화면이 보인 것만으로 13~20 모든 기능이 실제 연동됐다고 쓰지 않는다.

## 5. 13~21단계별 기능·검증 근거(현재 후보 상태)

**분류:** [원문] 함수/문서 확인, [과거 로컬] 원본 또는 20단계 커밋 테스트, [별도 폴더] 2026-10-23 후보 SHA `8931fc6e5dc444b12cd9064581d762ed9f1469ca`의 새 클론 검사·화면, [UNV] 운영 연결 또는 **문서 개정 후 최종 SHA** 검증 미실시. [별도 폴더] 증거: **42/42 테스트 및 화면 3개·시작/종료/재시작**. 모의/화면 표시와 실원천 검증은 다르다.

| 단계 | 기능과 원문 위치 | 과거 확인된 내용(시점/근거) | 22단계 새 폴더 확인 상태·제한 |
| --- | --- | --- | --- |
| 13 | `renderIdentity` · `student/extension.mjs`; 현재 로그인·기기·세션 | [원문] 함수 존재. 21단계 원본 PC에서 보호 현황 탭 표시(2026-10-23) | [별도 폴더] `보호 현황` 탭 표시(2026-10-23); [UNV] 실계정 신원·기기 데이터 |
| 14 | `renderDecision` · 업무 앱 allow/deny/challenge/unknown | [원문] 함수 존재. 기존 PC 업무 앱 탭 표시(2026-10-23) | [별도 폴더] `업무 앱` 탭 표시(2026-10-23); [UNV] 실 SDP 원천 판정 |
| 15 | `renderEvents` · 접속·XDR 사건과 근거 | [원문] 함수 존재. 기존 PC 보안 기록 탭 표시(2026-10-23) | [별도 폴더] `보안 기록` 탭 표시(2026-10-23); [UNV] 실제 XDR 원천 기록 |
| 16 | `renderStatus` · 상태·오류·진단 | [원문] 함수 존재. 과거 콘솔에서 오류·미연결 상태 대조 | [별도 폴더] 앱 초기 화면 표시(2026-10-23); [UNV] 운영 상황·상태 전체 |
| 17 | `renderAiConnection` 및 AI 연결 제공 코드 | [과거 로컬] 20단계 `node --test` 기존 통합 11/11 (2026-10-23, 모의 AI/loopback) | [별도 폴더] 누적 테스트 11/11 통과(모의 HTTP/AI, 2026-10-23); [UNV] 실제 앱 승인·모델 목록 |
| 18 | `renderExplanation` · 근거/규칙/unknown | [과거 로컬] 20단계 `node --test` 9/9(2026-10-23, 모의 입력) | [별도 폴더] 누적 테스트 9/9 통과(모의 입력, 2026-10-23); [UNV] 실제 모델의 본인 사건 설명 |
| 19 | `renderAction` · 사람 확인/ACK/관측/unknown | [과거 로컬] 20단계 `node --test` 10/10(2026-10-23, 모의 입력) | [별도 폴더] 누적 테스트 10/10 통과(모의 입력, 2026-10-23); **[미지원/UNV] 실집행 권한·조치 효과** |
| 20 | `renderVulnerabilities` · 정확한 버전/OSV ID·partial/none_found | [과거 로컬] 20단계 `node --test` 12/12(2026-10-23, 모의 입력) | [별도 폴더] 누적 테스트 12/12 통과(모의 입력, 2026-10-23); [UNV] 실제 package-lock 대조·외부 OSV |
| 21 | `docs/STUDENT_RUNBOOK.md` · 설치/구성/오류 복구 | [과거 사용자 실행] 원래 작업 폴더에서 Node v24.21.0/Git 2.55.0, 서버 5190·3탭·종료·재실행 확인. 21단계 첫 AI 판정은 5/6 통과, 실행 설명 정정 후 공식 재판정 **사용자 결과 미제공** | [별도 폴더] 21단계 설명서와 같은 도구를 `-NoNativeHost`로 사용해 로컬 재현(2026-10-23), 연결 방식은 기존 21단계 일반 실행과 다름. [UNV] 21단계 공식 재판정·운영 계정 승인 |

위 `42/42`는 20단계 커밋 `97a3e0dcec35d875daedad28358124c784e898ee`에서도 [과거 로컬] 통과했고, **2026-10-23 별도 폴더의 후보 커밋 `8931fc6e5dc444b12cd9064581d762ed9f1469ca`에서 다시 실제 실행하여 42/42 통과**했다. 하지만 이 문서에 관찰 결과를 추가하는 커밋은 **다른 40자리 SHA**가 되므로 새 HEAD에서 동일 검증을 다시 확인해야 한다.

## 6. 재현 증거 입력란(최종 SHA와 결과만 기록)

**학생이 보고한 2026-10-23 새 클론 증거를 아래에 기록한다.** 각 행의 코드 기준은 **`8931fc6e5dc444b12cd9064581d762ed9f1469ca`**이다. 이 결과를 반영한 새 문서 커밋은 다른 SHA가 되므로, **해당 최종 SHA로 새 폴더를 다시 맞춘 뒤 실행·테스트·기록 내용을 대조하기 전에는 전체 최종 커밋 검증 완료로 표기하지 않는다.**

| 항목 | 확인 시각(KST) | 실제 명령/입력과 증거 | 상태 |
| --- | --- | --- | --- |
| 제출 저장소 URL·브랜치 | 문서 기준 2026-10-23 | `https://github.com/yeaun12/argos-security-agent` / `stage22/reproducible-release-20261023` | [원문 확인] |
| **제출할 최종 40자리 SHA** | **아직 재확인 필요** | 이 문서 개정 커밋 이후 `git rev-parse HEAD`·새 클론 HEAD·공식 입력값 일치 필수. **후보 재현 SHA `8931fc6e5dc444b12cd9064581d762ed9f1469ca`와 구별** | [UNV: 최종 커밋] |
| 원래 작업 폴더 존재·기록 보존 | 2026-10-23(시각 미수집) | 원본 `student/extension.mjs` `True`; 원본 HEAD `72c024f920ba54aa8c284acc7d8d4d3fa4e2d0ee`; `git status --short` 빈 출력 | [별도 폴더 사용자 실행] 확인 |
| 새 폴더 이름·clone·HEAD·clean | 2026-10-23(시각 미수집) | `C:\Users\User\Documents\argos-stage22-repro-20261023`; 공개 GitHub `git clone --branch stage22/reproducible-release-20261023 --single-branch`; `checkout --detach 8931fc6e5dc444b12cd9064581d762ed9f1469ca`; `git rev-parse HEAD` 동일, `git status --short` 빈 출력 | [별도 폴더 사용자 실행] 확인(후보 SHA) |
| Node.js/Git·3개 필수 파일 | 2026-10-23(시각 미수집) | Node.js `v24.21.0`, Git `2.55.0.windows.3`; `package.json`, `src/server.mjs`, `tools/start-alekov.ps1` 모두 `True` | [별도 폴더 사용자 실행] 확인 |
| 문법 검사·`node --test` | 2026-10-23(시각 미수집) | `node --check student\extension.mjs` 출력 없이 정상 종료, `node --test`: **42 tests / 42 pass / 0 fail / 0 cancelled / 0 skipped / 216.6349ms**. 모의 단위·로컬 HTTP 검사 | [별도 폴더 사용자 실행] 통과(후보 SHA) |
| `-NoNativeHost -Port 5192` 서버 시작 | 2026-10-23(시각 미수집) | `powershell -NoProfile -ExecutionPolicy Bypass -File ".\tools\start-alekov.ps1" -NoNativeHost -Port 5192` 실행; `케셰브 연결 확인: http://127.0.0.1:5192`와 HTTP 응답 확인 문구 출력 | [별도 폴더 사용자 실행] 확인 |
| 3개 탭의 화면 | 2026-10-23(시각 미수집) | `http://127.0.0.1:5192/`에 사용자 접속, `보호 현황`·`업무 앱`·`보안 기록` 모두 표시됐다는 사용자 진술. 화면 세부 상태·실제 계정 연결 미확인 | [별도 폴더 사용자 실행] 탭 표시 확인 |
| 종료·동일 옵션 재시작 | 2026-10-23(시각 미수집) | `Ctrl+C` 후 새로고침 시 연결 실패 메시지 확인, 동일 `-NoNativeHost -Port 5192` 재실행 후 세 화면 모두 복귀했다는 사용자 진술. 재시작 명령의 출력 전문은 미수집 | [별도 폴더 사용자 실행] 확인(후보 SHA) |
| 실제 계정·SDP·XDR·AI·실집행·OSV | 미확인 | 운영자 승인 없이 수행하지 않음, 실집행은 현재 미지원 | [UNV] |
| **문서 개정 후 최종 SHA 재검증** | 아직 미실시 | 이번 기록을 커밋한 다음 새 폴더를 **해당 40자리 SHA**로 이동, clean·문법·42개 테스트·서버 시작/종료/재시작을 다시 확인할 것. 최종 결과는 제출 전 사용자 로그로 확인 | [UNV: 최종 커밋] |
| 22단계 공식 원문 판정 | 미제출 | 포털의 동일 저장소·40자리 SHA로 직접 제출, 서버 AI는 **실행하지 않음** | [UNV] |

### 6.1 2026-10-23 문서 개정 후보의 추가 재검증 기록

앞선 6장 표는 **첫 후보 `8931fc6e5dc444b12cd9064581d762ed9f1469ca`에서 실행하고 문서를 작성했을 당시의 기록**이다. 그 문서를 커밋한 다음 아래와 같이 **별도 폴더의 HEAD를 `e4fff2d8c323ef853d608a065c858179e6941a13`으로 전환해 다시 실행한 사실**을 별도로 보존한다. 기존 증거를 지우거나 두 커밋의 검사를 한 번의 실행으로 합치지 않는다.

| 검증 항목 | 대상 커밋 / 실행 환경 / 직접 관찰 | 결과 |
| --- | --- | --- |
| 새 복제 폴더 소스 동기화 | [별도 폴더 사용자 실행, 2026-10-23, 세부 시각 미수집] `git -C $newRoot fetch origin stage22/reproducible-release-20261023`; `switch --detach e4fff2d8c323ef853d608a065c858179e6941a13`; `rev-parse HEAD` **정확히 일치**, `git status --short` 빈 출력. 재현 폴더 `C:\Users\User\Documents\argos-stage22-repro-20261023`. 원본 21단계 작업 폴더 보존 | **[사용자 실행] HEAD 일치, Clean** |
| 소스 문법 및 회귀 테스트 | [별도 폴더 사용자 실행, 2026-10-23] `node --check student\extension.mjs` 오류 없이 종료; `node --test` 결과 **42 tests / 42 pass / 0 fail / 0 cancelled / 0 skipped / 210.3964ms** | **[사용자 실행] PASS**, 모의 입력·로컬 HTTP |
| 로컬 서버 시작 | [별도 폴더 사용자 실행, 2026-10-23] `powershell -NoProfile -ExecutionPolicy Bypass -File ".\tools\start-alekov.ps1" -NoNativeHost -Port 5192`, Node.js `v24.21.0` 참고 문구와 `케셰브 연결 확인: http://127.0.0.1:5192`, 서버 응답 확인 출력 | **[사용자 실행] 로컬 시작 확인**, Native Host 제외 |
| 브라우저·정상 종료 | [별도 폴더 사용자 보고, 2026-10-23] `http://127.0.0.1:5192/`의 `보호 현황`, `업무 앱`, `보안 기록` 탭 모두 표시. `Ctrl+C` 후 같은 주소 새로고침에서 서버 연결 실패 메시지 확인 | **[사용자 관찰] 3개 탭·종료 확인** |
| 재실행 및 화면 복귀 | [별도 폴더 사용자 보고, 2026-10-23] 같은 `-NoNativeHost -Port 5192`로 재실행 후 3개 탭이 다시 모두 보인다고 확인. **두 번째 시작의 콘솔 전체 출력은 별도 수집하지 않음** | **[사용자 관찰] 재시작 후 UI 복귀** |
| 외부 운영 기능 | [미확인] 운영 SDP/XDR 데이터, 실제 계정·AI 모델 호출, OSV 네트워크 검사, 보안 조치의 실제 집행·효과 | **[UNV/실집행 미지원]** |

**커밋 무결성 해석:** 위 `e4fff2d8c323ef853d608a065c858179e6941a13`에서 실제 재현을 마친 이후, 이 보충 표를 남기기 위해 **문서 파일만** 새 커밋에 반영한다. 따라서 **최종 제출 SHA는 위 실행 SHA와 달라진다**. 제출 전 GitHub와 별도 폴더에서 새 최종 SHA를 일치시켜야 하며, `git diff e4fff2d8c323ef853d608a065c858179e6941a13 HEAD -- on-client/student on-client/public on-client/src on-client/tools on-client/test on-client/vendor on-client/package.json`으로 **실행 코드·테스트·의존성의 변경이 없음을 확인**한다. 새 SHA 자체의 모든 UI 검사를 다시 실행했다고 임의로 표기하지 않는다. 문서에 40자리 SHA를 자기 자신으로 고정하려고 반복 커밋하지 않는다.

## 7. 최종 전달 기준·주의사항

- `README.md`·`on-client/README.md`·`docs/STUDENT_RUNBOOK.md`·`docs/STUDENT_RELEASE_RECORD.md`·`package.json`·`src/server.mjs`·`student/extension.mjs`의 **동일 제출 커밋**에서 문서와 동작을 확인한다. 새 폴더 검증 전에는 이 문서를 22단계 최종 재현 성공 기록이라고 말하지 않는다.
- 개발 환경의 `.env`·키·토큰·Native Host 사설 저장소·SDP 인증서/개인키, 기존 외부 로그나 DB를 새 환경에 복사하지 않는다. 공개 원문 내 `.env.example`은 비밀값이 없는 예시일 뿐이다.
- **실제 집행(19단계)**은 지원 대상/권한/연결/원천 효과 검증이 준비되지 않았고, 이 수업 단계 통과 여부로 해당 실집행 성공이나 운영 수용이 자동 인증되지 않는다.
- **제품 상태: 검증 중인 학생 결과물**. 외부 운영 계정·실AI·SDP/OSV 연동, 보안 조치 관측이 확인되지 않았으므로 **`v1.0` 릴리스·운영 인증**으로 표시하지 않는다. 문제를 수정하면 새 커밋을 만든 뒤 **새 SHA 하나**를 최종 기준으로 재검증한다.
- **21·22단계 제출**은 ALEPH 화면에 저장소 URL·40자리 커밋을 **직접 입력**한다. 공개 저장소라면 원문 JSON을 추가할 필요가 없을 수 있다. 민감정보 파일을 공개로 바꾸거나 제출 도구를 임의 실행하지 않는다.

