import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  MapPin,
  ArrowLeft,
  Calendar,
  Clock,
  Check,
  BadgeCheck,
  Star,
  Navigation,
  LogIn,
  RotateCcw,
  Award,
  History,
  Mic,
  Volume2,
  CheckCircle2,
} from 'lucide-react';
import {
  AppUserState,
  SAMPLE_LOCALITIES,
  WorkerProfile,
  calculateDistanceKm,
  createBooking,
  getCustomerWorkHistory,
  getNext11Days,
  getRatingSummary,
  getRepeatTotal,
  getWorkerProofStats,
  getWorkerSlotBookingState,
  isSlotInPast,
  isWorkerAvailableOnDate,
  isWorkerAvailableToday,
  updateProfile,
} from '../data/store';
import {
  Language,
  TIME_SLOTS,
  TRADES,
  TimeSlotId,
  TradeId,
  getGovtIdLabel,
  getRateUnitLabel,
  getSlotLabel,
  getTradeLabel,
  t,
} from '../i18n';
import { TradeIcon, formatReadableDate } from '../components/TradeIcon';
import { WorkerReviewsSection } from '../components/WorkerReviewsSection';
import { UstadGawahiSection } from '../components/UstadGawahiSection';
import { WorkerCertificateCard } from '../components/WorkerCertificateCard';
import {
  speakClearVoice,
  stopAllVoice,
  listenToUserVoice,
  stopListeningVoice,
  cleanSpokenSearchText,
} from '../utils/voice';
import { triggerAwaazSahayak } from '../components/VoiceCommandAssistant';
import { parseVoiceIntent } from '../utils/voiceIntents';

interface CustomerFindWorkersScreenProps {
  user: AppUserState;
  lang: Language;
  workers: WorkerProfile[];
  initialTradeFilter?: TradeId | 'all';
  initialMaxPrice?: number | null;
  initialSelectedWorkerId?: string | null;
  initialBookingDate?: string | null;
  initialBookingSlot?: TimeSlotId | null;
  initialSubView?: 'search' | 'history';
  voiceTriggerCounter?: number;
  onRefresh: () => void;
  onGoToProfile: () => void;
  onGoToBookings: () => void;
  onRequireLoginForBooking?: (returnToWorkerId: string) => void;
}

