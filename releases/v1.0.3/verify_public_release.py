#!/usr/bin/env python3
"""Verify signed 9192 public release artifacts with SHA-256 and OpenSSL."""

import argparse
import hashlib
import subprocess
import sys
from pathlib import Path


def sha256_file(path):
    digest = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def parse_checksums(path):
    entries = []
    for raw in path.read_text(encoding="ascii").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        expected, rel = line.split(None, 1)
        entries.append((expected.lower(), rel.strip()))
    return entries


def verify_checksums(base, checksum_path):
    failed = []
    for expected, rel in parse_checksums(checksum_path):
        candidate = base / rel
        if not candidate.is_file():
            failed.append(f"missing:{rel}")
            continue
        actual = sha256_file(candidate)
        if actual != expected:
            failed.append(f"hash:{rel}:expected={expected}:actual={actual}")
    return failed


def verify_signature(openssl, checksum_path, signature_path, public_key_path):
    cmd = [
        openssl,
        "pkeyutl",
        "-verify",
        "-pubin",
        "-inkey",
        str(public_key_path),
        "-sigfile",
        str(signature_path),
        "-rawin",
        "-in",
        str(checksum_path),
    ]
    completed = subprocess.run(cmd, text=True, capture_output=True, check=False)
    if completed.returncode:
        raise RuntimeError((completed.stderr or completed.stdout or "OpenSSL signature verification failed").strip())


def main():
    parser = argparse.ArgumentParser(description="Verify detached 9192 public release checksums and signature.")
    parser.add_argument("--artifact-dir", default=".", help="Directory containing release_artifacts.sha256.")
    parser.add_argument("--openssl", default="openssl", help="OpenSSL executable path.")
    parser.add_argument("--public-key", default="", help="Release signing public PEM path.")
    args = parser.parse_args()

    artifact_dir = Path(args.artifact_dir).resolve()
    checksums = artifact_dir / "release_artifacts.sha256"
    signature = artifact_dir / "release_artifacts.sha256.sig"
    public_key = Path(args.public_key).resolve() if args.public_key else artifact_dir / "9192_release_signing_public.pem"
    for path in (checksums, signature, public_key):
        if not path.is_file():
            raise RuntimeError(f"required verification file missing: {path}")

    verify_signature(args.openssl, checksums, signature, public_key)
    failed = verify_checksums(artifact_dir, checksums)
    if failed:
        raise RuntimeError("; ".join(failed))
    print("9192_public_release_signature=OK")
    print(f"artifact_dir={artifact_dir}")
    print(f"artifacts={len(parse_checksums(checksums))}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"9192_public_release_verify_error={exc}", file=sys.stderr)
        sys.exit(1)
