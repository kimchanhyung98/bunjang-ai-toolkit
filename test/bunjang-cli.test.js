import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  APP_CONFIG,
  CAPABILITIES,
  EXECUTION_MODES,
  getRuntimeConfig
} from "../src/config.js";
import {
  buildCapabilityArgs,
  createBunjangCli,
  executeCapability
} from "../src/cli.js";

test("configuration explicitly allows supported capabilities and denies manual-only work", () => {
  assert.deepEqual(EXECUTION_MODES, {
    ALLOW: "allow",
    DENY: "deny"
  });
  assert.equal(APP_CONFIG.defaults.bunjangCliBin, "bunjang-cli");

  const byMode = (mode) =>
    CAPABILITIES.filter((capability) => capability.executionMode === mode)
      .map((capability) => capability.id)
      .sort();

  assert.deepEqual(byMode(EXECUTION_MODES.ALLOW), [
    "agent-search-rank",
    "auth.logout",
    "auth.status",
    "chat.list",
    "chat.read",
    "chat.send",
    "chat.start",
    "favorite.add",
    "favorite.list",
    "favorite.remove",
    "item.get",
    "item.list",
    "purchase.prepare",
    "search.listings"
  ]);
  assert.deepEqual(byMode(EXECUTION_MODES.DENY), [
    "account.settings.update",
    "auth.login",
    "purchase.confirm",
    "purchase.start"
  ]);
});

test("runtime config keeps the bunjang-cli binary configurable", () => {
  assert.deepEqual(
    getRuntimeConfig({ env: { BUNJANG_CLI_BIN: "custom-bunjang" } }),
    { bunjangCliBin: "custom-bunjang" }
  );
  assert.deepEqual(getRuntimeConfig({ env: {} }), { bunjangCliBin: "bunjang-cli" });
});

test("argument builder maps only configured capabilities to bunjang-cli commands", () => {
  const cases = [
    ["auth.status", {}, ["auth", "status"]],
    ["auth.logout", {}, ["auth", "logout"]],
    ["search.listings", { query: "아이폰", maxItems: 5, sort: "date", withDetail: true }, ["search", "아이폰", "--max-items", "5", "--sort", "date", "--with-detail"]],
    ["agent-search-rank", { query: "아이폰", maxItems: 3 }, ["agent-search-rank", "아이폰", "--max-items", "3"]],
    ["item.get", { listingId: "item-1" }, ["item", "get", "item-1"]],
    ["item.list", { listingIds: ["item-1", "item-2"] }, ["item", "list", "--ids", "item-1,item-2"]],
    ["chat.list", {}, ["chat", "list"]],
    ["chat.read", { threadId: "thread-1" }, ["chat", "read", "thread-1"]],
    ["chat.start", { listingId: "item-1", message: "문의합니다." }, ["chat", "start", "item-1", "--message", "문의합니다."]],
    ["chat.send", { threadId: "thread-1", message: "답장입니다." }, ["chat", "send", "thread-1", "--message", "답장입니다."]],
    ["favorite.list", {}, ["favorite", "list"]],
    ["favorite.add", { listingId: "item-1" }, ["favorite", "add", "item-1"]],
    ["favorite.remove", { listingId: "item-1" }, ["favorite", "remove", "item-1"]],
    ["purchase.prepare", { listingId: "item-1" }, ["purchase", "prepare", "item-1"]]
  ];

  for (const [capabilityId, params, expected] of cases) {
    assert.deepEqual(buildCapabilityArgs(capabilityId, params), expected, capabilityId);
  }
});

