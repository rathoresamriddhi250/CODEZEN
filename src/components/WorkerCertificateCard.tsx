import React, { useState, useMemo } from 'react';
import {
  Award,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  MapPin,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import {
  JourneyEntry,
  WorkerProfile,
  addJourneyEntry,
  deleteJourneyEntry,
  getRatingSummary,
  getWorkerProofStats,
  listJourneyEntries,
  updateJourneyEntry,
} from '../data/store';
import {
  Language,
  TRADES,
  TradeId,
  getTradeLabel,
  t,
} from '../i18n';
import { ShramikLogo } from './ShramikLogo';
import { TradeIcon } from './TradeIcon';

interface WorkerCertificateCardProps {
  worker: WorkerProfile;
  lang: Language;
  canEdit?: boolean;
  onRefresh: () => void;
}

export const WorkerCertificateCard: React.FC<WorkerCertificateCardProps> = ({
  worker,
  lang,
  canEdit = false,
  onRefresh,
}) => {
  const currentYear = new Date().getFullYear();

  const [city, setCity] = useState('');
  const [trade, setTrade] = useState<TradeId>(worker.trade);
  const [fromYear, setFromYear] = useState(String(currentYear - 5));
  const [toYear, setToYear] = useState('');
  const [note, setNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const journeys = useMemo(() => listJourneyEntries(worker.id), [worker]);
  const proofStats = useMemo(
    () => getWorkerProofStats(worker.id),
    [worker, journeys]
  );
  const ratingSummary = useMemo(
    () => getRatingSummary(worker.id, true),
    [worker]
  );

  const workerDisplayName = lang === 'hi' ? worker.nameHi : worker.nameEn;
  const tradeDisplay = getTradeLabel(worker.trade, lang, worker.customTradeName);

  const resetForm = () => {
    setCity('');
    setTrade(worker.trade);
    setFromYear(String(currentYear - 4));
    setToYear('');
    setNote('');
    setEditingId(null);
    setErrorMsg(null);
  };

  const handleStartEdit = (jrn: JourneyEntry) => {
    setEditingId(jrn.id);
    setCity(jrn.city);
    setTrade(jrn.trade);
    setFromYear(String(jrn.fromYear));
    setToYear(jrn.toYear ? String(jrn.toYear) : '');
    setNote(jrn.note);
    setErrorMsg(null);
  };

  const handleSubmitJourney = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!city.trim()) {
      setErrorMsg(t('errJourneyCityRequired', lang));
      return;
    }

    const parsedFrom = Number(fromYear);
    const parsedTo = toYear.trim() ? Number(toYear) : null;

    if (
      !parsedFrom ||
      parsedFrom < 1970 ||
      parsedFrom > currentYear ||
      (parsedTo !== null && (parsedTo < parsedFrom || parsedTo > currentYear + 1))
    ) {
      setErrorMsg(t('errJourneyYearInvalid', lang));
      return;
    }

    if (editingId) {
      updateJourneyEntry(editingId, {
        city: city.trim(),
        trade,
        fromYear: parsedFrom,
        toYear: parsedTo,
        note: note.trim(),
      });
      resetForm();
      onRefresh();
      return;
    }

    addJourneyEntry({
      workerId: worker.id,
      city: city.trim(),
      trade,
      fromYear: parsedFrom,
      toYear: parsedTo,
      note: note.trim(),
    });
    resetForm();
    onRefresh();
  };

  const handleDeleteJourney = (id: string) => {
    deleteJourneyEntry(id);
    if (editingId === id) {
      resetForm();
    }
    onRefresh();
  };

  // Generate downloadable SVG Certificate Data URL
  const certificateDataUrl = useMemo(() => {
    const safeName = workerDisplayName.replace(/[<>&"']/g, '');
    const safeTrade = tradeDisplay.replace(/[<>&"']/g, '');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560">
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#16213A"/>
          <stop offset="100%" stop-color="#0E1527"/>
        </linearGradient>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#FEB21D"/>
          <stop offset="50%" stop-color="#FB8B11"/>
          <stop offset="100%" stop-color="#EA580C"/>
        </linearGradient>
      </defs>
      <rect width="900" height="560" rx="28" fill="url(#bgGrad)"/>
      <rect x="20" y="20" width="860" height="520" rx="22" fill="none" stroke="url(#goldGrad)" stroke-width="4"/>
      <rect x="32" y="32" width="836" height="496" rx="16" fill="none" stroke="#FEB21D" stroke-opacity="0.35" stroke-width="1.5"/>
      <text x="450" y="88" text-anchor="middle" fill="#FEB21D" font-family="sans-serif" font-size="28" font-weight="900" letter-spacing="2">SHRAMIK (श्रमिक) — WORK PROOF CERTIFICATE</text>
      <text x="450" y="118" text-anchor="middle" fill="#FB8B11" font-family="sans-serif" font-size="16" font-weight="700">“हर हुनर की पहचान, हर मेहनत का सम्मान।” · Real Skills. Trusted Work.</text>
      <line x1="120" y1="140" x2="780" y2="140" stroke="#FEB21D" stroke-opacity="0.3" stroke-width="1.5"/>
      <text x="450" y="195" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="38" font-weight="900">${safeName}</text>
      <text x="450" y="232" text-anchor="middle" fill="#FEB21D" font-family="monospace" font-size="18" font-weight="700">${worker.handle} · ID: ${worker.shramikId} · ${safeTrade}</text>
      <rect x="310" y="256" width="280" height="54" rx="27" fill="url(#goldGrad)"/>
      <text x="450" y="290" text-anchor="middle" fill="#16213A" font-family="sans-serif" font-size="22" font-weight="900">★ ${proofStats.totalYears}+ YEARS OF SKILL PROOF ★</text>
      <g transform="translate(90, 345)">
        <rect x="0" y="0" width="165" height="92" rx="14" fill="#17213A" stroke="#FEB21D" stroke-opacity="0.4"/>
        <text x="82" y="38" text-anchor="middle" fill="#FEB21D" font-family="sans-serif" font-size="26" font-weight="900">${proofStats.totalYears}+ Yrs</text>
        <text x="82" y="66" text-anchor="middle" fill="#CBD5E1" font-family="sans-serif" font-size="13" font-weight="700">Work Experience</text>
      </g>
      <g transform="translate(275, 345)">
        <rect x="0" y="0" width="165" height="92" rx="14" fill="#17213A" stroke="#FEB21D" stroke-opacity="0.4"/>
        <text x="82" y="38" text-anchor="middle" fill="#34D399" font-family="sans-serif" font-size="26" font-weight="900">${proofStats.confirmedJobsCount}</text>
        <text x="82" y="66" text-anchor="middle" fill="#CBD5E1" font-family="sans-serif" font-size="13" font-weight="700">Confirmed Jobs</text>
      </g>
      <g transform="translate(460, 345)">
        <rect x="0" y="0" width="165" height="92" rx="14" fill="#17213A" stroke="#FEB21D" stroke-opacity="0.4"/>
        <text x="82" y="38" text-anchor="middle" fill="#FB8B11" font-family="sans-serif" font-size="26" font-weight="900">${proofStats.repeatTotal}x</text>
        <text x="82" y="66" text-anchor="middle" fill="#CBD5E1" font-family="sans-serif" font-size="13" font-weight="700">Wapas Bulaya</text>
      </g>
      <g transform="translate(645, 345)">
        <rect x="0" y="0" width="165" height="92" rx="14" fill="#17213A" stroke="#FEB21D" stroke-opacity="0.4"/>
        <text x="82" y="38" text-anchor="middle" fill="#FEB21D" font-family="sans-serif" font-size="26" font-weight="900">${proofStats.gawahiCount}/3</text>
        <text x="82" y="66" text-anchor="middle" fill="#CBD5E1" font-family="sans-serif" font-size="13" font-weight="700">Ustad Ki Gawahi</text>
      </g>
      <text x="450" y="488" text-anchor="middle" fill="#94A3B8" font-family="sans-serif" font-size="13" font-weight="600">Issued by Shramik (श्रमिक) Skill · Work · Trust Platform · Since ${proofStats.earliestYear}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }, [workerDisplayName, tradeDisplay, worker.handle, worker.shramikId, proofStats]);

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. OFFICIAL SHRAMIK WORK PROOF CERTIFICATE & EXPERIENCE LOGO BADGE   */}
      {/* ==================================================================== */}
      <section className="rounded-[22px] bg-gradient-to-br from-[#16213A] via-[#1B294B] to-[#0E1527] text-white p-5 sm:p-7 border-2 border-[#FEB21D] shadow-lg relative overflow-hidden space-y-5">
        {/* Top Row: Official Shramik Logo + Years of Skill Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/15">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-[14px] p-2 shrink-0 shadow-sm">
              <ShramikLogo variant="compact" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#FEB21D] font-extrabold block">
                {t('certificateVerifiedSeal', lang)}
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-white leading-tight">
                {t('certificateSectionTitle', lang)}
              </h2>
            </div>
          </div>

          {/* Golden Years of Experience Logo Seal */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-[16px] bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] shadow-md self-start sm:self-auto shrink-0">
            <Award className="w-7 h-7 stroke-[2.5] shrink-0" aria-hidden="true" />
            <div>
              <div className="font-display text-xl font-extrabold leading-none tabular-nums">
                {proofStats.totalYears}+ {t('certYearsUnit', lang)}
              </div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider">
                {t('certificateBadgeLabel', lang)}
              </div>
            </div>
          </div>
        </div>

        {/* Center Worker Identity & Trade */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                {workerDisplayName}
              </h3>
              {worker.govtVerified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-extrabold">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  <span>{t('govtVerifiedBadge', lang)}</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-bold text-[#FEB21D]">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] bg-white/10 text-white">
                <TradeIcon trade={worker.trade} className="w-4 h-4 text-[#FEB21D]" />
                <span>{tradeDisplay}</span>
              </span>
              <span className="font-mono px-2.5 py-1 rounded-[10px] bg-white/10">
                {worker.handle}
              </span>
              <span className="font-mono px-2.5 py-1 rounded-[10px] bg-white/10 text-slate-200">
                {worker.shramikId}
              </span>
            </div>
          </div>

          {/* Download Official SVG Certificate Button */}
          <a
            href={certificateDataUrl}
            download={`Shramik-Certificate-${worker.shramikId}.svg`}
            className="min-h-[48px] px-4 py-2.5 rounded-[14px] bg-white/15 hover:bg-white/25 border border-[#FEB21D]/60 text-[#FEB21D] font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shrink-0 transition-colors"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>{t('downloadCertificateBtn', lang)}</span>
          </a>
        </div>

        {/* 4 Proof Pillars Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3.5 rounded-[16px] bg-white/10 border border-white/15">
            <div className="text-xs font-semibold text-slate-300">
              {t('certYearsGivenLabel', lang)}
            </div>
            <div className="font-display text-2xl font-extrabold text-[#FEB21D] mt-0.5 tabular-nums">
              {proofStats.totalYears}+ {t('certYearsUnit', lang)}
            </div>
            <div className="text-[11px] text-slate-300">
              {proofStats.earliestYear} – {currentYear}
            </div>
          </div>

          <div className="p-3.5 rounded-[16px] bg-white/10 border border-white/15">
            <div className="text-xs font-semibold text-slate-300">
              {t('certConfirmedJobsLabel', lang)}
            </div>
            <div className="font-display text-2xl font-extrabold text-emerald-400 mt-0.5 tabular-nums flex items-center gap-1">
              <CheckCircle2 className="w-5 h-5" />
              <span>{proofStats.confirmedJobsCount}</span>
            </div>
            <div className="text-[11px] text-slate-300">
              ★ {ratingSummary.averageOverall > 0 ? ratingSummary.averageOverall : '4.8'}/5
            </div>
          </div>

          <div className="p-3.5 rounded-[16px] bg-white/10 border border-white/15">
            <div className="text-xs font-semibold text-slate-300">
              {t('certRepeatHiresLabel', lang)}
            </div>
            <div className="font-display text-2xl font-extrabold text-[#FB8B11] mt-0.5 tabular-nums flex items-center gap-1">
              <RotateCcw className="w-5 h-5" />
              <span>{proofStats.repeatTotal}x</span>
            </div>
            <div className="text-[11px] text-slate-300">
              {t('wapasBulayaBadge', lang)}
            </div>
          </div>

          <div className="p-3.5 rounded-[16px] bg-white/10 border border-white/15">
            <div className="text-xs font-semibold text-slate-300">
              {t('certGawahiCountLabel', lang)}
            </div>
            <div className="font-display text-2xl font-extrabold text-[#FEB21D] mt-0.5 tabular-nums flex items-center gap-1">
              <ShieldCheck className="w-5 h-5" />
              <span>{proofStats.gawahiCount}/3</span>
            </div>
            <div className="text-[11px] text-slate-300">
              {proofStats.confirmedGawahiCount} {t('refStatusConfirmedDemo', lang)}
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 2. WORK JOURNEY (KAAM KA SAFAR) TIMELINE & EDITOR                    */}
      {/* ==================================================================== */}
      <section
        id="work-journey-form"
        className="bg-white dark:bg-[#17213A] rounded-[20px] p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#FB8B11]" aria-hidden="true" />
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#16213A] dark:text-white">
                {t('journeySectionTitle', lang)}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
              {t('journeySectionSub', lang)}
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-[#FEB21D] text-xs font-extrabold self-start sm:self-auto">
            <Clock className="w-3.5 h-3.5" />
            <span>{t('chipSelfReported', lang)}</span>
          </span>
        </div>

        {journeys.length === 0 ? (
          <div className="p-6 rounded-[16px] bg-[#F3F5F9] dark:bg-[#0E1527] text-center border border-slate-200/70 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300 max-w-md mx-auto">
              {t('noJourneyYet', lang)}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {journeys.map((jrn) => {
              const yearsSpan = Math.max(
                1,
                (jrn.toYear || currentYear) - jrn.fromYear
              );
              return (
                <div
                  key={jrn.id}
                  className="p-4 rounded-[16px] bg-[#F3F5F9] dark:bg-[#0E1527] border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 font-display text-lg font-extrabold text-[#16213A] dark:text-white">
                        <MapPin className="w-4 h-4 text-[#FB8B11]" />
                        <span>{jrn.city}</span>
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#16213A] text-[#FEB21D] text-xs font-bold">
                        {getTradeLabel(jrn.trade, lang)}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-[#EA580C] dark:text-[#FEB21D] text-xs font-mono font-extrabold">
                        {jrn.fromYear} – {jrn.toYear || t('journeyPresentLabel', lang)} ({yearsSpan} {t('certYearsUnit', lang)})
                      </span>
                      {jrn.isSample && (
                        <span className="px-2 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900/60 text-[#16213A] dark:text-[#FEB21D] text-[10px] font-extrabold">
                          {t('sampleDataTag', lang)}
                        </span>
                      )}
                    </div>
                    {jrn.note && (
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {jrn.note}
                      </p>
                    )}
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(jrn)}
                        className="min-h-[40px] px-3 py-1.5 rounded-[10px] bg-white dark:bg-[#17213A] border border-slate-300 dark:border-slate-700 text-xs font-bold text-[#16213A] dark:text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#FB8B11]" />
                        <span>{t('editBtn', lang)}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteJourney(jrn.id)}
                        className="min-h-[40px] px-3 py-1.5 rounded-[10px] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-red-700 dark:text-red-300 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t('deleteBtn', lang)}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add / Edit Journey Entry Form (Worker Only) */}
        {canEdit && (
          <form
            onSubmit={handleSubmitJourney}
            className="p-4 rounded-[18px] bg-[#F3F5F9] dark:bg-[#0E1527] border border-slate-200 dark:border-slate-800 space-y-3.5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#16213A] dark:text-white mb-1">
                  {t('journeyCityLabel', lang)} *
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t('journeyCityPlaceholder', lang)}
                  className="w-full min-h-[48px] px-3.5 rounded-[12px] bg-white dark:bg-[#17213A] border border-slate-300 dark:border-slate-700 text-sm font-bold text-[#16213A] dark:text-white focus:outline-none focus:border-[#FB8B11]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16213A] dark:text-white mb-1">
                  {t('journeyFromYearLabel', lang)} *
                </label>
                <input
                  type="number"
                  min="1975"
                  max={currentYear}
                  value={fromYear}
                  onChange={(e) => setFromYear(e.target.value)}
                  className="w-full min-h-[48px] px-3.5 rounded-[12px] bg-white dark:bg-[#17213A] border border-slate-300 dark:border-slate-700 text-sm font-mono font-bold text-[#16213A] dark:text-white focus:outline-none focus:border-[#FB8B11]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16213A] dark:text-white mb-1">
                  {t('journeyToYearLabel', lang)}
                </label>
                <input
                  type="number"
                  min="1975"
                  max={currentYear}
                  value={toYear}
                  onChange={(e) => setToYear(e.target.value)}
                  placeholder={t('journeyPresentLabel', lang)}
                  className="w-full min-h-[48px] px-3.5 rounded-[12px] bg-white dark:bg-[#17213A] border border-slate-300 dark:border-slate-700 text-sm font-mono font-bold text-[#16213A] dark:text-white focus:outline-none focus:border-[#FB8B11]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16213A] dark:text-white mb-1">
                {t('mainTradeLabel', lang)}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TRADES.map((tr) => (
                  <button
                    key={tr}
                    type="button"
                    onClick={() => setTrade(tr)}
                    className={`min-h-[38px] px-3 py-1 rounded-full text-xs font-bold border cursor-pointer ${
                      trade === tr
                        ? 'bg-[#16213A] text-white border-[#16213A] dark:bg-[#FEB21D] dark:text-[#16213A]'
                        : 'bg-white dark:bg-[#17213A] text-[#16213A] dark:text-slate-200 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {getTradeLabel(tr, lang)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16213A] dark:text-white mb-1">
                {t('journeyNoteLabel', lang)}
              </label>
              <input
                type="text"
                maxLength={160}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('journeyNotePlaceholder', lang)}
                className="w-full min-h-[48px] px-3.5 rounded-[12px] bg-white dark:bg-[#17213A] border border-slate-300 dark:border-slate-700 text-sm text-[#16213A] dark:text-white focus:outline-none focus:border-[#FB8B11]"
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-[10px] bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 text-xs font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                className="min-h-[50px] px-5 py-2.5 rounded-[14px] bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] font-display text-sm font-extrabold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {editingId ? t('saveReferenceBtn', lang) : t('addJourneyBtn', lang)}
                </span>
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="min-h-[50px] px-4 py-2.5 rounded-[14px] border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  {t('cancelEditBtn', lang)}
                </button>
              )}
            </div>
          </form>
        )}
      </section>
    </div>
  );
};
