// Post-22 offline timeline tests: fabricated fixtures, NOT live SDP/XDR.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createStudentView} from '../student/extension.mjs';
class Stub {
 constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.listeners={};this._text='';this.value='';}
 set textContent(v){this._text=String(v);this.children=[];}
 get textContent(){return this._text+this.children.map(n=>n.textContent).join('');}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this._text='';this.children=[...nodes];}
 setAttribute(k,v){this.attrs[k]=String(v);}
 getAttribute(k){return this.attrs[k]??null;}
 addEventListener(t,fn){this.listeners[t]=fn;}
 dispatch(t){this.listeners[t]?.();}
 focus(){}
}
globalThis.document={createElement:tag=>new Stub(tag)};
const view=createStudentView();
const walk=root=>[root,...root.children.flatMap(walk)];
const tagged=(root,name)=>walk(root).filter(n=>n.getAttribute(name));
const ids=root=>tagged(root,'data-student-event-id').map(n=>n.getAttribute('data-student-event-id'));
const change=(root,name,value)=>{
 const select=walk(root).find(n=>n.tagName==='select'&&n.getAttribute('aria-label')===name);
 assert.ok(select,name);select.value=value;select.dispatch('change');
};
const event=(id,at,kind,appId,access,actions=[])=>({
 id,at,kind,appId,summary:'모의 사건 '+id,evidence:[{id:'e-'+id,text:'모의 근거 '+id}],
 rules:[{id:'r-'+id,text:'모의 규칙 '+id}],state:{access,session:'active',device:'unknown'},supportedActions:actions,
});
const rows=()=>[
 event('old','2026-10-20T10:00:00Z','access','library','allowed'),
 event('new','2026-10-22T03:00:00Z','xdr','repository','denied',['block']),
 event('middle','2026-10-21T04:00:00Z','access','repository','denied'),
];
test('latest event.at first, UTC date groups, no invented query timestamps',()=>{
 const data=rows(),original=JSON.stringify(data);
 const root=view.renderEvents({status:'ok',mode:'demo',data});
 assert.deepEqual(ids(root),['new','middle','old']);
 assert.deepEqual(tagged(root,'data-student-date-group').map(n=>n.getAttribute('data-student-date-group')),
 ['2026-10-22','2026-10-21','2026-10-20']);
 assert.match(root.textContent,/사건 발생 시각\(event.at\) 최신순/);
 assert.match(root.textContent,/조회 확인 시각.*확인 불가/);
 assert.match(root.textContent,/실제 보안 기록이 아닙니다/);
 assert.equal(JSON.stringify(data),original);
});
test('type/app/access filter intersections including empty set and reset',()=>{
 const root=view.renderEvents({status:'ok',mode:'demo',data:rows()});
 change(root,'기록 종류','xdr');assert.deepEqual(ids(root),['new']);
 assert.match(root.textContent,/표시 1건 \/ 받은 기록 3건/);
 change(root,'업무 앱','library');assert.deepEqual(ids(root),[]);
 assert.match(root.textContent,/선택한 조건에 맞는 기록이 없습니다/);
 change(root,'기록 종류','all');assert.deepEqual(ids(root),['old']);
 change(root,'업무 앱','all');change(root,'접속 상태','denied');
 assert.deepEqual(ids(root),['new','middle']);
});
test('details retain matched evidence and disabled unsupported execution',()=>{
 const root=view.renderEvents({status:'ok',mode:'demo',data:rows()});
 const button=walk(root).find(n=>n.tagName==='button'&&n.textContent==='new 상세');
 assert.ok(button);button.dispatch('click');
 const detail=tagged(root,'data-student-event-detail')[0];
 assert.equal(detail?.getAttribute('data-student-event-detail'),'new');
 assert.match(detail.textContent,/e-new: 모의 근거 new/);
 assert.match(detail.textContent,/r-new: 모의 규칙 new/);
 assert.match(detail.textContent,/조치 실행 연결은 준비 중/);
 assert.equal(walk(detail).find(n=>n.tagName==='button')?.disabled,true);
});
test('loading/errors/empty do not retain old event details',()=>{
 const old=view.renderEvents({status:'ok',data:rows()});
 assert.match(old.textContent,/모의 사건 new/);
 for(const state of [
  {status:'loading'},{status:'error',error:{code:'CONTRACT_MISMATCH',message:'모의 실패'}},
  {status:'ok',data:[]},{status:'unknown'},
 ]){
  const fresh=view.renderEvents(state);
  assert.deepEqual(ids(fresh),[]);
  assert.doesNotMatch(fresh.textContent,/모의 사건 new/);
 }
});


test('UX: status summary follows active filters', () => {
 const root = view.renderEvents({
   status: 'ok', mode: 'demo', data: rows()
 });
 const summary = tagged(root, 'data-argos-status-summary')[0];
 assert.ok(summary);
 assert.match(summary.textContent, /허용 1건/);
 assert.match(summary.textContent, /거부 2건/);
 change(root, '접속 상태', 'denied');
 assert.match(summary.textContent, /허용 0건/);
 assert.match(summary.textContent, /거부 2건/);
});

test('UX: reset restores all filter selections', () => {
 const root = view.renderEvents({
   status: 'ok', mode: 'demo', data: rows()
 });
 change(root, '기록 종류', 'xdr');
 change(root, '접속 상태', 'denied');
 assert.deepEqual(ids(root), ['new']);

 const reset = tagged(root, 'data-argos-filter-reset')[0];
 assert.ok(reset);
 reset.dispatch('click');
 assert.deepEqual(ids(root), ['new', 'middle', 'old']);
});

test('UX: identical timestamps preserve input order', () => {
 const data = [
   event('same-a', '2026-10-22T03:00:00Z',
     'access', 'library', 'allowed'),
   event('same-b', '2026-10-22T03:00:00Z',
     'xdr', 'library', 'denied'),
 ];
 const before = JSON.stringify(data);
 const root = view.renderEvents({
   status: 'ok', mode: 'demo', data
 });
 assert.deepEqual(ids(root), ['same-a', 'same-b']);
 assert.equal(JSON.stringify(data), before);
});
