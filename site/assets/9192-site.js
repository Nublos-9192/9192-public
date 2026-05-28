const apiBase = "/api/v1";
const uptimeStorageKey = "9192_live_availability_samples_v1";
const maxUptimeSamples = 96;

const state = {
  lastQuote: null,
  snippets: {
    curl: [
      "curl https://nineoneninetwo.com.br/api/v1/status",
      "curl https://nineoneninetwo.com.br/.well-known/9192/bootstrap.json",
      "curl -X POST https://nineoneninetwo.com.br/api/v1/quotes/get-pulse \\",
      "  -H \"Content-Type: application/json\" \\",
      "  -d '{\"machine_id\":\"demo-agent-001\",\"bits\":65536,\"max_output\":8192}'"
    ].join("\n"),
    node: [
      "import { createClient } from \"@nineoneninetwo/client\";",
      "",
      "const client = createClient(\"https://nineoneninetwo.com.br\");",
      "const status = await client.status();",
      "const quote = await client.quoteGetPulse({",
      "  machine_id: \"demo-agent-001\",",
      "  bits: 65536,",
      "  max_output: 8192",
      "});",
      "console.log({ status, quote });"
    ].join("\n"),
    python: [
      "python examples/9192_external_bootstrap_client.py --domain nineoneninetwo.com.br",
      "python examples/9192_public_api_client.py smoke",
      "python examples/9192_public_api_client.py quote --machine demo-agent-001 --bits 65536"
    ].join("\n"),
    mcp: [
      "{",
      "  \"mcpServers\": {",
      "    \"9192\": {",
      "      \"url\": \"https://nineoneninetwo.com.br/mcp\"",
      "    }",
      "  }",
      "}"
    ].join("\n")
  }
};

function $(selector) {
  return document.querySelector(selector);
}

function pretty(value) {
  return JSON.stringify(value, null, 2);
}

function setText(selector, value) {
  const el = $(selector);
  if (el) el.textContent = value;
}

function setBadge(selector, value, tone = "ok") {
  const el = $(selector);
  if (!el) return;
  el.textContent = value;
  el.classList.remove("badge-ok", "badge-warn", "badge-private", "badge-neutral");
  el.classList.add(`badge-${tone}`);
}

function setJson(selector, value) {
  const el = $(selector);
  if (el) el.textContent = pretty(value);
}

function setBusy(button, busy) {
  if (!button) return;
  button.disabled = busy;
  button.dataset.originalText = button.dataset.originalText || button.textContent;
  button.textContent = busy ? "Working..." : button.dataset.originalText;
}

