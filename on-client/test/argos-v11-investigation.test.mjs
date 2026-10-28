import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createStudentView } from '../student/extension.mjs';

const source = readFileSync(new URL('../student/extension.mjs', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../public/style.css', import.meta.url), 'utf8');

class FakeNode {
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.attributes = new Map();
    this.listeners = {};
    this._text = '';
    this.value = '';
  }
  set textContent(text) { this._text = String(text); this.children = []; }
  get textContent() { return this._text + this.children.map(n => typeof n === 'string' ? n : n.textContent).join(''); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this._text = ''; this.children = [...nodes]; }
  addEventListener(event, fn) { this.listeners[event] = fn; }
  focus() { this.focused = true; }
}
const collect = (root, predicate) => {
  const out = [];
  const visit = node => {
    if (!(node instanceof FakeNode)) return;
    if (predicate(node)) out.push(node);
    for (const child of node.children) visit(child);
  };
  visit(root);
  return out;
};
const withDom = fn => {
  const old = globalThis.document;
  globalThis.document = { createElement: tag => new FakeNode(tag) };
  try { return fn(); } finally { if (old === undefined) delete globalThis.document; else globalThis.document = old; }
};
const connected = data => ({status:'ok',mode:'connected',data});
const sample = (id, kind='access', summary='접속 요청 기록') => ({
  id, kind, summary, at: '2026-10-20T10:00:00.000Z', appId: 'library',
  state:{access:'denied',session:'active',device:'compliant'},
  evidence:[{id:'ev-1',text:'원본 근거'}], rules:[{id:'rule-1',text:'정책 규칙'}],supportedActions:[],
});

test('v1.1: student-owned anchors and presentation, no new network/secret APIs', () => {
  assert.match(source,/data-argos-v11-overview/);
  assert.match(source,/data-argos-v11-workspace/);
  assert.match(source,/data-argos-v11-ai-briefing/);
  assert.match(styles,/ARGOS v1\.1/);
  assert.doesNotMatch(source,/fetch\s*\(|localStorage\s*\.|innerHTML\s*=|new WebSocket\s*\(/);
});

test('v1.1: connected device/session attention is backed by observed states', () => withDom(() => {
  const root = createStudentView().renderStatus({
    mode:'connected', devices:connected([{id:'device1',label:'내 장비',status:'noncompliant'}]),
    sessions:connected([{id:'session1',status:'expired'}]), notifications:[],diagnostics:{status:'idle'}
  });
  const cards = collect(root,n=>n.className==='argos-v11-triage-card');
  assert.equal(cards.length,3);
  assert.equal(cards[0].getAttribute('data-argos-v11-level'),'attention');
  assert.equal(cards[1].getAttribute('data-argos-v11-level'),'attention');
  assert.match(cards[0].textContent,/미충족/);
  assert.match(cards[1].textContent,/만료/);
  assert.match(cards[2].textContent,/0건/);
  assert.match(cards[2].textContent,/안전 판정은 아닙니다/);
}));

test('v1.1: demo cannot claim real connected security status', () => withDom(() => {
  const root = createStudentView().renderStatus({
    mode:'demo',devices:{status:'ok',mode:'demo',data:[{id:'1',label:'모의 장비',status:'compliant'}]},
    sessions:{status:'ok',mode:'demo',data:[{id:'2',status:'active'}]},notifications:[]
  });
  const cards=collect(root,n=>n.className==='argos-v11-triage-card');
  assert.equal(cards.length,3);
  assert.notEqual(cards[0].getAttribute('data-argos-v11-level'),'observed');
  assert.notEqual(cards[1].getAttribute('data-argos-v11-level'),'observed');
  assert.match(cards[2].textContent,/예제 자료/);
}));

test('v1.1: event search is local and filters current received records only', () => withDom(() => {
  const root = createStudentView().renderEvents({status:'ok',mode:'demo',data:[sample('event-a','access','자료실 접근'),sample('event-b','xdr','로그인 기록')]});
  const input=collect(root,n=>n.tagName==='input'&&n.type==='search')[0];
  const count=collect(root,n=>n.tagName==='p'&&/^표시 /.test(n.textContent))[0];
  assert.ok(input);
  assert.match(count.textContent,/표시 2건/);
  input.value='event-b';input.listeners.input();
  assert.match(count.textContent,/표시 1건/);
  assert.equal(collect(root,n=>n.getAttribute('data-student-event-id')==='event-a').length,0);
  assert.equal(collect(root,n=>n.getAttribute('data-student-event-id')==='event-b').length,1);
  const reset=collect(root,n=>n.getAttribute('data-argos-filter-reset')==='true')[0];
  reset.listeners.click();assert.equal(input.value,'');assert.match(count.textContent,/표시 2건/);
}));

test('v1.1: selected event investigation is linked to current record and evidence', () => withDom(() => {
  const root=createStudentView().renderEvents({status:'ok',mode:'demo',data:[sample('event-a')]});
  const buttons=collect(root,n=>n.tagName==='button'&&n.textContent.includes('상세'));
  assert.equal(buttons.length,1);
  buttons[0].listeners.click();
  const guide=collect(root,n=>n.className==='argos-v11-investigation')[0];
  assert.match(guide.textContent,/선택한 사건 · event-a/);
  assert.match(guide.textContent,/Demo 예제/);
  assert.match(guide.textContent,/근거 1건/);
  assert.match(guide.textContent,/사람/);
}));

test('v1.1: AI never displays verified briefing for idle/error/demonstration', () => withDom(() => {
  for(const s of [{status:'idle'},{status:'error',error:{code:'REQUEST_TIMEOUT',message:'timeout'}},{status:'loading'}]){
    const root=createStudentView().renderExplanation({event:sample('ev'),explanation:s});
    assert.equal(collect(root,n=>n.getAttribute('data-argos-v11-ai-briefing')==='true').length,0);
  }
}));

test('v1.1: AI briefing requires original validation guards before rendering', () => {
  const successBranch = source.indexOf("root.setAttribute('data-student-explanation-event', event.id);");
  const verified = source.indexOf("if (!allBound)");
  const guarded = source.indexOf("if (['demo', 'disconnected', 'unknown'].includes(explanation?.mode))");
  const briefing=source.indexOf("briefing.setAttribute('data-argos-v11-ai-briefing'");
  assert.ok(verified>0&&guarded>verified&&successBranch>guarded&&briefing>successBranch);
});


test('v1.1: matching connected AI evidence gets briefing but demo does not', () => withDom(() => {
  const event=sample('case-01');
  const data={summary:'접속 상태 확인을 위한 참고 설명',evidenceIds:['ev-1'],proposals:[],requiresHumanConfirmation:true,executed:false};
  const ok=createStudentView().renderExplanation({event,explanation:{status:'ok',mode:'connected',data},checkedAt:'2026-10-20T10:01:00Z'});
  const brief=collect(ok,n=>n.getAttribute('data-argos-v11-ai-briefing')==='true');
  assert.equal(brief.length,1);
  assert.match(brief[0].textContent,/케셰브/);
  assert.match(brief[0].textContent,/근거: 1건/);
  assert.match(brief[0].textContent,/미실행/);
  const demo=createStudentView().renderExplanation({event,explanation:{status:'ok',mode:'demo',data}});
  assert.equal(collect(demo,n=>n.getAttribute('data-argos-v11-ai-briefing')==='true').length,0);
}));
