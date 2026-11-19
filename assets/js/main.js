/**
 * RVA Health Connect — app entry point.
 * Wires state → views. Views never talk to each other directly; they read
 * from the store and dispatch changes back to it.
 */
import { RESOURCES, DATA_REVIEWED, MEDICAID_LIMITS_2026 } from './data/resources.js';
import { CATEGORIES, CATEGORY_BY_ID, COST_FILTERS, INSURANCE_FILTERS, SORTS } from './data/taxonomy.js';
import { prepareResources, filterResources, categoryCounts } from './lib/search.js';
import { createStore } from './lib/store.js';
import { loadSaved, persistSaved } from './lib/storage.js';
import { readUrlState, writeUrlState } from './lib/url.js';
import { inRichmondArea, isMappable } from './lib/geo.js';
import { esc, formatDate, formatMoney, pluralize } from './lib/format.js';
import { icon } from './ui/icons.js';
import { renderResults, markSelected } from './ui/results.js';
import { renderDetail, shareResource, copyText, printDetail } from './ui/detail.js';
import { createGuide } from './ui/guide.js';
import { createMap } from './map/map.js';

prepareResources(RESOURCES);
const byId = new Map(RESOURCES.map((r) => [r.id, r]));

/* ---------- DOM ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const dom = {
  routeStops: $('[data-route-stops]'),
  route: $('[data-route]'),
  queryInputs: $$('[data-query-input]'),
  heroForm: $('[data-hero-search]'),
  clearQuery: $('[data-action="clear-query"]'),
  chips: $('[data-chips]'),
  selects: Object.fromEntries($$('[data-filter]').map((s) => [s.dataset.filter, s])),
  controls: $('[data-controls]'),
  filtersToggle: $('[data-filters-toggle]'),
  filtersDot: $('[data-filters-dot]'),
  viewButtons: $$('[data-view]').filter((b) => b.tagName === 'BUTTON'),
  active: $('[data-active-filters]'),
  body: $('[data-finder-body]'),
  list: $('[data-results-list]'),
  empty: $('[data-empty]'),
  count: $('[data-count]'),
  findTitle: $('#find-title'),
  toolbar: $('[data-toolbar]'),
  mapPanel: $('[data-map-panel]'),
  detail: $('[data-detail]'),
  guide: $('[data-guide]'),
  toast: $('[data-toast]'),
  savedBtn: $('[data-action="show-saved"]'),
  savedCount: $('[data-saved-count]'),
  navToggle: $('[data-nav-toggle]'),
  nav: $('#site-nav'),
  limits: $('[data-limits]'),
};

const desktop = window.matchMedia('(min-width: 1100px)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const scrollBehavior = () => (reducedMotion.matches ? 'auto' : 'smooth');

/* ---------- State ---------- */
const fromUrl = readUrlState();
const store = createStore({
  query: fromUrl.query,
  categories: fromUrl.categories,
  cost: fromUrl.cost,
  insurance: fromUrl.insurance,
  sort: fromUrl.sort,
  view: fromUrl.view,
  savedOnly: fromUrl.savedOnly,
  saved: loadSaved(),
  openId: byId.has(fromUrl.openId) ? fromUrl.openId : null,
  selectedId: null,
  userLocation: null,
});

let items = [];

/* ---------- Toast ---------- */
let toastTimer;
function toast(message) {
  dom.toast.innerHTML = `${icon('check', { size: 18 })}<span>${esc(message)}</span>`;
  dom.toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => dom.toast.classList.remove('is-visible'), 3200);
}

/* ---------- Static content ---------- */
function renderRoute() {
  const totals = Object.fromEntries(CATEGORIES.map((c) => [c.id, RESOURCES.filter((r) => r.categories.includes(c.id)).length]));
  dom.routeStops.innerHTML = CATEGORIES.map((c, i) => `
    <li class="route__stop" style="--c:${c.color}; --i:${i}">
      <button class="route__btn" type="button" data-route-cat="${c.id}" aria-pressed="false">
        <span class="route__sign">${icon(c.icon, { size: 28 })}</span>
        <span class="route__dot" aria-hidden="true"></span>
        <span class="route__label">${esc(c.label)}</span>
        <span class="route__text"><span class="route__blurb">${esc(c.blurb)}</span><span class="route__count">${pluralize(totals[c.id], 'place')}</span></span>
      </button>
    </li>`).join('');
  if (!reducedMotion.matches) {
    dom.route.classList.add('is-animating');
    setTimeout(() => dom.route.classList.remove('is-animating'), 1600);
  }
}

