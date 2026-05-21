#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { homedir, platform } from "node:os";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");
const MARKETPLACE_NAME = "bunjang-assistant";
const PLUGIN_ID = "bunjang-assistant@bunjang-assistant";
const PUBLIC_GIT_SOURCE = "https://github.com/kimchanhyung98/bunjang-assistant.git";
const PUBLIC_GIT_REF = "main";

const DEFAULTS = {
  tool: "",
  scope: "user",
  skillMode: "copy",
  skill: "auto",
  installCli: false,
  skipCli: false,
  replace: true,
  source: PUBLIC_GIT_SOURCE,
  ref: PUBLIC_GIT_REF,
  dryRun: false,
  json: false
};

function usage() {
  console.log(`bunjang-assistant installer

Usage:
  npx -y github:kimchanhyung98/bunjang-assistant --tool cli|codex|claude-code|both [options]
  npm exec --yes --package github:kimchanhyung98/bunjang-assistant -- bunjang-assistant --tool cli|codex|claude-code|both [options]
  node install/bunjang-assistant-install.mjs --tool cli|codex|claude-code|both [options]

Options:
  --tool cli|codex|claude|claude-code|both
                              Target surface. "claude" is an alias for Claude Code.
                              "cli" installs local npm dependencies only.
  --scope user|project|local  Install scope for skills/plugins. Default: user.
  --skill-mode copy|symlink   Skill install mode. Default: copy.
  --with-skill                Also install the public bunjang skill discovery bundle.
  --no-skill                  Skip skill discovery install.
  --install-cli               Run npm install before surface wiring.
  --no-install-cli            Skip dependency install/update.
  --source SOURCE             Marketplace source. Default: ${PUBLIC_GIT_SOURCE}
  --ref REF                   Git ref for Codex marketplace add. Default: ${PUBLIC_GIT_REF}
  --no-replace                Do not replace existing copied skill paths.
  --dry-run                   Print actions without changing the machine.
  --json                      Print a machine-readable summary.
  --help                      Show this help.

Notes:
  - Supported runtime targets are macOS Intel and Apple Silicon.
  - Supported AI surfaces are Codex and Claude Code.
  - Cursor, Claude Desktop MCP, Windows, and Linux installers are intentionally out of scope.
  - The CLI execution engine remains bunjang-cli through this repo's wrapper.`);
}

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const opts = { ...DEFAULTS };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const readValue = (name) => {
      if (i + 1 >= argv.length) fail(`${name} requires a value`);
      i += 1;
      return argv[i];
    };

    switch (arg) {
      case "--tool":
        opts.tool = normalizeTool(readValue(arg));
        break;
      case "--scope":
        opts.scope = readValue(arg);
        break;
      case "--skill-mode":
        opts.skillMode = readValue(arg);
        break;
      case "--with-skill":
        opts.skill = "yes";
        break;
      case "--no-skill":
        opts.skill = "no";
        break;
      case "--install-cli":
        opts.installCli = true;
        break;
      case "--no-install-cli":
        opts.skipCli = true;
        break;
      case "--source":
        opts.source = readValue(arg);
        break;
      case "--ref":
        opts.ref = readValue(arg);
        break;
      case "--no-replace":
        opts.replace = false;
        break;
      case "--dry-run":
        opts.dryRun = true;
        break;
      case "--json":
        opts.json = true;
        break;
      case "--help":
      case "-h":
        usage();
        process.exit(0);
        break;
      default:
        fail(`unknown option: ${arg}`);
    }
  }

  if (!opts.tool) fail("--tool is required");
  if (!["cli", "codex", "claude", "both"].includes(opts.tool)) {
    fail("--tool must be cli, codex, claude-code, or both");
  }
  if (!["user", "project", "local"].includes(opts.scope)) {
    fail("--scope must be user, project, or local");
  }
  if (!["copy", "symlink"].includes(opts.skillMode)) {
    fail("--skill-mode must be copy or symlink");
  }

  return opts;
}

function normalizeTool(value) {
  const normalized = String(value || "").trim().toLowerCase();
  const aliases = {
    cli: "cli",
    codex: "codex",
    claude: "claude",
    "claude-code": "claude",
    "claude_cli": "claude",
    "claude-cli": "claude",
    both: "both"
  };
  return aliases[normalized] || normalized;
}

function quote(value) {
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(value)) return value;
  return JSON.stringify(value);
}

