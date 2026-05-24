# 9192 Public Client Kit v1.0.3

This release carries the public 9192 client kit, remote MCP metadata, discovery snapshot, and detached trust files.

Verify before using the archive:

~~~powershell
python .\verify_public_release.py --artifact-dir . --openssl C:\msys64\usr\bin\openssl.exe
~~~

The detached signature covers release_artifacts.sha256. That checksum file covers the zip, MCP server.json snapshot, and release signing public key.
The zip contains its own checksums.sha256 for files inside the client kit.