function renderLimits() {
  const t = MEDICAID_LIMITS_2026;
  dom.limits.innerHTML = `
    <table>
      <caption>2026 Medicaid income limits, adults 19–64<span>Income before taxes. Guidelines as of ${esc(formatDate(t.asOf))}.</span></caption>
      <thead><tr><th scope="col">People in household</th><th scope="col">Per year</th><th scope="col">Per month</th></tr></thead>
      <tbody>${t.rows.map((r) => `<tr><th scope="row">${r.household}</th><td>${formatMoney(r.yearly)}</td><td>${formatMoney(r.monthly)}</td></tr>`).join('')}</tbody>
    </table>
    <p class="limits__source">Source: <a href="${esc(t.source)}" target="_blank" rel="noopener">Cover Virginia</a>. Bigger households have higher limits.</p>`;
}

function initSelects() {
  const fill = (select, options) => { select.innerHTML = options.map((o) => `<option value="${o.value}">${esc(o.label)}</option>`).join(''); };
  fill(dom.selects.cost, COST_FILTERS);
  fill(dom.selects.insurance, INSURANCE_FILTERS);
  fill(dom.selects.sort, SORTS);
}

/* ---------- Dynamic views ---------- */
function renderChips(state) {
  const counts = categoryCounts(RESOURCES, state);
  const allPressed = state.categories.size === 0;
  dom.chips.innerHTML = [
    `<button class="chip chip--all" type="button" data-chip="all" aria-pressed="${allPressed}">All <span class="chip__count">${counts.all}</span></button>`,
    ...CATEGORIES.map((c) => {
      const pressed = state.categories.has(c.id);
      return `<button class="chip" type="button" data-chip="${c.id}" aria-pressed="${pressed}" style="--c:${c.color}">${icon(c.icon, { size: 18 })}${esc(c.label)} <span class="chip__count" aria-label="${counts[c.id]} places">${counts[c.id]}</span></button>`;
    }),
  ].join('');
}

function renderActiveFilters(state) {
  const pills = [];
  const pill = (label, action) => `<button class="pill" type="button" data-remove="${action}" aria-label="Remove filter: ${esc(label)}">${esc(label)}${icon('x', { size: 14 })}</button>`;
  if (state.query.trim()) pills.push(pill(`“${state.query.trim()}”`, 'query'));
  for (const c of state.categories) pills.push(pill(CATEGORY_BY_ID[c].label, `cat:${c}`));
  if (state.cost !== 'any') pills.push(pill(COST_FILTERS.find((o) => o.value === state.cost).label, 'cost'));
  if (state.insurance !== 'any') pills.push(pill(INSURANCE_FILTERS.find((o) => o.value === state.insurance).label, 'insurance'));
  if (state.savedOnly) pills.push(pill('Saved places', 'saved'));
  if (state.sort === 'distance') pills.push(pill('Nearest to me', 'sort'));
  dom.active.innerHTML = pills.length
    ? `<span class="active-filters__label">Showing:</span>${pills.join('')}${pills.length > 1 ? '<button class="link-btn" type="button" data-action="reset-filters">Clear all</button>' : ''}`
    : '';
}

function syncControls(state) {
  for (const input of dom.queryInputs) if (input.value !== state.query && document.activeElement !== input) input.value = state.query;
  dom.clearQuery.hidden = !state.query;
  dom.selects.cost.value = state.cost;
  dom.selects.insurance.value = state.insurance;
  dom.selects.sort.value = state.sort;
  for (const key of ['cost', 'insurance', 'sort']) {
    dom.selects[key].closest('.control').classList.toggle('control--active', dom.selects[key].value !== dom.selects[key].options[0].value);
  }
  dom.filtersDot.hidden = state.cost === 'any' && state.insurance === 'any' && state.sort === 'recommended';
  $$('[data-route-cat]').forEach((b) => b.setAttribute('aria-pressed', String(state.categories.size === 1 && state.categories.has(b.dataset.routeCat))));
  dom.savedBtn.setAttribute('aria-pressed', String(state.savedOnly));
}

function renderSavedCount(state) {
  dom.savedCount.textContent = state.saved.size ? String(state.saved.size) : '';
  dom.savedBtn.setAttribute('aria-label', `Saved places${state.saved.size ? `, ${state.saved.size}` : ''}`);
}

function applyView(state) {
  dom.body.dataset.view = state.view;
  dom.viewButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === state.view)));
  if (state.view === 'map' || desktop.matches) showMap();
}

