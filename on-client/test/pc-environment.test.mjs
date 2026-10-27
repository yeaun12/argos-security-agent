// Day 3 tests use synthetic Windows data, not a live event log.
import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePcEnvironment,readPcEnvironment,describeSdpConnection} from '../src/pc-environment.mjs';
const at='2026-10-27T04:20:00.000Z';
const sample={
 network:{status:'ok',measuredAt:at,adapters:[{name:'이더넷 2',status:'Up',linkSpeed:'1 Gbps'}],
  profiles:[{interfaceAlias:'이더넷 2',networkCategory:'Public',ipv4Connectivity:'Internet',ipv6Connectivity:'NoTraffic'}]},
 firewall:{status:'ok',measuredAt:at,profiles:[
  {name:'Domain',enabled:false,defaultInboundAction:'Block',defaultOutboundAction:'Allow'},
  {name:'Private',enabled:true,defaultInboundAction:'Block',defaultOutboundAction:'Allow'},
  {name:'Public',enabled:true,defaultInboundAction:'Block',defaultOutboundAction:'Allow'}]},
 events:{status:'ok',windowHours:24,measuredAt:at,logs:[
  {name:'System',status:'ok',errors:0,warnings:4,measuredAt:at},
  {name:'Application',status:'ok',errors:6,warnings:11,measuredAt:at}]},
};
test('day 3: Windows results preserve network/firewall/log facts without risk classification',()=>{
 const out=normalizePcEnvironment(sample);
 assert.equal(out.source,'windows-readonly');
 assert.equal(out.network.profiles[0].networkCategory,'Public');
 assert.equal(out.firewall.profiles[0].enabled,false);
 assert.equal(out.firewall.profiles[2].enabled,true);
 assert.deepEqual(out.events.logs.map(x=>[x.name,x.errors,x.warnings]),[['System',0,4],['Application',6,11]]);
 assert.equal(out.events.windowHours,24);
 assert.equal(out.events.measuredAt,at);
 assert.equal(Object.hasOwn(out,'safe'),false);
});
test('day 3: read via fake process preserves a valid sample',async()=>{
 const out=await readPcEnvironment({platform:'win32',run:async()=>({stdout:JSON.stringify(sample)})});
 assert.equal(out.network.adapters[0].linkSpeed,'1 Gbps');
 assert.equal(out.events.logs[1].warnings,11);
});
test('day 3: missing network is not a normal empty connection',()=>{
 const out=normalizePcEnvironment({...sample,network:null});
 assert.equal(out.network.status,'unavailable');
 assert.equal(out.network.reason,'INVALID_RESULT');
});
test('day 3: permissions failure in firewall is distinct from disabled',()=>{
 const out=normalizePcEnvironment({...sample,firewall:{status:'unavailable',reason:'FIREWALL_QUERY_FAILED',measuredAt:at}});
 assert.equal(out.firewall.reason,'FIREWALL_QUERY_FAILED');
 assert.equal(out.network.status,'ok');
});
test('day 3: inaccessible Application log is not counted as zero',()=>{
 const events={...sample.events,logs:[sample.events.logs[0],
  {name:'Application',status:'unavailable',reason:'EVENT_LOG_QUERY_FAILED',measuredAt:at}]};
 const out=normalizePcEnvironment({...sample,events});
 assert.equal(out.events.logs[0].errors,0);
 assert.equal(out.events.logs[1].status,'unavailable');
 assert.equal(out.events.logs[1].errors,undefined);
});
test('day 3: negative or fractional event counts are invalid',()=>{
 const events={...sample.events,logs:[sample.events.logs[0],
  {...sample.events.logs[1],errors:-3}]};
 const out=normalizePcEnvironment({...sample,events});
 assert.equal(out.events.logs[1].reason,'INVALID_RESULT');
});
test('day 3: SDK error details and addresses are not surfaced',()=>{
 const out=normalizePcEnvironment({...sample,network:{status:'unavailable',reason:'C:\\sensitive',measuredAt:at}});
 assert.equal(out.network.reason,'NETWORK_QUERY_FAILED');
});
test('day 3: non-Windows environments return unavailable without execution',async()=>{
 let called=false;
 const out=await readPcEnvironment({platform:'linux',run:async()=>{called=true;}});
 assert.equal(called,false);
 assert.equal(out.events.reason,'UNSUPPORTED_PLATFORM');
});
test('day 3: failed PowerShell and malformed JSON do not invent data',async()=>{
 for(const run of [async()=>{throw Error('access denied')},async()=>({stdout:'bad-json'})]){
  const out=await readPcEnvironment({platform:'win32',run});
  assert.equal(out.network.reason,'MEASUREMENT_FAILED');
  assert.equal(out.firewall.status,'unavailable');
  assert.equal(out.events.status,'unavailable');
 }
});
test('day 3: SDP demo and unconfigured are distinct from unverified connected',()=>{
 assert.deepEqual(describeSdpConnection({mode:'demo'}),{status:'disconnected',reason:'DEMO_MODE'});
 assert.equal(describeSdpConnection({mode:'disconnected',hostConfigured:false}).status,'disconnected');
 assert.equal(describeSdpConnection({mode:'connected',hostConfigured:true}).status,'unknown');
 assert.equal(describeSdpConnection({mode:'connected',hostConfigured:false}).status,'unknown');
});
