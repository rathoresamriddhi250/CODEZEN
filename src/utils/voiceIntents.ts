import {
  Language,
  TimeSlotId,
  TradeId,
  TranslationKey,
  getSlotLabel,
  getTradeLabel,
  t,
} from '../i18n';
import { getNext11Days, getTodayIso } from '../data/store';

export interface FaqTopicDef {
  id: string;
  qKey: TranslationKey;
  aKey: TranslationKey;
  shortSpokenKey: TranslationKey;
  keywords: string[];
}

/**
 * Shared Sahayak FAQ topics reused by both ShramikChatbot and Awaaz Sahayak
 * so FAQ answers are never duplicated.
 */
export const SAHAYAK_FAQ_TOPICS: FaqTopicDef[] = [
  {
    id: 'what',
    qKey: 'faq_q_what',
    aKey: 'faq_a_what',
    shortSpokenKey: 'faq_short_what',
    keywords: [
      'what is shramik',
      'shramik kya hai',
      'about shramik',
      'kya hai',
      'श्रमिक क्या है',
      'श्रमिक के बारे में',
      'ऐप क्या है',
    ],
  },
  {
    id: 'safety',
    qKey: 'faq_q_safety',
    aKey: 'faq_a_safety',
    shortSpokenKey: 'faq_short_safety',
    keywords: [
      'women safety',
      'women',
      'mahila suraksha',
      'safety kaise',
      'unsafe',
      'महिला सुरक्षा',
      'सुरक्षा कैसे',
      'सेफ्टी',
    ],
  },
  {
    id: 'record',
    qKey: 'faq_q_record',
    aKey: 'faq_a_record',
    shortSpokenKey: 'faq_short_record',
    keywords: [
      'work record kaise',
      'how a worker builds',
      'after photo',
      'kaam ka praman',
      'रिकॉर्ड कैसे',
      'फोटो कैसे',
      'प्रमाण कैसे',
    ],
  },
  {
    id: 'book',
    qKey: 'faq_q_book',
    aKey: 'faq_a_book',
    shortSpokenKey: 'faq_short_book',
    keywords: [
      'how to book',
      'slot kaise book',
      '10 day',
      'स्लॉट कैसे बुक',
      'बुकिंग कैसे होती है',
    ],
  },
  {
    id: 'nearby',
    qKey: 'faq_q_nearby',
    aKey: 'faq_a_nearby',
    shortSpokenKey: 'faq_short_nearby',
    keywords: [
      '6 km',
      '5 km',
      'nearby search',
      'distance kaise',
      'किमी',
      'दूरी कैसे',
    ],
  },
  {
    id: 'status',
    qKey: 'faq_q_status',
    aKey: 'faq_a_status',
    shortSpokenKey: 'faq_short_status',
    keywords: [
      'self-reported',
      'self reported',
      'customer confirmed',
      'स्वयं सूचित',
      'ग्राहक द्वारा पुष्ट',
    ],
  },
  {
    id: 'reviews',
    qKey: 'faq_q_reviews',
    aKey: 'faq_a_reviews',
    shortSpokenKey: 'faq_short_reviews',
    keywords: [
      'how reviews',
      'rating kaise',
      'wapas bulaya kya',
      'रिव्यू कैसे',
      'वापस बुलाया क्या',
    ],
  },
  {
    id: 'handle',
    qKey: 'faq_q_handle',
    aKey: 'faq_a_handle',
    shortSpokenKey: 'faq_short_handle',
    keywords: [
      'handle kya',
      'shramik id kya',
      '@handle',
      'हैंडल क्या',
      'श्रमिक आईडी क्या',
    ],
  },
  {
    id: 'demo',
    qKey: 'faq_q_demo',
    aKey: 'faq_a_demo',
    shortSpokenKey: 'faq_short_demo',
    keywords: [
      'demo mode',
      'test mode',
      'sample data',
      'डेमो क्या',
      'टेस्ट मोड',
    ],
  },
  {
    id: 'lang',
    qKey: 'faq_q_lang',
    aKey: 'faq_a_lang',
    shortSpokenKey: 'faq_short_lang',
    keywords: [
      'how to change language',
      'bhasha kaise badle',
      'भाषा कैसे बदलें',
    ],
  },
  {
    id: 'contact',
    qKey: 'faq_q_contact',
    aKey: 'faq_a_contact',
    shortSpokenKey: 'faq_short_contact',
    keywords: [
      'contact',
      'feedback',
      'support',
      'संपर्क',
      'सुझाव',
    ],
  },
];

