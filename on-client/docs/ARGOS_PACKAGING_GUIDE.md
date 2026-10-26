# ARGOS 제작 기간 · 포장 및 설치 재현 가이드

**작성일:** 2026-10-26. **현재 상태:** Windows 사용자 PC에서 기본 패키지 빌드·실행, Inno Setup 컴파일, 설치, Demo/Offline 실행, 종료, 제거·재설치 후 실행까지 **사용자 로그와 직접 보고로 검증**. 최신 파일명 수정 커밋의 62개 전체 자동 테스트와 실제 SDP/XDR/AI 연동은 미검증. 이전 오류의 당시 상태와 최종 결과를 아래 §8에서 구분한다.

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

`git status --short`는 비어 있어야 한다. 실제 테스트 통과 수와 시간을 기록한다. **과거 사용자 PC 실측**: 기능 개선 커밋 `11f1a329…`에서 `54/54 PASS`, `226.6089ms`. **초기 포장 커밋에서는 60/60 PASS(227.1741ms), 바로가기 수정 커밋에서는 61/61 PASS(229.3795ms)를 사용자 PC 로그로 확인했다.** 파일명 안전 수정 커밋에서 추가된 1개 테스트를 포함한 전체 62개 테스트 출력은 아직 받지 못했다.

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

## 3. Inno Setup 사용자 단위 ARGOS-Installer.exe

Inno Setup 6의 `ISCC.exe`를 PC에 준비한다. 아래 빌드 도구는 기본 포장의 해시와 필수 파일을 먼저 검증한 뒤 컴파일한다.

~~~powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\packaging\windows\build-installer.ps1" -BasicRoot $basicRoot
~~~

컴파일러가 자동 검색되지 않으면 `-IsccPath 'C:\설치된경로\ISCC.exe'`를 추가한다. 출력 위치는 `%USERPROFILE%\Documents\ARGOS-builds\installers\ARGOS-<UTC 생성시각>\ARGOS-Installer.exe`이다. 표시된 `SETUP_FILE`과 `SETUP_SHA256`를 기록한다. **ARGOS-Installer.exe 생성은 설치 성공과 다르다.**

설치 설정: `PrivilegesRequired=lowest`, 기본 설치 경로 `%LOCALAPPDATA%\Programs\ARGOS`, 시작 메뉴에 `ARGOS (Demo only)`와 `ARGOS (Offline - disconnected)`를 추가한다. 관리자 서비스나 드라이버를 등록하지 않는다.

## 4. 실제 설치 후 확인 순서 (실행 전)

1. 검증한 `ARGOS-Installer.exe` 실행 후 사용자 설치(관리자 권한 상승 없음) 여부 확인.
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
| **[사용자 PC 실측/보고]** | 새 포장 스크립트로 37개 파일 검증·앱 실행, 설치 빌드, 설치/바로가기/종료/제거/재설치/재실행 확인(§8) |
| **[실제 서비스 미확인]** | 실계정 SDP, 실제 XDR, 모델 추론, OSV 외부 조회, 실제 보안 조치 효과 |

**최종 설치 검증 내역은 §8에 기록한다.** 미실시한 최신 전체 테스트와 외부 보안 기능은 PASS로 승격하지 않는다.


## 6. 2026-10-26 설치 바로가기 오류 수정

**[사용자 PC 실측]** 첫 설치 파일 `setup.exe` SHA-256 `e711898b5f4fb8c2184ba39fa379571ff29059bc7b583aabfa7070e6dd01e8fd`로 실행한 설치 과정에서 `IPersistFile::Save failed; code 0x80070003`이 나타났다. 화면의 바로가기 경로는 `ARGOS (Offline \\ disconnected).lnk` 형태였다. `[Icons]`의 `ARGOS (Offline / disconnected)`가 경로 구분자로 해석된 것이 원인으로 판단된다.

