#!/usr/bin/env python3
"""Small external HTTP client for the 9192 public API facade."""

import argparse
import json
import sys
import time
import urllib.error
import urllib.request


def call_json(base, method, path, body=None):
    data = None
    headers = {"Accept": "application/json"}
    if body is not None:
        data = json.dumps(body, separators=(",", ":")).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(base.rstrip("/") + path, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=20) as response:
        return response.status, json.loads(response.read().decode("utf-8"))


def print_step(name, status, payload):
    print(f"step={name}")
    print(f"http_status={status}")
    print(json.dumps(payload, indent=2, sort_keys=False))


def smoke(args):
    machine = args.machine or f"api_client_{int(time.time() * 1000)}"
    for name, path in (
        ("status", "/api/v1/status"),
        ("pricebook", "/api/v1/pricebook"),
        ("payment_info", "/api/v1/payment-info"),
        ("hello", "/api/v1/hello"),
        ("caps", "/api/v1/caps"),
    ):
        status, payload = call_json(args.base, "GET", path)
        print_step(name, status, payload)

    status, quote = call_json(args.base, "POST", "/api/v1/quotes/get-pulse", {
        "machine_id": machine,
        "bits": args.bits,
        "max_output": args.max_output,
        "priority": "normal",
        "idempotency_key": f"api-client-get-pulse-{int(time.time() * 1000)}",
    })
    print_step("quote_get_pulse", status, quote)

    status, make_quote = call_json(args.base, "POST", "/api/v1/quotes/make-bct", {
        "machine_id": machine + "_bct_make",
        "input_bytes": len(args.bct_plain.encode("utf-8")),
        "bits": args.bits,
        "max_output": args.max_output,
        "priority": "normal",
        "idempotency_key": f"api-client-make-bct-{int(time.time() * 1000)}",
    })
    print_step("quote_make_bct", status, make_quote)


def invoice(args):
    status, payload = call_json(args.base, "POST", "/api/v1/invoices", {
        "machine_id": args.machine,
        "units": args.units,
        "network": args.network,
        "asset": args.asset,
    })
    print_step("invoice", status, payload)


def main():
    parser = argparse.ArgumentParser(description="Use the public HTTP/JSON facade without replacing the native 9192 edge.")
    parser.add_argument("--base", default="https://nineoneninetwo.com.br")
    sub = parser.add_subparsers(dest="command", required=True)

    smoke_parser = sub.add_parser("smoke", help="Read public metadata and create safe quotes.")
    smoke_parser.add_argument("--machine", default="")
    smoke_parser.add_argument("--bits", type=int, default=65536)
    smoke_parser.add_argument("--max-output", type=int, default=8192)
    smoke_parser.add_argument("--bct-plain", default="9192")
    smoke_parser.set_defaults(func=smoke)

    invoice_parser = sub.add_parser("invoice", help="Create a real funding invoice through the public API.")
    invoice_parser.add_argument("--machine", required=True)
    invoice_parser.add_argument("--units", type=int, required=True)
    invoice_parser.add_argument("--network", required=True)
    invoice_parser.add_argument("--asset", required=True)
    invoice_parser.set_defaults(func=invoice)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    try:
        main()
    except urllib.error.HTTPError as exc:
        print(f"9192_api_http_error={exc.code}", file=sys.stderr)
        print(exc.read().decode("utf-8", "replace"), file=sys.stderr)
        sys.exit(1)
    except Exception as exc:
        print(f"9192_api_client_error={exc}", file=sys.stderr)
        sys.exit(1)
