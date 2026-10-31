import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  copyFileSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function fixture(content, existing = false) {
  const root = mkdtempSync(join(tmpdir(), "mmt-tunnel-env-"));
  mkdirSync(join(root, "deploy"));
  mkdirSync(join(root, "backend"));
  copyFileSync(
    new URL("../prepare-tunnel.mjs", import.meta.url),
    join(root, "deploy/prepare-tunnel.mjs"),
  );
  const env = join(root, "backend/.env");
  writeFileSync(existing ? env : `${env}.example`, content);
  return {
    root,
    env,
    run() {
      const result = spawnSync(
        process.execPath,
        [join(root, "deploy/prepare-tunnel.mjs")],
        { encoding: "utf8" },
      );
      assert.equal(result.status, 0, result.stderr);
      return readFileSync(env, "utf8");
    },
  };
}
for (const ending of ["\n", "\r\n"])
  test(`JWT rotation preserves separate env records with ${JSON.stringify(ending)} line endings`, () => {
    const f = fixture(
      [
        "DATABASE_URL=postgresql://fixture",
        "",
        "JWT_SECRET=CHANGE_ME_WITH_A_LONG_RANDOM_SECRET_123456",
        "JWT_EXPIRES_IN=1h",
        "SMTP_PASSWORD=retained-fixture",
        "",
      ].join(ending),
    );
    try {
      const text = f.run();
      const records = Object.fromEntries(
        text
          .split("\n")
          .filter((line) => line.includes("="))
          .map((line) => [
            line.slice(0, line.indexOf("=")),
            line.slice(line.indexOf("=") + 1),
          ]),
      );
      assert.match(records.JWT_SECRET, /^[0-9a-f]{64}$/);
      assert.equal(records.DATABASE_URL, "postgresql://fixture");
      assert.equal(records.JWT_EXPIRES_IN, "1h");
      assert.equal(records.SMTP_PASSWORD, "retained-fixture");
      assert.equal(text.includes("\r"), false);
      assert.equal(f.run(), text);
    } finally {
      rmSync(f.root, { recursive: true, force: true });
    }
  });

test("repairs the already-corrupted Windows record without rotating the generated key", () => {
  const key = "a".repeat(64);
  const f = fixture(
    `DATABASE_URL=postgresql://fixture\rJWT_SECRET=${key}\nJWT_EXPIRES_IN=1h\r\nSMTP_PASSWORD=retained-fixture\r\n`,
    true,
  );
  try {
    const text = f.run();
    assert.equal(
      text,
      `DATABASE_URL=postgresql://fixture\nJWT_SECRET=${key}\nJWT_EXPIRES_IN=1h\nSMTP_PASSWORD=retained-fixture\n`,
    );
    assert.equal(f.run(), text);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test("adds a missing key and retains the effective strong key when duplicates exist", () => {
  const missing = fixture(
    "DATABASE_URL=postgresql://fixture\r\nSMTP_PASSWORD=retained-fixture\r\n",
    true,
  );
  const strong = fixture(
    `JWT_SECRET=CHANGE_ME\r\nJWT_SECRET="${"b".repeat(64)}" # retained key\r\n`,
    true,
  );
  try {
    assert.match(missing.run(), /\nJWT_SECRET=[0-9a-f]{64}\n$/);
    const text = strong.run();
    assert.equal(text, `JWT_SECRET="${"b".repeat(64)}" # retained key\n`);
  } finally {
    rmSync(missing.root, { recursive: true, force: true });
    rmSync(strong.root, { recursive: true, force: true });
  }
});
