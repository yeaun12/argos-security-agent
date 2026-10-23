// Stage 20 offline render tests. No network, OSV lookup, account credentials or package installation.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createStudentView } from '../student/extension.mjs';

class ElementStub {
  constructor(tag) { this.tagName=tag; this.children=[]; this.attributes={}; this._text=''; }
  set textContent(text) { this._text=String(text); this.children=[]; }
  get textContent() { return this._text+this.children.map(row=>row.textContent).join(''); }
  append(...nodes) { this.children.push(...nodes); }
  setAttribute(k,v) { this.attributes[k]=String(v); }
  getAttribute(k) { return this.attributes[k]??null; }
}
globalThis.document={ createElement:tag=>new ElementStub(tag) };
const view=createStudentView();
const stamp='2026-10-23T14:00:00.000Z';
const HASH1='a'.repeat(64),HASH2='b'.repeat(64);
const verified=()=>({
  name:'@demo/package', version:'1.2.3', status:'known_vulnerabilities',
  source:'https://api.osv.dev/v1/querybatch',checkedAt:stamp,
  vulnerabilities:[{id:'CVE-2026-12345',modified:stamp}],
});
const clean=()=>({
  name:'safe-demo',version:'2.1.0',status:'none_found',vulnerabilities:[],
  source:'https://api.osv.dev/v1/querybatch',checkedAt:stamp,
});
const unknown=()=>({
  name:'partial-demo',version:'3.0.0',status:'unverifiable',
  vulnerabilities:[{id:'GHSA-abcd-efgh-ijkl',modified:stamp}],
  source:'https://api.osv.dev/v1/querybatch',checkedAt:stamp,
});
const scan=(status,packages,hash=HASH1)=>({
  status,lockfileVersion:3,lockfileHash:hash,checkedAt:stamp,
  excluded:{count:0},packages,
});
const render=(status,data,extra={})=>view.renderVulnerabilities({status,data,...extra});
function sections(root) { return [root,...root.children.flatMap(sections)]; }
const rows=root=>sections(root).filter(row=>row.getAttribute('data-student-package-name'));

