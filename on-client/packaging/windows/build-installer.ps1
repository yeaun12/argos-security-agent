# Compile a verified basic package using an existing Inno Setup ISCC.exe.
# Does not install or modify an existing installation.
[CmdletBinding()]
param(
 [Parameter(Mandatory=$true)][string]$BasicRoot,
 [string]$OutputDirectory,
 [string]$IsccPath
)
Set-StrictMode -Version 3
$ErrorActionPreference = 'Stop'
if (-not [IO.Path]::IsPathRooted($BasicRoot)) { throw 'BasicRoot must be an absolute path.' }
$basic = [IO.Path]::GetFullPath($BasicRoot).TrimEnd('\')
$appRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$verify = Join-Path $appRoot 'packaging\verify-package.ps1'
& $verify -PackageRoot $basic
if (-not $?) { throw 'Basic package verification failed; stopping compilation.' }

if (-not $OutputDirectory) {
  $stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMdd-HHmmss-fff')
  $OutputDirectory = Join-Path $env:USERPROFILE "Documents\ARGOS-builds\installers\ARGOS-$stamp"
}
if (-not [IO.Path]::IsPathRooted($OutputDirectory)) { throw 'OutputDirectory must be absolute.' }
$output = [IO.Path]::GetFullPath($OutputDirectory).TrimEnd('\')
if (Test-Path -LiteralPath $output) { throw "Output exists; refusing overwrite: $output" }
if ($output.StartsWith($appRoot.TrimEnd('\') + '\',[StringComparison]::OrdinalIgnoreCase)) {
  throw 'Installer output cannot be placed inside source.'
}
if (-not $IsccPath) {
  $lookup = Get-Command ISCC.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($lookup) { $IsccPath = $lookup.Source }
}
if (-not $IsccPath) {
  $candidates = @(
    (Join-Path ${env:ProgramFiles(x86)} 'Inno Setup 6\ISCC.exe'),
    (Join-Path $env:ProgramFiles 'Inno Setup 6\ISCC.exe'),
    (Join-Path $env:LOCALAPPDATA 'Programs\Inno Setup 6\ISCC.exe')
  )
  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate -PathType Leaf) { $IsccPath = $candidate; break }
  }
}
if (-not $IsccPath -or -not (Test-Path -LiteralPath $IsccPath -PathType Leaf)) {
  throw 'Inno Setup ISCC.exe was not found. Install Inno Setup 6, or specify -IsccPath.'
}
if ((Split-Path -Leaf $IsccPath) -ine 'ISCC.exe') { throw 'Expected an ISCC.exe compiler path.' }
$iss = Join-Path $appRoot 'packaging\inno\Argos.iss'
if (-not (Test-Path -LiteralPath $iss -PathType Leaf)) { throw 'Argos.iss is missing.' }
New-Item -ItemType Directory -Path $output -ErrorAction Stop | Out-Null
Write-Host "COMPILING_SOURCE=$basic"
Write-Host "COMPILER=$IsccPath"
& $IsccPath "/DBasicRoot=$basic" "/O$output" $iss
if ($LASTEXITCODE -ne 0) { throw "Inno Setup compilation failed with exit code $LASTEXITCODE." }
$setup = Join-Path $output 'setup.exe'
if (-not (Test-Path -LiteralPath $setup -PathType Leaf)) {
  throw 'ISCC returned success but setup.exe was not found.'
}
$sha = (Get-FileHash -LiteralPath $setup -Algorithm SHA256).Hash.ToLowerInvariant()
Write-Host "SETUP_FILE=$setup"
Write-Host "SETUP_SHA256=$sha"
Write-Host 'Unsigned installer; installation, Node availability, restart and uninstallation are not yet verified.'
