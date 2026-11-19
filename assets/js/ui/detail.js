/** Resource detail drawer (native <dialog>: focus trap, Esc to close, inert background). */
import { esc, telHref, smsHref, fullAddress, formatDate } from '../lib/format.js';
import { isMappable } from '../lib/geo.js';
import { resourceLink } from '../lib/url.js';
import { icon } from './icons.js';
import {
  spineFor, categoryTags, costBadge, acceptsBadges, callButton, directionsButton, websiteButton, primaryLocation,
} from './render.js';

const REPORT_URL = 'https://github.com/coolbrosaketh-bit/rva-health-connect/issues/new';

function list(items, cls = 'detail__list', tag = 'ul') {
  if (!items?.length) return '';
  return `<${tag} class="${cls}">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</${tag}>`;
}

function section(title, body) {
  return body ? `<section class="detail__section"><h3>${esc(title)}</h3>${body}</section>` : '';
}

function locationsHTML(r) {
  const locs = r.locations || [];
  if (!locs.length) return '';
  const mappable = isMappable(r);
  return locs
    .map((l, i) => {
      const hours = (l.hours || []).map((h) => `<li>${icon('clock', { size: 16 })}<span>${esc(h)}</span></li>`).join('');
      const phone = l.phone && l.phone !== r.phone
        ? `<li>${icon('phone', { size: 16 })}<span><a href="${telHref(l.phone)}">${esc(l.phone)}</a></span></li>`
        : '';
      const notes = l.notes ? `<li>${icon('info', { size: 16 })}<span>${esc(l.notes)}</span></li>` : '';
      const canMap = mappable && Number.isFinite(l.lat);
      return `<div class="location">
        <p class="location__name">${esc(l.label || r.name)}${l.area ? ` <span class="location__area">(${esc(l.area)})</span>` : ''}</p>
        <p class="location__addr">${esc(fullAddress(l))}</p>
        ${hours || phone || notes ? `<ul class="facts">${phone}${hours}${notes}</ul>` : ''}
        <div class="location__actions">
          ${directionsButton(l)}
          <button class="btn btn--quiet" type="button" data-copy="${esc(fullAddress(l))}">${icon('copy', { size: 18 })}Copy address</button>
          ${canMap ? `<button class="btn btn--quiet" type="button" data-locate="${esc(r.id)}" data-loc-index="${i}">${icon('map', { size: 18 })}Show on map</button>` : ''}
        </div>
      </div>`;
    })
    .join('');
}

function phonesHTML(r) {
  const rows = [];
  if (r.phone) rows.push(`<li>Main: <a href="${telHref(r.phone)}">${esc(r.phone)}</a></li>`);
  for (const p of r.phones || []) {
    rows.push(`<li>${esc(p.label)}: <a class="${p.urgent ? 'urgent-phone' : ''}" href="${telHref(p.number)}">${esc(p.number)}</a></li>`);
  }
  if (r.sms) rows.push(`<li>Text: <a href="${smsHref(r.sms)}">${esc(r.sms)}</a></li>`);
  return rows.length > 1 ? `<ul class="phone-list">${rows.join('')}</ul>` : '';
}

function linksHTML(r) {
  const links = [...(r.links || [])];
  if (!links.length) return '';
  return `<ul class="detail__list">${links.map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}<span class="visually-hidden"> (opens in a new tab)</span></a></li>`).join('')}</ul>`;
}

function sourcesHTML(r) {
  const v = r.verification;
  const report = `${REPORT_URL}?title=${encodeURIComponent(`Correction: ${r.name}`)}&body=${encodeURIComponent(`Listing: ${r.name} (${r.id})\n\nWhat's wrong?\n\nWhere did you see the correct information (link if possible)?\n`)}`;
  const status = v.status === 'unconfirmed'
    ? `<p><strong>Not confirmed.</strong> ${esc(v.note || '')}</p>`
    : `<p>Checked on <strong>${esc(formatDate(v.checked))}</strong> against:</p>`;
  return `<div class="source-box">
    ${status}
    <ul>${v.sources.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`).join('')}</ul>
    <p>Hours and rules can change. Call before you go.</p>
    <p><a href="${report}" target="_blank" rel="noopener">Report a mistake in this listing</a></p>
  </div>`;
}

