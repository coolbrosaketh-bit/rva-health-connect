// Validates every directory record so a bad edit fails `npm test`, not the live site.
import test from 'node:test';
import assert from 'node:assert/strict';
import { RESOURCES, DATA_REVIEWED, MEDICAID_LIMITS_2026 } from '../assets/js/data/resources.js';
import { CATEGORIES, COST, ACCESS } from '../assets/js/data/taxonomy.js';
import { inRichmondArea, mappableLocations } from '../assets/js/lib/geo.js';

const CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const PHONE = /^(\(\d{3}\) \d{3}-\d{4}|1-\d{3}-\d{3}-\d{4}|\d{3})$/;

test('ids are unique and URL-safe', () => {
  const ids = RESOURCES.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^[a-z0-9-]+$/);
});

for (const r of RESOURCES) {
  test(`${r.id}: required fields and vocabularies`, () => {
    for (const field of ['name', 'kind', 'summary']) assert.ok(r[field]?.trim(), `${field} is required`);
    assert.ok(r.categories.length > 0, 'at least one category');
    for (const c of r.categories) assert.ok(CATEGORY_IDS.has(c), `unknown category ${c}`);
    assert.ok(COST[r.cost], `unknown cost ${r.cost}`);
    assert.ok(ACCESS[r.access], `unknown access ${r.access}`);
    for (const key of ['uninsured', 'medicaid', 'private']) {
      assert.ok([true, false, null].includes(r.accepts?.[key]), `accepts.${key} must be true/false/null`);
    }
    assert.ok(Array.isArray(r.howToStart) && r.howToStart.length, 'howToStart is required');
  });

  test(`${r.id}: contact details are well formed`, () => {
    if (r.phone) assert.match(r.phone, PHONE);
    for (const p of r.phones || []) assert.match(p.number, PHONE);
    for (const l of r.locations || []) if (l.phone) assert.match(l.phone, PHONE);
    const urls = [r.website, ...(r.links || []).map((l) => l.url), ...(r.verification?.sources || []).map((s) => s.url)].filter(Boolean);
    for (const u of urls) {
      assert.doesNotThrow(() => new URL(u), `bad URL ${u}`);
      assert.match(u, /^https:\/\//, `use https: ${u}`);
      assert.doesNotMatch(u, /\s/, `URL contains whitespace: ${u}`);
    }
    assert.ok(r.phone || r.website, 'a phone number or website is required');
  });

  test(`${r.id}: verification is recorded`, () => {
    const v = r.verification;
    assert.ok(['confirmed', 'unconfirmed'].includes(v?.status));
    assert.match(v.checked, ISO_DATE);
    assert.ok(v.checked <= DATA_REVIEWED, 'checked date cannot be after the data review date');
    assert.ok(v.sources?.length > 0, 'cite at least one source');
    if (v.status === 'unconfirmed') assert.ok(v.note, 'explain why a listing is unconfirmed');
  });

  test(`${r.id}: locations are inside Greater Richmond`, () => {
    for (const l of r.locations || []) {
      assert.ok(l.street && l.city && /^\d{5}$/.test(l.zip), 'street, city and 5-digit ZIP required');
      if (l.lat != null || l.lng != null) assert.ok(inRichmondArea(l), `${l.street} is outside the Richmond area`);
    }
  });
}

test('unconfirmed listings never appear on the map', () => {
  for (const r of RESOURCES.filter((x) => x.verification.status === 'unconfirmed')) {
    assert.equal(mappableLocations(r).length, 0);
  }
});

test('online, phone and referral listings never appear on the map', () => {
  for (const r of RESOURCES.filter((x) => ['online', 'phone', 'referral'].includes(x.access))) {
    assert.equal(mappableLocations(r).length, 0, r.id);
  }
});

test('Medicaid limits table is complete and increasing', () => {
  const rows = MEDICAID_LIMITS_2026.rows;
  assert.deepEqual(rows.map((r) => r.household), [1, 2, 3, 4]);
  for (let i = 1; i < rows.length; i++) assert.ok(rows[i].yearly > rows[i - 1].yearly);
  // The Medicaid card's summary must quote the same numbers as the table.
  const medicaid = RESOURCES.find((r) => r.id === 'medicaid');
  assert.ok(medicaid.summary.includes('$22,025') && medicaid.summary.includes('$45,540'));
});
