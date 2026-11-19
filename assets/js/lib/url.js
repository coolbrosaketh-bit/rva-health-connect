/**
 * Keep search and filters in the URL so any view can be shared or bookmarked.
 *   ?q=dentist&cat=dental,medical&cost=free&ins=uninsured&sort=az&view=map&r=health-brigade
 */
import { CATEGORIES, COST_FILTERS, INSURANCE_FILTERS, SORTS } from '../data/taxonomy.js';

const valid = (list) => new Set(list.map((x) => x.value));
const COSTS = valid(COST_FILTERS);
const INS = valid(INSURANCE_FILTERS);
const SORT = valid(SORTS);
const CATS = new Set(CATEGORIES.map((c) => c.id));

export function readUrlState(search = window.location.search) {
  const p = new URLSearchParams(search);
  const cats = (p.get('cat') || '').split(',').filter((c) => CATS.has(c));
  return {
    query: (p.get('q') || '').slice(0, 120),
    categories: new Set(cats),
    cost: COSTS.has(p.get('cost')) ? p.get('cost') : 'any',
    insurance: INS.has(p.get('ins')) ? p.get('ins') : 'any',
    sort: SORT.has(p.get('sort')) && p.get('sort') !== 'distance' ? p.get('sort') : 'recommended',
    view: p.get('view') === 'map' ? 'map' : 'list',
    savedOnly: p.get('saved') === '1',
    openId: p.get('r') || null,
  };
}

export function writeUrlState(state) {
  const p = new URLSearchParams();
  if (state.query.trim()) p.set('q', state.query.trim());
  if (state.categories.size) p.set('cat', [...state.categories].join(','));
  if (state.cost !== 'any') p.set('cost', state.cost);
  if (state.insurance !== 'any') p.set('ins', state.insurance);
  if (state.sort !== 'recommended' && state.sort !== 'distance') p.set('sort', state.sort);
  if (state.view === 'map') p.set('view', 'map');
  if (state.savedOnly) p.set('saved', '1');
  if (state.openId) p.set('r', state.openId);
  const qs = p.toString();
  const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
  if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
    window.history.replaceState(null, '', next);
  }
}

/** A clean share link for a single resource. */
export function resourceLink(id) {
  const url = new URL(window.location.href);
  url.search = `?r=${encodeURIComponent(id)}`;
  url.hash = '';
  return url.toString();
}
