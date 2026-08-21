[CmdletBinding()]
param([Parameter(Mandatory)] [string] $ConfigPath)

$ErrorActionPreference = 'Stop'
$config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
$databasePath = $config.DatabasePath
$backupTarget = $config.BackupTarget
$gpgPath = $config.GpgPath
$gpgKeyring = $config.GpgKeyring
$recipient = $config.GpgRecipient
$appTaskName = 'DUM Barber App'
if (!(Test-Path -LiteralPath $databasePath -PathType Leaf)) { throw 'database_not_found' }
if (!(Test-Path -LiteralPath $backupTarget -PathType Container)) { throw 'backup_target_not_found' }
if (!(Test-Path -LiteralPath $gpgPath -PathType Leaf)) { throw 'gpg_not_found' }
if (!(Test-Path -LiteralPath $gpgKeyring -PathType Leaf)) { throw 'gpg_keyring_not_found' }

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$work = Join-Path ([System.IO.Path]::GetTempPath()) "dum-backup-$stamp"
$zip = Join-Path ([System.IO.Path]::GetTempPath()) "dum-backup-$stamp.zip"
$output = Join-Path $backupTarget "dum-backup-$stamp.zip.gpg"
New-Item -ItemType Directory -Path $work -Force | Out-Null

try {
  # A stopped app gives a consistent SQLite + WAL copy without a second DB service.
  Stop-ScheduledTask -TaskName $AppTaskName -ErrorAction Stop
  Start-Sleep -Seconds 2
  foreach ($suffix in @('', '-wal', '-shm')) {
    $source = "$databasePath$suffix"
    if (Test-Path -LiteralPath $source -PathType Leaf) {
      Copy-Item -LiteralPath $source -Destination (Join-Path $work ([System.IO.Path]::GetFileName($source))) -Force
    }
  }
  Start-ScheduledTask -TaskName $AppTaskName -ErrorAction Stop

  Compress-Archive -Path (Join-Path $work '*') -DestinationPath $zip -CompressionLevel Optimal -Force
  & $gpgPath --batch --yes --no-default-keyring --keyring $gpgKeyring --trust-model always --encrypt --recipient $recipient --output $output $zip
  if ($LASTEXITCODE -ne 0 -or !(Test-Path -LiteralPath $output -PathType Leaf)) { throw 'backup_encryption_failed' }

  Get-ChildItem -LiteralPath $backupTarget -Filter 'dum-backup-*.zip.gpg' -File |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-28) } |
    Remove-Item -Force
} finally {
  if (Get-ScheduledTask -TaskName $AppTaskName -ErrorAction SilentlyContinue) {
    if ((Get-ScheduledTask -TaskName $AppTaskName).State -ne 'Running') {
      Start-ScheduledTask -TaskName $AppTaskName -ErrorAction SilentlyContinue
    }
  }
  Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $zip -Force -ErrorAction SilentlyContinue
}
