import React from 'react';
import { CheckCircle2, Calendar, Clock, ShieldCheck } from 'lucide-react';
import { Booking } from '../data/store';
import { Language, getSlotLabel, getTradeLabel, t } from '../i18n';
import { TradeIcon, formatReadableDate } from './TradeIcon';

interface BookingConfirmationModalProps {
  booking: Booking;
  lang: Language;
  onClose: () => void;
}

export const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
  booking,
  lang,
  onClose,
}) => {
  const dateInfo = formatReadableDate(booking.date, lang);
  const workerFirstName = (lang === 'hi' ? booking.workerNameHi : booking.workerNameEn).split(' ')[0];
  const customerFirstName = (lang === 'hi' ? booking.customerNameHi : booking.customerNameEn).split(' ')[0];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-white dark:bg-[#17213A] rounded-t-[24px] sm:rounded-[20px] p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
        {/* Top Grab Handle on Mobile */}
        <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-5 sm:hidden" />

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-10 h-10" aria-hidden="true" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#16213A] dark:text-white">
            {t('confirmationHeading', lang)}
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300 mt-1">
            {t('confirmationSub', lang)}
          </p>
        </div>

        {/* Details Box */}
        <div className="bg-[#F3F5F9] dark:bg-[#0E1527] rounded-[18px] p-4 space-y-3.5 border border-slate-200/80 dark:border-slate-800 mb-5">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#FB8B11]" aria-hidden="true" />
              {t('confirmedDateLabel', lang)}
            </span>
            <span className="text-base font-bold text-[#16213A] dark:text-white">
              {dateInfo.fullLabel}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#FB8B11]" aria-hidden="true" />
              {t('confirmedSlotLabel', lang)}
            </span>
            <span className="text-base font-bold text-[#EA580C] dark:text-[#FEB21D] tabular-nums">
              {getSlotLabel(booking.slot, lang)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <TradeIcon trade={booking.trade} className="w-4 h-4 text-[#FB8B11]" />
              {t('confirmedTradeLabel', lang)}
            </span>
            <span className="text-base font-bold text-[#16213A] dark:text-white">
              {getTradeLabel(booking.trade, lang, booking.customTradeName)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {t('confirmedWorkerLabel', lang)}
            </span>
            <span className="text-base font-bold text-[#16213A] dark:text-white">
              {workerFirstName}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {t('confirmedCustomerLabel', lang)}
            </span>
            <span className="text-base font-bold text-[#16213A] dark:text-white">
              {customerFirstName}
            </span>
          </div>
        </div>

        {/* Privacy Notice (No phone numbers or exact addresses) */}
        <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#0E1527]/70 p-3 rounded-[14px] mb-5">
          <ShieldCheck className="w-4 h-4 text-[#FB8B11] shrink-0 mt-0.5" aria-hidden="true" />
          <span>{t('privacyNotice', lang)}</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-[56px] px-6 py-3 rounded-[16px] bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] font-display text-lg font-extrabold shadow-sm hover:brightness-105 cursor-pointer"
        >
          {t('closeConfirmationBtn', lang)}
        </button>
      </div>
    </div>
  );
};
