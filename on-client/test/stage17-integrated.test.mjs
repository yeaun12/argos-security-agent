// Stage 17 offline regression tests. All AI interactions are mocks: NO live account, credential, or CLCO inference.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createStudentView} from '../student/extension.mjs';
import {createOnServer} from '../src/server.mjs';
import {demoEngine} from '../src/engine.mjs';
import {createClcoClient} from '../vendor/clco-http.mjs';

class ElementStub {
  constructor(tag) { this.tagName=tag;this.children=[];this.attributes={};this._text=''; }
  set textContent(v){this._text=String(v);this.children=[];}
  get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
  setAttribute(k,v){this.attributes[k]=String(v);}
  getAttribute(k){return this.attributes[k]??null;}
  append(...nodes){this.children.push(...nodes);}
}
globalThis.document={createElement:tag=>new ElementStub(tag)};
const view=createStudentView();
const now='2026-10-22T06:30:00.000Z';
// Stage 18 requires a complete selected incident and exact evidence references.
const sample=(overrides={})=>({
  event:{
    id:'E1',
    evidence:[{id:'e-01',text:'접속 시도 횟수가 기준을 초과했습니다.'}],
    rules:[{id:'r-01',text:'반복 접속 시도 탐지'}],
    state:{access:'unknown',session:'active',device:'compliant'},
    supportedActions:[],
  },
  explanation:{status:'ok',mode:'connected',data:{
    summary:'모의 사건 설명',evidenceIds:['e-01'],proposals:[],
    executed:false,requiresHumanConfirmation:true,
  },...overrides},
  checkedAt:now,
});

test('student: valid current explanation is accepted',()=>{
  const el=view.renderExplanation(sample());
  assert.equal(el.getAttribute('data-student-explanation-event'),'E1');
  assert.match(el.textContent,/모의 사건 설명/);
});
test('student: demo, disconnected, unknown cannot assert real success',()=>{
  for(const mode of ['demo','disconnected','unknown']){
    const el=view.renderExplanation(sample({mode}));
    assert.equal(el.getAttribute('data-student-explanation-event'),null);
    assert.match(el.textContent,/확인 불가/);
  }
});
test('student: executed or unconfirmed action never shows explanation success',()=>{
  const valid=sample().explanation.data;
  for(const data of [{...valid,executed:true},{...valid,requiresHumanConfirmation:false}]){
    const el=view.renderExplanation(sample({data}));
    assert.equal(el.getAttribute('data-student-explanation-event'),null);
  }
});
test('student: failing explanation preserves earlier event records',()=>{
  const el=view.renderExplanation({event:{id:'E1'},explanation:{status:'error',error:{code:'WB_CLCO_AUTH_REQUIRED',message:'승인 필요'}}});
  assert.equal(el.getAttribute('data-student-explanation-event'),null);
  assert.match(el.textContent,/기존 보안 기록은 그대로 유지/);
});
test('student: model list check is not incident generation',()=>{
  const el=view.renderAiConnection({status:'ok',mode:'connected',checkedAt:now,data:{transportChecked:true,audienceAuthorization:'verified',modelCount:3}});
  assert.match(el.textContent,/응답 모델 수/);
  assert.match(el.textContent,/사건 설명은 아직 실행하지 않았습니다/);
});
test('student: contradictory verified modes and bad checkedAt are not successes',()=>{
  for(const mode of ['demo','disconnected','unknown']){
    const el=view.renderAiConnection({status:'ok',mode,checkedAt:now,data:{transportChecked:true,audienceAuthorization:'verified',modelCount:1}});
    assert.match(el.textContent,/확인 불가/);
    assert.doesNotMatch(el.textContent,/앱 권한 확인 후 점검\(verified\)/);
  }
  const bad=view.renderAiConnection({status:'ok',mode:'connected',checkedAt:'INVALID',data:{transportChecked:true,audienceAuthorization:'verified',modelCount:1}});
  assert.match(bad.textContent,/확인 불가/);
});