async function apiJson(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || 9000);
  try {
    const response = await fetch(path, {
      method: options.method || "GET",
      headers: {
        "Accept": "application/json",
        ...(options.body ? {"Content-Type": "application/json"} : {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal
    });
    const text = await response.text();
    let json;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = {ok: false, error: {code: "NON_JSON_RESPONSE", message: text.slice(0, 400), source: "browser"}};
    }
    return {http_status: response.status, ...json};
  } catch (error) {
    return {ok: false, http_status: 0, error: {code: "FETCH_FAILED", message: String(error.message || error), source: "browser"}};
  } finally {
    clearTimeout(timeout);
  }
}

function asOkLabel(payload) {
  if (!payload) return "UNKNOWN";
  if (payload.ok === true || payload.status === "OK") return "ONLINE";
  return "ATTENTION";
}

function toneForLabel(label) {
  if (label === "ONLINE" || label === "ENABLED" || label === "ACTIVE") return "ok";
  if (label === "PRIVATE") return "private";
  if (label === "CHECK" || label === "ATTENTION" || label === "UNKNOWN") return "warn";
  return "neutral";
}

function getPriceVersion(payload) {
  return payload?.pricebook?.price_version || payload?.pricebook?.active_price_book || payload?.price_version || "unknown";
}

function getRails(payload) {
  const text = pretty(payload || {});
  const rails = [];
  if (/TRON|USDT\/TRON/i.test(text)) rails.push("USDT/TRON");
  if (/Base|USDC\/Base/i.test(text)) rails.push("USDC/Base");
  if (/Solana|USDC\/Solana|USDT\/Solana/i.test(text)) rails.push("Solana");
  return rails.length ? rails.join(" • ") : "published rails";
}

function readUptimeSamples() {
  try {
    const parsed = JSON.parse(localStorage.getItem(uptimeStorageKey) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.ok === "boolean") : [];
  } catch {
    return [];
  }
}

function writeUptimeSamples(samples) {
  try {
    localStorage.setItem(uptimeStorageKey, JSON.stringify(samples.slice(-maxUptimeSamples)));
  } catch {
    // localStorage can be unavailable in some locked-down clients; the graph still renders current state.
  }
}

function renderUptimeSparkline(samples) {
  const path = $("#sparkline-path");
  const percent = $("#spark-percent");
  const title = $("#spark-title");
  if (!path || !percent) return;
  const clean = samples.slice(-maxUptimeSamples);
  if (!clean.length) {
    path.setAttribute("d", "M3 45H217");
    path.setAttribute("stroke", "#9bb4ad");
    percent.textContent = "waiting";
    return;
  }
  const okCount = clean.filter((item) => item.ok).length;
  const ratio = okCount / clean.length;
  percent.textContent = `${Math.round(ratio * 100)}%`;
  percent.style.color = ratio >= 0.98 ? "var(--green)" : ratio >= 0.9 ? "var(--amber)" : "var(--danger)";
  if (title) title.textContent = `LIVE SAMPLES (${clean.length})`;

  const width = 214;
  const left = 3;
  const highY = 9;
  const lowY = 45;
  const denom = Math.max(1, clean.length - 1);
  const points = clean.map((item, index) => {
    const x = left + (width * index / denom);
    const y = item.ok ? highY : lowY;
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  path.setAttribute("d", points.join(""));
  path.setAttribute("stroke", ratio >= 0.98 ? "#49ff99" : ratio >= 0.9 ? "#ffd166" : "#ff5f7a");
}

function recordUptimeSample(ok, detail) {
  const samples = readUptimeSamples();
  const now = Date.now();
  samples.push({ts: now, ok: Boolean(ok), detail: detail || ""});
  const trimmed = samples.slice(-maxUptimeSamples);
  writeUptimeSamples(trimmed);
  renderUptimeSparkline(trimmed);
}

async function refreshLiveStatus() {
  const [status, health, caps, payment, pricebook] = await Promise.all([
    apiJson(`${apiBase}/status`),
    apiJson(`${apiBase}/health`),
    apiJson(`${apiBase}/caps`),
    apiJson(`${apiBase}/payment-info`),
    apiJson(`${apiBase}/pricebook`)
  ]);

  const gatewayLabel = asOkLabel(status);
  const edgeLabel = status.api_uses_tls_edge === false ? "CHECK" : "ONLINE";
  const healthLabel = asOkLabel(health);
  const capsLabel = asOkLabel(caps);
  setBadge("#live-gateway", gatewayLabel, toneForLabel(gatewayLabel));
  setBadge("#live-gateway-copy", gatewayLabel, toneForLabel(gatewayLabel));
  setText("#live-gateway-detail", status.domain || "nineoneninetwo.com.br");
  setBadge("#live-edge", edgeLabel, toneForLabel(edgeLabel));
  setText("#live-edge-detail", status.edge || "edge.nineoneninetwo.com.br:9443");
  setBadge("#live-health", healthLabel, toneForLabel(healthLabel));
  setText("#live-health-detail", health.command || health.status || "HEALTH");
  setBadge("#live-caps", capsLabel, toneForLabel(capsLabel));
  setText("#live-caps-detail", caps.command || "CAPS");
  setBadge("#live-pricebook", "ACTIVE", "ok");
  setText("#live-pricebook-detail", pricebook?.pricebook?.reference_value_usd_per_9192C ? "1 9192C reference USD 1.00" : "V6 policy");
  const paymentLabel = payment.ok === false ? "CHECK" : "CRYPTO";
  setBadge("#live-payment", paymentLabel, toneForLabel(paymentLabel));
  setText("#live-payment-detail", payment.ok === false ? "attention" : getRails(payment));
  setText("#live-last-check", new Date().toLocaleTimeString());

  setJson("#live-json", {status, health, caps, payment, pricebook});
  const liveOk = status.ok === true && health.ok === true && caps.ok === true && pricebook.ok === true;
  recordUptimeSample(liveOk, liveOk ? "ok" : "attention");
}

function quotePayload() {
  const service = $("#quote-service")?.value || "get-pulse";
  const machine = ($("#quote-machine")?.value || "web-demo-agent").trim();
  const bits = Number($("#quote-bits")?.value || 65536);
  const maxOutput = Number($("#quote-max-output")?.value || 8192);
  const priority = $("#quote-priority")?.value || "standard";
  const inputBytes = Number($("#quote-input-bytes")?.value || 1024);

  const base = {
    machine_id: machine,
    bits,
    max_output: maxOutput,
    priority
  };

  if (service === "make-bct" || service === "verify-bct") {
    base.input_bytes = Math.max(1, inputBytes);
  }

  return {service, body: base};
}

async function generateQuote(event) {
  event?.preventDefault();
  const button = event?.submitter || $("#quote-submit");
  setBusy(button, true);
  const {service, body} = quotePayload();
  const result = await apiJson(`${apiBase}/quotes/${service}`, {method: "POST", body});
  state.lastQuote = result?.data?.quote_id ? result : null;
  setJson("#quote-result", result);
  setText("#quote-summary", result?.data?.quote_id ? `${result.data.quote_id} • ${result.data.amount_units || "units"} units` : "quote response");
  setBusy(button, false);
}

async function verifyReceipt(event) {
  event?.preventDefault();
  const button = event?.submitter || $("#receipt-submit");
  setBusy(button, true);
  const machine = ($("#receipt-machine")?.value || "web-demo-agent").trim();
  const receipt = ($("#receipt-id")?.value || "").trim();
  const body = {machine_id: machine};
  if (receipt) body.receipt_id = receipt;
  const result = await apiJson(`${apiBase}/receipts/verify`, {method: "POST", body});
  setJson("#receipt-result", result);
  setText("#receipt-summary", result.ok ? "receipt verified" : result?.error?.code || "verification response");
  setBusy(button, false);
}

function updateSnippet(name) {
  for (const button of document.querySelectorAll("[data-snippet]")) {
    button.setAttribute("aria-selected", button.dataset.snippet === name ? "true" : "false");
  }
  setText("#integration-snippet", state.snippets[name] || state.snippets.curl);
  setText("#copy-state", "");
}

async function copySnippet() {
  const text = $("#integration-snippet")?.textContent || "";
  try {
    await navigator.clipboard.writeText(text);
    setText("#copy-state", "Copied.");
  } catch {
    setText("#copy-state", "Copy unavailable in this browser.");
  }
}

function wireUI() {
  $("#quote-form")?.addEventListener("submit", generateQuote);
  $("#receipt-form")?.addEventListener("submit", verifyReceipt);
  $("#refresh-live")?.addEventListener("click", refreshLiveStatus);
  $("#copy-snippet")?.addEventListener("click", copySnippet);
  for (const button of document.querySelectorAll("[data-snippet]")) {
    button.addEventListener("click", () => updateSnippet(button.dataset.snippet));
  }
  const machine = $("#quote-machine");
  if (machine && !machine.value) {
    machine.value = `web-demo-${Date.now().toString(36)}`;
  }
  const receiptMachine = $("#receipt-machine");
  if (receiptMachine && !receiptMachine.value) {
    receiptMachine.value = machine?.value || "web-demo-agent";
  }
  updateSnippet("curl");
  renderUptimeSparkline(readUptimeSamples());
  refreshLiveStatus();
  setInterval(refreshLiveStatus, 60000);
}

document.addEventListener("DOMContentLoaded", wireUI);
