import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const target = new URL("../backend/.env", import.meta.url);
const existed = existsSync(target);
const source = existed
  ? target
  : new URL("../backend/.env.example", import.meta.url);
const original = readFileSync(source, "utf8");
// Canonical LF also repairs files previously corrupted by matching across CRLF.
const lines = original
  .replace(/^\uFEFF/, "")
  .replace(/\r\n?/g, "\n")
  .split("\n");
const assignment = /^[\t ]*(?:export[\t ]+)?JWT_SECRET[\t ]*=/;
const indexes = lines.flatMap((line, index) =>
  assignment.test(line) ? [index] : [],
);
const lastIndex = indexes.at(-1);
const raw =
  lastIndex === undefined
    ? ""
    : lines[lastIndex].slice(lines[lastIndex].indexOf("=") + 1).trim();
const quoted = raw.match(/^(["'])(.*?)\1(?:[\t ]*#.*)?$/);
const value = quoted ? quoted[2] : raw.replace(/[\t ]*#.*$/, "").trim();
const rotate =
  value.length < 32 || /^(CHANGE_ME|replace|changeme)/i.test(value);
if (rotate) {
  const replacement = `JWT_SECRET=${randomBytes(32).toString("hex")}`;
  if (lastIndex === undefined) lines.push(replacement);
  else lines[lastIndex] = replacement;
}
// dotenv uses the last assignment; retain it and remove ambiguous duplicates.
const content = lines
  .filter(
    (line, index) =>
      !assignment.test(line) || index === (lastIndex ?? lines.length - 1),
  )
  .join("\n")
  .replace(/\n*$/, "\n");
if (!existed || content !== original)
  writeFileSync(target, content, { mode: 0o600 });
if (rotate)
  console.log(
    "Development JWT placeholder replaced with a random key. Sign in again after restarting the backend.",
  );
else console.log("Existing JWT configuration retained.");
if (existed && /\r/.test(original))
  console.log(
    "Windows env line endings repaired. Recreate the backend container to reload the file.",
  );
console.log("Tunnel preparation complete; no secrets were printed.");
