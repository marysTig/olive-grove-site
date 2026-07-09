import test from "node:test";
import assert from "node:assert/strict";
import { normalizeOrderPayload } from "../controllers/modern.controller";

test("normalizeOrderPayload maps checkout fields to the stored order shape", () => {
  const payload = normalizeOrderPayload({
    customer_name: "  Amina Benali  ",
    customer_email: "amina@example.com",
    customer_phone: "0555123456",
    delivery_address: "123 Rue de la Paix",
    wilaya: "Alger",
    notes: "Leave at the gate",
    coupon_code: "SAVE10",
    subtotal: "100",
    discount: "10",
    shipping_fee: "15",
    total: "105",
    items: [
      {
        id: "prod-1",
        name_ar: "زيت",
        name_fr: "Huile",
        quantity: 2,
        price: 50,
      },
    ],
  });

  assert.equal(payload.customerName, "Amina Benali");
  assert.equal(payload.customerEmail, "amina@example.com");
  assert.equal(payload.customerPhone, "0555123456");
  assert.equal(payload.deliveryAddress, "123 Rue de la Paix");
  assert.equal(payload.wilaya, "Alger");
  assert.equal(payload.notes, "Leave at the gate");
  assert.equal(payload.couponCode, "SAVE10");
  assert.equal(payload.subtotal, 100);
  assert.equal(payload.discount, 10);
  assert.equal(payload.shippingFee, 15);
  assert.equal(payload.total, 105);
  assert.equal(payload.items[0].productId, "prod-1");
  assert.equal(payload.items[0].nameFr, "Huile");
  assert.equal(payload.items[0].quantity, 2);
  assert.equal(payload.items[0].price, 50);
});
