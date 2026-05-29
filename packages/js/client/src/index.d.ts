export const CLIENT_VERSION: "1.0.5";

export type JsonObject = Record<string, unknown>;

export interface NineOneNineTwoClientOptions {
  domain?: string;
  baseUrl?: string;
  fetchOptions?: RequestInit;
  timeoutMs?: number;
  discover?: boolean;
}

export interface RequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export class NineOneNineTwoApiError extends Error {
  name: "NineOneNineTwoApiError";
  status: number;
  payload: JsonObject | null;
  code: string;
  constructor(response: Response, payload: JsonObject | null);
}

export interface DiscoverySummary {
  domain: string;
  baseUrl: string;
  pages: Record<string, string>;
  txtRecords: string[];
  txt: Record<string, string | boolean>;
  bootstrap: JsonObject;
  agentCard: JsonObject;
  status: JsonObject;
  pricebook: JsonObject;
  edge: {
    host: string;
    port: number;
    endpoint: string;
    protocol: string;
    transport?: string;
  };
}

export interface ApiStatus extends JsonObject {
  ok?: boolean;
  status?: string;
  protocol?: string;
}

export interface ApiHealth extends JsonObject {
  ok?: boolean;
  health?: string;
  diagnostics?: string;
  runtime_state?: string;
  edge_path?: string;
}

export interface CapabilityInfo {
  command: string;
  group: string;
  access: string;
  http: string;
  http_available: boolean;
  cli: string;
  cli_available: boolean;
  purpose: string;
}

export interface CapsResponse extends JsonObject {
  protocol?: string;
  capability_count?: number;
  capabilities?: string[];
  capability_matrix?: CapabilityInfo[];
}

export interface QuoteRequest {
  machineId: string;
  bits?: number;
  maxOutput?: number;
  priority?: string;
  idempotencyKey?: string;
}

export interface BctQuoteRequest extends QuoteRequest {
  inputBytes: number;
  outputBytes?: number;
}

export interface QuoteResponse extends JsonObject {
  ok?: boolean;
  quote_id?: string;
  quote_status?: string;
  amount_units?: number;
  expires_at_unix?: number;
}

export interface AcceptQuoteRequest {
  machineId: string;
  quoteId: string;
}

export interface ExecutionRequest {
  machineId: string;
  quoteId: string;
  bits?: number;
}

export interface MakeBctExecutionRequest extends ExecutionRequest {
  plainHex: string;
  key?: string;
}

export interface VerifyBctExecutionRequest {
  machineId: string;
  quoteId: string;
  packetHex: string;
  key?: string;
}

export interface ExecutionResult extends JsonObject {
  ok?: boolean;
  receipt_id?: string;
  receipt?: JsonObject | string;
}

export interface SandboxQuoteRequest {
  machineId?: string;
  bits?: number;
  maxOutput?: number;
  priority?: string;
}

export interface SandboxQuoteRef {
  machineId?: string;
  quoteId: string;
}

export interface ReceiptVerifyRequest {
  machineId?: string;
  receiptId?: string;
  receipt?: string | JsonObject;
}

export interface ReceiptVerifyResponse extends JsonObject {
  ok?: boolean;
  verified?: boolean;
  receipt_id?: string;
}

export interface InvoiceCreateRequest {
  machineId: string;
  units: number;
  network?: "TRON" | "Solana" | "Base" | string;
  asset?: "USDT" | "USDC" | string;
}

export interface InvoiceResponse extends JsonObject {
  ok?: boolean;
  invoice_id?: string;
  network?: string;
  asset?: string;
  units?: number;
  status?: string;
}

export interface InvoiceStatusRequest {
  invoiceId: string;
  machineId?: string;
}

export class NineOneNineTwoClient {
  constructor(options?: NineOneNineTwoClientOptions);
  static discover(domain?: string, options?: NineOneNineTwoClientOptions): Promise<NineOneNineTwoClient>;
  domain: string;
  baseUrl: string;
  apiBase: string;
  timeoutMs: number;
  discovery?: DiscoverySummary;
  request<T = JsonObject>(method: string, path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  status(): Promise<ApiStatus>;
  discoveryInfo(): Promise<JsonObject>;
  manifest(): Promise<JsonObject>;
  pricebook(): Promise<JsonObject>;
  paymentInfo(): Promise<JsonObject>;
  health(): Promise<ApiHealth>;
  hello(): Promise<JsonObject>;
  caps(): Promise<CapsResponse>;
  openapi(): Promise<JsonObject>;
  sandboxQuoteGetPulse(args?: SandboxQuoteRequest): Promise<QuoteResponse>;
  sandboxAcceptQuote(args: SandboxQuoteRef): Promise<JsonObject>;
  sandboxExecuteGetPulse(args: SandboxQuoteRef): Promise<ExecutionResult>;
  sandboxVerifyReceipt(args: ReceiptVerifyRequest): Promise<ReceiptVerifyResponse>;
  quoteGetPulse(args: QuoteRequest): Promise<QuoteResponse>;
  quoteMakeBct(args: BctQuoteRequest): Promise<QuoteResponse>;
  quoteVerifyBct(args: BctQuoteRequest): Promise<QuoteResponse>;
  acceptQuote(args: AcceptQuoteRequest): Promise<JsonObject>;
  createInvoice(args: InvoiceCreateRequest): Promise<InvoiceResponse>;
  invoiceStatus(args: InvoiceStatusRequest): Promise<InvoiceResponse>;
  executeGetPulse(args: ExecutionRequest): Promise<ExecutionResult>;
  executeMakeBct(args: MakeBctExecutionRequest): Promise<ExecutionResult>;
  executeVerifyBct(args: VerifyBctExecutionRequest): Promise<ExecutionResult>;
  /** Reserved by the public API contract; the public gateway currently returns 404. */
  receipt(args: { receiptId: string; machineId?: string }): Promise<JsonObject>;
  verifyReceipt(args: ReceiptVerifyRequest): Promise<ReceiptVerifyResponse>;
}

export function create9192Client(options?: NineOneNineTwoClientOptions): Promise<NineOneNineTwoClient>;
