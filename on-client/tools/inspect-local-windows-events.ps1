# ARGOS READ-ONLY telemetry availability probe.
# Reports ONLY log access state and capped sample counts; never emits event contents.
# This does not connect SDP/XDR or modify the installed ARGOS application.
[CmdletBinding()]
param(
  [ValidateRange(1,30)][int]$Days=7,
  [ValidateRange(1,100)][int]$MaxEvents=25
)
Set-StrictMode -Version 3
$ErrorActionPreference = 'Stop'

function Get-SafeFailureState {
  param([Parameter(Mandatory=$true)][System.Management.Automation.ErrorRecord]$Failure)
  $e = $Failure.Exception
  # Win32 access denied HRESULT 0x80070005 and common PowerShell auth errors.
  if ($e -is [System.UnauthorizedAccessException] -or
      $e -is [System.Security.SecurityException] -or
      $e.HResult -eq -2147024891 -or
      $Failure.FullyQualifiedErrorId -match 'UnauthorizedAccess|AccessDenied|PermissionDenied') {
    return 'permission_denied'
  }
  if ($Failure.FullyQualifiedErrorId -match 'NoMatchingEventsFound|NoEventsFound') {
    return 'no_events_in_window'
  }
  return 'unavailable_or_unreadable'
}

$logs = @(
  'Security',
  'Microsoft-Windows-Windows Defender/Operational',
  'Microsoft-Windows-PowerShell/Operational',
  'Microsoft-Windows-Sysmon/Operational'
)
$startTime = (Get-Date).AddDays(-$Days)
$results = [Collections.Generic.List[object]]::new()
foreach ($name in $logs) {
  $status='unavailable_or_unreadable'
  $sampleCount=0
  try {
    # This verifies that the named log can be inspected. No log event is printed.
    $null = Get-WinEvent -ListLog $name -ErrorAction Stop
    try {
      # A bounded sample, not a full log count. No message, record ID,
      # subject name, computer name, time or raw JSON leaves this process.
      $sample = @(Get-WinEvent -FilterHashtable @{LogName=$name;StartTime=$startTime} -MaxEvents $MaxEvents -ErrorAction Stop)
      $sampleCount = $sample.Count
      $status='readable'
      $sample=$null
    } catch {
      $status=Get-SafeFailureState -Failure $_
    }
  } catch {
    $status=Get-SafeFailureState -Failure $_
  }
  [void]$results.Add([pscustomobject][ordered]@{
    log=$name
    state=$status
    sampledCount=$sampleCount
    sampleCap=$MaxEvents
    windowDays=$Days
  })
}
[pscustomobject][ordered]@{
  schema='argos.local-event-source-probe.v1'
  readOnly=$true
  includesEventContents=$false
  inference='Availability of sampled event logs only; not an incident count or XDR determination'
  results=@($results.ToArray())
} | ConvertTo-Json -Depth 5
