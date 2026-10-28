import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = p => readFileSync(new URL('../'+p, import.meta.url), 'utf8');
const html = read('public/index.html');
const css = read('public/style.css');
const app = read('public/app.js');
test('patch 3: incident timeline and explicit AI approval styles', () => {
  assert.match(css, /ARGOS PORTFOLIO UX PATCH 3/);
  assert.match(css, /#records-list\.records/);
  assert.match(css, /data-testid="ai-connect-card"/);
  assert.match(css, /\.connect-steps li:before/);
});
test('patch 3: preserve original login, AI approval and record entry points', () => {
  for (const id of ['native-login-start','native-login-check','ai-connect-start','ai-connect-check','records-list','pc-metrics-load']) {
    assert.ok(html.includes(`id="${id}"`), `missing ${id}`);
  }
});
test('patch 3: does not imply approval from cosmetic labels', () => {
  assert.match(css, /data-state="connected"/);
  assert.match(css, /data-state="unknown"/);
  assert.match(css, /data-state="error"/);
  assert.doesNotMatch(css, /animation:\s*infinite|@keyframes\s+counter|content:\s*"연결 성공"/);
});
test('patch 3: previous source retains actual event ordering and PC refresh', () => {
  assert.ok(app.includes('loadPcMetrics()'));
  assert.ok(app.includes('renderPcEnvironmentHistory'));
  assert.ok(app.includes('setupQuickActions'));
  assert.ok(html.includes('id="view-records"'));
});
