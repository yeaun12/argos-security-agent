// Read-only, offline contract tests. They do NOT run Get-WinEvent or open logs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const probe=readFileSync(new URL('../tools/inspect-local-windows-events.ps1',import.meta.url),'utf8');
const guide=readFileSync(new URL('../docs/ARGOS_REAL_DATA_STAGE1.md',import.meta.url),'utf8');
test('Windows security telemetry probe only checks bounded, local log availability',()=>{
 for (const phrase of ['Get-WinEvent -ListLog','Get-WinEvent -FilterHashtable','-MaxEvents $MaxEvents','[ValidateRange(1,100)]','readOnly=$true','includesEventContents=$false','ConvertTo-Json']) {
  assert.ok(probe.includes(phrase),phrase);
 }
 assert.match(probe,/Get-WinEvent -FilterHashtable.*-MaxEvents \$MaxEvents/);
 assert.doesNotMatch(probe,/\b(?:Set-Content|Out-File|Export-Csv|Export-Clixml|Invoke-RestMethod|Invoke-WebRequest|Start-Process|New-Item|Remove-Item|Clear-EventLog|Write-EventLog|Stop-Process|Get-Credential)\b/);
});
test('Windows probe does not include raw log text, identity or event time in output rows',()=>{
 assert.match(probe,/sampledCount=\$sampleCount/);
 assert.match(probe,/state=\$status/);
 assert.doesNotMatch(probe,/^\s*(?:Message|RecordId|UserId|MachineName|TimeCreated|Properties|ProcessId|LevelDisplayName)\s*=/m);
 assert.match(probe,/permission_denied/);
 assert.match(probe,/unavailable_or_unreadable/);
 assert.match(probe,/no_events_in_window/);
});
test('guide explicitly separates real event source probes from authenticated SDP/XDR integration',()=>{
 for (const phrase of ['읽기 전용','접속 권한','샘플 수','SDP','XDR','실제 원천','미구현','개인']) assert.ok(guide.includes(phrase),phrase);
 assert.doesNotMatch(guide,/실제 SDP 연결 성공|실제 XDR 연동 성공/);
});
