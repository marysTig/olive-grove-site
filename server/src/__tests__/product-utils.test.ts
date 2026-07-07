import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeProductPayload } from '../utils/productUtils';

test('normalizeProductPayload converts string values and defaults missing fields', () => {
  const result = normalizeProductPayload({
    name_fr: 'Huile premium',
    price: '19.99',
    discount_pct: '10',
    stock: '5',
    featured: 'true',
    active: 'false',
    images: ['https://cdn.example.com/one.jpg'],
    image_public_ids: ['public-id-1'],
  });

  assert.equal(result.name_fr, 'Huile premium');
  assert.equal(result.price, 19.99);
  assert.equal(result.discount_pct, 10);
  assert.equal(result.stock, 5);
  assert.equal(result.featured, true);
  assert.equal(result.active, false);
  assert.deepEqual(result.images, ['https://cdn.example.com/one.jpg']);
  assert.deepEqual(result.image_public_ids, ['public-id-1']);
  assert.equal(result.slug, 'huile-premium');
});
