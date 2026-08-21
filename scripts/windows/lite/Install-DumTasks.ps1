[CmdletBinding()]
param(
  [Parameter(Mandatory)] [string] $NodePath,
  [Parameter(Mandatory)] [string] $ReleaseDirectory,
  [Parameter(Mandatory)] [string] $DatabasePath,
  [Parameter(Mandatory)] [string] $AuthSecret,
  [Parameter(Mandatory)] [string] $PublicBaseUrl,
  [Parameter(Mandatory)] [string] $BackupTarget,
  [Parameter(Mandatory)] [string] $GpgPath,
  [Parameter(Mandatory)] [string] $GpgPublicKeyPath,
  [Parameter(Mandatory)] [string] $GpgRecipient,
  [int] $Port = 3210
)

$ErrorActionPreference = 'Stop'
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw 'administrator_required'
}

$root = $PSScriptRoot
$configDirectory = 'C:\ProgramData\DumBarbershop\config'
$configPath = Join-Path $configDirectory 'runtime.json'
$runtimeDirectory = 'C:\ProgramData\DumBarbershop\scripts'
$keyDirectory = 'C:\ProgramData\DumBarbershop\keys'
$keyring = Join-Path $keyDirectory 'backup-public.gpg'
$databaseDirectory = Split-Path -LiteralPath $DatabasePath -Parent
if (!(Test-Path -LiteralPath $databaseDirectory -PathType Container)) { throw 'database_directory_not_found' }
if (!(Test-Path -LiteralPath $GpgPath -PathType Leaf)) { throw 'gpg_not_found' }
if (!(Test-Path -LiteralPath $GpgPublicKeyPath -PathType Leaf)) { throw 'gpg_public_key_not_found' }
New-Item -ItemType Directory -Path $configDirectory -Force | Out-Null
New-Item -ItemType Directory -Path $runtimeDirectory -Force | Out-Null
New-Item -ItemType Directory -Path $keyDirectory -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $root 'Start-DumApp.ps1') -Destination (Join-Path $runtimeDirectory 'Start-DumApp.ps1') -Force
Copy-Item -LiteralPath (Join-Path $root 'Backup-DumDatabase.ps1') -Destination (Join-Path $runtimeDirectory 'Backup-DumDatabase.ps1') -Force
@{
  NodePath = $NodePath; ReleaseDirectory = $ReleaseDirectory; DatabasePath = $DatabasePath
  AuthSecret = $AuthSecret; PublicBaseUrl = $PublicBaseUrl; BackupTarget = $BackupTarget
  GpgPath = $GpgPath; GpgKeyring = $keyring; GpgRecipient = $GpgRecipient; Port = $Port
} | ConvertTo-Json | Set-Content -LiteralPath $configPath -Encoding utf8
& $GpgPath --batch --yes --no-default-keyring --keyring $keyring --import $GpgPublicKeyPath
if ($LASTEXITCODE -ne 0) { throw 'gpg_public_key_import_failed' }
& icacls.exe $configDirectory /inheritance:r /grant:r 'SYSTEM:(OI)(CI)F' 'Administrators:(OI)(CI)F' | Out-Null
& icacls.exe $runtimeDirectory /inheritance:r /grant:r 'SYSTEM:(OI)(CI)RX' 'Administrators:(OI)(CI)F' | Out-Null
& icacls.exe $keyDirectory /inheritance:r /grant:r 'SYSTEM:(OI)(CI)RX' 'Administrators:(OI)(CI)F' | Out-Null
& icacls.exe $databaseDirectory /grant 'SYSTEM:(OI)(CI)M' | Out-Null

$shell = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
$appArgs = "-NoProfile -ExecutionPolicy Bypass -File `"$(Join-Path $runtimeDirectory 'Start-DumApp.ps1')`" -ConfigPath `"$configPath`""
$backupArgs = "-NoProfile -ExecutionPolicy Bypass -File `"$(Join-Path $runtimeDirectory 'Backup-DumDatabase.ps1')`" -ConfigPath `"$configPath`""

$system = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
$appAction = New-ScheduledTaskAction -Execute $shell -Argument $appArgs
$appTrigger = New-ScheduledTaskTrigger -AtStartup
$appSettings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -StartWhenAvailable
Register-ScheduledTask -TaskName 'DUM Barber App' -Action $appAction -Trigger $appTrigger -Principal $system -Settings $appSettings -Force | Out-Null

$backupAction = New-ScheduledTaskAction -Execute $shell -Argument $backupArgs
$backupTrigger = New-ScheduledTaskTrigger -Daily -At 2:30am
$backupSettings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Hours 1) -StartWhenAvailable
Register-ScheduledTask -TaskName 'DUM Barber Daily Backup' -Action $backupAction -Trigger $backupTrigger -Principal $system -Settings $backupSettings -Force | Out-Null
Start-ScheduledTask -TaskName 'DUM Barber App'