test("denied, unknown, or incomplete work is rejected before spawning bunjang-cli", () => {
  assert.throws(() => buildCapabilityArgs("purchase.start", { listingId: "item-1" }), /deny mode/);
  assert.throws(() => buildCapabilityArgs("purchase.confirm", {}), /deny mode/);
  assert.throws(() => buildCapabilityArgs("account.settings.update", {}), /deny mode/);
  assert.throws(() => buildCapabilityArgs("auth.login", {}), /deny mode/);
  assert.throws(() => buildCapabilityArgs("raw.cli", {}), /Unknown capability/);
  assert.throws(() => buildCapabilityArgs("search.listings", {}), /query is required/);
  assert.throws(() => buildCapabilityArgs("chat.send", { threadId: "thread-1" }), /message is required/);
  assert.throws(
    () => buildCapabilityArgs("agent-search-rank", { query: "아이폰", withDetail: true }),
    /agent-search-rank does not accept withDetail/
  );
  assert.throws(
    () => buildCapabilityArgs("agent-search-rank", { query: "아이폰", ai: true }),
    /agent-search-rank does not accept ai/
  );
});

test("wrapper executes configured commands with --json and parses JSON output", async () => {
  const calls = [];
  const cli = createBunjangCli({
    bin: "bunjang-cli",
    run: async (cmd, args) => {
      calls.push({ cmd, args });
      return { exitCode: 0, stdout: "{\"items\":[]}", stderr: "" };
    }
  });

  assert.deepEqual(await cli.execute("search.listings", { query: "아이폰" }), { items: [] });
  assert.deepEqual(calls, [{ cmd: "bunjang-cli", args: ["--json", "search", "아이폰"] }]);
});

test("wrapper surfaces invalid bunjang-cli JSON output with capability context", async () => {
  const cli = createBunjangCli({
    run: async () => ({ exitCode: 0, stdout: "warning: not json", stderr: "" })
  });

  await assert.rejects(
    () => cli.execute("auth.status"),
    /Failed to parse bunjang-cli JSON output for auth\.status/
  );
});

test("wrapper times out stalled bunjang-cli processes", async () => {
  await withTempDir("bunjang-cli-timeout-", async (dir) => {
    const fakeBin = join(dir, "bunjang-cli");
    await writeFile(fakeBin, "#!/usr/bin/env node\nsetInterval(() => {}, 1000);\n");
    await chmod(fakeBin, 0o755);

    const cli = createBunjangCli({ bin: fakeBin, timeoutMs: 20 });

    await assert.rejects(() => cli.execute("auth.status"), /timed out after 20ms/);
  });
});

test("wrapper force-kills bunjang-cli processes that ignore SIGTERM", async () => {
  await withTempDir("bunjang-cli-ignore-term-", async (dir) => {
    const fakeBin = join(dir, "bunjang-cli");
    await writeFile(
      fakeBin,
      [
        "#!/usr/bin/env node",
        "process.on('SIGTERM', () => {});",
        "setInterval(() => {}, 1000);"
      ].join("\n")
    );
    await chmod(fakeBin, 0o755);

    const cli = createBunjangCli({
      bin: fakeBin,
      timeoutMs: 20,
      killGraceMs: 20
    });

    await assert.rejects(() => cli.execute("auth.status"), /timed out after 20ms/);
  });
});

test("executeCapability enforces login preflight and manual-only policy", async () => {
  const unauthenticatedCalls = [];
  const unauthenticated = {
    execute: async (capabilityId, params = {}) => {
      unauthenticatedCalls.push({ capabilityId, params });
      return { status: { authenticated: false, headfulLoginRequired: true } };
    }
  };

  assert.deepEqual(await executeCapability(unauthenticated, "chat.list"), {
    status: "login_required",
    capabilityId: "chat.list",
    authStatus: { status: { authenticated: false, headfulLoginRequired: true } }
  });
  assert.deepEqual(unauthenticatedCalls, [{ capabilityId: "auth.status", params: {} }]);

  const authenticatedCalls = [];
  const authenticated = {
    execute: async (capabilityId, params = {}) => {
      authenticatedCalls.push({ capabilityId, params });
      if (capabilityId === "auth.status") return { status: { authenticated: true } };
      return { ok: true };
    }
  };

  assert.deepEqual(
    await executeCapability(authenticated, "chat.send", {
      threadId: "thread-1",
      message: "답장입니다."
    }),
    {
      status: "executed",
      capabilityId: "chat.send",
      result: { ok: true }
    }
  );
  assert.deepEqual(authenticatedCalls.map((call) => call.capabilityId), ["auth.status", "chat.send"]);

  assert.deepEqual(await executeCapability(authenticated, "purchase.start", { listingId: "item-1" }), {
    status: "manual_only",
    capabilityId: "purchase.start"
  });
});

