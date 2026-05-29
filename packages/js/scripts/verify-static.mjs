import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const VERSION = "1.0.5";
const packages = ["discovery", "client", "mcp", "demo"];

function fail(message) {
  throw new Error(message);
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

for (const name of packages) {
  const pkg = await readJson(`./${name}/package.json`);
  if (pkg.version !== VERSION) fail(`${pkg.name} version is ${pkg.version}, expected ${VERSION}`);
  if (pkg.license !== "Apache-2.0") fail(`${pkg.name} license is ${pkg.license}, expected Apache-2.0`);
}

const clientPkg = await readJson("./client/package.json");
if (clientPkg.dependencies["@nineoneninetwo/discovery"] !== `^${VERSION}`) {
  fail("@nineoneninetwo/client depends on the wrong discovery version");
}

for (const name of ["mcp", "demo"]) {
  const pkg = await readJson(`./${name}/package.json`);
  if (pkg.dependencies["@nineoneninetwo/client"] !== `^${VERSION}`) {
    fail(`${pkg.name} depends on the wrong client version`);
  }
}

for (const file of [
  "./client/src/index.mjs",
  "./discovery/src/index.mjs",
  "./mcp/src/server.mjs",
  "./demo/bin/9192-demo.mjs"
]) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "pipe", encoding: "utf8" });
  if (result.status !== 0) fail(`${file} failed node --check\n${result.stderr}`);
}

const dts = await readFile("./client/src/index.d.ts", "utf8");
for (const required of [
  "QuoteResponse",
  "ReceiptVerifyResponse",
  "InvoiceResponse",
  "NineOneNineTwoApiError",
  "CapabilityInfo",
  "ExecutionResult"
]) {
  if (!dts.includes(required)) fail(`client types missing ${required}`);
}

const mcpServer = await readFile("./mcp/src/server.mjs", "utf8");
if (mcpServer.includes('name: "get_receipt"')) {
  fail("reserved get_receipt tool must not be advertised by the JS MCP bridge");
}

console.log("verify_static=OK");
