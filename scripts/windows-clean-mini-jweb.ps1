$ErrorActionPreference = "SilentlyContinue"
$CurrentGoodVersion = "0.1.5"
$currentGoodInstallLocations = @()

$processNames = @(
  "Mini J-Web EX",
  "Mini J-Web EX Windows"
)

foreach ($name in $processNames) {
  Get-Process -Name $name | Stop-Process -Force
}

$uninstallRoots = @(
  "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall",
  "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall",
  "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"
)

foreach ($root in $uninstallRoots) {
  if (-not (Test-Path $root)) {
    continue
  }

  Get-ChildItem $root | ForEach-Object {
    $entry = Get-ItemProperty $_.PsPath
    if ($entry.DisplayName -like "Mini J-Web EX*") {
      if ($entry.DisplayVersion -eq $CurrentGoodVersion) {
        Write-Host "Keeping current version: $($entry.DisplayName) $($entry.DisplayVersion)"
        if ($entry.InstallLocation) {
          $currentGoodInstallLocations += $entry.InstallLocation.TrimEnd("\")
        }
        return
      }
      Write-Host "Removing uninstall entry: $($entry.DisplayName)"
      Remove-Item $_.PsPath -Recurse -Force
    }
  }
}

$paths = @(
  "$env:LOCALAPPDATA\Programs\mini-jweb-ex",
  "$env:LOCALAPPDATA\Programs\Mini J-Web EX",
  "$env:LOCALAPPDATA\Programs\Mini J-Web EX Windows",
  "$env:APPDATA\Mini J-Web EX",
  "$env:APPDATA\Mini J-Web EX Windows"
)

foreach ($path in $paths) {
  if (Test-Path $path) {
    if ($currentGoodInstallLocations -contains $path.TrimEnd("\")) {
      Write-Host "Keeping current install folder: $path"
      continue
    }
    Write-Host "Removing folder: $path"
    Remove-Item $path -Recurse -Force
  }
}

Write-Host ""
Write-Host "Mini J-Web stale Windows install cleanup completed."
Write-Host "Open Settings > Apps again to confirm the old entries are gone."
