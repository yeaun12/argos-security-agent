// Total offensive day 4: static UI and packaging guardrails; actual browser checks are separate.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('public/index.html');
const app=read('public/app.js');
const css=read('public/style.css');
const basic=read('packaging/basic/build-basic.ps1');
test('day 4: three prominent quick actions point to existing views',()=>{
 for(const [view,target] of [['records','records-title'],['protection','pc-metrics-title'],['protection','student-status-title']]){
  assert.match(html,new RegExp('data-quick-view="'+view+'" data-quick-target="'+target+'"'));
  assert.ok(html.includes('id="'+target+'"'));
 }
 assert.match(html,/기록 보기[\s\S]*내 PC 상태[\s\S]*위험 알림/);
});
test('day 4: quick actions use buttons, live view switch and keyboard focus',()=>{
 assert.match(html,/<button type="button" class="quick-action"/);
 assert.match(app,/function setupQuickActions\(\)/);
 assert.match(app,/selectView\(view\)/);
 assert.match(app,/target\.focus\(\)/);
 assert.match(app,/setupQuickActions\(\)/);
});
test('day 4: both refresh panels have accessible error areas',()=>{
 for(const id of ['pc-metrics-alert','pc-env-alert']) assert.match(html,new RegExp('id="'+id+'" role="alert" hidden'));
 assert.match(app,/function setReadFailure\(id,items,action\)/);
 assert.match(app,/box\.replaceChildren\(\)/);
 assert.match(app,/box\.hidden=items\.length===0/);
});
test('day 4: partial failures show names and next actions',()=>{
 for(const name of ['네트워크','방화벽','Windows 이벤트','CPU·메모리·디스크 조회'])assert.ok(app.includes(name));
 assert.match(app,/if\(data\.network\.status==='unavailable'\)/);
 assert.match(app,/if\(data\.firewall\.status==='unavailable'\)/);
 assert.match(app,/if\(log\.status==='unavailable'\)/);
 assert.match(app,/조회 권한/);
 assert.match(app,/다시 측정/);
 assert.match(app,/다시 조회/);
});
test('day 4: no raw server error messages printed for Windows observability',()=>{
 const metrics=app.slice(app.indexOf('async function loadPcMetrics()'),app.indexOf('\/\/ ---------- 총공세 3일차'));
 const env=app.slice(app.indexOf('async function loadPcEnvironment()'),app.indexOf('let diagnosticsText'));
 assert.doesNotMatch(metrics,/response\.error\.message/);
 assert.doesNotMatch(env,/response\.error\.message/);
});
test('day 4: package allowlist includes both new runtime modules',()=>{
 for(const path of ['src/pc-metrics.mjs','src/pc-environment.mjs'])
  assert.ok(basic.includes("'"+path+"'"),path);
 assert.match(basic,/Source folder is not clean/);
 assert.doesNotMatch(basic,/Remove-Item|git clean|git reset/);
});
test('day 4: responsive layout and readable failure design',()=>{
 assert.match(css,/@media \(max-width: 900px\)/);
 assert.match(css,/\.read-failure \{/);
 assert.match(css,/\.quick-actions \{/);
 assert.match(css,/\.quick-action:hover/);
 assert.match(css,/:focus-visible/);
});
