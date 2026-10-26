// Offline packaging contract checks. Does NOT compile or install setup.exe.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const basic=read('packaging/basic/build-basic.ps1');
const verify=read('packaging/verify-package.ps1');
const launch=read('packaging/windows/launch-argos.ps1');
const iss=read('packaging/inno/Argos.iss');
const compile=read('packaging/windows/build-installer.ps1');
const guide=read('docs/ARGOS_PACKAGING_GUIDE.md');

test('basic package: allowlisted, committed files and no overwrite',()=>{
 assert.match(basic,/\$approvedPaths = @\(/);
 assert.match(basic,/Source folder is not clean/);
 assert.match(basic,/Output already exists; no overwrite/);
 assert.match(basic,/Join-Path \(Join-Path \$destination 'app'\)/);
 assert.doesNotMatch(basic,/Remove-Item|git reset|git clean/);
});
test('package verifier: detects modified, linked and extra files',()=>{
 for(const s of ['PACKAGE_MANIFEST.json','Get-FileHash','SHA256','Unlisted file found','ReparsePoint','PACKAGE_VERIFY_PASS'])
  assert.ok(verify.includes(s),s);
});
test('launcher: local port, limited Node version, demo or disconnected only',()=>{
 assert.match(launch,/http:\/\/127\.0\.0\.1:\$Port\//);
 assert.match(launch,/'ON_PORT'/);
 assert.match(launch,/--demo/);
 assert.match(launch,/Do not inherit app overrides/);
 assert.doesNotMatch(launch,/--native-host-config|--sdp-host-config|--alekov-actions/);
 assert.match(launch,/process\.Kill\(\)/);
});
test('Inno recipe: user scope, local app folder and dedicated demo shortcuts',()=>{
 for(const s of ['PrivilegesRequired=lowest','DefaultDirName={localappdata}\\Programs\\ARGOS','OutputBaseFilename=setup','ARGOS (Demo only)','ARGOS (Offline / disconnected)'])
  assert.ok(iss.includes(s),s);
 assert.doesNotMatch(iss,/PrivilegesRequired=admin|HKEY_LOCAL_MACHINE|sc\.exe|RegServer/);
});
test('installer builder: verifies basic package before ISCC',()=>{
 for(const s of ['verify-package.ps1','ISCC.exe','/DBasicRoot=$basic','SETUP_SHA256','setup.exe'])
  assert.ok(compile.includes(s),s);
 assert.doesNotMatch(compile,/Remove-Item|git reset|git clean/);
});
test('guide: PC measurements, demo and unverified installation kept separate',()=>{
 for(const s of ['54/54 PASS','226.6089ms','예제','미검증','삭제','setup.exe'])
  assert.ok(guide.includes(s),s);
});
