import React, { useState, useMemo } from 'react';
import { MapPin, Calendar, Clock, Check, X, Volume2, Mic } from 'lucide-react';
import { triggerAwaazSahayak } from '../components/VoiceCommandAssistant';
import {
  AppUserState,
  JobPost,
  Booking,
  calculateDistanceKm,
  createBooking,
  getNext11Days,
  getTodayIso,
  getWorkerSlotBookingState,
  isSlotInPast,
} from '../data/store';
import {
  Language,
  TIME_SLOTS,
  TRADES,
  TimeSlotId,
  TradeId,
  getSlotLabel,
  getTradeLabel,
  t,
} from '../i18n';
import { TradeIcon, formatReadableDate } from '../components/TradeIcon';

interface WorkerFindJobsScreenProps {
  user: AppUserState;
  lang: Language;
  jobPosts: JobPost[];
  bookings: Booking[];
  onRefresh: () => void;
  onGoToProfile: () => void;
  onGoToBookings: () => void;
}

export const WorkerFindJobsScreen: React.FC<WorkerFindJobsScreenProps> = ({
  user,
  lang,
  jobPosts,
  bookings,
  onRefresh,
  onGoToProfile,
  onGoToBookings,
}) => {
  const [selectedTrade, setSelectedTrade] = useState<TradeId | 'all'>('all');
  const [maxDistanceKm, setMaxDistanceKm] = useState<1 | 3 | 6>(6);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');
  const [isSpeakingGuide, setIsSpeakingGuide] = useState(false);

  const handleToggleVoiceGuide = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (isSpeakingGuide) {
      window.speechSynthesis.cancel();
      setIsSpeakingGuide(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(t('voiceWorkerGuideText', lang));
    utter.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    utter.onend = () => setIsSpeakingGuide(false);
    utter.onerror = () => setIsSpeakingGuide(false);
    setIsSpeakingGuide(true);
    window.speechSynthesis.speak(utter);
  };

  // Offer Slot Modal State
  const [offeringJob, setOfferingJob] = useState<JobPost | null>(null);
  const [offerDate, setOfferDate] = useState<string>(getTodayIso());
  const [offerSlot, setOfferSlot] = useState<TimeSlotId | null>(null);
  const [offerNote, setOfferNote] = useState('');
  const [offerError, setOfferError] = useState<string | null>(null);

  const next11Days = useMemo(() => getNext11Days(), []);
  const todayIso = next11Days[0];

  const filteredJobs = useMemo(() => {
    if (!user.location) return [];
    const uLat = user.location.lat;
    const uLng = user.location.lng;

    return jobPosts
      .filter((job) => job.status === 'open')
      .map((job) => ({
        job,
        distanceKm: calculateDistanceKm(uLat, uLng, job.lat, job.lng),
      }))
      .filter((item) => {
        if (item.distanceKm > maxDistanceKm) return false;
        if (selectedTrade !== 'all' && item.job.trade !== selectedTrade) return false;
        if (
          selectedDateFilter !== 'all' &&
          item.job.preferredDate !== selectedDateFilter
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [jobPosts, user.location, maxDistanceKm, selectedTrade, selectedDateFilter]);

  if (!user.location) {
    return (
      <div className="bg-white dark:bg-[#17213A] rounded-[20px] p-8 text-center border border-slate-200 dark:border-slate-800">
        <MapPin className="w-10 h-10 text-[#FB8B11] mx-auto mb-3" aria-hidden="true" />
        <h2 className="font-display text-2xl font-bold text-[#16213A] dark:text-white mb-2">
          {t('locationNeededTitle', lang)}
        </h2>
        <p className="text-base text-slate-600 dark:text-slate-300 mb-6 max-w-md mx-auto">
          {t('locationNeededDesc', lang)}
        </p>
        <button
          type="button"
          onClick={onGoToProfile}
          className="min-h-[56px] px-6 py-3 rounded-[16px] bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] font-display text-lg font-extrabold cursor-pointer"
        >
          {t('setLocationNow', lang)}
        </button>
      </div>
    );
  }

  const openOfferModal = (job: JobPost) => {
    setOfferingJob(job);
    const initialDate = next11Days.includes(job.preferredDate)
      ? job.preferredDate
      : todayIso;
    setOfferDate(initialDate);
    const firstValidPreferred = job.preferredSlots.find(
      (s) =>
        !isSlotInPast(initialDate, s) &&
        getWorkerSlotBookingState(user.workerId, initialDate, s) === 'free'
    );
    setOfferSlot(firstValidPreferred || null);
    setOfferNote('');
    setOfferError(null);
  };

  const handleSendOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offeringJob) return;
    if (!offerSlot) {
      setOfferError(t('errSelectSlot', lang));
      return;
    }

    const res = createBooking({
      workerId: user.workerId,
      customerId: offeringJob.customerId,
      customerNameEn: offeringJob.customerNameEn,
      customerNameHi: offeringJob.customerNameHi,
      jobPostId: offeringJob.id,
      trade: offeringJob.trade,
      customTradeName: offeringJob.customTradeName,
      date: offerDate,
      slot: offerSlot,
      startedBy: 'worker',
      note: offerNote,
    });

    if (res.error === 'slot_taken') {
      setOfferError(t('slotAlreadyTakenError', lang));
      return;
    }

    setOfferingJob(null);
    onRefresh();
    onGoToBookings();
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="bg-white dark:bg-[#17213A] rounded-[20px] p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#16213A] dark:text-white">
                {t('workerFindJobsTitle', lang)}
              </h1>
              {/* Big 64px Round Gradient Mic Button on Worker Home Screen */}
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
                onClick={handleToggleVoiceGuide}
                className="min-h-[40px] px-3 py-1.5 rounded-[12px] bg-[#F3F5F9] dark:bg-[#0E1527] border border-slate-300 dark:border-slate-700 text-xs font-extrabold text-[#16213A] dark:text-[#FEB21D] flex items-center gap-1.5 cursor-pointer hover:border-[#FB8B11]"
              >
                <Volume2 className="w-4 h-4 text-[#FB8B11] shrink-0" />
                <span>
                  {isSpeakingGuide
                    ? t('voiceStopReadingBtn', lang)
                    : t('voiceReadPageBtn', lang)}
                </span>
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t('workerFindJobsSub', lang)} ·{' '}
              <span className="font-semibold text-[#16213A] dark:text-slate-200">
                {lang === 'hi' ? user.location.areaNameHi : user.location.areaNameEn}
              </span>
            </p>
          </div>

          {/* Distance Segmented Control */}
          <div className="flex items-center gap-1.5 bg-[#F3F5F9] dark:bg-[#0E1527] p-1.5 rounded-[16px] self-start">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2 whitespace-nowrap">
              {t('filterByDistance', lang)}:
            </span>
            {([1, 3, 6] as const).map((km) => (
              <button
                key={km}
                type="button"
                onClick={() => setMaxDistanceKm(km)}
                className={`min-h-[42px] px-3 rounded-[12px] text-sm font-bold tabular-nums transition-colors whitespace-nowrap cursor-pointer ${
                  maxDistanceKm === km
                    ? 'bg-[#16213A] text-white dark:bg-[#FEB21D] dark:text-[#16213A] shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#16213A]'
                }`}
              >
                {km} {t('kmUnit', lang)}
              </button>
            ))}
          </div>
        </div>

        {/* Today + Next 10 Days Date Strip Filter */}
        <div>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#FB8B11]" aria-hidden="true" />
            <span>{t('filterByDate', lang)}</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1.5">
            <button
              type="button"
              onClick={() => setSelectedDateFilter('all')}
              className={`min-h-[58px] px-4 py-2 rounded-[14px] border text-sm font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                selectedDateFilter === 'all'
                  ? 'bg-[#16213A] text-white border-[#16213A] dark:bg-[#FEB21D] dark:text-[#16213A] dark:border-[#FEB21D]'
                  : 'bg-[#F3F5F9] dark:bg-[#0E1527] border-slate-200 dark:border-slate-800 text-[#16213A] dark:text-slate-200'
              }`}
            >
              {t('anyDate', lang)}
            </button>

            {next11Days.map((dIso) => {
              const info = formatReadableDate(dIso, lang);
              const active = selectedDateFilter === dIso;
              return (
                <button
                  key={dIso}
                  type="button"
                  onClick={() => setSelectedDateFilter(dIso)}
                  className={`min-h-[58px] min-w-[76px] px-3 py-1.5 rounded-[14px] border flex flex-col items-center justify-center shrink-0 transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#16213A] text-white border-[#16213A] dark:bg-[#FEB21D] dark:text-[#16213A] dark:border-[#FEB21D]'
                      : 'bg-[#F3F5F9] dark:bg-[#0E1527] border-slate-200 dark:border-slate-800 text-[#16213A] dark:text-slate-200 hover:border-[#FB8B11]'
                  }`}
                >
                  <span className="text-[11px] font-semibold">{info.shortDay}</span>
                  <span className="text-sm font-extrabold tabular-nums">
                    {info.dayNum} {info.monthName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Trade Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedTrade('all')}
            className={`min-h-[46px] px-4 rounded-[14px] text-sm font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              selectedTrade === 'all'
                ? 'bg-[#FB8B11] text-[#16213A]'
                : 'bg-[#F3F5F9] dark:bg-[#0E1527] text-slate-700 dark:text-slate-300'
            }`}
          >
            {t('allTrades', lang)}
          </button>
          {TRADES.map((tr) => {
            const active = selectedTrade === tr;
            return (
              <button
                key={tr}
                type="button"
                onClick={() => setSelectedTrade(tr)}
                className={`min-h-[46px] px-3.5 rounded-[14px] text-sm font-bold flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#FB8B11] text-[#16213A]'
                    : 'bg-[#F3F5F9] dark:bg-[#0E1527] text-slate-700 dark:text-slate-300'
                }`}
              >
                <TradeIcon trade={tr} className="w-4 h-4 shrink-0" />
                <span>{getTradeLabel(tr, lang)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Job Cards Grid */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white dark:bg-[#17213A] rounded-[20px] p-8 text-center border border-slate-200 dark:border-slate-800">
          <p className="text-lg font-bold text-[#16213A] dark:text-white mb-2">
            {t('noJobsNearby', lang)}
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {selectedDateFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedDateFilter('all')}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map(({ job, distanceKm }) => {
            const custFirstName = (
              lang === 'hi' ? job.customerNameHi : job.customerNameEn
            ).split(' ')[0];
            const dateLabel = formatReadableDate(job.preferredDate, lang).fullLabel;
            const existingOffer = bookings.find(
              (b) =>
                b.jobPostId === job.id &&
                b.workerId === user.workerId &&
                (b.status === 'pending' || b.status === 'confirmed')
            );

            return (
              <article
                key={job.id}
                className="bg-white dark:bg-[#17213A] rounded-[20px] p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  {/* Top unboxed metadata kicker */}
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 font-semibold text-[#EA580C] dark:text-[#FEB21D]">
                      <TradeIcon trade={job.trade} className="w-4 h-4" />
                      <span>
                        {getTradeLabel(job.trade, lang, job.customTradeName)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {distanceKm.toFixed(1)} {t('kmAway', lang)}
                      </span>
                    </div>
                    <span className="font-bold text-[#16213A] dark:text-slate-200">
                      {dateLabel}
                    </span>
                  </div>

                  {/* Customer First Name & Description */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-xl font-extrabold text-[#16213A] dark:text-white">
                        {t('customerLabel', lang)}: {custFirstName}
                      </h2>
                      <p className="text-base text-slate-700 dark:text-slate-200 mt-1">
                        {lang === 'hi' ? job.descriptionHi : job.descriptionEn}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-display text-2xl font-extrabold text-[#16213A] dark:text-[#FEB21D] tabular-nums">
                        ₹{job.budget}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {t('budgetLabel', lang)}
                      </div>
                    </div>
                  </div>

                  {/* Preferred Date & Slots */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 dark:text-slate-400">
                        {t('preferredDate', lang)}:
                      </span>
                      <span className="font-bold text-[#16213A] dark:text-white">
                        {dateLabel}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-500 dark:text-slate-400 shrink-0">
                        {t('preferredSlots', lang)}:
                      </span>
                      <span className="font-semibold text-right text-[#16213A] dark:text-slate-200 tabular-nums">
                        {job.preferredSlots
                          .map((s) => getSlotLabel(s, lang))
                          .join(' · ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                {existingOffer ? (
                  <button
                    type="button"
                    onClick={onGoToBookings}
                    className="w-full min-h-[56px] px-4 py-3 rounded-[16px] bg-slate-100 dark:bg-[#0E1527] text-[#16213A] dark:text-[#FEB21D] font-bold text-base flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-5 h-5" aria-hidden="true" />
                    <span>{t('offerAlreadySent', lang)}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openOfferModal(job)}
                    className="w-full min-h-[56px] px-5 py-3 rounded-[16px] bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] font-display text-lg font-extrabold shadow-sm hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    {t('offerASlotBtn', lang)}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Offer a Slot Bottom Sheet / Modal (Today + Next 10 Days) */}
      {offeringJob && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-white dark:bg-[#17213A] rounded-t-[24px] sm:rounded-[20px] p-5 sm:p-6 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden" />

            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="font-display text-2xl font-extrabold text-[#16213A] dark:text-white">
                  {t('offerModalTitle', lang)}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {t('offerModalSub', lang)}{' '}
                  <strong className="text-[#16213A] dark:text-white">
                    {(lang === 'hi'
                      ? offeringJob.customerNameHi
                      : offeringJob.customerNameEn
                    ).split(' ')[0]}
                  </strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOfferingJob(null)}
                className="min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label={t('cancelBtn', lang)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendOffer} className="space-y-5">
              {/* Today + Next 10 Days Strip */}
              <div>
                <label className="block text-sm font-bold text-[#16213A] dark:text-white mb-2 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#FB8B11]" aria-hidden="true" />
                  <span>{t('selectDayLabel', lang)}</span>
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {next11Days.map((dIso) => {
                    const info = formatReadableDate(dIso, lang);
                    const isSelected = offerDate === dIso;
                    const isCustPrefDate = offeringJob.preferredDate === dIso;
                    return (
                      <button
                        key={dIso}
                        type="button"
                        onClick={() => {
                          setOfferDate(dIso);
                          setOfferSlot(null);
                        }}
                        className={`min-h-[62px] min-w-[74px] py-2 px-2.5 rounded-[14px] border flex flex-col items-center justify-center shrink-0 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#16213A] text-white border-[#16213A] dark:bg-[#FEB21D] dark:text-[#16213A] dark:border-[#FEB21D]'
                            : isCustPrefDate
                            ? 'bg-[#FEB21D]/15 border-[#FB8B11] text-[#16213A] dark:text-white'
                            : 'bg-slate-50 dark:bg-[#0E1527] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
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

              {/* 6 Time Slots */}
              <div>
                <label className="block text-sm font-bold text-[#16213A] dark:text-white mb-2 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#FB8B11]" aria-hidden="true" />
                  <span>{t('yourFreeSlotsLabel', lang)}</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {TIME_SLOTS.map((slot) => {
                    const past = isSlotInPast(offerDate, slot.id);
                    const bookingState = getWorkerSlotBookingState(
                      user.workerId,
                      offerDate,
                      slot.id
                    );
                    const disabled = past || bookingState !== 'free';
                    const isSelected = offerSlot === slot.id;
                    const isCustPreferred =
                      offeringJob.preferredDate === offerDate &&
                      offeringJob.preferredSlots.includes(slot.id);

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => setOfferSlot(slot.id)}
                        className={`min-h-[58px] p-3 rounded-[16px] border text-left flex flex-col justify-between transition-all ${
                          disabled
                            ? 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                            : isSelected
                            ? 'bg-[#16213A] text-white border-[#16213A] dark:bg-[#FEB21D] dark:text-[#16213A] dark:border-[#FEB21D] shadow-sm cursor-pointer'
                            : 'bg-slate-50 dark:bg-[#0E1527] border-slate-200 dark:border-slate-800 text-[#16213A] dark:text-white hover:border-[#FB8B11] cursor-pointer'
                        }`}
                      >
                        <div className="text-sm font-bold tabular-nums">
                          {lang === 'hi' ? slot.labelHi : slot.labelEn}
                        </div>
                        <div className="text-xs font-medium">
                          {past
                            ? t('slotPast', lang)
                            : bookingState === 'confirmed'
                            ? t('slotBooked', lang)
                            : bookingState === 'pending'
                            ? t('slotRequested', lang)
                            : isCustPreferred
                            ? `★ ${t('customerPreferredTag', lang)}`
                            : t('slotAvailable', lang)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Note */}
              <div>
                <label className="block text-sm font-bold text-[#16213A] dark:text-white mb-1.5">
                  {t('optionalNoteLabel', lang)}
                </label>
                <input
                  type="text"
                  value={offerNote}
                  onChange={(e) => setOfferNote(e.target.value)}
                  placeholder={t('optionalNotePlaceholder', lang)}
                  className="w-full min-h-[52px] px-4 rounded-[14px] bg-slate-50 dark:bg-[#0E1527] border border-slate-300 dark:border-slate-700 text-base text-[#16213A] dark:text-white focus:outline-none focus:border-[#FB8B11]"
                />
              </div>

              {offerError && (
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {offerError}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOfferingJob(null)}
                  className="min-h-[56px] px-4 rounded-[16px] border border-slate-300 dark:border-slate-700 text-base font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  {t('cancelBtn', lang)}
                </button>
                <button
                  type="submit"
                  className="min-h-[56px] px-5 rounded-[16px] bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] font-display text-lg font-extrabold shadow-sm cursor-pointer"
                >
                  {t('sendOfferBtn', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
