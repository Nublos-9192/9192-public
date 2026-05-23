# Publishing 9192 MCP

The official registry artifact is `server.json`. `registry/server.json` is a copy
included for release consumers.

The registered target is remote MCP:

```text
name: br.com.nineoneninetwo/9192
endpoint: https://nineoneninetwo.com.br/mcp
transport: streamable-http
```

It exposes only:

- `discover_9192`
- `get_pricebook`
- `get_payment_info`
- `quote_get_pulse`
- `verify_receipt`

The remote MCP endpoint is a facade. Paid execution remains on the whitelisted
9192 HTTP API and the native `9192/1` TLS edge.

## Domain Auth

Use domain authentication with the official `mcp-publisher` tool. The gateway
serves a public auth file at:

```text
https://nineoneninetwo.com.br/.well-known/mcp-registry-auth
```

Generate the Ed25519 key and public auth file locally:

```powershell
C:\9192_system\new_9192_mcp_registry_http_auth_windows.ps1
```

The private key remains only in the operator-local secret store and is not part of this public package.
After the auth file is public, log in and publish from `9192_mcp_bridge`:

```powershell
mcp-publisher login http --domain nineoneninetwo.com.br --private-key <ed25519-private-key-hex>
mcp-publisher publish
```

Do not publish a new `server.json` version unless the remote endpoint and public
metadata probes pass.
