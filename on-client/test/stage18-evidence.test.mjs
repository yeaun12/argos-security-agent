// Stage 18 offline contract tests. No live ALEPH login, CLCO model, network or security actions.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createStudentView } from '../student/extension.mjs';

class ElementStub {
  constructor(tag) { this.tagName=tag;this.children=[];this.attributes={};this._text=''; }
  set textContent(v) { this._text=String(v);this.children=[]; }
  get textContent() { return this._text+this.children.map(child=>child.textContent).join(''); }
  setAttribute(k,v) { this.attributes[k]=String(v); }
  getAttribute(k) { return this.attributes[k]??null; }
  append(...nodes) { this.children.push(...nodes); }
}
globalThis.document={createElement:tag=>new ElementStub(tag)};
const view=createStudentView();
const eventA=()=>({
  id:'incident-A',summary:'모의 이벤트 A',
  evidence:[{id:'e-A1',text:'비정상 요청 감지'},{id:'e-A2',text:'인증 실패 반복'}],
  rules:[{id:'r-A1',text:'반복 인증 실패 탐지'}],
  state:{access:'unknown',session:'unknown',device:'compliant'},
  supportedActions:[],
});
const eventB=()=>({
  id:'incident-B',summary:'모의 이벤트 B',
  evidence:[{id:'e-B1',text:'접근 정책 확인'}],
  rules:[{id:'r-B1',text:'단말 정책 불일치'}],
  state:{access:'allowed',session:'active',device:'unknown'},
  supportedActions:[],
});
const dataA=()=>({summary:'사건 A 모의 AI 해석',evidenceIds:['e-A1','e-A2'],proposals:[],requiresHumanConfirmation:true,executed:false});
const dataB=()=>({summary:'사건 B 모의 AI 해석',evidenceIds:['e-B1'],proposals:[],requiresHumanConfirmation:true,executed:false});
function show(event, status='ok', data=dataA(), error, mode='connected') {
  return view.renderExplanation({event,explanation:{status,mode,data,error},checkedAt:'2026-10-23T15:00:00+09:00'});
}
const marker=element=>element.getAttribute('data-student-explanation-event');

test('stage18: error takes priority over missing event',()=>{
  const result=show(null,'error',undefined,{code:'ON_AI_INVALID_INPUT',message:'근거 부족'});
  assert.equal(marker(result),null);
  assert.match(result.textContent,/AI 설명 실패/);
  assert.match(result.textContent,/ON_AI_INVALID_INPUT/);
  assert.match(result.textContent,/근거 부족/);
  assert.match(result.textContent,/기존 보안 기록은 그대로 유지/);
});
test('stage18: missing event prompts selecting a record; loading remains pending',()=>{
  const empty=show(null,'idle',undefined);
  assert.equal(marker(empty),null);
  assert.match(empty.textContent,/기록을 먼저 고르세요/);
  const busy=show(eventA(),'loading',undefined);
  assert.equal(marker(busy),null);
  assert.match(busy.textContent,/설명 요청 중/);
});
test('stage18: complete evidence, rules and current event must be bound',()=>{
  const result=show(eventA());
  assert.equal(marker(result),'incident-A');
  for(const s of ['사건 ID: incident-A','AI 설명(참고용)','사건 A 모의 AI 해석','e-A1 — 비정상 요청 감지','e-A2 — 인증 실패 반복','r-A1 — 반복 인증 실패 탐지']) assert.ok(result.textContent.includes(s), 'expected: '+s);
});
test('stage18: unknown states appear individually, never assumed safe',()=>{
  const result=show(eventA());
  assert.match(result.textContent,/접속: 확인 불가\(unknown\)/);
  assert.match(result.textContent,/세션: 확인 불가\(unknown\)/);
  assert.doesNotMatch(result.textContent,/기기: 확인 불가\(unknown\)/);
  const other=show(eventB(),'ok',dataB());
  assert.match(other.textContent,/기기: 확인 불가\(unknown\)/);
});
test('stage18: missing and duplicate evidence IDs do not pass',()=>{
  for(const ids of [['e-A1'],['e-A1','e-A1'],['e-A1','e-other']]) {
    const result=show(eventA(),'ok',{...dataA(),evidenceIds:ids});
    assert.equal(marker(result),null);
    assert.match(result.textContent,/근거 불일치/);
    assert.doesNotMatch(result.textContent,/비정상 요청 감지/);
  }
});
test('stage18: another incident cannot reuse an old explanation',()=>{
  const first=show(eventA());
  const stale=show(eventB(),'ok',dataA());
  const fresh=show(eventB(),'ok',dataB());
  assert.equal(marker(first),'incident-A');
  assert.equal(marker(stale),null);
  assert.equal(marker(fresh),'incident-B');
  assert.match(fresh.textContent,/e-B1 — 접근 정책 확인/);
  assert.doesNotMatch(fresh.textContent,/비정상 요청 감지/);
  const reset=show(eventB(),'idle',undefined);
  assert.equal(marker(reset),null);
  assert.doesNotMatch(reset.textContent,/사건 A 모의 AI 해석|사건 B 모의 AI 해석/);
});
test('stage18: no supporting actions means zero proposals, not an executed action',()=>{
  const result=show(eventA());
  assert.match(result.textContent,/연동 시스템이 지원하는 조치가 없어/);
  assert.match(result.textContent,/현재 실행되지 않았습니다/);
  const walked=(element)=>[element.tagName,...element.children.flatMap(walked)];
  assert.equal(walked(result).includes('button'),false);
});
test('stage18: fabricated or already executed actions are rejected',()=>{
  const example={action:'block',reason:'모의 사유',evidenceIds:['e-A1']};
  for(const data of [
    {...dataA(),executed:true},
    {...dataA(),requiresHumanConfirmation:false},
    {...dataA(),proposals:[example]},
  ]) assert.equal(marker(show(eventA(),'ok',data)),null);
});
test('stage18: inadequate evidence and failed model status never retain success marker',()=>{
  assert.equal(marker(show({...eventA(),evidence:[]},'ok',dataA())),null);
  assert.equal(marker(show(eventA(),'error',null,{code:'ON_AI_INVALID_OUTPUT',message:'AI 근거 검증 실패'})),null);
  assert.equal(marker(show(eventA(),'ok',dataA(),undefined,'demo')),null);
  assert.equal(marker(show(eventA(),'ok',dataA(),undefined,'unknown')),null);
});