export type VoiceIntentKind =
  | 'nav_profile'
  | 'nav_bookings'
  | 'nav_my_work'
  | 'nav_reviews'
  | 'nav_home'
  | 'nav_history'
  | 'search_workers'
  | 'search_jobs'
  | 'booking_help'
  | 'worker_add_record'
  | 'worker_mark_complete'
  | 'switch_language'
  | 'faq_help'
  | 'read_aloud'
  | 'destructive_guard'
  | 'unknown';

export interface ParsedVoiceIntent {
  id: string;
  kind: VoiceIntentKind;
  confidence: 'high' | 'medium' | 'low';
  /** Label shown on choice button if multiple intents match or confidence is low */
  choiceLabelEn: string;
  choiceLabelHi: string;
  /** Short spoken reply (< 20 words) */
  spokenReplyEn: string;
  spokenReplyHi: string;
  /** Detailed text shown in chat bubble (e.g. full FAQ answer) */
  displayTextEn?: string;
  displayTextHi?: string;
  /** True for search and booking intents that must show the Yes / Edit confirmation card */
  requiresConfirmation?: boolean;
  confirmPromptEn?: string;
  confirmPromptHi?: string;
  /** Extracted parameters */
  trade?: TradeId | 'all';
  maxPrice?: number;
  searchQuery?: string;
  bookingDate?: string;
  bookingSlot?: TimeSlotId;
  targetWorkerId?: string;
  targetLang?: Language;
  faqTopicId?: string;
}

export interface VoiceParseResult {
  rawInput: string;
  primary: ParsedVoiceIntent;
  /** Populated with top 3 choices when confidence is low or 2+ intents match */
  ambiguousChoices?: ParsedVoiceIntent[];
}

const TRADE_KEYWORDS: { trade: TradeId; words: string[] }[] = [
  {
    trade: 'painter',
    words: [
      'painter',
      'paint',
      'painting',
      'rangai',
      'putty',
      'पेंटर',
      'पेंट',
      'पुताई',
      'रंगाई',
    ],
  },
  {
    trade: 'electrician',
    words: [
      'electrician',
      'electric',
      'bijli',
      'wiring',
      'fan',
      'switch',
      'इलेक्ट्रीशियन',
      'बिजली',
      'वायरिंग',
      'पंखा',
    ],
  },
  {
    trade: 'plumber',
    words: [
      'plumber',
      'plumbing',
      'nal',
      'pipe',
      'tanki',
      'leak',
      'प्लंबर',
      'प्लम्बर',
      'नल',
      'पाइप',
      'टंकी',
    ],
  },
  {
    trade: 'carpenter',
    words: [
      'carpenter',
      'badhai',
      'barhai',
      'wood',
      'furniture',
      'lakdi',
      'door',
      'बढ़ई',
      'कारपेंटर',
      'लकड़ी',
      'फर्नीचर',
      'दरवाजा',
    ],
  },
  {
    trade: 'tailor',
    words: ['tailor', 'darzi', 'darji', 'silai', 'stitch', 'दर्जी', 'टेलर', 'सिलाई'],
  },
  {
    trade: 'mason',
    words: [
      'mason',
      'rajmistri',
      'mistri',
      'brick',
      'plaster',
      'cement',
      'राजमिस्त्री',
      'मिस्त्री',
      'ईंट',
      'प्लास्टर',
    ],
  },
];

function extractTrade(q: string): TradeId | undefined {
  for (const item of TRADE_KEYWORDS) {
    if (item.words.some((w) => q.includes(w))) {
      return item.trade;
    }
  }
  return undefined;
}

/**
 * Extracts a price limit if the user says e.g. "plumber 500 se kam", "under 500", "500 tak", "₹600 से कम"
 */
