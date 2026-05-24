# 9192 Public Client Kit

9192 is a public machine-to-machine compute service and verifiable execution protocol for autonomous machines.

Official domain: https://nineoneninetwo.com.br/
GitHub repository: https://github.com/Nublos-9192/9192-public
Public edge: edge.nineoneninetwo.com.br:9443
Protocol: 9192/1
Transport: TLS TCP
Settlement: crypto_only
Price book: competitive_v6
Price version: 9192C_REF_USD_WORK_V6

9192C is an internal accounting and pricing reference unit. It is not a token, currency, stablecoin, security, stored value, investment product, redeemable asset, parity, backing, redemption, yield, or a financial promise.

## Quick Start

On Windows PowerShell:

~~~powershell
.\bin\windows-x64\9192_public_client_cli.exe hello --host edge.nineoneninetwo.com.br --port 9443 --sni edge.nineoneninetwo.com.br
.\bin\windows-x64\9192_public_client_cli.exe caps --host edge.nineoneninetwo.com.br --port 9443 --sni edge.nineoneninetwo.com.br
.\bin\windows-x64\9192_public_client_cli.exe payment-info --machine client_probe --host edge.nineoneninetwo.com.br --port 9443 --sni edge.nineoneninetwo.com.br
.\bin\windows-x64\9192_public_client_cli.exe quote-get-pulse --machine client_probe --bits 65536 --max-output 8192 --host edge.nineoneninetwo.com.br --port 9443 --sni edge.nineoneninetwo.com.br
~~~

Discovery-first bootstrap:

~~~powershell
python .\examples\9192_external_bootstrap_client.py --domain nineoneninetwo.com.br --machine client_probe --report 9192_bootstrap_report.json
~~~

HTTP API facade smoke:

~~~powershell
python .\examples\9192_public_api_client.py smoke
~~~

Free sandbox flow:

~~~powershell
python .\examples\9192_public_api_client.py sandbox
~~~

Node.js package smoke:

~~~powershell
npx @nineoneninetwo/demo smoke
npx @nineoneninetwo/demo sandbox
~~~

OCI/GHCR probes:

~~~powershell
docker run --rm ghcr.io/nublos-9192/9192-public-probe:v1.0.4
docker run --rm ghcr.io/nublos-9192/9192-public-probe:latest
~~~

Create a funding invoice:

~~~powershell
python .\examples\9192_public_api_client.py invoice --machine first_client --units 100000 --network TRON --asset USDT
~~~

The API is a JSON facade at https://nineoneninetwo.com.br/api/v1/. The native 9192 product edge remains edge.nineoneninetwo.com.br:9443.
Quotes, settlement state, execution and receipts stay inside 9192; the facade exposes a
whitelisted HTTP path for external clients that do not start with the binary protocol.

## What A Client Does

1. Resolve TXT _9192.nineoneninetwo.com.br.
2. Fetch https://nineoneninetwo.com.br/.well-known/9192/.
3. Validate the manifest hash from _9192-manifest.nineoneninetwo.com.br.
4. Connect to edge.nineoneninetwo.com.br:9443 over TLS.
5. Run HELLO/CAPS/PAYMENT_INFO.
6. Request QUOTE.
7. Fund account through one of the published crypto rails.
8. ACCEPT_QUOTE.
9. Execute service.
10. GET_RECEIPT and VERIFY_RECEIPT.

## Included

- Windows CLI: bin/windows-x64/9192_public_client_cli.exe
- Python bootstrap clients: examples/
- Public discovery documents: discovery/
- Public site/discovery surface snapshot: site/
- MCP bridge adapter over the public HTTPS API: mcp-bridge/
- JS packages for discovery/client/MCP/demo: packages/js/
- C++ CLI package metadata: packages/cpp/cli/
- Remote MCP endpoint: https://nineoneninetwo.com.br/mcp
- Published npm packages: @nineoneninetwo/discovery, @nineoneninetwo/client, @nineoneninetwo/mcp, @nineoneninetwo/demo
- OCI images: ghcr.io/nublos-9192/9192-public and ghcr.io/nublos-9192/9192-public-probe
- Checksums: checksums.sha256

## Published Artifacts

- GitHub release: https://github.com/Nublos-9192/9192-public/releases/tag/v1.0.4
- Client kit zip: https://github.com/Nublos-9192/9192-public/releases/download/v1.0.4/9192_public_client_kit_v1.0.4.zip
- npm discovery: https://www.npmjs.com/package/@nineoneninetwo/discovery
- npm client: https://www.npmjs.com/package/@nineoneninetwo/client
- npm MCP bridge: https://www.npmjs.com/package/@nineoneninetwo/mcp
- npm demo: https://www.npmjs.com/package/@nineoneninetwo/demo
- OCI MCP image: ghcr.io/nublos-9192/9192-public:v1.0.4
- OCI probe image: ghcr.io/nublos-9192/9192-public-probe:v1.0.4

## Public Discovery

- https://nineoneninetwo.com.br/
- https://nineoneninetwo.com.br/docs
- https://nineoneninetwo.com.br/protocol
- https://nineoneninetwo.com.br/for-agents
- https://nineoneninetwo.com.br/pricing
- https://nineoneninetwo.com.br/status
- https://nineoneninetwo.com.br/trust
- https://nineoneninetwo.com.br/llms.txt
- https://nineoneninetwo.com.br/openapi.json
- https://nineoneninetwo.com.br/.well-known/agent-card.json
- https://nineoneninetwo.com.br/.well-known/webfinger?resource=9192:nineoneninetwo.com.br
- https://nineoneninetwo.com.br/.well-known/9192/9192_public_manifest.json
