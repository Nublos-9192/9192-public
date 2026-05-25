# 9192 Quickstart

Run from this directory:

```powershell
.\bin\windows-x64\9192_public_client_cli.exe hello --host edge.nineoneninetwo.com.br --port 9443 --sni edge.nineoneninetwo.com.br
.\bin\windows-x64\9192_public_client_cli.exe caps --host edge.nineoneninetwo.com.br --port 9443 --sni edge.nineoneninetwo.com.br
.\bin\windows-x64\9192_public_client_cli.exe quote-get-pulse --machine quickstart_machine --bits 65536 --max-output 8192 --host edge.nineoneninetwo.com.br --port 9443 --sni edge.nineoneninetwo.com.br
```

Expected result: `quote_status=0`.

HTTP API facade smoke:

```powershell
python .\examples\9192_public_api_client.py smoke
```

Agent runner smoke:

```powershell
npx @nineoneninetwo/demo --mode smoke
```

Free sandbox flow:

```powershell
npx @nineoneninetwo/demo --mode sandbox
```

Funding invoice example:

```powershell
python .\examples\9192_public_api_client.py invoice --machine quickstart_machine --units 100000 --network TRON --asset USDT
```

For a discovery-first smoke:

```powershell
python .\examples\9192_external_bootstrap_client.py --domain nineoneninetwo.com.br --machine quickstart_machine --report quickstart_report.json
```
