import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

test("package exposes bunjang-assistant metadata and local binaries", async () => {
  const pkg = await readJson("package.json");

  assert.equal(pkg.name, "bunjang-assistant");
  assert.equal(pkg.private, true);
  assert.deepEqual(pkg.bin, {
    "bunjang-assistant": "./install/bunjang-assistant-install.mjs",
    "bunjang-assistant-install": "./install/bunjang-assistant-install.mjs",
    "bunjang-assistant-run": "./src/index.js"
  });
  assert.equal(pkg.dependencies["bunjang-cli"], "0.2.1");
  assert.ok(pkg.files.includes("install/**"));
  assert.ok(pkg.files.includes("skills/bunjang/**"));
  assert.ok(!pkg.files.includes("README.ko.md"));
  assert.ok(!pkg.files.includes("assets/**"));
  assert.ok(!pkg.files.includes("commands/**"));
  assert.ok(!pkg.files.includes("examples/**"));
  assert.ok(!pkg.files.includes("products/**"));
  assert.ok(!pkg.files.includes("skills/bunjang/references/ai-context.md"));
  assert.ok(!pkg.files.includes("skills/bunjang/references/template.md"));
});

test("root plugin metadata is scoped to Codex, Claude, and macOS", async () => {
  const plugin = await readJson("plugin.json");

  assert.equal(plugin.name, "bunjang-assistant");
  assert.deepEqual(plugin.support.codex, ["codex"]);
  assert.deepEqual(plugin.support.claude, ["claude"]);
  assert.deepEqual(plugin.support.os, ["macos-intel", "macos-apple-silicon"]);
  assert.equal(plugin.commands, undefined);
  assert.equal(plugin.assets, undefined);
  assert.equal(plugin.examples, undefined);
  assert.deepEqual(Object.keys(plugin.entrypoints).sort(), [
    "claude",
    "claudeManifest",
    "claudeMarketplace",
    "codex",
    "codexMarketplace",
    "supportMatrix"
  ]);
});

test("public bunjang skill routes price and sales draft requests", async () => {
  const skill = await readText("skills/bunjang/SKILL.md");
  const marketplace = await readText("skills/bunjang/references/marketplace.md");
  const fixtureGuide = await readText("skills/bunjang/references/search-result-fixture.md");
  const fixture = await readJson("skills/bunjang/references/fixtures/search-result.json");
  const price = await readText("skills/bunjang/references/price.md");
  const sales = await readText("skills/bunjang/references/sales.md");
  const aiContext = await readText("skills/bunjang/references/ai-context.md");
  const template = await readText("skills/bunjang/references/template.md");

  assert.match(skill, /price\.md/);
  assert.match(skill, /sales\.md/);
  assert.match(skill, /자연어 요청/);
  assert.match(skill, /별도 커맨드는 제공하지 않습니다/);
  assert.match(marketplace, /search-result-fixture\.md/);
  assert.match(fixtureGuide, /fixtures\/search-result\.json/);
  assert.equal(fixture.items[0].listingId, "fixture-1");
  assert.match(price, /번개장터에서 A 상품 시세 알려줘/);
  assert.match(price, /시세 범위/);
  assert.match(sales, /번개장터 판매글 작성해줘/);
  assert.match(sales, /A 디렉토리의 상품들/);
  assert.match(sales, /저장소의 기본 상품 폴더를 가정하지 말고/);
  assert.match(sales, /등록하기/);
  assert.match(aiContext, /사용자가 지정한 상품 루트/);
  assert.match(aiContext, /스킬 내부 리소스/);
  assert.match(template, /번개장터 판매글 템플릿/);
  assert.doesNotMatch(skill + sales + aiContext, /products\/ai-context|products\/template/);
});

test("installer metadata excludes unsupported surfaces", async () => {
  const installer = await readText("install/bunjang-assistant-install.mjs");
  const installReadme = await readText("install/README.md");
  const supportMatrix = await readText("docs/surface-support-matrix.md");
  const cliUsage = await readText("skills/bunjang/docs/cli-usage.md");
  const claudePlugin = await readJson(".claude-plugin/plugin.json");
  const claudeManifest = await readJson(".claude-plugin/manifest.json");

  assert.match(installer, /--tool cli\|codex\|claude\|both/);
  assert.match(installer, /Cursor, Claude Desktop MCP, Windows, and Linux installers are intentionally out of scope/);
  assert.match(installReadme, /install-skills\.sh/);
  assert.doesNotMatch(installReadme, /install-cli\.sh|install-plugins\.sh|bootstrap-bunjang\.sh/);
  assert.match(supportMatrix, /Claude Desktop local MCP \| 제공하지 않음 \| 범위 밖/);
  assert.doesNotMatch(supportMatrix, /commands\/bunjang\.md/);
  assert.equal(claudePlugin.commands, undefined);
  assert.equal(claudeManifest.commands, undefined);
  assert.match(cliUsage, /node install\/bunjang-assistant-install\.mjs --tool codex --dry-run/);
  assert.match(cliUsage, /별도 명령어를 제공하지 않고/);
});

async function readJson(path) {
  return JSON.parse(await readText(path));
}

async function readText(path) {
  return readFile(resolve(process.cwd(), path), "utf8");
}
