# 9192 Public HTTP API

The HTTP API is a public facade for integrations that prefer JSON.

It does not replace the native 9192 edge:

```text
HTTPS API /api/v1 -> TLS edge 127.0.0.1:9443 with edge SNI -> backend 127.0.0.1:9192
```

The API does not calculate prices, settle payments, mint receipts, expose admin commands,
or talk directly to the local backend.
The gateway has its own small 9192 frame client for that TLS edge hop. The public
`9192_public_client_cli.exe` remains a native client for external integrations and
release smoke tests; it is not spawned for each HTTP API request.

External MCP clients can use the remote MCP facade at:

```text
https://nineoneninetwo.com.br/mcp
```

The registered remote MCP surface is intentionally narrow: discovery, pricebook,
payment info, GET_PULSE quotes, and receipt verification.

## Smoke

```powershell
python C:\9192_system\client\9192_public_api_client.py smoke
```

The smoke reads status, pricebook, payment info, HELLO, CAPS, a GET_PULSE quote,
and a MAKE_BCT quote. It creates quotes only; it does not spend balance.

## Funding Invoice

```powershell
python C:\9192_system\client\9192_public_api_client.py invoice --machine client_001 --units 1000000 --network TRON --asset USDT
```

Production invoice pairs are `TRON/USDT`, `Solana/USDC`, `Solana/USDT`, and `Base/USDC`.

## Active Routes

```text
GET  /api/v1/status
GET  /api/v1/discovery
GET  /api/v1/manifest
GET  /api/v1/pricebook
GET  /api/v1/payment-info
GET  /api/v1/hello
GET  /api/v1/caps
GET  /api/v1/health
POST /api/v1/quotes/get-pulse
POST /api/v1/quotes/make-bct
POST /api/v1/quotes/verify-bct
POST /api/v1/quotes/{quote_id}/accept
POST /api/v1/invoices
GET  /api/v1/invoices/{invoice_id}
POST /api/v1/executions/get-pulse
POST /api/v1/executions/make-bct
POST /api/v1/executions/verify-bct
GET  /api/v1/receipts/{receipt_id}
POST /api/v1/receipts/verify
```

BCT execution uses `plain_hex` and `packet_hex` at the JSON boundary so the native
binary container remains byte exact inside the 9192 protocol. BCT quote routes add a
bounded `payload_overhead_bytes` allowance for the key and binary command envelope;
the default is 256 bytes and the API returns both requested and quoted input sizes.
JSON request bodies are capped at 1 MiB in this gateway release.
