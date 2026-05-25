# 9192 Agent Runner

The 9192 Agent Runner is the recommended first integration path for customers and automated systems.

It is intentionally small. It does not decide to spend money by itself. It helps a client discover the public node, run the free sandbox, verify the returned receipt, and only then move to paid execution with an explicit quote.

## Canonical first run

```bash
npx @nineoneninetwo/demo --mode sandbox
```

The sandbox mode runs:

```text
discover -> quote -> accept -> execute -> verify receipt
```

Expected result: the command prints a sandbox quote, an accepted quote, a test execution response, and a receipt verification response.

## Smoke check

```bash
npx @nineoneninetwo/demo --mode smoke
```

Smoke mode creates quotes only. It does not execute paid work.

## Paid execution

Paid execution should happen only after the sandbox flow works and the customer has funded the selected machine account.

```bash
npx @nineoneninetwo/demo --mode paid-flow --machine customer_machine_001
```

If the machine account has no settled balance, the paid flow should fail before execution. That is expected and safer than implicit spending.

## Related links

- Start guide: https://nineoneninetwo.com.br/start
- Agent guide: https://nineoneninetwo.com.br/agent
- OpenAPI: https://nineoneninetwo.com.br/openapi.json
- Machine discovery: https://nineoneninetwo.com.br/.well-known/9192/
- Agent card: https://nineoneninetwo.com.br/.well-known/agent.json
- Trust center: https://nineoneninetwo.com.br/trust
