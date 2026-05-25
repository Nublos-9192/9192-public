# 9192 Release Trust

The public release signing key lives at trust/9192_release_signing_public.pem and is mirrored at:

https://nineoneninetwo.com.br/.well-known/9192/9192_release_signing_public.pem

A release directory contains:

- release_artifacts.sha256
- release_artifacts.sha256.sig
- 9192_release_signing_public.pem
- verify_public_release.py

Verify detached signatures before trusting the release archive. The signed checksum file covers the archive; the archive has per-file checksums inside it.
