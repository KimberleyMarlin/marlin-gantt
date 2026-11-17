import test from 'node:test';
import assert from 'node:assert/strict';
import { tagsString, tenantOf, TAG_SCHEMA } from '../src/tagger.js';

test('tagsString includes venue code and name, drops unknown/none, dedupes', () => {
  const s = tagsString({ venue: 'WBC', scene: 'drink', subjects: ['beer', 'Beer', 'tasting paddle'], setting: 'indoor', people: 'none', mood: ['social'] });
  assert.equal(s, 'WBC, Whitfords Brewing Co, drink, beer, tasting paddle, indoor, social');
  assert.equal(tagsString({ venue: 'unknown', scene: 'food', subjects: ['skewers'], setting: 'unknown', people: 'group', mood: [] }), 'food, skewers, group');
});

test('tenantOf reads tid and survives junk', () => {
  const t = 'x.' + Buffer.from(JSON.stringify({ tid: 'abc' })).toString('base64url') + '.y';
  assert.equal(tenantOf(t), 'abc');
  assert.equal(tenantOf('nope'), null);
});

test('schema requires every property', () => {
  assert.deepEqual([...TAG_SCHEMA.required].sort(), Object.keys(TAG_SCHEMA.properties).sort());
});
