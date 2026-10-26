# ARGOS 제작 기간 · 포장 및 설치 재현 가이드

**작성일:** 2026-10-26. **상태:** 스크립트 작성, 사용자 Windows에서 패키지 생성·설치·제거 **미검증**. 아래 예시를 실측값으로 사용하지 않는다.

## 대상 및 보존 원칙

- 신규 포장 브랜치: `post22/user-installer-packaging-20261026` (기능 개선 기준: `11f1a32967fa651aa8f6c3103a20538fe65fcb45`).
- 기존 22단계 제출 SHA: `600f8e36aa29979df2882fd26d69da2c74c49b77`. **사용자 보고: 22단계 모두 공식 통과**.
- 원본 Workbench 폴더 `%LOCALAPPDATA%\ALEPH\Workbench\projects\아르고스-방어전\on-client` 및 기존 Documents 개선·제출 폴더는 **이동·삭제·초기화·덮어쓰기 금지**.
- 현재 포장은 **Node.js 22~24를 별도로 설치한 Windows PC에서만 실행하는 데모/미연결 런타임**. 실제 운영 SDP/XDR, 계정 인증, 원격 AI 생성, 보안 조치 집행은 지원·검증하지 않았다.
- 개인 인증 설정, JWT, API 키, `.env`, 개인 원천 로그, 전체 `node_modules` 및 개발 Git 폴더는 설치 패키지에 포함하지 않는다.

## 1. 포장 브랜치를 새로운 위치에 복제

Windows PowerShell에서 실행한다. 기존 폴더가 존재하면 **중단**한다. PowerShell에서는 `%USERPROFILE%`가 아닌 `$env:USERPROFILE`를 사용한다.

~~~powershell
$workspace = Join-Path $env:USERPROFILE 'Documents\argos-packaging-20261026'
if (Test-Path -LiteralPath $workspace) { throw '대상 폴더가 이미 있습니다. 삭제하지 말고 다른 이름을 사용하세요.' }
git clone --branch post22/user-installer-packaging-20261026 --single-branch https://github.com/yeaun12/argos-security-agent.git $workspace
Set-Location -LiteralPath (Join-Path $workspace 'on-client')
git rev-parse HEAD
git status --short
node --version
node --check student\extension.mjs
node --test
~~~

`git status --short`는 비어 있어야 한다. 실제 테스트 통과 수와 시간을 기록한다. **과거 사용자 PC 실측**: 기능 개선 커밋 `11f1a329…`에서 `54/54 PASS`, `226.6089ms`. **포장 브랜치에서는 아직 미실행**이므로 이 숫자를 재사용해 성공을 주장하지 않는다.

## 2. 기본 포장

~~~powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\packaging\basic\build-basic.ps1"
~~~

`BASIC_PACKAGE_READY=...`가 표시되면, 출력한 **실제 경로**를 아래 `$basicRoot`에 입력한다. 기본 위치는 `%USERPROFILE%\Documents\ARGOS-builds\basic\ARGOS-<UTC 생성시각>`이다. 기존 출력 디렉터리가 존재하면 덮어쓰지 않는다.

~~~powershell
$basicRoot = 'C:\Users\User\Documents\ARGOS-builds\basic\ARGOS-실제출력폴더명'
powershell -NoProfile -ExecutionPolicy Bypass -File ".\packaging\verify-package.ps1" -PackageRoot $basicRoot
~~~

`PACKAGE_VERIFY_PASS` 메시지가 있어야 한다. 폴더 구조:
- `app/`: 고정 허용 목록의 런타임 파일과 이 가이드
- `launcher/launch-argos.ps1`: 설치형 전용 Node 실행기
- `PACKAGE_MANIFEST.json`: 실제 Git 커밋·파일 경로·SHA-256

파일 해시는 우발적 변경 탐지용이며 출처 인증이나 코드 서명을 대신하지 않는다. `.env`, `node_modules`, 개인 Native Host/SDP 설정과 비밀 정보가 포함되지 않았는지 확인한다.

## 3. Inno Setup 사용자 단위 setup.exe

Inno Setup 6의 `ISCC.exe`를 PC에 준비한다. 아래 빌드 도구는 기본 포장의 해시와 필수 파일을 먼저 검증한 뒤 컴파일한다.

~~~powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\packaging\windows\build-installer.ps1" -BasicRoot $basicRoot
~~~

