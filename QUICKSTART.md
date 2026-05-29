# 9192 Quickstart

The recommended external path is the free sandbox:

```powershell
npx @nineoneninetwo/demo --mode sandbox
```

That single command runs:

```text
Discover -> Quote -> Accept -> Execute -> Receipt -> Verify
```

It does not fund an account and does not execute paid work.

## Native CLI

```powershell
.\bin\windows-x64\9192_public_client_cli.exe hello --host edge.nineoneninetwo.com.br --port 9443 --sni edge.nineoneninetwo.com.br
.\bin\windows-x64\9192_public_client_cli.exe caps --host edge.nineoneninetwo.com.br --port 9443 --sni edge.nineoneninetwo.com.br
.\bin\windows-x64\9192_public_client_cli.exe quote-get-pulse --machine quickstart_machine --bits 65536 --max-output 8192 --host edge.nineoneninetwo.com.br --port 9443 --sni edge.nineoneninetwo.com.br
```

Expected result: `quote_status=0`.

## HTTP API Facade Smoke

```powershell
python .\examples\9192_public_api_client.py smoke
```

## Agent Runner Smoke

```powershell
npx @nineoneninetwo/demo --mode smoke
```

## Funding Invoice Example

```powershell
python .\examples\9192_public_api_client.py invoice --machine quickstart_machine --units 100000 --network TRON --asset USDT
```

## Discovery-First Smoke

```powershell
python .\examples\9192_external_bootstrap_client.py --domain nineoneninetwo.com.br --machine quickstart_machine --report quickstart_report.json
```

## Operator-Only Local Simulation

The demo has a local operator mode that requires the private Windows runtime:

```text
npx @nineoneninetwo/demo --mode paid-sim --local-root C:\9192_system
```

Use it only for local operator validation, not as the public customer path.
