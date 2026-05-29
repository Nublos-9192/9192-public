# @nineoneninetwo/discovery

Machine-readable discovery helpers for 9192.

Version: 1.0.5
License: Apache-2.0

```js
import { discover9192 } from "@nineoneninetwo/discovery";

const discovery = await discover9192("nineoneninetwo.com.br");
console.log(discovery.edge.endpoint);
```

This package reads public metadata such as:

- `/.well-known/9192/bootstrap.json`
- `/.well-known/agent-card.json`
- `/.well-known/9192/status.json`
- `/.well-known/9192/pricebook.json`
- optional DNS TXT records when running on Node.js
