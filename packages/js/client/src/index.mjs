import { DEFAULT_9192_DOMAIN, discover9192 } from "@nineoneninetwo/discovery";

export const CLIENT_VERSION = "1.0.5";

function cleanBase(baseUrl) {
  return String(baseUrl || "").replace(/\/+$/, "");
}

function requireValue(name, value) {
  if (value === undefined || value === null || value === "") {
    throw new TypeError(`${name} is required`);
  }
  return value;
}

function requirePositiveNumber(name, value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new TypeError(`${name} must be a positive number`);
  }
  return n;
}

export class NineOneNineTwoApiError extends Error {
  constructor(response, payload) {
    const code = payload?.error?.code || `HTTP_${response.status}`;
    const message = payload?.error?.message || response.statusText || "9192 API request failed";
    super(`${code}: ${message}`);
    this.name = "NineOneNineTwoApiError";
    this.status = response.status;
    this.payload = payload;
    this.code = code;
  }
}

function apiError(response, payload) {
  const code = payload?.error?.code || `HTTP_${response.status}`;
  const message = payload?.error?.message || response.statusText || "9192 API request failed";
  return new NineOneNineTwoApiError(response, payload || { error: { code, message } });
}

export class NineOneNineTwoClient {
  constructor(options = {}) {
    this.domain = options.domain || DEFAULT_9192_DOMAIN;
    this.baseUrl = cleanBase(options.baseUrl || `https://${this.domain}`);
    this.apiBase = `${this.baseUrl}/api/v1`;
    this.fetchOptions = options.fetchOptions || {};
    this.timeoutMs = options.timeoutMs || 20000;
  }

  static async discover(domain = DEFAULT_9192_DOMAIN, options = {}) {
    const discovery = await discover9192(domain, options);
    const client = new NineOneNineTwoClient({ domain, baseUrl: discovery.baseUrl, fetchOptions: options.fetchOptions });
    client.discovery = discovery;
    return client;
  }