function extractMaxPrice(q: string): number | undefined {
  // Match numbers between 100 and 5000 when accompanied by price/limit words or standalone after a trade
  const match = q.match(/\b(\d{2,4})\b/);
  if (!match) return undefined;
  const num = Number(match[1]);
  if (num >= 100 && num <= 5000) {
    // Make sure it's not a year like 2024/2025/2026 unless accompanied by kam/under/rupay/rs
    const hasPriceHint =
      q.includes('kam') ||
      q.includes('under') ||
      q.includes('below') ||
      q.includes('tak') ||
      q.includes('rs') ||
      q.includes('rupay') ||
      q.includes('रुपये') ||
      q.includes('कम') ||
      q.includes('तक') ||
      q.includes('सस्ता') ||
      q.includes('sasta') ||
      num < 1900;
    if (hasPriceHint) {
      return num;
    }
  }
  return undefined;
}

/**
 * Extracts date (today / tomorrow) and time slot (08-10, 10-12, 12-14, 14-16, 16-18, 18-20)
 * from phrases like "kal subah 10 baje slot book karo"
 */
function extractDateAndSlot(q: string): { dateIso: string; slotId: TimeSlotId } {
  const days = getNext11Days();
  const today = days[0] || getTodayIso();
  const tomorrow = days[1] || today;
  const dayAfter = days[2] || tomorrow;

  let dateIso = today;
  if (
    q.includes('parso') ||
    q.includes('परसों') ||
    q.includes('day after tomorrow')
  ) {
    dateIso = dayAfter;
  } else if (
    q.includes('kal') ||
    q.includes('कल') ||
    q.includes('tomorrow')
  ) {
    dateIso = tomorrow;
  }

  let slotId: TimeSlotId = '10-12';
  if (
    q.includes('8 baje') ||
    q.includes('8 am') ||
    q.includes('8 बजे') ||
    q.includes('आठ बजे') ||
    q.includes('08')
  ) {
    slotId = '08-10';
  } else if (
    q.includes('10 baje') ||
    q.includes('10 am') ||
    q.includes('10 बजे') ||
    q.includes('दस बजे')
  ) {
    slotId = '10-12';
  } else if (
    q.includes('12 baje') ||
    q.includes('12 pm') ||
    q.includes('12 बजे') ||
    q.includes('बारह बजे') ||
    q.includes('dopahar') ||
    q.includes('दोपहर')
  ) {
    slotId = '12-14';
  } else if (
    q.includes('2 baje') ||
    q.includes('2 pm') ||
    q.includes('14') ||
    q.includes('2 बजे') ||
    q.includes('दो बजे')
  ) {
    slotId = '14-16';
  } else if (
    q.includes('4 baje') ||
    q.includes('4 pm') ||
    q.includes('16') ||
    q.includes('4 बजे') ||
    q.includes('चार बजे') ||
    q.includes('shaam') ||
    q.includes('शाम')
  ) {
    slotId = '16-18';
  } else if (
    q.includes('6 baje') ||
    q.includes('6 pm') ||
    q.includes('18') ||
    q.includes('6 बजे') ||
    q.includes('छह बजे')
  ) {
    slotId = '18-20';
  } else if (q.includes('subah') || q.includes('सुबह') || q.includes('morning')) {
    slotId = '10-12';
  }

  return { dateIso, slotId };
}

/**
 * Strips any 10-digit mobile numbers, Shramik ID digits (SH-48213), Aadhaar/UAN numbers,
 * or full addresses so speechSynthesis NEVER reads out sensitive digits or addresses.
 */
