[CmdletBinding()]
param(
  [Parameter(Mandatory)] [string] $EncryptedBackup,
  [Parameter(Mandatory)] [string] $RestoreDirectory,
  [Parameter(Mandatory)] [string] $GpgPath
)

$ErrorActionPreference = 'Stop'
if (!(Test-Path -LiteralPath $EncryptedBackup -PathType Leaf)) { throw 'backup_not_found' }
if (!(Test-Path -LiteralPath $GpgPath -PathType Leaf)) { throw 'gpg_not_found' }
if (Test-Path -LiteralPath $RestoreDirectory) { throw 'restore_directory_already_exists' }

$zip = Join-Path ([System.IO.Path]::GetTempPath()) ("dum-restore-" + [guid]::NewGuid().ToString() + '.zip')
try {
  & $GpgPath --batch --yes --decrypt --output $zip $EncryptedBackup
  if ($LASTEXITCODE -ne 0) { throw 'backup_decryption_failed' }
  New-Item -ItemType Directory -Path $RestoreDirectory -Force | Out-Null
  Expand-Archive -LiteralPath $zip -DestinationPath $RestoreDirectory -Force
  if (!(Get-ChildItem -LiteralPath $RestoreDirectory -Filter '*.sqlite' -File)) { throw 'restore_database_missing' }
} catch {
  Remove-Item -LiteralPath $RestoreDirectory -Recurse -Force -ErrorAction SilentlyContinue
  throw
} finally {
  Remove-Item -LiteralPath $zip -Force -ErrorAction SilentlyContinue
}
