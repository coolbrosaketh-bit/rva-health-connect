/**
 * RVA Health Connect — resource directory data.
 *
 * This file is the single source of truth for every listing on the site.
 * The UI, the map, search, and the tests all read from here.
 *
 * ── How to edit a listing ────────────────────────────────────────────────
 * 1. Check the change against the organization's own website, or a
 *    government / 211 directory. Never add facts you can't source.
 * 2. Update the fields below, then set `verification.checked` to today's
 *    date (YYYY-MM-DD) and list the pages you checked in `sources`.
 * 3. Physical locations need `lat` / `lng`. Get them from the US Census
 *    geocoder (https://geocoding.geo.census.gov/geocoder/) — paste the
 *    street address and copy the matched coordinates.
 * 4. Run `npm test` — it validates every record (phones, URLs, dates,
 *    coordinates inside the Richmond area, and so on).
 *
 * ── Field reference ─────────────────────────────────────────────────────
 * id            Stable URL-safe id. Used in share links (?r=<id>). Don't rename.
 * categories    One or more of: medical, mental, dental, rx, food, coverage.
 *               The first one sets the map pin color.
 * cost          free | sliding | reduced | varies
 * accepts       { uninsured, medicaid, private }: true / false / null (unknown)
 * access        in-person | mobile | online | phone | referral
 *               Only in-person and mobile listings with coordinates go on the map.
 * locations     Physical sites. Omit lat/lng to keep a site off the map.
 * alert         Important, time-sensitive notice shown on the card.
 * verification  { status: 'confirmed' | 'unconfirmed', checked, sources[], note }
 */

export const DATA_REVIEWED = '2026-11-19';