/* ---------- Map ---------- */
let lastMapKey = '';
const map = createMap({
  el: $('[data-map]'),
  statusEl: $('[data-map-status]'),
  legendEl: $('[data-map-legend]'),
  noteEl: $('[data-map-note]'),
  onSelect: (id) => store.set({ selectedId: id }),
  onOpen: (id) => openDetail(id),
  onLocate: (btn) => locate(btn),
  onUseList: () => {
    if (desktop.matches) dom.list.querySelector('.card__title a')?.focus();
    else store.set({ view: 'list' });
  },
});

let mapShown = false;
async function showMap() {
  if (getComputedStyle(dom.mapPanel).display === 'none') return;
  const ok = await map.show(RESOURCES);
  if (!ok) return;
  if (!mapShown) {
    mapShown = true;
    lastMapKey = '';
    syncMap({ fit: true });
  }
  map.refresh();
}

function syncMap({ fit }) {
  const key = items.map((i) => i.resource.id).filter((id) => isMappable(byId.get(id))).join(',');
  if (key === lastMapKey && !fit) return;
  const changed = key !== lastMapKey;
  lastMapKey = key;
  map.update(items, { fit: fit && changed });
}

/* ---------- Detail ---------- */
let detailTrigger = null;
function openDetail(id, trigger = document.activeElement) {
  if (!byId.has(id)) return;
  detailTrigger = trigger;
  store.set({ openId: id, selectedId: id });
}

function renderDetailFor(state) {
  if (state.openId) {
    renderDetail(dom.detail, byId.get(state.openId), state);
    if (!dom.detail.open) dom.detail.showModal();
    dom.detail.querySelector('.drawer__body').scrollTop = 0;
    dom.detail.querySelector('#detail-title')?.setAttribute('tabindex', '-1');
    dom.detail.querySelector('[data-close]')?.focus();
  } else if (dom.detail.open) {
    dom.detail.close();
  }
}

dom.detail.addEventListener('close', () => {
  if (store.get().openId) store.set({ openId: null });
  if (detailTrigger?.isConnected) detailTrigger.focus();
  detailTrigger = null;
});
dom.detail.addEventListener('click', (e) => {
  if (e.target === dom.detail || e.target.closest('[data-close]')) dom.detail.close();
  if (e.target.closest('[data-print]')) printDetail();
});

/* ---------- Saved ---------- */
function toggleSaved(id) {
  const saved = new Set(store.get().saved);
  const r = byId.get(id);
  const nowSaved = !saved.has(id);
  if (nowSaved) saved.add(id); else saved.delete(id);
  const persisted = persistSaved(saved);
  store.set({ saved });
  // Update every save button for this place in place, so keyboard focus isn't lost.
  for (const btn of $$(`[data-save="${CSS.escape(id)}"]`)) {
    btn.setAttribute('aria-pressed', String(nowSaved));
    const svg = btn.querySelector('svg');
    if (svg) svg.outerHTML = icon(nowSaved ? 'bookmark-check' : 'bookmark', { size: btn.classList.contains('icon-btn') ? 20 : 18 });
    if (btn.classList.contains('icon-btn')) btn.setAttribute('aria-label', `${nowSaved ? 'Remove' : 'Save'} ${r.name}${nowSaved ? ' from saved places' : ''}`);
    const label = btn.querySelector('span');
    if (label) label.textContent = nowSaved ? 'Saved' : 'Save';
  }
  if (!persisted) toast('Saved for this visit only — this browser blocks storage');
  else toast(nowSaved ? `Saved ${r.name}` : `Removed ${r.name}`);
}

/* ---------- Location ---------- */
function locate(trigger) {
  if (!('geolocation' in navigator)) {
    toast('This browser can’t share your location. Try searching by ZIP code.');
    if (store.get().sort === 'distance') store.set({ sort: 'recommended' });
    return;
  }
  trigger?.setAttribute('aria-busy', 'true');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      trigger?.removeAttribute('aria-busy');
      const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      store.set({ userLocation: point, sort: 'distance' });
      const nearest = items.filter((i) => i.nearest).slice(0, 3).map((i) => i.nearest);
      map.setUserLocation(point, nearest);
      toast(inRichmondArea(point)
        ? 'Sorted by distance. Your location stays in this browser.'
        : 'You seem to be outside Richmond, so distances may be long.');
    },
    (err) => {
      trigger?.removeAttribute('aria-busy');
      if (store.get().sort === 'distance' && !store.get().userLocation) store.set({ sort: 'recommended' });
      const messages = {
        1: 'Location is off for this site. You can search by ZIP code instead.',
        2: 'Your location isn’t available right now. Try searching by ZIP code.',
        3: 'Finding your location took too long. Try again or search by ZIP code.',
      };
      toast(messages[err.code] || messages[2]);
    },
    { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
  );
}