function run(command, args, opts, options = {}) {
  const printable = [command, ...args].map(String).map(quote).join(" ");
  opts.steps.push(printable);
  if (!opts.json) console.log(`+ ${printable}`);
  if (opts.dryRun) return { status: 0, stdout: "", stderr: "" };

  const result = spawnSync(command, args, {
    cwd: options.cwd || REPO_ROOT,
    encoding: "utf8",
    stdio: options.capture || opts.json ? ["ignore", "pipe", "pipe"] : "inherit"
  });

  if (result.error) {
    if (options.allowFailure) return { status: 1, stdout: "", stderr: result.error.message };
    fail(`failed to run ${command}: ${result.error.message}`);
  }
  if (result.status !== 0 && !options.allowFailure) {
    fail(`command failed: ${printable}`);
  }

  return {
    status: result.status ?? 0,
    stdout: result.stdout || "",
    stderr: result.stderr || ""
  };
}

function commandExists(command) {
  const result = spawnSync("sh", ["-lc", `command -v ${quote(command)}`], {
    stdio: "ignore"
  });
  return result.status === 0;
}

function requireCommand(command, opts) {
  if (opts.dryRun || commandExists(command)) return;
  fail(`required command not found: ${command}`);
}

function expandHome(path) {
  if (!path) return path;
  if (path === "~") return homedir();
  if (path.startsWith("~/")) return join(homedir(), path.slice(2));
  return path;
}

function isLocalSource(source) {
  return source.startsWith("/") || source.startsWith("./") || source.startsWith("../") || source.startsWith("~");
}

function defaultSkillTarget(tool, scope) {
  if (scope === "project" || scope === "local") {
    return join(process.cwd(), tool === "codex" ? ".codex/skills" : ".claude/skills");
  }
  if (tool === "codex") {
    return join(process.env.CODEX_HOME || join(homedir(), ".codex"), "skills");
  }
  return join(homedir(), ".claude", "skills");
}

function removeSkillIfReplacing(tool, opts) {
  if (!opts.replace) return;
  const target = join(defaultSkillTarget(tool, opts.scope), "bunjang");
  if (!existsSync(target)) return;
  if (!opts.json) console.log(`replace existing skill: ${target}`);
  if (!opts.dryRun) {
    const stat = lstatSync(target);
    rmSync(target, { recursive: stat.isDirectory() && !stat.isSymbolicLink(), force: true });
  }
}

function installSkill(tool, opts) {
  removeSkillIfReplacing(tool, opts);
  const target = defaultSkillTarget(tool, opts.scope);
  mkdirSync(dirname(target), { recursive: true });
  run("bash", [
    join(REPO_ROOT, "install", "install-skills.sh"),
    "--tool",
    tool,
    "--scope",
    opts.scope === "local" ? "project" : opts.scope,
    "--mode",
    opts.skillMode,
    "--target",
    target
  ], opts);
}

function shouldInstallSkill(opts) {
  if (opts.skill === "no") return false;
  if (opts.skill === "yes") return true;
  return ["codex", "claude", "both"].includes(opts.tool);
}

function shouldInstallCli(opts) {
  if (opts.skipCli) return false;
  if (opts.installCli || opts.tool === "cli") return true;
  return ["codex", "claude", "both"].includes(opts.tool);
}

function installCli(opts) {
  run("npm", ["install"], opts);
}

function installCodex(opts) {
  requireCommand("codex", opts);
  if (opts.replace) {
    run("codex", ["plugin", "marketplace", "remove", MARKETPLACE_NAME], opts, { allowFailure: true, capture: true });
  }
  const addArgs = ["plugin", "marketplace", "add"];
  if (opts.ref && !isLocalSource(opts.source)) addArgs.push("--ref", opts.ref);
  addArgs.push(expandHome(opts.source));
  run("codex", addArgs, opts);
}

function installClaude(opts) {
  requireCommand("claude", opts);
  if (opts.replace) {
    run("claude", ["plugin", "uninstall", PLUGIN_ID, "--scope", opts.scope, "--keep-data", "-y"], opts, { allowFailure: true, capture: true });
    run("claude", ["plugin", "marketplace", "remove", MARKETPLACE_NAME], opts, { allowFailure: true, capture: true });
  }
  run("claude", ["plugin", "marketplace", "add", expandHome(opts.source)], opts);
  run("claude", ["plugin", "install", PLUGIN_ID, "--scope", opts.scope], opts);
}

function assertMac() {
  if (platform() === "darwin") return;
  console.error("warning: bunjang-assistant installer is only supported on macOS; continuing for dry-run or metadata validation.");
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  opts.steps = [];
  assertMac();

  if (shouldInstallCli(opts)) installCli(opts);

  const tools = opts.tool === "both" ? ["codex", "claude"] : [opts.tool];
  for (const tool of tools) {
    if (tool === "cli") continue;
    if (shouldInstallSkill(opts)) installSkill(tool, opts);
    if (tool === "codex") installCodex(opts);
    if (tool === "claude") installClaude(opts);
  }

  const summary = {
    status: "ok",
    tool: opts.tool,
    scope: opts.scope,
    source: opts.source,
    steps: opts.steps
  };

  if (opts.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log("bunjang-assistant install metadata completed");
  }
}

main();
