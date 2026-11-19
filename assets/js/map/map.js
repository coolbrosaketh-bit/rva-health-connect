/**
 * Interactive map (Leaflet + OpenStreetMap data).
 *
 * - Leaflet is vendored and loaded lazily the first time the map is shown.
 * - Tiles come from CARTO (OpenStreetMap data); if they fail, we fall back to
 *   openstreetmap.org tiles, then to a clear error state. The list never
 *   depends on the map.
 * - Only confirmed, physical locations are pinned (see lib/geo.js).
 */
import { CATEGORY_BY_ID, CATEGORIES } from '../data/taxonomy.js';
import { esc, fullAddress } from '../lib/format.js';
import { mappableLocations } from '../lib/geo.js';
import { icon } from '../ui/icons.js';
import { categoryTags, costBadge, callButton, directionsButton } from '../ui/render.js';

const RICHMOND = [37.5407, -77.436];
const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const TILE_PROVIDERS = [
  {
    name: 'CARTO Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    options: { subdomains: 'abcd', maxZoom: 19, attribution: `${OSM_ATTR} &copy; <a href="https://carto.com/attributions">CARTO</a>` },
  },
  {
    name: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: { maxZoom: 19, attribution: OSM_ATTR },
  },
];
const TILE_TIMEOUT_MS = 12000;

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Lazy asset loading ---------- */
const asset = (path) => new URL(`../../../${path}`, import.meta.url).href;

function loadCSS(href) {
  if (document.querySelector(`link[href="${href}"]`)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const link = Object.assign(document.createElement('link'), { rel: 'stylesheet', href });
    link.onload = resolve;
    link.onerror = () => reject(new Error(`Failed to load ${href}`));
    // Insert before our map.css so our overrides win.
    const ours = document.querySelector('link[href$="map.css"]');
    document.head.insertBefore(link, ours || null);
  });
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = Object.assign(document.createElement('script'), { src, async: false });
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

let leafletPromise;
function loadLeaflet() {
  if (window.L?.markerClusterGroup) return Promise.resolve(window.L);
  leafletPromise ||= Promise.all([
    loadCSS(asset('vendor/leaflet/leaflet.css')),
    loadCSS(asset('vendor/leaflet-markercluster/MarkerCluster.css')),
    loadScript(asset('vendor/leaflet/leaflet.js')).then(() => loadScript(asset('vendor/leaflet-markercluster/leaflet.markercluster.js'))),
  ]).then(() => {
    if (!window.L?.markerClusterGroup) throw new Error('Leaflet did not initialize');
    return window.L;
  });
  leafletPromise.catch(() => { leafletPromise = null; });
  return leafletPromise;
}

