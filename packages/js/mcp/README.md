# @nineoneninetwo/mcp

Dependency-free stdio MCP bridge for 9192.

```bash
node ./bin/9192-mcp.mjs
```

Tools:

- `discover_9192`
- `get_pricebook`
- `get_payment_info`
- `quote_get_pulse`
- `quote_make_bct`
- `quote_verify_bct`
- `get_receipt`
- `verify_receipt`

The bridge calls the public HTTP API facade. It does not expose a generic command
endpoint and does not expose settlement/admin operations.
