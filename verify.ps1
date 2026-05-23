$ErrorActionPreference = "Stop"
$Machine = "verify_probe_$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"
.\bin\windows-x64\9192_public_client_cli.exe hello --host edge.nineoneninetwo.com.br --port 9443 --sni edge.nineoneninetwo.com.br
.\bin\windows-x64\9192_public_client_cli.exe caps --host edge.nineoneninetwo.com.br --port 9443 --sni edge.nineoneninetwo.com.br
.\bin\windows-x64\9192_public_client_cli.exe quote-get-pulse --machine $Machine --bits 65536 --max-output 8192 --host edge.nineoneninetwo.com.br --port 9443 --sni edge.nineoneninetwo.com.br
if ($LASTEXITCODE -ne 0) { throw "quote-get-pulse failed with $LASTEXITCODE" }
Write-Host "verify_9192_public_client=OK"
