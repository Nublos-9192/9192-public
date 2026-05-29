# 9192 Public Client Kit

9192 is a public machine-to-machine compute service and verifiable execution protocol for autonomous machines.

Official domain: https://nineoneninetwo.com.br/
GitHub repository: https://github.com/Nublos-9192/9192-public
Release kit: v1.0.5
JS packages: 1.0.5
MCP bridge metadata: 1.0.5
Public edge: edge.nineoneninetwo.com.br:9443
Protocol: 9192/1
Transport: TLS TCP
Settlement: crypto_only
Price book: competitive_v6
Price version: 9192C_REF_USD_WORK_V6
License: Apache-2.0

9192C is an internal accounting and pricing reference unit. It is not a token, currency, stablecoin, security, stored value, investment product, redeemable asset, parity, backing, redemption, yield, or a financial promise.

## Quick Start

Recommended first run for external users:

~~~powershell
npx @nineoneninetwo/demo --mode sandbox
~~~

That command discovers 9192, creates a free sandbox quote, accepts it, executes
a test call, and verifies the returned receipt. It does not fund an account or
execute paid work.

The first journey is:

```text
Discover -> Quote -> Accept -> Execute -> Receipt -> Verify
```

Concrete use cases:

- An agent pays for a verifiable execution and stores the receipt.
- A system records a timestamp or event proof for later audit.
- A client verifies a receipt without trusting a private backend directly.

Native CLI advanced path:

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

Free sandbox flow with Python:

~~~powershell
python .\examples\9192_public_api_client.py sandbox
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
- Agent Runner guide: https://nineoneninetwo.com.br/agent
- Checksums: checksums.sha256

## Version Policy

This repository now uses one public release line for the distributed kit:

```text
public kit release = v1.0.5
npm package versions = 1.0.5
MCP server metadata = 1.0.5
Docker tags = v1.0.5 and latest
discovery metadata = 1.0.5
```

Future SDK experiments may use prerelease suffixes, but published public
packages should keep the same release identity across the kit, npm, MCP,
Docker, site, and discovery metadata.

## Maturity

| Surface | Status | Notes |
| --- | --- | --- |
| Discovery metadata | Stable | Well-known, OpenAPI, agent card, llms.txt, sitemap. |
| Free sandbox GET_PULSE | Stable | Safe first run, no funding. |
| Quote creation | Stable | Public quote routes do not spend balance. |
| Paid GET_PULSE execution | Beta | Requires settled machine balance and accepted quote. |
| BCT quote/execution routes | Beta | Public HTTP facade over native protocol frames. |
| Payment proof push | Experimental | Proof claims must be verified on-chain before credit. |
| MCP remote endpoint | Beta | Narrow tool surface only. |
| Stdio MCP bridges | Beta | JS and Python adapters over the public API. |
| GET_RECEIPT over HTTP | Reserved | Public fetch route is not exposed; use receipt verification. |
| Admin/settlement commands | Not public | Not exposed by this kit. |

## MCP Entry Points

| Environment | Recommended path |
| --- | --- |
| Remote-capable MCP client | `https://nineoneninetwo.com.br/mcp` |
| Node stdio client | `npx @nineoneninetwo/mcp` |
| Python stdio client | `python mcp-bridge/server.py` |
| Docker runner | `ghcr.io/nublos-9192/9192-public:v1.0.5` |

The MCP surface is intentionally narrow: discovery, pricebook, payment info,
quotes, sandbox execution, BCT quote helpers, and receipt verification. It does
not expose settlement/admin commands or generic native command execution.

## Native CLI Auditability

The packaged Windows binary is included for practical native protocol testing.
Its release archive is signed and checksummed. Build provenance is tracked in
`packages/cpp/cli/9192-cli-package.json`; the public package does not include
the private backend or operator-only build tree.

## Public Discovery

- https://nineoneninetwo.com.br/
- https://nineoneninetwo.com.br/start
- https://nineoneninetwo.com.br/agent
- https://nineoneninetwo.com.br/.well-known/9192/FIRST_TESTERS.md
- https://nineoneninetwo.com.br/.well-known/9192/PUBLICATION_CHECKLIST.md
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
