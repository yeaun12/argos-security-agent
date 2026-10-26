# Checks accidental package corruption and source-scope violations.
# SHA-256 is NOT a digital signature and does not authenticate a publisher.
[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$PackageRoot)
Set-StrictMode -Version 3
$ErrorActionPreference = 'Stop'
if (-not [IO.Path]::IsPathRooted($PackageRoot)) { throw 'PackageRoot must be an absolute path.' }
$root = [IO.Path]::GetFullPath($PackageRoot).TrimEnd('\')
if (-not (Test-Path -LiteralPath $root -PathType Container)) { throw "Package folder missing: $root" }
$manifestFile = Join-Path $root 'PACKAGE_MANIFEST.json'
if (-not (Test-Path -LiteralPath $manifestFile -PathType Leaf)) { throw 'PACKAGE_MANIFEST.json is missing.' }
$manifest = Get-Content -LiteralPath $manifestFile -Raw -Encoding UTF8 | ConvertFrom-Json
if ($manifest.schema -cne 'argos.basic-package.v1' -or
    $manifest.origin -cne 'committed-source-only' -or
    $manifest.sourceCommit -notmatch '^[a-f0-9]{40}$' -or
    -not ($manifest.files -is [array]) -or $manifest.files.Count -lt 10) {
  throw 'Package manifest is invalid.'
}
$expected = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
[void]$expected.Add('PACKAGE_MANIFEST.json')
foreach ($entry in $manifest.files) {
  if (-not ($entry.path -is [string]) -or -not ($entry.sha256 -is [string]) -or
      $entry.sha256 -cnotmatch '^[a-f0-9]{64}$') { throw 'Invalid manifest entry.' }
  $relative = $entry.path
  if ($relative -notmatch '^(app/[a-zA-Z0-9._/-]+|launcher/launch-argos\.ps1)$' -or
      @($relative.Split('/') | Where-Object { $_ -eq '..' -or $_ -eq '.' -or $_ -eq '' }).Count -gt 0) {
    throw "Rejected package path: $relative"
  }
  if (-not $expected.Add($relative)) { throw "Duplicate path: $relative" }
  $full = [IO.Path]::GetFullPath((Join-Path $root ($relative.Replace('/','\'))))
  if (-not $full.StartsWith($root + '\',[StringComparison]::OrdinalIgnoreCase)) {
    throw "Package path escaped root: $relative"
  }
  if (-not (Test-Path -LiteralPath $full -PathType Leaf)) { throw "Missing file: $relative" }
  $item = Get-Item -LiteralPath $full -Force
  if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Link rejected: $relative" }
  if (((Get-FileHash -LiteralPath $full -Algorithm SHA256).Hash.ToLowerInvariant()) -cne $entry.sha256) {
    throw "Checksum mismatch: $relative"
  }
}
$required = @(
 'app/package.json',
 'app/src/server.mjs',
 'app/student/extension.mjs',
 'app/public/index.html',
 'app/vendor/clco-http.mjs',
 'app/docs/ARGOS_PACKAGING_GUIDE.md',
 'launcher/launch-argos.ps1'
)
foreach ($name in $required) {
  if (-not $expected.Contains($name)) { throw "Required file missing from manifest: $name" }
}
# Reject unlisted extras, folders linked outside the package, and likely sensitive material.
$directories = @(Get-Item -LiteralPath $root) + @(Get-ChildItem -LiteralPath $root -Directory -Recurse -Force)
foreach ($dir in $directories) {
  if ($dir.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Linked directory rejected: $($dir.FullName)" }
}
$observed = @(Get-ChildItem -LiteralPath $root -Recurse -Force -File)
foreach ($file in $observed) {
  if ($file.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Linked file rejected: $($file.FullName)" }
  $relative = $file.FullName.Substring($root.Length + 1).Replace('\','/')
  if (-not $expected.Contains($relative)) { throw "Unlisted file found: $relative" }
  if ($relative -match '(?i)(^|/)(\.env($|\.)|node_modules|\.git|.*\.(key|pem|pfx|p12|crt|cer)$|native\.json|sdp.*\.json)') {
    throw "Prohibited material: $relative"
  }
}
if ($observed.Count -ne $expected.Count) { throw 'Package file count differs from manifest.' }
Write-Host "PACKAGE_VERIFY_PASS files=$($manifest.files.Count) sourceCommit=$($manifest.sourceCommit)"
Write-Host 'Note: checksums detect changes only; this is not an authenticity or malware attestation.'