컴파일러가 자동 검색되지 않으면 `-IsccPath 'C:\설치된경로\ISCC.exe'`를 추가한다. 출력 위치는 `%USERPROFILE%\Documents\ARGOS-builds\installers\ARGOS-<UTC 생성시각>\setup.exe`이다. 표시된 `SETUP_FILE`과 `SETUP_SHA256`를 기록한다. **setup.exe 생성은 설치 성공과 다르다.**

설치 설정: `PrivilegesRequired=lowest`, 기본 설치 경로 `%LOCALAPPDATA%\Programs\ARGOS`, 시작 메뉴에 `ARGOS (Demo only)`와 `ARGOS (Offline - disconnected)`를 추가한다. 관리자 서비스나 드라이버를 등록하지 않는다.

## 4. 실제 설치 후 확인 순서 (실행 전)

1. `setup.exe` 실행 후 사용자 설치(관리자 권한 상승 없음) 여부 확인.
2. 사용자 시작 메뉴의 `ARGOS (Demo only)` 실행. 설치형 시작 주소는 `http://127.0.0.1:5196/`. 브라우저에 추적 쿼리 없이 접속.
3. 세 탭 확인. Demo `library → allow` 및 `event-01`은 **제공 예제**, 실제 접근 판정/XDR 기록이 아니다. 사건 시각도 조회 실측 시각이 아니다.
4. PowerShell 실행 창에서 `Ctrl+C`로 종료하고 `5196` 접속이 중단되는지 확인. 바로가기로 다시 실행해 재접속 확인.
5. `ARGOS (Offline - disconnected)` 실행 시 연결 없음/확인 불가를 정확히 표시하는지 확인.
6. 사용자 단위 제거 프로그램으로 제거하고, 설치 **소유 파일만** 삭제되는지 확인. 원본 Workbench, 이전 제출 폴더, 개인 자격 보관소가 남아 있는지 확인.

다른 앱이 `5196`을 사용 중이라면 강제로 종료하지 않는다. 새 PowerShell 창에서 아래처럼 다른 포트로 실행한다.

~~~powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\Programs\ARGOS\launcher\launch-argos.ps1" -Demo -Port 5197
~~~

Node.js가 없거나 허용 버전 밖이면 실행이 중단된다. 설치 파일에는 `node.exe`를 포함하지 않는다. 설치기는 **미서명**이며 SmartScreen 경고가 날 수 있다. 정식 서명·설치·제거 테스트 전에는 일반 사용자에게 신뢰된 완제품으로 배포하지 않는다.

## 5. 실측·예시·미확인 구분

| 상태 | 기록 |
| --- | --- |
| **[사용자 PC 실측]** | 이전 기능 개선본에서 문법 검사와 54/54 테스트 통과(226.6089ms), 브라우저 열림 |
| **[Demo 예시]** | `event-01`·`repository`·`denied`, `library → allow`, 예제 정책 판정 시각 |
| **[구현/미검증]** | 새 포장·설치 스크립트, 빌드·설치·재시작·제거 |
| **[실제 서비스 미확인]** | 실계정 SDP, 실제 XDR, 모델 추론, OSV 외부 조회, 실제 보안 조치 효과 |

**설치 테스트가 완료된 경우에만** 정확한 포장 커밋 SHA, 테스트 실행 일시, 출력된 `SETUP_SHA256`, 설치·제거 결과를 별도로 작성한다.


## 6. 2026-10-26 설치 바로가기 오류 수정

**[사용자 PC 실측]** 첫 설치 파일 `setup.exe` SHA-256 `e711898b5f4fb8c2184ba39fa379571ff29059bc7b583aabfa7070e6dd01e8fd`로 실행한 설치 과정에서 `IPersistFile::Save failed; code 0x80070003`이 나타났다. 화면의 바로가기 경로는 `ARGOS (Offline \\ disconnected).lnk` 형태였다. `[Icons]`의 `ARGOS (Offline / disconnected)`가 경로 구분자로 해석된 것이 원인으로 판단된다.

**[수정한 소스/아직 설치 미검증]** 바로가기 파일명을 `ARGOS (Offline - disconnected)`로 변경하고, 이름에 경로 구분자가 없는지 확인하는 자동 테스트를 추가했다. **이전 실패한 설치 파일은 재사용하지 않고** 업데이트한 포장 브랜치에서 새로운 기본 패키지와 새로운 `setup.exe`를 생성해야 한다. 오류 후 설치 마법사가 정상 취소/롤백되었는지 확인하고, 이전 설치 폴더가 남았다면 내용을 임의 삭제·덮어쓰지 말고 상태를 먼저 조사한다.
