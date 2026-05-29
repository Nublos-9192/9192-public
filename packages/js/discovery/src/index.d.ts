export const DEFAULT_9192_DOMAIN: "nineoneninetwo.com.br";
export const DISCOVERY_VERSION: "1.0.5";

export type JsonObject = Record<string, unknown>;

export interface DiscoverOptions {
  baseUrl?: string;
  skipDns?: boolean;
  fetchOptions?: RequestInit;
}

export interface DiscoveryPages {
  home: string;
  docs: string;
  protocol: string;
  forAgents: string;
  pricing: string;
  status: string;
  trust: string;
  openapi: string;
  llms: string;
  sitemap: string;
  robots: string;
}

export interface DiscoveryEdge {
  host: string;
  port: number;
  endpoint: string;
  protocol: string;
  transport?: string;
}

export interface NineOneNineTwoDiscovery {
  domain: string;
  baseUrl: string;
  pages: DiscoveryPages;
  freemiumPolicy?: unknown;
  txtRecords: string[];
  txt: Record<string, string | boolean>;
  bootstrap: JsonObject;
  agentCard: JsonObject;
  status: JsonObject;
  pricebook: JsonObject;
  edge: DiscoveryEdge;
}

export function parse9192Txt(text: string): Record<string, string | boolean>;
export function fetchJson<T = JsonObject>(url: string, options?: RequestInit): Promise<T>;
export function fetchText(url: string, options?: RequestInit): Promise<string>;
export function resolve9192Txt(domain?: string): Promise<string[]>;
export function discover9192(domain?: string, options?: DiscoverOptions): Promise<NineOneNineTwoDiscovery>;
