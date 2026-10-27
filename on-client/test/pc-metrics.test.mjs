// Synthetic fixtures — never live measurements.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readPcMetrics,normalizePcMetrics} from '../src/pc-metrics.mjs';
const at='2026-10-27T03:05:13.000Z';
const fixture={cpu:{status:'ok',usagePercent:11,measuredAt:at},
 memory:{status:'ok',totalGiB:15.9,usedGiB:7.3,usagePercent:45.9,measuredAt:at},
 disk:{status:'ok',drive:'C:',totalGiB:464.68,freeGiB:70.66,measuredAt:at}};
test('valid Windows measurements',async()=>{
 const r=await readPcMetrics({platform:'win32',run:async()=>({stdout:JSON.stringify(fixture)})});
 assert.equal(r.cpu.usagePercent,11);assert.equal(r.memory.usedGiB,7.3);
 assert.equal(r.disk.freeGiB,70.66);assert.equal(r.disk.measuredAt,at);
});
test('invalid values cannot become successful measurements',()=>{
 const r=normalizePcMetrics({cpu:{status:'ok',usagePercent:-4,measuredAt:at}});
 for(const k of ['cpu','memory','disk'])assert.equal(r[k].status,'unavailable');
});
test('partial Windows failure is distinguished',()=>{
 const r=normalizePcMetrics({...fixture,memory:{status:'unavailable',reason:'MEMORY_QUERY_FAILED',measuredAt:at}});
 assert.equal(r.cpu.status,'ok');assert.equal(r.memory.reason,'MEMORY_QUERY_FAILED');
 assert.equal(r.disk.status,'ok');
});
test('unrecognized failure reason is not exposed',()=>{
 const r=normalizePcMetrics({...fixture,cpu:{status:'unavailable',reason:'SECRET_PATH',measuredAt:at}});
 assert.equal(r.cpu.reason,'INVALID_RESULT');
});
test('non-Windows does not pretend to measure',async()=>{
 let called=false;const r=await readPcMetrics({platform:'linux',run:async()=>{called=true}});
 assert.equal(called,false);assert.equal(r.cpu.reason,'UNSUPPORTED_PLATFORM');
});
test('execution failure produces no fake zeros',async()=>{
 const r=await readPcMetrics({platform:'win32',run:async()=>{throw Error('no CIM')}});
 for(const k of ['cpu','memory','disk'])assert.equal(r[k].reason,'MEASUREMENT_FAILED');
});
test('malformed JSON is unavailable',async()=>{
 const r=await readPcMetrics({platform:'win32',run:async()=>({stdout:'bad'})});
 assert.equal(r.memory.status,'unavailable');
});
