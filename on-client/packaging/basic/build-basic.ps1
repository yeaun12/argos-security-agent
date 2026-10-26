# Build a fresh ARGOS basic package from an approved, fixed runtime allowlist.
# Never modifies or removes the original source, other project folders or prior builds.
[CmdletBinding()]
param([string]$OutputRoot)
Set-StrictMode -Version 3
$ErrorActionPreference = 'Stop'
$appRoot = [IO.Path]::GetFullPath((Split-Path -Parent (Split-Path -Parent $PSScriptRoot))).TrimEnd('\')
if (-not $OutputRoot) {
  $tag = (Get-Date).ToUniversalTime().ToString('yyyyMMdd-HHmmss-fff')
  $OutputRoot = Join-Path $env:USERPROFILE "Documents\ARGOS-builds\basic\ARGOS-$tag"
}
if (-not [IO.Path]::IsPathRooted($OutputRoot)) { throw 'OutputRoot must be an absolute path.' }
$destination = [IO.Path]::GetFullPath($OutputRoot).TrimEnd('\')
if ($destination.StartsWith($appRoot + '\',[StringComparison]::OrdinalIgnoreCase) -or
    $destination.Equals($appRoot,[StringComparison]::OrdinalIgnoreCase)) {
  throw 'The package output cannot be inside the application source folder.'
}
if (Test-Path -LiteralPath $destination) { throw "Output already exists; no overwrite: $destination" }

# The list is intentionally fixed. New sources must undergo review before shipping.
$approvedPaths = @(
  'package.json',
  'public/ai-connect.mjs',
  'public/app.js',
  'public/assets/alekov/alekov-ai-explain.webp',
  'public/assets/alekov/alekov-app-icon.webp',
  'public/assets/alekov/alekov-connect-approval.webp',
  'public/assets/alekov/alekov-connection-unknown.webp',
  'public/assets/alekov/alekov-empty-records.webp',
  'public/index.html',
  'public/style.css',
  'public/vulnerabilities-view.mjs',
  'src/actions/action-startup-config.mjs',
  'src/actions/sdp-action-engine.mjs',
  'src/actions/service.mjs',
  'src/actions/store.mjs',
  'src/ai/app-authorization.mjs',
  'src/ai/connection.mjs',
  'src/ai/credential-vault.mjs',
  'src/ai/learner-support-contract.mjs',
  'src/ai/service.mjs',
  'src/ai/vault-service.mjs',
  'src/connection/manager.mjs',
  'src/connection/native-context.mjs',
  'src/connection/native-login.mjs',
  'src/engine.mjs',
  'src/engine/sdp-host-config.mjs',
  'src/engine/sdp-host.mjs',
  'src/learner-support/service.mjs',
  'src/server.mjs',
  'src/vulnerabilities/osv.mjs',
  'src/vulnerabilities/project-scan.mjs',
  'student/engine-adapter.mjs',
  'student/extension.mjs',
  'vendor/NOTICE.md',
  'vendor/clco-http.mjs',
  'docs/ARGOS_PACKAGING_GUIDE.md'
)
$git = Get-Command git -CommandType Application -ErrorAction Stop | Select-Object -First 1
$sourceCommit = (& $git.Source -C $appRoot rev-parse HEAD | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or $sourceCommit -notmatch '^[a-f0-9]{40}$') { throw 'Cannot resolve source commit.' }
$changes = (& $git.Source -C $appRoot status --porcelain --untracked-files=normal | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or $changes) { throw 'Source folder is not clean. Do not package uncommitted files.' }

New-Item -ItemType Directory -Path $destination -ErrorAction Stop | Out-Null
$records = @()
foreach ($relative in $approvedPaths) {
  $inputFile = Join-Path $appRoot ($relative.Replace('/','\'))
  if (-not (Test-Path -LiteralPath $inputFile -PathType Leaf)) { throw "Approved file is missing: $relative" }
  $file = Get-Item -LiteralPath $inputFile -Force -ErrorAction Stop
  if ($file.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Reparse point rejected: $relative" }
  for ($parent = $file.Directory; $null -ne $parent; $parent = $parent.Parent) {
    if ($parent.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Reparse directory rejected: $relative" }
    if ($parent.FullName.Equals($appRoot,[StringComparison]::OrdinalIgnoreCase)) { break }
  }
  $outputFile = Join-Path (Join-Path $destination 'app') ($relative.Replace('/','\'))
  $outputDir = Split-Path -Parent $outputFile
  New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
  Copy-Item -LiteralPath $inputFile -Destination $outputFile -ErrorAction Stop
  $digest = (Get-FileHash -LiteralPath $outputFile -Algorithm SHA256).Hash.ToLowerInvariant()
  $records += [pscustomobject]@{path=('app/' + $relative);sha256=$digest}
}

$launcherSource = Join-Path $appRoot 'packaging\windows\launch-argos.ps1'
if (-not (Test-Path -LiteralPath $launcherSource -PathType Leaf)) { throw 'Installed-app launcher missing.' }
$launcherInfo = Get-Item -LiteralPath $launcherSource -Force
if ($launcherInfo.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Launcher reparse point rejected.' }
$launcherRelative = 'launcher/launch-argos.ps1'
$launcherDestination = Join-Path $destination 'launcher\launch-argos.ps1'
New-Item -ItemType Directory -Path (Split-Path -Parent $launcherDestination) -Force | Out-Null
Copy-Item -LiteralPath $launcherSource -Destination $launcherDestination
$records += [pscustomobject]@{
  path=$launcherRelative
  sha256=(Get-FileHash -LiteralPath $launcherDestination -Algorithm SHA256).Hash.ToLowerInvariant()
}
$manifest = [ordered]@{
  schema='argos.basic-package.v1'
  origin='committed-source-only'
  sourceCommit=$sourceCommit
  builtAtUtc=[DateTime]::UtcNow.ToString('o')
  files=@($records)
}
$manifestPath = Join-Path $destination 'PACKAGE_MANIFEST.json'
$manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $manifestPath -Encoding UTF8

$verifier = Join-Path $appRoot 'packaging\verify-package.ps1'
& $verifier -PackageRoot $destination
if (-not $?) { throw 'Basic package verification failed.' }
Write-Host "BASIC_PACKAGE_READY=$destination"
Write-Host "SOURCE_COMMIT=$sourceCommit"
Write-Host "PACKAGED_FILES=$($records.Count)"
Write-Host 'This is an unsigned Node.js-dependent package, not a tested installer.'