  async request(method, path, body, options = {}) {
    const timeoutMs = options.timeoutMs || this.timeoutMs;
    const controller = !options.signal && timeoutMs > 0 ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    const headers = {
      "accept": "application/json",
      "user-agent": `9192-client-js/${CLIENT_VERSION}`
    };
    const init = {
      method,
      ...this.fetchOptions,
      signal: options.signal || this.fetchOptions.signal || controller?.signal,
      headers: {
        ...headers,
        ...(this.fetchOptions.headers || {})
      }
    };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
      init.headers["content-type"] = "application/json";
    }
    try {
      const response = await fetch(`${this.baseUrl}${path}`, init);
      const text = await response.text();
      let payload = null;
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          payload = { ok: false, raw: text };
        }
      }
      if (!response.ok || payload?.ok === false) throw apiError(response, payload);
      return payload;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  status() { return this.request("GET", "/api/v1/status"); }
  discoveryInfo() { return this.request("GET", "/api/v1/discovery"); }
  manifest() { return this.request("GET", "/api/v1/manifest"); }
  pricebook() { return this.request("GET", "/api/v1/pricebook"); }
  paymentInfo() { return this.request("GET", "/api/v1/payment-info"); }
  health() { return this.request("GET", "/api/v1/health"); }
  hello() { return this.request("GET", "/api/v1/hello"); }
  caps() { return this.request("GET", "/api/v1/caps"); }
  openapi() { return this.request("GET", "/openapi.json"); }

  sandboxQuoteGetPulse({ machineId = "sandbox_machine", bits = 65536, maxOutput = 8192, priority = "normal" } = {}) {
    return this.request("POST", "/api/v1/sandbox/quotes/get-pulse", {
      machine_id: machineId,
      bits,
      max_output: maxOutput,
      priority
    });
  }

  sandboxAcceptQuote({ machineId = "sandbox_machine", quoteId } = {}) {
    requireValue("quoteId", quoteId);
    return this.request("POST", `/api/v1/sandbox/quotes/${encodeURIComponent(quoteId || "")}/accept`, {
      machine_id: machineId
    });
  }

  sandboxExecuteGetPulse({ machineId = "sandbox_machine", quoteId } = {}) {
    requireValue("quoteId", quoteId);
    return this.request("POST", "/api/v1/sandbox/executions/get-pulse", {
      machine_id: machineId,
      quote_id: quoteId
    });
  }

  sandboxVerifyReceipt({ receiptId, receipt } = {}) {
    if (!receiptId && !receipt) requireValue("receiptId or receipt", "");
    return this.request("POST", "/api/v1/sandbox/receipts/verify", {
      ...(receiptId ? { receipt_id: receiptId } : {}),
      ...(receipt ? { receipt } : {})
    });
  }

  quoteGetPulse({ machineId, bits = 65536, maxOutput = 8192, priority = "normal", idempotencyKey } = {}) {
    requireValue("machineId", machineId);
    return this.request("POST", "/api/v1/quotes/get-pulse", {
      machine_id: machineId,
      bits: requirePositiveNumber("bits", bits),
      max_output: requirePositiveNumber("maxOutput", maxOutput),
      priority,
      ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {})
    });
  }

  quoteMakeBct({ machineId, inputBytes, bits = 65536, maxOutput = 8192, outputBytes, priority = "normal", idempotencyKey } = {}) {
    requireValue("machineId", machineId);
    return this.request("POST", "/api/v1/quotes/make-bct", {
      machine_id: machineId,
      input_bytes: requirePositiveNumber("inputBytes", inputBytes),
      bits: requirePositiveNumber("bits", bits),
      max_output: requirePositiveNumber("maxOutput", maxOutput),
      priority,
      ...(outputBytes !== undefined ? { output_bytes: outputBytes } : {}),
      ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {})
    });
  }

  quoteVerifyBct({ machineId, inputBytes, bits = 65536, maxOutput = 8192, outputBytes, priority = "normal", idempotencyKey } = {}) {
    requireValue("machineId", machineId);
    return this.request("POST", "/api/v1/quotes/verify-bct", {
      machine_id: machineId,
      input_bytes: requirePositiveNumber("inputBytes", inputBytes),
      bits: requirePositiveNumber("bits", bits),
      max_output: requirePositiveNumber("maxOutput", maxOutput),
      priority,
      ...(outputBytes !== undefined ? { output_bytes: outputBytes } : {}),
      ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {})
    });
  }

  acceptQuote({ machineId, quoteId } = {}) {
    requireValue("machineId", machineId);
    requireValue("quoteId", quoteId);
    return this.request("POST", `/api/v1/quotes/${encodeURIComponent(quoteId || "")}/accept`, {
      machine_id: machineId
    });
  }

  createInvoice({ machineId, units, network = "TRON", asset = "USDT" } = {}) {
    requireValue("machineId", machineId);
    return this.request("POST", "/api/v1/invoices", {
      machine_id: machineId,
      units: requirePositiveNumber("units", units),
      network,
      asset
    });
  }

  invoiceStatus({ invoiceId, machineId } = {}) {
    requireValue("invoiceId", invoiceId);
    const qs = machineId ? `?machine_id=${encodeURIComponent(machineId)}` : "";
    return this.request("GET", `/api/v1/invoices/${encodeURIComponent(invoiceId || "")}${qs}`);
  }

  executeGetPulse({ machineId, quoteId, bits = 65536 } = {}) {
    requireValue("machineId", machineId);
    requireValue("quoteId", quoteId);
    return this.request("POST", "/api/v1/executions/get-pulse", {
      machine_id: machineId,
      quote_id: quoteId,
      bits: requirePositiveNumber("bits", bits)
    });
  }

  executeMakeBct({ machineId, quoteId, plainHex, key = "9192_public_bct_key", bits = 65536 } = {}) {
    requireValue("machineId", machineId);
    requireValue("quoteId", quoteId);
    requireValue("plainHex", plainHex);
    return this.request("POST", "/api/v1/executions/make-bct", {
      machine_id: machineId,
      quote_id: quoteId,
      plain_hex: plainHex,
      key,
      bits: requirePositiveNumber("bits", bits)
    });
  }

  executeVerifyBct({ machineId, quoteId, packetHex, key = "9192_public_bct_key" } = {}) {
    requireValue("machineId", machineId);
    requireValue("quoteId", quoteId);
    requireValue("packetHex", packetHex);
    return this.request("POST", "/api/v1/executions/verify-bct", {
      machine_id: machineId,
      quote_id: quoteId,
      packet_hex: packetHex,
      key
    });
  }

  receipt({ receiptId, machineId } = {}) {
    requireValue("receiptId", receiptId);
    const qs = machineId ? `?machine_id=${encodeURIComponent(machineId)}` : "";
    return this.request("GET", `/api/v1/receipts/${encodeURIComponent(receiptId || "")}${qs}`);
  }

  verifyReceipt({ receiptId, receipt, machineId } = {}) {
    if (!receiptId && !receipt) requireValue("receiptId or receipt", "");
    return this.request("POST", "/api/v1/receipts/verify", {
      machine_id: machineId,
      ...(receiptId ? { receipt_id: receiptId } : {}),
      ...(receipt ? { receipt } : {})
    });
  }
}

export async function create9192Client(options = {}) {
  if (options.discover !== false) {
    return NineOneNineTwoClient.discover(options.domain || DEFAULT_9192_DOMAIN, options);
  }
  return new NineOneNineTwoClient(options);
}
