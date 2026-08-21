[CmdletBinding()]
param([Parameter(Mandatory)] [string] $ConfigPath)

$ErrorActionPreference = 'Stop'
$config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
$server = Join-Path $config.ReleaseDirectory 'app\server.js'
if (!(Test-Path -LiteralPath $config.NodePath -PathType Leaf)) { throw 'node_not_found' }
if (!(Test-Path -LiteralPath $server -PathType Leaf)) { throw 'standalone_server_not_found' }

$env:NODE_ENV = 'production'
$env:HOSTNAME = '127.0.0.1'
$env:PORT = "$($config.Port)"
$env:DUM_DATABASE_PATH = $config.DatabasePath
$env:BETTER_AUTH_SECRET = $config.AuthSecret
$env:DUM_PUBLIC_BASE_URL = $config.PublicBaseUrl

& $config.NodePath $server
exit $LASTEXITCODE
