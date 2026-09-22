#!/usr/bin/env node
/**
 * Spawn gate for Mcfly Task prompts.
 * Exit 0 when the prompt has the required headings, a falsifiable DONE
 * command, and a model slug this account should still spawn.
 */
import { readFileSync } from "node:fs";

const REQUIRED = ["ROLE:", "BRANCH:", "BASE:", "FILES:", "DONE:", "LOCKS:", "MUST NOT:", "RETURN:", "MODEL:"];

const ALLOWED_MODELS = new Set([
  "grok-4.7-xhigh",
  "grok-4.7-high",
  "grok-4.7-medium",
  "composer-2.5-fast",
  "gpt-5.6-sol-medium",
]);

const BANNED_MODEL = /cursor-grok-4\.[56]|inherit/i;

function section(text, heading) {
  const start = text.indexOf(heading);
  if (start < 0) return "";
  const rest = text.slice(start + heading.length);
  const next = rest.search(/\n[A-Z][A-Z ]+:/);
  return (next < 0 ? rest : rest.slice(0, next)).trim();
}

function check(text) {
  const errors = [];
  for (const heading of REQUIRED) {
    if (!text.includes(heading)) errors.push(`missing ${heading.replace(":", "")}`);
  }

  const done = section(text, "DONE:");
  if (done && !/`[^`\n]+`/.test(done)) {
    errors.push("DONE needs a backtick command the parent can re-run");
  }

  const files = section(text, "FILES:");
  if (text.includes("FILES:") && files.length < 3) errors.push("FILES is empty");

  const modelLine = section(text, "MODEL:").split("\n")[0]?.trim() ?? "";
  const model = modelLine.split(/\s+/)[0] ?? "";
  if (model && BANNED_MODEL.test(model)) {
    errors.push(`banned model ${model}`);
  } else if (model && !ALLOWED_MODELS.has(model)) {
    errors.push(`model ${model} is not in the spawn allowlist`);
  }

  if (BANNED_MODEL.test(text) && !errors.some((e) => e.startsWith("banned model"))) {
    errors.push("prompt still names a banned model");
  }

  return errors;
}

const file = process.argv[2];
if (!file) {
  console.error("usage: node check-prompt.mjs <prompt.md>");
  process.exit(2);
}

const errors = check(readFileSync(file, "utf8"));
if (errors.length > 0) {
  for (const error of errors) console.error(`prompt: ${error}`);
  process.exit(1);
}

console.log("prompt: ok");
