# =============================================================================
# install_global.ps1
# Devio AI Agency — Global Skill Manager (Windows PowerShell)
#
# Manages agency-* skills in the Google Antigravity global skills directory
# so they are available across ALL your projects.
#
# Interactive usage (shows menu):
#   .\install_global.ps1
#
# Non-interactive usage (for scripting / CI):
#   .\install_global.ps1 -Install
#   .\install_global.ps1 -Update
#   .\install_global.ps1 -Uninstall
# =============================================================================

param(
  [switch]$Install,
  [switch]$Update,
  [switch]$Uninstall
)

$SkillsSrc = Join-Path $PSScriptRoot ".agent\skills"
$SkillsDst = Join-Path $HOME ".gemini\antigravity\skills"

# =============================================================================
# UI Helpers
# =============================================================================

function Write-Header {
  Write-Host ""
  Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
  Write-Host "║     Devio AI Agency — Global Skill Manager   ║" -ForegroundColor Cyan
  Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "  Source:      $SkillsSrc" -ForegroundColor DarkGray
  Write-Host "  Destination: $SkillsDst" -ForegroundColor DarkGray
  Write-Host ""
}

function Get-InstalledCount {
  $count = 0
  Get-ChildItem -Path $SkillsSrc -Directory -Filter "agency-*" | ForEach-Object {
    $dst = Join-Path $SkillsDst $_.Name
    if (Test-Path $dst) { $count++ }
  }
  return $count
}

function Confirm-Action($prompt) {
  $answer = Read-Host "$prompt [y/N]"
  return ($answer -ieq "y")
}

# =============================================================================
# Actions
# =============================================================================

function Invoke-Install {
  Write-Header
  Write-Host "▸ Installing skills globally..." -ForegroundColor Green

  if (-not (Test-Path $SkillsSrc)) {
    Write-Host "ERROR: Skills source directory not found: $SkillsSrc" -ForegroundColor Red
    exit 1
  }

  New-Item -ItemType Directory -Force -Path $SkillsDst | Out-Null

  $installed = 0; $skipped = 0
  Get-ChildItem -Path $SkillsSrc -Directory -Filter "agency-*" | ForEach-Object {
    $dst = Join-Path $SkillsDst $_.Name

    if (Test-Path $dst) {
      Write-Host "  ⚠  Already installed — skipped: $($_.Name)" -ForegroundColor Yellow
      Write-Host "     Run 'Update' to overwrite existing skills." -ForegroundColor DarkGray
      $skipped++
    } else {
      Copy-Item -Path $_.FullName -Destination $dst -Recurse -Force
      Write-Host "  ✓ Installed: $($_.Name)" -ForegroundColor Green
      $installed++
    }
  }

  Write-Host ""
  Write-Host "✅ Done. $installed installed, $skipped skipped." -ForegroundColor Green
  Write-Host "   Location: $SkillsDst" -ForegroundColor DarkGray
  Write-Host ""
  Write-Host "Note: Workspace skills in .agent/skills/ always take precedence" -ForegroundColor Yellow
  Write-Host "      over global skills when inside this project."
  Write-Host ""
}

function Invoke-Update {
  Write-Header
  Write-Host "▸ Updating (reinstalling) skills globally..." -ForegroundColor Cyan

  if (-not (Test-Path $SkillsSrc)) {
    Write-Host "ERROR: Skills source directory not found: $SkillsSrc" -ForegroundColor Red
    exit 1
  }

  New-Item -ItemType Directory -Force -Path $SkillsDst | Out-Null

  $updated = 0; $fresh = 0
  Get-ChildItem -Path $SkillsSrc -Directory -Filter "agency-*" | ForEach-Object {
    $dst = Join-Path $SkillsDst $_.Name

    if (Test-Path $dst) {
      Remove-Item -Path $dst -Recurse -Force
      Copy-Item -Path $_.FullName -Destination $dst -Recurse -Force
      Write-Host "  ↻ Updated: $($_.Name)" -ForegroundColor Cyan
      $updated++
    } else {
      Copy-Item -Path $_.FullName -Destination $dst -Recurse -Force
      Write-Host "  ✓ Installed (new): $($_.Name)" -ForegroundColor Green
      $fresh++
    }
  }

  Write-Host ""
  Write-Host "✅ Done. $updated updated, $fresh newly installed." -ForegroundColor Green
  Write-Host "   Location: $SkillsDst" -ForegroundColor DarkGray
  Write-Host ""
}

function Invoke-Uninstall {
  Write-Header
  Write-Host "▸ Uninstalling globally installed skills..." -ForegroundColor Red
  Write-Host ""

  $installedCount = Get-InstalledCount

  if ($installedCount -eq 0) {
    Write-Host "No globally installed Devio skills found. Nothing to remove." -ForegroundColor Yellow
    Write-Host ""
    return
  }

  Write-Host "The following skills will be removed from: $SkillsDst" -ForegroundColor DarkGray
  Write-Host ""
  Get-ChildItem -Path $SkillsSrc -Directory -Filter "agency-*" | ForEach-Object {
    $dst = Join-Path $SkillsDst $_.Name
    if (Test-Path $dst) {
      Write-Host "  ✗ $($_.Name)" -ForegroundColor Red
    }
  }
  Write-Host ""

  if (-not (Confirm-Action "Are you sure you want to remove these $installedCount skill(s)?")) {
    Write-Host "Aborted. Nothing was changed." -ForegroundColor Yellow
    Write-Host ""
    return
  }

  $removed = 0
  Get-ChildItem -Path $SkillsSrc -Directory -Filter "agency-*" | ForEach-Object {
    $dst = Join-Path $SkillsDst $_.Name
    if (Test-Path $dst) {
      Remove-Item -Path $dst -Recurse -Force
      Write-Host "  ✗ Removed: $($_.Name)" -ForegroundColor Red
      $removed++
    }
  }

  Write-Host ""
  Write-Host "✅ Uninstalled $removed skill(s)." -ForegroundColor Green
  Write-Host ""
}

# =============================================================================
# Interactive Menu
# =============================================================================

function Show-Menu {
  Write-Header

  $installedCount = Get-InstalledCount
  $totalCount = (Get-ChildItem -Path $SkillsSrc -Directory -Filter "agency-*").Count

  Write-Host "  Status: $installedCount/$totalCount skills currently installed globally." -ForegroundColor DarkGray
  Write-Host ""
  Write-Host "  What would you like to do?" -ForegroundColor White
  Write-Host ""
  Write-Host "  [1] Install   — copy new skills to global directory (skips existing)" -ForegroundColor Green
  Write-Host "  [2] Update    — reinstall all skills, overwriting existing versions"   -ForegroundColor Cyan
  Write-Host "  [3] Uninstall — remove all globally installed Devio skills"            -ForegroundColor Red
  Write-Host "  [4] Exit"
  Write-Host ""

  do {
    $choice = Read-Host "  Enter choice [1-4]"
    switch ($choice) {
      "1" { Invoke-Install;   return }
      "2" { Invoke-Update;    return }
      "3" { Invoke-Uninstall; return }
      "4" { Write-Host ""; Write-Host "Goodbye." -ForegroundColor DarkGray; Write-Host ""; exit 0 }
      default { Write-Host "  Invalid choice. Please enter 1, 2, 3 or 4." -ForegroundColor Yellow }
    }
  } while ($true)
}

# =============================================================================
# Entry Point
# =============================================================================

if ($Install)   { Invoke-Install }
elseif ($Update)     { Invoke-Update }
elseif ($Uninstall)  { Invoke-Uninstall }
else                 { Show-Menu }
