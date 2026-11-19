/**
 * Search, filtering and sorting. Pure functions with no DOM access,
 * so they run in Node for tests (see tests/search.test.mjs).
 */
import { CATEGORIES, COST, ACCESS, ACCEPTS_LABELS } from '../data/taxonomy.js';
import { nearestLocation } from './geo.js';

/** Lowercase, strip accents and punctuation, collapse whitespace. */
export function normalize(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Words that carry no meaning in this directory ("I need a doctor near me"). */
const STOP_WORDS = new Set(
  'a an and are at be can care do find for from get go going help i im in is it looking me my near need needs of on or place places please some something that the to want where with you va virginia richmond rva'.split(' '),
);

/**
 * Plain-language synonyms. Each key expands to extra terms that are matched
 * against the search index. Category ids (e.g. "dental") also match the
 * resource's categories directly.
 */
const SYNONYMS = {
  doctor: ['medical', 'primary care'],
  doctors: ['medical', 'primary care'],
  physician: ['medical', 'primary care'],
  checkup: ['medical', 'primary care'],
  physical: ['medical', 'primary care'],
  sick: ['medical', 'primary care'],
  clinic: ['medical', 'clinic', 'health center'],
  clinics: ['medical', 'clinic', 'health center'],
  primary: ['medical'],
  medical: ['medical'],
  dentist: ['dental'],
  dentists: ['dental'],
  teeth: ['dental'],
  tooth: ['dental'],
  toothache: ['dental'],
  dental: ['dental'],
  therapy: ['mental', 'counseling'],
  therapist: ['mental', 'counseling'],
  counseling: ['mental'],
  counselor: ['mental'],
  depression: ['mental'],
  depressed: ['mental'],
  anxiety: ['mental'],
  stress: ['mental'],
  psychiatrist: ['mental', 'psychiatry'],
  psychiatry: ['mental'],
  mental: ['mental'],
  crisis: ['crisis', 'mental'],
  suicide: ['crisis', 'mental'],
  suicidal: ['crisis', 'mental'],
  addiction: ['substance use'],
  alcohol: ['substance use'],
  opioid: ['substance use', 'opioid'],
  opioids: ['substance use', 'opioid'],
  recovery: ['substance use', 'recovery'],
  meds: ['rx', 'medication'],
  medicine: ['rx', 'medication'],
  medicines: ['rx', 'medication'],
  medication: ['rx'],
  medications: ['rx'],
  prescription: ['rx'],
  prescriptions: ['rx'],
  pharmacy: ['rx', 'pharmacy'],
  pills: ['rx'],
  rx: ['rx'],
  food: ['food'],
  hungry: ['food'],
  hunger: ['food'],
  pantry: ['food'],
  groceries: ['food'],
  meals: ['food'],
  insurance: ['coverage'],
  insured: ['coverage'],
  medicaid: ['coverage', 'medicaid'],
  famis: ['coverage', 'famis'],
  coverage: ['coverage'],
  kids: ['children', 'pediatric'],
  kid: ['children', 'pediatric'],
  children: ['pediatric'],
  child: ['children', 'pediatric'],
  baby: ['children', 'pediatric'],
  pediatrician: ['pediatric'],
  homeless: ['homelessness', 'housing'],
  housing: ['homelessness'],
  std: ['sti'],
  stds: ['sti'],
  espanol: ['spanish'],
  free: ['free'],
  cheap: ['free', 'sliding', 'reduced'],
  affordable: ['free', 'sliding', 'reduced'],
  'low cost': ['sliding', 'reduced'],
  uninsured: ['uninsured'],
};

const FIELD_WEIGHTS = { title: 6, tags: 3, kind: 2, body: 1, place: 2 };

/** Build a normalized, weighted text index for one resource. */
export function indexResource(resource) {
  const cats = resource.categories.map((id) => {
    const c = CATEGORIES.find((x) => x.id === id);
    return `${id} ${c ? c.label : ''}`;
  });
  const loc = (resource.locations || []).map((l) => [l.label, l.street, l.city, l.zip, l.area].join(' '));
  return {
    title: ' ' + normalize([resource.name, ...(resource.aka || []), resource.org].join(' ')),
    tags: ' ' + normalize([...(resource.tags || []), ...cats].join(' ')),
    kind: ' ' + normalize([resource.kind, resource.summary].join(' ')),
    body: ' ' + normalize([...(resource.services || []), ...(resource.eligibility || []), ACCESS[resource.access]?.label].join(' ')),
    place: ' ' + normalize(loc.join(' ')),
    zips: (resource.locations || []).map((l) => l.zip).filter(Boolean),
  };
}

/** Split a query into meaningful tokens, keeping two-word synonyms together. */
export function tokenize(query) {
  const words = normalize(query).split(' ').filter(Boolean);
  const tokens = [];
  for (let i = 0; i < words.length; i++) {
    const pair = `${words[i]} ${words[i + 1]}`;
    if (words[i + 1] && SYNONYMS[pair]) {
      tokens.push(pair);
      i++;
    } else if (!STOP_WORDS.has(words[i])) {
      tokens.push(words[i]);
    }
  }
  return tokens;
}

function stem(word) {
  return word.length > 4 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word;
}

/** Score how well one token matches a resource. 0 means no match. */
function scoreToken(token, resource, index) {
  // ZIP codes and partial ZIPs (e.g. "232")
  if (/^\d{3,5}$/.test(token)) {
    if (index.zips.some((z) => z === token)) return 8;
    if (token.length < 5 && index.zips.some((z) => z.startsWith(token))) return 3;
    return 0;
  }

  const variants = new Set([token, stem(token), ...(SYNONYMS[token] || [])]);
  let best = 0;

  for (const v of variants) {
    if (resource.categories.includes(v)) best = Math.max(best, 5);
    if (v === 'free' && resource.cost === 'free') best = Math.max(best, 4);
    if ((v === 'sliding' || v === 'reduced') && resource.cost === v) best = Math.max(best, 4);
    if (v === 'uninsured' && resource.accepts?.uninsured === true) best = Math.max(best, 3);

    const needle = ' ' + v;
    for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
      if (index[field].includes(needle)) best = Math.max(best, weight);
    }
  }
  return best;
}