export function sanitizeForSpeech(text: string): string {
  return text
    .replace(/\b\d{10}\b/g, '')
    .replace(/X{4,8}-?\d{2,4}/gi, '')
    .replace(/\bSH-\d+\b/gi, 'Shramik ID')
    .replace(/\bUAN-\d+\b/gi, '')
    .replace(/\bID-\d+\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Enforces the PART 4C rule: "Keep replies under 20 words."
 */
export function trimToMax20Words(text: string): string {
  const words = sanitizeForSpeech(text).split(/\s+/).filter(Boolean);
  if (words.length <= 19) return words.join(' ');
  return `${words.slice(0, 19).join(' ')}...`;
}

/**
 * Builds the 3 default fallback choices when confidence is low or two intents match.
 */
export function getDefaultTop3Choices(): ParsedVoiceIntent[] {
  const tomorrow = getNext11Days()[1] || getTodayIso();
  return [
    {
      id: 'choice-search-painter',
      kind: 'search_workers',
      confidence: 'high',
      trade: 'painter',
      choiceLabelEn: 'Find Painters near you ("painter chahiye")',
      choiceLabelHi: 'पास के पेंटर खोजें ("पेंटर चाहिए")',
      spokenReplyEn: t('awaazReply_search_workers', 'en'),
      spokenReplyHi: t('awaazReply_search_workers', 'hi'),
      requiresConfirmation: true,
      confirmPromptEn: 'Open painters near you?',
      confirmPromptHi: 'क्या आपके पास के पेंटर दिखाएँ?',
    },
    {
      id: 'choice-search-jobs',
      kind: 'search_jobs',
      confidence: 'high',
      choiceLabelEn: 'Find Nearby Jobs ("kaam dhundo")',
      choiceLabelHi: 'पास के काम ढूंढें ("काम ढूंढो")',
      spokenReplyEn: t('awaazReply_search_jobs', 'en'),
      spokenReplyHi: t('awaazReply_search_jobs', 'hi'),
      requiresConfirmation: true,
      confirmPromptEn: 'Open nearby jobs for you?',
      confirmPromptHi: 'क्या आपके पास के खुले काम दिखाएँ?',
    },
    {
      id: 'choice-book-slot',
      kind: 'booking_help',
      confidence: 'high',
      bookingDate: tomorrow,
      bookingSlot: '10-12',
      choiceLabelEn: 'Book Slot Tomorrow 10 AM ("kal subah 10 baje slot book karo")',
      choiceLabelHi: 'कल सुबह 10 बजे स्लॉट चुनें ("कल सुबह 10 बजे स्लॉट बुक करो")',
      spokenReplyEn: t('awaazReply_booking_prefilled', 'en'),
      spokenReplyHi: t('awaazReply_booking_prefilled', 'hi'),
      requiresConfirmation: true,
      confirmPromptEn: 'Prefill booking for tomorrow 10 AM – 12 PM?',
      confirmPromptHi: 'क्या कल सुबह 10 से 12 बजे का स्लॉट चुनें?',
    },
  ];
}

/**
 * Rule-based intent parser in Hindi, Hinglish, and English (no external API).
 */
export function parseVoiceIntent(rawText: string): VoiceParseResult {
  const cleanRaw = rawText.trim();
  const q = cleanRaw
    .toLowerCase()
    .replace(/[.,!?।"'`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const candidates: ParsedVoiceIntent[] = [];

  if (!q) {
    return {
      rawInput: cleanRaw,
      primary: {
        id: 'unknown',
        kind: 'unknown',
        confidence: 'low',
        choiceLabelEn: t('awaazNotUnderstood', 'en'),
        choiceLabelHi: t('awaazNotUnderstood', 'hi'),
        spokenReplyEn: t('awaazNotUnderstood', 'en'),
        spokenReplyHi: t('awaazNotUnderstood', 'hi'),
      },
      ambiguousChoices: getDefaultTop3Choices(),
    };
  }

  // 1. Destructive / Final action safety guard (delete, cancel, submit review, report)
  if (
    q.includes('delete') ||
    q.includes('hatao') ||
    q.includes('हटाओ') ||
    q.includes('cancel booking') ||
    q.includes('बुकिंग रद्द') ||
    q.includes('submit review') ||
    q.includes('report kar') ||
    q.includes('शिकायत दर्ज')
  ) {
    return {
      rawInput: cleanRaw,
      primary: {
        id: 'destructive-guard',
        kind: 'destructive_guard',
        confidence: 'high',
        choiceLabelEn: 'Safety Rule: Tap Confirm on Screen',
        choiceLabelHi: 'सुरक्षा नियम: स्क्रीन पर पुष्टि दबाएँ',
        spokenReplyEn: t('awaazDestructiveBlockedReply', 'en'),
        spokenReplyHi: t('awaazDestructiveBlockedReply', 'hi'),
      },
    };
  }

  // 2. Read Aloud: "ye padh ke sunao", "read this page", "page sunao"
  if (
    q.includes('padh ke sunao') ||
    q.includes('padh kar sunao') ||
    q.includes('ye padho') ||
    q.includes('page sunao') ||
    q.includes('read aloud') ||
    q.includes('read this') ||
    q.includes('listen to page') ||
    q.includes('पढ़ के सुनाओ') ||
    q.includes('पढ़ कर सुनाओ') ||
    q.includes('पेज सुनाओ') ||
    q.includes('ये पढ़ो')
  ) {
    candidates.push({
      id: 'read-aloud',
      kind: 'read_aloud',
      confidence: 'high',
      choiceLabelEn: 'Read current screen aloud ("ye padh ke sunao")',
      choiceLabelHi: 'वर्तमान स्क्रीन पढ़कर सुनाएँ ("ये पढ़ के सुनाओ")',
      spokenReplyEn: t('awaazReply_read_aloud', 'en'),
      spokenReplyHi: t('awaazReply_read_aloud', 'hi'),
    });
  }

  // 3. Language Settings: "Hindi me badlo", "switch to English"
  if (
    (q.includes('hindi') || q.includes('हिन्दी') || q.includes('हिंदी')) &&
    (q.includes('badlo') ||
      q.includes('switch') ||
      q.includes('change') ||
      q.includes('karo') ||
      q.includes('baat') ||
      q.includes('बदलो') ||
      q.includes('करो') ||
      q.includes('भाषा'))
  ) {
    candidates.push({
      id: 'lang-hi',
      kind: 'switch_language',
      confidence: 'high',
      targetLang: 'hi',
      choiceLabelEn: 'Switch language to Hindi ("Hindi me badlo")',
      choiceLabelHi: 'भाषा हिन्दी में बदलें ("हिन्दी में बदलो")',
      spokenReplyEn: t('awaazReply_lang_hi', 'en'),
      spokenReplyHi: t('awaazReply_lang_hi', 'hi'),
    });
  }

  if (
    (q.includes('english') ||
      q.includes('angrezi') ||
      q.includes('अंग्रेजी') ||
      q.includes('अंग्रेज़ी')) &&
    (q.includes('badlo') ||
      q.includes('switch') ||
      q.includes('change') ||
      q.includes('karo') ||
      q.includes('baat') ||
      q.includes('बदलो') ||
      q.includes('करो') ||
      q.includes('भाषा'))
  ) {
    candidates.push({
      id: 'lang-en',
      kind: 'switch_language',
      confidence: 'high',
      targetLang: 'en',
      choiceLabelEn: 'Switch language to English ("switch to English")',
      choiceLabelHi: 'भाषा अंग्रेज़ी में बदलें ("switch to English")',
      spokenReplyEn: t('awaazReply_lang_en', 'en'),
      spokenReplyHi: t('awaazReply_lang_en', 'hi'),
    });
  }

  // 4. Worker Actions: "naya kaam jodo" (Add Work Record) & "kaam poora hua" (Mark job complete)
  if (
    q.includes('naya kaam jodo') ||
    q.includes('add work record') ||
    q.includes('add work experience') ||
    q.includes('kaam ka safar jodo') ||
    q.includes('anubhav jodo') ||
    q.includes('नया काम जोड़ो') ||
    q.includes('काम का अनुभव जोड़ो') ||
    q.includes('कार्य अनुभव जोड़ो')
  ) {
    candidates.push({
      id: 'worker-add-record',
      kind: 'worker_add_record',
      confidence: 'high',
      choiceLabelEn: 'Open Add Work Record ("naya kaam jodo")',
      choiceLabelHi: 'नया कार्य अनुभव जोड़ें ("नया काम जोड़ो")',
      spokenReplyEn: t('awaazReply_worker_add_record', 'en'),
      spokenReplyHi: t('awaazReply_worker_add_record', 'hi'),
    });
  }

  if (
    q.includes('kaam poora hua') ||
    q.includes('kaam pura hua') ||
    q.includes('mark job complete') ||
    q.includes('job complete') ||
    q.includes('kaam khatam hua') ||
    q.includes('काम पूरा हुआ') ||
    q.includes('काम ख़त्म हुआ') ||
    q.includes('काम पूरा हो गया')
  ) {
    candidates.push({
      id: 'worker-mark-complete',
      kind: 'worker_mark_complete',
      confidence: 'high',
      choiceLabelEn: 'Open Mark Job Complete ("kaam poora hua")',
      choiceLabelHi: 'काम पूरा चिह्नित करें ("काम पूरा हुआ")',
      spokenReplyEn: t('awaazReply_worker_mark_complete', 'en'),
      spokenReplyHi: t('awaazReply_worker_mark_complete', 'hi'),
    });
  }

  // 5. Booking Help: "kal subah 10 baje slot book karo", "ramesh ko book karo"
  const hasBookingWords =
    q.includes('slot book') ||
    q.includes('book karo') ||
    q.includes('book slot') ||
    q.includes('baje') ||
    q.includes('बजे') ||
    q.includes('स्लॉट बुक') ||
    q.includes('बुक करो') ||
    q.includes('दुबारा बुलाओ') ||
    q.includes('dubara bulao') ||
    q.includes('book again');

  if (hasBookingWords && !q.includes('kaise')) {
    const { dateIso, slotId } = extractDateAndSlot(q);
    const slotLabelEn = getSlotLabel(slotId, 'en');
    const slotLabelHi = getSlotLabel(slotId, 'hi');
    const isSalim =
      q.includes('salim') || q.includes('सलीम') || q.includes('mahesh') || q.includes('महेश');
    const targetWorkerId = isSalim ? 'worker-sample-2' : 'worker-sample-1';

    candidates.push({
      id: 'booking-help',
      kind: 'booking_help',
      confidence: 'high',
      bookingDate: dateIso,
      bookingSlot: slotId,
      targetWorkerId,
      choiceLabelEn: `Open booking screen for ${dateIso} (${slotLabelEn})`,
      choiceLabelHi: `${dateIso} (${slotLabelHi}) के लिए बुकिंग स्क्रीन खोलें`,
      spokenReplyEn: t('awaazReply_booking_prefilled', 'en'),
      spokenReplyHi: t('awaazReply_booking_prefilled', 'hi'),
      requiresConfirmation: true,
      confirmPromptEn: `Open booking screen with ${dateIso} and slot ${slotLabelEn} preselected?`,
      confirmPromptHi: `क्या ${dateIso} और ${slotLabelHi} स्लॉट के साथ बुकिंग स्क्रीन खोलें?`,
    });
  }

  // 6. Search (Customer): "painter chahiye", "paas me electrician", "plumber 500 se kam"
  const matchedTrade = extractTrade(q);
  const maxPrice = extractMaxPrice(q);
  if (matchedTrade) {
    const tradeEn = getTradeLabel(matchedTrade, 'en');
    const tradeHi = getTradeLabel(matchedTrade, 'hi');
    const priceSuffixEn = maxPrice ? ` under ₹${maxPrice}` : '';
    const priceSuffixHi = maxPrice ? ` ₹${maxPrice} से कम में` : '';

    candidates.push({
      id: `search-worker-${matchedTrade}`,
      kind: 'search_workers',
      confidence: 'high',
      trade: matchedTrade,
      maxPrice,
      searchQuery: tradeEn,
      choiceLabelEn: `Find ${tradeEn} near you${priceSuffixEn}`,
      choiceLabelHi: `आस-पास ${tradeHi} खोजें${priceSuffixHi}`,
      spokenReplyEn: maxPrice
        ? `Showing nearby ${tradeEn} workers under ${maxPrice} rupees.`
        : `Showing nearby ${tradeEn} workers within 6 km.`,
      spokenReplyHi: maxPrice
        ? `${maxPrice} रुपये से कम के पास के ${tradeHi} दिखाए जा रहे हैं।`
        : `6 किलोमीटर के भीतर पास के ${tradeHi} दिखाए जा रहे हैं।`,
      requiresConfirmation: true,
      confirmPromptEn: `Open ${tradeEn.toLowerCase()}s near you${priceSuffixEn}?`,
      confirmPromptHi: `क्या आपके पास के ${tradeHi}${priceSuffixHi} दिखाएँ?`,
    });
  }

  // 7. Search (Worker): "kaam dhundo", "paas me jobs", "find jobs"
  if (
    q.includes('kaam dhundo') ||
    q.includes('kaam dhoondo') ||
    q.includes('paas me jobs') ||
    q.includes('paas mein jobs') ||
    q.includes('paas me kaam') ||
    q.includes('find jobs') ||
    q.includes('open jobs') ||
    q.includes('काम ढूंढो') ||
    q.includes('काम ढूँढो') ||
    q.includes('पास में काम') ||
    q.includes('आस पास काम')
  ) {
    candidates.push({
      id: 'search-jobs',
      kind: 'search_jobs',
      confidence: 'high',
      choiceLabelEn: 'Open Find Jobs ("kaam dhundo")',
      choiceLabelHi: 'पास के काम खोलें ("काम ढूंढो")',
      spokenReplyEn: t('awaazReply_search_jobs', 'en'),
      spokenReplyHi: t('awaazReply_search_jobs', 'hi'),
      requiresConfirmation: true,
      confirmPromptEn: 'Open nearby jobs for you?',
      confirmPromptHi: 'क्या आपके पास के खुले काम दिखाएँ?',
    });
  }

  // 8. Navigation Intents: "profile kholo", "meri bookings", "my work", "reviews dikhao", "home", "history"
  if (
    q.includes('reviews dikhao') ||
    q.includes('review dikhao') ||
    q.includes('show reviews') ||
    q.includes('my reviews') ||
    q.includes('रिव्यू दिखाओ') ||
    q.includes('रेटिंग दिखाओ')
  ) {
    candidates.push({
      id: 'nav-reviews',
      kind: 'nav_reviews',
      confidence: 'high',
      choiceLabelEn: 'Show Reviews ("reviews dikhao")',
      choiceLabelHi: 'रिव्यू दिखाएँ ("रिव्यू दिखाओ")',
      spokenReplyEn: t('awaazReply_nav_reviews', 'en'),
      spokenReplyHi: t('awaazReply_nav_reviews', 'hi'),
    });
  }

  if (
    q.includes('profile kholo') ||
    q.includes('meri profile') ||
    q.includes('open profile') ||
    q.includes('my profile') ||
    q.includes('certificate dikhao') ||
    q.includes('प्रोफ़ाइल खोलो') ||
    q.includes('प्रोफाइल खोलो') ||
    q.includes('मेरी प्रोफ़ाइल') ||
    q.includes('प्रमाण पत्र')
  ) {
    candidates.push({
      id: 'nav-profile',
      kind: 'nav_profile',
      confidence: 'high',
      choiceLabelEn: 'Open Profile ("profile kholo")',
      choiceLabelHi: 'प्रोफ़ाइल खोलें ("प्रोफ़ाइल खोलो")',
      spokenReplyEn: t('awaazReply_nav_profile', 'en'),
      spokenReplyHi: t('awaazReply_nav_profile', 'hi'),
    });
  }

  if (
    q.includes('meri booking') ||
    q.includes('my booking') ||
    q.includes('open booking') ||
    q.includes('bookings kholo') ||
    q.includes('मेरी बुकिंग') ||
    q.includes('बुकिंग खोलो') ||
    q === 'bookings' ||
    q === 'बुकिंग'
  ) {
    candidates.push({
      id: 'nav-bookings',
      kind: 'nav_bookings',
      confidence: 'high',
      choiceLabelEn: 'Open My Bookings ("meri bookings")',
      choiceLabelHi: 'मेरी बुकिंग खोलें ("मेरी बुकिंग")',
      spokenReplyEn: t('awaazReply_nav_bookings', 'en'),
      spokenReplyHi: t('awaazReply_nav_bookings', 'hi'),
    });
  }

  if (
    q.includes('my work') ||
    q.includes('mera kaam') ||
    q.includes('my slots') ||
    q.includes('mere slot') ||
    q.includes('मेरा काम') ||
    q.includes('मेरे स्लॉट')
  ) {
    candidates.push({
      id: 'nav-my-work',
      kind: 'nav_my_work',
      confidence: 'high',
      choiceLabelEn: 'Open My Work & Slots ("my work")',
      choiceLabelHi: 'मेरा काम और स्लॉट खोलें ("मेरा काम")',
      spokenReplyEn: t('awaazReply_nav_my_work', 'en'),
      spokenReplyHi: t('awaazReply_nav_my_work', 'hi'),
    });
  }

  if (
    q.includes('itihas') ||
    q.includes('history') ||
    q.includes('purana kaam') ||
    q.includes('इतिहास') ||
    q.includes('पुराना काम')
  ) {
    candidates.push({
      id: 'nav-history',
      kind: 'nav_history',
      confidence: 'high',
      choiceLabelEn: 'Open Work History ("itihas kholo")',
      choiceLabelHi: 'काम का इतिहास खोलें ("इतिहास खोलो")',
      spokenReplyEn: t('awaazReply_nav_history', 'en'),
      spokenReplyHi: t('awaazReply_nav_history', 'hi'),
    });
  }

  if (
    q === 'home' ||
    q.includes('home kholo') ||
    q.includes('go home') ||
    q.includes('mukhya page') ||
    q.includes('होम') ||
    q.includes('मुख्य पेज')
  ) {
    candidates.push({
      id: 'nav-home',
      kind: 'nav_home',
      confidence: 'high',
      choiceLabelEn: 'Go to Home screen ("home")',
      choiceLabelHi: 'होम स्क्रीन पर जाएँ ("होम")',
      spokenReplyEn: t('awaazReply_nav_home', 'en'),
      spokenReplyHi: t('awaazReply_nav_home', 'hi'),
    });
  }

  // 9. Sahayak FAQ Topics (reusing SAHAYAK_FAQ_TOPICS)
  for (const topic of SAHAYAK_FAQ_TOPICS) {
    if (topic.keywords.some((kw) => q.includes(kw))) {
      candidates.push({
        id: `faq-${topic.id}`,
        kind: 'faq_help',
        confidence: 'high',
        faqTopicId: topic.id,
        choiceLabelEn: t(topic.qKey, 'en'),
        choiceLabelHi: t(topic.qKey, 'hi'),
        spokenReplyEn: t(topic.shortSpokenKey, 'en'),
        spokenReplyHi: t(topic.shortSpokenKey, 'hi'),
        displayTextEn: t(topic.aKey, 'en'),
        displayTextHi: t(topic.aKey, 'hi'),
      });
    }
  }

  // Check if 2 or more distinct intents matched -> show top 3 choices as big buttons!
  if (candidates.length > 1) {
    const top3 = [...candidates];
    for (const def of getDefaultTop3Choices()) {
      if (top3.length >= 3) break;
      if (!top3.some((c) => c.id === def.id)) {
        top3.push(def);
      }
    }
    return {
      rawInput: cleanRaw,
      primary: {
        ...candidates[0],
        confidence: 'low',
      },
      ambiguousChoices: top3.slice(0, 3),
    };
  }

  if (candidates.length === 1) {
    return {
      rawInput: cleanRaw,
      primary: candidates[0],
    };
  }

  // Partial / low-confidence word check (e.g. user just said "kaam" or "book" or "safety")
  if (q === 'kaam' || q === 'काम' || q === 'job' || q === 'book' || q === 'बुक') {
    return {
      rawInput: cleanRaw,
      primary: {
        id: 'low-confidence',
        kind: 'unknown',
        confidence: 'low',
        choiceLabelEn: t('awaazAmbiguousPrompt', 'en'),
        choiceLabelHi: t('awaazAmbiguousPrompt', 'hi'),
        spokenReplyEn: t('awaazAmbiguousPrompt', 'en'),
        spokenReplyHi: t('awaazAmbiguousPrompt', 'hi'),
      },
      ambiguousChoices: getDefaultTop3Choices(),
    };
  }

  // Not understood fallback -> return unknown with top 3 example choices
  return {
    rawInput: cleanRaw,
    primary: {
      id: 'unknown',
      kind: 'unknown',
      confidence: 'low',
      choiceLabelEn: t('awaazNotUnderstood', 'en'),
      choiceLabelHi: t('awaazNotUnderstood', 'hi'),
      spokenReplyEn: t('awaazNotUnderstood', 'en'),
      spokenReplyHi: t('awaazNotUnderstood', 'hi'),
    },
    ambiguousChoices: getDefaultTop3Choices(),
  };
}
