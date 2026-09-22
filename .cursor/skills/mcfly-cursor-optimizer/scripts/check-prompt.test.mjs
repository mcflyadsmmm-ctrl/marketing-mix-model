import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(root, "scripts/check-prompt.mjs");

function run(fixture) {
  return spawnSync(process.execPath, [script, join(root, "fixtures", fixture)], {
    encoding: "utf8",
  });
}

const good = run("good.md");
assert.equal(good.status, 0, good.stderr);
assert.match(good.stdout, /prompt: ok/);

const bad = run("bad.md");
assert.equal(bad.status, 1);
assert.match(bad.stderr, /DONE needs a backtick command/);
assert.match(bad.stderr, /banned model/);
assert.match(bad.stderr, /FILES is empty/);

console.log("check-prompt.test.mjs: ok");
