import test from 'node:test';
import assert from 'node:assert/strict';
import { RESOURCES } from '../assets/js/data/resources.js';
import { filterResources, tokenize, normalize, categoryCounts, prepareResources } from '../assets/js/lib/search.js';
import { telHref, formatDate, directionsUrl } from '../assets/js/lib/format.js';
import { milesBetween } from '../assets/js/lib/geo.js';

prepareResources(RESOURCES);

const base = { query: '', categories: new Set(), cost: 'any', insurance: 'any', savedOnly: false, saved: new Set(), sort: 'recommended', userLocation: null };
const ids = (state) => filterResources(RESOURCES, { ...base, ...state }).map((x) => x.resource.id);

test('normalize strips accents, case and punctuation', () => {
  assert.equal(normalize('  Español — St. Joseph’s! '), 'espanol st josephs');
});

test('tokenize drops filler words and keeps two-word synonyms', () => {
  assert.deepEqual(tokenize('I need a doctor near me'), ['doctor']);
  assert.deepEqual(tokenize('low cost dentist'), ['low cost', 'dentist']);
});

test('empty search returns everything, unconfirmed last', () => {
  const all = ids({});
  assert.equal(all.length, RESOURCES.length);
  assert.equal(all.at(-1), 'st-josephs-outreach');
});

test('plain-language searches find the right category', () => {
  assert.ok(ids({ query: 'dentist' }).every((id) => RESOURCES.find((r) => r.id === id).categories.includes('dental')));
  assert.ok(ids({ query: 'toothache' }).includes('vcu-dentistry'));
  assert.ok(ids({ query: 'therapy' }).includes('rbha'));
  assert.ok(ids({ query: 'meds' }).includes('rx-savings'));
  assert.ok(ids({ query: 'hungry' }).includes('feedmore'));
  assert.equal(ids({ query: 'medicaid' })[0], 'medicaid');
});

test('organization names and aliases match', () => {
  assert.equal(ids({ query: 'fan free clinic' })[0], 'health-brigade');
  assert.equal(ids({ query: 'RBHA' })[0], 'rbha');
  assert.ok(ids({ query: 'care-a-van' }).includes('care-a-van'));
});

test('ZIP code search matches location ZIPs', () => {
  const r = ids({ query: '23224' });
  assert.ok(r.includes('care-a-van') && r.includes('daily-planet') && r.includes('crossover'));
  assert.ok(!r.includes('health-brigade'));
});

test('every search word must match (AND)', () => {
  assert.deepEqual(ids({ query: 'dental hungry' }), []);
});

test('cost and insurance filters combine with categories', () => {
  const free = filterResources(RESOURCES, { ...base, cost: 'free' });
  assert.ok(free.every((x) => x.resource.cost === 'free'));
  const low = filterResources(RESOURCES, { ...base, cost: 'low' });
  assert.ok(low.every((x) => ['sliding', 'reduced'].includes(x.resource.cost)));
  const med = filterResources(RESOURCES, { ...base, insurance: 'medicaid', categories: new Set(['medical']) });
  assert.ok(med.length > 0);
  assert.ok(med.every((x) => x.resource.accepts.medicaid === true && x.resource.categories.includes('medical')));
  assert.ok(!med.some((x) => x.resource.id === 'care-a-van'), 'Care-A-Van does not take Medicaid');
});

test('saved-only shows only saved places', () => {
  assert.deepEqual(ids({ savedOnly: true, saved: new Set(['rbha']) }), ['rbha']);
});

test('distance sort puts the nearest physical location first', () => {
  const nearChurchHill = { lat: 37.5352, lng: -77.4155 };
  const sorted = filterResources(RESOURCES, { ...base, sort: 'distance', userLocation: nearChurchHill });
  assert.equal(sorted[0].resource.id, 'cahn-vernon-j-harris');
  assert.ok(sorted[0].distance < 0.1);
  // Places without a mapped location sort after every place with one.
  const firstUnmapped = sorted.findIndex((x) => x.distance == null);
  assert.ok(sorted.slice(firstUnmapped).every((x) => x.distance == null));
});

test('category counts ignore the category filter but honor others', () => {
  const counts = categoryCounts(RESOURCES, { ...base, categories: new Set(['food']), cost: 'free' });
  assert.equal(counts.all, RESOURCES.filter((r) => r.cost === 'free').length);
  assert.ok(counts.dental >= 1);
});

test('formatters', () => {
  assert.equal(telHref('(804) 358-6343'), 'tel:+18043586343');
  assert.equal(telHref('1-855-242-8282'), 'tel:+18552428282');
  assert.equal(telHref('988'), 'tel:988');
  assert.equal(formatDate('2026-11-19'), 'November 19, 2026');
  assert.match(directionsUrl({ street: '517 W Grace St', city: 'Richmond', zip: '23220' }), /destination=517%20W%20Grace%20St%2C%20Richmond%2C%20VA%2023220$/);
  assert.ok(Math.abs(milesBetween({ lat: 37.5407, lng: -77.436 }, { lat: 37.5407, lng: -77.436 })) < 1e-9);
});
