# 9192 Release Trust

Current public release: v1.0.5.

The public release signing key lives at `trust/9192_release_signing_public.pem`
and is mirrored at:

```text
https://nineoneninetwo.com.br/.well-known/9192/9192_release_signing_public.pem
```

A release directory contains:

- `release_artifacts.sha256`
- `release_artifacts.sha256.sig`
- `9192_release_signing_public.pem`
- `verify_public_release.py`

Verify detached signatures before trusting the release archive. The signed
checksum file covers the archive; the archive has per-file checksums inside it.

Recommended verification:

```powershell
python .\releases\v1.0.5\verify_public_release.py --artifact-dir .\releases\v1.0.5 --openssl openssl
```

The DNS TXT record `_9192-manifest.nineoneninetwo.com.br` anchors the SHA256 of
the published manifest. Clients should compare that TXT value with the bytes of
`/.well-known/9192/9192_public_manifest.json`.
