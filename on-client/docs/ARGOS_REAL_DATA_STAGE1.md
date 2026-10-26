# ARGOS 실제 보안 데이터 연동 · 1차 원천 확인

**작성일:** 2026-10-26 · **브랜치:** `post22/read-only-event-source-probe-20261026`.

## 배경과 정확한 현재 상태

- Windows 설치형 ARGOS는 Demo/Offline 모드 설치·재실행·제거·선택형 바탕화면 바로가기까지 사용자 PC 확인을 마쳤다.
- 제공 SDP host는 `readIdentity`, `readApps`, `decideAccess`와 본인 범위의 `readEvents`/`readDevices`/`readSessions`를 위한 계약이 있다(`docs/SDP_HOST_CONNECTION.md`, `docs/SDP_HOST_OBSERVATION.md`). 실제 운영 SDP 릴레이의 mTLS·JWT·접속 권한은 **이 사용자 PC에서 확인되지 않았다**.
- 설치된 `launcher/launch-argos.ps1`는 의도적으로 `-Demo` 또는 자격 없는 Offline 모드만 제공하며 개인 자격·SDP 연결 설정을 받지 않는다.
- 따라서 **설치형 Demo 앱을 실서비스 XDR 앱으로 호칭하거나, 더미 이벤트를 실제 보안 사고로 해석하지 않는다.**

## 이번 단계 목표 및 허용 변경

사용자 Windows PC에서 **실제 존재하는 로컬 이벤트 로그의 접근 가능 여부**를 먼저 읽기 전용으로 조사한다. 개인정보나 자격 정보가 필요하지 않으며, 외부 서버로 데이터를 전송하지 않는다.

**새 파일 3개만 추가:**
- `tools/inspect-local-windows-events.ps1` — 로컬 Windows Event Log를 읽기 전용으로 조회
- `test/local-event-source-contract.test.mjs` — 스크립트의 오프라인 정적 계약 테스트 3개
- `docs/ARGOS_REAL_DATA_STAGE1.md` — 이 안내서

**절대 변경하지 않는 대상:** ALEPH Workbench 원본, 공식 22단계 제출, 기존 설치형 ARGOS 및 이전 패키지·설치 파일, 인증 설정·개인키·토큰.

## 안전성·결과 해석

- 기본 조회 범위: 최근 7일, 로그별 **최대 25개 이벤트 샘플**.
- 로그: Windows `Security`, Defender Operational, PowerShell Operational, Sysmon Operational.
- 출력: 로그명, `readable` / `no_events_in_window` / `permission_denied` / `unavailable_or_unreadable` 상태, 샘플 수 및 상한.
- 원 이벤트 본문, 계정 식별자, 컴퓨터 이름, 프로세스 경로, 이벤트 시각, 인증서, 원격 주소, 비밀번호, JWT는 표시하거나 저장하지 않는다.
- 권한이 없으면 `permission_denied`로 표시하는 것이 정상일 수 있다. 관리자 권한 상승이나 보안 정책 완화는 하지 않는다.
- 샘플 수는 지정된 기간에 확인한 **상한 있는 조회 수치**이며 전체 사건 수, 악성 이벤트 수 또는 실제 XDR 경보 수가 아니다.
- `no_events_in_window`는 **조회 조건 내의 이벤트가 없음**을 뜻할 뿐 안전하다는 뜻이 아니다.
- 로그를 조회할 수 있다는 사실만으로 SDP·AI·ZTNA가 연결되었다고 판단하지 않는다.

## PC 실행 방법

별도 PowerShell 창에서 수행한다. 설치된 ARGOS는 변경하지 않는다. 사용자 본인이 GitHub 소스를 확인한 뒤 실행한다.

~~~powershell
$workspace = Join-Path $env:USERPROFILE 'Documents\argos-real-data-preflight-20261026'
if (Test-Path -LiteralPath $workspace) { throw '대상 폴더가 존재합니다. 다른 이름을 사용하세요. 삭제하지 않습니다.' }
git clone --branch post22/read-only-event-source-probe-20261026 --single-branch https://github.com/yeaun12/argos-security-agent.git $workspace
if ($LASTEXITCODE -ne 0) { throw 'Git clone 실패' }
Set-Location -LiteralPath (Join-Path $workspace 'on-client')
git rev-parse HEAD
node --test
if ($LASTEXITCODE -ne 0) { throw '테스트 실패' }
powershell -NoProfile -ExecutionPolicy Bypass -File ".\tools\inspect-local-windows-events.ps1"
~~~

**실행 예상 결과는 미검증 상태**다. 이 브랜치에서 테스트/로그 조회를 실행한 PC 실측값을 얻은 후에만 PASS로 기록한다. 진단은 파일/레지스트리/이벤트 로그 변경을 하지 않는다.

**미구현 범위:** 이번 도구는 실제 원천 이벤트의 본문 수집·정규화·ARGOS 화면 통합을 구현하지 않는다. 진단 결과는 어디까지나 읽기 가능한 로그 존재 여부와 샘플 수에 대한 사전 조사다.

## 실제 데이터 연동의 후속 구현 경계

1. **원천 확인:** 이번 스크립트로 현재 PC의 가용 로그와 권한을 확인. 원본 내용은 받지 않음.
2. **정규화·검증:** 사용자가 소유한 로컬 로그 중 동의한 범위에 대해서만, 필요한 필드만 분류하고 민감정보는 마스킹. 실제 원본 이벤트와 정규화한 사건 후보를 구분. 로그 이벤트가 있다고 모두 보안 사고는 아님.
3. **ARGOS 화면 연동:** 별도 승인된 최소권한·읽기 전용 소스 어댑터를 설계하고, 기존 `src/engine.mjs`의 증거 모드/신원 계약과 충돌하지 않게 한다. 로컬 Windows 로그를 읽었다고 SDP 개인 인증에 성공한 것으로 표시하지 않는다.
4. **운영 SDP 연결:** 실제 릴레이 접속이 필요하면 학생 본인의 발급된 mTLS·JWT, 운영자 승인, ACL 및 보안 계약 검증이 선행되어야 한다. 자격을 GitHub·채팅·설치 파일에 넣지 않는다.
5. **검증:** 읽기 실패, 접근 거부, 빈 결과, 취소, 대량 로그, 스코프, 민감정보 차단, 재실행·제거 상태를 구분해 자동/PC 테스트한다.

**최종 목표:** 원천을 명확히 표시하는 실제 이벤트 관찰 기능. 실제 보안 정책 판정·조치 자동 실행은 이번 1차 단계 범위 밖이며, 기존 Demo/Offline 설치본과 구분한다.
