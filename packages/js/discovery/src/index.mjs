export const DEFAULT_9192_DOMAIN = "nineoneninetwo.com.br";

export function parse9192Txt(text) {
  const out = {};
  for (const part of String(text || "").split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      out[trimmed] = true;
      continue;
    }
    out[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return out;
}

export async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "accept": "application/json",
      "user-agent": "9192-discovery-js/0.1",
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    throw new Error(`GET ${url} failed with HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchText(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "accept": "text/plain, application/json;q=0.9, */*;q=0.1",
      "user-agent": "9192-discovery-js/0.1",
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    throw new Error(`GET ${url} failed with HTTP ${response.status}`);
  }
  return response.text();
}

export async function resolve9192Txt(domain = DEFAULT_9192_DOMAIN) {
  try {
    const dns = await import("node:dns/promises");
    const records = await dns.resolveTxt(`_9192.${domain}`);
    return records.map((parts) => parts.join(""));
  } catch {
    return [];
  }
}

export async function discover9192(domain = DEFAULT_9192_DOMAIN, options = {}) {
  const base = options.baseUrl || `https://${domain}`;
  const wellKnownBase = `${base}/.well-known/9192`;
  const [txtRecords, bootstrap, agentCard, status, pricebook] = await Promise.all([
    options.skipDns ? Promise.resolve([]) : resolve9192Txt(domain),
    fetchJson(`${wellKnownBase}/bootstrap.json`, options.fetchOptions),
    fetchJson(`${base}/.well-known/agent-card.json`, options.fetchOptions),
    fetchJson(`${wellKnownBase}/status.json`, options.fetchOptions),
    fetchJson(`${wellKnownBase}/pricebook.json`, options.fetchOptions)
  ]);
  const txt = txtRecords.length ? parse9192Txt(txtRecords[0]) : {};
  const edge = bootstrap.edge || agentCard.endpoint || {};
  return {
    domain,
    baseUrl: base,
    pages: {
      home: `${base}/`,
      docs: `${base}/docs`,
      protocol: `${base}/protocol`,
      forAgents: `${base}/for-agents`,
      pricing: `${base}/pricing`,
      status: `${base}/status`,
      trust: `${base}/trust`,
      openapi: `${base}/openapi.json`,
      llms: `${base}/llms.txt`,
      sitemap: `${base}/sitemap.xml`,
      robots: `${base}/robots.txt`
    },
    freemiumPolicy: pricebook.freemium_policy || bootstrap.freemium_policy || agentCard.freemium_policy,
    txtRecords,
    txt,
    bootstrap,
    agentCard,
    status,
    pricebook,
    edge: {
      host: edge.host || txt.edge?.split(":")[0] || "edge.nineoneninetwo.com.br",
      port: Number(edge.port || txt.edge?.split(":")[1] || 9443),
      endpoint: edge.endpoint || txt.edge || "edge.nineoneninetwo.com.br:9443",
      protocol: edge.protocol || bootstrap.edge?.protocol || "9192/1",
      transport: edge.transport || bootstrap.edge?.transport || agentCard.preferredTransport
    }
  };
}