/* ---------- Map ---------- */
export function createMap({ el, statusEl, legendEl, noteEl, onSelect, onOpen, onLocate, onUseList }) {
  let L = null;
  let map = null;
  let cluster = null;
  let tileLayer = null;
  let providerIndex = 0;
  let userMarker = null;
  let initPromise = null;
  let pending = null; // latest items requested before the map was ready
  let activeId = null;
  const markers = new Map(); // resource id -> L.Marker[]

  /* Status overlay */
  function showStatus(kind) {
    if (kind === 'ready') {
      statusEl.hidden = true;
      statusEl.innerHTML = '';
      return;
    }
    statusEl.hidden = false;
    if (kind === 'loading') {
      statusEl.innerHTML = `<div class="map-status__box"><span class="spinner" aria-hidden="true"></span><p>Loading map…</p></div>`;
      return;
    }
    const msg = kind === 'script'
      ? 'The map couldn’t start. Your connection may be blocking it.'
      : 'Map images couldn’t load. You may be offline or on a network that blocks map services.';
    statusEl.innerHTML = `<div class="map-status__box" role="alert">
        <h3>The map isn’t available right now</h3>
        <p>${msg} Every place is still in the list, with phone numbers and directions.</p>
        <div class="map-status__actions">
          <button class="btn btn--primary" type="button" data-map-retry>${icon('refresh-cw', { size: 18 })}Try again</button>
          <button class="btn" type="button" data-map-list>${icon('list', { size: 18 })}Use the list</button>
        </div>
      </div>`;
  }

  statusEl.addEventListener('click', (e) => {
    if (e.target.closest('[data-map-retry]')) retry();
    if (e.target.closest('[data-map-list]')) onUseList?.();
  });

  function retry() {
    if (!map) {
      initPromise = null;
      ensure();
      return;
    }
    providerIndex = 0;
    useProvider(0);
  }

  /* Tiles with fallback */
  function useProvider(index) {
    if (tileLayer) map.removeLayer(tileLayer);
    const provider = TILE_PROVIDERS[index];
    if (!provider) {
      showStatus('tiles');
      return;
    }
    showStatus('loading');
    let loaded = 0;
    let failed = 0;
    tileLayer = L.tileLayer(provider.url, { ...provider.options, detectRetina: false, crossOrigin: true });
    const giveUp = () => {
      if (loaded) return;
      tileLayer.off();
      useProvider(index + 1);
    };
    const timer = setTimeout(giveUp, TILE_TIMEOUT_MS);
    tileLayer.on('tileload', () => {
      loaded++;
      if (loaded === 1) {
        clearTimeout(timer);
        showStatus('ready');
      }
    });
    tileLayer.on('tileerror', () => {
      failed++;
      if (!loaded && failed >= 4) {
        clearTimeout(timer);
        giveUp();
      }
    });
    tileLayer.addTo(map);
  }

  /* Markers */
  function pinIcon(resource) {
    const cat = CATEGORY_BY_ID[resource.categories[0]];
    return L.divIcon({
      className: 'pin-icon',
      html: `<span class="pin" style="--c:${cat.color}">${icon(cat.icon, { size: 18 })}</span>`,
      iconSize: [36, 36],
      iconAnchor: [18, 40],
      popupAnchor: [0, -36],
    });
  }

  function popupHTML(resource, location) {
    const cat = CATEGORY_BY_ID[resource.categories[0]];
    const site = location.label && location.label !== resource.name ? `${esc(location.label)}<br>` : '';
    return `<div class="popup" style="--c:${cat.color}" data-id="${esc(resource.id)}">
      <div class="popup__cats">${categoryTags(resource)}</div>
      <p class="popup__title">${esc(resource.name)}</p>
      <p class="popup__site">${site}${esc(fullAddress(location))}</p>
      <div class="badges">${costBadge(resource)}</div>
      <div class="popup__actions">
        ${callButton(location.phone || resource.phone)}
        ${directionsButton(location)}
        <button class="btn" type="button" data-open="${esc(resource.id)}">${icon('info', { size: 18 })}Details</button>
      </div>
    </div>`;
  }

  function buildMarkers(resources) {
    for (const r of resources) {
      const list = mappableLocations(r).map((loc, i) => {
        const m = L.marker([loc.lat, loc.lng], {
          icon: pinIcon(r),
          keyboard: true,
          title: `${r.name}, ${loc.street}`,
          alt: `${r.name}, ${loc.street}`,
          riseOnHover: true,
        });
        m.resourceId = r.id;
        m.locIndex = i;
        m.bindPopup(() => popupHTML(r, loc), { maxWidth: 300, minWidth: 280, autoPanPaddingTopLeft: [24, 72], autoPanPaddingBottomRight: [64, 24] });
        m.on('click', () => onSelect?.(r.id, { from: 'map' }));
        m.on('add', () => {
          const el = m.getElement();
          if (el) {
            el.setAttribute('aria-label', `${r.name}, ${loc.street}. Press Enter for details.`);
            el.querySelector('.pin')?.classList.toggle('is-active', r.id === activeId);
          }
        });
        return m;
      });
      if (list.length) markers.set(r.id, list);
    }
  }

  function renderLegend(resources) {
    const present = new Set(resources.filter((r) => mappableLocations(r).length).map((r) => r.categories[0]));
    legendEl.innerHTML = CATEGORIES.filter((c) => present.has(c.id))
      .map((c) => `<li><span class="swatch" style="--c:${c.color}">${icon(c.icon, { size: 13 })}</span>${esc(c.label)}</li>`)
      .join('');
  }

  function renderNote(items) {
    const off = items.filter(({ resource }) => !markers.has(resource.id));
    if (!off.length) {
      noteEl.textContent = '';
      return;
    }
    const names = off
      .map(({ resource }) => `<button class="link-btn" type="button" data-open="${esc(resource.id)}">${esc(resource.name)}</button>`)
      .join(', ');
    noteEl.innerHTML = `Not on the map because they’re online, by phone, by referral or unconfirmed: ${names}.`;
  }

  async function ensure() {
    initPromise ||= (async () => {
      showStatus('loading');
      try {
        L = await loadLeaflet();
      } catch {
        showStatus('script');
        initPromise = null;
        return false;
      }
      const animate = !reducedMotion();
      map = L.map(el, {
        center: RICHMOND,
        zoom: 12,
        minZoom: 9,
        maxZoom: 19,
        zoomControl: false,
        zoomAnimation: animate,
        fadeAnimation: animate,
        markerZoomAnimation: animate,
        scrollWheelZoom: true,
        tap: true,
      });
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      map.attributionControl.setPrefix(false);
      el.setAttribute('role', 'region');

      const Locate = L.Control.extend({
        options: { position: 'topright' },
        onAdd() {
          const btn = L.DomUtil.create('button', 'map-control');
          btn.type = 'button';
          btn.innerHTML = `${icon('locate-fixed', { size: 18 })}<span>Show places near me</span>`;
          L.DomEvent.disableClickPropagation(btn);
          btn.addEventListener('click', () => onLocate?.(btn));
          return btn;
        },
      });
      new Locate().addTo(map);

      cluster = L.markerClusterGroup({
        maxClusterRadius: 36,
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        animate,
        iconCreateFunction: (c) => L.divIcon({
          className: 'cluster-icon',
          html: `<span class="cluster" aria-label="${c.getChildCount()} places here. Zoom in to see them.">${c.getChildCount()}</span>`,
          iconSize: [44, 44],
        }),
      });
      map.addLayer(cluster);

      // Leaflet stops click propagation inside popups, so bind the Details button directly.
      map.on('popupopen', (e) => {
        const node = e.popup.getElement();
        node?.querySelector('[data-open]')?.addEventListener('click', (ev) => {
          ev.preventDefault();
          onOpen?.(ev.currentTarget.dataset.open);
        }, { once: true });
      });

      useProvider(providerIndex);
      return true;
    })();
    return initPromise;
  }

  function fitTo(latlngs, { maxZoom = 14 } = {}) {
    if (!latlngs.length) return;
    if (latlngs.length === 1) map.setView(latlngs[0], Math.min(maxZoom, 15), { animate: !reducedMotion() });
    else map.fitBounds(L.latLngBounds(latlngs), { padding: [48, 48], maxZoom, animate: !reducedMotion() });
  }

  return {
    /** Load Leaflet and draw the map (idempotent). */
    async show(resources) {
      const ok = await ensure();
      if (!ok) return false;
      if (!markers.size) {
        buildMarkers(resources);
        renderLegend(resources);
      }
      map.invalidateSize();
      if (pending) {
        const p = pending;
        pending = null;
        this.update(p.items, p.opts);
      }
      return true;
    },

    isReady: () => Boolean(map && markers.size),

    /** Show only the markers for the current results. */
    update(items, { fit = true } = {}) {
      if (!map || !markers.size) {
        pending = { items, opts: { fit } };
        return;
      }
      cluster.clearLayers();
      const visible = [];
      for (const { resource } of items) {
        for (const m of markers.get(resource.id) || []) visible.push(m);
      }
      cluster.addLayers(visible);
      renderNote(items);
      if (fit) {
        const pts = visible.map((m) => m.getLatLng());
        if (userMarker) pts.push(userMarker.getLatLng());
        if (pts.length) fitTo(pts);
      }
    },

    /** Emphasize one resource's pins (from list hover/focus/selection). */
    highlight(id) {
      activeId = id;
      for (const [rid, list] of markers) {
        for (const m of list) m.getElement()?.querySelector('.pin')?.classList.toggle('is-active', rid === id);
      }
    },

    /** Zoom to a resource and open its popup. */
    focus(id, locIndex) {
      const list = markers.get(id);
      if (!map || !list?.length) return;
      this.highlight(id);
      const target = list[Number.isInteger(locIndex) ? locIndex : 0] || list[0];
      // Move the map first, then open the popup once it settles. Opening it
      // mid-zoom lets the cluster layer re-render and close it again.
      let done = false;
      const openWhenSettled = () => {
        if (done) return;
        done = true;
        cluster.zoomToShowLayer(target, () => target.openPopup());
      };
      map.once('moveend', openWhenSettled);
      setTimeout(openWhenSettled, reducedMotion() ? 50 : 900); // in case the view didn't change
      if (list.length > 1 && !Number.isInteger(locIndex)) {
        fitTo(list.map((m) => m.getLatLng()), { maxZoom: 15 });
      } else {
        map.setView(target.getLatLng(), Math.max(map.getZoom(), 15), { animate: !reducedMotion() });
      }
    },

    setUserLocation(point, nearest = []) {
      if (!map) return;
      const latlng = [point.lat, point.lng];
      if (!userMarker) {
        userMarker = L.marker(latlng, {
          icon: L.divIcon({ className: 'me-icon', html: '<span class="me"></span>', iconSize: [20, 20] }),
          keyboard: false,
          interactive: false,
          zIndexOffset: 1000,
          alt: 'Your location',
        }).addTo(map);
      } else {
        userMarker.setLatLng(latlng);
      }
      const pts = [latlng, ...nearest.map((n) => [n.lat, n.lng])];
      fitTo(pts, { maxZoom: 15 });
    },

    refresh() {
      map?.invalidateSize();
    },
  };
}
