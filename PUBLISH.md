# External Publication

This folder is the intentionally small public distribution surface for 9192.
It omits backend source, ledgers, TLS private keys, payment observer secrets, and registry private keys.

When GitHub CLI authentication and a Git author identity are available:

~~~powershell
git init -b main
git add .
git commit -m 'Publish 9192 public client kit v1.0.4'
gh auth login
gh repo create <github-owner>/9192-public --public --source . --remote origin --push
gh release create v1.0.4 .\releases\v1.0.4\9192_public_client_kit_v1.0.4.zip .\releases\v1.0.4\release_artifacts.sha256 .\releases\v1.0.4\release_artifacts.sha256.sig .\releases\v1.0.4\9192_release_signing_public.pem --title '9192 public client kit v1.0.4' --notes-file .\releases\v1.0.4\RELEASE.md
~~~

The remote MCP Registry entry already exists as br.com.nineoneninetwo/9192.
OCI images are published by GitHub Actions on release tags:

~~~powershell
docker pull ghcr.io/nublos-9192/9192-public:v1.0.4
docker pull ghcr.io/nublos-9192/9192-public-probe:v1.0.4
docker run --rm ghcr.io/nublos-9192/9192-public-probe:v1.0.4
~~~

The stdio MCP bridge image is built from Dockerfile. The probe image is built from Dockerfile.probe and runs a discovery bootstrap smoke against the public domain.

Public npm packages:

~~~powershell
npm view @nineoneninetwo/discovery version
npm view @nineoneninetwo/client version
npm view @nineoneninetwo/mcp version
npm view @nineoneninetwo/demo version
~~~
