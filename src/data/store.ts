import {
  GovtIdType,
  IssueTagId,
  Language,
  LikeTagId,
  RateUnit,
  RefereeRelation,
  TIME_SLOTS,
  TimeSlotId,
  TradeId,
} from '../i18n';

export interface Reference {
  id: string;
  workerId: string;
  name: string;
  relation: RefereeRelation;
  mobile: string; // 10 digits stored in store, displayed masked as XXXXXXXX45
  line: string;   // max 120 chars
  status: 'unconfirmed' | 'confirmed_demo';
  isSample?: boolean;
  createdAt: string;
}

export interface JourneyEntry {
  id: string;
  workerId: string;
  city: string;
  trade: TradeId;
  fromYear: number;
  toYear: number | null;
  note: string;
  isSample?: boolean;
}

export interface GeoLocation {
  lat: number;
  lng: number;
  areaNameEn: string;
  areaNameHi: string;
}

export interface Review {
  id: string;
  bookingId: string;
  workerId: string;
  customerId: string;
  customerName: string;
  jobFinished: 'yes' | 'partly' | 'no';
  satisfied: boolean;
  hireAgain: boolean; // "Yes" counts as customer-confirmed "Wapas Bulaya"
  ratings: {
    quality: number;
    behaviour: number;
    safety: number;
    womenSafety: number | null;
    punctuality: number;
  };
  overall: number; // 1 to 5
  issueTags: IssueTagId[];
  likeTags: LikeTagId[];
  otherTagText?: string;
  text: string;
  customerPhoto?: string;
  workerPhoto?: string;
  workerReply?: string;
  isSample: boolean;
  underReview?: boolean;
  createdAt: string;
}

export type WorkerReview = Review;

export interface Flag {
  id: string;
  type: 'review' | 'worker' | 'job';
  targetId: string;
  reason: string;
  createdAt: string;
  status: 'open' | 'resolved';
}

export interface WorkerProfile {
  id: string;
  handle: string;    // e.g. @ramesh_painter42
  shramikId: string; // e.g. SH-48213
  nameEn: string;
  nameHi: string;
  trade: TradeId;
  customTradeName?: string;
  rateAmount: number;
  rateUnit: RateUnit;
  govtVerified: boolean;
  govtIdType?: GovtIdType;
  govtIdMasked?: string;
  lat: number;
  lng: number;
  areaNameEn: string;
  areaNameHi: string;
  isSample: boolean;
  /** Map of YYYY-MM-DD -> array of available TimeSlotId */
  availability: Record<string, TimeSlotId[]>;
  /** Map of YYYY-MM-DD -> boolean if marked "not available today" */
  unavailableDays: Record<string, boolean>;
}

export interface JobPost {
  id: string;
  customerId: string;
  customerNameEn: string;
  customerNameHi: string;
  trade: TradeId;
  customTradeName?: string;
  descriptionEn: string;
  descriptionHi: string;
  preferredDate: string; // YYYY-MM-DD
  preferredSlots: TimeSlotId[];
  budget: number;
  lat: number;
  lng: number;
  areaNameEn: string;
  areaNameHi: string;
  status: 'open' | 'booked';
  isSample: boolean;
  createdAt: string;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'waiting_customer_confirmation'
  | 'completed'
  | 'disputed'
  | 'declined'
  | 'cancelled';

export interface Booking {
  id: string;
  workerId: string;
  workerHandle: string;
  workerShramikId: string;
  workerNameEn: string;
  workerNameHi: string;
  customerId: string;
  customerNameEn: string;
  customerNameHi: string;
  jobPostId?: string;
  trade: TradeId;
  customTradeName?: string;
  date: string; // YYYY-MM-DD
  slot: TimeSlotId;
  status: BookingStatus;
  startedBy: 'customer' | 'worker';
  note?: string;
  /** Work record verification state */
  workRecordStatus?: 'self_reported' | 'customer_confirmed' | 'disputed';
  photoConsent?: boolean;
  /** Mandatory photo uploaded by Worker upon work completion */
  workerCompletionPhoto?: string;
  /** Optional photo uploaded by Customer upon work completion */
  customerCompletionPhoto?: string;
  /** ID of review if customer already reviewed this booking */
  reviewId?: string;
  isSample?: boolean;
  createdAt: string;
}

export interface VoiceConsent {
  accepted: boolean;
  at: string;
}

export interface AppUserState {
  hasSeenWelcome: boolean;
  onboardingComplete: boolean;
  language?: Language;
  role?: 'worker' | 'customer';
  workerId: string;
  workerHandle: string;
  workerShramikId: string;
  customerId: string;
  workerName: string;
  workerTrade: TradeId;
  workerCustomTrade?: string;
  workerRateAmount: number;
  workerRateUnit: RateUnit;
  workerGovtVerified: boolean;
  workerGovtIdType: GovtIdType;
  workerGovtIdNumber: string;
  customerName: string;
  location?: GeoLocation;
  voiceConsent?: VoiceConsent;
  voiceMuted?: boolean;
}

export interface RatingSummary {
  averageOverall: number;
  totalCount: number;
  realCount: number;
  sampleCount: number;
  includesSampleData: boolean;
  starCounts: Record<1 | 2 | 3 | 4 | 5, number>;
  categoryAverages: {
    quality: number;
    behaviour: number;
    safety: number;
    womenSafety: number | null;
    punctuality: number;
  };
  hireAgainPercent: number;
  wapasBulayaCount: number;
  topLikedTag: LikeTagId | null;
  topIssueTag: IssueTagId | null;
}

export const SAMPLE_LOCALITIES: GeoLocation[] = [
  { lat: 19.1136, lng: 72.8697, areaNameEn: 'Andheri East, Mumbai', areaNameHi: 'अंधेरी पूर्व, मुंबई' },
  { lat: 28.5672, lng: 77.2433, areaNameEn: 'Lajpat Nagar, Delhi', areaNameHi: 'लाजपत नगर, दिल्ली' },
  { lat: 12.9784, lng: 77.6408, areaNameEn: 'Indiranagar, Bengaluru', areaNameHi: 'इंदिरानगर, बेंगलुरु' },
  { lat: 18.5074, lng: 73.8077, areaNameEn: 'Kothrud, Pune', areaNameHi: 'कोथरूड, पुणे' },
  { lat: 26.85, lng: 80.9499, areaNameEn: 'Hazratganj, Lucknow', areaNameHi: 'हज़रतगंज, लखनऊ' },
  { lat: 23.2599, lng: 77.4126, areaNameEn: 'MP Nagar, Bhopal', areaNameHi: 'एमपी नगर, भोपाल' },
];

const STORAGE_KEY = 'shramik_app_store_v4';

interface StoreSchema {
  user: AppUserState;
  workers: WorkerProfile[];
  jobPosts: JobPost[];
  bookings: Booking[];
  reviews: Review[];
  flags: Flag[];
  references: Reference[];
  journeyEntries: JourneyEntry[];
  seedAnchor?: { lat: number; lng: number };
  storageFullError?: boolean;
}

let lastStorageError = false;

export function hasStorageFullError(): boolean {
  return lastStorageError;
}

export function generateWorkerHandle(name: string, trade: TradeId, suffix = '42'): string {
  const clean =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 10) || 'shramik';
  return `@${clean}_${trade}${suffix}`;
}

export function generateShramikId(seedNum = 48213): string {
  return `SH-${seedNum}`;
}

