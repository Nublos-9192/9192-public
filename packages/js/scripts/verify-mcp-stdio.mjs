import { spawn } from "node:child_process";

const child = spawn(process.execPath, ["./mcp/bin/9192-mcp.mjs"], {
  stdio: ["pipe", "pipe", "pipe"]
});

const pending = [];
let buffer = "";

child.stdout.setEncoding("utf8");
child.stdout.on("data", (chunk) => {
  buffer += chunk;
  for (;;) {
    const idx = buffer.indexOf("\n");
    if (idx < 0) break;
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    const waiter = pending.shift();
    if (waiter) waiter(JSON.parse(line));
  }
});

function rpc(method, params) {
  const id = pending.length + 1 + Date.now();
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout waiting for ${method}`)), 5000);
    pending.push((msg) => {
      clearTimeout(timer);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    });
  });
}

try {
  const init = await rpc("initialize", {});
  if (init.serverInfo?.version !== "1.0.5") {
    throw new Error(`MCP version ${init.serverInfo?.version}, expected 1.0.5`);
  }
  const listed = await rpc("tools/list", {});
  const names = listed.tools.map((tool) => tool.name);
  for (const name of ["discover_9192", "get_pricebook", "get_payment_info", "quote_get_pulse", "sandbox_get_pulse", "quote_make_bct", "quote_verify_bct", "verify_receipt"]) {
    if (!names.includes(name)) throw new Error(`missing MCP tool ${name}`);
  }
  if (names.includes("get_receipt")) throw new Error("reserved get_receipt tool is still exposed");
  console.log("verify_mcp_stdio=OK");
} finally {
  child.kill();
}
