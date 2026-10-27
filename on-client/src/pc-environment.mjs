// Total offensive day 3. Windows observation only; never modify host configuration.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const WIN_READ_SCRIPT="$ErrorActionPreference = 'Stop'\nfunction Stamp { (Get-Date).ToUniversalTime().ToString('o') }\n$r = [ordered]@{}\ntry {\n  $adapters = @(Get-NetAdapter -Physical -ErrorAction Stop | ForEach-Object {\n    @{name=[string]$_.Name;status=[string]$_.Status;linkSpeed=[string]$_.LinkSpeed}\n  })\n  $profiles = @(Get-NetConnectionProfile -ErrorAction Stop | ForEach-Object {\n    @{interfaceAlias=[string]$_.InterfaceAlias;networkCategory=[string]$_.NetworkCategory;\n      ipv4Connectivity=[string]$_.IPv4Connectivity;ipv6Connectivity=[string]$_.IPv6Connectivity}\n  })\n  $r.network = @{status='ok';adapters=$adapters;profiles=$profiles;measuredAt=(Stamp)}\n} catch {\n  $r.network = @{status='unavailable';reason='NETWORK_QUERY_FAILED';measuredAt=(Stamp)}\n}\ntry {\n  $firewall = @(Get-NetFirewallProfile -PolicyStore ActiveStore -ErrorAction Stop | ForEach-Object {\n    @{name=[string]$_.Name;enabled=[bool]$_.Enabled;\n      defaultInboundAction=[string]$_.DefaultInboundAction;\n      defaultOutboundAction=[string]$_.DefaultOutboundAction}\n  })\n  if ($firewall.Count -eq 0) { throw 'No firewall profiles' }\n  $r.firewall = @{status='ok';profiles=$firewall;measuredAt=(Stamp)}\n} catch {\n  $r.firewall = @{status='unavailable';reason='FIREWALL_QUERY_FAILED';measuredAt=(Stamp)}\n}\n$start = (Get-Date).AddHours(-24)\n$logs = @()\nforeach ($logName in @('System','Application')) {\n  try {\n    $items = @(Get-WinEvent -FilterHashtable @{\n      LogName=$logName;Level=@(2,3);StartTime=$start\n    } -ErrorAction Stop)\n    $errors = @($items | Where-Object { $_.Level -eq 2 }).Count\n    $warnings = @($items | Where-Object { $_.Level -eq 3 }).Count\n    $logs += @{name=$logName;status='ok';errors=$errors;warnings=$warnings;measuredAt=(Stamp)}\n  } catch {\n    if ($_.FullyQualifiedErrorId -like '*NoMatchingEventsFound*') {\n      $logs += @{name=$logName;status='ok';errors=0;warnings=0;measuredAt=(Stamp)}\n    } else {\n      $logs += @{name=$logName;status='unavailable';reason='EVENT_LOG_QUERY_FAILED';measuredAt=(Stamp)}\n    }\n  }\n}\n$r.events = @{status='ok';windowHours=24;logs=$logs;measuredAt=(Stamp)}\n[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)\n[pscustomobject]$r | ConvertTo-Json -Compress -Depth 9";

