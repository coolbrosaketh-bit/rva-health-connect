# RVA Health Connect

A directory of free and low-cost health care in Richmond, Virginia — clinics, dental care, mental health support, prescription help, food and Medicaid — built for people with little or no insurance, on whatever phone they have.

**Live site:** https://coolbrosaketh-bit.github.io/rva-health-connect/

## What it does

- **Find care fast.** Search in plain language (“dentist”, “therapy”, “meds”, a clinic name, or a ZIP code), or pick a kind of help from the route map at the top of the page.
- **Filter by what matters.** Cost (free, sliding scale), insurance (none, Medicaid/FAMIS, private) and category filters work together. Every filter and search is reflected in the URL, so any view can be bookmarked or shared.
- **Interactive map.** Real Richmond streets (Leaflet + OpenStreetMap data), custom category pins, clustering, popups with Call / Directions / Details, and two-way sync with the list. Online, phone-only, referral-only and unconfirmed listings are deliberately kept *off* the map so nobody is sent to a door that won’t open for them.
- **Near me, privately.** “Show places near me” sorts by distance using the browser’s location. The location is never stored, sent to us, or put in the URL.
- **Help me choose.** A two-question guided flow (what kind of help, what insurance) for people who don’t know what to search for.
- **Details that answer the next question.** Services, who can go, how to get started, what to bring, hours, every location, every phone number, and where the information came from.
- **Save, share, print.** Saved places stay on the device (localStorage). Share uses the native share sheet or copies a link. Print produces a clean contact sheet.
- **Honest about uncertainty.** Each listing shows the date it was last checked and links to its sources. Unconfirmed listings are labeled and kept off the map.

## How listings are verified

All listings live in [`assets/js/data/resources.js`](assets/js/data/resources.js). Every record carries a `verification` block:

```js
verification: {
  status: 'confirmed',          // or 'unconfirmed' (requires a `note`)
  checked: '2026-11-19',        // the date someone last checked it
  sources: [{ label, url }],    // the pages it was checked against
}
```

Rules:

