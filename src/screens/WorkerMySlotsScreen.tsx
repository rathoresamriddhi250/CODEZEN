import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Check, Ban } from 'lucide-react';
import {
  AppUserState,
  WorkerProfile,
  getNext11Days,
  getWorkerSlotBookingState,
  isSlotInPast,
  setWorkerDayUnavailable,
  toggleWorkerSlotAvailability,
} from '../data/store';
import { Language, TIME_SLOTS, TimeSlotId, t } from '../i18n';
import { formatReadableDate } from '../components/TradeIcon';

interface WorkerMySlotsScreenProps {
  user: AppUserState;
  workerProfile?: WorkerProfile;
  lang: Language;
  onRefresh: () => void;
}

export const WorkerMySlotsScreen: React.FC<WorkerMySlotsScreenProps> = ({
  user,
  workerProfile,
  lang,
  onRefresh,
}) => {
  const next11Days = useMemo(() => getNext11Days(), []);
  const [selectedDate, setSelectedDate] = useState<string>(next11Days[0]);

  const activeSlotsForDay: TimeSlotId[] =
    workerProfile?.availability?.[selectedDate] || [];
  const isDayMarkedUnavailable = Boolean(
    workerProfile?.unavailableDays?.[selectedDate]
  );

  const handleToggleSlot = (slotId: TimeSlotId) => {
    toggleWorkerSlotAvailability(user.workerId, selectedDate, slotId);
    onRefresh();
  };

  const handleToggleDayUnavailable = () => {
    setWorkerDayUnavailable(user.workerId, selectedDate, !isDayMarkedUnavailable);
    onRefresh();
  };

  const selectedDateInfo = formatReadableDate(selectedDate, lang);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#17213A] rounded-[20px] p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-5">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#16213A] dark:text-white">
            {t('mySlotsTitle', lang)}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {t('mySlotsSub', lang)}
          </p>
        </div>

        {/* Today + Next 10 Days Horizontal Strip */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#FB8B11]" aria-hidden="true" />
              <strong className="text-[#16213A] dark:text-white">
                {selectedDateInfo.fullLabel}
              </strong>
            </span>
            <span>{t('slotsSavedHint', lang)}</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {next11Days.map((dIso) => {
              const info = formatReadableDate(dIso, lang);
              const isSelected = selectedDate === dIso;
              const daySlots = workerProfile?.availability?.[dIso] || [];
              const dayOff = Boolean(workerProfile?.unavailableDays?.[dIso]);
              const openCount = dayOff ? 0 : daySlots.length;

              return (
                <button
                  key={dIso}
                  type="button"
                  onClick={() => setSelectedDate(dIso)}
                  className={`min-h-[72px] min-w-[78px] py-2 px-2.5 rounded-[16px] border flex flex-col items-center justify-between shrink-0 transition-all cursor-pointer ${
                    isSelected
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
                  <span
                    className={`text-[10px] font-bold tabular-nums ${
                      isSelected
                        ? 'text-[#FEB21D] dark:text-[#16213A]'
                        : openCount > 0
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {openCount}/6
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* "I'm not available on this day" Switch */}
        <div className="p-4 rounded-[18px] bg-[#F3F5F9] dark:bg-[#0E1527] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Ban
              className={`w-5 h-5 shrink-0 ${
                isDayMarkedUnavailable
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-slate-400'
              }`}
              aria-hidden="true"
            />
            <div>
              <div className="text-base font-bold text-[#16213A] dark:text-white">
                {t('notAvailableTodayLabel', lang)}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {t('notAvailableTodaySub', lang)} ({selectedDateInfo.fullLabel})
              </div>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isDayMarkedUnavailable}
            onClick={handleToggleDayUnavailable}
            className={`min-h-[44px] min-w-[74px] px-2 rounded-full flex items-center transition-colors cursor-pointer ${
              isDayMarkedUnavailable
                ? 'bg-red-600 justify-end'
                : 'bg-slate-300 dark:bg-slate-700 justify-start'
            }`}
          >
            <span className="w-7 h-7 rounded-full bg-white shadow-sm block" />
          </button>
        </div>

        {/* 6 Time Slots Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {TIME_SLOTS.map((slot) => {
            const past = isSlotInPast(selectedDate, slot.id);
            const bookingState = getWorkerSlotBookingState(
              user.workerId,
              selectedDate,
              slot.id
            );
            const isAvailable =
              !isDayMarkedUnavailable && activeSlotsForDay.includes(slot.id);
            const isLocked = past || bookingState !== 'free';

            let statusText = isAvailable
              ? t('slotAvailable', lang)
              : t('slotOff', lang);
            if (past) statusText = t('slotPast', lang);
            if (bookingState === 'confirmed') statusText = t('slotBooked', lang);
            if (bookingState === 'pending') statusText = t('slotRequested', lang);

            return (
              <button
                key={slot.id}
                type="button"
                disabled={isLocked}
                onClick={() => handleToggleSlot(slot.id)}
                className={`min-h-[72px] p-4 rounded-[18px] border-2 text-left flex items-center justify-between gap-3 transition-all ${
                  isLocked
                    ? 'bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    : isAvailable
                    ? 'bg-white dark:bg-[#17213A] border-[#FB8B11] text-[#16213A] dark:text-white shadow-sm cursor-pointer'
                    : 'bg-[#F3F5F9] dark:bg-[#0E1527] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400 cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 text-base font-extrabold tabular-nums">
                    <Clock
                      className={`w-4 h-4 shrink-0 ${
                        isAvailable && !isLocked ? 'text-[#FB8B11]' : 'text-slate-400'
                      }`}
                      aria-hidden="true"
                    />
                    <span>{lang === 'hi' ? slot.labelHi : slot.labelEn}</span>
                  </div>
                  <div className="text-xs font-semibold mt-1">{statusText}</div>
                </div>

                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    bookingState === 'confirmed'
                      ? 'bg-emerald-600 text-white'
                      : isAvailable && !isLocked
                      ? 'bg-[#FB8B11] text-[#16213A]'
                      : 'border border-slate-300 dark:border-slate-700 text-transparent'
                  }`}
                >
                  <Check className="w-5 h-5 stroke-[3]" aria-hidden="true" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
