/**
 * Shared vocabulary for the directory: categories, cost types and access types.
 * Colors here are mirrored in assets/css/tokens.css (--cat-*) — keep them in sync.
 */

export const CATEGORIES = [
  { id: 'medical', label: 'Doctor visits', blurb: 'Checkups, sick visits, ongoing care', icon: 'stethoscope', color: '#1D7A4E' },
  { id: 'mental', label: 'Mental health', blurb: 'Counseling, crisis help, recovery', icon: 'message-circle-heart', color: '#6247AA' },
  { id: 'dental', label: 'Dental', blurb: 'Cleanings, fillings, tooth pain', icon: 'tooth', color: '#A35C00' },
  { id: 'rx', label: 'Prescriptions', blurb: 'Lower-cost medicine', icon: 'pill', color: '#1F5FA8' },
  { id: 'food', label: 'Food', blurb: 'Pantries and meals', icon: 'apple', color: '#B42E45' },
  { id: 'coverage', label: 'Health coverage', blurb: 'Medicaid and FAMIS', icon: 'shield-check', color: '#3B5670' },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export const COST = {
  free: { label: 'Free', tone: 'free' },
  sliding: { label: 'Sliding scale', tone: 'low' },
  reduced: { label: 'Reduced cost', tone: 'low' },
  varies: { label: 'Ask about cost', tone: 'neutral' },
};

export const COST_FILTERS = [
  { value: 'any', label: 'Any' },
  { value: 'free', label: 'Free' },
  { value: 'low', label: 'Sliding scale or reduced' },
];

export const INSURANCE_FILTERS = [
  { value: 'any', label: 'Any' },
  { value: 'uninsured', label: 'I have no insurance' },
  { value: 'medicaid', label: 'I have Medicaid or FAMIS' },
  { value: 'private', label: 'I have private insurance' },
];

export const SORTS = [
  { value: 'recommended', label: 'Best match' },
  { value: 'az', label: 'Name, A to Z' },
  { value: 'distance', label: 'Nearest to me' },
];

export const ACCESS = {
  'in-person': { label: 'Visit in person', icon: 'map-pin', rank: 0 },
  mobile: { label: 'Clinic and mobile van', icon: 'bus', rank: 0 },
  phone: { label: 'Call, text or chat', icon: 'phone', rank: 1 },
  online: { label: 'Online — no visit needed', icon: 'globe', rank: 2 },
  referral: { label: 'Hospital referral only', icon: 'info', rank: 3 },
};

export const ACCEPTS_LABELS = {
  uninsured: 'No insurance OK',
  medicaid: 'Medicaid OK',
  private: 'Private insurance OK',
};
