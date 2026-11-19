/** Result list: cards, count and empty state. */
import { esc, pluralize } from '../lib/format.js';
import { isMappable } from '../lib/geo.js';
import { CATEGORY_BY_ID } from '../data/taxonomy.js';
import { icon } from './icons.js';
import {
  spineFor, categoryTags, costBadge, acceptsBadges, callButton, directionsButton,
  websiteButton, whereLine, distanceLine, hoursLine, verifiedLine, primaryLocation,
} from './render.js';

function cardHTML(item, state) {
  const r = item.resource;
  const saved = state.saved.has(r.id);
  const unconfirmed = r.verification.status === 'unconfirmed';
  const loc = item.nearest || primaryLocation(r);
  const mappable = isMappable(r);
  const facts = [whereLine(r, item), distanceLine(item), hoursLine(r)].filter(Boolean).map((f) => `<li>${f}</li>`).join('')
    + (r.phone || r.website ? `<li class="print-only">${icon('phone', { size: 16 })}<span>${[r.phone, r.website].filter(Boolean).map(esc).join('  ')}</span></li>` : '');

  // Primary action: call. Secondary: directions for places, website for online services.
  const secondary = mappable ? directionsButton(loc) : websiteButton(r.website, { label: r.access === 'online' ? 'Open website' : 'Website' });
  const textBtn = r.sms ? `<a class="btn" href="sms:${esc(r.sms)}">${icon('messages-square', { size: 18 })}Text ${esc(r.sms)}</a>` : '';

  return `
  <li class="card${unconfirmed ? ' is-unconfirmed' : ''}${state.selectedId === r.id ? ' is-selected' : ''}" data-id="${esc(r.id)}" style="--spine:${spineFor(r)}">
    <div class="card__top">
      <div class="card__heading">
        <div class="card__cats">${categoryTags(r)}</div>
        <h3 class="card__title" id="t-${esc(r.id)}"><a href="?r=${encodeURIComponent(r.id)}" data-open="${esc(r.id)}">${esc(r.name)}</a></h3>
        <p class="card__kind">${esc(r.kind)}${r.org ? `, ${esc(r.org)}` : ''}</p>
      </div>
      <button class="icon-btn" type="button" data-save="${esc(r.id)}" aria-pressed="${saved}" aria-label="${saved ? 'Remove' : 'Save'} ${esc(r.name)}${saved ? ' from saved places' : ''}">
        ${icon(saved ? 'bookmark-check' : 'bookmark', { size: 20 })}
      </button>
    </div>
    ${r.alert ? `<p class="card__alert">${icon('triangle-alert', { size: 18 })}<span>${esc(r.alert)}</span></p>` : ''}
    <div class="badges">${costBadge(r)}${acceptsBadges(r)}</div>
    <ul class="facts">${facts}</ul>
    <div class="card__actions">
      ${callButton(r.phone)}
      ${textBtn}
      ${secondary}
      ${mappable ? `<button class="btn btn--quiet" type="button" data-locate="${esc(r.id)}">${icon('map', { size: 18 })}Show on map</button>` : ''}
      <button class="btn btn--quiet" type="button" data-open="${esc(r.id)}" aria-describedby="t-${esc(r.id)}">${icon('info', { size: 18 })}Details</button>
    </div>
    <div class="card__foot">${verifiedLine(r)}</div>
  </li>`;
}

function emptyHTML(state) {
  const bits = [];
  if (state.query.trim()) bits.push(`“${esc(state.query.trim())}”`);
  if (state.categories.size) bits.push([...state.categories].map((c) => CATEGORY_BY_ID[c].label).join(' or '));
  const what = bits.length ? ` for ${bits.join(' in ')}` : '';
  if (state.savedOnly) {
    return `<div class="empty">
      <h3>No saved places yet</h3>
      <p>Tap the bookmark on any place to keep it here. Saved places stay on this device only.</p>
      <div class="empty__actions"><button class="btn btn--primary" type="button" data-action="show-all">Show all places</button></div>
    </div>`;
  }
  return `<div class="empty">
    <h3>No places match${what}</h3>
    <p>Try a shorter search like “dentist” or “therapy”, or remove a filter. 211 can also search hundreds more services for you, any time.</p>
    <div class="empty__actions">
      <button class="btn btn--primary" type="button" data-action="reset-filters">Clear search and filters</button>
      <a class="btn" href="tel:211">${icon('phone', { size: 18 })}Dial 211</a>
    </div>
  </div>`;
}

let lastKey = '';

/** Render cards only when the visible set or its order/state actually changed. */
export function renderResults({ list, empty, count }, items, state, total) {
  const key = JSON.stringify([
    items.map((i) => `${i.resource.id}:${i.distance?.toFixed(2) ?? ''}`),
    [...state.saved].sort(),
    state.savedOnly,
  ]);
  if (key !== lastKey) {
    lastKey = key;
    list.innerHTML = items.map((i) => cardHTML(i, state)).join('');
    if (items.length) {
      empty.hidden = true;
      empty.innerHTML = '';
    } else {
      empty.innerHTML = emptyHTML(state);
      empty.hidden = false;
    }
  }
  count.textContent = items.length === total
    ? `Showing all ${pluralize(total, 'place')}`
    : `Showing ${items.length} of ${pluralize(total, 'place')}`;
}

/** Update only the selected highlight (no full re-render, so focus is kept). */
export function markSelected(list, id) {
  list.querySelectorAll('.card.is-selected').forEach((el) => el.classList.remove('is-selected'));
  if (id) list.querySelector(`.card[data-id="${CSS.escape(id)}"]`)?.classList.add('is-selected');
}

export function forceRerender() {
  lastKey = '';
}
