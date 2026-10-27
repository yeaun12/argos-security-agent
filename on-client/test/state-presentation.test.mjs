// Post-22 local-only render tests; these inputs are synthetic, NOT live identity.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createStudentView} from '../student/extension.mjs';
class Stub{
 constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this._text='';this.listeners={};}
 set textContent(v){this._text=String(v);this.children=[];}
 get textContent(){return this._text+this.children.map(n=>n.textContent).join('');}
 append(...nodes){this.children.push(...nodes);}
 setAttribute(k,v){this.attrs[k]=String(v);}
 getAttribute(k){return this.attrs[k]??null;}
 addEventListener(t,fn){this.listeners[t]=fn;}
}
globalThis.document={createElement:tag=>new Stub(tag)};
const view=createStudentView();
test('disconnected identity is not successful login',()=>{
 const root=view.renderIdentity({
  me:{status:'error',mode:'disconnected',error:{code:'ENGINE_NOT_CONNECTED',message:'모의 연결 실패'}},
  devices:{status:'loading',mode:'disconnected'},sessions:{status:'unknown',mode:'unknown'},
 });
 assert.match(root.textContent,/연결 없음/);
 assert.match(root.textContent,/연결 실패: 모의 연결 실패/);
 assert.match(root.textContent,/불러오는 중/);
 assert.match(root.textContent,/확인 불가/);
 assert.doesNotMatch(root.textContent,/보안 기준 충족|사용자: practice-user/);
});
test('missing alert list differs from genuine empty alert array',()=>{
 const base={mode:'disconnected',devices:{status:'error',mode:'disconnected',error:{code:'ENGINE_NOT_CONNECTED',message:'연결 없음'}},
 sessions:{status:'loading',mode:'disconnected'},diagnostics:{status:'idle'}};
 const missing=view.renderStatus(base);
 assert.match(missing.textContent,/주의 알림 자료 확인 불가/);
 assert.match(missing.textContent,/정상 판정이 아닙니다/);
 const zero=view.renderStatus({...base,notifications:[]});
 assert.match(zero.textContent,/주의 알림 0건/);
 assert.match(zero.textContent,/안전하다고 판단하지 않습니다/);
});
test('demo allow not proof of actual app access',()=>{
 const root=view.renderDecision({status:'ok',mode:'demo',appId:'library',
 data:{appId:'library',decision:'allow',reason:'모의 정책 허용',checkedAt:'2026-10-26T02:31:41.521Z'}});
 assert.match(root.textContent,/예제 자료\(demo\)/);
 assert.match(root.textContent,/접근 허용\(allow\)/);
 assert.match(root.textContent,/실제 업무 앱 접속 성공을 보장하지 않습니다/);
});
test('request error cannot be labeled denied or allowed',()=>{
 const root=view.renderDecision({status:'error',mode:'disconnected',appId:'repository',
 error:{code:'ENGINE_NOT_CONNECTED',message:'모의 연결 실패'}});
 assert.match(root.textContent,/요청 실패/);
 assert.match(root.textContent,/접근 거부\(deny\) 판정이 아닙니다/);
 assert.doesNotMatch(root.textContent,/접속 판정: 접근 허용/);
});


test('UX B: connected resource counts and warnings', () => {
 const root = view.renderStatus({
  mode: 'connected',
  devices: {status:'ok',mode:'connected',data:[
   {id:'d1',label:'PC1',status:'compliant'},
   {id:'d2',label:'PC2',status:'noncompliant'},
   {id:'d3',label:'PC3',status:'unknown'}
  ]},
  sessions: {status:'ok',mode:'connected',data:[
   {id:'s1',status:'active'},
   {id:'s2',status:'expired'}
  ]},
  notifications:[{resource:'device',code:'TEST',message:'모의 알림'}],
  diagnostics:{status:'idle'}
 });
 assert.match(root.textContent,/등록 기기 3대/);
 assert.match(root.textContent,/기준 충족 1/);
 assert.match(root.textContent,/미충족 1/);
 assert.match(root.textContent,/세션 2개/);
 assert.match(root.textContent,/만료 1/);
 assert.match(root.textContent,/전달받은 주의 알림 1건/);
 assert.match(root.textContent,/주의:/);
});

test('UX B: disconnected and demo never claim verified protection', () => {
 const root = view.renderStatus({
  mode:'demo',
  devices:{status:'ok',mode:'demo',data:[
   {id:'d1',label:'PC',status:'compliant'}
  ]},
  sessions:{status:'ok',mode:'demo',data:[
   {id:'s1',status:'active'}
  ]},
  notifications:[],
  diagnostics:{status:'idle'}
 });
 assert.match(root.textContent,/기기 현황 확인 불가/);
 assert.match(root.textContent,/세션 현황 확인 불가/);
 assert.match(root.textContent,/실제 보안 알림 건수가 아닙니다/);
 assert.doesNotMatch(root.textContent,/등록 기기 1대/);
});

test('UX B: missing resources remain unknown', () => {
 const root = view.renderStatus({
  mode:'disconnected',
  devices:{status:'error',mode:'disconnected',
   error:{code:'ENGINE_NOT_CONNECTED',message:'연결 없음'}},
  sessions:{status:'loading',mode:'disconnected'},
  diagnostics:{status:'idle'}
 });
 assert.match(root.textContent,/기기 현황 확인 불가/);
 assert.match(root.textContent,/세션 현황 확인 불가/);
 assert.match(root.textContent,/주의 알림 확인 불가/);
});
