const API = "/api/v1";

const capabilities = [
  ["HELLO", "Discovery", "public", "GET /api/v1/hello", "hello", "Protocol greeting and public edge proof."],
  ["CAPS", "Discovery", "public", "GET /api/v1/caps", "caps", "Machine-readable capability advertisement."],
  ["BALANCE", "Finance", "auth", "POST /api/v1/balance", "balance", "Authenticated account balance view."],
  ["QUOTE", "Finance", "public", "POST /api/v1/quotes/*", "quote-*", "Price and reservation preview before execution."],
  ["ACCEPT_QUOTE", "Finance", "auth", "POST /api/v1/quotes/{id}/accept", "accept-quote", "Accept an issued quote after funding."],
  ["GET_PULSE", "Execution", "paid", "POST /api/v1/executions/get-pulse", "get-pulse", "Baseline proof workload."],
  ["MAKE_BCT", "Execution", "paid", "POST /api/v1/executions/make-bct", "make-bct", "Create a sealed BCT packet."],
  ["VERIFY_BCT", "Execution", "paid", "POST /api/v1/executions/verify-bct", "verify-bct", "Verify and open a BCT packet."],
  ["VERIFY_RESULT", "Proof", "paid", "POST /api/v1/executions/verify-result", "verify-result", "Verify an execution result tag."],
  ["ATTEST_EVENT", "Proof", "paid", "POST /api/v1/executions/attest-event", "attest-event", "Create event attestation fields."],
  ["SUBMIT_ID", "Identity", "paid", "POST /api/v1/executions/submit-id", "submit-id", "Execute the ID service."],
  ["BVM_EXEC", "Execution", "paid", "POST /api/v1/executions/bvm-exec", "bvm-exec", "Run bounded BVM bytecode."],
  ["SEALED_MESSAGE", "Execution", "paid", "POST /api/v1/executions/sealed-message", "sealed-message", "Seal message payloads."],
  ["TIMESTAMP_PROOF", "Proof", "paid", "POST /api/v1/executions/timestamp-proof", "timestamp-proof", "Issue timestamp proof metadata."],
  ["MACHINE_EVENT_LOG", "Proof", "paid", "POST /api/v1/executions/machine-event-log", "machine-event-log", "Commit machine event log summaries."],
  ["GET_RECEIPT", "Receipt", "auth", "GET /api/v1/receipts/{id}", "get-receipt", "Fetch execution receipt material."],
  ["VERIFY_RECEIPT", "Receipt", "public", "POST /api/v1/receipts/verify", "verify-receipt", "Verify receipt material for free."],
  ["FUND_ACCOUNT", "Finance", "auth", "POST /api/v1/invoices", "fund-account", "Create account funding invoice."],
  ["INVOICE_STATUS", "Finance", "auth", "GET /api/v1/invoices/{id}", "invoice-status", "Check invoice settlement state."],
  ["SETTLE_INVOICE", "Admin", "admin", "not public", "settle-invoice", "Administrative settlement command."],
  ["RECOVER_RUNTIME", "Admin", "admin", "not public", "recover-runtime", "Administrative runtime recovery command."]
];

const snippets = {
  curl: [
    "curl https://nineoneninetwo.com.br/api/v1/status",
    "curl -X POST https://nineoneninetwo.com.br/api/v1/sandbox/quotes/get-pulse \\",
    "  -H \"Content-Type: application/json\" \\",
    "  -d '{\"machine_id\":\"web-demo\",\"bits\":65536,\"max_output\":8192}'"
  ].join("\n"),
  powershell: [
    "$body = @{ machine_id = \"web-demo\"; bits = 65536; max_output = 8192 } | ConvertTo-Json",
    "Invoke-RestMethod https://nineoneninetwo.com.br/api/v1/sandbox/quotes/get-pulse -Method Post -ContentType application/json -Body $body"
  ].join("\n"),
  node: [
    "const base = \"https://nineoneninetwo.com.br\";",
    "const quote = await fetch(`${base}/api/v1/sandbox/quotes/get-pulse`, {",
    "  method: \"POST\",",
    "  headers: {\"Content-Type\": \"application/json\"},",
    "  body: JSON.stringify({machine_id: \"web-demo\", bits: 65536, max_output: 8192})",
    "}).then(r => r.json());",
    "console.log(quote);"
  ].join("\n"),
  mcp: [
    "{",
    "  \"mcpServers\": {",
    "    \"9192\": { \"url\": \"https://nineoneninetwo.com.br/mcp\" }",
    "  }",
    "}"
  ].join("\n")
};

