# 9192 Public Client Kit v1.0.5

This release makes the first public integration path linear and agent-friendly:

- Start at https://nineoneninetwo.com.br/start.
- Use the short Agent Runner guide at https://nineoneninetwo.com.br/agent.
- Run npx @nineoneninetwo/demo --mode sandbox.
- Create a free sandbox quote, accept it, execute a test call, and verify the receipt.
- Use FIRST_TESTERS.md and PUBLICATION_CHECKLIST.md for the first public showcase.

No funding is required for the sandbox path. Paid execution remains separate and requires an explicit quote plus a funded machine account.

The kit also carries the public CLI, remote MCP metadata, discovery snapshot, JS/C++ package metadata, and detached trust files.

Verify before using the archive:

~~~powershell
python .\verify_public_release.py --artifact-dir . --openssl C:\msys64\usr\bin\openssl.exe
~~~

The detached signature covers release_artifacts.sha256. That checksum file covers the zip, MCP server.json snapshot, and release signing public key.
The zip contains its own checksums.sha256 for files inside the client kit.