export const RESOURCES = [
  {
    id: 'health-brigade',
    name: 'Health Brigade',
    aka: ['Fan Free Clinic'],
    kind: 'Free and charitable clinic',
    categories: ['medical', 'mental'],
    cost: 'free',
    costNote: 'Health Brigade serves patients regardless of their ability to pay at the time of service.',
    accepts: { uninsured: true, medicaid: true, private: false },
    access: 'in-person',
    summary:
      'Virginia’s first free clinic, formerly Fan Free Clinic. Primary care and counseling for uninsured adults, plus free HIV and STI testing for anyone.',
    services: [
      'Primary care for adults, including diabetes, high blood pressure and asthma',
      'Mental health counseling',
      'Free HIV, hepatitis C, gonorrhea and chlamydia testing — open to anyone, by appointment',
      'PrEP to prevent HIV',
      'Harm reduction: syringe services and naloxone',
      'Medical and behavioral health care for transgender and gender-diverse people',
    ],
    eligibility: [
      'No health insurance — Medicaid is accepted, and staff can help you enroll',
      'Household income between 139% and 200% of the federal poverty level',
      'Lived in a Health Brigade service area (including Richmond, Henrico and Chesterfield) for at least 6 months',
      'HIV and STI testing and PrEP have no eligibility requirements',
    ],
    howToStart: [
      'Call (804) 358-6343 or send the online appointment request form to book a registration appointment.',
      'Registration takes about 45–60 minutes and includes an eligibility screening.',
    ],
    bring: [
      'Photo ID showing your name and birthdate (it can be expired)',
      'Two months of income documentation',
    ],
    phone: '(804) 358-6343',
    website: 'https://www.healthbrigade.org/',
    links: [
      { label: 'Eligibility and registration', url: 'https://www.healthbrigade.org/patients-and-clients/eligibilityforservice/' },
    ],
    locations: [
      {
        label: 'Health Brigade',
        street: '1010 N Thompson St',
        city: 'Richmond',
        zip: '23230',
        lat: 37.567321,
        lng: -77.479236,
        hours: ['Medical: Mon–Thu 9 a.m.–5 p.m., Fri 9 a.m.–noon', 'Mental health: Mon–Thu 9 a.m.–8 p.m., Fri 9 a.m.–5 p.m.'],
        notes: 'Parking is behind the building. GRTC routes 1 and 6 stop within three blocks. Ramp access.',
      },
    ],
    tags: ['free clinic', 'primary care', 'counseling', 'therapy', 'hiv', 'prep', 'sti', 'testing', 'lgbtq', 'transgender', 'harm reduction', 'naloxone', 'uninsured'],
    verification: {
      status: 'confirmed',
      checked: '2026-11-19',
      sources: [
        { label: 'Health Brigade — Contact', url: 'https://www.healthbrigade.org/contact/' },
        { label: 'Health Brigade — Eligibility for services', url: 'https://www.healthbrigade.org/patients-and-clients/eligibilityforservice/' },
      ],
    },
  },

  {
    id: 'care-a-van',
    name: 'Bon Secours Care-A-Van',
    kind: 'Free mobile clinic and Manchester clinic',
    categories: ['medical'],
    cost: 'free',
    costNote: 'Free for uninsured patients.',
    accepts: { uninsured: true, medicaid: false, private: false },
    access: 'mobile',
    alert: 'Bon Secours says Care-A-Van clinics are no longer accepting new adult patients. New and returning children can still be seen.',
    summary:
      'Bon Secours’ free clinic for uninsured families: a clinic in Manchester plus a van that visits community sites on a monthly calendar.',
    services: [
      'Primary care for children',
      'Same-day pediatric appointments when available',
      'Virtual visits by smartphone or computer, with audio-only options',
      'Interpreters in more than 150 languages',
    ],
    eligibility: [
      'For people without health insurance',
      'New patients: children only, as of our last check',
      'Bon Secours’ information sheet says the Care-A-Van does not accept Medicaid, Medicare or private insurance',
    ],
    howToStart: [
      'For children, call (804) 545-1923 to schedule a same-day appointment.',
      'Check the monthly calendar on the Bon Secours page to see where the van will be.',
      'For other questions, call (804) 545-1920.',
    ],
    phone: '(804) 545-1920',
    phones: [{ label: 'Pediatric scheduling', number: '(804) 545-1923' }],
    website: 'https://www.bonsecours.com/locations/community-services/richmond/bon-secours-care-a-van',
    locations: [
      {
        label: 'Community Health Clinic, Manchester',
        street: '2301 Everett St',
        city: 'Richmond',
        zip: '23224',
        area: 'Manchester',
        lat: 37.512318,
        lng: -77.451509,
        notes: 'The van also visits community sites. Locations change monthly — check the calendar.',
      },
    ],
    tags: ['mobile clinic', 'van', 'children', 'kids', 'pediatric', 'pediatrics', 'uninsured', 'interpreter', 'virtual', 'telehealth', 'manchester'],
    verification: {
      status: 'confirmed',
      checked: '2026-11-19',
      sources: [
        { label: 'Bon Secours — Care-A-Van', url: 'https://www.bonsecours.com/locations/community-services/richmond/bon-secours-care-a-van' },
        { label: 'Bon Secours — Care-A-Van information sheet (PDF)', url: 'https://www.bonsecours.com/-/media/bon-secours/community-involvement/richmond/care-a-van/richmond-care-a-van-english-information.pdf' },
      ],
    },
  },

  {
    id: 'cahn-northside',
    name: 'Northside Medical Center',
    org: 'Capital Area Health Network (CAHN)',
    kind: 'Community health center',
    categories: ['medical', 'mental'],
    cost: 'sliding',
    costNote: 'Fees on a sliding scale based on income. Also accepts Medicaid, Medicare and private insurance.',
    accepts: { uninsured: true, medicaid: true, private: true },
    access: 'in-person',
    summary:
      'A federally qualified community health center for the whole family, with fees on a sliding scale based on income.',
    services: [
      'Family medicine and primary care',
      'Pediatrics',
      'Behavioral health',
      'HIV and STI testing and PrEP',
      'Patient transportation service — ask when you book',
    ],
    eligibility: [
      'Open to everyone: uninsured, Medicaid, Medicare or private insurance',
      'Sliding-scale fees for eligible patients, based on income',
    ],
    howToStart: [
      'Call (804) 780-0840 (one number for all CAHN locations) or register online.',
      'Appointments are required.',
    ],
    phone: '(804) 780-0840',
    website: 'https://cahealthnet.org/northside-medical-center/',
    locations: [
      {
        label: 'Northside Medical Center',
        street: '2809 North Ave',
        city: 'Richmond',
        zip: '23222',
        area: 'Northside',
        lat: 37.568588,
        lng: -77.43288,
        hours: ['Mon–Fri 8 a.m.–5 p.m.'],
      },
    ],
    tags: ['cahn', 'fqhc', 'community health center', 'family medicine', 'pediatrics', 'kids', 'children', 'behavioral health', 'counseling', 'hiv', 'prep', 'northside', 'transportation'],
    verification: {
      status: 'confirmed',
      checked: '2026-11-19',
      sources: [
        { label: 'Henrico County — Primary care for patients with Medicaid, Medicare or who are uninsured', url: 'https://henrico.us/health/primary-care/' },
        { label: 'CDC — Capital Area Health Network, Northside Medical Center', url: 'https://npin.cdc.gov/organization/capital-area-health-network-1' },
      ],
    },
  },

  {
    id: 'cahn-vernon-j-harris',
    name: 'Vernon J. Harris Medical & Dental Center',
    org: 'Capital Area Health Network (CAHN)',
    kind: 'Community health center with dental care',
    categories: ['dental', 'medical', 'mental'],
    cost: 'sliding',
    costNote: 'Fees on a sliding scale based on income. Also accepts Medicaid, Medicare and private insurance.',
    accepts: { uninsured: true, medicaid: true, private: true },
    access: 'in-person',
    summary:
      'CAHN’s flagship center in Church Hill and the network’s dental clinic, with primary care, behavioral health and HIV care under one roof.',
    services: [
      'Dental care for children and adults',
      'Primary care',
      'Behavioral health',
      'HIV care',
    ],
    eligibility: [
      'Open to everyone: uninsured, Medicaid, Medicare or private insurance',
      'Sliding-scale fees for eligible patients, based on income',
    ],
    howToStart: [
      'Call (804) 780-0840 (one number for all CAHN locations) or register online.',
      'Appointments are required.',
    ],
    phone: '(804) 780-0840',
    website: 'https://cahealthnet.org/vernon-j-harris-medical-center/',
    locations: [
      {
        label: 'Vernon J. Harris Medical & Dental Center',
        street: '719 N 25th St',
        city: 'Richmond',
        zip: '23223',
        area: 'Church Hill',
        lat: 37.535267,
        lng: -77.41524,
        hours: ['Mon–Fri 8 a.m.–5 p.m.'],
      },
    ],
    tags: ['cahn', 'fqhc', 'community health center', 'dentist', 'teeth', 'hiv', 'church hill', 'east end'],
    verification: {
      status: 'confirmed',
      checked: '2026-11-19',
      sources: [
        { label: 'Henrico County — Primary care for patients with Medicaid, Medicare or who are uninsured', url: 'https://henrico.us/health/primary-care/' },
        { label: 'CDC — Vernon J. Harris Medical and Dental Center', url: 'https://npin.cdc.gov/organization/capital-area-health-network-5' },
      ],
    },
  },

  {
    id: 'daily-planet',
    name: 'Daily Planet Health Services',
    kind: 'Community health center',
    categories: ['medical', 'dental', 'mental'],
    cost: 'sliding',
    costNote: 'Sliding fee for eligible patients, based on income. Accepts Medicaid, Medicare, most private plans, Ryan White and self-pay.',
    accepts: { uninsured: true, medicaid: true, private: true },
    access: 'in-person',
    summary:
      'A community health center focused on people experiencing homelessness or housing instability, with primary care, dental, behavioral health and addiction treatment in one place.',
    services: [
      'Primary care for all ages',
      'Dental care, including emergency walk-in care',
      'Mental health and substance use treatment, including medication for opioid use disorder',
      'Case management',
      'Reduced-cost or free medications, based on income',
    ],
    eligibility: [
      'Focuses on people experiencing homelessness or housing instability, people living in or near public housing, and people living with HIV',
      'Serves patients regardless of insurance status',
    ],
    howToStart: [
      'Call the location nearest you to register: West Grace (804) 783-2505, Southside (804) 292-3011.',
      'Daily Planet says registered patients can get same-day or next-day appointments.',
    ],
    phone: '(804) 783-2505',
    website: 'https://dailyplanetva.org/',
    locations: [
      {
        label: 'West Grace Health Center',
        street: '517 W Grace St',
        city: 'Richmond',
        zip: '23220',
        area: 'Downtown',
        lat: 37.547431,
        lng: -77.447312,
        phone: '(804) 783-2505',
        hours: ['Mon–Fri 8 a.m.–4:30 p.m.'],
      },
      {
        label: 'Southside Health Center',
        street: '180 E Belt Blvd',
        city: 'Richmond',
        zip: '23224',
        area: 'Southside',
        lat: 37.506218,
        lng: -77.48194,
        phone: '(804) 292-3011',
        hours: ['Mon–Fri 8 a.m.–4:30 p.m.'],
      },
    ],
    tags: ['fqhc', 'homeless', 'homelessness', 'housing', 'dentist', 'teeth', 'emergency dental', 'substance use', 'addiction', 'opioid', 'mat', 'suboxone', 'hiv', 'ryan white', 'case management', 'southside', 'downtown'],
    verification: {
      status: 'confirmed',
      checked: '2026-11-19',
      sources: [
        { label: 'Henrico County — Primary care for patients with Medicaid, Medicare or who are uninsured', url: 'https://henrico.us/health/primary-care/' },
        { label: 'National Health Care for the Homeless Council — Daily Planet Health Services', url: 'https://nhchc.org/the-daily-planet-2' },
        { label: '211 Virginia — Daily Planet Southside Health Center', url: 'https://search.211virginia.org/search/57fff977-ff79-538f-956c-35fe899b17a6' },
      ],
    },
  },

  {
    id: 'crossover',
    name: 'CrossOver Healthcare Ministry',
    kind: 'Charitable clinic',
    categories: ['medical'],
    cost: 'varies',
    costNote: 'Charitable clinic for uninsured, low-income patients and Medicaid members. Ask about any fees during your financial screening.',
    accepts: { uninsured: true, medicaid: true, private: false },
    access: 'in-person',
    summary:
      'A charitable clinic offering primary and specialty care to uninsured, low-income adults and Medicaid members, with clinics in Richmond and Henrico.',
    services: [
      'Primary care',
      'Specialty care from volunteer physicians',
      'Walk-in rapid HIV testing for patients and non-patients, and HIV care',
      'Pharmacy for patients',
      'Help applying for Medicaid',
    ],
    eligibility: [
      'Uninsured with household income at or below 200% of the federal poverty level, or eligible for or enrolled in Medicaid',
      'Uninsured patients complete a financial screening before their first visit is scheduled',
    ],
    howToStart: ['Call (804) 655-2794 (all locations) or complete the new-patient application online.'],
    phone: '(804) 655-2794',
    website: 'https://www.crossoverministry.org/',
    links: [{ label: 'New patients', url: 'https://www.crossoverministry.org/new-patients/' }],
    locations: [
      {
        label: 'Richmond Clinic',
        street: '108 Cowardin Ave',
        city: 'Richmond',
        zip: '23224',
        area: 'Southside',
        lat: 37.519437,
        lng: -77.449529,
        hours: ['Mon–Thu 8 a.m.–5 p.m., Fri 8 a.m.–12:30 p.m.'],
      },
      {
        label: 'Henrico Clinic',
        street: '8600 Quioccasin Rd, Suite 105',
        city: 'Henrico',
        zip: '23229',
        area: 'West End',
        lat: 37.601865,
        lng: -77.564173,
        hours: ['Mon 8:30 a.m.–7:30 p.m., Tue–Thu 8:30 a.m.–5 p.m., Fri 8:30 a.m.–noon'],
      },
    ],
    tags: ['charitable clinic', 'free clinic', 'specialist', 'specialty care', 'hiv', 'pharmacy', 'uninsured', 'henrico', 'west end', 'southside', 'spanish'],
    verification: {
      status: 'confirmed',
      checked: '2026-11-19',
      sources: [
        { label: 'Henrico County — Primary care for patients with Medicaid, Medicare or who are uninsured', url: 'https://henrico.us/health/primary-care/' },
        { label: '211 Virginia — CrossOver Richmond Clinic', url: 'https://search.211virginia.org/search/4816a1f9-6be7-5002-aa96-982ee777dba1' },
        { label: 'Virginia Department of Health — CrossOver Health Care Ministry', url: 'https://therc.vdh.virginia.gov/search/db242e51-6661-5600-8fef-ae255ba538a8' },
      ],
    },
  },

  {
    id: 'rbha',
    name: 'Richmond Behavioral Health Authority',
    aka: ['RBHA', 'RBH'],
    kind: 'Public mental health and substance use services',
    categories: ['mental'],
    cost: 'varies',
    costNote: 'Accepts Medicaid, Medicare, private insurance and self-pay. Ask about fees.',
    accepts: { uninsured: true, medicaid: true, private: true },
    access: 'in-person',
    summary:
      'The City of Richmond’s public provider for mental health, substance use and developmental disability services, with a 24/7 crisis line.',
    services: [
      '24/7 crisis line, with mobile crisis outreach',
      'Same-day intake for new patients, called Rapid Access',
      'Mental health and substance use treatment',
      'Case management',
      'Primary medical care',
      'Services for people with developmental disabilities',
    ],
    eligibility: ['Serves City of Richmond residents and people who are in the City of Richmond'],
    howToStart: [
      'New patients start with Rapid Access, RBHA’s same-day intake. Call (804) 819-4000 for current Rapid Access hours.',
      'In a crisis, call (804) 819-4100 at any time.',
    ],
    phone: '(804) 819-4000',
    phones: [
      { label: '24/7 crisis line', number: '(804) 819-4100', urgent: true },
      { label: 'TDD', number: '(804) 819-4145' },
    ],
    website: 'https://www.rbha.org/',
    locations: [
      {
        label: 'RBHA main office',
        street: '107 S 5th St',
        city: 'Richmond',
        zip: '23219',
        area: 'Downtown',
        lat: 37.539375,
        lng: -77.440745,
        hours: ['Office: Mon–Fri 8 a.m.–5 p.m.', 'Crisis line: 24 hours, every day'],
        notes: 'On several GRTC bus routes. Two-hour street parking nearby.',
      },
    ],
    tags: ['crisis', 'mental health', 'psychiatry', 'therapy', 'counseling', 'substance use', 'addiction', 'recovery', 'rapid access', 'same day', 'developmental disability', 'csb', 'downtown'],
    verification: {
      status: 'confirmed',
      checked: '2026-11-19',
      sources: [
        { label: 'RBHA — Your go-to guide for RBHA services (PDF)', url: 'https://www.rbha.org/resources/docs/Your%20go-to%20guide%20for%20RBHA%20Services.pdf' },
        { label: '211 Virginia — RBHA Rapid Access', url: 'https://search.211virginia.org/search/f168f3c0-bf79-57df-b872-6beb3bdb0631' },
      ],
    },
  },

  {
    id: 'lifeline-988',
    name: '988 Suicide & Crisis Lifeline',
    kind: 'Crisis line — call, text or chat',
    categories: ['mental'],
    cost: 'free',
    costNote: 'Free and confidential.',
    accepts: { uninsured: true, medicaid: true, private: true },
    access: 'phone',
    summary:
      'Free, confidential support 24/7 for anyone in emotional distress or a mental health crisis, or worried about someone else.',
    services: [
      'Call or text 988, any time',
      'Chat online at 988lifeline.org',
      'Spanish: dial 988, then press 2',
      'Veterans: dial 988, then press 1',
    ],
    eligibility: ['Anyone, for themselves or for someone they’re worried about'],
    howToStart: ['Call or text 988.'],
    phone: '988',
    sms: '988',
    website: 'https://988lifeline.org/',
    locations: [],
    tags: ['crisis', 'suicide', 'hotline', 'emotional support', 'text', 'chat', 'spanish', 'veterans', '24/7'],
    verification: {
      status: 'confirmed',
      checked: '2026-11-19',
      sources: [
        { label: 'Virginia DBHDS — 988 FAQs', url: 'https://dbhdsdev.virginia.gov/crisis-services/988/faqs.php' },
        { label: '988 Suicide & Crisis Lifeline', url: 'https://988lifeline.org/' },
      ],
    },
  },

  {
    id: 'vcu-dentistry',
    name: 'VCU School of Dentistry',
    aka: ['VCU Dental Care'],
    kind: 'Dental school clinics',
    categories: ['dental'],
    cost: 'reduced',
    costNote: 'Supervised student clinics offer care at reduced prices. Ask for a cost estimate before treatment.',
    accepts: { uninsured: true, medicaid: null, private: null },
    access: 'in-person',
    summary:
      'Virginia’s only dental school. Supervised students provide full dental care at reduced cost, and new patients in pain can be seen for a walk-in evaluation.',
    services: [
      'Comprehensive dental care in the student clinic',
      'Walk-in urgent evaluation for new patients with dental pain or infection',
      'Faculty practice and specialty clinics',
      'Pediatric dentistry, at 1000 E Broad St',
    ],
    eligibility: [
      'Open to the public',
      'New student-clinic patients first need a screening visit with an exam and panoramic X-ray',
    ],
    howToStart: [
      'Call (804) 828-9190 and choose option 3 for new patients.',
      'In pain or think you have an infection? Ask about the walk-in urgent care evaluation.',
    ],
    phone: '(804) 828-9190',
    website: 'https://dentistry.vcu.edu/patients/',
    links: [{ label: 'Urgent care', url: 'https://dentistry.vcu.edu/patients/services/urgent-care' }],
    locations: [
      {
        label: 'Lyons Dental Building',
        street: '520 N 12th St',
        city: 'Richmond',
        zip: '23298',
        area: 'VCU medical campus',
        lat: 37.541282,
        lng: -77.42945,
        hours: ['Mon–Fri 8 a.m.–4:30 p.m.'],
        notes: 'Patient drop-off is at the Perkinson Building, at Leigh and 11th streets.',
      },
    ],
    tags: ['dentist', 'teeth', 'tooth', 'cleaning', 'fillings', 'extraction', 'toothache', 'dental emergency', 'students', 'vcu', 'mcv', 'downtown'],
    verification: {
      status: 'confirmed',
      checked: '2026-11-19',
      sources: [
        { label: 'VCU School of Dentistry — Become a patient', url: 'https://dentistry.vcu.edu/patients/' },
        { label: 'VCU School of Dentistry — Urgent care', url: 'https://dentistry.vcu.edu/patients/services/urgent-care' },
      ],
    },
  },

  {
    id: 'vhcf-dental-map',
    name: 'Dental Safety Net Clinic Map',
    org: 'Virginia Health Care Foundation',
    kind: 'Statewide online map',
    categories: ['dental'],
    cost: 'free',
    costLabel: 'Free to use',
    accepts: { uninsured: true, medicaid: true, private: true },
    access: 'online',
    summary:
      'An interactive map of dental safety-net clinics that care for uninsured and medically underserved Virginians. Useful for finding dental care beyond this list.',
    services: ['Interactive map of dental safety-net clinics across Virginia'],
    eligibility: ['Each clinic on the map sets its own eligibility rules'],
    howToStart: ['Open the map and zoom in on the Richmond area to see nearby clinics.'],
    website: 'https://www.vhcf.org/looking-for-help/dental-care/',
    locations: [],
    tags: ['dentist', 'teeth', 'directory', 'finder', 'statewide', 'vhcf'],
    verification: {
      status: 'confirmed',
      checked: '2026-11-19',
      sources: [{ label: 'Virginia Health Care Foundation — Dental care', url: 'https://www.vhcf.org/looking-for-help/dental-care/' }],
    },
  },

  {
    id: 'feedmore',
    name: 'FeedMore',
    kind: 'Regional food bank',
    categories: ['food'],
    cost: 'free',
    accepts: { uninsured: true, medicaid: true, private: true },
    access: 'online',
    summary:
      'Central Virginia’s food bank. Its agency locator finds food pantries and meal programs near your ZIP code or address.',
    services: [
      'Agency locator for food pantries and community meal programs',
      'Hunger Hotline for help finding food',
      'Meals on Wheels for homebound neighbors',
    ],
    eligibility: ['Each pantry sets its own hours and requirements — check the locator or call the pantry first.'],
    howToStart: ['Search the agency locator with your ZIP code or address.', 'Or call FeedMore at (804) 521-2500.'],
    phone: '(804) 521-2500',
    website: 'https://feedmore.org/agency-locator',
    links: [{ label: 'FeedMore home page', url: 'https://feedmore.org/' }],
    offMapNote: 'FeedMore’s main campus (1415 Rhoadmiller St) is not a food pantry, so it isn’t on the map. Use the locator to find a pantry.',
    locations: [],
    tags: ['food pantry', 'food bank', 'groceries', 'hungry', 'meals', 'meals on wheels', 'snap', 'hunger hotline'],
    verification: {
      status: 'confirmed',
      checked: '2026-11-19',
      sources: [
        { label: 'FeedMore — Contact us', url: 'https://feedmore.org/contact-us/' },
        { label: 'Virginia Navigator — FeedMore Hunger Hotline and agency locator', url: 'https://virginianavigator.org/print/pdf/node/26390' },
      ],
    },
  },

  {
    id: 'medicaid',
    name: 'Virginia Medicaid & FAMIS',
    aka: ['Cardinal Care', 'Cover Virginia', 'CoverVA', 'health insurance'],
    kind: 'Free or low-cost health coverage',
    categories: ['coverage'],
    cost: 'free',
    costLabel: 'Free to apply',
    accepts: { uninsured: true, medicaid: true, private: false },
    access: 'online',
    summary:
      'Free or low-cost health coverage from the state. In 2026, adults 19–64 can qualify with income up to $22,025 a year for one person, or $45,540 for a family of four.',
    services: [
      'Apply online at CommonHelp, any time',
      'Apply or get help by phone: Cover Virginia, 1-855-242-8282 (TTY 1-888-221-1590), Mon–Fri 8 a.m.–7 p.m.',
      'Apply in person or by mail through your local Department of Social Services',
      'FAMIS covers children whose families earn too much for Medicaid',
    ],
    eligibility: [
      'Adults 19–64 with income under 138% of the federal poverty level (2026 guidelines, as of Jan 13, 2026)',
      'Children and pregnant people can qualify with higher incomes — check Cover Virginia',
      'Starting January 2027, work and community engagement requirements will apply to adults covered through Medicaid Expansion',
    ],
    howToStart: [
      'Apply online at commonhelp.virginia.gov, or call 1-855-242-8282.',
      'A decision can take up to 45 days.',
    ],
    phone: '1-855-242-8282',
    phones: [{ label: 'TTY', number: '1-888-221-1590' }],
    website: 'https://coverva.dmas.virginia.gov/',
    links: [
      { label: 'Apply at CommonHelp', url: 'https://commonhelp.virginia.gov/' },
      { label: 'Income limits for adults', url: 'https://coverva.dmas.virginia.gov/learn/coverage-for-adults/adults-19-64-years-old/' },
    ],
    locations: [],
    tags: ['medicaid', 'famis', 'insurance', 'coverage', 'cardinal care', 'apply', 'enroll', 'children', 'pregnant', 'commonhelp'],
    verification: {
      status: 'confirmed',
      checked: '2026-11-19',
      sources: [
        { label: 'Cover Virginia — Adults 19–64', url: 'https://coverva.dmas.virginia.gov/learn/coverage-for-adults/adults-19-64-years-old/' },
        { label: 'Cover Virginia — How to apply', url: 'https://coverva.dmas.virginia.gov/apply/how-to-apply' },
        { label: 'DMAS — Commonly asked questions', url: 'https://dmas.virginia.gov/for-applicants/commonly-asked-questions/' },
      ],
    },
  },

  {
    id: 'rx-savings',
    name: 'Prescription savings: NeedyMeds and GoodRx',
    kind: 'Free websites for lowering medicine costs',
    categories: ['rx'],
    cost: 'free',
    costLabel: 'Free to use',
    accepts: { uninsured: true, medicaid: true, private: true },
    access: 'online',
    summary:
      'NeedyMeds, a nonprofit, lists drug-maker assistance programs that can provide medicine free or at low cost. GoodRx shows pharmacy prices and free discount coupons.',
    services: [
      'NeedyMeds: look up a medication to find patient assistance programs and their applications',
      'GoodRx: compare prices at nearby pharmacies and show a coupon at the counter',
    ],
    eligibility: ['Each assistance program sets its own income and insurance rules'],
    howToStart: [
      'Look up your medication on NeedyMeds or GoodRx.',
      'Ask your clinic, too — Daily Planet and CrossOver both offer medication help to their patients.',
    ],
    website: 'https://www.needymeds.org/',
    links: [{ label: 'GoodRx', url: 'https://www.goodrx.com/' }],
    locations: [],
    tags: ['prescriptions', 'medication', 'medicine', 'pharmacy', 'drugs', 'coupon', 'discount', 'pap', 'patient assistance', 'needymeds', 'goodrx', 'insulin'],
    verification: {
      status: 'confirmed',
      checked: '2026-11-19',
      sources: [
        { label: 'NeedyMeds', url: 'https://www.needymeds.org/' },
        { label: 'GoodRx', url: 'https://www.goodrx.com/' },
      ],
    },
  },

  {
    id: 'medical-respite',
    name: 'Medical Respite',
    org: 'Daily Planet Health Services',
    kind: 'Recovery care after a hospital stay',
    categories: ['medical'],
    cost: 'varies',
    costNote: 'Ask the referring hospital or Daily Planet about cost.',
    accepts: { uninsured: true, medicaid: true, private: true },
    access: 'referral',
    summary:
      'A place to recover after leaving the hospital for adults experiencing homelessness, with 24-hour staff. A referral from the hospital is required.',
    services: [
      'Short-term recovery care after hospital discharge',
      '24-hour staff supervision',
      'Help connecting to a regular doctor and to stable housing',
    ],
    eligibility: [
      'Adults experiencing homelessness who need somewhere to recover after a hospital stay',
      'A referral from the discharging hospital is required',
    ],
    howToStart: ['Ask your hospital social worker or case manager to send a referral before you are discharged.'],
    website: 'https://dailyplanetva.org/medical-respite/',
    offMapNote: 'Referral only, so it isn’t shown on the map. The program is at Daily Planet’s Southside Health Center campus.',
    locations: [],
    tags: ['respite', 'recuperative care', 'hospital discharge', 'homeless', 'homelessness', 'recovery', 'referral'],
    verification: {
      status: 'confirmed',
      checked: '2026-11-19',
      sources: [
        { label: '211 Virginia — Daily Planet Medical Respite', url: 'https://search.211virginia.org/search/d6d5f6fb-3487-5e4a-a4d6-554a518833b1' },
        { label: 'Senior Navigator — Daily Planet Medical Respite', url: 'https://seniornavigator.org/node/50652' },
      ],
    },
  },

  {
    id: 'st-josephs-outreach',
    name: 'St. Joseph’s Outreach Clinic',
    org: 'Bon Secours',
    kind: 'Primary care clinic',
    categories: ['medical'],
    cost: 'varies',
    costNote: 'Not confirmed. Call before you go.',
    accepts: { uninsured: null, medicaid: null, private: null },
    access: 'in-person',
    summary:
      'A small Bon Secours primary care practice on Brook Road that has served uninsured and underinsured patients, run with St. Joseph’s Villa and Daily Planet.',
    services: ['Primary care'],
    eligibility: ['Not confirmed — call to ask'],
    howToStart: ['Call (804) 612-7065 to confirm the clinic is open and taking patients before you go.'],
    phone: '(804) 612-7065',
    locations: [
      {
        label: 'St. Joseph’s Outreach Clinic',
        street: '8000 Brook Rd',
        city: 'Richmond',
        zip: '23227',
        // Intentionally no lat/lng: unconfirmed listings stay off the map.
      },
    ],
    tags: ['bon secours', 'brook road', 'north side', 'primary care'],
    verification: {
      status: 'unconfirmed',
      checked: '2026-11-19',
      note: 'We couldn’t find a current listing for this clinic on Bon Secours’ website. The newest sources we found are older directory entries, so it is kept off the map until it’s confirmed.',
      sources: [{ label: 'AHRQ — St. Joseph’s Outreach Clinic profile', url: 'https://www.ahrq.gov/evidencenow/model/profiles/st-josephs.html' }],
    },
  },
];

/**
 * 2026 Medicaid income limits for adults 19–64 (138% FPL incl. 5% disregard).
 * Source: Cover Virginia, "2026 Income Guidelines as of January 13, 2026".
 */
export const MEDICAID_LIMITS_2026 = {
  asOf: '2026-01-13',
  source: 'https://coverva.dmas.virginia.gov/learn/coverage-for-adults/adults-19-64-years-old/',
  rows: [
    { household: 1, yearly: 22025, monthly: 1836 },
    { household: 2, yearly: 29864, monthly: 2489 },
    { household: 3, yearly: 37702, monthly: 3142 },
    { household: 4, yearly: 45540, monthly: 3795 },
  ],
};