1. Check facts against the organization’s own website, a government directory (VDH, county health pages, Cover Virginia), or 211 Virginia. Don’t add anything you can’t source.
2. Never claim live availability. Phrase appointment policies as what the organization says (“Daily Planet says registered patients can get same-day or next-day appointments”).
3. Coordinates come from the [US Census geocoder](https://geocoding.geo.census.gov/geocoder/), using the listed street address.
4. If you can’t confirm a listing is still operating, set `status: 'unconfirmed'` with a `note`. It stays in the list with a warning and is kept off the map.

`npm test` validates every record: required fields, known categories, phone and URL formats, dates, sources, and that every coordinate falls inside Greater Richmond.

### Corrections made in this version (checked November 19, 2026)

| Listing | Before | Now |
| --- | --- | --- |
| Medicaid income limit | ~$20,783/yr (2024 figure) | $22,025/yr for one person, $45,540 for four (2026 guidelines) |
| Medicaid phone | 1-800-552-3431 | Cover Virginia 1-855-242-8282; apply at commonhelp.virginia.gov |
| RBHA crisis line | (804) 819-4000 | (804) 819-4100 (24/7); 819-4000 is the main line |
| Daily Planet address | 713 W Broad St | 517 W Grace St, plus the Southside Health Center at 180 E Belt Blvd |
| Bon Secours Care-A-Van | “Open to all Richmond-area residents” | Not accepting new adult patients; children only. Doesn’t accept Medicaid, Medicare or private insurance |
| FeedMore | Pinned at 8020 Villa Park Dr | Main campus is 1415 Rhoadmiller St and isn’t a pantry, so it’s not pinned; links to the agency locator |
| Health Brigade eligibility | “No proof of income required” | Income between 139% and 200% FPL, with income documentation; testing and PrEP have no requirements |
| VCU School of Dentistry | “40–70% less”, “some procedures under $50” | Removed (unsourced); describes the screening visit and walk-in urgent evaluation |
| St. Joseph’s Outreach Clinic | Listed as active | Marked unconfirmed (no current listing on Bon Secours’ site) and kept off the map |
| Added | — | CrossOver Healthcare Ministry, Vernon J. Harris Medical & Dental Center (CAHN), 988 Suicide & Crisis Lifeline |

## Project structure

```
index.html                 Semantic page shell (landmarks, static sections, dialogs)
assets/
  css/
    tokens.css             Design tokens: color, type scale, spacing, radii
    base.css               Reset, typography, page chrome, hero, route chooser, sections
    components.css         Toolbar, chips, cards, detail drawer, guided chooser, toast
    map.css                Map frame, loading/error states, pins, clusters, popups
    print.css              Print-only styles
  js/
    main.js                Entry point: state → views wiring, events, observers
    data/
      resources.js         ← all listings (edit here)
      taxonomy.js          Categories, cost types, access types, filter options
    lib/                   Pure logic, no DOM — unit tested in Node
      search.js            Tokenizing, synonyms, scoring, filtering, sorting
      geo.js               Distances, which listings are mappable
      format.js            Escaping, phone/tel links, dates, directions URLs
      url.js               Filters ↔ query string
      store.js             Minimal observable store
      storage.js           Safe localStorage for saved places
    ui/                    Rendering: cards, detail drawer, guided flow, icons
    map/map.js             Leaflet integration (lazy-loaded)
  fonts/                   Atkinson Hyperlegible Next (self-hosted, OFL)
  img/                     Favicon, touch icons, social preview
vendor/                    Leaflet 1.9.4 and Leaflet.markercluster 1.5.3 (pinned, with licenses)
tests/                     Node test runner: data validation + search/filter logic
```

### Design decisions

- **No framework, no build step.** The app is ~15 resources and a handful of views; native ES modules, `<dialog>` and CSS grid cover it with zero runtime dependencies beyond the map. It deploys to GitHub Pages as-is.
- **Data is separate from presentation.** The UI is generated from `resources.js`, so updating a phone number never means touching HTML.
- **State → render.** A tiny store holds the search/filter state; the list, chips, map and URL all render from it. Cards are only re-rendered when the visible set changes, so keyboard focus is never lost.
- **The map is progressive.** Leaflet loads only when the map is about to be seen. If the script or tiles fail (offline, blocked network), the map shows a clear error with *Try again* and *Use the list*, and the tile layer falls back from CARTO to openstreetmap.org first. The list never depends on the map.
- **Legibility first.** Atkinson Hyperlegible Next was designed by the Braille Institute for low-vision readers. Body text is 17px. Category colors always come with an icon and a text label.
- **Privacy.** No analytics, no cookies, no third-party fonts. Location is used in memory only.

### Accessibility

Built to WCAG 2.2 AA: semantic landmarks and heading order, a skip link, visible focus styles, 44px touch targets, labeled controls, live-region result counts, native modal dialogs with focus return, keyboard-reachable map pins, `prefers-reduced-motion` support, and a full list alternative to the map. Automated checks (axe-core) run clean on the main page, mobile layout, detail drawer and guided flow.

## Run it locally

ES modules need to be served over HTTP (opening `index.html` from disk won’t work):

```bash
npm start          # python3 -m http.server 8000 → http://localhost:8000
npm test           # validates data + search logic (Node 18+)
```

## Deploy (GitHub Pages)

The site is static and uses only relative paths, so it works under `/rva-health-connect/`.

1. Merge to `main`.
2. In **Settings → Pages**, set **Source** to *Deploy from a branch*, branch `main`, folder `/ (root)` (this is likely already set).
3. The `.nojekyll` file tells Pages to serve every file as-is.

A GitHub Actions workflow (`.github/workflows/test.yml`) runs `npm test` on every push and pull request.

## Credits and licenses

- Map: [Leaflet](https://leafletjs.com) (BSD-2), [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) (MIT). Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors; tiles © [CARTO](https://carto.com/attributions).
- Typeface: [Atkinson Hyperlegible Next](https://www.brailleinstitute.org/freefont/) by the Braille Institute (SIL Open Font License).
- Icons: [Lucide](https://lucide.dev) (ISC), plus a custom tooth icon.

RVA Health Connect is an independent community project. It isn’t affiliated with any clinic, hospital or government agency, and it doesn’t give medical advice. Always call ahead to confirm hours and eligibility.
