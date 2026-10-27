// Windows-only local PC measurements. Never fabricate a demo measurement.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const command="$ErrorActionPreference = 'Stop'\nfunction Stamp { (Get-Date).ToUniversalTime().ToString('o') }\n$r = [ordered]@{}\ntry {\n $loads = @(Get-CimInstance Win32_Processor | ForEach-Object { $_.LoadPercentage } | Where-Object { $null -ne $_ -and $_ -ge 0 -and $_ -le 100 })\n if ($loads.Count -eq 0) { throw 'CPU unavailable' }\n $r.cpu = @{status='ok';usagePercent=[math]::Round([double](($loads|Measure-Object -Average).Average),1);measuredAt=(Stamp)}\n} catch { $r.cpu = @{status='unavailable';reason='CPU_QUERY_FAILED';measuredAt=(Stamp)} }\ntry {\n $os = Get-CimInstance Win32_OperatingSystem\n $t = [double]$os.TotalVisibleMemorySize\n $f = [double]$os.FreePhysicalMemory\n if ($t -le 0 -or $f -lt 0 -or $f -gt $t) { throw 'Memory invalid' }\n $r.memory = @{status='ok';totalGiB=[math]::Round($t/1MB,2);usedGiB=[math]::Round(($t-$f)/1MB,2);usagePercent=[math]::Round(($t-$f)/$t*100,1);measuredAt=(Stamp)}\n} catch { $r.memory = @{status='unavailable';reason='MEMORY_QUERY_FAILED';measuredAt=(Stamp)} }\ntry {\n $drive = $env:SystemDrive\n if ($drive -notmatch '^[A-Za-z]:$') { throw 'Drive unavailable' }\n $d = Get-CimInstance Win32_LogicalDisk -Filter \"DeviceID='$drive'\"\n if ($null -eq $d -or $null -eq $d.Size -or $null -eq $d.FreeSpace) { throw 'Disk unavailable' }\n $t = [double]$d.Size\n $f = [double]$d.FreeSpace\n if ($t -le 0 -or $f -lt 0 -or $f -gt $t) { throw 'Disk invalid' }\n $r.disk = @{status='ok';drive=$drive.ToUpperInvariant();totalGiB=[math]::Round($t/1GB,2);freeGiB=[math]::Round($f/1GB,2);measuredAt=(Stamp)}\n} catch { $r.disk = @{status='unavailable';reason='DISK_QUERY_FAILED';measuredAt=(Stamp)} }\n[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)\n[pscustomobject]$r | ConvertTo-Json -Compress -Depth 5";

const exec=promisify(execFile);
const reasons=new Set(['CPU_QUERY_FAILED','MEMORY_QUERY_FAILED','DISK_QUERY_FAILED','MEASUREMENT_FAILED','UNSUPPORTED_PLATFORM','INVALID_RESULT']);
const validTime=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const fail=(reason,at)=>({status:'unavailable',reason,measuredAt:at});
export function normalizePcMetrics(raw,at=new Date().toISOString()){
 const out={source:'windows-cim'};
 for(const k of ['cpu','memory','disk']){
  const v=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw[k]:null;
  if(v?.status==='unavailable'){out[k]=fail(reasons.has(v.reason)?v.reason:'INVALID_RESULT',validTime(v.measuredAt)?v.measuredAt:at);continue}
  if(v?.status!=='ok'||!validTime(v.measuredAt)){out[k]=fail('INVALID_RESULT',at);continue}
  let good=false;
  if(k==='cpu')good=finite(v.usagePercent)&&v.usagePercent>=0&&v.usagePercent<=100;
  else if(k==='memory')good=finite(v.usedGiB)&&finite(v.totalGiB)&&finite(v.usagePercent)
   &&v.totalGiB>0&&v.usedGiB>=0&&v.usedGiB<=v.totalGiB&&v.usagePercent>=0&&v.usagePercent<=100;
  else good=typeof v.drive==='string'&&/^[A-Z]:$/.test(v.drive)&&finite(v.totalGiB)&&finite(v.freeGiB)
   &&v.totalGiB>0&&v.freeGiB>=0&&v.freeGiB<=v.totalGiB;
  out[k]=good?Object.fromEntries(Object.entries(v).map(([key,value])=>[key,typeof value==='number'?Math.round(value*100)/100:value])):fail('INVALID_RESULT',at);
 }
 return out;
}
export async function readPcMetrics({platform=process.platform,run=script=>exec('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{timeout:8000,maxBuffer:65536,windowsHide:true})}={}){
 const at=new Date().toISOString();
 const unavailable=reason=>({source:reason==='UNSUPPORTED_PLATFORM'?'not-supported':'windows-cim',
  cpu:fail(reason,at),memory:fail(reason,at),disk:fail(reason,at)});
 if(platform!=='win32')return unavailable('UNSUPPORTED_PLATFORM');
 try{
  const {stdout}=await run(command);
  return normalizePcMetrics(JSON.parse(String(stdout).replace(/^\uFEFF/,'').trim()),at);
 }catch{return unavailable('MEASUREMENT_FAILED')}
}
