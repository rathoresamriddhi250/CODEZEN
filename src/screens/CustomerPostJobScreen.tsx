import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Check, CheckCircle2 } from 'lucide-react';
import {
  AppUserState,
  JobPost,
  createJobPost,
  getNext11Days,
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

interface CustomerPostJobScreenProps {
  user: AppUserState;
  lang: Language;
  jobPosts: JobPost[];
  onRefresh: () => void;
}

export const CustomerPostJobScreen: React.FC<CustomerPostJobScreenProps> = ({
  user,
  lang,
  jobPosts,
  onRefresh,
}) => {
  const next11Days = useMemo(() => getNext11Days(), []);
  const [trade, setTrade] = useState<TradeId>('painter');
  const [customTradeName, setCustomTradeName] = useState('');
  const [description, setDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState<string>(next11Days[0]);
  const [preferredSlots, setPreferredSlots] = useState<TimeSlotId[]>([]);
  const [budget, setBudget] = useState('800');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const toggleSlot = (slotId: TimeSlotId) => {
    setErrorMsg(null);
    setPreferredSlots((prev) =>
      prev.includes(slotId) ? prev.filter((s) => s !== slotId) : [...prev, slotId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (trade === 'other' && !customTradeName.trim()) {
      setErrorMsg(t('errCustomTradeRequired', lang));
      return;
    }

    if (!description.trim()) {
      setErrorMsg(t('errJobDescRequired', lang));
      return;
    }

    if (preferredSlots.length === 0) {
      setErrorMsg(t('errJobSlotsRequired', lang));
      return;
    }

    const parsedBudget = Number(budget);
    if (!parsedBudget || parsedBudget <= 0) {
      setErrorMsg(t('errJobBudgetRequired', lang));
      return;
    }

    createJobPost({
      trade,
      customTradeName: trade === 'other' ? customTradeName.trim() : undefined,
      description: description.trim(),
      preferredDate,
      preferredSlots,
      budget: parsedBudget,
    });

    setDescription('');
    setPreferredSlots([]);
    setBudget('800');
    setSuccessMsg(t('jobPostSuccess', lang));
    onRefresh();
  };

  const myCustomerPosts = useMemo(
    () => jobPosts.filter((j) => j.customerId === user.customerId),
    [jobPosts, user.customerId]
  );

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#17213A] rounded-[20px] p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#16213A] dark:text-white">
          {t('postJobTitle', lang)}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 mb-6">
          {t('postJobSub', lang)}
        </p>

        {successMsg && (
          <div className="mb-6 p-4 rounded-[16px] bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center gap-3 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Select Trade (including Others) */}
          <div>
            <label className="block text-base font-bold text-[#16213A] dark:text-white mb-2.5">
              {t('mainTradeLabel', lang)}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {TRADES.map((tr) => {
                const active = trade === tr;
                return (
                  <button
                    key={tr}
                    type="button"
                    onClick={() => setTrade(tr)}
                    className={`min-h-[56px] px-3.5 py-2.5 rounded-[16px] border text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#16213A] text-white border-[#16213A] dark:bg-[#FEB21D] dark:text-[#16213A] dark:border-[#FEB21D]'
                        : 'bg-[#F3F5F9] dark:bg-[#0E1527] text-[#16213A] dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-[#FB8B11]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <TradeIcon
                        trade={tr}
                        className={`w-5 h-5 shrink-0 ${
                          active ? 'text-[#FEB21D] dark:text-[#16213A]' : 'text-[#FB8B11]'
                        }`}
                      />
                      <span className="text-sm font-bold truncate">
                        {getTradeLabel(tr, lang)}
                      </span>
                    </div>
                    {active && <Check className="w-4 h-4 shrink-0" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </div>

          {trade === 'other' && (
            <div>
              <label
                htmlFor="job-custom-trade"
                className="block text-base font-bold text-[#16213A] dark:text-white mb-2"
              >
                {t('customTradeLabel', lang)}
              </label>
              <input
                id="job-custom-trade"
                type="text"
                value={customTradeName}
                onChange={(e) => setCustomTradeName(e.target.value)}
                placeholder={t('customTradePlaceholder', lang)}
                className="w-full min-h-[56px] px-4 rounded-[16px] bg-[#F3F5F9] dark:bg-[#0E1527] border border-slate-300 dark:border-slate-700 text-base text-[#16213A] dark:text-white focus:outline-none focus:border-[#FB8B11]"
              />
            </div>
          )}

          {/* 2. Short Description */}
          <div>
            <label
              htmlFor="job-desc"
              className="block text-base font-bold text-[#16213A] dark:text-white mb-2"
            >
              {t('jobDescLabel', lang)}
            </label>
            <textarea
              id="job-desc"
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrorMsg(null);
              }}
              placeholder={t('jobDescPlaceholder', lang)}
              className="w-full p-4 rounded-[16px] bg-[#F3F5F9] dark:bg-[#0E1527] border border-slate-300 dark:border-slate-700 text-base text-[#16213A] dark:text-white focus:outline-none focus:border-[#FB8B11]"
            />
          </div>

          {/* 3. Preferred Date (Today + Next 10 Days strip) */}
          <div>
            <label className="block text-base font-bold text-[#16213A] dark:text-white mb-2.5 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#FB8B11]" aria-hidden="true" />
              <span>{t('jobDateLabel', lang)}</span>
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {next11Days.map((dIso) => {
                const info = formatReadableDate(dIso, lang);
                const active = preferredDate === dIso;
                return (
                  <button
                    key={dIso}
                    type="button"
                    onClick={() => {
                      setPreferredDate(dIso);
                      setPreferredSlots((prev) =>
                        prev.filter((s) => !isSlotInPast(dIso, s))
                      );
                    }}
                    className={`min-h-[64px] min-w-[78px] py-2 px-2.5 rounded-[16px] border flex flex-col items-center justify-center shrink-0 transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#16213A] text-white border-[#16213A] dark:bg-[#FEB21D] dark:text-[#16213A] dark:border-[#FEB21D]'
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

          {/* 4. Preferred Time Slots (Multi-select) */}
          <div>
            <label className="block text-base font-bold text-[#16213A] dark:text-white mb-2.5 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#FB8B11]" aria-hidden="true" />
              <span>{t('jobSlotsLabel', lang)}</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {TIME_SLOTS.map((slot) => {
                const past = isSlotInPast(preferredDate, slot.id);
                const selected = preferredSlots.includes(slot.id);
                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={past}
                    onClick={() => toggleSlot(slot.id)}
                    className={`min-h-[60px] p-3.5 rounded-[16px] border-2 text-left flex items-center justify-between gap-2 transition-all ${
                      past
                        ? 'bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                        : selected
                        ? 'bg-[#16213A] text-white border-[#16213A] dark:bg-[#FEB21D] dark:text-[#16213A] dark:border-[#FEB21D] cursor-pointer'
                        : 'bg-[#F3F5F9] dark:bg-[#0E1527] border-slate-200 dark:border-slate-800 text-[#16213A] dark:text-white hover:border-[#FB8B11] cursor-pointer'
                    }`}
                  >
                    <div>
                      <div className="text-base font-extrabold tabular-nums">
                        {lang === 'hi' ? slot.labelHi : slot.labelEn}
                      </div>
                      {past && (
                        <div className="text-xs font-medium">{t('slotPast', lang)}</div>
                      )}
                    </div>
                    {selected && <Check className="w-5 h-5 stroke-[3] shrink-0" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Rate / Budget in ₹ */}
          <div>
            <label
              htmlFor="job-budget"
              className="block text-base font-bold text-[#16213A] dark:text-white mb-2"
            >
              {t('jobBudgetLabel', lang)}
            </label>
            <input
              id="job-budget"
              type="number"
              min="50"
              step="50"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder={t('jobBudgetPlaceholder', lang)}
              className="w-full sm:max-w-xs min-h-[56px] px-4 rounded-[16px] bg-[#F3F5F9] dark:bg-[#0E1527] border border-slate-300 dark:border-slate-700 text-lg font-bold tabular-nums text-[#16213A] dark:text-white focus:outline-none focus:border-[#FB8B11]"
            />
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="p-4 rounded-[16px] bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-base font-semibold"
            >
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="w-full min-h-[60px] px-6 py-3.5 rounded-[18px] bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] font-display text-xl font-extrabold shadow-md hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
          >
            {t('submitJobPostBtn', lang)}
          </button>
        </form>
      </div>

      {/* Customer's Own Posted Jobs */}
      {myCustomerPosts.length > 0 && (
        <div className="bg-white dark:bg-[#17213A] rounded-[20px] p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <h2 className="font-display text-xl font-extrabold text-[#16213A] dark:text-white">
            {t('myPostedJobsTitle', lang)}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myCustomerPosts.map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-[16px] bg-[#F3F5F9] dark:bg-[#0E1527] border border-slate-200/80 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#EA580C] dark:text-[#FEB21D] flex items-center gap-1.5">
                    <TradeIcon trade={post.trade} className="w-4 h-4" />
                    {getTradeLabel(post.trade, lang, post.customTradeName)}
                  </span>
                  <span
                    className={
                      post.status === 'booked'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-600 dark:text-slate-400'
                    }
                  >
                    {post.status === 'booked'
                      ? t('jobStatusBooked', lang)
                      : t('jobStatusOpen', lang)}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-base font-medium text-[#16213A] dark:text-white">
                    {lang === 'hi' ? post.descriptionHi : post.descriptionEn}
                  </p>
                  <span className="font-display text-lg font-extrabold text-[#16213A] dark:text-[#FEB21D] tabular-nums shrink-0">
                    ₹{post.budget}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {formatReadableDate(post.preferredDate, lang).fullLabel} ·{' '}
                  {post.preferredSlots.map((s) => getSlotLabel(s, lang)).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
