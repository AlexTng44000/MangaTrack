import test from "node:test";
import assert from "node:assert/strict";
import type { Pool } from "pg";
import { createReminderSchema } from "../src/modules/reminders/reminder.schema.js";
import { PostgresReminderRepository } from "../src/infrastructure/database/postgresReminder.repository.js";

test("reminders accept an optional work ID while preserving general reminders", () => {
  assert.equal(
    createReminderSchema.parse({
      message: "Read next chapter",
      catalogItemId: 42,
    }).catalogItemId,
    42,
  );
  assert.equal(
    createReminderSchema.parse({ message: "General reminder" }).catalogItemId,
    undefined,
  );
  for (const catalogItemId of [0, -1, 1.5, "42"]) {
    assert.equal(
      createReminderSchema.safeParse({ message: "Read", catalogItemId })
        .success,
      false,
    );
  }
});

test("reminder repository persists work associations and scopes reads to the user", async () => {
  const calls: Array<{ sql: string; values: unknown[] }> = [];
  const reminder = { id: 7, userId: 3, catalogItemId: 42, message: "Read" };
  const db = {
    async query(sql: string, values: unknown[]) {
      calls.push({ sql, values });
      return { rows: [reminder] };
    },
  } as unknown as Pool;
  const repository = new PostgresReminderRepository(db);
  assert.equal(
    (await repository.create(3, { message: "Read", catalogItemId: 42 }))
      .catalogItemId,
    42,
  );
  assert.deepEqual(calls[0].values, [3, "Read", null, 42]);
  assert.match(calls[0].sql, /catalog_item_id/);
  await repository.create(3, { message: "General reminder" });
  assert.equal(calls[1].values[3], null);
  await repository.getAll(3);
  assert.match(calls[2].sql, /WHERE user_id = \$1/);
  assert.deepEqual(calls[2].values, [3]);
  await repository.getById(7, 3);
  assert.match(calls[3].sql, /AND user_id = \$2/);
  assert.deepEqual(calls[3].values, [7, 3]);
  assert.match(calls[3].sql, /catalog_item_id AS "catalogItemId"/);
});
