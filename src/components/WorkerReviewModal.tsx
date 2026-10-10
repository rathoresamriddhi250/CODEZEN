import React, { useState, useEffect } from 'react';
import {
  Star,
  X,
  Camera,
  Check,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Mic,
  Flag,
} from 'lucide-react';
import {
  Booking,
  WorkerProfile,
  addFlag,
  addReview,
  createSampleWorkPhotoDataUrl,
} from '../data/store';
import {
  ISSUE_TAG_IDS,
  IssueTagId,
  LIKE_TAG_IDS,
  Language,
  LikeTagId,
  getIssueTagLabel,
  getLikeTagLabel,
  getTradeLabel,
  t,
} from '../i18n';
import { compressImageFile } from '../utils/image';

interface WorkerReviewModalProps {
  worker: WorkerProfile;
  booking: Booking;
  customerId: string;
  customerName: string;
  lang: Language;
  onClose: () => void;
  onSubmitted: () => void;
}

export const WorkerReviewModal: React.FC<WorkerReviewModalProps> = ({
  worker,
  booking,
  customerId,
  customerName,
  lang,
  onClose,
  onSubmitted,
}) => {
  // a. Was the work finished?
  const [jobFinished, setJobFinished] = useState<'yes' | 'partly' | 'no'>('yes');
  // b. Are you satisfied with the work?
  const [satisfied, setSatisfied] = useState<boolean>(true);
  // c. Would you hire this worker again? ("Wapas Bulaya")
  const [hireAgain, setHireAgain] = useState<boolean>(true);

  // d. Star ratings (1 to 5)
  const [quality, setQuality] = useState<number>(5);
  const [behaviour, setBehaviour] = useState<number>(5);
  const [safety, setSafety] = useState<number>(5);
  const [womenSafety, setWomenSafety] = useState<number | null>(5);
  const [punctuality, setPunctuality] = useState<number>(5);

  // e. Overall rating (1 to 5, required)
  const [overall, setOverall] = useState<number>(5);

  // Follow-up chips
  const [issueTags, setIssueTags] = useState<IssueTagId[]>([]);
  const [likeTags, setLikeTags] = useState<LikeTagId[]>(['quality', 'punctuality']);
  const [otherTagText, setOtherTagText] = useState<string>('');

  // f. Experience free text (max 300 chars) + Web Speech API mic
  const [text, setText] = useState<string>('');
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);

  // g. Optional customer photo (compressed)
  const [customerPhoto, setCustomerPhoto] = useState<string | undefined>(
    booking.customerCompletionPhoto
  );

  // Report problem & validation state
  const [problemReported, setProblemReported] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const win = window as unknown as {
      SpeechRecognition?: unknown;
      webkitSpeechRecognition?: unknown;
    };
    setSpeechSupported(Boolean(win.SpeechRecognition || win.webkitSpeechRecognition));
  }, []);

  const handleStartVoiceInput = () => {
    const win = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: (e: { results: { 0: { 0: { transcript: string } } } }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: (e: { results: { 0: { 0: { transcript: string } } } }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      const rec = new SpeechRec();
      rec.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      setIsListening(true);
      rec.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          setText((prev) => `${prev ? prev + ' ' : ''}${transcript}`.slice(0, 300));
        }
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      rec.start();
    } catch {
      setIsListening(false);
    }
  };

  const toggleIssueTag = (tag: IssueTagId) => {
    setIssueTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const toggleLikeTag = (tag: LikeTagId) => {
    setLikeTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 800, 0.6);
      setCustomerPhoto(compressed);
    } catch {
      // ignore invalid file
    }
  };

  const handleUseDemoPhoto = () => {
    const sampleUrl = createSampleWorkPhotoDataUrl(
      worker.trade,
      `${getTradeLabel(worker.trade, 'en', worker.customTradeName)} · Customer Optional Photo`
    );
    setCustomerPhoto(sampleUrl);
  };

  const isSafetyAlertActive =
    issueTags.includes('felt_unsafe') ||
    (womenSafety !== null && womenSafety <= 2);

  const handleReportProblemFlag = () => {
    addFlag({
      type: 'worker',
      targetId: worker.id,
      reason: isSafetyAlertActive
        ? `Safety / Women's safety alert (${womenSafety ?? 'N/A'}★) on booking ${booking.id}`
        : `Customer reported a problem with worker ${worker.handle} (${worker.shramikId})`,
    });
    setProblemReported(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);

    if (!overall || overall < 1 || overall > 5) {
      setErrorMsg(t('errOverallRequired', lang));
      return;
    }

    setIsSubmitting(true);
    const res = addReview({
      bookingId: booking.id,
      workerId: worker.id,
      customerId,
      customerName,
      jobFinished,
      satisfied,
      hireAgain,
      ratings: {
        quality,
        behaviour,
        safety,
        womenSafety,
        punctuality,
      },
      overall,
      issueTags: overall <= 3 ? issueTags : [],
      likeTags: overall >= 4 ? likeTags : [],
      otherTagText:
        (overall <= 3 && issueTags.includes('others')) ||
        (overall >= 4 && likeTags.includes('others'))
          ? otherTagText
          : undefined,
      text: text.trim().slice(0, 300),
      customerPhoto,
    });

    if (res.error === 'duplicate_review') {
      setErrorMsg(t('errDuplicateReview', lang));
      setIsSubmitting(false);
      return;
    }

    if (res.error === 'storage_full') {
      setErrorMsg(t('storageFullError', lang));
      setIsSubmitting(false);
      return;
    }

    onSubmitted();
    onClose();
  };

  const renderStarRow = (
    label: string,
    value: number,
    onChange: (val: number) => void
  ) => (
    <div className="p-3.5 rounded-[16px] bg-[#F3F5F9] dark:bg-[#0E1527] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
      <span className="text-sm font-bold text-[#16213A] dark:text-white">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const active = star <= value;
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              aria-label={`${star} Stars`}
              className="w-11 h-11 rounded-[12px] bg-white dark:bg-[#17213A] border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
            >
              <Star
                className={`w-6 h-6 ${
                  active
                    ? 'fill-[#FB8B11] text-[#FB8B11]'
                    : 'text-slate-300 dark:text-slate-600'
                }`}
              />
            </button>
          );
        })}
        <span className="ml-1 text-sm font-extrabold text-[#16213A] dark:text-[#FEB21D] tabular-nums w-8 text-right">
          {value}/5
        </span>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-[#17213A] rounded-t-[24px] sm:rounded-[24px] p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[92vh] overflow-y-auto space-y-5">
        {/* Header with @handle & Shramik ID */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-extrabold font-mono px-2 py-0.5 rounded bg-[#16213A] text-[#FEB21D]">
                {worker.handle}
              </span>
              <span className="text-xs font-extrabold font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-[#0E1527] text-[#EA580C] dark:text-[#FEB21D]">
                {worker.shramikId}
              </span>
            </div>
            <h2 className="font-display text-2xl font-extrabold text-[#16213A] dark:text-white">
              {t('reviewModalTitle', lang)}
            </h2>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {lang === 'hi' ? worker.nameHi : worker.nameEn} ·{' '}
              {getTradeLabel(worker.trade, lang, worker.customTradeName)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] min-w-[48px] rounded-[12px] flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* a. Was the work finished? (Yes / Partly / No) */}
          <div className="space-y-2">
            <label className="block text-base font-bold text-[#16213A] dark:text-white">
              {t('qWorkFinished', lang)}
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {(
                [
                  { id: 'yes', label: t('ansYes', lang) },
                  { id: 'partly', label: t('ansPartly', lang) },
                  { id: 'no', label: t('ansNo', lang) },
                ] as const
              ).map((opt) => {
                const active = jobFinished === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setJobFinished(opt.id)}
                    className={`min-h-[56px] px-3 rounded-[16px] border-2 font-display text-base font-extrabold flex items-center justify-center gap-1.5 cursor-pointer ${
                      active
                        ? 'bg-[#16213A] text-white border-[#16213A] dark:bg-[#FEB21D] dark:text-[#16213A] dark:border-[#FEB21D]'
                        : 'bg-[#F3F5F9] dark:bg-[#0E1527] text-[#16213A] dark:text-slate-200 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {active && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* b. Are you satisfied with the work? (Yes / No) */}
          <div className="space-y-2">
            <label className="block text-base font-bold text-[#16213A] dark:text-white">
              {t('qSatisfied', lang)}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { val: true, label: t('ansYes', lang) },
                { val: false, label: t('ansNo', lang) },
              ].map((opt) => {
                const active = satisfied === opt.val;
                return (
                  <button
                    key={String(opt.val)}
                    type="button"
                    onClick={() => setSatisfied(opt.val)}
                    className={`min-h-[56px] px-4 rounded-[16px] border-2 font-display text-base font-extrabold flex items-center justify-center gap-2 cursor-pointer ${
                      active
                        ? 'bg-[#16213A] text-white border-[#16213A] dark:bg-[#FEB21D] dark:text-[#16213A] dark:border-[#FEB21D]'
                        : 'bg-[#F3F5F9] dark:bg-[#0E1527] text-[#16213A] dark:text-slate-200 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {active && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* c. Would you hire this worker again? (Yes / No -> Wapas Bulaya) */}
          <div className="space-y-2">
            <label className="block text-base font-bold text-[#16213A] dark:text-white">
              {t('qHireAgain', lang)}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { val: true, label: `${t('ansYes', lang)} · ${t('wapasBulayaTag', lang)}` },
                { val: false, label: t('ansNo', lang) },
              ].map((opt) => {
                const active = hireAgain === opt.val;
                return (
                  <button
                    key={String(opt.val)}
                    type="button"
                    onClick={() => setHireAgain(opt.val)}
                    className={`min-h-[56px] px-3 rounded-[16px] border-2 font-display text-sm sm:text-base font-extrabold flex items-center justify-center gap-1.5 cursor-pointer ${
                      active
                        ? 'bg-[#16213A] text-white border-[#16213A] dark:bg-[#FEB21D] dark:text-[#16213A] dark:border-[#FEB21D]'
                        : 'bg-[#F3F5F9] dark:bg-[#0E1527] text-[#16213A] dark:text-slate-200 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {active && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* d. Star ratings (1 to 5, big tappable stars) */}
          <div className="space-y-2.5">
            <h3 className="font-display text-lg font-extrabold text-[#16213A] dark:text-white">
              {t('rateCriteriaHeading', lang)}
            </h3>

            {renderStarRow(t('crit_quality', lang), quality, setQuality)}
            {renderStarRow(t('crit_behaviour', lang), behaviour, setBehaviour)}
            {renderStarRow(t('crit_safety', lang), safety, setSafety)}

            {/* Women's safety (Always visible + Not applicable option) */}
            <div className="p-3.5 rounded-[16px] bg-amber-50/70 dark:bg-amber-950/20 border-2 border-[#FEB21D]/60 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#EA580C] dark:text-[#FEB21D] shrink-0" />
                  <span className="text-sm font-bold text-[#16213A] dark:text-white">
                    {t('crit_womenSafety', lang)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setWomenSafety(womenSafety === null ? 5 : null)}
                  className={`min-h-[38px] px-3 py-1 rounded-[10px] text-xs font-extrabold border cursor-pointer ${
                    womenSafety === null
                      ? 'bg-[#16213A] text-white border-[#16213A] dark:bg-[#FEB21D] dark:text-[#16213A]'
                      : 'bg-white dark:bg-[#17213A] text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {t('notApplicableBtn', lang)}
                </button>
              </div>

              {womenSafety !== null && (
                <div className="flex items-center justify-end gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= womenSafety;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setWomenSafety(star)}
                        className="w-11 h-11 rounded-[12px] bg-white dark:bg-[#17213A] border border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            active
                              ? 'fill-[#FB8B11] text-[#FB8B11]'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="ml-1 text-sm font-extrabold text-[#16213A] dark:text-[#FEB21D] tabular-nums w-8 text-right">
                    {womenSafety}/5
                  </span>
                </div>
              )}
            </div>

            {renderStarRow(t('crit_punctuality', lang), punctuality, setPunctuality)}
          </div>

          {/* e. Overall rating: 1 to 5 stars (required) */}
          <div className="p-4 rounded-[18px] bg-[#16213A] text-white text-center space-y-2.5">
            <div className="text-sm font-bold text-[#FEB21D]">
              {t('overallRatingLabel', lang)}
            </div>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = star <= overall;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setOverall(star)}
                    className="w-12 h-12 rounded-[14px] bg-white/10 hover:bg-white/20 flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        active ? 'fill-[#FEB21D] text-[#FEB21D]' : 'text-slate-400'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <div className="font-display text-2xl font-extrabold text-white tabular-nums">
              {overall} / 5 ★
            </div>
          </div>

          {/* 3. Follow-Up by Star Count (<=3 stars vs 4-5 stars) */}
          {overall <= 3 ? (
            <div className="p-4 rounded-[18px] bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800/80 space-y-3">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200 font-display text-lg font-extrabold">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <span>{t('whatWentWrongHeading', lang)}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ISSUE_TAG_IDS.map((tag) => {
                  const selected = issueTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleIssueTag(tag)}
                      className={`min-h-[52px] px-3.5 py-2 rounded-[14px] border text-left text-xs sm:text-sm font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        selected
                          ? 'bg-red-700 text-white border-red-700'
                          : 'bg-white dark:bg-[#0E1527] text-[#16213A] dark:text-slate-200 border-red-200 dark:border-red-900/60'
                      }`}
                    >
                      <span>{getIssueTagLabel(tag, lang)}</span>
                      {selected && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {issueTags.includes('others') && (
                <input
                  type="text"
                  value={otherTagText}
                  onChange={(e) => setOtherTagText(e.target.value)}
                  placeholder={t('otherChipTextPlaceholder', lang)}
                  className="w-full min-h-[50px] px-4 rounded-[14px] bg-white dark:bg-[#0E1527] border border-red-300 dark:border-red-800 text-sm text-[#16213A] dark:text-white focus:outline-none focus:border-red-500"
                />
              )}
            </div>
          ) : (
            <div className="p-4 rounded-[18px] bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-200 dark:border-emerald-800/80 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-display text-lg font-extrabold">
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{t('whatLikedMostHeading', lang)}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {LIKE_TAG_IDS.map((tag) => {
                  const selected = likeTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleLikeTag(tag)}
                      className={`min-h-[52px] px-3.5 py-2 rounded-[14px] border text-left text-xs sm:text-sm font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        selected
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-white dark:bg-[#0E1527] text-[#16213A] dark:text-slate-200 border-emerald-200 dark:border-emerald-900/60'
                      }`}
                    >
                      <span>{getLikeTagLabel(tag, lang)}</span>
                      {selected && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {likeTags.includes('others') && (
                <input
                  type="text"
                  value={otherTagText}
                  onChange={(e) => setOtherTagText(e.target.value)}
                  placeholder={t('otherChipTextPlaceholder', lang)}
                  className="w-full min-h-[50px] px-4 rounded-[14px] bg-white dark:bg-[#0E1527] border border-emerald-300 dark:border-emerald-800 text-sm text-[#16213A] dark:text-white focus:outline-none focus:border-emerald-500"
                />
              )}
            </div>
          )}

          {/* Always-visible Report a Problem button (Prominent when Felt Unsafe or Women's safety <= 2) */}
          <div
            className={`p-3.5 rounded-[16px] border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isSafetyAlertActive
                ? 'bg-red-100 dark:bg-red-950/70 border-2 border-red-600'
                : 'bg-slate-50 dark:bg-[#0E1527] border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="text-xs font-bold text-[#16213A] dark:text-slate-200">
              {problemReported
                ? t('problemReportedBadge', lang)
                : t('reportProblemBtn', lang)}
            </div>
            {!problemReported && (
              <button
                type="button"
                onClick={handleReportProblemFlag}
                className={`min-h-[48px] px-4 py-2 rounded-[14px] font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
                  isSafetyAlertActive
                    ? 'bg-red-700 text-white shadow-md'
                    : 'bg-white dark:bg-[#17213A] border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300'
                }`}
              >
                <Flag className="w-4 h-4" />
                <span>{t('reportProblemBtn', lang)}</span>
              </button>
            )}
          </div>

          {/* f. "Tell us your experience" free text, max 300 chars + Web Speech API Mic */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-bold text-[#16213A] dark:text-white">
                {t('experienceCommentLabel', lang)}
              </label>
              <span className="text-xs font-bold text-slate-500 tabular-nums">
                {text.length}/300
              </span>
            </div>

            <textarea
              rows={3}
              maxLength={300}
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 300))}
              placeholder={t('experienceCommentPlaceholder', lang)}
              className="w-full p-3.5 rounded-[16px] bg-[#F3F5F9] dark:bg-[#0E1527] border border-slate-300 dark:border-slate-700 text-sm text-[#16213A] dark:text-white focus:outline-none focus:border-[#FB8B11]"
            />

            {speechSupported && (
              <button
                type="button"
                onClick={handleStartVoiceInput}
                className={`min-h-[48px] px-4 py-2 rounded-[14px] text-xs font-extrabold flex items-center gap-2 cursor-pointer ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-[#F3F5F9] dark:bg-[#0E1527] border border-slate-300 dark:border-slate-700 text-[#16213A] dark:text-white'
                }`}
              >
                <Mic className="w-4 h-4 text-[#FB8B11]" />
                <span>
                  {isListening ? t('voiceListening', lang) : t('voiceMicBtn', lang)}
                </span>
              </button>
            )}
          </div>

          {/* g. Optional photo from the customer */}
          <div className="p-4 rounded-[16px] bg-[#F3F5F9] dark:bg-[#0E1527] border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-[#16213A] dark:text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#FB8B11]" />
                {t('optionalCustomerPhotoStepLabel', lang)}
              </span>
            </div>

            {customerPhoto && (
              <img
                src={customerPhoto}
                alt="Completed work uploaded by customer"
                className="w-full h-40 object-cover rounded-[12px] border border-slate-300 dark:border-slate-700"
              />
            )}

            <div className="flex flex-wrap gap-2.5">
              <label className="min-h-[48px] px-4 py-2 rounded-[12px] bg-white dark:bg-[#17213A] border border-slate-300 dark:border-slate-700 text-xs font-bold text-[#16213A] dark:text-white flex items-center gap-2 cursor-pointer hover:border-[#FB8B11]">
                <Camera className="w-4 h-4 text-[#FB8B11]" />
                <span>{t('uploadWorkPhotoBtn', lang)}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleUseDemoPhoto}
                className="min-h-[48px] px-4 py-2 rounded-[12px] bg-[#FEB21D]/20 text-[#16213A] dark:text-[#FEB21D] text-xs font-bold cursor-pointer hover:bg-[#FEB21D]/30"
              >
                {t('captureDemoPhotoBtn', lang)}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="p-3.5 rounded-[14px] bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 text-xs font-bold"
            >
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[58px] px-6 py-3.5 rounded-[18px] bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] font-display text-xl font-extrabold shadow-md hover:brightness-105 disabled:opacity-50 cursor-pointer"
          >
            {t('submitReviewBtn', lang)}
          </button>

          {/* Honest Demo Note under the form */}
          <p className="text-xs text-center font-semibold text-slate-500 dark:text-slate-400">
            {t('honestDemoReviewNote', lang)}
          </p>
        </form>
      </div>
    </div>
  );
};
