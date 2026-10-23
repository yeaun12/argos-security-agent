# ARGOS 22단계 · 새 폴더 재현 및 최종 인수인계 기록

> 2026-10-23 시작 · 학생 작성 · **검증 중(release candidate), v1.0 아님**
>
> **작성 원칙:** [원문 확인] GitHub에 커밋된 파일을 읽은 사실, [과거 사용자 실행] 기존 작업 폴더의 로그, [별도 폴더 사용자 실행] 실제로 새 클론에서 확인한 사실, [미확인] 아직 하지 않은 검사로 구분한다. ALEPH AI는 원문을 읽어 판정하지만 이 명령들을 실행하지 않는다. **현재 새 폴더 검증 증거는 아직 없다.** 그 사실을 성공으로 바꾸지 않는다.
>
> **이번 인수인계의 코드 기준:** 21단계 소스 `72c024f920ba54aa8c284acc7d8d4d3fa4e2d0ee`에서 22단계 문서만 추가한 별도 Git 커밋. 22단계 최종 40자리 검증 대상은 문서의 `git rev-parse HEAD`와 제출 화면에 직접 기록한 SHA가 **완전히 일치**해야 한다. 이 문서에 미래 커밋 해시를 임의 기입하지 않는다. **새 폴더 테스트 뒤 문서를 바꾸면 새로운 커밋이 되므로, 최종 커밋으로 새 폴더를 다시 맞추고 검증한다.**

## 1. 제품·버전·지원 환경

- 제품명 **아르고스(ARGOS)**. 제공 UI·서버 시작 로그에는 기본 제품명 **케셰브**가 보일 수 있다. 프로젝트 파일·버튼·API 이름은 변경하지 않는다.
- 저장소: `https://github.com/yeaun12/argos-security-agent`, 작업 브랜치: `stage22/reproducible-release-20261023`. **기존 프로젝트 원본:** `%LOCALAPPDATA%\ALEPH\Workbench\projects\아르고스-방어전`. 원래 폴더를 삭제·이동·초기화하지 않는다.
- 앱 루트는 **Git 루트/`on-client`**. `package.json`의 실제 선언은 `alekov-client-starter`, **0.2.11**, ES Module, `node` 엔진 표시 **24.19.0**. 실행 스크립트는 **Node.js 22~24 허용**, 기준 24.19.0. **새 PC의 실제 버전은 재검증 전 미확인**.
- [과거 사용자 실행/원본 PC] Windows PowerShell, Node.js **v24.21.0**, Git **2.55.0.windows.3**. Windows CMD/PowerShell에서 20단계 테스트 **42/42 통과**, 21단계 원본 폴더에서 서버 시작·브라우저 세 탭·종료·재실행 확인. **이것을 새 클론에서의 성공으로 기록하지 않는다.**
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

> **절차 문서화 완료 / 실행 여부: [미확인]**. 아래 명령은 기존 원본 폴더를 유지한다. 새 대상 폴더가 이미 있으면 **즉시 멈추고** 이름을 다시 정한다. 프로젝트 폴더 안이나 비밀 설정 폴더를 대상으로 삼지 않는다. PowerShell 창에서 실행한다.

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

## 4. 새 폴더에서의 확인 절차 — 실행 전에는 전부 [미확인]

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

[코드 확인] 예상 결과: 필수 파일 세 건 `True`, 학생 코드 문법 오류 없음, **총 42개 로컬 테스트**(11+9+10+12) 실행. **이 숫자는 기대값이며 새 클론의 관찰 결과가 아니다.** 네트워크 전송 없는 모의 단위/HTTP 테스트 결과로 실제 SDP·AI·OSV 연결 성공을 대체하지 않는다.

### 안전한 UI 시작/종료/재시작

원본에서 `5190` 포트 서버가 계속 실행 중일 수 있으므로, 새 클론은 **다른 루프백 포트 5192**를 사용할 예정이다. 포트가 점유 중이면 사용 가능한 다른 포트로 바꾸고 실제 값을 기록한다. 학생이 이 포트를 직접 실행했다고 기록하기 전까지는 [미확인]이다.

~~~powershell
# on-client 위치, 개인 호스트 자동 생성·재사용을 건너뛰는 격리 확인
powershell -NoProfile -ExecutionPolicy Bypass -File ".\tools\start-alekov.ps1" -NoNativeHost -Port 5192
~~~

