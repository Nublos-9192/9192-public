#!/usr/bin/env node
import { runMcpServer } from "../src/server.mjs";

runMcpServer().catch((err) => {
  process.stderr.write(`9192_mcp_error=${err?.message || err}\n`);
  process.exit(1);
});