const expectedIdentity=()=>({schema:'aleph.on.ai-identity.v1',sourceSubjectId:'practice-user',canonicalStudentId:'canonical-student',alephUserId:'student01',siteId:'site01',identityVersion:1,projectId:'practice-project',sessionId:'practice-session'});
async function withApp(ai,run){
  const srv=createOnServer({engine:demoEngine(),ai,resolveAiIdentity:async()=>expectedIdentity()});
  await new Promise(resolve=>srv.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${srv.address().port}`;
  const post=async(path,body)=>{const resp=await fetch(origin+path,{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});return {status:resp.status,json:await resp.json()};};
  try{await run(post);}
  finally{await new Promise((resolve,reject)=>srv.close(err=>err?reject(err):resolve()));}
}
test('server HTTP: selected event reaches mocked explainIncident only once',async()=>{
  let count=0;
  const ai={async explainIncident(incident,options){
    count++;assert.equal(incident.incidentId,'event-01');assert.deepEqual(incident.evidence.map(x=>x.id),['e-01']);
    assert.equal(options.expectedScope.appId,'aleph-on');
    return {ok:true,explanation:{summary:'모의 AI 요약',evidenceIds:['e-01'],proposals:[],requiresHumanConfirmation:true,executed:false}};
  }};
  await withApp(ai,async(post)=>{
    const response=await post('/api/ai/explain',{eventId:'event-01'});
    assert.equal(response.status,200);assert.equal(response.json.ok,true);
    assert.equal(response.json.data.explanation.summary,'모의 AI 요약');
  });
  assert.equal(count,1);
});
test('server HTTP: unknown incident never calls AI',async()=>{
  let count=0;
  await withApp({async explainIncident(){count++;return {ok:true};}},async(post)=>{
    const resp=await post('/api/ai/explain',{eventId:'nonexistent'});
    assert.equal(resp.status,404);assert.equal(resp.json.error.code,'EVENT_NOT_FOUND');
  });
  assert.equal(count,0);
});
test('server HTTP: unsafe AI explanation is rejected',async()=>{
  await withApp({async explainIncident(){return {ok:true,explanation:{summary:'모의',evidenceIds:['e-01'],proposals:[],requiresHumanConfirmation:true,executed:true}};}},async(post)=>{
    const resp=await post('/api/ai/explain',{eventId:'event-01'});
    assert.notEqual(resp.status,200);assert.equal(resp.json.ok,false);
  });
});
test('server HTTP: model list check does not call explainIncident',async()=>{
  let count=0;
  await withApp({async explainIncident(){count++;return {ok:true};},async checkConnection(){return {ok:false,error:{code:'ON_AI_PROVISIONING_PENDING'}};}},async(post)=>{
    await post('/api/ai/check',{});assert.equal(count,0);
  });
});
test('vendor HTTP: mock gateway receives only /v1/chat/completions',async()=>{
  let count=0;
  const gateway=createServer(async(req,res)=>{
    count++;assert.equal(req.url,'/v1/chat/completions');assert.equal(req.method,'POST');
    assert.equal(req.headers.authorization,'Bearer test-only-not-real');
    let body='';for await(const chunk of req)body+=chunk;
    assert.equal(JSON.parse(body).model,'example-model');
    res.writeHead(200,{'content-type':'application/json'});
    res.end(JSON.stringify({choices:[{message:{content:'{"summary":"모의 응답"}'},finish_reason:'stop'}]}));
  });
  await new Promise(resolve=>gateway.listen(0,'127.0.0.1',resolve));
  try{
    const client=createClcoClient({baseUrl:`http://127.0.0.1:${gateway.address().port}/v1`,token:'test-only-not-real',allowLoopbackHttp:true});
    const reply=await client.chat({model:'example-model',stream:false,messages:[{role:'user',content:'sample'}]});
    assert.equal(reply.choices[0].message.content,'{"summary":"모의 응답"}');
    assert.equal(count,1);
  }finally{await new Promise(resolve=>gateway.close(resolve));}
});
