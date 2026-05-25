# 9192 Public Showcase Checklist

This checklist keeps the first public showcase focused on the linear experience:

```text
discover -> trust -> integrate -> quote -> execute -> verify
```

## Ready to show

- Home points to /start.
- /start points to the free sandbox path.
- Agent Runner guide is published.
- AGENT.md is published for integration.
- npx @nineoneninetwo/demo --mode sandbox completes quote, accept, execute and verify.
- Receipt verification returns valid: true.
- Pricing and funding are introduced after the sandbox proof.

## Do not lead with

- Native CLI.
- MCP bridge.
- C++ bootstrap.
- Docker probe.
- DNS TXT verification.
- Crypto invoice creation.
- Paid execution.

Those are advanced paths after the first verified call works.

## First tester ask

```text
Open https://nineoneninetwo.com.br/start
Run npx @nineoneninetwo/demo --mode sandbox
Tell me whether the receipt verification returned valid=true.
```

## Next operational hardening

- Enable Caddy access logs for IP, route, status and user-agent.
- Log gateway journey events: start viewed, sandbox quote, sandbox execute, receipt verify.
- Keep the short /agent route under bot supervision.
- Publish the updated release kit to GitHub.
