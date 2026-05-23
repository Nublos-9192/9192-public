# @nineoneninetwo/demo

Autonomous demo for the 9192 public product.

```bash
node ./bin/9192-demo.mjs --mode smoke
node ./bin/9192-demo.mjs --mode paid-flow
node ./bin/9192-demo.mjs --mode paid-sim --local-root C:\9192_system
```

Local operator validation can bypass public hairpin routing while still using
the HTTPS gateway:

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 node ./bin/9192-demo.mjs --mode smoke --base-url https://127.0.0.1
```

The `paid-flow` mode uses the public API only. It requires the selected machine
to already have settled balance.

The `paid-sim` mode is an operator/local demonstration. On Windows it delegates
to `run_9192_public_api_paid_sim_windows.ps1`, which injects a local simulated
payment frame and then proves the paid journey without real crypto:

```text
discover -> status -> payment-info -> quote -> simulated funding -> accept -> execute -> receipt -> verify
```
