#!/usr/bin/env python3
import argparse
import json
import socket
import ssl
import struct
import sys
import urllib.request

MAGIC = 0x32393139
HEADER = 36
COMMANDS = {"HELLO": 1, "CAPS": 2}


def dns_txt(name):
    try:
        import dns.resolver  # type: ignore

        answers = dns.resolver.resolve(name, "TXT")
        return ["".join(part.decode("utf-8", "replace") for part in r.strings) for r in answers]
    except Exception:
        return []


def parse_txt_record(text):
    out = {}
    for part in text.strip('"').split(";"):
        if "=" in part:
            k, v = part.split("=", 1)
            out[k.strip()] = v.strip()
    return out


def fetch_text(url):
    with urllib.request.urlopen(url, timeout=20) as r:
        return r.read().decode("utf-8", "replace")


def checksum32(data):
    a, b = 1, 0
    for x in data:
        a = (a + x) % 65521
        b = (b + a) % 65521
    return (b << 16) | a


def frame(command, seq):
    base = struct.pack("<IHHIIQQ", MAGIC, 1, HEADER, COMMANDS[command], 0, seq, 0)
    return base + struct.pack("<I", checksum32(base))


def recvn(sock, n):
    out = b""
    while len(out) < n:
        chunk = sock.recv(n - len(out))
        if not chunk:
            raise RuntimeError("connection closed")
        out += chunk
    return out


def read_varint(buf, off):
    value = 0
    shift = 0
    for _ in range(10):
        b = buf[off]
        off += 1
        value |= (b & 0x7F) << shift
        if not (b & 0x80):
            return value, off
        shift += 7
    raise RuntimeError("invalid varint")


def parse_response(sock):
    h = recvn(sock, HEADER)
    magic, version, header, command, flags, seq, n, checksum = struct.unpack("<IHHIIQQI", h)
    if magic != MAGIC or version != 1 or header != HEADER:
        raise RuntimeError("bad response frame header")
    body = recvn(sock, n)
    status = struct.unpack_from("<H", body, 0)[0]
    off = 2
    msg_len, off = read_varint(body, off)
    message = body[off : off + msg_len].decode("utf-8", "replace")
    off += msg_len
    payload_len, off = read_varint(body, off)
    payload = body[off : off + payload_len].decode("utf-8", "replace")
    return {"command": command, "sequence": seq, "status": status, "message": message, "payload": payload}


def tls_probe(host, port, insecure=False):
    ctx = ssl._create_unverified_context() if insecure else ssl.create_default_context()
    out = []
    with socket.create_connection((host, port), timeout=10) as raw:
        with ctx.wrap_socket(raw, server_hostname=host) as s:
            for seq, cmd in enumerate(("HELLO", "CAPS"), 1):
                s.sendall(frame(cmd, seq))
                out.append((cmd, parse_response(s)))
    return out


def main():
    ap = argparse.ArgumentParser(description="Discover a 9192 public registration by DNS TXT and .well-known files.")
    ap.add_argument("--domain", default="nineoneninetwo.com.br")
    ap.add_argument("--wellknown", default="")
    ap.add_argument("--probe-edge", action="store_true")
    ap.add_argument("--insecure", action="store_true")
    args = ap.parse_args()

    registration_name = "_9192." + args.domain
    records = dns_txt(registration_name)
    txt = parse_txt_record(records[0]) if records else {}
    wellknown = args.wellknown or txt.get("wellknown") or f"https://{args.domain}/.well-known/9192/"
    manifest_url = wellknown.rstrip("/") + "/9192_public_manifest.json"
    manifest = json.loads(fetch_text(manifest_url))
    edge = manifest.get("public_endpoint") or txt.get("edge", "")
    host, port_text = edge.rsplit(":", 1)
    port = int(port_text)

    print(f"registration_txt={registration_name}")
    print(f"dns_txt_found={str(bool(records)).lower()}")
    print(f"wellknown={wellknown}")
    print(f"manifest_url={manifest_url}")
    print(f"protocol={manifest.get('protocol')}")
    print(f"transport={manifest.get('transport')}")
    print(f"public_endpoint={edge}")
    print(f"price_version={manifest.get('price_version')}")
    print(f"capabilities={','.join(manifest.get('capabilities', []))}")

    if args.probe_edge:
        for cmd, response in tls_probe(host, port, args.insecure):
            print(f"{cmd.lower()}_status={response['status']}")
            print(response["payload"].strip())


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"9192_discovery_client_error={exc}", file=sys.stderr)
        sys.exit(1)
