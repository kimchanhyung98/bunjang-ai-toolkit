import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { chmod, mkdir, mkdtemp, rm, stat, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";

const INSTALLER = resolve("install/bunjang-assistant-install.mjs");
const SKILL_INSTALLER = resolve("install/install-skills.sh");

test("installer rejects unsupported remote source before planning install steps", async () => {
  const result = await runInstaller([
    "--tool",
    "codex",
    "--source",
    "https://example.com/evil.git",
    "--dry-run"
  ]);

  assert.notEqual(result.exitCode, 0);
  assert.match(result.stderr, /not in the allowed list/);
  assert.doesNotMatch(result.stdout, /npm install/);
  assert.doesNotMatch(result.stdout, /install-skills\.sh/);
});

test("installer rejects explicitly insecure remote source protocols", async () => {
  const result = await runInstaller([
    "--tool",
    "codex",
    "--source",
    "http://github.com/kimchanhyung98/bunjang-assistant.git",
    "--no-install-cli",
    "--no-skill",
    "--dry-run"
  ]);

  assert.notEqual(result.exitCode, 0);
  assert.match(result.stderr, /must use https:\/\//);
});

test("installer dry-run does not create project skill directories", async () => {
  await withTempDir("bunjang-installer-dry-run-", async (dir) => {
    const result = await runInstaller(
      ["--tool", "codex", "--scope", "project", "--dry-run", "--json"],
      { cwd: dir }
    );

    assert.equal(result.exitCode, 0, result.stderr);
    assert.equal(await pathExists(join(dir, ".codex")), false);

    const parsed = JSON.parse(result.stdout);
    assert.ok(Array.isArray(parsed.warnings));
    assert.ok(parsed.steps.some((step) => step.includes("install-skills.sh")));
  });
});

test("installer dry-run plans codex marketplace add followed by plugin add", async () => {
  const result = await runInstaller([
    "--tool",
    "codex",
    "--no-install-cli",
    "--no-skill",
    "--dry-run",
    "--json"
  ]);

  assert.equal(result.exitCode, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  const pluginRemove = parsed.steps.indexOf("codex plugin remove bunjang-assistant@bunjang-assistant");
  const marketplaceRemove = parsed.steps.indexOf("codex plugin marketplace remove bunjang-assistant");
  const marketplaceAdd = parsed.steps.indexOf(
    "codex plugin marketplace add --ref main https://github.com/kimchanhyung98/bunjang-assistant.git"
  );
  const pluginAdd = parsed.steps.indexOf("codex plugin add bunjang-assistant@bunjang-assistant");

  assert.notEqual(pluginRemove, -1, "plugin remove step missing");
  assert.notEqual(marketplaceRemove, -1, "marketplace remove step missing");
  assert.notEqual(marketplaceAdd, -1, "marketplace add step missing");
  assert.notEqual(pluginAdd, -1, "plugin add step missing");

  assert.ok(pluginRemove < marketplaceRemove, "plugin remove must precede marketplace remove");
  assert.ok(marketplaceRemove < marketplaceAdd, "marketplace remove must precede marketplace add");
  assert.ok(marketplaceAdd < pluginAdd, "marketplace add must precede plugin add");
});

test("skill installer symlink idempotency does not require python3", async () => {
  await withTempDir("bunjang-skill-install-", async (dir) => {
    const target = join(dir, "skills");

    const first = await runSkillInstaller([
      "--tool",
      "codex",
      "--scope",
      "project",
      "--mode",
      "symlink",
      "--target",
      target
    ]);
    assert.equal(first.exitCode, 0, first.stderr);

    const fakeBin = join(dir, "bin");
    await mkdir(fakeBin);
    await linkFirstAvailable(fakeBin, "dirname", ["/usr/bin/dirname", "/bin/dirname"]);
    await linkFirstAvailable(fakeBin, "basename", ["/usr/bin/basename", "/bin/basename"]);
    await linkFirstAvailable(fakeBin, "mkdir", ["/bin/mkdir", "/usr/bin/mkdir"]);
    await linkFirstAvailable(fakeBin, "readlink", ["/usr/bin/readlink", "/bin/readlink"]);

    const second = await runSkillInstaller(
      [
        "--tool",
        "codex",
        "--scope",
        "project",
        "--mode",
        "symlink",
        "--target",
        target
      ],
      { PATH: fakeBin }
    );

    assert.equal(second.exitCode, 0, second.stderr);
    assert.match(second.stdout, /skipped_existing: 1/);
  });
});

function runInstaller(args, options = {}) {
  return new Promise((resolveResult) => {
    execFile(
      "node",
      [INSTALLER, ...args],
      {
        cwd: options.cwd || process.cwd(),
        env: { ...process.env, ...(options.env || {}) }
      },
      (error, stdout, stderr) => {
        resolveResult({
          exitCode: error?.code ?? 0,
          stdout,
          stderr
        });
      }
    );
  });
}

function runSkillInstaller(args, env = {}) {
  return new Promise((resolveResult) => {
    execFile(
      "/bin/bash",
      [SKILL_INSTALLER, ...args],
      {
        cwd: process.cwd(),
        env: { ...process.env, ...env }
      },
      (error, stdout, stderr) => {
        resolveResult({
          exitCode: error?.code ?? 0,
          stdout,
          stderr
        });
      }
    );
  });
}

async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function linkFirstAvailable(binDir, command, candidates) {
  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      await symlink(candidate, join(binDir, command));
      return;
    }
  }

  const fallback = join(binDir, command);
  await writeFile(fallback, "#!/bin/sh\nexit 127\n");
  await chmod(fallback, 0o755);
}

async function withTempDir(prefix, run) {
  const dir = await mkdtemp(join(tmpdir(), prefix));

  try {
    return await run(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
