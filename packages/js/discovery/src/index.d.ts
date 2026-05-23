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

