#!/usr/bin/env node

import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";
import { createBunjangCli, executeCapability } from "./cli.js";
import { getRuntimeConfig } from "./config.js";

export async function runCli(
  args = process.argv.slice(2),
  { env = process.env } = {}
) {
  const [capabilityId, paramsJson] = args;

  if (!capabilityId) {
    throw new Error(
      "Usage: bunjang-assistant-run <capabilityId> [paramsJson] (local clone: npm run bunjang -- <capabilityId> [paramsJson])"
    );
  }

  const params = parseParams(paramsJson);
  const runtimeConfig = getRuntimeConfig({ env });
  const result = await executeCapability(
    createBunjangCli({ bin: runtimeConfig.bunjangCliBin }),
    capabilityId,
    params
  );

  return result;
}

function parseParams(paramsJson) {
  if (paramsJson === undefined || paramsJson === "") {
    return {};
  }

  let params;

  try {
    params = JSON.parse(paramsJson);
  } catch (error) {
    throw new Error(`Invalid paramsJson: ${error.message}`);
  }

  if (!params || typeof params !== "object" || Array.isArray(params)) {
    throw new Error("paramsJson must be a JSON object");
  }

  return params;
}

if (isDirectRun(import.meta.url)) {
  runCli()
    .then((result) => {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}

function isDirectRun(moduleUrl) {
  return (
    process.argv[1] &&
    realpathSync(fileURLToPath(moduleUrl)) === realpathSync(process.argv[1])
  );
}
