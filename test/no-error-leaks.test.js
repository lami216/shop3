import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const backendRoot = path.join(projectRoot, "backend");

const javascriptFiles = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return javascriptFiles(fullPath);
    return entry.isFile() && entry.name.endsWith(".js") ? [fullPath] : [];
  });

test("HTTP responses never serialize internal error messages", () => {
  const violations = [];
  for (const file of javascriptFiles(backendRoot)) {
    const source = fs.readFileSync(file, "utf8");
    if (/res\.status\([^)]*\)\.json\(\{[^}]*\b(?:message|error)\s*:\s*error\.message/s.test(source)) {
      violations.push(path.relative(projectRoot, file));
    }
  }
  assert.deepEqual(violations, []);
});