const runExec = promisify(execFile);
const stamp = () => new Date().toISOString();
const validDate = v => typeof v === 'string' && Number.isFinite(Date.parse(v));
const asText = v => typeof v === 'string' && v.length <= 120 ? v : null;
const count = v => Number.isSafeInteger(v) && v >= 0 ? v : null;
const failure = (reason, at) => ({status:'unavailable',reason,measuredAt:at});
function getAt(item, now) {return validDate(item?.measuredAt) ? item.measuredAt : now;}
function safeNetwork(raw, now) {
 if (raw?.status === 'unavailable') return failure('NETWORK_QUERY_FAILED',getAt(raw,now));
 if (raw?.status !== 'ok' || !validDate(raw.measuredAt) || !Array.isArray(raw.adapters) || !Array.isArray(raw.profiles)
   || raw.adapters.length > 32 || raw.profiles.length > 32) return failure('INVALID_RESULT',now);
 const adapters = raw.adapters.map(x => ({name:asText(x?.name),status:asText(x?.status),linkSpeed:asText(x?.linkSpeed)}));
 const profiles = raw.profiles.map(x => ({interfaceAlias:asText(x?.interfaceAlias),networkCategory:asText(x?.networkCategory),
   ipv4Connectivity:asText(x?.ipv4Connectivity),ipv6Connectivity:asText(x?.ipv6Connectivity)}));
 if(adapters.some(x => Object.values(x).includes(null)) || profiles.some(x => Object.values(x).includes(null))) return failure('INVALID_RESULT',now);
 return {status:'ok',adapters,profiles,measuredAt:raw.measuredAt};
}
function safeFirewall(raw, now) {
 if(raw?.status === 'unavailable') return failure('FIREWALL_QUERY_FAILED',getAt(raw,now));
 if(raw?.status !== 'ok' || !validDate(raw.measuredAt) || !Array.isArray(raw.profiles)
   || raw.profiles.length === 0 || raw.profiles.length > 8) return failure('INVALID_RESULT',now);
 const profiles=raw.profiles.map(x=>({name:asText(x?.name),enabled:x?.enabled===true?true:x?.enabled===false?false:null,
   defaultInboundAction:asText(x?.defaultInboundAction),defaultOutboundAction:asText(x?.defaultOutboundAction)}));
 if(profiles.some(x=>Object.values(x).includes(null)))return failure('INVALID_RESULT',now);
 return {status:'ok',profiles,measuredAt:raw.measuredAt};
}
function safeEvents(raw, now) {
 if(raw?.status==='unavailable')return failure('EVENT_LOG_QUERY_FAILED',getAt(raw,now));
 if(raw?.status!=='ok' || raw.windowHours!==24 || !validDate(raw.measuredAt) || !Array.isArray(raw.logs)
   || raw.logs.length !== 2) return failure('INVALID_RESULT',now);
 const logs=[];
 for(const name of ['System','Application']){
   const item=raw.logs.find(x=>x?.name===name);
   if(!item||raw.logs.filter(x=>x?.name===name).length!==1)return failure('INVALID_RESULT',now);
   if(item.status==='unavailable') logs.push({...failure('EVENT_LOG_QUERY_FAILED',getAt(item,now)),name});
   else if(item.status==='ok' && validDate(item.measuredAt) && count(item.errors)!==null && count(item.warnings)!==null)
     logs.push({name,status:'ok',errors:item.errors,warnings:item.warnings,measuredAt:item.measuredAt});
   else logs.push({...failure('INVALID_RESULT',now),name});
 }
 return {status:'ok',windowHours:24,logs,measuredAt:raw.measuredAt};
}
export function normalizePcEnvironment(raw,now=stamp()){
 return {source:'windows-readonly',
   network:safeNetwork(raw?.network,now),firewall:safeFirewall(raw?.firewall,now),events:safeEvents(raw?.events,now)};
}
export function describeSdpConnection({mode,hostConfigured}={}){
 // Engine mode alone does NOT prove that a remote SDP server is reachable.
 if(mode==='demo')return {status:'disconnected',reason:'DEMO_MODE'};
 if(mode==='disconnected' && hostConfigured!==true)return {status:'disconnected',reason:'SDP_NOT_CONFIGURED'};
 return {status:'unknown',reason:'SDP_CONNECTION_UNVERIFIED'};
}
export async function readPcEnvironment({platform=process.platform,
  run=script=>runExec('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],
    {windowsHide:true,timeout:8500,maxBuffer:65536})}={}){
 const now=stamp();
 const unavailable=reason=>({source:reason==='UNSUPPORTED_PLATFORM'?'unsupported':'windows-readonly',
   network:failure(reason,now),firewall:failure(reason,now),events:failure(reason,now)});
 if(platform!=='win32')return unavailable('UNSUPPORTED_PLATFORM');
 try {
  const {stdout}=await run(WIN_READ_SCRIPT);
  return normalizePcEnvironment(JSON.parse(String(stdout).replace(/^\uFEFF/,'').trim()),now);
 }catch{return unavailable('MEASUREMENT_FAILED');}
}
