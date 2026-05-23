import readline from "node:readline";
import { NineOneNineTwoClient } from "@nineoneninetwo/client";

const DOMAIN = process.env.NINEONENINETWO_DOMAIN || "nineoneninetwo.com.br";
const PROTOCOL_VERSION = "2024-11-05";

export const tools = [
  {
    name: "discover_9192",
    description: "Discover the public 9192 service metadata.",
    inputSchema: { type: "object", properties: { domain: { type: "string", default: DOMAIN } } }
  },
  {
    name: "get_pricebook",
    description: "Read the active 9192 pricebook.",
    inputSchema: { type: "object", properties: { domain: { type: "string", default: DOMAIN } } }
  },
  {
    name: "get_payment_info",
    description: "Read payment policy and receiving wallets through the public API.",
    inputSchema: { type: "object", properties: { domain: { type: "string", default: DOMAIN } } }
  },
  {
    name: "quote_get_pulse",
    description: "Create a GET_PULSE quote through the public 9192 API.",
    inputSchema: {
      type: "object",
      properties: {
        domain: { type: "string", default: DOMAIN },
        machine_id: { type: "string", default: "mcp_js_probe" },
        bits: { type: "integer", default: 65536 },
        max_output: { type: "integer", default: 8192 }
      }
    }
  },
  {
    name: "quote_make_bct",
    description: "Create a MAKE_BCT quote through the public 9192 API.",
    inputSchema: {
      type: "object",
      properties: {
        domain: { type: "string", default: DOMAIN },
        machine_id: { type: "string", default: "mcp_js_probe" },
        input_bytes: { type: "integer", default: 4 },
        bits: { type: "integer", default: 65536 },
        max_output: { type: "integer", default: 8192 }
      }
    }
  },
  {
    name: "quote_verify_bct",
    description: "Create a VERIFY_BCT quote through the public 9192 API.",
    inputSchema: {
      type: "object",
      properties: {
        domain: { type: "string", default: DOMAIN },
        machine_id: { type: "string", default: "mcp_js_probe" },
        input_bytes: { type: "integer", default: 128 },
        output_bytes: { type: "integer", default: 4 },
        bits: { type: "integer", default: 65536 },
        max_output: { type: "integer", default: 8192 }
      }
    }
  },
  {
    name: "get_receipt",
    description: "Fetch a 9192 receipt by id.",
    inputSchema: {
      type: "object",
      properties: {
        domain: { type: "string", default: DOMAIN },
        machine_id: { type: "string", default: "mcp_js_probe" },
        receipt_id: { type: "string" }
      },
      required: ["receipt_id"]
    }
  },
  {
    name: "verify_receipt",
    description: "Verify a 9192 receipt id or receipt payload.",
    inputSchema: {
      type: "object",
      properties: {
        domain: { type: "string", default: DOMAIN },
        machine_id: { type: "string", default: "mcp_js_probe" },
        receipt_id: { type: "string" },
        receipt: { type: "string" }
      }
    }
  }
];

function textResult(payload) {
  const text = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
  return { content: [{ type: "text", text }] };
}

async function clientFor(domain) {
  return NineOneNineTwoClient.discover(domain || DOMAIN, { skipDns: false });
}

export async function callTool(name, args = {}) {
  const domain = args.domain || DOMAIN;
  const client = await clientFor(domain);
  if (name === "discover_9192") return textResult(client.discovery);
  if (name === "get_pricebook") return textResult(await client.pricebook());
  if (name === "get_payment_info") return textResult(await client.paymentInfo());
  if (name === "quote_get_pulse") {
    return textResult(await client.quoteGetPulse({
      machineId: args.machine_id || args.machine || "mcp_js_probe",
      bits: Number(args.bits || 65536),
      maxOutput: Number(args.max_output || 8192)
    }));
  }
  if (name === "quote_make_bct") {
    return textResult(await client.quoteMakeBct({
      machineId: args.machine_id || args.machine || "mcp_js_probe",
      inputBytes: Number(args.input_bytes || 4),
      bits: Number(args.bits || 65536),
      maxOutput: Number(args.max_output || 8192)
    }));
  }
  if (name === "quote_verify_bct") {
    return textResult(await client.quoteVerifyBct({
      machineId: args.machine_id || args.machine || "mcp_js_probe",
      inputBytes: Number(args.input_bytes || 128),
      outputBytes: Number(args.output_bytes || 4),
      bits: Number(args.bits || 65536),
      maxOutput: Number(args.max_output || 8192)
    }));
  }
  if (name === "get_receipt") {
    return textResult(await client.receipt({
      machineId: args.machine_id || args.machine || "mcp_js_probe",
      receiptId: args.receipt_id || args.receipt
    }));
  }
  if (name === "verify_receipt") {
    return textResult(await client.verifyReceipt({
      machineId: args.machine_id || args.machine || "mcp_js_probe",
      receiptId: args.receipt_id,
      receipt: args.receipt
    }));
  }
  throw new Error(`unknown 9192 MCP tool: ${name}`);
}

async function handleMessage(msg) {
  const method = msg.method;
  if (method === "initialize") {
    return {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: {} },
      serverInfo: { name: "9192-mcp-js", version: "0.1.0" }
    };
  }
  if (method === "tools/list") return { tools };
  if (method === "tools/call") {
    const params = msg.params || {};
    return callTool(params.name, params.arguments || {});
  }
  if (method === "notifications/initialized" || method === "initialized") return {};
  throw new Error(`unsupported MCP method: ${method}`);
}

function writeResponse(id, result, error) {
  const response = { jsonrpc: "2.0", id };
  if (error) response.error = { code: -32000, message: String(error.message || error) };
  else response.result = result;
  process.stdout.write(`${JSON.stringify(response)}\n`);
}

export async function runMcpServer() {
  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let msg;
    try {
      msg = JSON.parse(line);
      writeResponse(msg.id ?? null, await handleMessage(msg));
    } catch (err) {
      writeResponse(msg?.id ?? null, null, err);
    }
  }
}