test('stage20: idle and loading do not preserve old package table or attributes',()=>{
  const old=render('ok',scan('complete',[verified()]));
  assert.equal(rows(old).length,1);
  for(const state of ['idle','loading']){
    const latest=render(state,scan('complete',[verified()]));
    assert.equal(rows(latest).length,0);
    assert.doesNotMatch(latest.textContent,/CVE-2026-12345/);
    assert.match(latest.textContent,state==='idle'?/조회 전\(idle\)/:/조회 중\(loading\)/);
  }
});
test('stage20: error displays safe cause without previous vulnerabilities',()=>{
  const failure=render('error',scan('complete',[verified()]),{
    error:{code:'TIMEOUT',message:'조회 제한 시간 초과'},
  });
  assert.equal(rows(failure).length,0);
  assert.match(failure.textContent,/조회 실패\(error\)/);
  assert.match(failure.textContent,/조회 제한 시간 초과/);
  assert.doesNotMatch(failure.textContent,/CVE-2026-12345/);
  assert.match(failure.textContent,/취약점 없음으로 해석하지 않습니다/);
});
test('stage20: all aggregate states retain their distinct meaning',()=>{
  for(const [status,needle] of [
    ['complete','모두 조회(complete)'],['partial','일부 조회 실패(partial)'],
    ['not_checked','아직 조회 안 함(not_checked)'],
    ['not_configured','조회 준비 미완료(not_configured)'],
    ['unverifiable','잠금 파일 확인 불가(unverifiable)'],
  ]){
    const data=['not_configured','unverifiable'].includes(status)?
      {status,code:status==='not_configured'?'PROJECT_NOT_CONFIGURED':'LOCKFILE_UNVERIFIABLE',checkedAt:stamp,packages:[]}:
      scan(status,status==='partial'?[unknown()]:[]);
    assert.match(render('ok',data).textContent,new RegExp(needle.replace(/[()]/g,'\\$&')));
  }
});
test('stage20: exact installed versions, hash and source are displayed with row markers',()=>{
  const el=render('ok',scan('complete',[verified()]));
  assert.match(el.textContent,/잠금 파일 버전\(lockfileVersion\): 3/);
  assert.match(el.textContent,new RegExp(HASH1));
  assert.match(el.textContent,/출처\(source\): https:\/\/api.osv.dev\/v1\/querybatch/);
  assert.match(el.textContent,/전체 조회 시각/);
  assert.match(el.textContent,/패키지 조회 시각/);
  assert.equal(rows(el)[0].getAttribute('data-student-package-name'),'@demo/package');
  assert.equal(rows(el)[0].getAttribute('data-student-package-version'),'1.2.3');
});
test('stage20: version range must never be marked as installed version',()=>{
  const altered=verified();altered.version='^1.2.3';
  const el=render('ok',scan('complete',[altered]));
  assert.equal(rows(el).length,0);
  assert.match(el.textContent,/설치 버전 확인 불가/);
  assert.doesNotMatch(el.textContent,/설치된 정확한 버전: \^1.2.3/);
});
test('stage20: known OSV finding shows its ID and modified date',()=>{
  const el=render('ok',scan('complete',[verified()]));
  assert.match(el.textContent,/취약점 ID\(id\): CVE-2026-12345/);
  assert.match(el.textContent,/취약점 수정 시각\(modified\): 2026-10-23/);
});
test('stage20: none_found is limited to checked scope, not a security guarantee',()=>{
  const el=render('ok',scan('complete',[clean()]));
  assert.match(el.textContent,/조회 범위에서 알려진 취약점 없음/);
  assert.match(el.textContent,/안전하다는 보장은 아닙니다/);
  assert.doesNotMatch(el.textContent,/CVE-/);
});
test('stage20: partial scan keeps confirmed findings from unverifiable package',()=>{
  const el=render('ok',scan('partial',[verified(),unknown()]));
  assert.equal(rows(el).length,2);
  assert.match(el.textContent,/CVE-2026-12345/);
  assert.match(el.textContent,/GHSA-abcd-efgh-ijkl/);
  assert.match(el.textContent,/일부 확인·전체 조회 확인 불가/);
  assert.match(el.textContent,/이미 받은 취약점 ID는 삭제하지 않습니다/);
});
test('stage20: not_checked and not_configured cannot assert no vulnerabilities',()=>{
  const statuses=[
    {status:'not_checked',code:'NO_APPROVED_PACKAGES',lockfileVersion:3,lockfileHash:HASH1,checkedAt:stamp,packages:[]},
    {status:'not_configured',code:'PROJECT_NOT_CONFIGURED',checkedAt:stamp,packages:[]},
  ];
  for(const s of statuses){
    const el=render('ok',s);
    assert.equal(rows(el).length,0);
    assert.match(el.textContent,/취약점이 없다는 뜻이 아닙니다/);
    assert.doesNotMatch(el.textContent,/조회 범위에서 알려진 취약점 없음/);
  }
});
test('stage20: refresh changes package hash and does not retain older findings',()=>{
  const first=render('ok',scan('complete',[verified()],HASH1));
  const second=render('ok',scan('complete',[clean()],HASH2));
  assert.match(first.textContent,new RegExp(HASH1));
  assert.match(second.textContent,new RegExp(HASH2));
  assert.doesNotMatch(second.textContent,new RegExp(HASH1));
  assert.doesNotMatch(second.textContent,/CVE-2026-12345/);
  assert.equal(rows(second).length,1);
});
test('stage20: unknown/error result cannot inherit successful marker',()=>{
  const e=render('error',undefined,{error:{code:'CONTRACT_MISMATCH',message:'응답 확인 불가'}});
  assert.equal(rows(e).length,0);
  assert.match(e.textContent,/CONTRACT_MISMATCH/);
  assert.doesNotMatch(e.textContent,/조회 범위에서 알려진 취약점 없음/);
});
test('stage20: unverified package without findings never becomes clean',()=>{
  const p=unknown();p.vulnerabilities=[];
  const el=render('ok',scan('partial',[p]));
  assert.match(el.textContent,/패키지별 조회 확인 불가/);
  assert.doesNotMatch(el.textContent,/조회 범위에서 알려진 취약점 없음/);
});
