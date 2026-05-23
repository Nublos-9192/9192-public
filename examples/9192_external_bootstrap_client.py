#!/usr/bin/env python3
import argparse
import hashlib
import json
import socket
import ssl
import struct
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

MAGIC = 0x32393139
HEADER = 36

COMMANDS = {
    "HELLO": 1,
    "CAPS": 2,
    "QUOTE": 9,
    "PAYMENT_INFO": 12,
    "HEALTH": 34,
    "AUTH_MACHINE": 46,
    "ISSUE_SESSION": 47,
    "VERIFY_SESSION": 48,
}


def now_ms():
    return int(time.time() * 1000)


def sha256_hex(data):
    return hashlib.sha256(data).hexdigest()


def dns_txt_dnspython(name):
    try:
        import dns.resolver  # type: ignore

        answers = dns.resolver.resolve(name, "TXT")
        return ["".join(part.decode("utf-8", "replace") for part in r.strings) for r in answers]
    except Exception:
        return []


def dns_txt_nslookup(name):
    try:
        proc = subprocess.run(
            ["nslookup", "-type=TXT", name],
            capture_output=True,
            text=True,
            timeout=15,
            check=False,
        )
    except Exception:
        return []
    out = []
    for raw in (proc.stdout + "\n" + proc.stderr).splitlines():
        line = raw.strip()
        if '"' not in line:
            continue
        parts = []
        rest = line
        while '"' in rest:
            before, quote, tail = rest.partition('"')
            value, quote2, rest = tail.partition('"')
            if quote and quote2:
                parts.append(value)
        if parts:
            out.append("".join(parts))
    return out


def dns_txt(name):
    values = dns_txt_dnspython(name)
    if values:
        return values
    return dns_txt_nslookup(name)


def parse_semicolon_kv(text):
    out = {}
    for part in text.strip().strip('"').split(";"):
        if "=" in part:
            k, v = part.split("=", 1)
            out[k.strip()] = v.strip()
    return out


def parse_line_kv(text):
    out = {}
    for line in text.splitlines():
        if "=" in line:
            k, v = line.split("=", 1)
            out[k.strip()] = v.strip()
    return out