test("public reads run without a login preflight", async () => {
  const calls = [];
  const cli = {
    execute: async (capabilityId) => {
      calls.push(capabilityId);
      return { items: [] };
    }
  };

  assert.deepEqual(await executeCapability(cli, "search.listings", { query: "아이폰" }), {
    status: "executed",
    capabilityId: "search.listings",
    result: { items: [] }
  });
  assert.deepEqual(calls, ["search.listings"]);
});

test("npm run bunjang invokes the configured bunjang-cli binary through the wrapper", async () => {
  await withTempDir("bunjang-cli-bin-", async (dir) => {
    const fakeBin = join(dir, "bunjang-cli");
    await writeFile(
      fakeBin,
      [
        "#!/usr/bin/env node",
        "const args = process.argv.slice(2);",
        "if (args.join(' ') === '--json auth status') {",
        "  console.log(JSON.stringify({ authenticated: true }));",
        "} else {",
        "  console.log(JSON.stringify({ args }));",
        "}"
      ].join("\n")
    );
    await chmod(fakeBin, 0o755);

    const result = await runNpmBunjang(
      ["search.listings", "{\"query\":\"아이폰\",\"maxItems\":2}"],
      { BUNJANG_CLI_BIN: fakeBin }
    );

    assert.equal(result.exitCode, 0);
    assert.deepEqual(JSON.parse(result.stdout), {
      status: "executed",
      capabilityId: "search.listings",
      result: {
        args: ["--json", "search", "아이폰", "--max-items", "2"]
      }
    });
  });
});

test("npm run bunjang reports invalid paramsJson clearly", async () => {
  const result = await runNpmBunjang(["search.listings", "{not-json"]);

  assert.notEqual(result.exitCode, 0);
  assert.match(result.stderr, /Invalid paramsJson:/);
});

test("npm run bunjang blocks denied capabilities before spawning bunjang-cli", async () => {
  await withTempDir("bunjang-cli-deny-", async (dir) => {
    const fakeBin = join(dir, "should-not-run");
    await writeFile(
      fakeBin,
      "#!/usr/bin/env node\nthrow new Error('denied command should not spawn');\n"
    );
    await chmod(fakeBin, 0o755);

    const result = await runNpmBunjang(
      ["purchase.start", "{\"listingId\":\"item-1\"}"],
      { BUNJANG_CLI_BIN: fakeBin }
    );

    assert.equal(result.exitCode, 0);
    assert.deepEqual(JSON.parse(result.stdout), {
      status: "manual_only",
      capabilityId: "purchase.start"
    });
  });
});

test("npm run bunjang can call the real bunjang-cli auth.status command", { skip: process.env.BUNJANG_E2E !== "1" }, async () => {
  const result = await runNpmBunjang(["auth.status"]);

  assert.equal(result.exitCode, 0, result.stderr);

  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.status, "executed");
  assert.equal(parsed.capabilityId, "auth.status");
  assert.equal(typeof parsed.result?.status?.authenticated, "boolean");
});

function runNpmBunjang(args, env = {}) {
  return new Promise((resolve) => {
    execFile(
      "npm",
      ["run", "--silent", "bunjang", "--", ...args],
      {
        cwd: process.cwd(),
        env: { ...process.env, ...env }
      },
      (error, stdout, stderr) => {
        resolve({
          exitCode: error?.code ?? 0,
          stdout,
          stderr
        });
      }
    );
  });
}

async function withTempDir(prefix, run) {
  const dir = await mkdtemp(join(tmpdir(), prefix));

  try {
    return await run(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
