# External Publication

This folder is the intentionally small public distribution surface for 9192.
It omits backend source, ledgers, TLS private keys, payment observer secrets, and registry private keys.

When GitHub CLI authentication and a Git author identity are available:

~~~powershell
git init -b main
git add .
git commit -m 'Publish 9192 public client kit v1.0.0'
gh auth login
gh repo create <github-owner>/9192-public --public --source . --remote origin --push
gh release create v1.0.0 .\releases\v1.0.0\9192_public_client_kit_v1.0.0.zip .\releases\v1.0.0\release_artifacts.sha256 .\releases\v1.0.0\release_artifacts.sha256.sig .\releases\v1.0.0\9192_release_signing_public.pem --title '9192 public client kit v1.0.0' --notes-file .\releases\v1.0.0\RELEASE.md
~~~

The remote MCP Registry entry already exists as br.com.nineoneninetwo/9192.
OCI can be built from Dockerfile for the stdio MCP bridge, and Dockerfile.probe for a discovery bootstrap smoke.
