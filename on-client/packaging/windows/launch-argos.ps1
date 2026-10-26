# ARGOS packaged launcher. Not the development launcher.
# This version supports offline and explicitly labeled DEMO only.
# It never reads native/SDP credentials or enables action execution.
[CmdletBinding()]
param(
  [switch]$Demo,
  [ValidateRange(1024,65535)][int]$Port = 5196,
  [ValidateRange(5,90)][int]$WaitSeconds = 20
)
Set-StrictMode -Version 3
$ErrorActionPreference = 'Stop'
$installRoot = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$appRoot = Join-Path $installRoot 'app'
$server = Join-Path $appRoot 'src\server.mjs'
$package = Join-Path $appRoot 'package.json'
foreach ($location in @($installRoot, $appRoot, $server, $package)) {
  if (-not (Test-Path -LiteralPath $location)) { throw "Installed ARGOS file missing: $location" }
  if ((Get-Item -LiteralPath $location -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) {
    throw "Linked install component rejected: $location"
  }
}
if (-not (Test-Path -LiteralPath (Join-Path $installRoot 'PACKAGE_MANIFEST.json') -PathType Leaf)) {
  throw 'Package manifest is missing. Do not start an incomplete installation.'
}
$meta = Get-Content -LiteralPath $package -Raw -Encoding UTF8 | ConvertFrom-Json
if ($meta.name -cne 'alekov-client-starter') { throw 'Unexpected ARGOS runtime.' }

$node = Get-Command node -CommandType Application -ErrorAction Stop | Select-Object -First 1
if ($node.Source -notmatch '(?i)[\\/]node\.exe$') { throw 'Node.js executable not found in PATH.' }
$version = (& $node.Source --version | Out-String).Trim()
if ($version -notmatch '^v(\d+)\.\d+\.\d+$') { throw 'Node.js version could not be validated.' }
$major = [int]$Matches[1]
if ($major -lt 22 -or $major -gt 24) {
  throw "ARGOS needs Node.js 22–24 (reference: v24.19.0); detected $version."
}
$occupied = $false
try {
  $probe = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,$Port)
  $probe.Start()
  $probe.Stop()
} catch { $occupied = $true }
if ($occupied) { throw "Port $Port is already in use. Leave existing processes running; retry with another -Port." }

# Do not inherit app overrides, credentials, private API keys or training environment settings.
$info = [Diagnostics.ProcessStartInfo]::new()
$info.FileName = $node.Source
$info.WorkingDirectory = $appRoot
$info.UseShellExecute = $false
$info.CreateNoWindow = $false
$info.Arguments = '"' + $server + '"' + $(if ($Demo) { ' --demo' } else { '' })
$privateVariable = '(?i)(^ON_|^ALEPH_|^OPENAI|^ANTHROPIC|^SUPABASE|^DATABRICKS|TOKEN|SECRET|PASSWORD|PASSWD|CREDENTIAL|API_?KEY|PRIVATE_?KEY|ACCESS_?KEY|AUTHORIZATION)'
foreach ($key in @($info.EnvironmentVariables.Keys)) {
  if ($key -match $privateVariable) { $info.EnvironmentVariables.Remove($key) }
}
$info.EnvironmentVariables['ON_PORT'] = [string]$Port
$process = $null
$uri = "http://127.0.0.1:$Port/"
try {
  $process = [Diagnostics.Process]::Start($info)
  if ($null -eq $process) { throw 'Failed to start Node.js.' }
  $ready = $false
  $until = (Get-Date).AddSeconds($WaitSeconds)
  while ((Get-Date) -lt $until -and -not $process.HasExited) {
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri $uri -TimeoutSec 2
      if ($response.StatusCode -eq 200) { $ready = $true; break }
    } catch { Start-Sleep -Milliseconds 300 }
  }
  if (-not $ready) { throw 'Local server did not become ready; no connection was confirmed.' }
  Write-Host "ARGOS UI ready: $uri"
  if ($Demo) {
    Write-Host 'DEMO ONLY: policy decisions and event records are illustrative, NOT live SDP/XDR observations.'
  } else {
    Write-Host 'OFFLINE: no native account or SDP credentials were supplied; disconnected is not security success.'
  }
  Write-Host 'An HTTP response does NOT confirm authentication, AI availability or a security action.'
  try { Start-Process -FilePath $uri -ErrorAction Stop | Out-Null }
  catch { Write-Host "Open this URL manually: $uri" }
  Write-Host 'Close this PowerShell window or press Ctrl+C to stop this ARGOS server.'
  $process.WaitForExit()
} finally {
  # Never terminate other applications or any process that was not started here.
  if ($null -ne $process -and -not $process.HasExited) {
    try { $process.Kill(); $process.WaitForExit() } catch { }
  }
  if ($null -ne $process) { $process.Dispose() }
}
