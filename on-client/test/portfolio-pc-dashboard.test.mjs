// Portfolio UX patch 2: contract guards; browser verification is separate.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const html=read('public/index.html');
const app=read('public/app.js');
const css=read('public/style.css');
const block=app.slice(app.indexOf('/* ARGOS PORTFOLIO UX PATCH 2'),app.indexOf('function pcClear(){'));
test('patch 2: three accessible local PC charts, with no prefilled metric',()=>{
 for(const kind of ['cpu','memory','disk']){
  assert.ok(html.includes(`data-pc-viz="${kind}"`));
  assert.ok(html.includes(`id="pc-viz-${kind}-chart"`));
  assert.ok(html.includes(`id="pc-viz-${kind}-value">--</strong>`));
 }
});
test('patch 2: charts use bounded in-memory history and leave failure gaps',()=>{
 assert.match(block,/PC_DASHBOARD_LIMIT = 12/);
 assert.match(block,/value:null/);
 assert.match(block,/if\(!point\)\{flush\(\);continue;\}/);
 assert.doesNotMatch(block,/localStorage|sessionStorage|setInterval|setTimeout|fetch\(/);
});
test('patch 2: visuals read validated PC response and use no fabricated demo values',()=>{
 assert.match(app,/pcDashboardRender\(data\)/);
 assert.match(app,/const percentage=pcDashboardPercentage\(kind,item\)/);
 assert.match(app,/Number\.isFinite\(value\)/);
 assert.match(app,/!response\.ok\|\|/); // failure check exists in original request handler
 assert.match(block,/value\.textContent='--'/);
 assert.match(block,/fill\.style\.width='0%'/);
});
test('patch 2: failures invalidate current gauge instead of reusing stale readings',()=>{
 assert.match(app,/function pcClear\(\)\{\s*pcDashboardPending\(\);/);
 assert.equal((app.match(/pcDashboardUnavailable\(\);/g)||[]).length,2);
 assert.match(app,/lastPcMeasurement=data;\s*pcDashboardRender\(data\)/);
});
test('patch 2: no new remote dependency or client secret storage',()=>{
 assert.ok(css.includes('ARGOS PORTFOLIO UX PATCH 2'));
 assert.doesNotMatch(block,/fetch\(|localStorage|sessionStorage|Bearer|token|apiKey|credentials/);
 assert.match(html,/id="native-login-start"/);
 assert.match(html,/id="pc-env-load"/);
});