- 기대 정상 로그: `케셰브가 켜졌습니다. 브라우저에서 http://127.0.0.1:5192/ 을 여세요.`, `서버가 응답한 것만 확인했습니다.`. 로그 문구는 Native Host 승인과 별개다.
- 브라우저 주소를 **`http://127.0.0.1:5192/`**로 직접 입력한다(`?utm_source=...` 같은 추가 쿼리 금지). `보호 현황` / `업무 앱` / `보안 기록` 탭과 학생 표시의 초기/미연결 상태를 확인한다.
- `-NoNativeHost`를 사용했으므로 Native Host 연결·실AI·SDP 원천 데이터가 **없거나 확인 불가**인 것이 예상되며, `NATIVE_HOST_DISABLED`는 이 **명시적 미연결 모드에서만** 계정 연결 API 호출 시 가능하다.
- 실행 PowerShell에서 `Ctrl+C` → 브라우저 새로고침 연결 실패 확인 → 동일 포트와 동일 옵션으로 재실행 → 세 탭 정상 복귀 확인. 새 클론을 여러 번 만들 필요는 없다.
- 브라우저 클릭/초기 화면이 보인 것만으로 13~20 모든 기능이 실제 연동됐다고 쓰지 않는다.

## 5. 13~21단계별 기능·검증 근거(현재 후보 상태)

**분류:** [원문] 함수/문서 확인, [과거 로컬] 원본 또는 20단계 커밋의 합성/모의 테스트, [별도 폴더] 이번 22단계 SHA로 새 클론에서 실제 확인한 결과, [UNV] 미확인. **현 시점 [별도 폴더] 완료 증거는 0건.**

| 단계 | 기능과 원문 위치 | 과거 확인된 내용(시점/근거) | 22단계 새 폴더 확인 상태·제한 |
| --- | --- | --- | --- |
| 13 | `renderIdentity` · `student/extension.mjs`; 현재 로그인·기기·세션 | [원문] 함수 존재. 21단계 원본 PC에서 보호 현황 탭 표시(2026-10-23) | [UNV] 실계정 신원·기기 데이터, 새 클론 |
| 14 | `renderDecision` · 업무 앱 allow/deny/challenge/unknown | [원문] 함수 존재. 기존 PC 업무 앱 탭 표시(2026-10-23) | [UNV] 실 SDP 원천 판정, 새 클론 |
| 15 | `renderEvents` · 접속·XDR 사건과 근거 | [원문] 함수 존재. 기존 PC 보안 기록 탭 표시(2026-10-23) | [UNV] 실제 XDR 기록·새 클론 |
| 16 | `renderStatus` · 상태·오류·진단 | [원문] 함수 존재. 과거 콘솔에서 오류·미연결 상태 대조 | [UNV] 전체 상황·새 클론 |
| 17 | `renderAiConnection` 및 AI 연결 제공 코드 | [과거 로컬] 20단계 `node --test` 기존 통합 11/11 (2026-10-23, 모의 AI/loopback) | [UNV] 실제 앱 승인·모델 목록·새 클론 |
| 18 | `renderExplanation` · 근거/규칙/unknown | [과거 로컬] 20단계 `node --test` 9/9(2026-10-23, 모의 입력) | [UNV] 실제 모델의 본인 사건 설명·새 클론 |
| 19 | `renderAction` · 사람 확인/ACK/관측/unknown | [과거 로컬] 20단계 `node --test` 10/10(2026-10-23, 모의 입력) | **[미지원/UNV] 실집행 권한·조치 효과, 새 클론** |
| 20 | `renderVulnerabilities` · 정확한 버전/OSV ID·partial/none_found | [과거 로컬] 20단계 `node --test` 12/12(2026-10-23, 모의 입력) | [UNV] 실제 package-lock 대조·외부 OSV, 새 클론 |
| 21 | `docs/STUDENT_RUNBOOK.md` · 설치/구성/오류 복구 | [과거 사용자 실행] 원래 작업 폴더에서 Node v24.21.0/Git 2.55.0, 서버 5190·3탭·종료·재실행 확인. 21단계 첫 AI 판정은 5/6 통과, 실행 설명 정정 후 공식 재판정 **사용자 결과 미제공** | [UNV] 수정된 21단계 문서로 새 클론 재현 |