export function renderDetail(dialog, r, state) {
  const saved = state.saved.has(r.id);
  const loc = primaryLocation(r);
  const mappable = isMappable(r);
  const unconfirmed = r.verification.status === 'unconfirmed';

  dialog.innerHTML = `
    <div class="drawer__spine" style="--spine:${spineFor(r)}"></div>
    <div class="drawer__bar">
      <span class="drawer__bar-title">Place details</span>
      <button class="icon-btn" type="button" data-close aria-label="Close details">${icon('x', { size: 20 })}</button>
    </div>
    <div class="drawer__body detail" data-id="${esc(r.id)}">
      <div class="card__cats">${categoryTags(r)}</div>
      <h2 class="detail__title" id="detail-title">${esc(r.name)}</h2>
      <p class="detail__org">${esc(r.kind)}${r.org ? `, ${esc(r.org)}` : ''}</p>
      ${unconfirmed ? `<p class="notice">${icon('triangle-alert', { size: 18 })}<span>${esc(r.verification.note)}</span></p>` : ''}
      ${r.alert ? `<p class="notice">${icon('triangle-alert', { size: 18 })}<span>${esc(r.alert)}</span></p>` : ''}
      <p class="detail__summary">${esc(r.summary)}</p>
      <div class="badges">${costBadge(r)}${acceptsBadges(r)}</div>
      ${r.costNote ? `<p class="detail__note">${esc(r.costNote)}</p>` : ''}

      <div class="detail__actions">
        ${callButton(r.phone)}
        ${r.sms ? `<a class="btn" href="${smsHref(r.sms)}">${icon('messages-square', { size: 18 })}Text ${esc(r.sms)}</a>` : ''}
        ${mappable ? directionsButton(loc) : ''}
        ${websiteButton(r.website)}
      </div>
      <div class="detail__tools">
        <button class="btn btn--quiet" type="button" data-save="${esc(r.id)}" aria-pressed="${saved}">${icon(saved ? 'bookmark-check' : 'bookmark', { size: 18 })}<span>${saved ? 'Saved' : 'Save'}</span></button>
        <button class="btn btn--quiet" type="button" data-share="${esc(r.id)}">${icon('share-2', { size: 18 })}Share</button>
        <button class="btn btn--quiet" type="button" data-print>${icon('printer', { size: 18 })}Print</button>
      </div>

      ${section('How to get started', list(r.howToStart, 'detail__steps', 'ol'))}
      ${section('Services', list(r.services))}
      ${section('Who can go', list(r.eligibility))}
      ${section('What to bring', list(r.bring))}
      ${section((r.locations || []).length > 1 ? 'Locations' : 'Location', locationsHTML(r))}
      ${r.offMapNote ? `<p class="detail__note">${esc(r.offMapNote)}</p>` : ''}
      ${section('Phone numbers', phonesHTML(r))}
      ${section('More links', linksHTML(r))}
      ${section('Where this information comes from', sourcesHTML(r))}
    </div>`;
}

/** Share via the native sheet when available, else copy the link. */
export async function shareResource(r, toast) {
  const url = resourceLink(r.id);
  const data = { title: `${r.name} — RVA Health Connect`, text: r.summary, url };
  try {
    if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
      await navigator.share(data);
      return;
    }
  } catch (err) {
    if (err?.name === 'AbortError') return;
  }
  const ok = await copyText(url);
  toast(ok ? 'Link copied' : 'Couldn’t copy. Long-press the address bar to share.');
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers / non-secure contexts
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}

export function printDetail() {
  document.body.classList.add('print-detail');
  const cleanup = () => {
    document.body.classList.remove('print-detail');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
  // Some browsers don't fire afterprint reliably.
  setTimeout(cleanup, 1500);
}
