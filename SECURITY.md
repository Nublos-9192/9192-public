# Security

Report security issues privately before public disclosure.

Primary contact:

- GitHub security advisories for this repository when available.
- If advisories are unavailable, open a minimal GitHub issue asking for a
  private security contact without publishing exploit details.

Public surfaces in scope:

- `https://nineoneninetwo.com.br`
- `https://nineoneninetwo.com.br/api/v1/*`
- `https://nineoneninetwo.com.br/mcp`
- `edge.nineoneninetwo.com.br:9443`
- Published SDKs, examples, Dockerfiles, release metadata, checksums, and MCP
  adapters in this repository.

Do not perform destructive tests, denial-of-service tests, credential guessing,
payment fraud attempts, chain-spam tests, or attempts to access private local
operator files. Use the free sandbox flow for normal verification.

This public repository intentionally excludes backend source, local ledgers,
payment observer secrets, TLS private keys, registry private keys, and operator
wallet secrets.

Expected disclosure flow:

1. Send a private report with impact, affected surface, reproduction steps, and
   any relevant logs.
2. Allow a reasonable remediation window before public disclosure.
3. Coordinate public notes only after the fix or mitigation is available.
