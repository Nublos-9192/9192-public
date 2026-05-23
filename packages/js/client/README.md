# @nineoneninetwo/client

HTTP/JSON client for the public 9192 API facade.

```js
import { NineOneNineTwoClient } from "@nineoneninetwo/client";

const client = await NineOneNineTwoClient.discover("nineoneninetwo.com.br");
const quote = await client.quoteGetPulse({ machineId: "demo", bits: 65536 });
console.log(quote);
```

The client uses `https://nineoneninetwo.com.br/api/v1`. It does not bypass the
9192 TLS edge or talk directly to the private backend.

