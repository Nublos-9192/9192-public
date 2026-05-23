import { DEFAULT_9192_DOMAIN, discover9192 } from "@nineoneninetwo/discovery";

function cleanBase(baseUrl) {
  return String(baseUrl || "").replace(/\/+$/, "");
}

function apiError(response, payload) {
  const code = payload?.error?.code || `HTTP_${response.status}`;
  const message = payload?.error?.message || response.statusText || "9192 API request failed";
  const err = new Error(`${code}: ${message}`);
  err.status = response.status;
  err.payload = payload;
  err.code = code;
  return err;
}

export class NineOneNineTwoClient {
  constructor(options = {}) {
    this.domain = options.domain || DEFAULT_9192_DOMAIN;
    this.baseUrl = cleanBase(options.baseUrl || `https://${this.domain}`);
    this.apiBase = `${this.baseUrl}/api/v1`;
    this.fetchOptions = options.fetchOptions || {};
  }

  static async discover(domain = DEFAULT_9192_DOMAIN, options = {}) {
    const discovery = await discover9192(domain, options);
    const client = new NineOneNineTwoClient({ domain, baseUrl: discovery.baseUrl, fetchOptions: options.fetchOptions });
    client.discovery = discovery;
    return client;
  }

  async request(method, path, body) {
    const headers = {
      "accept": "application/json",
      "user-agent": "9192-client-js/0.1"
    };
    const init = {
      method,
      ...this.fetchOptions,
      headers: {
        ...headers,
        ...(this.fetchOptions.headers || {})
      }
    };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
      init.headers["content-type"] = "application/json";
    }
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

  quoteGetPulse({ machineId, bits = 65536, maxOutput = 8192, priority = "normal", idempotencyKey } = {}) {
    return this.request("POST", "/api/v1/quotes/get-pulse", {
      machine_id: machineId,
      bits,
      max_output: maxOutput,
      priority,
      ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {})
    });
  }

  quoteMakeBct({ machineId, inputBytes, bits = 65536, maxOutput = 8192, outputBytes, priority = "normal", idempotencyKey } = {}) {
    return this.request("POST", "/api/v1/quotes/make-bct", {
      machine_id: machineId,
      input_bytes: inputBytes,
      bits,
      max_output: maxOutput,
      priority,
      ...(outputBytes !== undefined ? { output_bytes: outputBytes } : {}),
      ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {})
    });
  }

  quoteVerifyBct({ machineId, inputBytes, bits = 65536, maxOutput = 8192, outputBytes, priority = "normal", idempotencyKey } = {}) {
    return this.request("POST", "/api/v1/quotes/verify-bct", {
      machine_id: machineId,
      input_bytes: inputBytes,
      bits,
      max_output: maxOutput,
      priority,
      ...(outputBytes !== undefined ? { output_bytes: outputBytes } : {}),
      ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {})
    });
  }

  acceptQuote({ machineId, quoteId } = {}) {
    return this.request("POST", `/api/v1/quotes/${encodeURIComponent(quoteId || "")}/accept`, {
      machine_id: machineId
    });
  }

  createInvoice({ machineId, units, network = "TRON", asset = "USDT" } = {}) {
    return this.request("POST", "/api/v1/invoices", {
      machine_id: machineId,
      units,
      network,
      asset
    });
  }

  invoiceStatus({ invoiceId, machineId } = {}) {
    const qs = machineId ? `?machine_id=${encodeURIComponent(machineId)}` : "";
    return this.request("GET", `/api/v1/invoices/${encodeURIComponent(invoiceId || "")}${qs}`);
  }

  executeGetPulse({ machineId, quoteId, bits = 65536 } = {}) {
    return this.request("POST", "/api/v1/executions/get-pulse", {
      machine_id: machineId,
      quote_id: quoteId,
      bits
    });
  }

  executeMakeBct({ machineId, quoteId, plainHex, key = "9192_public_bct_key", bits = 65536 } = {}) {
    return this.request("POST", "/api/v1/executions/make-bct", {
      machine_id: machineId,
      quote_id: quoteId,
      plain_hex: plainHex,
      key,
      bits
    });
  }

  executeVerifyBct({ machineId, quoteId, packetHex, key = "9192_public_bct_key" } = {}) {
    return this.request("POST", "/api/v1/executions/verify-bct", {
      machine_id: machineId,
      quote_id: quoteId,
      packet_hex: packetHex,
      key
    });
  }

  receipt({ receiptId, machineId } = {}) {
    const qs = machineId ? `?machine_id=${encodeURIComponent(machineId)}` : "";
    return this.request("GET", `/api/v1/receipts/${encodeURIComponent(receiptId || "")}${qs}`);
  }

  verifyReceipt({ receiptId, receipt, machineId } = {}) {
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

