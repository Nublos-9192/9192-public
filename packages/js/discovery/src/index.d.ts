export const DEFAULT_9192_DOMAIN: string;
export function parse9192Txt(text: string): Record<string, string | boolean>;
export function fetchJson(url: string, options?: RequestInit): Promise<any>;
export function fetchText(url: string, options?: RequestInit): Promise<string>;
export function resolve9192Txt(domain?: string): Promise<string[]>;
export function discover9192(domain?: string, options?: {
  baseUrl?: string;
  skipDns?: boolean;
  fetchOptions?: RequestInit;
}): Promise<any>;
export type NineOneNineTwoDiscovery = {
  domain: string;
  baseUrl: string;
  pages: Record<string, string>;
  freemiumPolicy?: any;
  txtRecords: string[];
  txt: Record<string, string | boolean>;
  bootstrap: any;
  agentCard: any;
  status: any;
  pricebook: any;
  edge: any;
};
