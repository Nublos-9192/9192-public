#!/usr/bin/env python3
import json
import sys
import urllib.request


DOMAIN = "nineoneninetwo.com.br"


TOOLS = [
    {
        "name": "discover_9192",
        "description": "Fetch 9192 public discovery metadata from HTTPS well-known endpoints.",
        "inputSchema": {
            "type": "object",
            "properties": {"domain": {"type": "string", "default": DOMAIN}},
        },
    },
    {
        "name": "get_pricebook",
        "description": "Fetch the public 9192 pricebook pointer.",
        "inputSchema": {
            "type": "object",
            "properties": {"domain": {"type": "string", "default": DOMAIN}},
        },
    },
    {
        "name": "get_payment_info",
        "description": "Call the public 9192 PAYMENT_INFO command through the TLS edge.",
        "inputSchema": {
            "type": "object",
            "properties": {"machine": {"type": "string", "default": "mcp_bridge_probe"}},
        },
    },
    {
        "name": "quote_get_pulse",
        "description": "Request a GET_PULSE quote through the public 9192 TLS edge.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "machine": {"type": "string", "default": "mcp_bridge_probe"},
                "bits": {"type": "integer", "default": 65536},
                "max_output": {"type": "integer", "default": 8192},
            },
        },
    },
    {
        "name": "verify_receipt",
        "description": "Verify a 9192 receipt id through the public TLS edge.",
        "inputSchema": {
            "type": "object",
            "required": ["receipt"],
            "properties": {
                "machine": {"type": "string", "default": "mcp_bridge_probe"},
                "receipt": {"type": "string"},
            },
        },
    },
]


def http_text(url):
    req = urllib.request.Request(url, headers={"User-Agent": "9192-mcp-bridge/1"})
    with urllib.request.urlopen(req, timeout=12) as resp:
        return resp.read().decode("utf-8", errors="replace")


def api_json(domain, method, path, body=None):
    data = None
    headers = {"Accept": "application/json", "User-Agent": "9192-mcp-bridge/1"}
    if body is not None:
        data = json.dumps(body, separators=(",", ":")).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(f"https://{domain}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=20) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    return json.dumps(payload, indent=2, sort_keys=False)


def content_text(text):
    return {"content": [{"type": "text", "text": text}]}


def call_tool(name, args):
    args = args or {}
    domain = args.get("domain") or DOMAIN
    if name == "discover_9192":
        manifest = http_text(f"https://{domain}/.well-known/9192/9192_public_manifest.json")
        agent = http_text(f"https://{domain}/.well-known/agent-card.json")
        return content_text("manifest:\n" + manifest + "\n\nagent_card:\n" + agent)
    if name == "get_pricebook":
        return content_text(http_text(f"https://{domain}/.well-known/9192/pricebook.json"))
    if name == "get_payment_info":
        return content_text(api_json(domain, "GET", "/api/v1/payment-info"))
    if name == "quote_get_pulse":
        machine = args.get("machine") or "mcp_bridge_probe"
        bits = int(args.get("bits") or 65536)
        max_output = int(args.get("max_output") or 8192)
        return content_text(api_json(domain, "POST", "/api/v1/quotes/get-pulse", {
            "machine_id": machine,
            "bits": bits,
            "max_output": max_output,
        }))
    if name == "verify_receipt":
        machine = args.get("machine") or "mcp_bridge_probe"
        receipt = args.get("receipt") or ""
        if not receipt:
            raise RuntimeError("receipt is required")
        return content_text(api_json(domain, "POST", "/api/v1/receipts/verify", {
            "machine_id": machine,
            "receipt_id": receipt,
        }))
    raise RuntimeError(f"unknown tool: {name}")


def respond(msg, result=None, error=None):
    out = {"jsonrpc": "2.0", "id": msg.get("id")}
    if error is None:
        out["result"] = result
    else:
        out["error"] = {"code": -32000, "message": str(error)}
    sys.stdout.write(json.dumps(out, separators=(",", ":")) + "\n")
    sys.stdout.flush()


def handle(msg):
    method = msg.get("method")
    if method == "initialize":
        return {
            "protocolVersion": "2024-11-05",
            "capabilities": {"tools": {}},
            "serverInfo": {"name": "9192-mcp-bridge", "version": "1.0.1"},
        }
    if method == "tools/list":
        return {"tools": TOOLS}
    if method == "tools/call":
        params = msg.get("params") or {}
        return call_tool(params.get("name"), params.get("arguments") or {})
    if method in ("notifications/initialized", "initialized"):
        return {}
    raise RuntimeError(f"unsupported method: {method}")


def main():
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
            respond(msg, handle(msg))
        except Exception as exc:
            respond({"id": None}, error=exc)


if __name__ == "__main__":
    main()
