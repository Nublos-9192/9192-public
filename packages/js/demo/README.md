# @nineoneninetwo/demo

Customer-safe runner for the 9192 public product.

Version: 1.0.5
License: Apache-2.0

Start with the free sandbox. It discovers the node, creates a sandbox quote,
accepts it, executes a test call, and verifies the receipt.

```bash
npx @nineoneninetwo/demo --mode sandbox
```

Local package usage:

```bash
node ./bin/9192-demo.mjs --mode smoke
node ./bin/9192-demo.mjs --mode sandbox
node ./bin/9192-demo.mjs --mode paid-flow --machine customer_machine_001
```

Local operator validation can bypass public hairpin routing while still using
the HTTPS gateway:

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 node ./bin/9192-demo.mjs --mode smoke --base-url https://127.0.0.1
```

The `paid-flow` mode uses the public API only. It requires the selected machine
to already have settled balance and should be used only after sandbox succeeds.

Operator-only local simulation:

```bash
node ./bin/9192-demo.mjs --mode paid-sim --local-root C:\9192_system
```

The `paid-sim` mode is not the public customer path. On Windows it delegates
to `run_9192_public_api_paid_sim_windows.ps1`, which injects a local simulated
payment frame and then proves the paid journey without real crypto:

```text
discover -> status -> payment-info -> quote -> simulated funding -> accept -> execute -> receipt -> verify
```