def fetch_bytes(url):
    req = urllib.request.Request(url, headers={"User-Agent": "9192-external-bootstrap/1"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read()


def fetch_text(url):
    return fetch_bytes(url).decode("utf-8", "replace")


def checksum32(data):
    a, b = 1, 0
    for x in data:
        a = (a + x) % 65521
        b = (b + a) % 65521
    return (b << 16) | a


def add_varint(out, value):
    while value >= 0x80:
        out.append((value & 0x7F) | 0x80)
        value >>= 7
    out.append(value)


def read_varint(buf, off):
    value = 0
    shift = 0
    for _ in range(10):
        if off >= len(buf):
            raise RuntimeError("truncated varint")
        b = buf[off]
        off += 1
        value |= (b & 0x7F) << shift
        if not (b & 0x80):
            return value, off
        shift += 7
    raise RuntimeError("invalid varint")


def add_string(out, text):
    data = text.encode("utf-8")
    add_varint(out, len(data))
    out.extend(data)


def read_string(buf, off):
    n, off = read_varint(buf, off)
    if n > len(buf) - off:
        raise RuntimeError("truncated string")
    text = buf[off : off + n].decode("utf-8", "replace")
    return text, off + n


def le64(value):
    return struct.pack("<Q", value)


def le32(value):
    return struct.pack("<I", value)


def make_frame(command, seq, payload=b""):
    command_id = COMMANDS[command]
    base = struct.pack("<IHHIIQQ", MAGIC, 1, HEADER, command_id, 0, seq, len(payload)) + payload
    return struct.pack("<IHHIIQQI", MAGIC, 1, HEADER, command_id, 0, seq, len(payload), checksum32(base)) + payload


def recvn(sock, n):
    out = b""
    while len(out) < n:
        chunk = sock.recv(n - len(out))
        if not chunk:
            raise RuntimeError("connection closed")
        out += chunk
    return out


def parse_response(sock):
    h = recvn(sock, HEADER)
    magic, version, header, command, flags, seq, n, checksum = struct.unpack("<IHHIIQQI", h)
    if magic != MAGIC or version != 1 or header != HEADER:
        raise RuntimeError("bad response frame header")
    body = recvn(sock, n)
    if len(body) < 2:
        raise RuntimeError("truncated response body")
    status = struct.unpack_from("<H", body, 0)[0]
    off = 2
    message, off = read_string(body, off)
    payload_len, off = read_varint(body, off)
    payload = body[off : off + payload_len]
    return {
        "command": command,
        "sequence": seq,
        "status": status,
        "message": message,
        "payload": payload.decode("utf-8", "replace"),
    }


def request(sock, command, seq, payload=b""):
    sock.sendall(make_frame(command, seq, payload))
    return parse_response(sock)


def fnv1a(data, seed=1469598103934665603):
    h = seed
    for b in data.encode("utf-8"):
        h ^= b
        h = (h * 1099511628211) & 0xFFFFFFFFFFFFFFFF
    return h


def u64_memory_hex(value):
    return value.to_bytes(8, "little").hex()


def issue_session_payload(challenge_id, message):
    domain = "9192.sign.message"
    public_key = "9192_external_bootstrap_client"
    tag_value = fnv1a(message, fnv1a(domain))
    tag_hex = u64_memory_hex(tag_value)
    tag_bytes = str(len(message))
    material = 1469598103934665603
    for part in (public_key, ":", domain, ":", tag_bytes, ":", tag_hex):
        material = fnv1a(part, material)

    out = bytearray()
    add_string(out, challenge_id)
    add_string(out, public_key)
    add_string(out, u64_memory_hex(material))
    add_string(out, domain)
    out.extend(le32(len(message)))
    out.extend(le64(tag_value))
    return bytes(out)


def auth_machine_payload(machine_id):
    out = bytearray()
    add_string(out, machine_id)
    return bytes(out)


def verify_session_payload(session_id, machine_id):
    out = bytearray()
    add_string(out, session_id)
    add_string(out, machine_id)
    return bytes(out)


def quote_get_pulse_payload(machine_id, bits, max_output, template_id):
    out = bytearray()
    add_string(out, machine_id)
    add_string(out, "GET_PULSE")
    out.extend(le64(8))
    out.extend(le64(0))
    out.extend(le64(0))
    out.extend(le64(bits))
    out.extend(le64(0))
    out.extend(le64(0))
    out.extend(le64(max_output))
    out.extend(le32(2))
    out.extend(le32(0))
    out.extend(le32(0))
    out.extend(le32(0))
    out.extend(le32(0))
    out.extend(le32(0))
    add_string(out, template_id)
    return bytes(out)


def split_endpoint(endpoint):
    host, port_text = endpoint.rsplit(":", 1)
    return host.strip("[]"), int(port_text)


def tls_connect(host, port, insecure=False):
    ctx = ssl._create_unverified_context() if insecure else ssl.create_default_context()
    raw = socket.create_connection((host, port), timeout=15)
    tls = ctx.wrap_socket(raw, server_hostname=host)
    return tls


def authenticate(sock, machine_id, seq, steps):
    t0 = now_ms()
    challenge = request(sock, "AUTH_MACHINE", seq, auth_machine_payload(machine_id))
    seq += 1
    steps.append(step("AUTH_MACHINE", challenge["status"] == 0, now_ms() - t0, challenge))
    if challenge["status"] != 0:
        raise RuntimeError("AUTH_MACHINE failed")
    ch = parse_line_kv(challenge["payload"])

    t0 = now_ms()
    issued = request(sock, "ISSUE_SESSION", seq, issue_session_payload(ch["challenge_id"], ch["message"]))
    seq += 1
    steps.append(step("ISSUE_SESSION", issued["status"] == 0, now_ms() - t0, issued))
    if issued["status"] != 0:
        raise RuntimeError("ISSUE_SESSION failed")
    session = parse_line_kv(issued["payload"])

    t0 = now_ms()
    verified = request(sock, "VERIFY_SESSION", seq, verify_session_payload(session["session_id"], session["machine_id"]))
    seq += 1
    steps.append(step("VERIFY_SESSION", verified["status"] == 0, now_ms() - t0, verified))
    if verified["status"] != 0:
        raise RuntimeError("VERIFY_SESSION failed")
    return session, seq


def step(name, ok, latency_ms, detail=None):
    out = {"name": name, "ok": bool(ok), "latency_ms": int(latency_ms)}
    if detail is not None:
        out["status"] = detail.get("status")
        out["message"] = detail.get("message")
    return out


def discover(domain):
    registration_name = "_9192." + domain
    manifest_name = "_9192-manifest." + domain
    txt_records = dns_txt(registration_name)
    manifest_txt_records = dns_txt(manifest_name)
    registration = parse_semicolon_kv(txt_records[0]) if txt_records else {}
    manifest_txt = parse_semicolon_kv(manifest_txt_records[0]) if manifest_txt_records else {}
    wellknown = registration.get("wellknown", f"https://{domain}/.well-known/9192/")

    manifest_kv_url = wellknown.rstrip("/") + "/9192_public_manifest.kv"
    manifest_json_url = wellknown.rstrip("/") + "/9192_public_manifest.json"
    catalog_url = wellknown.rstrip("/") + "/9192_service_catalog.json"
    pricebook_url = wellknown.rstrip("/") + "/9192_pricebook_public.txt"

    manifest_json = json.loads(fetch_text(manifest_json_url))
    catalog = json.loads(fetch_text(catalog_url))
    pricebook = fetch_text(pricebook_url)
    try:
        manifest_kv_bytes = fetch_bytes(manifest_kv_url)
        manifest_kv = parse_line_kv(manifest_kv_bytes.decode("utf-8", "replace"))
        manifest_kv_sha256 = sha256_hex(manifest_kv_bytes)
    except Exception:
        manifest_kv_bytes = b""
        manifest_kv = {}
        manifest_kv_sha256 = ""

    expected_manifest_sha = manifest_txt.get("sha256", "")
    advertised_manifest_sha = manifest_kv.get("manifest_sha256") or manifest_json.get("manifest_sha256", "")
    hash_ok = bool(expected_manifest_sha and advertised_manifest_sha and expected_manifest_sha == advertised_manifest_sha)
    endpoint = manifest_json.get("public_endpoint") or manifest_kv.get("public_endpoint") or registration.get("edge")
    if not endpoint:
        raise RuntimeError("public endpoint missing from discovery")
    edge_host, edge_port = split_endpoint(endpoint)

    return {
        "registration_name": registration_name,
        "registration_txt_records": txt_records,
        "registration": registration,
        "manifest_txt_name": manifest_name,
        "manifest_txt_records": manifest_txt_records,
        "manifest_txt": manifest_txt,
        "wellknown": wellknown,
        "manifest_kv_url": manifest_kv_url,
        "manifest_json_url": manifest_json_url,
        "catalog_url": catalog_url,
        "pricebook_url": pricebook_url,
        "manifest_kv_sha256_file": manifest_kv_sha256,
        "manifest_sha256_advertised": advertised_manifest_sha,
        "manifest_sha256_dns": expected_manifest_sha,
        "manifest_hash_matches_dns": hash_ok,
        "manifest": manifest_json,
        "manifest_kv": manifest_kv,
        "catalog": catalog,
        "pricebook_excerpt": "\n".join(pricebook.splitlines()[:20]),
        "edge_host": edge_host,
        "edge_port": edge_port,
    }


def run_smoke(args):
    run_id = f"{int(time.time())}_{now_ms() % 1000000}"
    quote_template_id = f"external_bootstrap_get_pulse_{args.bits}_{run_id}"
    report = {
        "domain": args.domain,
        "mode": "smoke",
        "started_at_unix": int(time.time()),
        "run_id": run_id,
        "steps": [],
    }

    t0 = now_ms()
    discovery = discover(args.domain)
    report["steps"].append(step("DISCOVERY", True, now_ms() - t0))
    report["discovery"] = {
        "registration_txt": discovery["registration_name"],
        "dns_txt_found": bool(discovery["registration_txt_records"]),
        "manifest_txt": discovery["manifest_txt_name"],
        "manifest_txt_found": bool(discovery["manifest_txt_records"]),
        "wellknown": discovery["wellknown"],
        "edge_host": discovery["edge_host"],
        "edge_port": discovery["edge_port"],
        "manifest_sha256_dns": discovery["manifest_sha256_dns"],
        "manifest_sha256_advertised": discovery["manifest_sha256_advertised"],
        "manifest_hash_matches_dns": discovery["manifest_hash_matches_dns"],
        "manifest_kv_sha256_file": discovery["manifest_kv_sha256_file"],
        "price_version": discovery["manifest"].get("price_version"),
        "active_price_book": discovery["manifest"].get("active_price_book"),
        "reference_value_usd_per_9192C": discovery["manifest"].get("reference_value_usd_per_9192C"),
        "policy": discovery["manifest"].get("9192C_policy"),
        "automated_payment_rails": discovery["manifest"].get("automated_payment_rails", []),
    }

    if not discovery["manifest_hash_matches_dns"]:
        raise RuntimeError("manifest sha advertised by DNS does not match manifest")

    seq = 1
    t0 = now_ms()
    with tls_connect(discovery["edge_host"], discovery["edge_port"], args.insecure) as sock:
        cert = sock.getpeercert()
        report["tls"] = {
            "server_name": discovery["edge_host"],
            "cipher": sock.cipher()[0] if sock.cipher() else "",
            "version": sock.version(),
            "subject_alt_names": [v for k, v in cert.get("subjectAltName", []) if k == "DNS"] if cert else [],
        }
        report["steps"].append(step("TLS_CONNECT", True, now_ms() - t0))

        for cmd in ("HELLO", "CAPS", "HEALTH", "PAYMENT_INFO"):
            t0 = now_ms()
            response = request(sock, cmd, seq)
            seq += 1
            report["steps"].append(step(cmd, response["status"] == 0, now_ms() - t0, response))
            report[cmd.lower()] = {
                "status": response["status"],
                "message": response["message"],
                "payload_head": response["payload"][:2000],
            }
            if response["status"] != 0:
                raise RuntimeError(f"{cmd} failed")

        session, seq = authenticate(sock, args.machine, seq, report["steps"])
        report["session"] = {"machine_id": session.get("machine_id"), "session_id_present": bool(session.get("session_id"))}

        t0 = now_ms()
        quote = request(sock, "QUOTE", seq, quote_get_pulse_payload(args.machine, args.bits, args.max_output, quote_template_id))
        seq += 1
        report["steps"].append(step("QUOTE_GET_PULSE", quote["status"] == 0, now_ms() - t0, quote))
        quote_kv = parse_line_kv(quote["payload"])
        report["quote"] = {
            "status": quote["status"],
            "message": quote["message"],
            "quote_id": quote_kv.get("quote_id", ""),
            "account_id": quote_kv.get("account_id", ""),
            "service": quote_kv.get("service", ""),
            "amount_units": quote_kv.get("amount_units", ""),
            "price_version": quote_kv.get("price_version", ""),
            "bit_size": quote_kv.get("bit_size", ""),
            "max_output_bytes": quote_kv.get("max_output_bytes", ""),
            "acceptance": quote_kv.get("acceptance", ""),
            "template_id": quote_template_id,
        }
        if quote["status"] != 0:
            raise RuntimeError("QUOTE failed")

    report["finished_at_unix"] = int(time.time())
    report["final_status"] = "OK"
    return report


def write_report(report, path):
    text = json.dumps(report, indent=2, sort_keys=True)
    if path:
        Path(path).write_text(text + "\n", encoding="utf-8")
    return text


def print_summary(report):
    d = report.get("discovery", {})
    q = report.get("quote", {})
    print(f"external_bootstrap={report.get('final_status')}")
    print(f"domain={report.get('domain')}")
    print(f"wellknown={d.get('wellknown')}")
    print(f"edge={d.get('edge_host')}:{d.get('edge_port')}")
    print(f"manifest_hash_matches_dns={str(d.get('manifest_hash_matches_dns')).lower()}")
    print(f"active_price_book={d.get('active_price_book')}")
    print(f"price_version={d.get('price_version')}")
    print(f"quote_status={q.get('status')}")
    print(f"quote_id={q.get('quote_id')}")
    print(f"quote_amount_units={q.get('amount_units')}")
    print(f"report_steps={len(report.get('steps', []))}")


def main():
    ap = argparse.ArgumentParser(description="External 9192 bootstrap client. Starts from a domain and proves discovery/TLS/quote.")
    ap.add_argument("--domain", default="nineoneninetwo.com.br")
    ap.add_argument("--mode", choices=["smoke"], default="smoke")
    ap.add_argument("--machine", default="external_bootstrap_smoke")
    ap.add_argument("--bits", type=int, default=65536)
    ap.add_argument("--max-output", type=int, default=8192)
    ap.add_argument("--report", default="9192_external_bootstrap_report.json")
    ap.add_argument("--json", action="store_true", help="print full JSON report to stdout")
    ap.add_argument("--insecure", action="store_true", help="disable TLS certificate verification")
    args = ap.parse_args()

    try:
        report = run_smoke(args)
        text = write_report(report, args.report)
        if args.json:
            print(text)
        else:
            print_summary(report)
            if args.report:
                print(f"report={args.report}")
        return 0
    except Exception as exc:
        failed = {
            "domain": args.domain,
            "mode": args.mode,
            "final_status": "FAIL",
            "error": str(exc),
            "finished_at_unix": int(time.time()),
        }
        if args.report:
            write_report(failed, args.report)
        print(f"external_bootstrap=FAIL", file=sys.stderr)
        print(f"error={exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
