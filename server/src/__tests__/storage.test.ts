import test from "node:test";
import assert from "node:assert/strict";
import { createInitialStore } from "../utils/storage";

test("createInitialStore seeds a default admin and sample product", () => {
  const store = createInitialStore();

  assert.ok(store.users.length > 0);
  assert.ok(store.products.length > 0);

  const admin = store.users.find((user) => user.role === "admin");
  assert.ok(admin);
  assert.equal(admin?.email, "admin@olivegrove.test");

  const product = store.products[0];
  assert.ok(product.slug);
  assert.ok(product.name_fr);
});