/* ---------- Render loop ---------- */
const FILTER_KEYS = ['query', 'categories', 'cost', 'insurance', 'savedOnly', 'sort', 'userLocation'];

function render(state, prev, changed) {
  const all = !changed;
  const filtersChanged = all || FILTER_KEYS.some((k) => changed.has(k)) || (state.savedOnly && changed.has('saved'));

  if (filtersChanged) {
    items = filterResources(RESOURCES, state);
    renderResults({ list: dom.list, empty: dom.empty, count: dom.count }, items, state, RESOURCES.length);
    renderChips(state);
    renderActiveFilters(state);
    if (mapShown) syncMap({ fit: !changed || ['query', 'categories', 'cost', 'insurance', 'savedOnly'].some((k) => changed.has(k)) });
    if (state.selectedId && !items.some((i) => i.resource.id === state.selectedId)) queueMicrotask(() => store.set({ selectedId: null }));
  }
  if (all || changed.has('selectedId')) {
    markSelected(dom.list, state.selectedId);
    if (mapShown) map.highlight(state.selectedId);
    if (changed?.has('selectedId') && state.selectedId && desktop.matches && !state.openId) {
      dom.list.querySelector(`.card[data-id="${CSS.escape(state.selectedId)}"]`)?.scrollIntoView({ block: 'nearest', behavior: scrollBehavior() });
    }
  }
  if (all || changed.has('saved')) renderSavedCount(state);
  if (all || changed.has('view')) applyView(state);
  if (all || changed.has('openId')) renderDetailFor(state);
  syncControls(state);
  writeUrlState(state);
}

store.subscribe(render);

/* ---------- Events ---------- */
let queryTimer;
for (const input of dom.queryInputs) {
  input.addEventListener('input', () => {
    for (const other of dom.queryInputs) if (other !== input) other.value = input.value;
    dom.clearQuery.hidden = !input.value;
    clearTimeout(queryTimer);
    queryTimer = setTimeout(() => store.set({ query: input.value, savedOnly: false }), 140);
  });
}

dom.heroForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearTimeout(queryTimer);
  store.set({ query: $('#hero-q').value, savedOnly: false });
  goToResults();
});

$('#q').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { clearTimeout(queryTimer); store.set({ query: e.target.value }); }
  if (e.key === 'Escape' && e.target.value) { e.target.value = ''; store.set({ query: '' }); }
});

function goToResults() {
  dom.findTitle.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  dom.findTitle.focus({ preventScroll: true });
}

for (const [key, select] of Object.entries(dom.selects)) {
  select.addEventListener('change', () => {
    if (key === 'sort' && select.value === 'distance' && !store.get().userLocation) {
      store.set({ sort: 'distance' });
      locate(null);
      return;
    }
    store.set({ [key]: select.value });
  });
}

dom.viewButtons.forEach((b) => b.addEventListener('click', () => {
  store.set({ view: b.dataset.view });
  dom.body.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
}));

dom.filtersToggle.addEventListener('click', () => {
  const open = dom.controls.classList.toggle('is-open');
  dom.filtersToggle.setAttribute('aria-expanded', String(open));
});

dom.navToggle.addEventListener('click', () => {
  const open = dom.nav.classList.toggle('is-open');
  dom.navToggle.setAttribute('aria-expanded', String(open));
});
dom.nav.addEventListener('click', (e) => {
  if (e.target.closest('a')) { dom.nav.classList.remove('is-open'); dom.navToggle.setAttribute('aria-expanded', 'false'); }
});

const guide = createGuide(dom.guide, {
  countFor: (f) => filterResources(RESOURCES, { ...store.get(), query: '', savedOnly: false, categories: f.categories, insurance: f.insurance, cost: 'any' }).length,
  onApply: (f) => {
    store.set({ query: '', savedOnly: false, cost: 'any', categories: f.categories, insurance: f.insurance });
    goToResults();
  },
});

