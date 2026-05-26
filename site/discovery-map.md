# 9192 Discovery Map

- Generated: 2026-05-26T02:23:39.3789082-04:00
- Domain: nineoneninetwo.com.br
- Overall: WARN
- Public route/file issues: 0
- Report issues: 0
- Report warnings: 1

```mermaid
flowchart LR
  dns[DNS] --> site[Public site]
  site --> wellknown[.well-known]
  wellknown --> agents[Agent metadata]
  agents --> api[HTTPS API]
  agents --> edge[Native 9192 edge]
  api --> receipts[Verifiable receipts]
  edge --> receipts
  reports[Trust, traffic and DNS reports] --> dns
  reports --> site
```

## Public checks
- [OK] public_files / agent-directory.json: size=480 updated=2026-05-25T21:56:31
- [OK] public_files / agents.json: size=685 updated=2026-05-25T21:56:31
- [OK] public_files / dns reputation policy: size=2352 updated=2026-05-25T21:56:31
- [OK] public_files / llms.txt: size=5448 updated=2026-05-25T21:59:23
- [OK] public_files / mcp.json: size=642 updated=2026-05-25T21:56:31
- [OK] public_files / privacy.html: size=3566 updated=2026-05-25T23:23:12
- [OK] public_files / robots.txt: size=860 updated=2026-05-26T02:22:54
- [OK] public_files / sitemap.xml: size=3837 updated=2026-05-26T02:22:47
- [OK] public_routes / agent directory: HTTP 200 https://nineoneninetwo.com.br/agent-directory.json
- [OK] public_routes / agents json: HTTP 200 https://nineoneninetwo.com.br/agents.json
- [OK] public_routes / api status: HTTP 200 https://nineoneninetwo.com.br/api/v1/status
- [OK] public_routes / discovery map page: HTTP 200 https://nineoneninetwo.com.br/discovery-map
- [OK] public_routes / home: HTTP 200 https://nineoneninetwo.com.br/
- [OK] public_routes / llms txt: HTTP 200 https://nineoneninetwo.com.br/llms.txt
- [OK] public_routes / mcp json: HTTP 200 https://nineoneninetwo.com.br/mcp.json
- [OK] public_routes / privacy page: HTTP 200 https://nineoneninetwo.com.br/privacy
- [OK] public_routes / sitemap: HTTP 200 https://nineoneninetwo.com.br/sitemap.xml
- [OK] public_routes / status page: HTTP 200 https://nineoneninetwo.com.br/status
- [OK] public_routes / well-known agents: HTTP 200 https://nineoneninetwo.com.br/.well-known/agents.json
- [OK] public_routes / well-known mcp card: HTTP 200 https://nineoneninetwo.com.br/.well-known/mcp/server-card.json

## Report summaries
- operational_trust: overall=OK generated=2026-05-25T22:05:52.8394242-04:00
- traffic: overall=OK generated=2026-05-26T01:45:12.9201579-04:00
- dns_reputation: overall=WARN generated=2026-05-25T22:56:36.3582409-04:00
- discovery_conversion: overall=GOOD generated=2026-05-26T02:23:32.9355504-04:00

## Discovery edges
- dns -> site: domain resolves to public HTTPS
- site -> well_known: site links machine-readable metadata
- well_known -> agents: agents discover capabilities
- agents -> api: HTTP clients can start with JSON endpoints
- agents -> edge: native clients can connect to 9192/1
- api -> receipts: sandbox and quote flows produce verifiable receipts
- edge -> receipts: native execution returns verifiable receipts
- reports -> dns: DNS reputation tracks public discoverability
- reports -> site: traffic and trust reports watch public access