**[수정한 소스/아직 설치 미검증]** 바로가기 파일명을 `ARGOS (Offline - disconnected)`로 변경하고, 이름에 경로 구분자가 없는지 확인하는 자동 테스트를 추가했다. **이전 실패한 설치 파일은 재사용하지 않고** 업데이트한 포장 브랜치에서 새로운 기본 패키지와 새로운 `ARGOS-Installer.exe`를 생성해야 한다. 오류 후 설치 마법사가 정상 취소/롤백되었는지 확인하고, 이전 설치 폴더가 남았다면 내용을 임의 삭제·덮어쓰지 말고 상태를 먼저 조사한다.


## 7. 2026-10-26 Inno Setup 컴파일 보안 경고 및 수정

**[사용자 PC 실측]** 바로가기 이름 수정 버전인 이전 커밋 `326d8b5fbe51651083b32a65b1650f357bb3463f`에서 Inno Setup 컴파일은 성공했으며, 출력은 `setup.exe` (SHA-256 `a643caf904bf80bd6915f64847d2ecc3a50ec72946ff898ce297d6c358c722e6`)였다. 다만 Inno Setup이 `OutputBaseFileName=setup` 사용에 대해, Windows 호환성 shim의 추가 DLL 로딩으로 인한 안전하지 않은 로딩 위험 경고를 출력했다. **컴파일 성공과 설치 안전성·설치 성공은 별개이며, 이 파일은 실행하지 않는다.** 이전 설치 파일의 제거/롤백 완료 여부 역시 아직 사용자 결과를 받지 못했다.

**[소스 수정/사용자 PC 실행 전]** `packaging/inno/Argos.iss`의 출력 파일 이름을 `ARGOS-Installer`로 변경했고, 컴파일 검증기는 `ARGOS-Installer.exe`만 찾도록 수정했다. 자동 테스트에 `setup.exe` 출력명 회귀 방지 검사를 추가했다. 기존 `setup.exe`를 파일명만 바꾸어 재사용하는 대신 **수정 커밋으로 새 기본 패키지와 설치 실행 파일을 다시 빌드**한다. 새 설치 파일도 코드 서명 전이며, 파일명 수정만으로 다른 설치 보안 위험까지 해소된 것은 아니다.

