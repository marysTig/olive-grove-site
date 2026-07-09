import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { ensureSeedData } from "../utils/persistence";
import User from "../models/User.model";
import Product from "../models/Product.model";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/olive-grove-emporium-test";

test("ensureSeedData creates a default admin and sample product", async () => {
  await mongoose.connect(uri);

  try {
    await Promise.all([User.deleteMany({}), Product.deleteMany({})]);

    await ensureSeedData();

    const admin = await User.findOne({ role: "admin" }).lean();
    const product = await Product.findOne({ slug: "huile-dolive-premium" }).lean();

    assert.ok(admin);
    assert.equal(admin?.email, "admin@olivegrove.test");
    assert.ok(product);
    assert.equal(product?.name_fr, "Huile d’olive premium");
  } finally {
    await Promise.all([User.deleteMany({}), Product.deleteMany({})]);
    await mongoose.disconnect();
  }
});
