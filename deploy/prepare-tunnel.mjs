import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const target = new URL("../backend/.env", import.meta.url);
const source = existsSync(target)
  ? target
  : new URL("../backend/.env.example", import.meta.url);
let content = readFileSync(source, "utf8");
const match = content.match(/^\s*JWT_SECRET\s*=\s*(.*?)\s*$/m);
const value = (match?.[1] ?? "").replace(/^['"]|['"]$/g, "");
if (value.length < 32 || /^(CHANGE_ME|replace|changeme)/i.test(value)) {
  const replacement = `JWT_SECRET=${randomBytes(32).toString("hex")}`;
  content = match
    ? content.replace(match[0], replacement)
    : `${content}\n${replacement}\n`;
  writeFileSync(target, content, { mode: 0o600 });
  console.log(
    "Development JWT placeholder replaced with a random key. Sign in again after restarting the backend.",
  );
} else {
  if (!existsSync(target)) writeFileSync(target, content, { mode: 0o600 });
  console.log("Existing JWT configuration retained.");
}
console.log("Tunnel preparation complete; no secrets were printed.");
