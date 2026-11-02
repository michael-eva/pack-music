import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { assertAdmin } from "./admin.server";

function clientWithRole(data: { id: string } | null, error: unknown = null) {
  const filters: Record<string, string> = {};
  const query = {
    select: () => query,
    eq: (key: string, value: string) => { filters[key] = value; return query; },
    maybeSingle: async () => ({ data, error }),
  };
  const client = { from: (table: string) => { assert.equal(table, "user_roles"); return query; } } as unknown as SupabaseClient;
  return { client, filters };
}

test("an admin can access private enquiries using their own role", async () => {
  const { client, filters } = clientWithRole({ id: "admin-role" });
  await assertAdmin(client, "requesting-user");
  assert.deepEqual(filters, { user_id: "requesting-user", role: "admin" });
});

test("a signed-in user without an admin role cannot access enquiries", async () => {
  const { client } = clientWithRole(null);
  await assert.rejects(assertAdmin(client, "ordinary-user"), (error: unknown) => error instanceof Response && error.status === 403);
});

test("a failed role lookup cannot grant access to enquiries", async () => {
  const { client } = clientWithRole({ id: "admin-role" }, new Error("Lookup failed"));
  await assert.rejects(assertAdmin(client, "requesting-user"), (error: unknown) => error instanceof Response && error.status === 403);
});