위 `42/42`는 **21단계 이전 20단계 커밋 `97a3e0dcec35d875daedad28358124c784e898ee`에서 실제 사용자가 실행한 테스트**다. 학생 함수와 기존 테스트의 원문은 이후 문서 커밋에서 변경하지 않았지만, 그 테스트를 **새 클론에서 다시 실행하기 전까지 최종 후보 커밋의 직접 통과로 간주하지 않는다**.

## 6. 재현 증거 입력란(최종 SHA와 결과만 기록)

**미실시 상태 — 빈 증거를 꾸미지 않는다.** 이 표를 학생이 3~4장을 직접 실행한 결과로 채운 다음, **새 문서 커밋**을 만든다. 새 문서 커밋은 SHA가 달라지므로, 최종 제출 SHA로 새 클론을 업데이트해 같은 파일·원문을 다시 대조해야 한다.

| 항목 | 확인 시각(KST) | 실제 명령/입력과 증거 | 상태 |
| --- | --- | --- | --- |
| 제출 저장소 URL·브랜치 | 문서 기준 2026-10-23 | `https://github.com/yeaun12/argos-security-agent` / `stage22/reproducible-release-20261023` | [원문 확인] |
| **제출할 최종 40자리 SHA** | **미확인** | **최종 작업 HEAD를 `git rev-parse HEAD`로 확인하여 제출 입력값과 대조할 것** | [UNV] |
| 원래 작업 폴더 존재·기록 보존 | 미확인 | `git -C $original rev-parse HEAD`, `git status --short`, 파일 존재 | [UNV] |
| 새 폴더 이름·clone·HEAD·clean | 미확인 | 실제 `$newRoot` 경로, `git checkout --detach <최종 SHA>`, HEAD 일치 | [UNV] |
| Node.js/Git·3개 필수 파일 | 미확인 | `node --version`/`git --version`/`Test-Path` 3건 | [UNV] |
| 문법 검사·`node --test` | 미확인 | 성공·실패 건수 그대로 기재, 전 항목 모의/로컬 HTTP 구분 | [UNV] |
| `-NoNativeHost -Port 5192` 서버 시작 | 미확인 | 실제 포트·HTTP 200·로그 메시지 | [UNV] |
| 3개 탭의 화면 | 미확인 | 탭명과 화면에 보이는 모드/오류, 비밀 없는 관찰 | [UNV] |
| 종료·동일 옵션 재시작 | 미확인 | Ctrl+C→브라우저 연결 불가→다시 시작, 탭 표시 | [UNV] |
| 실제 계정·SDP·XDR·AI·실집행·OSV | 미확인 | 운영자 승인 없이 수행하지 않음, 실집행은 현재 미지원 | [UNV] |
| 22단계 공식 원문 판정 | 미제출 | 포털의 동일 저장소·40자리 SHA로 직접 제출, 서버 AI는 **실행하지 않음** | [UNV] |

## 7. 최종 전달 기준·주의사항

- `README.md`·`on-client/README.md`·`docs/STUDENT_RUNBOOK.md`·`docs/STUDENT_RELEASE_RECORD.md`·`package.json`·`src/server.mjs`·`student/extension.mjs`의 **동일 제출 커밋**에서 문서와 동작을 확인한다. 새 폴더 검증 전에는 이 문서를 22단계 최종 재현 성공 기록이라고 말하지 않는다.
- 개발 환경의 `.env`·키·토큰·Native Host 사설 저장소·SDP 인증서/개인키, 기존 외부 로그나 DB를 새 환경에 복사하지 않는다. 공개 원문 내 `.env.example`은 비밀값이 없는 예시일 뿐이다.
- **실제 집행(19단계)**은 지원 대상/권한/연결/원천 효과 검증이 준비되지 않았고, 이 수업 단계 통과 여부로 해당 실집행 성공이나 운영 수용이 자동 인증되지 않는다.
- **제품 상태: 검증 중인 학생 결과물**. 외부 운영 계정·실AI·SDP/OSV 연동, 보안 조치 관측이 확인되지 않았으므로 **`v1.0` 릴리스·운영 인증**으로 표시하지 않는다. 문제를 수정하면 새 커밋을 만든 뒤 **새 SHA 하나**를 최종 기준으로 재검증한다.
- **21·22단계 제출**은 ALEPH 화면에 저장소 URL·40자리 커밋을 **직접 입력**한다. 공개 저장소라면 원문 JSON을 추가할 필요가 없을 수 있다. 민감정보 파일을 공개로 바꾸거나 제출 도구를 임의 실행하지 않는다.

