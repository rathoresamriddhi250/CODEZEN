import React, { useState, useMemo } from 'react';
import {
  Star,
  ShieldCheck,
  Flag as FlagIcon,
  MessageSquareReply,
  CheckCircle2,
  AlertTriangle,
  Camera,
  RotateCcw,
} from 'lucide-react';
import {
  WorkerProfile,
  addFlag,
  addWorkerReply,
  getRatingSummary,
  listReviews,
} from '../data/store';
import {
  Language,
  getIssueTagLabel,
  getLikeTagLabel,
  t,
} from '../i18n';
import { formatReviewerPrivacyName } from '../utils/image';

interface WorkerReviewsSectionProps {
  worker: WorkerProfile;
  lang: Language;
  canWorkerReply?: boolean;
  onRefresh: () => void;
}

export const WorkerReviewsSection: React.FC<WorkerReviewsSectionProps> = ({
  worker,
  lang,
  canWorkerReply = false,
  onRefresh,
}) => {
  const [includeSampleInSummary, setIncludeSampleInSummary] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);

  // Report review state
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<'fake' | 'abusive' | 'wrong_person'>('fake');

  // Worker reply state
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');

  const reviews = useMemo(() => listReviews(worker.id), [worker.id, worker]);
  const summary = useMemo(
    () => getRatingSummary(worker.id, includeSampleInSummary),
    [worker.id, includeSampleInSummary, reviews]
  );

  const visibleReviews = reviews.slice(0, visibleCount);

  const handleReportReview = (revId: string) => {
    const reasonText = t(`reportReason_${reportReason}`, lang);
    addFlag({
      type: 'review',
      targetId: revId,
      reason: reasonText,
    });
    setReportingReviewId(null);
    onRefresh();
  };

  const handlePostWorkerReply = (revId: string) => {
    if (!replyDraft.trim()) return;
    addWorkerReply(revId, replyDraft.slice(0, 150));
    setReplyingReviewId(null);
    setReplyDraft('');
    onRefresh();
  };

  return (
    <div
      id="worker-reviews-section"
      className="bg-white dark:bg-[#17213A] rounded-[20px] p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-6"
    >
      {/* Header with Worker's Unique @handle and Shramik ID */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-md bg-[#16213A] text-[#FEB21D]">
              {worker.handle}
            </span>
            <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-md bg-amber-50 dark:bg-[#0E1527] text-[#EA580C] dark:text-[#FEB21D] border border-[#FEB21D]/50">
              ID: {worker.shramikId}
            </span>
          </div>
          <h2 className="font-display text-2xl font-extrabold text-[#16213A] dark:text-white">
            {t('reviewsSectionTitle', lang)}
          </h2>
        </div>

        {/* Toggle to include/exclude SAMPLE reviews in average */}
        {summary.sampleCount > 0 && (
          <label className="flex items-center gap-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-[#F3F5F9] dark:bg-[#0E1527] px-3.5 py-2.5 rounded-[14px] cursor-pointer">
            <input
              type="checkbox"
              checked={includeSampleInSummary}
              onChange={(e) => setIncludeSampleInSummary(e.target.checked)}
              className="w-4 h-4 accent-[#FB8B11]"
            />
            <span>{t('includeSampleReviewsToggle', lang)}</span>
          </label>
        )}
      </div>

      {/* Rating Breakdown Summary Box */}
      <div className="p-4 sm:p-5 rounded-[18px] bg-[#F3F5F9] dark:bg-[#0E1527] border border-slate-200/80 dark:border-slate-800 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Left: Big Average Score + Hire Again % + Most Liked Tag */}
          <div className="space-y-2.5">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-4xl sm:text-5xl font-extrabold text-[#16213A] dark:text-[#FEB21D] tabular-nums">
                {summary.totalCount > 0 ? summary.averageOverall.toFixed(1) : '—'}
              </span>
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-5 h-5 ${
                        s <= Math.round(summary.averageOverall)
                          ? 'fill-[#FB8B11] text-[#FB8B11]'
                          : 'text-slate-300 dark:text-slate-700'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1 tabular-nums">
                  {summary.totalCount} {t('reviewsCountLabel', lang)}
                </p>
              </div>
            </div>

            {summary.totalCount > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 text-xs font-extrabold tabular-nums">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>
                    {summary.hireAgainPercent}% {t('wouldHireAgainPct', lang)} ({summary.wapasBulayaCount})
                  </span>
                </div>

                {summary.topLikedTag && (
                  <div className="text-xs font-bold text-[#EA580C] dark:text-[#FEB21D]">
                    ★ {t('mostLikedLabel', lang)}:{' '}
                    {getLikeTagLabel(summary.topLikedTag, lang)}
                  </div>
                )}
              </div>
            )}

            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {includeSampleInSummary
                ? t('sampleIncludedNote', lang)
                : t('sampleExcludedNote', lang)}
            </p>
          </div>

          {/* Right: 5-to-1 Star Bar Breakdown */}
          <div className="space-y-2">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const count = summary.starCounts[star] || 0;
              const pct =
                summary.totalCount > 0
                  ? Math.round((count / summary.totalCount) * 100)
                  : 0;
              return (
                <div key={star} className="flex items-center gap-2.5 text-xs font-bold">
                  <span className="w-8 text-[#16213A] dark:text-slate-200 tabular-nums">
                    {star} ★
                  </span>
                  <div className="flex-1 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#FEB21D] to-[#EA580C]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-slate-500 dark:text-slate-400 tabular-nums">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Averages Row */}
        {summary.totalCount > 0 && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs font-bold">
            <div className="p-2.5 rounded-[12px] bg-white dark:bg-[#17213A] flex flex-col justify-between">
              <span className="text-slate-500 dark:text-slate-400">
                {t('crit_quality', lang)}
              </span>
              <span className="text-base font-extrabold text-[#16213A] dark:text-[#FEB21D] tabular-nums mt-1">
                {summary.categoryAverages.quality.toFixed(1)} ★
              </span>
            </div>

            <div className="p-2.5 rounded-[12px] bg-white dark:bg-[#17213A] flex flex-col justify-between">
              <span className="text-slate-500 dark:text-slate-400">
                {t('crit_behaviour', lang)}
              </span>
              <span className="text-base font-extrabold text-[#16213A] dark:text-[#FEB21D] tabular-nums mt-1">
                {summary.categoryAverages.behaviour.toFixed(1)} ★
              </span>
            </div>

            <div className="p-2.5 rounded-[12px] bg-white dark:bg-[#17213A] flex flex-col justify-between">
              <span className="text-slate-500 dark:text-slate-400">
                {t('crit_safety', lang)}
              </span>
              <span className="text-base font-extrabold text-[#16213A] dark:text-[#FEB21D] tabular-nums mt-1">
                {summary.categoryAverages.safety.toFixed(1)} ★
              </span>
            </div>

            <div className="p-2.5 rounded-[12px] bg-amber-50 dark:bg-amber-950/30 border border-[#FEB21D]/50 flex flex-col justify-between">
              <span className="text-[#16213A] dark:text-[#FEB21D] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                {t('crit_womenSafety', lang)}
              </span>
              <span className="text-base font-extrabold text-[#EA580C] dark:text-[#FEB21D] tabular-nums mt-1">
                {summary.categoryAverages.womenSafety !== null
                  ? `${summary.categoryAverages.womenSafety.toFixed(1)} ★`
                  : t('notApplicableBtn', lang)}
              </span>
            </div>

            <div className="p-2.5 rounded-[12px] bg-white dark:bg-[#17213A] flex flex-col justify-between">
              <span className="text-slate-500 dark:text-slate-400">
                {t('crit_punctuality', lang)}
              </span>
              <span className="text-base font-extrabold text-[#16213A] dark:text-[#FEB21D] tabular-nums mt-1">
                {summary.categoryAverages.punctuality.toFixed(1)} ★
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Review Cards List */}
      {reviews.length === 0 ? (
        <div className="py-8 text-center text-slate-500 dark:text-slate-400 font-bold">
          {t('noReviewsYet', lang)}
        </div>
      ) : (
        <div className="space-y-4">
          {visibleReviews.map((rev) => {
            const reviewerDisplay = formatReviewerPrivacyName(rev.customerName);
            return (
              <article
                key={rev.id}
                className="p-4 sm:p-5 rounded-[18px] bg-[#F3F5F9] dark:bg-[#0E1527] border border-slate-200/80 dark:border-slate-800 space-y-3.5"
              >
                {/* Top Row: Reviewer First Name + Last Initial, Date, Badges & Stars */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-lg font-extrabold text-[#16213A] dark:text-white">
                      {reviewerDisplay}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                      · {rev.createdAt}
                    </span>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 text-[11px] font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{t('customerConfirmedJobChip', lang)}</span>
                    </span>

                    {rev.isSample && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-900/60 text-[#16213A] dark:text-[#FEB21D] text-[11px] font-extrabold">
                        {t('sampleDataTag', lang)}
                      </span>
                    )}

                    {rev.underReview && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-200 text-[11px] font-extrabold">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{t('underReviewBadge', lang)}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#16213A] text-[#FEB21D] font-extrabold text-sm tabular-nums">
                    <Star className="w-4 h-4 fill-[#FEB21D]" />
                    <span>{rev.overall}.0</span>
                  </div>
                </div>

                {/* Wapas Bulaya & Category Scores Pill Strip */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  {rev.hireAgain && (
                    <span className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                      ↻ {t('wapasBulayaTag', lang)}
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-md bg-white dark:bg-[#17213A] text-slate-700 dark:text-slate-200">
                    {t('crit_quality', lang)}: {rev.ratings.quality}★
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-white dark:bg-[#17213A] text-slate-700 dark:text-slate-200">
                    {t('crit_behaviour', lang)}: {rev.ratings.behaviour}★
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-white dark:bg-[#17213A] text-slate-700 dark:text-slate-200">
                    {t('crit_safety', lang)}: {rev.ratings.safety}★
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-[#16213A] dark:text-[#FEB21D]">
                    {t('crit_womenSafety', lang)}:{' '}
                    {rev.ratings.womenSafety !== null
                      ? `${rev.ratings.womenSafety}★`
                      : t('notApplicableBtn', lang)}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-white dark:bg-[#17213A] text-slate-700 dark:text-slate-200">
                    {t('crit_punctuality', lang)}: {rev.ratings.punctuality}★
                  </span>
                </div>

                {/* Selected Like Tags or Issue Tags */}
                {rev.likeTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {rev.likeTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 text-xs font-bold"
                      >
                        + {getLikeTagLabel(tag, lang)}
                      </span>
                    ))}
                  </div>
                )}

                {rev.issueTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {rev.issueTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 text-xs font-bold"
                      >
                        ! {getIssueTagLabel(tag, lang)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Review Free Text */}
                {rev.text && (
                  <p className="text-sm text-[#16213A] dark:text-slate-100 font-medium leading-relaxed">
                    “{rev.text}”
                  </p>
                )}

                {/* Work Photos (Worker After Photo & Optional Customer Photo) */}
                {(rev.workerPhoto || rev.customerPhoto) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {rev.workerPhoto && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5" />
                          {t('workerPhotoUploadedBadge', lang)}
                        </span>
                        <img
                          src={rev.workerPhoto}
                          alt="Worker completed work proof"
                          className="w-full h-36 object-cover rounded-[12px] border border-slate-300 dark:border-slate-700"
                        />
                      </div>
                    )}
                    {rev.customerPhoto && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-[#EA580C] dark:text-[#FEB21D] flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5" />
                          {t('customerPhotoUploadedBadge', lang)}
                        </span>
                        <img
                          src={rev.customerPhoto}
                          alt="Customer work photo"
                          className="w-full h-36 object-cover rounded-[12px] border border-slate-300 dark:border-slate-700"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Public Worker Reply */}
                {rev.workerReply && (
                  <div className="p-3 rounded-[14px] bg-white dark:bg-[#17213A] border-l-4 border-[#FB8B11] space-y-1">
                    <div className="text-xs font-extrabold text-[#EA580C] dark:text-[#FEB21D]">
                      {t('workerReplyLabel', lang)} ({worker.handle})
                    </div>
                    <p className="text-xs sm:text-sm text-[#16213A] dark:text-slate-200 font-medium">
                      {rev.workerReply}
                    </p>
                  </div>
                )}

                {/* Bottom Actions: Report Review + Worker Reply Option */}
                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setReportingReviewId(reportingReviewId === rev.id ? null : rev.id)
                    }
                    className="text-xs font-bold text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 flex items-center gap-1 cursor-pointer"
                  >
                    <FlagIcon className="w-3.5 h-3.5" />
                    <span>{t('reportReviewBtn', lang)}</span>
                  </button>

                  {canWorkerReply && !rev.workerReply && (
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingReviewId(replyingReviewId === rev.id ? null : rev.id);
                        setReplyDraft('');
                      }}
                      className="text-xs font-bold text-[#EA580C] dark:text-[#FEB21D] flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquareReply className="w-3.5 h-3.5" />
                      <span>{t('workerReplyBtn', lang)}</span>
                    </button>
                  )}
                </div>

                {/* Report Review Reason Picker */}
                {reportingReviewId === rev.id && (
                  <div className="p-3 rounded-[14px] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 space-y-2.5">
                    <div className="flex flex-wrap gap-2">
                      {(['fake', 'abusive', 'wrong_person'] as const).map((rKey) => (
                        <button
                          key={rKey}
                          type="button"
                          onClick={() => setReportReason(rKey)}
                          className={`px-3 py-1.5 rounded-[10px] text-xs font-bold cursor-pointer ${
                            reportReason === rKey
                              ? 'bg-red-700 text-white'
                              : 'bg-white dark:bg-[#17213A] text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                          }`}
                        >
                          {t(`reportReason_${rKey}`, lang)}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setReportingReviewId(null)}
                        className="px-3 py-1.5 rounded-[10px] text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                      >
                        {t('cancelBtn', lang)}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReportReview(rev.id)}
                        className="px-3.5 py-1.5 rounded-[10px] bg-red-700 text-white text-xs font-extrabold cursor-pointer"
                      >
                        {t('reportReviewBtn', lang)}
                      </button>
                    </div>
                  </div>
                )}

                {/* Worker Reply Input Box (max 150 chars) */}
                {replyingReviewId === rev.id && !rev.workerReply && (
                  <div className="p-3 rounded-[14px] bg-white dark:bg-[#17213A] border border-slate-300 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>{t('workerReplyLabel', lang)}</span>
                      <span className="tabular-nums">{replyDraft.length}/150</span>
                    </div>
                    <textarea
                      rows={2}
                      maxLength={150}
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value.slice(0, 150))}
                      placeholder={t('workerReplyPlaceholder', lang)}
                      className="w-full p-2.5 rounded-[10px] bg-[#F3F5F9] dark:bg-[#0E1527] border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-[#16213A] dark:text-white focus:outline-none focus:border-[#FB8B11]"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setReplyingReviewId(null)}
                        className="px-3 py-1.5 rounded-[10px] text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                      >
                        {t('cancelBtn', lang)}
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePostWorkerReply(rev.id)}
                        className="px-4 py-1.5 rounded-[10px] bg-[#16213A] text-white dark:bg-[#FEB21D] dark:text-[#16213A] text-xs font-extrabold cursor-pointer"
                      >
                        {t('postReplyBtn', lang)}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}

          {reviews.length > visibleCount && (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 5)}
              className="w-full min-h-[56px] px-5 py-3 rounded-[16px] bg-[#F3F5F9] dark:bg-[#0E1527] border border-slate-300 dark:border-slate-700 text-[#16213A] dark:text-white font-display font-extrabold text-base hover:border-[#FB8B11] cursor-pointer"
            >
              {t('loadMoreReviewsBtn', lang)} ({reviews.length - visibleCount})
            </button>
          )}
        </div>
      )}
    </div>
  );
};
