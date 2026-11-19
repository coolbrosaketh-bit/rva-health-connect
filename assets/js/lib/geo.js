/** Geographic helpers. */

const EARTH_RADIUS_MILES = 3958.8;

/** Great-circle distance in miles between two { lat, lng } points. */
export function milesBetween(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

/** Locations that can be placed on the map. */
export function mappableLocations(resource) {
  if (resource.verification?.status === 'unconfirmed') return [];
  if (!['in-person', 'mobile'].includes(resource.access)) return [];
  return (resource.locations || []).filter((l) => Number.isFinite(l.lat) && Number.isFinite(l.lng));
}

export function isMappable(resource) {
  return mappableLocations(resource).length > 0;
}

/** Nearest mappable location to a point, with its distance in miles. */
export function nearestLocation(resource, point) {
  let best = null;
  for (const location of mappableLocations(resource)) {
    const miles = milesBetween(point, location);
    if (!best || miles < best.miles) best = { location, miles };
  }
  return best;
}

/** Rough bounding box for Greater Richmond, used to sanity-check data and user location. */
export const RICHMOND_BOUNDS = { south: 37.3, west: -77.8, north: 37.85, east: -77.15 };

export function inRichmondArea({ lat, lng }) {
  const b = RICHMOND_BOUNDS;
  return lat >= b.south && lat <= b.north && lng >= b.west && lng <= b.east;
}