export const CustomerFindWorkersScreen: React.FC<CustomerFindWorkersScreenProps> = ({
  user,
  lang,
  workers,
  initialTradeFilter = 'all',
  initialMaxPrice = null,
  initialSelectedWorkerId = null,
  initialBookingDate = null,
  initialBookingSlot = null,
  initialSubView = 'search',
  voiceTriggerCounter = 0,
  onRefresh,
  onGoToProfile,
  onGoToBookings,
  onRequireLoginForBooking,
}) => {
  const next11Days = useMemo(() => getNext11Days(), []);
  const todayIso = next11Days[0];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<TradeId | 'all'>(
    initialTradeFilter
  );
  const [maxPriceFilter, setMaxPriceFilter] = useState<number | null>(
    initialMaxPrice
  );
  const [maxDistanceKm, setMaxDistanceKm] = useState<1 | 3 | 6>(6);
  const [priceSort, setPriceSort] = useState<'distance' | 'low' | 'high'>('distance');
  const [availabilityDateFilter, setAvailabilityDateFilter] = useState<string>('all');
  const [locatingGps, setLocatingGps] = useState(false);

  // Customer Sub-View: 'search' vs 'history' (Work History where Book Again lives exclusively)
  const [customerViewMode, setCustomerViewMode] = useState<'search' | 'history'>('search');

  // Voice Assistance State (Dual-Engine Voice Recognition + SpeechSynthesis)
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isProcessingVoiceSearch, setIsProcessingVoiceSearch] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(0);
  const [isSpeakingGuide, setIsSpeakingGuide] = useState(false);
  const [speakingCardId, setSpeakingCardId] = useState<string | null>(null);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);

  const historyBookings = useMemo(() => getCustomerWorkHistory(), [workers, user]);

  const speakTextAloud = (text: string, cardId?: string) => {
    if (cardId && speakingCardId === cardId) {
      stopAllVoice();
      setSpeakingCardId(null);
      setIsSpeakingGuide(false);
      return;
    }
    if (!cardId && isSpeakingGuide) {
      stopAllVoice();
      setIsSpeakingGuide(false);
      setSpeakingCardId(null);
      return;
    }
    if (cardId) {
      setSpeakingCardId(cardId);
      setIsSpeakingGuide(false);
    } else {
      setIsSpeakingGuide(true);
      setSpeakingCardId(null);
    }
    speakClearVoice(text, {
      lang,
      onStart: () => {
        if (cardId) {
          setSpeakingCardId(cardId);
          setIsSpeakingGuide(false);
        } else {
          setIsSpeakingGuide(true);
          setSpeakingCardId(null);
        }
      },
      onEnd: () => {
        setIsSpeakingGuide(false);
        setSpeakingCardId(null);
      },
    });
  };

  const handleStartVoiceAssistant = () => {
    if (isVoiceListening) {
      stopListeningVoice();
      return;
    }

    setCustomerViewMode('search');

    listenToUserVoice({
      lang,
      onStart: () => {
        setIsVoiceListening(true);
        setIsProcessingVoiceSearch(false);
        setVoiceVolume(50);
        setVoiceFeedback(t('voiceListeningPrompt', lang));
      },
      onInterim: (liveText) => {
        const cleanedLive = cleanSpokenSearchText(liveText);
        if (cleanedLive) {
          setSelectedTrade('all');
          setSearchQuery(cleanedLive);
          setVoiceFeedback(`🎙️ "${cleanedLive}"...`);
        }
      },
      onResult: (transcript) => {
        setIsVoiceListening(false);
        setIsProcessingVoiceSearch(false);
        setVoiceVolume(0);

        const clean = cleanSpokenSearchText(transcript);
        if (!clean) return;
        const lower = clean.toLowerCase();

        // Check if spoken search includes a price filter like "plumber 500 se kam"
        const parsedIntent = parseVoiceIntent(clean);
        if (parsedIntent.primary.kind === 'search_workers') {
          setCustomerViewMode('search');
          setSelectedTrade(parsedIntent.primary.trade || 'all');
          setMaxPriceFilter(parsedIntent.primary.maxPrice ?? null);
          setSearchQuery('');
          const reply =
            lang === 'hi'
              ? parsedIntent.primary.spokenReplyHi
              : parsedIntent.primary.spokenReplyEn;
          setVoiceFeedback(`🎙️ "${clean}" → ${reply}`);
          speakTextAloud(reply);
          return;
        }

        if (
          lower === 'history' ||
          lower === 'इतिहास' ||
          lower.includes('इतिहास खोलो') ||
          lower.includes('open history') ||
          lower.includes('book again')
        ) {
          setCustomerViewMode('history');
          const msg =
            lang === 'hi'
              ? 'काम का इतिहास खोल दिया गया है। यहाँ से आप कारीगर को दुबारा बुला सकते हैं।'
              : 'Opened your Work History. You can tap Book Again on any completed job.';
          setVoiceFeedback(`🎙️ "${clean}" → ${msg}`);
          speakTextAloud(msg);
          return;
        }

        // Remove conversational command suffixes/prefixes so the core search query goes into the search bar
        const coreQuery = clean
          .replace(
            /\b(दिखाओ|खोजो|ढूंढो|ढूँढो|चाहिए|मुझे|बुलाओ|निकालो|बताओ|find|search|show|me|need|want|looking|for)\b/gi,
            ' '
          )
          .replace(/\s+/g, ' ')
          .trim();

        const finalSearchText = coreQuery || clean;

        // Always put what the user spoke directly into the Search Box!
        setCustomerViewMode('search');
        setSelectedTrade('all');
        setSearchQuery(finalSearchText);

        const tradeMap: { trade: TradeId; keywords: string[] }[] = [
          { trade: 'painter', keywords: ['painter', 'paint', 'पेंटर', 'पेंट', 'रंग'] },
          { trade: 'carpenter', keywords: ['carpenter', 'wood', 'बढ़ई', 'लकड़ी', 'फर्नीचर'] },
          { trade: 'tailor', keywords: ['tailor', 'stitch', 'दर्जी', 'सिलाई'] },
          {
            trade: 'electrician',
            keywords: ['electrician', 'electric', 'light', 'इलेक्ट्रीशियन', 'बिजली', 'पंखा'],
          },
          { trade: 'plumber', keywords: ['plumber', 'pipe', 'tap', 'प्लंबर', 'नल', 'पाइप'] },
          { trade: 'mason', keywords: ['mason', 'brick', 'राजमिस्त्री', 'मिस्त्री', 'सीमेंट'] },
        ];

        for (const item of tradeMap) {
          if (item.keywords.some((kw) => lower.includes(kw))) {
            const trLabel = getTradeLabel(item.trade, lang);
            const msg =
              lang === 'hi'
                ? `आपने कहा "${clean}" — ${trLabel} कारीगर खोजे गए हैं।`
                : `You said "${clean}" — showing matching ${trLabel} workers.`;
            setVoiceFeedback(`🎙️ "${finalSearchText}" → ${msg}`);
            speakTextAloud(msg);
            return;
          }
        }

        const msg =
          lang === 'hi'
            ? `आपने कहा "${finalSearchText}" — इसके लिए कारीगर नीचे दिखाए गए हैं।`
            : `You said "${finalSearchText}" — showing matching workers below.`;
        setVoiceFeedback(`🎙️ ${msg}`);
        speakTextAloud(msg);
      },
      onError: () => {
        setIsVoiceListening(false);
        setIsProcessingVoiceSearch(false);
        setVoiceVolume(0);
        setVoiceFeedback(
          lang === 'hi'
            ? 'आवाज़ साफ़ नहीं आई। कृपया माइक दबाकर फिर से बोलें (जैसे: "पेंटर", "रमेश", "प्लंबर")।'
            : 'Could not hear clearly. Please tap the Mic and speak again (e.g., "Painter", "Ramesh", "Plumber").'
        );
      },
      onEnd: () => {
        setIsVoiceListening(false);
        setVoiceVolume(0);
      },
    });
  };

  // Selected Worker for Detail + Book a Slot page
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(
    initialSelectedWorkerId
  );
  const [bookDate, setBookDate] = useState<string>(todayIso);
  const [bookSlot, setBookSlot] = useState<TimeSlotId | null>(null);
  const [bookNote, setBookNote] = useState('');
  const [bookError, setBookError] = useState<string | null>(null);
  const [needsSignInPrompt, setNeedsSignInPrompt] = useState(false);

  useEffect(() => {
    if (initialTradeFilter) {
      setSelectedTrade(initialTradeFilter);
    }
    setMaxPriceFilter(initialMaxPrice ?? null);
  }, [initialTradeFilter, initialMaxPrice, voiceTriggerCounter]);

  useEffect(() => {
    if (initialSubView) {
      setCustomerViewMode(initialSubView);
      if (initialSubView === 'history') {
        setSelectedWorkerId(null);
      }
    }
  }, [initialSubView, voiceTriggerCounter]);

  useEffect(() => {
    if (initialSelectedWorkerId) {
      const target = workers.find((w) => w.id === initialSelectedWorkerId);
      if (target) {
        if (initialBookingDate || initialBookingSlot) {
          setSelectedWorkerId(target.id);
          setBookDate(initialBookingDate || todayIso);
          setBookSlot(initialBookingSlot || '10-12');
          setBookNote('');
          setBookError(null);
          setNeedsSignInPrompt(false);
        } else {
          handleOpenWorkerDetail(target, true);
        }
      } else {
        setSelectedWorkerId(initialSelectedWorkerId);
      }
    } else if (voiceTriggerCounter > 0 && initialSubView === 'search') {
      setSelectedWorkerId(null);
    }
  }, [
    initialSelectedWorkerId,
    initialBookingDate,
    initialBookingSlot,
    voiceTriggerCounter,
  ]);

  const activeLocation = user.location || SAMPLE_LOCALITIES[0];

  const handleUseMyLocationQuick = () => {
    if (!navigator.geolocation) return;
    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingGps(false);
        updateProfile({
          name: user.customerName || user.workerName || 'Visitor',
          location: {
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
            areaNameEn: 'Current GPS Location',
            areaNameHi: 'वर्तमान जीपीएस स्थान',
          },
        });
        onRefresh();
      },
      () => {
        setLocatingGps(false);
      },
      { timeout: 6000 }
    );
  };

  const selectedWorker = useMemo(
    () => workers.find((w) => w.id === selectedWorkerId) || null,
    [workers, selectedWorkerId]
  );

  const filteredWorkers = useMemo(() => {
    const uLat = activeLocation.lat;
    const uLng = activeLocation.lng;
    const rawClean = cleanSpokenSearchText(searchQuery).toLowerCase();
    // Strip conversational filler words so spoken phrases like "पेंटर दिखाओ" or "रमेश पेंटर" match accurately
    const searchTokens = rawClean
      .split(/\s+/)
      .filter(
        (tok) =>
          tok.length > 0 &&
          ![
            'दिखाओ',
            'खोजो',
            'ढूंढो',
            'ढूँढो',
            'चाहिए',
            'मुझे',
            'बुलाओ',
            'का',
            'की',
            'के',
            'को',
            'वाला',
            'वाले',
            'कारीगर',
            'श्रमिक',
            'find',
            'search',
            'show',
            'me',
            'need',
            'want',
            'worker',
            'workers',
            'for',
          ].includes(tok)
      );

    const tradeSynonyms: Record<TradeId, string[]> = {
      painter: ['painter', 'paint', 'painting', 'पेंटर', 'पेंट', 'रंग', 'पुताई'],
      carpenter: ['carpenter', 'wood', 'furniture', 'बढ़ई', 'लकड़ी', 'फर्नीचर'],
      tailor: ['tailor', 'stitch', 'sewing', 'दर्जी', 'सिलाई', 'कपड़े'],
      electrician: [
        'electrician',
        'electric',
        'light',
        'fan',
        'wiring',
        'इलेक्ट्रीशियन',
        'बिजली',
        'पंखा',
        'लाइट',
      ],
      plumber: ['plumber', 'pipe', 'tap', 'water', 'प्लंबर', 'नल', 'पाइप', 'पानी'],
      mason: ['mason', 'brick', 'cement', 'राजमिस्त्री', 'मिस्त्री', 'सीमेंट', 'ईंट', 'चुनई'],
      other: ['other', 'अन्य'],
    };

    const list = workers
      .map((worker) => ({
        worker,
        distanceKm: calculateDistanceKm(uLat, uLng, worker.lat, worker.lng),
        availToday: isWorkerAvailableToday(worker),
        availSelectedDate:
          availabilityDateFilter === 'all'
            ? true
            : isWorkerAvailableOnDate(worker, availabilityDateFilter),
      }))
      .filter((item) => {
        if (item.distanceKm > maxDistanceKm) return false;
        if (selectedTrade !== 'all' && item.worker.trade !== selectedTrade) return false;
        if (maxPriceFilter !== null && item.worker.rateAmount > maxPriceFilter) return false;
        if (availabilityDateFilter !== 'all' && !item.availSelectedDate) return false;
        if (searchTokens.length > 0) {
          const nameEn = item.worker.nameEn.toLowerCase();
          const nameHi = item.worker.nameHi.toLowerCase();
          const areaEn = item.worker.areaNameEn.toLowerCase();
          const areaHi = item.worker.areaNameHi.toLowerCase();
          const handle = (item.worker.handle || '').toLowerCase();
          const shramikId = (item.worker.shramikId || '').toLowerCase();
          const trEn = getTradeLabel(
            item.worker.trade,
            'en',
            item.worker.customTradeName
          ).toLowerCase();
          const trHi = getTradeLabel(
            item.worker.trade,
            'hi',
            item.worker.customTradeName
          ).toLowerCase();
          const syns = tradeSynonyms[item.worker.trade] || [];

          const searchableBlob = `${nameEn} ${nameHi} ${areaEn} ${areaHi} ${handle} ${shramikId} ${trEn} ${trHi} ${syns.join(' ')}`;

          const matchesAllTokens = searchTokens.every((token) =>
            searchableBlob.includes(token)
          );
          if (!matchesAllTokens) {
            return false;
          }
        }
        return true;
      });

    if (priceSort === 'low') {
      list.sort((a, b) => a.worker.rateAmount - b.worker.rateAmount);
    } else if (priceSort === 'high') {
      list.sort((a, b) => b.worker.rateAmount - a.worker.rateAmount);
    } else {
      list.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return list;
  }, [
    workers,
    activeLocation,
    maxDistanceKm,
    selectedTrade,
    maxPriceFilter,
    availabilityDateFilter,
    searchQuery,
    priceSort,
  ]);

  const handleOpenWorkerDetail = (worker: WorkerProfile, preselectFirstSlot = false) => {
    setSelectedWorkerId(worker.id);
    const initialDate =
      availabilityDateFilter !== 'all' ? availabilityDateFilter : todayIso;
    setBookDate(initialDate);

    if (preselectFirstSlot) {
      // Find the first free slot on initialDate or tomorrow for 1-tap "Book Again (Wapas Bulayein)"
      const candidateDays = [initialDate, ...next11Days.filter((d) => d !== initialDate)];
      let foundDate = initialDate;
      let foundSlot: TimeSlotId | null = null;
      for (const dIso of candidateDays) {
        if (worker.unavailableDays[dIso]) continue;
        const openSlots = worker.availability[dIso] || ['10-12', '14-16', '16-18', '18-20'];
        for (const sId of openSlots) {
          if (
            !isSlotInPast(dIso, sId) &&
            getWorkerSlotBookingState(worker.id, dIso, sId) === 'free'
          ) {
            foundDate = dIso;
            foundSlot = sId;
            break;
          }
        }
        if (foundSlot) break;
      }
      setBookDate(foundDate);
      setBookSlot(foundSlot);
      setBookNote(lang === 'hi' ? 'दुबारा बुलाया (वापस बुलाया)' : 'Repeat booking (Wapas Bulaya)');
    } else {
      setBookSlot(null);
      setBookNote('');
    }
    setBookError(null);
    setNeedsSignInPrompt(false);
  };

  const handleRequestBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) return;

    // PART 4B Rule: If the visitor has no login and tries to book, ask them to sign in / quick setup first, then return them to the same search result.
    if (!user.onboardingComplete) {
      setNeedsSignInPrompt(true);
      return;
    }

    if (!bookSlot) {
      setBookError(t('errSelectSlot', lang));
      return;
    }

    const custName = user.customerName.trim() || user.workerName.trim() || 'Customer';
    const res = createBooking({
      workerId: selectedWorker.id,
      customerId: user.customerId,
      customerNameEn: custName,
      customerNameHi: custName,
      trade: selectedWorker.trade,
      customTradeName: selectedWorker.customTradeName,
      date: bookDate,
      slot: bookSlot,
      startedBy: 'customer',
      note: bookNote,
    });

    if (res.error === 'slot_taken') {
      setBookError(t('slotAlreadyTakenError', lang));
      return;
    }

    setSelectedWorkerId(null);
    onRefresh();
    onGoToBookings();
  };

  // Worker Detail, Reviews & Book a Slot Screen
  if (selectedWorker) {
    const distKm = calculateDistanceKm(
      activeLocation.lat,
      activeLocation.lng,
      selectedWorker.lat,
      selectedWorker.lng
    );
    const workerDaySlots = selectedWorker.availability[bookDate] || [
      '10-12',
      '14-16',
      '16-18',
      '18-20',
    ];
    const isWorkerDayOff = Boolean(selectedWorker.unavailableDays[bookDate]);
    const summary = getRatingSummary(selectedWorker.id, true);

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-[#17213A] rounded-[20px] p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-6">
          {/* Back button */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedWorkerId(null)}
              className="min-h-[48px] px-3 rounded-[14px] flex items-center gap-2 text-sm font-bold text-[#16213A] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
              <span>{t('backBtn', lang)}</span>
            </button>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {t('workerDetailTitle', lang)}
            </span>
          </div>

          {/* Worker Summary Header + Unique @handle & Shramik ID */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-[18px] bg-[#FEB21D]/20 text-[#EA580C] dark:text-[#FEB21D] flex items-center justify-center shrink-0">
                <TradeIcon trade={selectedWorker.trade} className="w-7 h-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-mono font-extrabold text-[#16213A] dark:text-[#FEB21D] bg-slate-100 dark:bg-[#0E1527] px-2 py-0.5 rounded-md">
                    {selectedWorker.handle}
                  </span>
                  <span className="font-mono font-extrabold text-[#EA580C] dark:text-[#FEB21D] bg-amber-50 dark:bg-[#0E1527] px-2 py-0.5 rounded-md">
                    {selectedWorker.shramikId}
                  </span>
                  <span className="font-bold text-[#EA580C] dark:text-[#FEB21D]">
                    {getTradeLabel(
                      selectedWorker.trade,
                      lang,
                      selectedWorker.customTradeName
                    )}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">
                    {distKm.toFixed(1)} {t('kmAway', lang)}
                  </span>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#16213A] dark:text-white mt-0.5">
                  {lang === 'hi' ? selectedWorker.nameHi : selectedWorker.nameEn}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {lang === 'hi' ? selectedWorker.areaNameHi : selectedWorker.areaNameEn}
                </p>
              </div>
            </div>

            <div className="sm:text-right bg-[#F3F5F9] dark:bg-[#0E1527] px-4 py-3 rounded-[16px]">
              <div className="font-display text-2xl font-extrabold text-[#16213A] dark:text-[#FEB21D] tabular-nums">
                ₹{selectedWorker.rateAmount}
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {getRateUnitLabel(selectedWorker.rateUnit, lang)}
              </div>
            </div>
          </div>

          {/* Government ID Submission + Rating Quick Pill */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-[16px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2.5 text-emerald-900 dark:text-emerald-200">
                <BadgeCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                <div>
                  <span className="font-bold">
                    {selectedWorker.govtVerified
                      ? t('govtVerifiedBadge', lang)
                      : t('newOnShramik', lang)}
                  </span>
                  {selectedWorker.govtVerified && selectedWorker.govtIdType && (
                    <span className="text-xs text-emerald-700 dark:text-emerald-300 ml-2">
                      · {getGovtIdLabel(selectedWorker.govtIdType, lang)}{' '}
                      {selectedWorker.govtIdMasked ? `(${selectedWorker.govtIdMasked})` : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-[16px] bg-amber-50/80 dark:bg-amber-950/30 border border-[#FEB21D]/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-[#FB8B11] text-[#FB8B11] shrink-0" />
                <div className="text-sm font-extrabold text-[#16213A] dark:text-white tabular-nums">
                  {summary.totalCount > 0
                    ? `${summary.averageOverall.toFixed(1)} ★ (${summary.totalCount} ${t('reviewsCountLabel', lang)})`
                    : t('newOnShramik', lang)}
                </div>
              </div>
              {summary.totalCount > 0 && (
                <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {summary.hireAgainPercent}% Wapas Bulaya
                </span>
              )}
            </div>
          </div>

          {/* Book a Slot Form (Today + Next 10 Days) */}
          <form onSubmit={handleRequestBooking} className="space-y-6 pt-2">
            {/* Step 1: Today + Next 10 Days Strip */}
            <div>
              <label className="block text-base font-bold text-[#16213A] dark:text-white mb-2.5 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#FB8B11]" aria-hidden="true" />
                <span>{t('selectDayLabel', lang)}</span>
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {next11Days.map((dIso) => {
                  const info = formatReadableDate(dIso, lang);
                  const active = bookDate === dIso;
                  return (
                    <button
                      key={dIso}
                      type="button"
                      onClick={() => {
                        setBookDate(dIso);
                        setBookSlot(null);
                        setBookError(null);
                      }}
                      className={`min-h-[66px] min-w-[78px] py-2 px-2.5 rounded-[16px] border flex flex-col items-center justify-center shrink-0 transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#16213A] text-white border-[#16213A] dark:bg-[#FEB21D] dark:text-[#16213A] dark:border-[#FEB21D] shadow-sm'
                          : 'bg-[#F3F5F9] dark:bg-[#0E1527] border-slate-200 dark:border-slate-800 text-[#16213A] dark:text-slate-200 hover:border-[#FB8B11]'
                      }`}
                    >
                      <span className="text-[11px] font-semibold">
                        {info.shortDay}
                      </span>
                      <span className="text-sm font-extrabold tabular-nums">
                        {info.dayNum} {info.monthName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: 6 Time Slots */}
            <div>
              <label className="block text-base font-bold text-[#16213A] dark:text-white mb-2.5 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#FB8B11]" aria-hidden="true" />
                <span>{t('selectSlotLabel', lang)}</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {TIME_SLOTS.map((slot) => {
                  const past = isSlotInPast(bookDate, slot.id);
                  const bookingState = getWorkerSlotBookingState(
                    selectedWorker.id,
                    bookDate,
                    slot.id
                  );
                  const workerHasOpen =
                    !isWorkerDayOff && workerDaySlots.includes(slot.id);
                  const isDisabled =
                    past || bookingState !== 'free' || !workerHasOpen;
                  const isSelected = bookSlot === slot.id;

                  let statusText = t('slotAvailable', lang);
                  if (past) statusText = t('slotPast', lang);
                  else if (bookingState === 'confirmed')
                    statusText = t('slotBooked', lang);
                  else if (bookingState === 'pending')
                    statusText = t('slotRequested', lang);
                  else if (!workerHasOpen) statusText = t('slotOff', lang);

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        setBookSlot(slot.id);
                        setBookError(null);
                      }}
                      className={`min-h-[68px] p-4 rounded-[18px] border-2 text-left flex items-center justify-between gap-2 transition-all ${
                        isDisabled
                          ? 'bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                          : isSelected
                          ? 'bg-[#16213A] text-white border-[#16213A] dark:bg-[#FEB21D] dark:text-[#16213A] dark:border-[#FEB21D] shadow-sm cursor-pointer'
                          : 'bg-[#F3F5F9] dark:bg-[#0E1527] border-slate-200 dark:border-slate-800 text-[#16213A] dark:text-white hover:border-[#FB8B11] cursor-pointer'
                      }`}
                    >
                      <div>
                        <div className="text-base font-extrabold tabular-nums">
                          {lang === 'hi' ? slot.labelHi : slot.labelEn}
                        </div>
                        <div className="text-xs font-semibold mt-0.5">
                          {statusText}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-5 h-5 stroke-[3] shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Note */}
            <div>
              <label className="block text-base font-bold text-[#16213A] dark:text-white mb-2">
                {t('optionalNoteLabel', lang)}
              </label>
              <input
                type="text"
                value={bookNote}
                onChange={(e) => setBookNote(e.target.value)}
                placeholder={t('bookingNotePlaceholder', lang)}
                className="w-full min-h-[56px] px-4 rounded-[16px] bg-[#F3F5F9] dark:bg-[#0E1527] border border-slate-300 dark:border-slate-700 text-base text-[#16213A] dark:text-white focus:outline-none focus:border-[#FB8B11]"
              />
            </div>

            {bookError && (
              <div
                role="alert"
                className="p-3.5 rounded-[14px] bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 text-sm font-bold"
              >
                {bookError}
              </div>
            )}

            {/* Visitor Sign-In Prompt if unauthenticated visitor tries to book */}
            {needsSignInPrompt && !user.onboardingComplete && (
              <div className="p-4 rounded-[16px] bg-amber-50 dark:bg-amber-950/40 border-2 border-[#FB8B11] space-y-3">
                <p className="text-sm font-bold text-[#16213A] dark:text-white">
                  {t('signInToBookPrompt', lang)}
                </p>
                {onRequireLoginForBooking && (
                  <button
                    type="button"
                    onClick={() => onRequireLoginForBooking(selectedWorker.id)}
                    className="min-h-[52px] px-5 py-2.5 rounded-[14px] bg-[#16213A] text-white dark:bg-[#FEB21D] dark:text-[#16213A] font-display font-extrabold text-sm flex items-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{t('signInNowBtn', lang)}</span>
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              className="w-full min-h-[60px] px-6 py-3.5 rounded-[18px] bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] font-display text-xl font-extrabold shadow-md hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
            >
              {t('requestBookingBtn', lang)}
            </button>
          </form>
        </div>

        {/* Worker Certificate, Experience Badge & Work Journey */}
        <WorkerCertificateCard
          worker={selectedWorker}
          lang={lang}
          canEdit={false}
          onRefresh={onRefresh}
        />

        {/* Ustad Ki Gawahi (References) */}
        <UstadGawahiSection
          worker={selectedWorker}
          lang={lang}
          canEdit={false}
          onRefresh={onRefresh}
        />

        {/* PART 4: Full Reviews & Rating Breakdown Section */}
        <WorkerReviewsSection
          worker={selectedWorker}
          lang={lang}
          canWorkerReply={false}
          onRefresh={onRefresh}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* CUSTOMER PAGE TOP SWITCHER: [Find Nearby Workers] vs [Work History] */}
      {/* + VOICE ASSISTANT BAR (Listen to Page & Speak to Search)            */}
      {/* ==================================================================== */}
      <div className="bg-white dark:bg-[#17213A] rounded-[20px] p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* 2-Tab Switcher: Search Workers vs Customer Work History */}
          <div className="grid grid-cols-2 gap-2 bg-[#F3F5F9] dark:bg-[#0E1527] p-1.5 rounded-[16px] flex-1">
            <button
              type="button"
              onClick={() => setCustomerViewMode('search')}
              className={`min-h-[50px] px-4 py-2 rounded-[12px] font-display text-sm sm:text-base font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                customerViewMode === 'search'
                  ? 'bg-[#16213A] text-white dark:bg-[#FEB21D] dark:text-[#16213A] shadow-sm'
                  : 'text-[#16213A] dark:text-slate-300 hover:text-[#FB8B11]'
              }`}
            >
              <Search className="w-4 h-4 shrink-0" />
              <span>{t('customerSearchTabBtn', lang)}</span>
            </button>

            <button
              type="button"
              onClick={() => setCustomerViewMode('history')}
              className={`min-h-[50px] px-4 py-2 rounded-[12px] font-display text-sm sm:text-base font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                customerViewMode === 'history'
                  ? 'bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] shadow-sm'
                  : 'text-[#16213A] dark:text-slate-300 hover:text-[#FB8B11]'
              }`}
            >
              <History className="w-4 h-4 shrink-0" />
              <span>
                {t('customerHistoryTabBtn', lang)} ({historyBookings.length})
              </span>
            </button>
          </div>

          {/* Voice Assistance Controls: 64px Round Gradient Mic Button + Speak to Search + Listen to Page */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => triggerAwaazSahayak(true)}
              className="w-16 h-16 min-w-[64px] min-h-[64px] rounded-full bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] font-display font-extrabold shadow-md border-2 border-white dark:border-[#16213A] flex items-center justify-center hover:brightness-105 active:scale-95 transition-all cursor-pointer shrink-0"
              aria-label={t('awaazHomeMicBtnLabel', lang)}
              title={t('awaazHomeMicBtnLabel', lang)}
            >
              <Mic className="w-7 h-7 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={handleStartVoiceAssistant}
              className={`min-h-[56px] px-4 py-2 rounded-[14px] font-display text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                isVoiceListening
                  ? 'bg-red-600 text-white ring-4 ring-red-400/50 motion-safe:animate-pulse'
                  : 'bg-[#16213A] text-[#FEB21D] dark:bg-[#FEB21D] dark:text-[#16213A] shadow-xs'
              }`}
            >
              <Mic className="w-4 h-4 shrink-0" />
              <span>
                {isVoiceListening
                  ? `${t('awaazListeningState', lang)}`
                  : t('voiceSpeakToSearchBtn', lang)}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                speakTextAloud(
                  customerViewMode === 'history'
                    ? t('voiceHistoryGuideText', lang)
                    : t('voiceCustomerGuideText', lang)
                )
              }
              className="min-h-[50px] px-3.5 py-2 rounded-[14px] bg-[#F3F5F9] dark:bg-[#0E1527] border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-extrabold text-[#16213A] dark:text-[#FEB21D] flex items-center gap-1.5 cursor-pointer hover:border-[#FB8B11]"
            >
              <Volume2 className="w-4 h-4 text-[#FB8B11] shrink-0" />
              <span>
                {isSpeakingGuide
                  ? t('voiceStopReadingBtn', lang)
                  : t('voiceReadPageBtn', lang)}
              </span>
            </button>
          </div>
        </div>

        {(voiceFeedback || isVoiceListening || isProcessingVoiceSearch) && (
          <div
            className={`p-3 rounded-[12px] border text-xs sm:text-sm font-bold flex items-center justify-between gap-3 ${
              isVoiceListening
                ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
                : 'bg-amber-50 dark:bg-[#0E1527] border-[#FEB21D]/60 text-[#16213A] dark:text-[#FEB21D]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {isVoiceListening && (
                <div className="flex items-center gap-1 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                  <div className="w-20 h-2.5 bg-red-200 dark:bg-red-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-600 transition-all duration-75 rounded-full"
                      style={{ width: `${Math.max(12, voiceVolume)}%` }}
                    />
                  </div>
                </div>
              )}
              <span className="truncate">{voiceFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setVoiceFeedback(null)}
              className="text-xs underline opacity-80 cursor-pointer shrink-0"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* CUSTOMER WORK HISTORY VIEW (Book Again / दुबारा बुलाएँ lives ONLY here) */}
      {/* ==================================================================== */}
      {customerViewMode === 'history' ? (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#17213A] rounded-[20px] p-5 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <History className="w-6 h-6 text-[#FB8B11]" />
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#16213A] dark:text-white">
                {t('customerHistoryTitle', lang)}
              </h1>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              {t('customerHistorySub', lang)}
            </p>
          </div>

          {historyBookings.length === 0 ? (
            <div className="bg-white dark:bg-[#17213A] rounded-[20px] p-8 text-center border border-slate-200 dark:border-slate-800">
              <History className="w-10 h-10 text-[#FB8B11] mx-auto mb-3" />
              <p className="text-base font-bold text-[#16213A] dark:text-white max-w-md mx-auto">
                {t('noHistoryYet', lang)}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {historyBookings.map((bk) => {
                const matchedWorker =
                  workers.find((w) => w.id === bk.workerId) || workers[0];
                const dateInfo = formatReadableDate(bk.date, lang);
                const workerName =
                  lang === 'hi' ? bk.workerNameHi : bk.workerNameEn;
                const tradeLabel = getTradeLabel(
                  bk.trade,
                  lang,
                  bk.customTradeName
                );
                const proofStats = getWorkerProofStats(matchedWorker.id);

                const cardSpeechText =
                  lang === 'hi'
                    ? `${workerName}, ${tradeLabel}। तारीख़ ${dateInfo.fullLabel}। काम पूरा और ग्राहक द्वारा पुष्ट। यदि काम अच्छा लगा तो नीचे दुबारा बुलाएँ बटन दबाएँ।`
                    : `${workerName}, ${tradeLabel}. Completed on ${dateInfo.fullLabel}. Tap Book Again below to book their next available slot.`;

                return (
                  <article
                    key={bk.id}
                    className="bg-white dark:bg-[#17213A] rounded-[20px] p-5 border-2 border-[#FEB21D]/60 flex flex-col justify-between gap-4 shadow-xs"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 font-extrabold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{t('chipCustomerConfirmed', lang)}</span>
                          </span>
                          <span className="font-mono text-[#EA580C] dark:text-[#FEB21D] bg-amber-50 dark:bg-[#0E1527] px-2 py-0.5 rounded">
                            {bk.workerHandle}
                          </span>
                          <span className="font-mono text-slate-500 dark:text-slate-400">
                            ({bk.workerShramikId})
                          </span>
                        </div>

                        {/* Voice Readout Button on History Card */}
                        <button
                          type="button"
                          onClick={() => speakTextAloud(cardSpeechText, bk.id)}
                          className="min-h-[36px] px-2.5 py-1 rounded-[10px] bg-[#F3F5F9] dark:bg-[#0E1527] text-xs font-bold text-[#EA580C] dark:text-[#FEB21D] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>
                            {speakingCardId === bk.id
                              ? t('voiceStopReadingBtn', lang)
                              : t('voiceReadCardBtn', lang)}
                          </span>
                        </button>
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <TradeIcon
                              trade={bk.trade}
                              className="w-5 h-5 text-[#FB8B11]"
                            />
                            <h2 className="font-display text-2xl font-extrabold text-[#16213A] dark:text-white">
                              {workerName}
                            </h2>
                          </div>
                          <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                            {tradeLabel} · {proofStats.totalYears}+{' '}
                            {t('certYearsUnit', lang)} · ₹{matchedWorker.rateAmount}{' '}
                            {getRateUnitLabel(matchedWorker.rateUnit, lang)}
                          </p>
                        </div>
                      </div>

                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#FB8B11]" />
                          {t('completedOnLabel', lang)}: {dateInfo.fullLabel}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#FB8B11]" />
                          {getSlotLabel(bk.slot, lang)}
                        </span>
                      </div>

                      {bk.note && (
                        <p className="text-xs italic text-slate-600 dark:text-slate-300">
                          “{bk.note}”
                        </p>
                      )}

                      {bk.workerCompletionPhoto && (
                        <img
                          src={bk.workerCompletionPhoto}
                          alt={workerName}
                          className="w-full h-36 object-cover rounded-[12px] border border-slate-200 dark:border-slate-700"
                        />
                      )}
                    </div>

                    {/* EXCLUSIVE BOOK AGAIN (WAPAS BULAYEIN) BUTTON IN HISTORY */}
                    <div className="pt-2 space-y-1.5">
                      <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 text-center">
                        {t('bookAgainSub', lang)}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenWorkerDetail(matchedWorker, true)}
                        className="w-full min-h-[56px] px-4 py-3 rounded-[16px] bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] font-display text-base sm:text-lg font-extrabold flex items-center justify-center gap-2 shadow-sm hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-5 h-5 stroke-[2.5] shrink-0" />
                        <span>{t('bookAgainBtn', lang)}</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Top Search & Trade Grid Card */}
          <div className="bg-white dark:bg-[#17213A] rounded-[20px] p-5 border border-slate-200/80 dark:border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#16213A] dark:text-white">
              {t('whatWorkNeed', lang)}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#FB8B11] shrink-0" />
              <span>
                {lang === 'hi' ? activeLocation.areaNameHi : activeLocation.areaNameEn} · ≤{' '}
                {maxDistanceKm} {t('kmUnit', lang)}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleUseMyLocationQuick}
            className="min-h-[48px] px-4 py-2 rounded-[14px] bg-[#F3F5F9] dark:bg-[#0E1527] border border-slate-300 dark:border-slate-700 text-xs font-extrabold text-[#16213A] dark:text-[#FEB21D] hover:border-[#FB8B11] flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <Navigation className="w-4 h-4 text-[#FB8B11]" />
            <span>
              {locatingGps ? t('detectingLocation', lang) : t('useCurrentLocation', lang)}
            </span>
          </button>
        </div>

        {/* Search Input (by skill, worker name, @handle or SH-ID) + Direct Voice Search Mic */}
        <div className="relative flex items-center">
          <Search
            className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder', lang)}
            className="w-full min-h-[56px] pl-12 pr-32 rounded-[16px] bg-[#F3F5F9] dark:bg-[#0E1527] border border-slate-200 dark:border-slate-700 text-base font-medium text-[#16213A] dark:text-white focus:outline-none focus:border-[#FB8B11]"
          />
          <button
            type="button"
            onClick={handleStartVoiceAssistant}
            className={`absolute right-2 top-1/2 -translate-y-1/2 min-h-[42px] px-3 py-1.5 rounded-[12px] font-display text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              isVoiceListening
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-[#16213A] text-[#FEB21D] dark:bg-[#FEB21D] dark:text-[#16213A] hover:brightness-110'
            }`}
            title={t('voiceSpeakToSearchBtn', lang)}
          >
            <Mic className="w-4 h-4 shrink-0" />
            <span>
              {isVoiceListening
                ? lang === 'hi'
                  ? 'बोलिए...'
                  : 'Speak...'
                : t('voiceSpeakToSearchBtn', lang)}
            </span>
          </button>
        </div>

        {/* Active Voice / Price Filter Chip */}
        {maxPriceFilter !== null && (
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-[14px] bg-amber-50 dark:bg-[#0E1527] border-2 border-[#FB8B11]">
            <span className="text-sm font-extrabold text-[#16213A] dark:text-[#FEB21D]">
              {t('maxPriceFilterBadge', lang)}{maxPriceFilter}
            </span>
            <button
              type="button"
              onClick={() => setMaxPriceFilter(null)}
              className="min-h-[36px] px-3 py-1 rounded-[10px] bg-[#16213A] text-white dark:bg-[#FEB21D] dark:text-[#16213A] text-xs font-extrabold cursor-pointer"
            >
              {t('clearPriceFilterBtn', lang)}
            </button>
          </div>
        )}

        {/* 7 Trade Icons Grid (painter, carpenter, tailor, electrician, plumber, mason, other) */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {TRADES.map((tr) => {
            const active = selectedTrade === tr;
            return (
              <button
                key={tr}
                type="button"
                onClick={() => setSelectedTrade(active ? 'all' : tr)}
                className={`min-h-[76px] p-2.5 rounded-[16px] border flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer ${
                  active
                    ? 'bg-[#16213A] text-white border-[#16213A] dark:bg-[#FEB21D] dark:text-[#16213A] dark:border-[#FEB21D] shadow-sm'
                    : 'bg-[#F3F5F9] dark:bg-[#0E1527] text-[#16213A] dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:border-[#FB8B11]'
                }`}
              >
                <TradeIcon
                  trade={tr}
                  className={`w-6 h-6 ${
                    active ? 'text-[#FEB21D] dark:text-[#16213A]' : 'text-[#FB8B11]'
                  }`}
                />
                <span className="text-xs font-bold leading-tight truncate max-w-full">
                  {getTradeLabel(tr, lang).split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Available Today & Next 10 Days Date Strip */}
        <div>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#FB8B11]" aria-hidden="true" />
            <span>{t('next10DaysLabel', lang)}</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1.5">
            <button
              type="button"
              onClick={() => setAvailabilityDateFilter('all')}
              className={`min-h-[58px] px-4 py-2 rounded-[14px] border text-sm font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                availabilityDateFilter === 'all'
                  ? 'bg-[#16213A] text-white border-[#16213A] dark:bg-[#FEB21D] dark:text-[#16213A] dark:border-[#FEB21D]'
                  : 'bg-[#F3F5F9] dark:bg-[#0E1527] border-slate-200 dark:border-slate-800 text-[#16213A] dark:text-slate-200'
              }`}
            >
              {t('anyDate', lang)}
            </button>

            {next11Days.map((dIso, idx) => {
              const info = formatReadableDate(dIso, lang);
              const active = availabilityDateFilter === dIso;
              return (
                <button
                  key={dIso}
                  type="button"
                  onClick={() =>
                    setAvailabilityDateFilter(active ? 'all' : dIso)
                  }
                  className={`min-h-[58px] min-w-[82px] px-3 py-1.5 rounded-[14px] border flex flex-col items-center justify-center shrink-0 transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#16213A] text-white border-[#16213A] dark:bg-[#FEB21D] dark:text-[#16213A] dark:border-[#FEB21D]'
                      : 'bg-[#F3F5F9] dark:bg-[#0E1527] border-slate-200 dark:border-slate-800 text-[#16213A] dark:text-slate-200 hover:border-[#FB8B11]'
                  }`}
                >
                  <span className="text-[11px] font-semibold">
                    {idx === 0 ? t('availableToday', lang) : info.shortDay}
                  </span>
                  <span className="text-sm font-extrabold tabular-nums">
                    {info.dayNum} {info.monthName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Distance & Sort Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* Distance Filter */}
          <div className="flex items-center gap-1.5 bg-[#F3F5F9] dark:bg-[#0E1527] p-1.5 rounded-[14px]">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2 whitespace-nowrap">
              {t('distanceFilterLabel', lang)}:
            </span>
            {([1, 3, 6] as const).map((km) => (
              <button
                key={km}
                type="button"
                onClick={() => setMaxDistanceKm(km)}
                className={`flex-1 min-h-[42px] px-2.5 rounded-[10px] text-sm font-bold tabular-nums transition-colors whitespace-nowrap cursor-pointer ${
                  maxDistanceKm === km
                    ? 'bg-white dark:bg-[#17213A] text-[#16213A] dark:text-[#FEB21D] shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {km} {t('kmUnit', lang)}
              </button>
            ))}
          </div>

          {/* Sort Filter */}
          <div className="flex items-center gap-1 bg-[#F3F5F9] dark:bg-[#0E1527] p-1.5 rounded-[14px]">
            {(
              [
                { id: 'distance', label: t('sortPriceNone', lang) },
                { id: 'low', label: t('sortPriceLow', lang) },
                { id: 'high', label: t('sortPriceHigh', lang) },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setPriceSort(s.id)}
                className={`flex-1 min-h-[42px] px-2 rounded-[10px] text-xs font-bold transition-colors truncate cursor-pointer ${
                  priceSort === s.id
                    ? 'bg-white dark:bg-[#17213A] text-[#16213A] dark:text-[#FEB21D] shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {filteredWorkers.length === 0 ? (
        <div className="bg-white dark:bg-[#17213A] rounded-[20px] p-8 text-center border border-slate-200 dark:border-slate-800">
          <p className="text-lg font-bold text-[#16213A] dark:text-white mb-2">
            {t('noWorkersNearby', lang)}
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {availabilityDateFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setAvailabilityDateFilter('all')}
                className="min-h-[48px] px-4 rounded-[14px] bg-[#16213A] text-white dark:bg-[#FEB21D] dark:text-[#16213A] text-sm font-bold cursor-pointer"
              >
                {t('anyDate', lang)}
              </button>
            )}
            {selectedTrade !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedTrade('all')}
                className="min-h-[48px] px-4 rounded-[14px] bg-slate-200 dark:bg-slate-800 text-[#16213A] dark:text-white text-sm font-bold cursor-pointer"
              >
                {t('allTrades', lang)}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkers.map(({ worker, distanceKm, availToday }) => {
            const realSummary = getRatingSummary(worker.id, false);
            const proofStats = getWorkerProofStats(worker.id);
            const repeatTotal = getRepeatTotal(worker.id);
            return (
              <article
                key={worker.id}
                className="bg-white dark:bg-[#17213A] rounded-[20px] p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-4 hover:border-[#FB8B11] transition-colors"
              >
                <div className="space-y-3">
                  {/* Top metadata line: Trade · Distance · Availability */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-[#16213A] dark:text-slate-200">
                      <TradeIcon trade={worker.trade} className="w-4 h-4 text-[#FB8B11]" />
                      <span>
                        {getTradeLabel(worker.trade, lang, worker.customTradeName)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums text-slate-500 dark:text-slate-400">
                        {distanceKm.toFixed(1)} {t('kmAway', lang)}
                      </span>
                    </div>

                    {availToday && (
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                        ● {t('availableToday', lang)}
                      </span>
                    )}
                  </div>

                  {/* Worker Name, Unique @handle, Shramik ID, Years Badge & Rate */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="font-mono text-xs font-extrabold text-[#EA580C] dark:text-[#FEB21D] bg-amber-50 dark:bg-[#0E1527] px-2 py-0.5 rounded-md">
                          {worker.handle}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#0E1527] px-2 py-0.5 rounded-md">
                          {worker.shramikId}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#16213A] text-[#FEB21D] text-[11px] font-extrabold">
                          <Award className="w-3 h-3" />
                          <span>
                            {proofStats.totalYears}+ {t('certYearsUnit', lang)}
                          </span>
                        </span>
                      </div>
                      <h2 className="font-display text-2xl font-extrabold text-[#16213A] dark:text-white leading-tight">
                        {lang === 'hi' ? worker.nameHi : worker.nameEn}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {lang === 'hi' ? worker.areaNameHi : worker.areaNameEn}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-display text-2xl font-extrabold text-[#16213A] dark:text-[#FEB21D] tabular-nums leading-none">
                        ₹{worker.rateAmount}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                        {getRateUnitLabel(worker.rateUnit, lang)}
                      </div>
                    </div>
                  </div>

                  {/* Rating + Wapas Bulaya Repeat Hires + Govt ID Submitted + Voice Readout */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 font-extrabold text-[#16213A] dark:text-white tabular-nums">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-[#FB8B11] text-[#FB8B11]" />
                        {realSummary.realCount > 0 ? (
                          <span>
                            {realSummary.averageOverall.toFixed(1)} ★ ({realSummary.realCount})
                          </span>
                        ) : realSummary.sampleCount > 0 ? (
                          <span>
                            {realSummary.sampleCount} {t('sampleDataTag', lang)}{' '}
                            {t('reviewsCountLabel', lang)}
                          </span>
                        ) : (
                          <span>{t('newOnShramik', lang)}</span>
                        )}
                      </span>

                      {repeatTotal > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold">
                          <RotateCcw className="w-3 h-3" />
                          <span>
                            {repeatTotal}x {t('wapasBulayaBadge', lang)}
                          </span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Listen / सुनें Voice Assistant Button for Worker Card */}
                      <button
                        type="button"
                        onClick={() => {
                          const wName = lang === 'hi' ? worker.nameHi : worker.nameEn;
                          const trName = getTradeLabel(
                            worker.trade,
                            lang,
                            worker.customTradeName
                          );
                          const speech =
                            lang === 'hi'
                              ? `${wName}, ${trName}। अनुभव ${proofStats.totalYears} वर्ष। दर ${worker.rateAmount} रुपये ${getRateUnitLabel(worker.rateUnit, 'hi')}। दूरी ${distanceKm.toFixed(1)} किलोमीटर।`
                              : `${wName}, ${trName}. ${proofStats.totalYears} years experience. Rate ${worker.rateAmount} rupees ${getRateUnitLabel(worker.rateUnit, 'en')}. ${distanceKm.toFixed(1)} kilometers away.`;
                          speakTextAloud(speech, worker.id);
                        }}
                        className="min-h-[32px] px-2.5 py-1 rounded-[8px] bg-[#F3F5F9] dark:bg-[#0E1527] text-xs font-bold text-[#EA580C] dark:text-[#FEB21D] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>
                          {speakingCardId === worker.id
                            ? t('voiceStopReadingBtn', lang)
                            : t('voiceReadCardBtn', lang)}
                        </span>
                      </button>

                      {worker.govtVerified && (
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <BadgeCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span>{t('govtVerifiedBadge', lang)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Only View Slots & Book on general search cards (Book Again is in Customer History only) */}
                <button
                  type="button"
                  onClick={() => handleOpenWorkerDetail(worker, false)}
                  className="w-full min-h-[56px] px-4 py-2.5 rounded-[16px] bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] font-display text-base font-extrabold shadow-xs hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
                >
                  {t('viewSlotsAndBook', lang)}
                </button>
              </article>
            );
          })}
        </div>
      )}
        </>
      )}
    </div>
  );
};
