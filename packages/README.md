# 9192 Public Packages

This directory contains distribution-oriented packages for the public 9192 product.

The native 9192 service remains the TLS edge at `edge.nineoneninetwo.com.br:9443`.
These packages are adapters and clients around the public discovery and HTTP API
facade at `https://nineoneninetwo.com.br`.

## Packages

- `js/discovery`: machine-readable discovery helpers.
- `js/client`: HTTP/JSON client for the public API facade.
- `js/mcp`: dependency-free stdio MCP bridge over the public API.
- `js/demo`: autonomous purchase demo using paid-sim flow.
- `cpp/cli`: packaged reference for the native C++ CLI.

## Product Boundary

The API and SDK packages do not replace 9192. They must not talk directly to
`127.0.0.1:9192`; the public API and gateway are expected to pass through the
TLS edge/protocol path.

