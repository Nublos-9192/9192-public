#!/usr/bin/env node
import { spawn } from "node:child_process";

function arg(name, fallback = "") {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0 && idx + 1 < process.argv.length) return process.argv[idx + 1];
  return fallback;
}

function step(name, payload) {
  process.stdout.write(`\n=== ${name} ===\n`);
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

async function smoke(client, machineId) {
  step("discovery", {
    domain: client.domain,
    edge: client.discovery?.edge,
    price_version: client.discovery?.bootstrap?.pricing?.price_version
  });
  step("status", await client.status());
  step("payment_info", await client.paymentInfo());
  step("pricebook", await client.pricebook());
  step("hello", await client.hello());
  step("caps", await client.caps());
  const quote = await client.quoteGetPulse({
    machineId,
    bits: Number(arg("bits", "65536")),
    maxOutput: Number(arg("max-output", "8192")),
    idempotencyKey: `9192-js-smoke-${Date.now()}`
  });
  step("quote_get_pulse", quote);
}

async function paidFlow(client, machineId) {
  const quote = await client.quoteGetPulse({
    machineId,
    bits: Number(arg("bits", "65536")),
    maxOutput: Number(arg("max-output", "8192")),
    idempotencyKey: `9192-js-paid-sim-${Date.now()}`
  });
  step("quote_for_execution", quote);

  const quoteId = quote.quote_id || quote.data?.quote_id || quote.id;
  const accepted = await client.acceptQuote({ machineId, quoteId });
  step("accept_quote", accepted);
  const execution = await client.executeGetPulse({ machineId, quoteId, bits: Number(arg("bits", "65536")) });
  step("execute_get_pulse", execution);

  const receiptId = execution.receipt_id || execution.data?.receipt_id || quoteId;
  const receipt = await client.receipt({ machineId, receiptId });
  step("receipt", receipt);
  step("verify_receipt", await client.verifyReceipt({ machineId, receiptId }));
}

async function paidSim(machineId) {
  const localRoot = arg("local-root", process.env.NINEONENINETWO_LOCAL_ROOT || "");
  if (!localRoot) {
    throw new Error("paid-sim requires --local-root C:\\9192_system or NINEONENINETWO_LOCAL_ROOT; use --mode paid-flow for already-funded public accounts");
  }
  const script = `${localRoot.replace(/[\\/]+$/, "")}\\run_9192_public_api_paid_sim_windows.ps1`;
  const ps = spawn("powershell.exe", [
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", script,
    "-Machine", machineId,
    "-Network", arg("network", "TRON"),
    "-Asset", arg("asset", "USDT"),
    "-Units", arg("units", "250000"),
    "-Bits", arg("bits", "65536"),
    "-MaxOutput", arg("max-output", "8192")
  ], { stdio: "inherit" });
  const code = await new Promise((resolve) => ps.on("close", resolve));
  if (code !== 0) throw new Error(`local paid-sim script exited with ${code}`);
}

async function main() {
  const domain = arg("domain", "nineoneninetwo.com.br");
  const baseUrl = arg("base-url", "");
  const mode = arg("mode", "smoke");
  const machineId = arg("machine", `9192_js_demo_${Date.now()}`);
  if (mode === "paid-sim") return paidSim(machineId);
  const { NineOneNineTwoClient } = await import("@nineoneninetwo/client");
  const client = await NineOneNineTwoClient.discover(domain, {
    ...(baseUrl ? { baseUrl, skipDns: true } : {})
  });
  if (mode === "smoke") return smoke(client, machineId);
  if (mode === "paid-flow") return paidFlow(client, machineId);
  throw new Error(`unknown mode: ${mode}`);
}

main().catch((err) => {
  process.stderr.write(`9192_demo_error=${err?.message || err}\n`);
  if (err?.payload) process.stderr.write(`${JSON.stringify(err.payload, null, 2)}\n`);
  process.exit(1);
});