const state = { sandboxQuote: null, sandboxReceipt: null };

function $(selector) { return document.querySelector(selector); }
function all(selector) { return Array.from(document.querySelectorAll(selector)); }
function text(selector, value) { all(selector).forEach((el) => { el.textContent = value; }); }
function json(selector, value) { text(selector, JSON.stringify(value, null, 2)); }

function setBusy(button, busy) {
  if (!button) return;
  button.disabled = busy;
  button.dataset.label = button.dataset.label || button.textContent;
  button.textContent = busy ? "Working..." : button.dataset.label;
}

async function api(path, options = {}) {
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
    const bodyText = await response.text();
    let parsed = {};
    try { parsed = bodyText ? JSON.parse(bodyText) : {}; }
    catch { parsed = {ok: false, error: {code: "NON_JSON", message: bodyText.slice(0, 300)}}; }
    return {http_status: response.status, ...parsed};
  } catch (error) {
    return {ok: false, http_status: 0, error: {code: "FETCH_FAILED", message: String(error.message || error)}};
  } finally {
    clearTimeout(timeout);
  }
}

function statusLabel(payload) {
  if (!payload) return "waiting";
  if (payload.ok === true || payload.status === "OK") return "online";
  return "attention";
}

async function refreshStatus() {
  const [status, health, caps, pricebook] = await Promise.all([
    api(`${API}/status`),
    api(`${API}/health`),
    api(`${API}/caps`),
    api(`${API}/pricebook`)
  ]);
  text("[data-live=status]", statusLabel(status));
  text("[data-live=edge]", status.api_uses_tls_edge === false ? "check" : "online");
  text("[data-live=health]", statusLabel(health));
  text("[data-live=caps]", statusLabel(caps));
  text("[data-live=version]", status.public_client_kit_version || pricebook?.pricebook?.public_client_kit_version || "v1.0.5");
  text("[data-live=checked]", new Date().toLocaleTimeString());
  json("#status-json", {status, health, caps, pricebook});
}

function machineId() {
  const input = $("#sandbox-machine");
  if (!input) return "web-demo";
  if (!input.value) input.value = `web-${Date.now().toString(36)}`;
  return input.value.trim() || "web-demo";
}

function sandboxBody() {
  return {
    machine_id: machineId(),
    bits: Number($("#sandbox-bits")?.value || 65536),
    max_output: Number($("#sandbox-output")?.value || 8192),
    priority: $("#sandbox-priority")?.value || "normal"
  };
}

async function sandboxQuote(event) {
  event?.preventDefault();
  const button = event?.submitter || $("#sandbox-quote");
  setBusy(button, true);
  const result = await api(`${API}/sandbox/quotes/get-pulse`, {method: "POST", body: sandboxBody()});
  state.sandboxQuote = result.quote_id || result?.quote?.quote_id ? result : null;
  const quoteId = result.quote_id || result?.quote?.quote_id || "";
  text("#sandbox-current", quoteId ? `quote ${quoteId}` : result?.error?.code || "quote response");
  json("#sandbox-result", result);
  setBusy(button, false);
}

async function sandboxAccept(event) {
  event?.preventDefault();
  const button = event?.submitter || $("#sandbox-accept");
  const quoteId = state.sandboxQuote?.quote_id || state.sandboxQuote?.quote?.quote_id || $("#sandbox-quote-id")?.value || "";
  if (!quoteId) {
    json("#sandbox-result", {ok: false, error: {code: "QUOTE_REQUIRED", message: "Create or paste a sandbox quote first."}});
    return;
  }
  setBusy(button, true);
  const result = await api(`${API}/sandbox/quotes/${encodeURIComponent(quoteId)}/accept`, {
    method: "POST",
    body: {machine_id: machineId()}
  });
  text("#sandbox-current", result.ok ? `accepted ${quoteId}` : result?.error?.code || "accept response");
  json("#sandbox-result", result);
  setBusy(button, false);
}

