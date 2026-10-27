// Post-22 offline explanation rendering only: no model request or action execution.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createStudentView} from '../student/extension.mjs';
class Stub{
 constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this._text='';}
 set textContent(v){this._text=String(v);this.children=[];}
 get textContent(){return this._text+this.children.map(n=>n.textContent).join('');}
 append(...nodes){this.children.push(...nodes);}
 setAttribute(k,v){this.attrs[k]=String(v);}
 getAttribute(k){return this.attrs[k]??null;}
}
globalThis.document={createElement:tag=>new Stub(tag)};
const view=createStudentView();
const event={id:'fixture-A',evidence:[{id:'e1',text:'모의 접근 정책 근거'}],
 rules:[{id:'rule1',text:'모의 규칙'}],
 state:{access:'unknown',session:'active',device:'unknown'},supportedActions:[]};
const reply={status:'ok',mode:'connected',data:{summary:'모의 AI 참고 설명',
 evidenceIds:['e1'],proposals:[],requiresHumanConfirmation:true,executed:false}};
const render=explanation=>view.renderExplanation({event,explanation,checkedAt:'2026-10-26T02:30:00Z'});
test('idle/loading show current event but never a claimed explanation',()=>{
 for(const status of ['idle','loading']){
  const result=render({status});
  assert.match(result.textContent,/선택한 사건 ID: fixture-A/);
  assert.equal(result.getAttribute('data-student-explanation-event'),null);
 }
});
test('demo/disconnected/unknown deny success marker',()=>{
 for(const mode of ['demo','disconnected','unknown']){
  const result=render({...reply,mode});
  assert.equal(result.getAttribute('data-student-explanation-event'),null);
  assert.match(result.textContent,/확인 불가/);
 }
});
test('synthetic valid explanation cites current evidence, not automatic execution',()=>{
 const result=render(reply);
 assert.equal(result.getAttribute('data-student-explanation-event'),'fixture-A');
 assert.match(result.textContent,/모의 AI 참고 설명/);
 assert.match(result.textContent,/e1 — 모의 접근 정책 근거/);
 assert.match(result.textContent,/rule1 — 모의 규칙/);
 assert.match(result.textContent,/자동 집행하지 않습니다/);
});
test('authorization error cannot reuse prior explanation success',()=>{
 const result=render({status:'error',mode:'disconnected',
 error:{code:'WB_CLCO_AUTH_REQUIRED',message:'모의 승인 필요'}});
 assert.equal(result.getAttribute('data-student-explanation-event'),null);
 assert.match(result.textContent,/AI 설명 실패/);
 assert.match(result.textContent,/기존 보안 기록은 그대로 유지됩니다/);
});


test('UX C: validated explanation clearly limits its scope', () => {
 const root = render(reply);
 assert.equal(
  root.getAttribute('data-student-explanation-event'),
  'fixture-A'
 );
 assert.match(root.textContent, /AI 설명 상태: 응답 검증 통과/);
 assert.match(root.textContent, /원천 사실이나 조치 효과/);
 assert.match(root.textContent, /사건 원본 근거/);
 assert.match(root.textContent, /AI 조치 제안/);
 assert.match(root.textContent, /실제 실행·효과/);
 assert.match(root.textContent, /자동 집행하지 않습니다/);
});

test('UX C: failed explanation does not show validation success', () => {
 const root = render({
  status:'error', mode:'disconnected',
  error:{code:'WB_CLCO_AUTH_REQUIRED',
         message:'모의 인증 실패'}
 });
 assert.match(root.textContent, /분석 상태: 실패/);
 assert.match(root.textContent, /사건 없음 또는 안전 판정/);
 assert.doesNotMatch(root.textContent, /응답 검증 통과/);
 assert.equal(
  root.getAttribute('data-student-explanation-event'),
  null
 );
});

test('UX C: pending explanation has no validated-result marker', () => {
 const root = render({status:'loading'});
 assert.match(root.textContent, /AI 설명 요청 중/);
 assert.doesNotMatch(root.textContent, /응답 검증 통과/);
 assert.equal(
  root.getAttribute('data-student-explanation-event'),
  null
 );
});
