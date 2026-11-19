/** Small, shared render helpers used by cards, popups and the detail drawer. */
import { CATEGORY_BY_ID, COST, ACCESS } from '../data/taxonomy.js';
import { esc, telHref, fullAddress, directionsUrl, formatDate, formatMiles } from '../lib/format.js';
import { acceptsList, costLabel } from '../lib/search.js';
import { mappableLocations } from '../lib/geo.js';
import { icon } from './icons.js';

/** Vertical "route spine" — one color band per category. */
export function spineFor(resource) {
  const colors = resource.categories.map((c) => CATEGORY_BY_ID[c].color);
  if (colors.length === 1) return colors[0];
  const step = 100 / colors.length;
  const stops = colors.map((c, i) => `${c} ${(i * step).toFixed(2)}% ${((i + 1) * step).toFixed(2)}%`);
  return `linear-gradient(to bottom, ${stops.join(', ')})`;
}

export function categoryTags(resource) {
  return resource.categories
    .map((id) => {
      const c = CATEGORY_BY_ID[id];
      return `<span class="cat-tag" style="--c:${c.color}">${icon(c.icon, { size: 15 })}${esc(c.label)}</span>`;
    })
    .join('');
}

export function costBadge(resource) {
  const tone = COST[resource.cost]?.tone || 'neutral';
  return `<span class="badge badge--${tone}">${esc(costLabel(resource))}</span>`;
}

export function acceptsBadges(resource) {
  return acceptsList(resource)
    .map((label) => `<span class="badge badge--accepts">${icon('check', { size: 13 })}${esc(label)}</span>`)
    .join('');
}

export function callButton(phone, { label = 'Call', compact = false } = {}) {
  if (!phone) return '';
  const text = compact ? label : `${label} <span class="nowrap">${esc(phone)}</span>`;
  return `<a class="btn btn--call" href="${telHref(phone)}" aria-label="Call ${esc(phone)}">${icon('phone', { size: 18 })}<span>${text}</span></a>`;
}

export function directionsButton(location, { label = 'Directions' } = {}) {
  if (!location?.street) return '';
  return `<a class="btn" href="${directionsUrl(location)}" target="_blank" rel="noopener" aria-label="Directions to ${esc(fullAddress(location))} (opens Google Maps)">${icon('navigation', { size: 18 })}${esc(label)}</a>`;
}

export function websiteButton(url, { label = 'Website' } = {}) {
  if (!url) return '';
  return `<a class="btn" href="${esc(url)}" target="_blank" rel="noopener">${icon('external-link', { size: 18 })}${esc(label)}<span class="visually-hidden"> (opens in a new tab)</span></a>`;
}

/** One-line description of where/how to get the service. */
export function whereLine(resource, item = {}) {
  const locs = resource.locations || [];
  const access = ACCESS[resource.access];
  if (resource.access === 'in-person' || resource.access === 'mobile') {
    const loc = item.nearest || locs[0];
    if (!loc) return `${icon(access.icon, { size: 16 })}<span>${esc(access.label)}</span>`;
    const more = locs.length > 1 ? ` <span>and ${locs.length - 1} more location${locs.length > 2 ? 's' : ''}</span>` : '';
    const area = loc.area ? ` (${esc(loc.area)})` : '';
    return `${icon(resource.access === 'mobile' ? 'bus' : 'map-pin', { size: 16 })}<span><strong>${esc(loc.street)}</strong>, ${esc(loc.city)} ${esc(loc.zip)}${area}${more}</span>`;
  }
  return `${icon(access.icon, { size: 16 })}<span><strong>${esc(access.label)}</strong></span>`;
}

export function distanceLine(item) {
  if (item.distance == null) return '';
  return `${icon('locate-fixed', { size: 16 })}<span><span class="distance">${esc(formatMiles(item.distance))}</span> from you</span>`;
}

export function hoursLine(resource) {
  const loc = (resource.locations || [])[0];
  const first = loc?.hours?.[0];
  if (!first || (resource.locations || []).length > 1) return '';
  return `${icon('clock', { size: 16 })}<span>${esc(first)}</span>`;
}

export function verifiedLine(resource) {
  const v = resource.verification;
  if (v.status === 'unconfirmed') {
    return `<span class="unverified">${icon('triangle-alert', { size: 14 })} Not confirmed — call before you go</span>`;
  }
  return `<span class="verified">${icon('badge-check', { size: 14 })} Checked ${esc(formatDate(v.checked, { short: true }))}</span>`;
}

export function primaryLocation(resource) {
  return mappableLocations(resource)[0] || (resource.locations || [])[0] || null;
}