async function sandboxExecute(event) {
  event?.preventDefault();
  const button = event?.submitter || $("#sandbox-execute");
  const quoteId = state.sandboxQuote?.quote_id || state.sandboxQuote?.quote?.quote_id || $("#sandbox-quote-id")?.value || "";
  if (!quoteId) {
    json("#sandbox-result", {ok: false, error: {code: "QUOTE_REQUIRED", message: "Create or paste a sandbox quote first."}});
    return;
  }
  setBusy(button, true);
  const result = await api(`${API}/sandbox/executions/get-pulse`, {
    method: "POST",
    body: {machine_id: machineId(), quote_id: quoteId}
  });
  state.sandboxReceipt = result.receipt_id || result?.receipt?.receipt_id ? result : null;
  const receiptId = result.receipt_id || result?.receipt?.receipt_id || "";
  if (receiptId && $("#receipt-id")) $("#receipt-id").value = receiptId;
  text("#sandbox-current", receiptId ? `receipt ${receiptId}` : result?.error?.code || "execution response");
  json("#sandbox-result", result);
  setBusy(button, false);
}

async function sandboxVerify(event) {
  event?.preventDefault();
  const button = event?.submitter || $("#sandbox-verify");
  const receiptId = $("#receipt-id")?.value || state.sandboxReceipt?.receipt_id || state.sandboxReceipt?.receipt?.receipt_id || "";
  if (!receiptId) {
    json("#sandbox-result", {ok: false, error: {code: "RECEIPT_REQUIRED", message: "Execute the sandbox call first."}});
    return;
  }
  setBusy(button, true);
  const result = await api(`${API}/sandbox/receipts/verify`, {
    method: "POST",
    body: {receipt_id: receiptId}
  });
  text("#sandbox-current", result.valid === true || result.ok === true ? "receipt verified" : result?.error?.code || "verify response");
  json("#sandbox-result", result);
  setBusy(button, false);
}

function renderCapabilities(filter = "all") {
  const target = $("#capability-list");
  if (!target) return;
  const rows = capabilities.filter(([, , access]) => filter === "all" || access === filter);
  target.innerHTML = rows.map(([name, group, access, route, cli, desc]) => `
    <article class="cap-card" data-access="${access}">
      <b>${name}</b>
      <span>${desc}</span>
      <small>${group} / ${access}</small>
      <span><code>${route}</code></span>
      <span><code>${cli}</code></span>
    </article>
  `).join("");
  text("#capability-count", `${rows.length} capabilities`);
}

function renderCapabilityTable() {
  const body = $("#capability-table-body");
  if (!body) return;
  body.innerHTML = capabilities.map(([name, group, access, route, cli, desc]) => `
    <tr data-access="${access}">
      <td><code>${name}</code></td>
      <td>${group}</td>
      <td>${access}</td>
      <td><code>${route}</code></td>
      <td><code>${cli}</code></td>
      <td>${desc}</td>
    </tr>
  `).join("");
}

function selectSnippet(name) {
  all("[data-snippet]").forEach((button) => button.setAttribute("aria-selected", button.dataset.snippet === name ? "true" : "false"));
  text("#snippet-output", snippets[name] || snippets.curl);
}

async function copySnippet() {
  try {
    await navigator.clipboard.writeText($("#snippet-output")?.textContent || "");
    text("#copy-state", "copied");
  } catch {
    text("#copy-state", "copy unavailable");
  }
}

function wire() {
  $("#sandbox-form")?.addEventListener("submit", sandboxQuote);
  $("#sandbox-quote")?.addEventListener("click", sandboxQuote);
  $("#sandbox-accept")?.addEventListener("click", sandboxAccept);
  $("#sandbox-execute")?.addEventListener("click", sandboxExecute);
  $("#sandbox-verify")?.addEventListener("click", sandboxVerify);
  $("#refresh-status")?.addEventListener("click", refreshStatus);
  $("#copy-snippet")?.addEventListener("click", copySnippet);
  all("[data-snippet]").forEach((button) => button.addEventListener("click", () => selectSnippet(button.dataset.snippet)));
  all("[data-filter]").forEach((button) => button.addEventListener("click", () => {
    all("[data-filter]").forEach((b) => b.setAttribute("aria-pressed", b === button ? "true" : "false"));
    renderCapabilities(button.dataset.filter);
  }));
  machineId();
  renderCapabilities("all");
  renderCapabilityTable();
  selectSnippet("curl");
  refreshStatus();
  setInterval(refreshStatus, 60000);
}

document.addEventListener("DOMContentLoaded", wire);
