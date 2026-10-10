import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Check,
  X,
  FileCheck2,
  Camera,
  Star,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  RotateCcw,
} from 'lucide-react';
import {
  AppUserState,
  Booking,
  BookingStatus,
  WorkerProfile,
  confirmJob,
  createDemoConfirmedBooking,
  createSampleWorkPhotoDataUrl,
  disputeJob,
  markJobCompleteByWorker,
  updateBookingStatus,
} from '../data/store';
import {
  Language,
  getSlotLabel,
  getTradeLabel,
  t,
} from '../i18n';
import { TradeIcon, formatReadableDate } from '../components/TradeIcon';
import { BookingConfirmationModal } from '../components/BookingConfirmationModal';
import { WorkerReviewModal } from '../components/WorkerReviewModal';
import { compressImageFile } from '../utils/image';

interface BookingsScreenProps {
  user: AppUserState;
  lang: Language;
  bookings: Booking[];
  workers: WorkerProfile[];
  onRefresh: () => void;
  onBookWorkerAgain?: (workerId: string) => void;
}

export const BookingsScreen: React.FC<BookingsScreenProps> = ({
  user,
  lang,
  bookings,
  workers,
  onRefresh,
  onBookWorkerAgain,
}) => {
  const [confirmedModalBooking, setConfirmedModalBooking] = useState<Booking | null>(
    null
  );
  const [reviewModalData, setReviewModalData] = useState<{
    booking: Booking;
    worker: WorkerProfile;
  } | null>(null);

  // Per-booking draft photo & consent state
  const [draftPhotos, setDraftPhotos] = useState<Record<string, string>>({});
  const [photoConsents, setPhotoConsents] = useState<Record<string, boolean>>({});
  const [photoErrors, setPhotoErrors] = useState<Record<string, string>>({});

  const isWorkerRole = user.role === 'worker';

  const handleStatusChange = (booking: Booking, nextStatus: BookingStatus) => {
    const updated = updateBookingStatus(booking.id, nextStatus);
    onRefresh();
    if (updated && nextStatus === 'confirmed') {
      setConfirmedModalBooking(updated);
    }
  };

  const handleFileChange = async (
    bookingId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 800, 0.6);
      setDraftPhotos((prev) => ({ ...prev, [bookingId]: compressed }));
      setPhotoErrors((prev) => ({ ...prev, [bookingId]: '' }));
    } catch {
      // ignore invalid file
    }
  };

  const handleAttachSamplePhoto = (bk: Booking) => {
    const sampleUrl = createSampleWorkPhotoDataUrl(
      bk.trade,
      `${getTradeLabel(bk.trade, 'en', bk.customTradeName)} · ${
        isWorkerRole ? 'Worker After Photo' : 'Customer Optional Photo'
      }`
    );
    setDraftPhotos((prev) => ({ ...prev, [bk.id]: sampleUrl }));
    setPhotoErrors((prev) => ({ ...prev, [bk.id]: '' }));
  };

  const handleWorkerMarkJobComplete = (bk: Booking) => {
    const afterPhoto = draftPhotos[bk.id] || bk.workerCompletionPhoto || '';
    const consent = Boolean(photoConsents[bk.id]);

    const res = markJobCompleteByWorker({
      bookingId: bk.id,
      afterPhotoDataUrl: afterPhoto,
      photoConsent: consent,
    });

    if (res.error === 'photo_and_consent_required') {
      setPhotoErrors((prev) => ({
        ...prev,
        [bk.id]: t('errWorkerPhotoRequired', lang),
      }));
      return;
    }

    if (res.error === 'storage_full') {
      setPhotoErrors((prev) => ({
        ...prev,
        [bk.id]: t('storageFullError', lang),
      }));
      return;
    }

    setPhotoErrors((prev) => ({ ...prev, [bk.id]: '' }));
    onRefresh();
  };

  const handleCustomerConfirmJob = (bk: Booking) => {
    const optionalCustomerPhoto = draftPhotos[bk.id] || bk.customerCompletionPhoto;
    const updated = confirmJob(bk.id, optionalCustomerPhoto);
    onRefresh();
    if (updated) {
      const matchedWorker =
        workers.find((w) => w.id === updated.workerId) || workers[0];
      if (matchedWorker && !updated.reviewId) {
        setReviewModalData({ booking: updated, worker: matchedWorker });
      }
    }
  };

  const handleCustomerDisputeJob = (bk: Booking) => {
    disputeJob(bk.id, t('disputeReasonPrompt', lang));
    onRefresh();
  };

  const getStatusText = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return t('statusPending', lang);
      case 'confirmed':
        return t('statusConfirmed', lang);
      case 'waiting_customer_confirmation':
        return t('statusWaitingCustomerConfirmation', lang);
      case 'completed':
        return t('statusCompleted', lang);
      case 'disputed':
        return t('statusDisputed', lang);
      case 'declined':
        return t('statusDeclined', lang);
      case 'cancelled':
        return t('statusCancelled', lang);
    }
  };

  const getStatusColorClass = (status: BookingStatus) => {
    switch (status) {
      case 'completed':
      case 'confirmed':
        return 'text-emerald-700 dark:text-emerald-400';
      case 'waiting_customer_confirmation':
      case 'pending':
        return 'text-[#EA580C] dark:text-[#FEB21D]';
      case 'disputed':
        return 'text-red-600 dark:text-red-400';
      case 'declined':
      case 'cancelled':
        return 'text-slate-500 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#17213A] rounded-[20px] p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#16213A] dark:text-white">
            {t('bookingsTitle', lang)}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {isWorkerRole
              ? t('bookingsSubWorker', lang)
              : t('bookingsSubCustomer', lang)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            createDemoConfirmedBooking();
            onRefresh();
          }}
          className="min-h-[48px] px-4 py-2.5 rounded-[14px] bg-[#F3F5F9] dark:bg-[#0E1527] border border-slate-300 dark:border-slate-700 text-xs font-extrabold text-[#16213A] dark:text-[#FEB21D] hover:border-[#FB8B11] flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-[#FB8B11]" />
          <span>{t('createDemoBookingBtn', lang)}</span>
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white dark:bg-[#17213A] rounded-[20px] p-8 text-center border border-slate-200 dark:border-slate-800">
          <Calendar className="w-10 h-10 text-[#FB8B11] mx-auto mb-3" aria-hidden="true" />
          <p className="text-lg font-bold text-[#16213A] dark:text-white max-w-md mx-auto">
            {t('noBookingsYet', lang)}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookings.map((bk) => {
            const dateInfo = formatReadableDate(bk.date, lang);
            const workerFirst = (lang === 'hi' ? bk.workerNameHi : bk.workerNameEn).split(
              ' '
            )[0];
            const customerFirst = (
              lang === 'hi' ? bk.customerNameHi : bk.customerNameEn
            ).split(' ')[0];

            const needsMyConfirmation =
              bk.status === 'pending' &&
              ((isWorkerRole && bk.startedBy === 'customer') ||
                (!isWorkerRole && bk.startedBy === 'worker'));

            const waitingForOther =
              bk.status === 'pending' &&
              ((isWorkerRole && bk.startedBy === 'worker') ||
                (!isWorkerRole && bk.startedBy === 'customer'));

            const canCustomerCancel =
              !isWorkerRole &&
              (bk.status === 'pending' || bk.status === 'confirmed');

            const matchedWorker =
              workers.find((w) => w.id === bk.workerId) || workers[0];

            const workerAfterPhoto =
              draftPhotos[bk.id] || bk.workerCompletionPhoto || '';
            const workerHasConsent = Boolean(photoConsents[bk.id]);
            const isWorkerMarkBtnDisabled = !workerAfterPhoto || !workerHasConsent;

            return (
              <article
                key={bk.id}
                className="bg-white dark:bg-[#17213A] rounded-[20px] p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  {/* Top status, trade, @handle, Shramik ID & Work Record Chip */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                    <div className="flex flex-wrap items-center gap-1.5 text-[#16213A] dark:text-slate-200">
                      <TradeIcon trade={bk.trade} className="w-4 h-4 text-[#FB8B11]" />
                      <span>{getTradeLabel(bk.trade, lang, bk.customTradeName)}</span>
                      <span className="font-mono text-[#EA580C] dark:text-[#FEB21D]">
                        {bk.workerHandle}
                      </span>
                      {bk.workerShramikId && (
                        <span className="font-mono text-slate-500 dark:text-slate-400">
                          ({bk.workerShramikId})
                        </span>
                      )}
                      {bk.isSample && (
                        <span className="px-2 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900/60 text-[#16213A] dark:text-[#FEB21D] text-[10px] font-extrabold">
                          {t('sampleDataTag', lang)}
                        </span>
                      )}
                    </div>
                    <span className={getStatusColorClass(bk.status)}>
                      {getStatusText(bk.status)}
                    </span>
                  </div>

                  {/* Work Record Verification Chip ("Self-reported" vs "Customer confirmed" vs "Disputed") */}
                  {bk.workRecordStatus && (
                    <div>
                      {bk.workRecordStatus === 'self_reported' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-[#FEB21D] text-xs font-extrabold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{t('chipSelfReported', lang)}</span>
                        </span>
                      )}
                      {bk.workRecordStatus === 'customer_confirmed' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 text-xs font-extrabold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t('chipCustomerConfirmed', lang)}</span>
                        </span>
                      )}
                      {bk.workRecordStatus === 'disputed' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-200 text-xs font-extrabold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{t('chipDisputed', lang)}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Counterparty First Name */}
                  <div>
                    <h2 className="font-display text-2xl font-extrabold text-[#16213A] dark:text-white">
                      {isWorkerRole
                        ? `${t('customerLabel', lang)}: ${customerFirst}`
                        : `${t('roleWorker', lang)}: ${workerFirst}`}
                    </h2>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                      {bk.startedBy === 'customer'
                        ? t('customerRequestedYou', lang)
                        : t('workerOfferedYou', lang)}
                    </p>
                  </div>

                  {/* Date & Slot */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#FB8B11]" aria-hidden="true" />
                        {t('confirmedDateLabel', lang)}:
                      </span>
                      <span className="font-bold text-[#16213A] dark:text-white">
                        {dateInfo.fullLabel}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#FB8B11]" aria-hidden="true" />
                        {t('confirmedSlotLabel', lang)}:
                      </span>
                      <span className="font-bold text-[#EA580C] dark:text-[#FEB21D] tabular-nums">
                        {getSlotLabel(bk.slot, lang)}
                      </span>
                    </div>

                    {bk.note && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 pt-1 italic">
                        “{bk.note}”
                      </p>
                    )}
                  </div>

                  {/* ========================================================== */}
                  {/* WORKER VIEW: Mark Job Complete (Mandatory After Photo)     */}
                  {/* ========================================================== */}
                  {isWorkerRole && bk.status === 'confirmed' && (
                    <div className="p-4 rounded-[16px] bg-[#F3F5F9] dark:bg-[#0E1527] border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="text-xs font-extrabold text-[#16213A] dark:text-white flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-[#FB8B11]" />
                        <span>{t('workerPhotoMandatoryLabel', lang)}</span>
                      </div>

                      {workerAfterPhoto && (
                        <img
                          src={workerAfterPhoto}
                          alt="Worker after work photo"
                          className="w-full h-36 object-cover rounded-[12px] border border-slate-300 dark:border-slate-700"
                        />
                      )}

                      <div className="flex flex-wrap gap-2">
                        <label className="min-h-[46px] px-3.5 py-2 rounded-[12px] bg-white dark:bg-[#17213A] border border-slate-300 dark:border-slate-700 text-xs font-bold text-[#16213A] dark:text-white flex items-center gap-1.5 cursor-pointer hover:border-[#FB8B11]">
                          <Camera className="w-4 h-4 text-[#FB8B11]" />
                          <span>{t('uploadWorkPhotoBtn', lang)}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(bk.id, e)}
                            className="hidden"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => handleAttachSamplePhoto(bk)}
                          className="min-h-[46px] px-3.5 py-2 rounded-[12px] bg-[#FEB21D]/20 text-[#16213A] dark:text-[#FEB21D] text-xs font-bold cursor-pointer hover:bg-[#FEB21D]/30"
                        >
                          {t('captureDemoPhotoBtn', lang)}
                        </button>
                      </div>

                      {/* Mandatory Photo Consent Checkbox */}
                      <label className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={workerHasConsent}
                          onChange={(e) =>
                            setPhotoConsents((prev) => ({
                              ...prev,
                              [bk.id]: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 mt-0.5 accent-[#FB8B11] shrink-0"
                        />
                        <span>{t('photoConsentLabel', lang)}</span>
                      </label>

                      {photoErrors[bk.id] && (
                        <div className="p-2.5 rounded-[10px] bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 text-xs font-bold flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{photoErrors[bk.id]}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={isWorkerMarkBtnDisabled}
                        onClick={() => handleWorkerMarkJobComplete(bk)}
                        className="w-full min-h-[56px] px-4 py-3 rounded-[16px] bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] font-display text-base font-extrabold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {t('markWorkCompletedBtn', lang)}
                      </button>
                    </div>
                  )}

                  {/* ========================================================== */}
                  {/* CUSTOMER VIEW: Confirm Job or Dispute ("Waiting for customer confirmation") */}
                  {/* ========================================================== */}
                  {!isWorkerRole &&
                    (bk.status === 'waiting_customer_confirmation' ||
                      bk.status === 'confirmed') && (
                      <div className="p-4 rounded-[16px] bg-[#F3F5F9] dark:bg-[#0E1527] border-2 border-[#FEB21D]/70 space-y-3.5">
                        <div>
                          <h3 className="font-display text-lg font-extrabold text-[#16213A] dark:text-white">
                            {t('confirmJobTitle', lang)}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            {t('confirmJobSub', lang)}
                          </p>
                        </div>

                        {bk.workerCompletionPhoto && (
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                              {t('workerPhotoUploadedBadge', lang)} ({t('chipSelfReported', lang)})
                            </span>
                            <img
                              src={bk.workerCompletionPhoto}
                              alt="Worker after work photo"
                              className="w-full h-40 object-cover rounded-[12px] border border-slate-300 dark:border-slate-700"
                            />
                          </div>
                        )}

                        {/* Optional Customer Photo */}
                        <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                          <span className="text-xs font-bold text-[#16213A] dark:text-white block">
                            {t('customerPhotoOptionalLabel', lang)}
                          </span>

                          {(draftPhotos[bk.id] || bk.customerCompletionPhoto) && (
                            <img
                              src={draftPhotos[bk.id] || bk.customerCompletionPhoto}
                              alt="Customer optional photo"
                              className="w-full h-32 object-cover rounded-[10px] border border-slate-300 dark:border-slate-700"
                            />
                          )}

                          <div className="flex flex-wrap gap-2">
                            <label className="min-h-[42px] px-3 py-1.5 rounded-[12px] bg-white dark:bg-[#17213A] border border-slate-300 dark:border-slate-700 text-xs font-bold text-[#16213A] dark:text-white flex items-center gap-1.5 cursor-pointer hover:border-[#FB8B11]">
                              <Camera className="w-3.5 h-3.5 text-[#FB8B11]" />
                              <span>{t('uploadWorkPhotoBtn', lang)}</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(bk.id, e)}
                                className="hidden"
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => handleAttachSamplePhoto(bk)}
                              className="min-h-[42px] px-3 py-1.5 rounded-[12px] bg-[#FEB21D]/20 text-[#16213A] dark:text-[#FEB21D] text-xs font-bold cursor-pointer"
                            >
                              {t('captureDemoPhotoBtn', lang)}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          <button
                            type="button"
                            onClick={() => handleCustomerConfirmJob(bk)}
                            className="min-h-[56px] px-4 py-2.5 rounded-[16px] bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] font-display text-base font-extrabold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Check className="w-5 h-5 stroke-[2.5]" />
                            <span>{t('confirmJobBtn', lang)}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCustomerDisputeJob(bk)}
                            className="min-h-[56px] px-3 py-2.5 rounded-[16px] border-2 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                          >
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{t('customerSaysNotDoneBtn', lang)}</span>
                          </button>
                        </div>
                      </div>
                    )}

                  {/* Show Saved Photos on Completed / Waiting / Disputed Cards */}
                  {(bk.status === 'completed' ||
                    (isWorkerRole && bk.status === 'waiting_customer_confirmation')) &&
                    (bk.workerCompletionPhoto || bk.customerCompletionPhoto) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                        {bk.workerCompletionPhoto && (
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                              {t('workerPhotoUploadedBadge', lang)}
                            </span>
                            <img
                              src={bk.workerCompletionPhoto}
                              alt="Worker after work proof"
                              className="w-full h-32 object-cover rounded-[10px] border border-slate-300 dark:border-slate-700"
                            />
                          </div>
                        )}
                        {bk.customerCompletionPhoto && (
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-[#EA580C] dark:text-[#FEB21D]">
                              {t('customerPhotoUploadedBadge', lang)}
                            </span>
                            <img
                              src={bk.customerCompletionPhoto}
                              alt="Customer work view"
                              className="w-full h-32 object-cover rounded-[10px] border border-slate-300 dark:border-slate-700"
                            />
                          </div>
                        )}
                      </div>
                    )}
                </div>

                {/* Action Controls */}
                <div className="space-y-2.5 pt-1">
                  {needsMyConfirmation && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(bk, 'confirmed')}
                        className="min-h-[56px] px-4 py-2.5 rounded-[16px] bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] font-display text-base font-extrabold flex items-center justify-center gap-1.5 shadow-sm hover:brightness-105 cursor-pointer"
                      >
                        <Check className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
                        <span>{t('acceptBtn', lang)}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(bk, 'declined')}
                        className="min-h-[56px] px-4 py-2.5 rounded-[16px] border-2 border-slate-300 dark:border-slate-700 text-[#16213A] dark:text-slate-200 font-bold text-base flex items-center justify-center gap-1.5 hover:border-red-500 hover:text-red-600 cursor-pointer"
                      >
                        <X className="w-5 h-5" aria-hidden="true" />
                        <span>{t('declineBtn', lang)}</span>
                      </button>
                    </div>
                  )}

                  {waitingForOther && (
                    <div className="min-h-[52px] px-4 py-2.5 rounded-[14px] bg-[#F3F5F9] dark:bg-[#0E1527] text-slate-700 dark:text-slate-300 text-sm font-bold flex items-center justify-center">
                      {isWorkerRole
                        ? t('waitingForCustomer', lang)
                        : t('waitingForWorker', lang)}
                    </div>
                  )}

                  {/* Customer 5-Star Review Button (Enabled after customer confirms job) */}
                  {!isWorkerRole && bk.status === 'completed' && matchedWorker && (
                    <button
                      type="button"
                      disabled={Boolean(bk.reviewId)}
                      onClick={() =>
                        setReviewModalData({ booking: bk, worker: matchedWorker })
                      }
                      className="w-full min-h-[56px] px-4 py-2.5 rounded-[16px] bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] font-display font-extrabold text-base flex items-center justify-center gap-2 shadow-xs disabled:opacity-60 cursor-pointer"
                    >
                      <Star className="w-5 h-5 fill-[#16213A]" />
                      <span>
                        {bk.reviewId
                          ? t('alreadyReviewedBadge', lang)
                          : t('rateWorkerBtn', lang)}
                      </span>
                    </button>
                  )}

                  {(bk.status === 'confirmed' || bk.status === 'completed') && (
                    <button
                      type="button"
                      onClick={() => setConfirmedModalBooking(bk)}
                      className="w-full min-h-[48px] px-4 py-2 rounded-[14px] bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FileCheck2 className="w-4 h-4" aria-hidden="true" />
                      <span>{t('viewConfirmationBtn', lang)}</span>
                    </button>
                  )}

                  {canCustomerCancel && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(bk, 'cancelled')}
                      className="w-full min-h-[48px] px-4 py-2 rounded-[14px] text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    >
                      {t('cancelBookingBtn', lang)}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {confirmedModalBooking && (
        <BookingConfirmationModal
          booking={confirmedModalBooking}
          lang={lang}
          onClose={() => setConfirmedModalBooking(null)}
        />
      )}

      {reviewModalData && (
        <WorkerReviewModal
          worker={reviewModalData.worker}
          booking={reviewModalData.booking}
          customerId={user.customerId}
          customerName={user.customerName || user.workerName || 'Priya S.'}
          lang={lang}
          onClose={() => setReviewModalData(null)}
          onSubmitted={onRefresh}
        />
      )}
    </div>
  );
};
