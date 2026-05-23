# 9192 MCP Bridge

This is a separate adapter for clients that understand MCP-style JSON-RPC tool calls.
It does not change the 9192 core server and does not expose the backend directly.

The bridge calls public HTTPS discovery metadata and whitelisted HTTP API routes. The
API route still crosses the native 9192 TLS edge; the bridge does not need a local
9192 build tree or CLI executable.

Tools:

- `discover_9192`
- `get_pricebook`
- `get_payment_info`
- `quote_get_pulse`
- `verify_receipt`

Default target:

- Domain: `nineoneninetwo.com.br`
- Edge: `edge.nineoneninetwo.com.br:9443`
- Remote MCP: `https://nineoneninetwo.com.br/mcp`

Run:

```powershell
python C:\9192_system\9192_mcp_bridge\server.py
```

Boundary:

9192C is an internal quote reference. It is not parity, backing, redemption, yield, or a financial promise.
