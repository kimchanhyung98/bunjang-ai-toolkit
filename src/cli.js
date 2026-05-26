import { spawn } from "node:child_process";
import {
  EXECUTION_MODES,
  POLICY,
  executionModeForCapability,
  getCapability,
  getRuntimeConfig
} from "./config.js";

const LOGIN_REQUIRED_CAPABILITIES = new Set(POLICY.loginRequiredCapabilityIds);
const DEFAULT_COMMAND_TIMEOUT_MS = 60_000;

export function createBunjangCli({
  bin = getRuntimeConfig().bunjangCliBin,
  run = runCommand,
  timeoutMs = DEFAULT_COMMAND_TIMEOUT_MS,
  killGraceMs = SIGKILL_GRACE_MS
} = {}) {
  return {
    async execute(capabilityId, params = {}) {
      if (executionModeForCapability(capabilityId) === EXECUTION_MODES.DENY) {
        throw new Error(`Capability is deny mode and cannot be executed: ${capabilityId}`);
      }

      const args = ["--json", ...buildCapabilityArgs(capabilityId, params)];
      const result = await run(bin, args, { timeoutMs, killGraceMs });

      if (result.exitCode === null) {
        throw new Error(result.stderr || `Failed to spawn bunjang-cli at ${bin}`);
      }

      if (result.exitCode !== 0) {
        throw new Error(result.stderr || `bunjang-cli failed with exit code ${result.exitCode}`);
      }

      if (result.stderr) {
        process.stderr.write(`bunjang-cli stderr (${capabilityId}): ${result.stderr}\n`);
      }

      return parseJson(result.stdout, capabilityId);
    }
  };
}

export async function executeCapability(cli, capabilityId, params = {}) {
  const executionMode = executionModeForCapability(capabilityId);

  if (executionMode === EXECUTION_MODES.DENY) {
    return {
      status: "manual_only",
      capabilityId
    };
  }

  if (LOGIN_REQUIRED_CAPABILITIES.has(capabilityId)) {
    const authStatus = await cli.execute("auth.status", {});

    if (!isAuthenticated(authStatus)) {
      return {
        status: "login_required",
        capabilityId,
        authStatus
      };
    }
  }

  return {
    status: "executed",
    capabilityId,
    result: await cli.execute(capabilityId, params)
  };
}

function isAuthenticated(authStatus) {
  return authStatus?.authenticated === true || authStatus?.status?.authenticated === true;
}

export function buildCapabilityArgs(id, params = {}) {
  const capability = getCapability(id);

  if (capability.executionMode === EXECUTION_MODES.DENY) {
    throw new Error(`Capability is deny mode and cannot be executed: ${id}`);
  }

  if (!capability.command) {
    throw new Error(`Capability cannot be executed by bunjang-cli: ${id}`);
  }

  switch (id) {
    case "auth.status":
    case "auth.logout":
    case "chat.list":
    case "favorite.list":
      return compact([capability.command, capability.subcommand]);
    case "search.listings":
      return buildSearchArgs(capability.command, params);
    case "agent-search-rank":
      return buildAgentSearchRankArgs(capability.command, params);
    case "item.get":
    case "purchase.prepare":
      return compact([capability.command, capability.subcommand, required(params.listingId, "listingId")]);
    case "item.list":
      return [
        capability.command,
        capability.subcommand,
        "--ids",
        requiredArray(params.listingIds, "listingIds").join(",")
      ];
    case "chat.read":
      return compact([capability.command, capability.subcommand, required(params.threadId, "threadId")]);
    case "chat.start":
      return buildChatStartArgs(capability, params);
    case "chat.send":
      return [
        capability.command,
        capability.subcommand,
        required(params.threadId, "threadId"),
        "--message",
        required(params.message, "message")
      ];
    case "favorite.add":
    case "favorite.remove":
      return compact([capability.command, capability.subcommand, required(params.listingId, "listingId")]);
    default:
      throw new Error(`No argument builder for capability: ${id}`);
  }
}

function parseJson(stdout, capabilityId) {
  const text = String(stdout ?? "").trim();

  if (!text) {
    throw new Error(`bunjang-cli produced no output for ${capabilityId}`);
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(
      `Failed to parse bunjang-cli JSON output for ${capabilityId}: ${error.message}. Output: ${snippet(text)}`
    );
  }
}

const SIGKILL_GRACE_MS = 2_000;

function runCommand(
  cmd,
  args,
  {
    timeoutMs = DEFAULT_COMMAND_TIMEOUT_MS,
    killGraceMs = SIGKILL_GRACE_MS
  } = {}
) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let settled = false;
    let timedOut = false;
    let killTimeoutId = null;

    const finish = (result) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeoutId);
        clearTimeout(killTimeoutId);
        resolve(result);
      }
    };

    const timeoutId = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      killTimeoutId = setTimeout(() => {
        child.kill("SIGKILL");
        finish(timeoutResult(stdout, timeoutMs));
      }, killGraceMs);
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      finish({ exitCode: null, stdout, stderr: error.message });
    });
    child.on("close", (exitCode) => {
      finish(timedOut ? timeoutResult(stdout, timeoutMs) : { exitCode, stdout, stderr });
    });
  });
}

function timeoutResult(stdout, timeoutMs) {
  return {
    exitCode: 124,
    stdout,
    stderr: `bunjang-cli timed out after ${timeoutMs}ms`
  };
}

function buildSearchArgs(command, params) {
  const args = [command, required(params.query, "query")];
  appendOption(args, "--price-min", params.priceMin);
  appendOption(args, "--price-max", params.priceMax);
  appendOption(args, "--max-items", params.maxItems);
  appendOption(args, "--start-page", params.startPage);
  appendOption(args, "--pages", params.pages);
  appendOption(args, "--sort", params.sort);

  if (params.withDetail) args.push("--with-detail");
  if (params.ai) args.push("--ai");
  appendOption(args, "--output", params.output);
  appendOption(args, "--concurrency", params.concurrency);

  return args;
}

function buildAgentSearchRankArgs(command, params) {
  for (const unsupported of ["withDetail", "ai", "output", "concurrency"]) {
    if (params[unsupported] !== undefined) {
      throw new Error(`agent-search-rank does not accept ${unsupported}`);
    }
  }

  const args = [command, required(params.query, "query")];
  appendOption(args, "--price-min", params.priceMin);
  appendOption(args, "--price-max", params.priceMax);
  appendOption(args, "--max-items", params.maxItems);
  appendOption(args, "--start-page", params.startPage);
  appendOption(args, "--pages", params.pages);
  appendOption(args, "--sort", params.sort);

  return args;
}

function buildChatStartArgs(capability, params) {
  const args = [
    capability.command,
    capability.subcommand,
    required(params.listingId, "listingId")
  ];

  if (params.message) {
    args.push("--message", String(params.message));
  }

  return args;
}

function appendOption(args, flag, value) {
  if (value !== undefined && value !== null && value !== "") {
    args.push(flag, String(value));
  }
}

function snippet(text) {
  const normalized = text.replace(/\s+/g, " ");
  return normalized.length > 200 ? `${normalized.slice(0, 200)}...` : normalized;
}

function required(value, name) {
  if (value === undefined || value === null || value === "") {
    throw new Error(`${name} is required`);
  }

  return String(value);
}

function requiredArray(value, name) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${name} is required`);
  }

  return value.map((item) => String(item));
}

function compact(values) {
  return values.filter((value) => value !== undefined && value !== null && value !== "");
}
