// Stage 19 offline rendering contract tests. No live account, AI inference or security actions.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createStudentView } from '../student/extension.mjs';

class ElementStub {
  constructor(tag) { this.tagName=tag; this.children=[]; this.attrs={}; this._text=''; }
  set textContent(value) { this._text=String(value); this.children=[]; }
  get textContent() { return this._text+this.children.map(child=>child.textContent).join(''); }
  append(...nodes) { this.children.push(...nodes); }
  setAttribute(key,value) { this.attrs[key]=String(value); }
  getAttribute(key) { return this.attrs[key]??null; }
}
globalThis.document={createElement:tag=>new ElementStub(tag)};
const view=createStudentView();
const event=()=>({id:'event-001',evidence:[{id:'e-1',text:'모의 근거 A'},{id:'e-2',text:'모의 근거 B'}],supportedActions:['block']});
const receipt=()=>({requestId:'req-1',receiptId:'receipt-1',eventId:'event-001',actionId:'block',status:'prepared',version:1,replayed:false});
const input=(status,extra={})=>({status,event:event(),actionId:'block',target:{id:'device:d1',generation:1},receipt:receipt(),observation:null,confirmationExpiresAt:'2027-01-01T00:00:00Z',...extra});
const render=value=>view.renderAction(value);
const marker=value=>value.getAttribute('data-student-action-event');

test('stage19: all eleven defined states render separately',()=>{
  const states=['idle','loading','prepared','executing','pending','succeeded','denied','failed','unknown','error','expired'];
  const contents=states.map(state=>render(input(state)).textContent);
  assert.equal(new Set(contents).size,states.length);
  contents.forEach((output,i)=>assert.match(output,new RegExp(states[i]==='succeeded'?'unknown':states[i])));
});

test('stage19: prepared binds current event, evidence, intent and expiry; no execution',()=>{
  const output=render(input('prepared'));
  assert.equal(marker(output),'event-001');
  assert.equal(output.getAttribute('data-student-action-request'),'req-1');
  assert.match(output.textContent,/준비됨·미실행/);
  assert.match(output.textContent,/확인 기한/);
  assert.match(output.textContent,/근거 ID: e-1, e-2/);
  assert.match(output.textContent,/대상 세대/);
  assert.doesNotMatch(output.textContent,/효과 확인\(succeeded\)/);
});

test('stage19: pending ACK cannot claim confirmed effect',()=>{
  const output=render(input('pending'));
  assert.match(output.textContent,/ACK/);
  assert.doesNotMatch(output.textContent,/실제 효과 확인\(succeeded\)/);
});

test('stage19: succeeded requires observed effect and matching receipt',()=>{
  const output=render(input('succeeded',{
    receipt:{...receipt(),status:'succeeded'},
    observation:{observedAt:'2026-10-23T12:00:00Z',effectApplied:true},
  }));
  assert.match(output.textContent,/효과 확인\(succeeded\)/);
  assert.match(output.textContent,/effectApplied: true/);
  assert.match(output.textContent,/2026-10-23/);
  assert.match(output.textContent,/receipt-1/);
});

test('stage19: succeeded without observed effect is explicitly unknown',()=>{
  for(const observation of [null,{observedAt:'2026-10-23T12:00:00Z',effectApplied:false}]){
    const output=render(input('succeeded',{receipt:{...receipt(),status:'succeeded'},observation}));
    assert.match(output.textContent,/결과 불명\(unknown\)/);
    assert.doesNotMatch(output.textContent,/효과 확인\(succeeded\)/);
  }
});

test('stage19: another event or action cannot inherit an old receipt',()=>{
  const confirmed={observedAt:'2026-10-23T12:00:00Z',effectApplied:true};
  const wrongEvent=render(input('succeeded',{receipt:{...receipt(),eventId:'event-002',status:'succeeded'},observation:confirmed}));
  const wrongAction=render(input('prepared',{receipt:{...receipt(),actionId:'unlock'}}));
  for(const output of [wrongEvent,wrongAction]){
    assert.equal(marker(output),null);
    assert.match(output.textContent,/결과 불명/);
  }
});

test('stage19: replayed receipt is not treated as a new execution',()=>{
  const output=render(input('pending',{receipt:{...receipt(),status:'pending',replayed:true}}));
  assert.match(output.textContent,/새로운 집행이나 중복 실행 성공으로 판단하지 않습니다/);
});

test('stage19: re-rendering and idle never retain previous target or request',()=>{
  const current=render(input('prepared'));
  const next=render(input('loading',{event:{id:'event-002',evidence:[],supportedActions:[]},actionId:null,target:null,receipt:null}));
  const reset=render({status:'idle'});
  assert.match(current.textContent,/event-001/);
  assert.doesNotMatch(next.textContent,/event-001|req-1|receipt-1/);
  assert.doesNotMatch(reset.textContent,/event-001|req-1|receipt-1/);
  assert.equal(marker(reset),null);
});

test('stage19: unsupported actions explain absence of prepare button',()=>{
  const output=render(input('prepared',{event:{id:'event-001',evidence:[],supportedActions:[]}}));
  assert.match(output.textContent,/조치 준비 버튼이 나타나지 않는 것이 정상/);
  const tags=node=>[node.tagName,...node.children.flatMap(tags)];
  assert.equal(tags(output).includes('button'),false);
});

test('stage19: errors display safe code and message without claiming success',()=>{
  const output=render(input('error',{error:{code:'ACTION_DENIED',message:'거절 정책'}}));
  assert.match(output.textContent,/오류 코드: ACTION_DENIED/);
  assert.match(output.textContent,/오류 메시지: 거절 정책/);
  assert.doesNotMatch(output.textContent,/효과 확인\(succeeded\)/);
});