// One delegated handler for every action button on the page.
document.addEventListener('click', (e) => {
  const t = e.target.closest('button, a');
  if (!t) return;
  const state = store.get();

  if (t.dataset.open) {
    e.preventDefault();
    if (dom.detail.open && state.openId === t.dataset.open) return;
    openDetail(t.dataset.open, t);
  } else if (t.dataset.save) {
    toggleSaved(t.dataset.save);
  } else if (t.dataset.share) {
    shareResource(byId.get(t.dataset.share), toast);
  } else if (t.dataset.copy) {
    copyText(t.dataset.copy).then((ok) => toast(ok ? 'Address copied' : 'Couldn’t copy the address'));
  } else if (t.dataset.locate) {
    const id = t.dataset.locate;
    const locIndex = t.dataset.locIndex != null ? Number(t.dataset.locIndex) : undefined;
    if (dom.detail.open) dom.detail.close();
    store.set({ selectedId: id, ...(desktop.matches ? {} : { view: 'map' }) });
    if (!desktop.matches) dom.body.scrollIntoView({ behavior: 'auto', block: 'start' });
    showMap().then(() => map.focus(id, locIndex));
  } else if (t.dataset.chip) {
    const c = t.dataset.chip;
    if (c === 'all') store.set({ categories: new Set() });
    else {
      const next = new Set(state.categories);
      if (next.has(c)) next.delete(c); else next.add(c);
      store.set({ categories: next });
    }
  } else if (t.dataset.routeCat) {
    store.set({ categories: new Set([t.dataset.routeCat]), query: '', savedOnly: false });
    goToResults();
  } else if (t.dataset.remove) {
    const r = t.dataset.remove;
    if (r === 'query') store.set({ query: '' });
    else if (r.startsWith('cat:')) { const next = new Set(state.categories); next.delete(r.slice(4)); store.set({ categories: next }); }
    else if (r === 'saved') store.set({ savedOnly: false });
    else if (r === 'sort') store.set({ sort: 'recommended' });
    else store.set({ [r]: 'any' });
    dom.findTitle.focus({ preventScroll: true });
  } else if (t.dataset.action) {
    const a = t.dataset.action;
    if (a === 'open-guide') guide.open();
    else if (a === 'clear-query') { store.set({ query: '' }); $('#q').focus(); }
    else if (a === 'reset-filters' || a === 'show-all') {
      store.set({ query: '', categories: new Set(), cost: 'any', insurance: 'any', savedOnly: false, sort: state.userLocation ? state.sort : 'recommended' });
      dom.findTitle.focus({ preventScroll: true });
    } else if (a === 'show-saved') {
      store.set({ savedOnly: !state.savedOnly });
      goToResults();
    }
  }
});

// List ↔ map hover sync (pointer and keyboard focus)
const hoverId = (e) => e.target.closest?.('.card')?.dataset.id;
dom.list.addEventListener('pointerover', (e) => { if (mapShown && desktop.matches) map.highlight(hoverId(e) || store.get().selectedId); });
dom.list.addEventListener('pointerleave', () => { if (mapShown) map.highlight(store.get().selectedId); });
dom.list.addEventListener('focusin', (e) => { if (mapShown && desktop.matches) map.highlight(hoverId(e) || store.get().selectedId); });

// Keyboard shortcut: "/" jumps to search
document.addEventListener('keydown', (e) => {
  if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target.closest('input, textarea, select, [contenteditable]') || document.querySelector('dialog[open]')) return;
  e.preventDefault();
  $('#q').focus();
});

/* ---------- Layout observers ---------- */
// Keep the sticky toolbar height available to CSS (map height, scroll padding).
new ResizeObserver(([entry]) => {
  document.documentElement.style.setProperty('--toolbar-h', `${Math.ceil(entry.borderBoxSize?.[0]?.blockSize ?? dom.toolbar.offsetHeight)}px`);
}).observe(dom.toolbar);

// Add a shadow once the toolbar is stuck to the top.
const sentinel = document.createElement('div');
sentinel.setAttribute('aria-hidden', 'true');
dom.toolbar.before(sentinel);
new IntersectionObserver(([entry]) => dom.toolbar.classList.toggle('is-stuck', !entry.isIntersecting)).observe(sentinel);

// Load the map only when it is about to be seen.
new IntersectionObserver((entries) => {
  if (entries.some((e) => e.isIntersecting)) showMap();
}, { rootMargin: '600px 0px' }).observe(dom.mapPanel);

desktop.addEventListener('change', () => applyView(store.get()));

/* ---------- Boot ---------- */
$$('[data-reviewed]').forEach((el) => { el.textContent = formatDate(DATA_REVIEWED); el.setAttribute('datetime', DATA_REVIEWED); });
initSelects();
renderRoute();
renderLimits();
render(store.get(), null, null);
