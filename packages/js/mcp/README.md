# @nineoneninetwo/mcp

Dependency-free stdio MCP bridge for 9192.

Version: 1.0.5
License: Apache-2.0

```bash
npx @nineoneninetwo/mcp
```

Tools:

- `discover_9192`
- `get_pricebook`
- `get_payment_info`
- `quote_get_pulse`
- `quote_make_bct`
- `quote_verify_bct`
- `verify_receipt`

The bridge calls the public HTTP API facade. It does not expose a generic command
endpoint, reserved receipt fetch, or settlement/admin operations.