/**
 * Returns a relevance score for a resource against a query.
 * Every meaningful token must match (AND). Empty queries match everything with score 0.
 */
export function scoreResource(resource, query, index = indexResource(resource)) {
  const tokens = tokenize(query);
  if (!tokens.length) return 0;
  let total = 0;
  for (const t of tokens) {
    const s = scoreToken(t, resource, index);
    if (!s) return -1;
    total += s;
  }
  return total;
}

/** True when the query has at least one meaningful token. */
export function hasQuery(query) {
  return tokenize(query).length > 0;
}

function matchesCost(resource, cost) {
  if (!cost || cost === 'any') return true;
  if (cost === 'free') return resource.cost === 'free';
  if (cost === 'low') return resource.cost === 'sliding' || resource.cost === 'reduced';
  return true;
}

function matchesInsurance(resource, insurance) {
  if (!insurance || insurance === 'any') return true;
  return resource.accepts?.[insurance] === true;
}

/**
 * Apply every filter in `state` and return scored, sorted results.
 * @param {object[]} resources
 * @param {object} state  { query, categories:Set, cost, insurance, savedOnly, saved:Set, sort, userLocation }
 * @param {object} [opts] { ignore: 'categories' } skips one filter (used for chip counts)
 */
export function filterResources(resources, state, opts = {}) {
  const searching = hasQuery(state.query);
  const out = [];
  for (const r of resources) {
    if (opts.ignore !== 'categories' && state.categories?.size && !r.categories.some((c) => state.categories.has(c))) continue;
    if (!matchesCost(r, state.cost)) continue;
    if (!matchesInsurance(r, state.insurance)) continue;
    if (state.savedOnly && !state.saved?.has(r.id)) continue;
    let score = 0;
    if (searching) {
      score = scoreResource(r, state.query, r._index || indexResource(r));
      if (score < 0) continue;
    }
    const near = state.userLocation ? nearestLocation(r, state.userLocation) : null;
    out.push({ resource: r, score, distance: near ? near.miles : null, nearest: near ? near.location : null });
  }
  return sortResults(out, state.sort, searching);
}

/** Recommended order: confirmed first, then in-person, then unrestricted, then by name. */
function baseCompare(a, b) {
  const va = a.resource.verification?.status === 'unconfirmed' ? 1 : 0;
  const vb = b.resource.verification?.status === 'unconfirmed' ? 1 : 0;
  if (va !== vb) return va - vb;
  const ra = ACCESS[a.resource.access]?.rank ?? 9;
  const rb = ACCESS[b.resource.access]?.rank ?? 9;
  if (ra !== rb) return ra - rb;
  // Places with a restriction notice (e.g. "children only") come after open ones.
  const aa = a.resource.alert ? 1 : 0;
  const ab = b.resource.alert ? 1 : 0;
  if (aa !== ab) return aa - ab;
  return a.resource.name.localeCompare(b.resource.name);
}

export function sortResults(items, sort = 'recommended', searching = false) {
  const list = [...items];
  if (sort === 'az') {
    list.sort((a, b) => a.resource.name.localeCompare(b.resource.name));
  } else if (sort === 'distance') {
    list.sort((a, b) => {
      if (a.distance == null && b.distance == null) return baseCompare(a, b);
      if (a.distance == null) return 1;
      if (b.distance == null) return -1;
      return a.distance - b.distance;
    });
  } else {
    list.sort((a, b) => (searching && b.score !== a.score ? b.score - a.score : baseCompare(a, b)));
  }
  return list;
}

/** Count matches per category, honoring every filter except the category chips. */
export function categoryCounts(resources, state) {
  const base = filterResources(resources, state, { ignore: 'categories' });
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c.id, 0]));
  for (const { resource } of base) for (const c of resource.categories) counts[c]++;
  counts.all = base.length;
  return counts;
}

export function costLabel(resource) {
  return resource.costLabel || COST[resource.cost]?.label || 'Ask about cost';
}

export function acceptsList(resource) {
  return Object.entries(ACCEPTS_LABELS)
    .filter(([key]) => resource.accepts?.[key] === true)
    .map(([, label]) => label);
}

/** Attach a precomputed search index to each resource (non-enumerable). */
export function prepareResources(resources) {
  for (const r of resources) Object.defineProperty(r, '_index', { value: indexResource(r), enumerable: false });
  return resources;
}
