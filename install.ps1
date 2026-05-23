$ErrorActionPreference = "Stop"
Write-Host "9192 public client kit"
Write-Host "Testing public discovery and edge..."
python .\examples\9192_external_bootstrap_client.py --domain nineoneninetwo.com.br --machine install_probe --report install_probe_report.json
Write-Host "install_probe=OK"