참고: Inno Setup 공식 문서 [OutputBaseFilename](https://jrsoftware.org/ishelp/topic_setup_outputbasefilename.htm).


## 8. 2026-10-26 Windows 설치형 앱 실제 검증 결과

아래 검증은 **사용자가 제출한 Windows PowerShell 출력 및 직접 화면 확인**을 기준으로 한다. ChatGPT가 사용자 PC의 실제 설치·실행을 직접 수행한 것은 아니다.

| 범위 | 사용자가 확인한 결과 | 해석 |
| --- | --- | --- |
| 초기 포장 자동 테스트 | 커밋 `e68d0b251619cf767f1340b62a0322b7325aee55`에서 `node --test`: **60 tests / 60 pass / 0 fail** (227.1741ms), `node --check` 완료 | 사용자 PC 실행값 |
| 바로가기 수정 테스트 | 커밋 `326d8b5fbe51651083b32a65b1650f357bb3463f`에서 **61 tests / 61 pass / 0 fail** (229.3795ms) | 경로 구분자 회귀 테스트 포함 |
| 최신 포장 테스트 | 설치 파일 이름 수정 커밋 `55d2a44997ea8867f98678d239b4891d218b4e7c`에서 **62개 예상**, 전체 결과 미제공 | **62/62 PASS라고 주장하지 않는다** |
| 최초 기본 패키지 | `PACKAGE_VERIFY_PASS files=37 sourceCommit=e68d0b251619cf767f1340b62a0322b7325aee55`, 출력 폴더 `ARGOS-20261026-033137-617` | 파일 구성 및 SHA-256 검사, 디지털 서명 아님 |
| 기본 패키지 실행 | `ARGOS UI ready: http://127.0.0.1:5196/`, 사용자가 세 탭 정상 표시 확인, `Ctrl+C` 종료 | 데모 실행 성공; 실제 보안 데이터 아님 |
| 첫 설치 오류 | 구형 `setup.exe` 실행에서 잘못된 바로가기 경로로 `0x80070003` 발생 | 이름에서 `/`를 제거하도록 수정 |
| 두 번째 빌드 경고 | `setup.exe` 빌드 성공했으나 Inno Setup에서 `OutputBaseFilename=setup` DLL 로딩 경고 출력 | 실행 없이 별도 안전 이름으로 수정 |
| 최종 Windows 설치 실행 파일 | `C:\Users\User\Documents\ARGOS-builds\installers\ARGOS-20261026-045735-347\ARGOS-Installer.exe` (0.578초 컴파일) | **코드 서명되지 않은 개발·검증용 설치 파일** |
| 최종 SHA-256 | `2951b08fb895e97c34c12fdbfaeb5fdff9e3bbd2b372fa0dc4347e1a7ac17aaa` | 컴파일러 출력. 제작자 신원 인증과 다름 |
| 이전 실패 설치 정리 | `InstallFolder=False`, `Uninstaller=False`, `StartMenu=False` | 잔여물 없음 확인 |
| 최종 설치 | `InstallFolder=True`, `Launcher=True`, `Uninstaller=True`, `DemoShortcut=True`, `OfflineShortcut=True` | 5개 설치 항목 실제 출력 |
| 설치 앱 종료/재실행 | Demo/Offline 정상 표시 보고; `Ctrl+C` 이후 브라우저 `ERR_CONNECTION_REFUSED`(정상 서버 종료), Demo 재실행 정상 | 설치된 앱의 UI·서버 라이프사이클 확인 |
| 제거·재설치 | 사용자 PC 스크립트 `ARGOS_REINSTALL_VERIFY_PASS`, 이어서 사용자 "다 성공적으로 실행했어" 보고 | 제거, 필수 설치 경로/바로가기 재생성, 재실행 확인 |
| 실제 운영 보안 기능 | 실제 SDP/XDR 데이터 연결, 모델 생성, 실제 정책 조치, OSV 외부 조회 **미확인** | **완료로 기록하지 않는다** |

**완료 범위:** Windows 사용자 단위 설치형 ARGOS **오프라인·Demo 시제품**의 기본 포장, 설치, 서버 실행/종료, 재실행, 제거·재설치가 사용자 PC에서 확인됐다. 이 검증은 실제 기업용 보안 에이전트 또는 원격 원천 연동의 완성도를 의미하지 않는다. Node.js 22~24는 여전히 별도 설치가 필요하다.

**보존 범위:** 별도 브랜치 `post22/user-installer-packaging-20261026`에 포장/검증 이력만 반영하며, 22단계 공식 제출물과 이전 기능 개선 브랜치, 사용자 Workbench 원본 파일은 변경하지 않았다.


## 9. 바탕화면 바로가기 UX 개선 (추가 브랜치 / 새 설치 검증 전)

**기준 설치형 검증:** §8에 기록된 기존 `ARGOS-Installer.exe` (SHA-256 `2951b08fb895e97c34c12fdbfaeb5fdff9e3bbd2b372fa0dc4347e1a7ac17aaa`)는 사용자의 PC에서 설치·실행·제거·재설치까지 확인됐다. 그 파일은 변경하지 않는다.

**이번 변경 범위:** 별도 브랜치 `post22/desktop-shortcut-ux-20261026`의 `packaging/inno/Argos.iss`, `test/package-contract.test.mjs` 및 이 기록 문서만. 사용자가 설치 마법사에서 선택한 경우에만 **현재 사용자 바탕화면**에 `ARGOS (Demo only)` 바로가기를 만든다. 기본은 선택 해제(`Flags: unchecked`)다.

선택형 바로가기는 기존 시작 메뉴의 `ARGOS (Demo only)`와 동일한 설치 전용 런처(`launcher/launch-argos.ps1 -Demo`)를 가리킨다. **데모 예제 데이터일 뿐, 실계정 SDP/XDR 연결이나 AI 실제 호출이 아니다.** Offline 바로가기, 자동 시작 항목, 시스템 전체 바탕화면 아이콘은 만들지 않는다.

**변경 적용 유의:** 이미 설치되어 정상 작동 중인 기존 ARGOS는 직접 업데이트·덮어쓰기하지 않는다. 새 버전의 Windows 컴파일과 정적 테스트, 설치 전 동작/제거 계획을 별도로 검증한 다음에만 설치를 진행한다. 같은 AppId와 동일 설치 디렉터리를 사용하므로, 기존 설치가 실행 중일 때는 **업그레이드 설치를 실행하지 않는다**.

**재현 테스트 계획:**
1. 새 브랜치를 기존 Documents 프로젝트와 다른 경로로 복제한다. 공식 제출 브랜치와 Workbench 원본은 변경하지 않는다.
2. 최신 브랜치 `node --test` 전체 통과 여부와 1개 신규 선택형 데스크톱 바로가기 테스트 결과를 확인한다. **기존 62개 예상 + 1개 신규 = 총 63개 예상; 이번 브랜치에서 사용자 PC 실측 전이다.**
3. 새 기본 패키지와 `ARGOS-Installer.exe`를 각각 기존에 없는 경로로 컴파일하고 해시를 기록한다.
4. 이미 설치된 버전이 있으므로 설치는 바로 실행하지 않고, 필요한 경우 제거/업그레이드 계획을 확인한다.
5. 사용자가 테스트 설치에 동의한 경우에만, 설치에서 체크박스를 미선택한 경우 바탕화면에 아이콘이 없는지, 체크한 경우 현재 사용자 바탕화면에 `ARGOS (Demo only).lnk`가 생기는지, 시작 메뉴 바로가기 두 개와 설치 제거 기능이 유지되는지 실제로 확인한다.

**주의:** 바탕화면 바로가기의 추가는 설치 스크립트 UX 작업일 뿐, 네이티브 단독 실행 파일이나 별도 설치 없는 앱을 구현한 것은 아니다. Node.js 22~24 설치 전제, 코드 서명 부재, Demo/Offline 한정은 그대로다.


## 10. 2026-10-26 사용자 PC: 선택형 바탕화면 바로가기 검증 기록

- **[사용자 PC 실측]** 새 UX 브랜치 소스 `080f243e990a9b76e5f1302da6765cfafc7e8ee6`에서 `node --test` **63 tests / 63 pass / 0 fail / 243.3706ms**.
- **[사용자 PC 실측]** Inno Setup 컴파일 성공, `ARGOS-Installer.exe` SHA-256 `d461a73bf57b75774302ae58711d758c8cbeb5758c07d3dab7f762d78ec37e09`, 출력 위치 `C:\Users\User\Documents\ARGOS-builds\installers\ARGOS-20261026-052745-339\ARGOS-Installer.exe`.
- **[사용자 PC 실측]** 동일 설치 버전 소스 커밋 `080f243e990a9b76e5f1302da6765cfafc7e8ee6`, 설치 후 `Uninstaller=True` 및 `DemoStartMenu=True`. 첫 설치 시 선택하지 않은 바탕화면 아이콘은 `DemoDesktop=False`. 이것은 선택형·기본 해제 동작과 부합한다.
- **[사용자 PC 실측]** 설치 마법사를 다시 실행하고 선택 항목을 확인한 뒤 사용자 Desktop에서 `Test-Path -LiteralPath (Join-Path $desktop 'ARGOS (Demo only).lnk')` 결과 **`True`**. 선택형 바탕화면 바로가기 **파일 생성 확인**.
- **[미확인]** 마지막 데스크톱 바로가기를 더블클릭했을 때 실제 앱 구동/브라우저 표시 여부는 아직 확인되지 않았다. `True`는 바로가기 **파일 존재 증거**이지 동작 성공 증거는 아니다.
- **[제약 유지]** Node.js 외부 설치 필요, 오프라인/예제 한정, 실제 SDP/XDR/AI 연동 및 실행 효과는 미검증. 설치본 변경과 GitHub 작업 브랜치 소스 관리는 구분한다.