export function createSampleWorkPhotoDataUrl(
  trade: TradeId,
  titleText: string
): string {
  const colors: Record<TradeId, { bg1: string; bg2: string; accent: string }> = {
    painter: { bg1: '#16213A', bg2: '#253861', accent: '#FEB21D' },
    carpenter: { bg1: '#2C1B12', bg2: '#4A2E1E', accent: '#FB8B11' },
    tailor: { bg1: '#1E1B3A', bg2: '#332D63', accent: '#FEB21D' },
    electrician: { bg1: '#142638', bg2: '#1F3D5A', accent: '#FFC72C' },
    plumber: { bg1: '#112A36', bg2: '#1C465A', accent: '#38BDF8' },
    mason: { bg1: '#2D1E18', bg2: '#4A3228', accent: '#FB8B11' },
    other: { bg1: '#16213A', bg2: '#2A3B63', accent: '#FEB21D' },
  };
  const palette = colors[trade] || colors.painter;
  const safeTitle = titleText.replace(/[<>&"']/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.bg1}"/>
        <stop offset="100%" stop-color="${palette.bg2}"/>
      </linearGradient>
    </defs>
    <rect width="480" height="300" rx="18" fill="url(#g)"/>
    <rect x="20" y="20" width="440" height="260" rx="12" fill="none" stroke="${palette.accent}" stroke-width="2" stroke-dasharray="6 4" opacity="0.6"/>
    <circle cx="240" cy="115" r="42" fill="${palette.accent}" opacity="0.2"/>
    <path d="M222 115 L235 128 L262 101" fill="none" stroke="${palette.accent}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="240" y="190" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="20" font-weight="bold">After Work Photo · काम की फ़ोटो</text>
    <text x="240" y="220" text-anchor="middle" fill="${palette.accent}" font-family="sans-serif" font-size="16" font-weight="bold">${safeTitle}</text>
    <text x="240" y="252" text-anchor="middle" fill="#CBD5E1" font-family="sans-serif" font-size="13">Compressed JPEG ≤800px · Shramik</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns Today + Next 10 Days (11 days total) as YYYY-MM-DD strings
 */
export function getNext11Days(): string[] {
  const days: string[] = [];
  const base = new Date();
  for (let i = 0; i <= 10; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    days.push(`${y}-${m}-${day}`);
  }
  return days;
}

export function getNext7Days(): string[] {
  return getNext11Days();
}

export function isSlotInPast(dateIso: string, slotId: TimeSlotId): boolean {
  const today = getTodayIso();
  if (dateIso < today) return true;
  if (dateIso > today) return false;
  const slotObj = TIME_SLOTS.find((s) => s.id === slotId);
  if (!slotObj) return false;
  const currentHour = new Date().getHours();
  return currentHour >= slotObj.startHour;
}

export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function offsetCoords(
  baseLat: number,
  baseLng: number,
  dLatKm: number,
  dLngKm: number
): { lat: number; lng: number } {
  const latOffset = dLatKm / 111;
  const lngOffset = dLngKm / (111 * Math.cos((baseLat * Math.PI) / 180));
  return {
    lat: Number((baseLat + latOffset).toFixed(6)),
    lng: Number((baseLng + lngOffset).toFixed(6)),
  };
}

function buildDefault11DayAvailability(
  pattern: 'all' | 'morning' | 'afternoon' | 'most'
): Record<string, TimeSlotId[]> {
  const days = getNext11Days();
  const map: Record<string, TimeSlotId[]> = {};
  days.forEach((d) => {
    if (pattern === 'all') {
      map[d] = ['08-10', '10-12', '12-14', '14-16', '16-18', '18-20'];
    } else if (pattern === 'morning') {
      map[d] = ['08-10', '10-12', '12-14', '16-18'];
    } else if (pattern === 'afternoon') {
      map[d] = ['10-12', '12-14', '14-16', '16-18', '18-20'];
    } else {
      map[d] = ['08-10', '10-12', '14-16', '16-18', '18-20'];
    }
  });
  return map;
}

function generateSampleWorkers(anchorLat: number, anchorLng: number): WorkerProfile[] {
  const p1 = offsetCoords(anchorLat, anchorLng, 0.6, 0.5);
  const p2 = offsetCoords(anchorLat, anchorLng, -1.1, 0.8);
  const p3 = offsetCoords(anchorLat, anchorLng, 1.5, -1.0);
  const p4 = offsetCoords(anchorLat, anchorLng, -1.9, -1.2);
  const p5 = offsetCoords(anchorLat, anchorLng, 2.4, 1.4);
  const p6 = offsetCoords(anchorLat, anchorLng, -2.8, 2.0);
  const p7 = offsetCoords(anchorLat, anchorLng, 1.2, -1.8);

  return [
    {
      id: 'worker-sample-1',
      handle: '@ramesh_painter42',
      shramikId: 'SH-48213',
      nameEn: 'Ramesh Verma',
      nameHi: 'रमेश वर्मा',
      trade: 'painter',
      rateAmount: 650,
      rateUnit: 'day',
      govtVerified: true,
      govtIdType: 'aadhaar',
      govtIdMasked: 'XXXX-4821',
      lat: p1.lat,
      lng: p1.lng,
      areaNameEn: '0.8 km · Sector 4 Market',
      areaNameHi: '0.8 किमी · सेक्टर 4 बाज़ार',
      isSample: true,
      availability: buildDefault11DayAvailability('all'),
      unavailableDays: {},
    },
    {
      id: 'worker-sample-2',
      handle: '@mahesh_carpenter19',
      shramikId: 'SH-39104',
      nameEn: 'Mahesh Vishwakarma',
      nameHi: 'महेश विश्वकर्मा',
      trade: 'carpenter',
      rateAmount: 750,
      rateUnit: 'day',
      govtVerified: true,
      govtIdType: 'eshram',
      govtIdMasked: 'UAN-9104',
      lat: p2.lat,
      lng: p2.lng,
      areaNameEn: '1.4 km · Main Chowk',
      areaNameHi: '1.4 किमी · मुख्य चौक',
      isSample: true,
      availability: buildDefault11DayAvailability('most'),
      unavailableDays: {},
    },
    {
      id: 'worker-sample-3',
      handle: '@sunita_tailor07',
      shramikId: 'SH-52918',
      nameEn: 'Sunita Devi',
      nameHi: 'सुनीता देवी',
      trade: 'tailor',
      rateAmount: 250,
      rateUnit: 'job',
      govtVerified: true,
      govtIdType: 'aadhaar',
      govtIdMasked: 'XXXX-3319',
      lat: p3.lat,
      lng: p3.lng,
      areaNameEn: '1.8 km · Gandhi Nagar',
      areaNameHi: '1.8 किमी · गांधी नगर',
      isSample: true,
      availability: buildDefault11DayAvailability('afternoon'),
      unavailableDays: {},
    },
    {
      id: 'worker-sample-4',
      handle: '@suresh_electrician88',
      shramikId: 'SH-61042',
      nameEn: 'Suresh Yadav',
      nameHi: 'सुरेश यादव',
      trade: 'electrician',
      rateAmount: 300,
      rateUnit: 'hour',
      govtVerified: true,
      govtIdType: 'pan_voter',
      govtIdMasked: 'ID-7741',
      lat: p4.lat,
      lng: p4.lng,
      areaNameEn: '2.2 km · Station Road',
      areaNameHi: '2.2 किमी · स्टेशन रोड',
      isSample: true,
      availability: buildDefault11DayAvailability('all'),
      unavailableDays: {},
    },
    {
      id: 'worker-sample-5',
      handle: '@dinesh_plumber55',
      shramikId: 'SH-74820',
      nameEn: 'Dinesh प्रजापति',
      nameHi: 'दिनेश प्रजापति',
      trade: 'plumber',
      rateAmount: 350,
      rateUnit: 'job',
      govtVerified: true,
      govtIdType: 'eshram',
      govtIdMasked: 'UAN-5512',
      lat: p5.lat,
      lng: p5.lng,
      areaNameEn: '2.8 km · Shastri Colony',
      areaNameHi: '2.8 किमी · शास्त्री कॉलोनी',
      isSample: true,
      availability: buildDefault11DayAvailability('morning'),
      unavailableDays: {},
    },
    {
      id: 'worker-sample-6',
      handle: '@hariram_mason31',
      shramikId: 'SH-83911',
      nameEn: 'Hariram Kushwaha',
      nameHi: 'हरिराम कुशवाहा',
      trade: 'mason',
      rateAmount: 800,
      rateUnit: 'day',
      govtVerified: true,
      govtIdType: 'aadhaar',
      govtIdMasked: 'XXXX-6092',
      lat: p6.lat,
      lng: p6.lng,
      areaNameEn: '3.4 km · Patel Nagar',
      areaNameHi: '3.4 किमी · पटेल नगर',
      isSample: true,
      availability: buildDefault11DayAvailability('most'),
      unavailableDays: {},
    },
    {
      id: 'worker-sample-7',
      handle: '@vikas_welder64',
      shramikId: 'SH-90415',
      nameEn: 'Vikas Sharma',
      nameHi: 'विकास शर्मा',
      trade: 'other',
      customTradeName: 'AC & Welding Specialist (एसी और वेल्डिंग)',
      rateAmount: 500,
      rateUnit: 'job',
      govtVerified: true,
      govtIdType: 'aadhaar',
      govtIdMasked: 'XXXX-1184',
      lat: p7.lat,
      lng: p7.lng,
      areaNameEn: '2.1 km · Naya Bazar',
      areaNameHi: '2.1 किमी · नया बाज़ार',
      isSample: true,
      availability: buildDefault11DayAvailability('all'),
      unavailableDays: {},
    },
  ];
}

/**
 * Seed 4 sample reviews labelled isSample: true ("SAMPLE")
 */
function generateSampleReviews(): Review[] {
  const today = getTodayIso();
  return [
    {
      id: 'rev-sample-1',
      bookingId: 'bk-sample-hist-1',
      workerId: 'worker-sample-1',
      customerId: 'cust-sample-1',
      customerName: 'Anjali Sharma',
      jobFinished: 'yes',
      satisfied: true,
      hireAgain: true,
      ratings: {
        quality: 5,
        behaviour: 5,
        safety: 5,
        womenSafety: 5,
        punctuality: 5,
      },
      overall: 5,
      issueTags: [],
      likeTags: ['quality', 'punctuality', 'safe_respectful', 'cleanliness'],
      text: 'Repainted two bedroom walls cleanly in one day. Very polite and respectful around family.',
      workerPhoto: createSampleWorkPhotoDataUrl('painter', '2 Bedroom Wall Coat · SAMPLE'),
      workerReply: 'धन्यवाद मैडम, समय पर काम पूरा करना मेरी प्राथमिकता है।',
      isSample: true,
      createdAt: today,
    },
    {
      id: 'rev-sample-2',
      bookingId: 'bk-sample-hist-2',
      workerId: 'worker-sample-1',
      customerId: 'cust-sample-2',
      customerName: 'Rohit Kulkarni',
      jobFinished: 'yes',
      satisfied: true,
      hireAgain: true,
      ratings: {
        quality: 5,
        behaviour: 5,
        safety: 5,
        womenSafety: null,
        punctuality: 4,
      },
      overall: 5,
      issueTags: [],
      likeTags: ['skill', 'fair_price', 'behaviour'],
      text: 'Smooth putty and primer finish in hall. Left the floor clean after work.',
      isSample: true,
      createdAt: today,
    },
    {
      id: 'rev-sample-3',
      bookingId: 'bk-sample-hist-3',
      workerId: 'worker-sample-1',
      customerId: 'cust-sample-3',
      customerName: 'Kavita Nair',
      jobFinished: 'yes',
      satisfied: true,
      hireAgain: true,
      ratings: {
        quality: 4,
        behaviour: 5,
        safety: 5,
        womenSafety: 5,
        punctuality: 5,
      },
      overall: 4,
      issueTags: [],
      likeTags: ['punctuality', 'safe_respectful', 'easy_booking'],
      text: 'Came on time at 10 AM slot and completed balcony waterproofing coat neatly.',
      isSample: true,
      createdAt: today,
    },
    {
      id: 'rev-sample-4',
      bookingId: 'bk-sample-hist-4',
      workerId: 'worker-sample-1',
      customerId: 'cust-sample-4',
      customerName: 'Deepak Gupta',
      jobFinished: 'partly',
      satisfied: false,
      hireAgain: false,
      ratings: {
        quality: 3,
        behaviour: 4,
        safety: 4,
        womenSafety: 4,
        punctuality: 2,
      },
      overall: 3,
      issueTags: ['late', 'incomplete'],
      likeTags: [],
      text: 'Painting quality was fine, but arrived 45 minutes late so the kitchen door coat remained for next day.',
      isSample: true,
      createdAt: today,
    },
  ];
}

function generateSampleReferences(): Reference[] {
  const today = getTodayIso();
  return [
    {
      id: 'ref-sample-1',
      workerId: 'worker-sample-1',
      name: 'Ustad Mahendra Sharma',
      relation: 'ustad',
      mobile: '9876543245',
      line: 'Ramesh learned wall putty, primer, and texture painting under me for 8 years. Very sincere artisan.',
      status: 'confirmed_demo',
      isSample: true,
      createdAt: today,
    },
    {
      id: 'ref-sample-2',
      workerId: 'worker-sample-1',
      name: 'Rajesh Hardware & Paints',
      relation: 'shop_owner',
      mobile: '9812345689',
      line: 'Regular contractor at our paint shop for 6 years. Always uses genuine Asian/Berger materials.',
      status: 'unconfirmed',
      isSample: true,
      createdAt: today,
    },
    {
      id: 'ref-sample-3',
      workerId: 'worker-user-self',
      name: 'Thekedar Brijesh Singh',
      relation: 'contractor',
      mobile: '9988776645',
      line: 'Completed 18 residential flats with zero complaints and clean finishing.',
      status: 'confirmed_demo',
      isSample: true,
      createdAt: today,
    },
  ];
}

function generateSampleJourneyEntries(): JourneyEntry[] {
  return [
    {
      id: 'jrn-sample-1',
      workerId: 'worker-sample-1',
      city: 'Jaipur',
      trade: 'painter',
      fromYear: 2012,
      toYear: 2019,
      note: 'Interior & exterior house painting, royal play texture, and waterproofing.',
      isSample: true,
    },
    {
      id: 'jrn-sample-2',
      workerId: 'worker-sample-1',
      city: 'Delhi / Mumbai',
      trade: 'painter',
      fromYear: 2019,
      toYear: null,
      note: 'Independent residential painting & wood polish specialist.',
      isSample: true,
    },
    {
      id: 'jrn-sample-3',
      workerId: 'worker-user-self',
      city: 'Bhopal',
      trade: 'painter',
      fromYear: 2015,
      toYear: 2021,
      note: 'Worked with senior contractor on apartment painting & putty work.',
      isSample: true,
    },
    {
      id: 'jrn-sample-4',
      workerId: 'worker-user-self',
      city: 'Mumbai',
      trade: 'painter',
      fromYear: 2021,
      toYear: null,
      note: 'Direct home painting & texture service on Shramik.',
      isSample: true,
    },
  ];
}

function generateSampleJobPosts(anchorLat: number, anchorLng: number): JobPost[] {
  const days = getNext11Days();
  const today = days[0];
  const tomorrow = days[1] || days[0];
  const day3 = days[2] || days[0];

  const c1 = offsetCoords(anchorLat, anchorLng, 0.5, -0.4);
  const c2 = offsetCoords(anchorLat, anchorLng, -1.2, 0.9);
  const c3 = offsetCoords(anchorLat, anchorLng, 1.7, 1.1);
  const c4 = offsetCoords(anchorLat, anchorLng, -2.1, -1.4);

  return [
    {
      id: 'job-sample-1',
      customerId: 'cust-sample-1',
      customerNameEn: 'Priya',
      customerNameHi: 'प्रिया',
      trade: 'painter',
      descriptionEn: 'Need living room and balcony wall repainting (2 coats plastic emulsion).',
      descriptionHi: 'बैठक और बालकनी की दीवारों पर 2 कोट पेंट करवाना है।',
      preferredDate: today,
      preferredSlots: ['10-12', '14-16'],
      budget: 1400,
      lat: c1.lat,
      lng: c1.lng,
      areaNameEn: '0.6 km · Green Park',
      areaNameHi: '0.6 किमी · ग्रीन पार्क',
      status: 'open',
      isSample: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'job-sample-2',
      customerId: 'cust-sample-2',
      customerNameEn: 'Amit',
      customerNameHi: 'अमित',
      trade: 'electrician',
      descriptionEn: 'Install ceiling fan regulator and fix 3 switchboard sockets in bedroom.',
      descriptionHi: 'कमरे में पंखे का रेगुलेटर और 3 स्विच बोर्ड ठीक करने हैं।',
      preferredDate: today,
      preferredSlots: ['08-10', '16-18'],
      budget: 450,
      lat: c2.lat,
      lng: c2.lng,
      areaNameEn: '1.5 km · Shanti Vihar',
      areaNameHi: '1.5 किमी · शांति विहार',
      status: 'open',
      isSample: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'job-sample-3',
      customerId: 'cust-sample-3',
      customerNameEn: 'Neha',
      customerNameHi: 'नेहा',
      trade: 'carpenter',
      descriptionEn: 'Kitchen cabinet hinge replacement and wooden door lock fitting.',
      descriptionHi: 'रसोई की अलमारी के कब्जे और मुख्य दरवाजे की कुंडी लगानी है।',
      preferredDate: tomorrow,
      preferredSlots: ['10-12', '12-14'],
      budget: 600,
      lat: c3.lat,
      lng: c3.lng,
      areaNameEn: '2.0 km · Model Town',
      areaNameHi: '2.0 किमी · मॉडल टाउन',
      status: 'open',
      isSample: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'job-sample-4',
      customerId: 'cust-sample-4',
      customerNameEn: 'Rajeev',
      customerNameHi: 'राजीव',
      trade: 'plumber',
      descriptionEn: 'Bathroom mixer tap leakage and overhead tank float valve replacement.',
      descriptionHi: 'बाथरूम के नल की लीकेज और टंकी का वाल्व बदलना है।',
      preferredDate: day3,
      preferredSlots: ['08-10', '10-12'],
      budget: 500,
      lat: c4.lat,
      lng: c4.lng,
      areaNameEn: '2.5 km · Civil Lines',
      areaNameHi: '2.5 किमी · सिविल लाइन्स',
      status: 'open',
      isSample: true,
      createdAt: new Date().toISOString(),
    },
  ];
}

function createInitialStore(): StoreSchema {
  const defaultLoc = SAMPLE_LOCALITIES[0];
  return {
    user: {
      hasSeenWelcome: false,
      onboardingComplete: false,
      language: undefined,
      role: undefined,
      workerId: 'worker-user-self',
      workerHandle: '@shramik_painter42',
      workerShramikId: 'SH-48299',
      customerId: 'customer-user-self',
      workerName: '',
      workerTrade: 'painter',
      workerCustomTrade: '',
      workerRateAmount: 600,
      workerRateUnit: 'day',
      workerGovtVerified: false,
      workerGovtIdType: 'aadhaar',
      workerGovtIdNumber: '',
      customerName: '',
      location: defaultLoc,
    },
    workers: generateSampleWorkers(defaultLoc.lat, defaultLoc.lng),
    jobPosts: generateSampleJobPosts(defaultLoc.lat, defaultLoc.lng),
    bookings: [
      {
        id: 'bk-demo-ready-1',
        workerId: 'worker-sample-1',
        workerHandle: '@ramesh_painter42',
        workerShramikId: 'SH-48213',
        workerNameEn: 'Ramesh Verma',
        workerNameHi: 'रमेश वर्मा',
        customerId: 'customer-user-self',
        customerNameEn: 'Demo Customer',
        customerNameHi: 'डेमो ग्राहक',
        trade: 'painter',
        date: getTodayIso(),
        slot: '10-12',
        status: 'waiting_customer_confirmation',
        startedBy: 'customer',
        note: 'Hall wall primer & 2 coats (Demo job ready to confirm & review)',
        workRecordStatus: 'self_reported',
        photoConsent: true,
        workerCompletionPhoto: createSampleWorkPhotoDataUrl(
          'painter',
          'Hall Wall Primer & 2 Coats · Ramesh Verma'
        ),
        isSample: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'bk-history-sample-1',
        workerId: 'worker-sample-1',
        workerHandle: '@ramesh_painter42',
        workerShramikId: 'SH-48213',
        workerNameEn: 'Ramesh Verma',
        workerNameHi: 'रमेश वर्मा',
        customerId: 'customer-user-self',
        customerNameEn: 'Demo Customer',
        customerNameHi: 'डेमो ग्राहक',
        trade: 'painter',
        date: getTodayIso(),
        slot: '08-10',
        status: 'completed',
        startedBy: 'customer',
        note: 'Bedroom & balcony wall painting (Completed work in History)',
        workRecordStatus: 'customer_confirmed',
        photoConsent: true,
        workerCompletionPhoto: createSampleWorkPhotoDataUrl(
          'painter',
          'Completed Bedroom Painting · Ramesh Verma'
        ),
        reviewId: 'rev-sample-1',
        isSample: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'bk-history-sample-2',
        workerId: 'worker-sample-2',
        workerHandle: '@salim_carpenter18',
        workerShramikId: 'SH-48214',
        workerNameEn: 'Salim Khan',
        workerNameHi: 'सलीम खान',
        customerId: 'customer-user-self',
        customerNameEn: 'Demo Customer',
        customerNameHi: 'डेमो ग्राहक',
        trade: 'carpenter',
        date: getTodayIso(),
        slot: '12-14',
        status: 'completed',
        startedBy: 'customer',
        note: 'Modular kitchen cabinet repair & door lock fitting (Completed work in History)',
        workRecordStatus: 'customer_confirmed',
        photoConsent: true,
        workerCompletionPhoto: createSampleWorkPhotoDataUrl(
          'carpenter',
          'Kitchen Cabinet & Door Fitting · Salim Khan'
        ),
        reviewId: 'rev-sample-3',
        isSample: true,
        createdAt: new Date().toISOString(),
      },
    ],
    reviews: generateSampleReviews(),
    flags: [],
    references: generateSampleReferences(),
    journeyEntries: generateSampleJourneyEntries(),
    seedAnchor: { lat: defaultLoc.lat, lng: defaultLoc.lng },
  };
}

function readStore(): StoreSchema {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = createInitialStore();
      writeStore(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as StoreSchema;
    if (!parsed.user || !Array.isArray(parsed.workers)) {
      const initial = createInitialStore();
      writeStore(initial);
      return initial;
    }
    if (!Array.isArray(parsed.reviews)) {
      parsed.reviews = generateSampleReviews();
    }
    if (!Array.isArray(parsed.flags)) {
      parsed.flags = [];
    }
    if (!Array.isArray(parsed.references)) {
      parsed.references = generateSampleReferences();
    }
    if (!Array.isArray(parsed.journeyEntries)) {
      parsed.journeyEntries = generateSampleJourneyEntries();
    }
    return parsed;
  } catch {
    return createInitialStore();
  }
}

function writeStore(data: StoreSchema): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    lastStorageError = false;
    return true;
  } catch {
    lastStorageError = true;
    return false;
  }
}

function reanchorSampleDataIfNeeded(store: StoreSchema, newLoc: GeoLocation): void {
  const prev = store.seedAnchor;
  const dist = prev
    ? calculateDistanceKm(prev.lat, prev.lng, newLoc.lat, newLoc.lng)
    : 999;

  if (dist > 3) {
    const customWorkers = store.workers.filter((w) => !w.isSample);
    const customJobs = store.jobPosts.filter((j) => !j.isSample);
    store.workers = [
      ...customWorkers,
      ...generateSampleWorkers(newLoc.lat, newLoc.lng),
    ];
    store.jobPosts = [
      ...customJobs,
      ...generateSampleJobPosts(newLoc.lat, newLoc.lng),
    ];
    store.seedAnchor = { lat: newLoc.lat, lng: newLoc.lng };
  }
}

function maskGovtId(idNumber: string): string {
  const clean = idNumber.replace(/\s+/g, '');
  if (clean.length <= 4) return clean;
  return `XXXX-${clean.slice(-4)}`;
}

function syncUserWorkerRecord(store: StoreSchema): void {
  const u = store.user;
  if (!u.location || !u.workerName.trim()) return;

  const existingIdx = store.workers.findIndex((w) => w.id === u.workerId);
  const defaultAvail = buildDefault11DayAvailability('all');
  const handle =
    u.workerHandle || generateWorkerHandle(u.workerName, u.workerTrade, '42');
  const shramikId = u.workerShramikId || 'SH-48299';
  u.workerHandle = handle;
  u.workerShramikId = shramikId;

  const updatedWorker: WorkerProfile = {
    id: u.workerId,
    handle,
    shramikId,
    nameEn: u.workerName.trim(),
    nameHi: u.workerName.trim(),
    trade: u.workerTrade,
    customTradeName: u.workerCustomTrade?.trim() || undefined,
    rateAmount: u.workerRateAmount || 600,
    rateUnit: u.workerRateUnit || 'day',
    govtVerified: u.workerGovtVerified,
    govtIdType: u.workerGovtIdType,
    govtIdMasked: u.workerGovtIdNumber ? maskGovtId(u.workerGovtIdNumber) : undefined,
    lat: u.location.lat,
    lng: u.location.lng,
    areaNameEn: u.location.areaNameEn,
    areaNameHi: u.location.areaNameHi,
    isSample: false,
    availability:
      existingIdx >= 0 ? store.workers[existingIdx].availability : defaultAvail,
    unavailableDays:
      existingIdx >= 0 ? store.workers[existingIdx].unavailableDays : {},
  };

  if (existingIdx >= 0) {
    store.workers[existingIdx] = updatedWorker;
  } else {
    store.workers.unshift(updatedWorker);
  }
}

export function getUserState(): AppUserState {
  const store = readStore();
  return store.user;
}

export function markWelcomeSeen(): AppUserState {
  const store = readStore();
  store.user.hasSeenWelcome = true;
  writeStore(store);
  return store.user;
}

export function setLanguage(language: Language): AppUserState {
  const store = readStore();
  store.user.language = language;
  writeStore(store);
  return store.user;
}

export function setRole(role: 'worker' | 'customer'): AppUserState {
  const store = readStore();
  store.user.role = role;
  writeStore(store);
  return store.user;
}

export function getVoiceConsent(): VoiceConsent | undefined {
  const store = readStore();
  return store.user.voiceConsent;
}

export function setVoiceConsent(accepted: boolean): VoiceConsent {
  const store = readStore();
  const consent: VoiceConsent = {
    accepted,
    at: new Date().toISOString(),
  };
  store.user.voiceConsent = consent;
  writeStore(store);
  return consent;
}

export function getVoiceMuted(): boolean {
  const store = readStore();
  return Boolean(store.user.voiceMuted);
}

export function setVoiceMuted(muted: boolean): boolean {
  const store = readStore();
  store.user.voiceMuted = muted;
  writeStore(store);
  return Boolean(store.user.voiceMuted);
}

export function isUserOnboarded(): boolean {
  try {
    const flag = window.localStorage.getItem('shramik_onboarded');
    const store = readStore();
    return flag === 'true' && Boolean(store.user?.onboardingComplete && store.user?.role);
  } catch {
    return false;
  }
}

export function logoutUser(): AppUserState {
  const store = readStore();
  store.user.onboardingComplete = false;
  store.user.hasSeenWelcome = true;
  try {
    window.localStorage.removeItem('shramik_onboarded');
  } catch {
    // ignore
  }
  writeStore(store);
  return store.user;
}

export function completeQuickSetup(params: {
  role: 'worker' | 'customer';
  name: string;
  handle?: string;
  trade?: TradeId;
  customTradeName?: string;
  rateAmount?: number;
  rateUnit?: RateUnit;
  govtVerified?: boolean;
  govtIdType?: GovtIdType;
  govtIdNumber?: string;
  location: GeoLocation;
}): AppUserState {
  const store = readStore();
  const cleanName = params.name.trim();
  store.user.role = params.role;
  store.user.location = params.location;
  store.user.hasSeenWelcome = true;

  if (params.role === 'worker') {
    store.user.workerName = cleanName;
    if (!store.user.customerName) store.user.customerName = cleanName;
    store.user.workerTrade = params.trade || 'painter';
    store.user.workerCustomTrade = params.customTradeName?.trim() || '';
    store.user.workerHandle =
      params.handle?.trim() ||
      generateWorkerHandle(cleanName, store.user.workerTrade, '42');
    if (!store.user.workerShramikId) {
      store.user.workerShramikId = generateShramikId(48299);
    }
    store.user.workerRateAmount = params.rateAmount || 600;
    store.user.workerRateUnit = params.rateUnit || 'day';
    store.user.workerGovtVerified = Boolean(params.govtVerified);
    store.user.workerGovtIdType = params.govtIdType || 'aadhaar';
    store.user.workerGovtIdNumber = params.govtIdNumber?.trim() || '';
  } else {
    store.user.customerName = cleanName;
    if (!store.user.workerName) store.user.workerName = cleanName;
  }

  store.user.onboardingComplete = true;
  try {
    window.localStorage.setItem('shramik_onboarded', 'true');
  } catch {
    // ignore
  }
  reanchorSampleDataIfNeeded(store, params.location);
  syncUserWorkerRecord(store);
  writeStore(store);
  return store.user;
}

export function updateProfile(params: {
  name: string;
  handle?: string;
  trade?: TradeId;
  customTradeName?: string;
  rateAmount?: number;
  rateUnit?: RateUnit;
  govtVerified?: boolean;
  govtIdType?: GovtIdType;
  govtIdNumber?: string;
  location?: GeoLocation;
}): AppUserState {
  const store = readStore();
  const cleanName = params.name.trim();
  if (store.user.role === 'worker') {
    store.user.workerName = cleanName;
    if (params.handle) store.user.workerHandle = params.handle.trim();
    if (params.trade) store.user.workerTrade = params.trade;
    if (params.customTradeName !== undefined) {
      store.user.workerCustomTrade = params.customTradeName.trim();
    }
    if (params.rateAmount) store.user.workerRateAmount = params.rateAmount;
    if (params.rateUnit) store.user.workerRateUnit = params.rateUnit;
    if (params.govtVerified !== undefined) {
      store.user.workerGovtVerified = params.govtVerified;
    }
    if (params.govtIdType) store.user.workerGovtIdType = params.govtIdType;
    if (params.govtIdNumber !== undefined) {
      store.user.workerGovtIdNumber = params.govtIdNumber.trim();
    }
  } else {
    store.user.customerName = cleanName;
  }

  if (params.location) {
    store.user.location = params.location;
    reanchorSampleDataIfNeeded(store, params.location);
  }

  syncUserWorkerRecord(store);
  writeStore(store);
  return store.user;
}

export function switchRoleForDemo(): AppUserState {
  const store = readStore();
  const nextRole = store.user.role === 'worker' ? 'customer' : 'worker';
  store.user.role = nextRole;
  if (!store.user.workerName && store.user.customerName) {
    store.user.workerName = store.user.customerName;
  }
  if (!store.user.customerName && store.user.workerName) {
    store.user.customerName = store.user.workerName;
  }
  syncUserWorkerRecord(store);
  writeStore(store);
  return store.user;
}

export function resetDemoData(): AppUserState {
  const current = readStore();
  const loc = current.user.location || SAMPLE_LOCALITIES[0];
  const initial = createInitialStore();
  const fresh: StoreSchema = {
    ...initial,
    user: {
      ...current.user,
      location: loc,
    },
    workers: generateSampleWorkers(loc.lat, loc.lng),
    jobPosts: generateSampleJobPosts(loc.lat, loc.lng),
    seedAnchor: { lat: loc.lat, lng: loc.lng },
  };
  syncUserWorkerRecord(fresh);
  writeStore(fresh);
  return fresh.user;
}

export function getWorkers(): WorkerProfile[] {
  const store = readStore();
  return store.workers;
}

export function toggleWorkerSlotAvailability(
  workerId: string,
  dateIso: string,
  slotId: TimeSlotId
): WorkerProfile | undefined {
  const store = readStore();
  const worker = store.workers.find((w) => w.id === workerId);
  if (!worker) return undefined;

  const currentSlots = worker.availability[dateIso] || [];
  const exists = currentSlots.includes(slotId);
  const nextSlots = exists
    ? currentSlots.filter((s) => s !== slotId)
    : [...currentSlots, slotId];

  worker.availability[dateIso] = nextSlots;
  if (nextSlots.length > 0 && worker.unavailableDays[dateIso]) {
    worker.unavailableDays[dateIso] = false;
  }
  writeStore(store);
  return worker;
}

export function setWorkerDayUnavailable(
  workerId: string,
  dateIso: string,
  isUnavailable: boolean
): WorkerProfile | undefined {
  const store = readStore();
  const worker = store.workers.find((w) => w.id === workerId);
  if (!worker) return undefined;

  worker.unavailableDays[dateIso] = isUnavailable;
  if (isUnavailable) {
    worker.availability[dateIso] = [];
  } else if (!worker.availability[dateIso] || worker.availability[dateIso].length === 0) {
    worker.availability[dateIso] = ['08-10', '10-12', '12-14', '14-16', '16-18', '18-20'];
  }
  writeStore(store);
  return worker;
}

export function getWorkerSlotBookingState(
  workerId: string,
  dateIso: string,
  slotId: TimeSlotId
): 'free' | 'pending' | 'confirmed' {
  const store = readStore();
  const activeBooking = store.bookings.find(
    (b) =>
      b.workerId === workerId &&
      b.date === dateIso &&
      b.slot === slotId &&
      (b.status === 'pending' ||
        b.status === 'confirmed' ||
        b.status === 'waiting_customer_confirmation' ||
        b.status === 'completed')
  );
  if (!activeBooking) return 'free';
  return activeBooking.status === 'pending' ? 'pending' : 'confirmed';
}

export function isWorkerAvailableOnDate(
  worker: WorkerProfile,
  dateIso: string
): boolean {
  if (worker.unavailableDays[dateIso]) return false;
  const openSlots = worker.availability[dateIso] || [
    '10-12',
    '14-16',
    '16-18',
    '18-20',
  ];
  return openSlots.some((slotId) => {
    if (isSlotInPast(dateIso, slotId)) return false;
    const state = getWorkerSlotBookingState(worker.id, dateIso, slotId);
    return state === 'free';
  });
}

export function isWorkerAvailableToday(worker: WorkerProfile): boolean {
  return isWorkerAvailableOnDate(worker, getTodayIso());
}

export function getJobPosts(): JobPost[] {
  const store = readStore();
  return store.jobPosts;
}

export function createJobPost(params: {
  trade: TradeId;
  customTradeName?: string;
  description: string;
  preferredDate: string;
  preferredSlots: TimeSlotId[];
  budget: number;
}): JobPost {
  const store = readStore();
  const loc = store.user.location || SAMPLE_LOCALITIES[0];
  const custName =
    store.user.customerName.trim() || store.user.workerName.trim() || 'Customer';

  const newPost: JobPost = {
    id: `job-${Date.now()}`,
    customerId: store.user.customerId,
    customerNameEn: custName,
    customerNameHi: custName,
    trade: params.trade,
    customTradeName: params.customTradeName?.trim() || undefined,
    descriptionEn: params.description.trim(),
    descriptionHi: params.description.trim(),
    preferredDate: params.preferredDate,
    preferredSlots: params.preferredSlots,
    budget: params.budget,
    lat: loc.lat,
    lng: loc.lng,
    areaNameEn: loc.areaNameEn,
    areaNameHi: loc.areaNameHi,
    status: 'open',
    isSample: false,
    createdAt: new Date().toISOString(),
  };

  store.jobPosts.unshift(newPost);
  writeStore(store);
  return newPost;
}

export function getBookings(): Booking[] {
  const store = readStore();
  return store.bookings;
}

/**
 * Returns completed bookings for the Customer Work History section.
 * If existing store has no completed bookings yet, ensures sample completed history items are present.
 */
export function getCustomerWorkHistory(): Booking[] {
  const store = readStore();
  const completed = store.bookings.filter((b) => b.status === 'completed');
  if (completed.length === 0) {
    const sampleHistory: Booking[] = [
      {
        id: 'bk-history-sample-1',
        workerId: 'worker-sample-1',
        workerHandle: '@ramesh_painter42',
        workerShramikId: 'SH-48213',
        workerNameEn: 'Ramesh Verma',
        workerNameHi: 'रमेश वर्मा',
        customerId: store.user.customerId || 'customer-user-self',
        customerNameEn: store.user.customerName || 'Demo Customer',
        customerNameHi: store.user.customerName || 'डेमो ग्राहक',
        trade: 'painter',
        date: getTodayIso(),
        slot: '08-10',
        status: 'completed',
        startedBy: 'customer',
        note: 'Bedroom & balcony wall painting (Completed work in History)',
        workRecordStatus: 'customer_confirmed',
        photoConsent: true,
        workerCompletionPhoto: createSampleWorkPhotoDataUrl(
          'painter',
          'Completed Bedroom Painting · Ramesh Verma'
        ),
        reviewId: 'rev-sample-1',
        isSample: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'bk-history-sample-2',
        workerId: 'worker-sample-2',
        workerHandle: '@salim_carpenter18',
        workerShramikId: 'SH-48214',
        workerNameEn: 'Salim Khan',
        workerNameHi: 'सलीम खान',
        customerId: store.user.customerId || 'customer-user-self',
        customerNameEn: store.user.customerName || 'Demo Customer',
        customerNameHi: store.user.customerName || 'डेमो ग्राहक',
        trade: 'carpenter',
        date: getTodayIso(),
        slot: '12-14',
        status: 'completed',
        startedBy: 'customer',
        note: 'Modular kitchen cabinet repair & door lock fitting (Completed work in History)',
        workRecordStatus: 'customer_confirmed',
        photoConsent: true,
        workerCompletionPhoto: createSampleWorkPhotoDataUrl(
          'carpenter',
          'Kitchen Cabinet & Door Fitting · Salim Khan'
        ),
        reviewId: 'rev-sample-3',
        isSample: true,
        createdAt: new Date().toISOString(),
      },
    ];
    store.bookings.push(...sampleHistory);
    writeStore(store);
    return sampleHistory;
  }
  return completed;
}

export function createBooking(params: {
  workerId: string;
  customerId: string;
  customerNameEn: string;
  customerNameHi: string;
  jobPostId?: string;
  trade: TradeId;
  customTradeName?: string;
  date: string;
  slot: TimeSlotId;
  startedBy: 'customer' | 'worker';
  note?: string;
}): { booking?: Booking; error?: 'slot_taken' } {
  const store = readStore();

  const conflict = store.bookings.find(
    (b) =>
      b.workerId === params.workerId &&
      b.date === params.date &&
      b.slot === params.slot &&
      (b.status === 'pending' ||
        b.status === 'confirmed' ||
        b.status === 'waiting_customer_confirmation' ||
        b.status === 'completed')
  );
  if (conflict) {
    return { error: 'slot_taken' };
  }

  const worker = store.workers.find((w) => w.id === params.workerId);
  const workerNameEn = worker ? worker.nameEn : store.user.workerName || 'Worker';
  const workerNameHi = worker ? worker.nameHi : store.user.workerName || 'श्रमिक';
  const workerHandle = worker
    ? worker.handle
    : store.user.workerHandle || '@shramik_painter42';
  const workerShramikId = worker
    ? worker.shramikId
    : store.user.workerShramikId || 'SH-48299';

  if (worker && params.startedBy === 'worker') {
    const daySlots = worker.availability[params.date] || [];
    if (!daySlots.includes(params.slot)) {
      worker.availability[params.date] = [...daySlots, params.slot];
    }
    worker.unavailableDays[params.date] = false;
  }

  const booking: Booking = {
    id: `bk-${Date.now()}`,
    workerId: params.workerId,
    workerHandle,
    workerShramikId,
    workerNameEn,
    workerNameHi,
    customerId: params.customerId,
    customerNameEn: params.customerNameEn,
    customerNameHi: params.customerNameHi,
    jobPostId: params.jobPostId,
    trade: params.trade,
    customTradeName: params.customTradeName || worker?.customTradeName,
    date: params.date,
    slot: params.slot,
    status: 'pending',
    startedBy: params.startedBy,
    note: params.note?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  store.bookings.unshift(booking);
  writeStore(store);
  return { booking };
}

/**
 * Helper to create an instant Confirmed booking for testing Part 4 completion & review flows
 */
export function createDemoConfirmedBooking(): Booking {
  const store = readStore();
  const worker = store.workers[0];
  const custName =
    store.user.customerName.trim() || store.user.workerName.trim() || 'Priya S.';
  const bk: Booking = {
    id: `bk-demo-${Date.now()}`,
    workerId: worker.id,
    workerHandle: worker.handle,
    workerShramikId: worker.shramikId,
    workerNameEn: worker.nameEn,
    workerNameHi: worker.nameHi,
    customerId: store.user.customerId,
    customerNameEn: custName,
    customerNameHi: custName,
    trade: worker.trade,
    date: getTodayIso(),
    slot: '14-16',
    status: 'confirmed',
    startedBy: 'customer',
    note: 'Demo confirmed job to test Worker "Mark job complete" & Customer review',
    isSample: true,
    createdAt: new Date().toISOString(),
  };
  store.bookings.unshift(bk);
  writeStore(store);
  return bk;
}

export function updateBookingStatus(
  bookingId: string,
  nextStatus: BookingStatus
): Booking | undefined {
  const store = readStore();
  const booking = store.bookings.find((b) => b.id === bookingId);
  if (!booking) return undefined;

  booking.status = nextStatus;

  if (nextStatus === 'confirmed' && booking.jobPostId) {
    const job = store.jobPosts.find((j) => j.id === booking.jobPostId);
    if (job) {
      job.status = 'booked';
    }
    store.bookings.forEach((other) => {
      if (
        other.id !== booking.id &&
        other.jobPostId === booking.jobPostId &&
        other.status === 'pending'
      ) {
        other.status = 'declined';
      }
    });
  }

  writeStore(store);
  return booking;
}

/**
 * PART 4: Worker taps "Mark job complete" with mandatory compressed "after" photo + consent.
 * Moves booking to "waiting_customer_confirmation" and marks workRecordStatus = "self_reported".
 */
export function markJobCompleteByWorker(params: {
  bookingId: string;
  afterPhotoDataUrl: string;
  photoConsent: boolean;
}): { booking?: Booking; error?: 'photo_and_consent_required' | 'storage_full' } {
  if (!params.afterPhotoDataUrl.trim() || !params.photoConsent) {
    return { error: 'photo_and_consent_required' };
  }
  const store = readStore();
  const booking = store.bookings.find((b) => b.id === params.bookingId);
  if (!booking) return {};

  booking.workerCompletionPhoto = params.afterPhotoDataUrl;
  booking.photoConsent = true;
  booking.status = 'waiting_customer_confirmation';
  booking.workRecordStatus = 'self_reported';

  if (!writeStore(store)) {
    return { error: 'storage_full' };
  }
  return { booking };
}

/**
 * PART 4: Customer confirms the job after reviewing worker's photo (and optionally adding their own).
 * Changes workRecordStatus from "self_reported" to "customer_confirmed".
 */
export function confirmJob(
  bookingId: string,
  optionalCustomerPhoto?: string
): Booking | undefined {
  const store = readStore();
  const booking = store.bookings.find((b) => b.id === bookingId);
  if (!booking) return undefined;

  if (optionalCustomerPhoto && optionalCustomerPhoto.trim()) {
    booking.customerCompletionPhoto = optionalCustomerPhoto.trim();
  }
  booking.status = 'completed';
  booking.workRecordStatus = 'customer_confirmed';

  writeStore(store);
  return booking;
}

/**
 * PART 4: Customer says "not done" -> flags the job as "Disputed" and records a Flag.
 */
export function disputeJob(
  bookingId: string,
  reason = 'Customer says work not done'
): Booking | undefined {
  const store = readStore();
  const booking = store.bookings.find((b) => b.id === bookingId);
  if (!booking) return undefined;

  booking.status = 'disputed';
  booking.workRecordStatus = 'disputed';

  store.flags.unshift({
    id: `flag-${Date.now()}`,
    type: 'job',
    targetId: bookingId,
    reason,
    createdAt: getTodayIso(),
    status: 'open',
  });

  writeStore(store);
  return booking;
}

/**
 * PART 4: Add a customer review (one review per completed booking, rejects duplicates).
 */
export function addReview(params: {
  bookingId: string;
  workerId: string;
  customerId: string;
  customerName: string;
  jobFinished: 'yes' | 'partly' | 'no';
  satisfied: boolean;
  hireAgain: boolean;
  ratings: {
    quality: number;
    behaviour: number;
    safety: number;
    womenSafety: number | null;
    punctuality: number;
  };
  overall: number;
  issueTags: IssueTagId[];
  likeTags: LikeTagId[];
  otherTagText?: string;
  text: string;
  customerPhoto?: string;
}): { review?: Review; error?: 'duplicate_review' | 'storage_full' } {
  const store = readStore();

  // Reject duplicate review per booking
  if (
    params.bookingId &&
    store.reviews.some((r) => r.bookingId === params.bookingId && !r.isSample)
  ) {
    return { error: 'duplicate_review' };
  }

  const booking = store.bookings.find((b) => b.id === params.bookingId);
  if (booking && params.customerPhoto) {
    booking.customerCompletionPhoto = params.customerPhoto;
  }

  const review: Review = {
    id: `rev-${Date.now()}`,
    bookingId: params.bookingId,
    workerId: params.workerId,
    customerId: params.customerId,
    customerName: params.customerName.trim() || 'Customer',
    jobFinished: params.jobFinished,
    satisfied: params.satisfied,
    hireAgain: params.hireAgain,
    ratings: params.ratings,
    overall: params.overall,
    issueTags: params.issueTags,
    likeTags: params.likeTags,
    otherTagText: params.otherTagText?.trim() || undefined,
    text: params.text.trim().slice(0, 300),
    customerPhoto: params.customerPhoto || booking?.customerCompletionPhoto,
    workerPhoto: booking?.workerCompletionPhoto,
    isSample: false,
    createdAt: getTodayIso(),
  };

  store.reviews.unshift(review);

  if (booking) {
    booking.reviewId = review.id;
    booking.status = 'completed';
    booking.workRecordStatus = 'customer_confirmed';
  }

  if (!writeStore(store)) {
    return { error: 'storage_full' };
  }
  return { review };
}

export function listReviews(workerId: string): Review[] {
  const store = readStore();
  return store.reviews.filter((r) => r.workerId === workerId);
}

/**
 * PART 4: Computes rating summary for a worker.
 * Sample reviews are excluded from the average unless includeSample === true.
 */
export function getRatingSummary(
  workerId: string,
  includeSample = false
): RatingSummary {
  const allForWorker = listReviews(workerId);
  const realReviews = allForWorker.filter((r) => !r.isSample);
  const sampleReviews = allForWorker.filter((r) => r.isSample);
  const pool = includeSample ? allForWorker : realReviews;

  const starCounts: Record<1 | 2 | 3 | 4 | 5, number> = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  if (pool.length === 0) {
    return {
      averageOverall: 0,
      totalCount: 0,
      realCount: realReviews.length,
      sampleCount: sampleReviews.length,
      includesSampleData: includeSample,
      starCounts,
      categoryAverages: {
        quality: 0,
        behaviour: 0,
        safety: 0,
        womenSafety: null,
        punctuality: 0,
      },
      hireAgainPercent: 0,
      wapasBulayaCount: 0,
      topLikedTag: null,
      topIssueTag: null,
    };
  }

  let sumOverall = 0;
  let sumQuality = 0;
  let sumBehaviour = 0;
  let sumSafety = 0;
  let sumWomenSafety = 0;
  let countWomenSafety = 0;
  let sumPunctuality = 0;
  let hireAgainCount = 0;

  const likeCounter: Partial<Record<LikeTagId, number>> = {};
  const issueCounter: Partial<Record<IssueTagId, number>> = {};

  pool.forEach((r) => {
    const clamped = Math.min(5, Math.max(1, Math.round(r.overall))) as 1 | 2 | 3 | 4 | 5;
    starCounts[clamped] += 1;
    sumOverall += r.overall;
    sumQuality += r.ratings.quality;
    sumBehaviour += r.ratings.behaviour;
    sumSafety += r.ratings.safety;
    if (r.ratings.womenSafety !== null && r.ratings.womenSafety !== undefined) {
      sumWomenSafety += r.ratings.womenSafety;
      countWomenSafety += 1;
    }
    sumPunctuality += r.ratings.punctuality;
    if (r.hireAgain) hireAgainCount += 1;

    r.likeTags.forEach((tag) => {
      likeCounter[tag] = (likeCounter[tag] || 0) + 1;
    });
    r.issueTags.forEach((tag) => {
      issueCounter[tag] = (issueCounter[tag] || 0) + 1;
    });
  });

  const n = pool.length;
  let topLikedTag: LikeTagId | null = null;
  let maxLike = 0;
  (Object.keys(likeCounter) as LikeTagId[]).forEach((k) => {
    const c = likeCounter[k] || 0;
    if (c > maxLike) {
      maxLike = c;
      topLikedTag = k;
    }
  });

  let topIssueTag: IssueTagId | null = null;
  let maxIssue = 0;
  (Object.keys(issueCounter) as IssueTagId[]).forEach((k) => {
    const c = issueCounter[k] || 0;
    if (c > maxIssue) {
      maxIssue = c;
      topIssueTag = k;
    }
  });

  return {
    averageOverall: Number((sumOverall / n).toFixed(1)),
    totalCount: n,
    realCount: realReviews.length,
    sampleCount: sampleReviews.length,
    includesSampleData: includeSample,
    starCounts,
    categoryAverages: {
      quality: Number((sumQuality / n).toFixed(1)),
      behaviour: Number((sumBehaviour / n).toFixed(1)),
      safety: Number((sumSafety / n).toFixed(1)),
      womenSafety:
        countWomenSafety > 0
          ? Number((sumWomenSafety / countWomenSafety).toFixed(1))
          : null,
      punctuality: Number((sumPunctuality / n).toFixed(1)),
    },
    hireAgainPercent: Math.round((hireAgainCount / n) * 100),
    wapasBulayaCount: hireAgainCount,
    topLikedTag,
    topIssueTag,
  };
}

/**
 * PART 4: Worker can post one public reply per review (max 150 chars).
 */
export function addWorkerReply(reviewId: string, replyText: string): Review | undefined {
  const store = readStore();
  const rev = store.reviews.find((r) => r.id === reviewId);
  if (!rev) return undefined;
  const clean = replyText.trim().slice(0, 150);
  if (!clean) return undefined;
  rev.workerReply = clean;
  writeStore(store);
  return rev;
}

/**
 * PART 4: Report a review, worker, or job -> adds to Admin Flag list.
 */
export function addFlag(params: {
  type: 'review' | 'worker' | 'job';
  targetId: string;
  reason: string;
}): Flag {
  const store = readStore();
  const flag: Flag = {
    id: `flag-${Date.now()}`,
    type: params.type,
    targetId: params.targetId,
    reason: params.reason,
    createdAt: getTodayIso(),
    status: 'open',
  };
  store.flags.unshift(flag);

  if (params.type === 'review') {
    const rev = store.reviews.find((r) => r.id === params.targetId);
    if (rev) {
      rev.underReview = true;
    }
  }

  writeStore(store);
  return flag;
}

export function listFlags(): Flag[] {
  const store = readStore();
  return store.flags;
}

/**
 * Masks referee mobile number so other users NEVER see the full number:
 * shows only last 2 digits (e.g. XXXXXXXX45).
 */
export function maskRefereeMobile(mobile: string): string {
  const digits = (mobile || '').replace(/\D/g, '');
  const last2 = digits.slice(-2).padStart(2, '0');
  return `XXXXXXXX${last2}`;
}

/**
 * USTAD KI GAWAHI (References) CRUD functions
 */
export function listReferences(workerId: string): Reference[] {
  const store = readStore();
  return store.references.filter((r) => r.workerId === workerId);
}

export function addReference(params: {
  workerId: string;
  name: string;
  relation: RefereeRelation;
  mobile: string;
  line: string;
}): { reference?: Reference; error?: 'max_limit' | 'invalid_mobile' | 'storage_full' } {
  const store = readStore();
  const existing = store.references.filter((r) => r.workerId === params.workerId);
  if (existing.length >= 3) {
    return { error: 'max_limit' };
  }

  const cleanMobile = params.mobile.replace(/\D/g, '');
  if (cleanMobile.length !== 10) {
    return { error: 'invalid_mobile' };
  }

  const reference: Reference = {
    id: `ref-${Date.now()}`,
    workerId: params.workerId,
    name: params.name.trim(),
    relation: params.relation,
    mobile: cleanMobile,
    line: params.line.trim().slice(0, 120),
    status: 'unconfirmed',
    isSample: false,
    createdAt: getTodayIso(),
  };

  store.references.unshift(reference);
  if (!writeStore(store)) {
    return { error: 'storage_full' };
  }
  return { reference };
}

export function updateReference(
  id: string,
  patch: Partial<Pick<Reference, 'name' | 'relation' | 'mobile' | 'line' | 'status'>>
): Reference | undefined {
  const store = readStore();
  const ref = store.references.find((r) => r.id === id);
  if (!ref) return undefined;

  if (patch.name !== undefined) ref.name = patch.name.trim();
  if (patch.relation !== undefined) ref.relation = patch.relation;
  if (patch.mobile !== undefined) {
    const clean = patch.mobile.replace(/\D/g, '');
    if (clean.length === 10) ref.mobile = clean;
  }
  if (patch.line !== undefined) ref.line = patch.line.trim().slice(0, 120);
  if (patch.status !== undefined) ref.status = patch.status;

  writeStore(store);
  return ref;
}

export function deleteReference(id: string): void {
  const store = readStore();
  store.references = store.references.filter((r) => r.id !== id);
  writeStore(store);
}

/**
 * WORK JOURNEY (JourneyEntry) CRUD functions
 */
export function listJourneyEntries(workerId: string): JourneyEntry[] {
  const store = readStore();
  return store.journeyEntries
    .filter((j) => j.workerId === workerId)
    .sort((a, b) => (b.fromYear || 0) - (a.fromYear || 0));
}

export function addJourneyEntry(params: {
  workerId: string;
  city: string;
  trade: TradeId;
  fromYear: number;
  toYear: number | null;
  note: string;
}): JourneyEntry {
  const store = readStore();
  const entry: JourneyEntry = {
    id: `jrn-${Date.now()}`,
    workerId: params.workerId,
    city: params.city.trim(),
    trade: params.trade,
    fromYear: params.fromYear,
    toYear: params.toYear,
    note: params.note.trim().slice(0, 160),
    isSample: false,
  };
  store.journeyEntries.unshift(entry);
  writeStore(store);
  return entry;
}

export function updateJourneyEntry(
  id: string,
  patch: Partial<Pick<JourneyEntry, 'city' | 'trade' | 'fromYear' | 'toYear' | 'note'>>
): JourneyEntry | undefined {
  const store = readStore();
  const entry = store.journeyEntries.find((j) => j.id === id);
  if (!entry) return undefined;

  if (patch.city !== undefined) entry.city = patch.city.trim();
  if (patch.trade !== undefined) entry.trade = patch.trade;
  if (patch.fromYear !== undefined) entry.fromYear = patch.fromYear;
  if (patch.toYear !== undefined) entry.toYear = patch.toYear;
  if (patch.note !== undefined) entry.note = patch.note.trim().slice(0, 160);

  writeStore(store);
  return entry;
}

export function deleteJourneyEntry(id: string): void {
  const store = readStore();
  store.journeyEntries = store.journeyEntries.filter((j) => j.id !== id);
  writeStore(store);
}

/**
 * Returns the total Repeat Hires ("Wapas Bulaya") for a worker:
 * combines customer reviews with hireAgain === true plus repeat bookings by the same customer.
 */
export function getRepeatTotal(workerId: string): number {
  const store = readStore();
  const reviewHires = store.reviews.filter(
    (r) => r.workerId === workerId && r.hireAgain
  ).length;

  // Count customers who have booked this worker more than once
  const customerCounts: Record<string, number> = {};
  store.bookings.forEach((b) => {
    if (
      b.workerId === workerId &&
      (b.status === 'confirmed' ||
        b.status === 'waiting_customer_confirmation' ||
        b.status === 'completed')
    ) {
      customerCounts[b.customerId] = (customerCounts[b.customerId] || 0) + 1;
    }
  });
  const repeatBookings = Object.values(customerCounts).reduce(
    (acc, cnt) => acc + (cnt > 1 ? cnt - 1 : 0),
    0
  );

  return Math.max(reviewHires + repeatBookings, reviewHires);
}

/**
 * Computes total years of work experience & proof stats for the Worker's Shramik Certificate & Badge.
 */
export function getWorkerProofStats(workerId: string): {
  totalYears: number;
  earliestYear: number;
  confirmedJobsCount: number;
  repeatTotal: number;
  gawahiCount: number;
  confirmedGawahiCount: number;
} {
  const currentYear = new Date().getFullYear();
  const journeys = listJourneyEntries(workerId);
  let earliestYear = currentYear - 5;

  if (journeys.length > 0) {
    const minFrom = Math.min(...journeys.map((j) => j.fromYear || currentYear));
    earliestYear = Math.min(currentYear, Math.max(1980, minFrom));
  }

  const totalYears = Math.max(1, currentYear - earliestYear);
  const store = readStore();
  const confirmedJobsCount =
    store.bookings.filter(
      (b) =>
        b.workerId === workerId &&
        (b.workRecordStatus === 'customer_confirmed' || b.status === 'completed')
    ).length +
    store.reviews.filter((r) => r.workerId === workerId).length;

  const refs = listReferences(workerId);
  const confirmedGawahiCount = refs.filter((r) => r.status === 'confirmed_demo').length;

  return {
    totalYears,
    earliestYear,
    confirmedJobsCount,
    repeatTotal: getRepeatTotal(workerId),
    gawahiCount: refs.length,
    confirmedGawahiCount,
  };
}
