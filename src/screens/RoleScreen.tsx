import React from 'react';
import { Hammer, UserCheck, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Language, t } from '../i18n';
import { ShramikLogo } from '../components/ShramikLogo';

interface RoleScreenProps {
  lang: Language;
  selectedRole?: 'worker' | 'customer';
  onSelectRole: (role: 'worker' | 'customer') => void;
  onContinue: () => void;
  onBack: () => void;
}

export const RoleScreen: React.FC<RoleScreenProps> = ({
  lang,
  selectedRole,
  onSelectRole,
  onContinue,
  onBack,
}) => {
  return (
    <div className="min-h-screen flex flex-col justify-between px-4 py-6 md:py-10 max-w-2xl mx-auto">
      {/* Top Bar with Back & Step Indicator 2/2 */}
      <header className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[48px] min-w-[48px] px-3 rounded-[16px] flex items-center gap-2 text-sm font-semibold text-[#16213A] dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          <span>{t('backBtn', lang)}</span>
        </button>

        <ShramikLogo variant="compact" />

        <div className="text-sm font-bold text-[#EA580C] dark:text-[#FEB21D] tabular-nums whitespace-nowrap">
          {t('step2Of2', lang)}
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center py-8">
        <div className="mb-8 text-center sm:text-left">
          <p className="text-sm font-semibold text-[#EA580C] dark:text-[#FEB21D] mb-1">
            {t('step2Of2', lang)}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#16213A] dark:text-white mb-2">
            {t('whoAreYou', lang)}
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300">
            {t('whoAreYouSub', lang)}
          </p>
        </div>

        {/* Two Big Role Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* Worker Card */}
          <button
            type="button"
            onClick={() => onSelectRole('worker')}
            aria-pressed={selectedRole === 'worker'}
            className={`min-h-[180px] p-6 rounded-[20px] border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
              selectedRole === 'worker'
                ? 'bg-white dark:bg-[#17213A] border-[#FB8B11] ring-2 ring-[#FB8B11]/30 shadow-md'
                : 'bg-white dark:bg-[#17213A] border-slate-200 dark:border-slate-800 hover:border-[#FEB21D]'
            }`}
          >
            <div className="flex items-start justify-between w-full">
              <div className="w-12 h-12 rounded-[14px] bg-[#FEB21D]/20 text-[#EA580C] dark:text-[#FEB21D] flex items-center justify-center">
                <Hammer className="w-6 h-6" aria-hidden="true" />
              </div>
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  selectedRole === 'worker'
                    ? 'bg-[#FB8B11] text-[#16213A]'
                    : 'border border-slate-300 dark:border-slate-700 text-transparent'
                }`}
              >
                <Check className="w-5 h-5 stroke-[3]" aria-hidden="true" />
              </span>
            </div>

            <div className="mt-4">
              <h2 className="font-display text-2xl font-extrabold text-[#16213A] dark:text-white">
                {t('imAWorker', lang)}
              </h2>
              <p className="text-sm font-medium text-[#EA580C] dark:text-[#FEB21D] mb-1">
                {lang === 'hi' ? 'Worker · श्रमिक' : 'श्रमिक'}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {t('imAWorkerDesc', lang)}
              </p>
            </div>
          </button>

          {/* Customer Card */}
          <button
            type="button"
            onClick={() => onSelectRole('customer')}
            aria-pressed={selectedRole === 'customer'}
            className={`min-h-[180px] p-6 rounded-[20px] border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
              selectedRole === 'customer'
                ? 'bg-white dark:bg-[#17213A] border-[#FB8B11] ring-2 ring-[#FB8B11]/30 shadow-md'
                : 'bg-white dark:bg-[#17213A] border-slate-200 dark:border-slate-800 hover:border-[#FEB21D]'
            }`}
          >
            <div className="flex items-start justify-between w-full">
              <div className="w-12 h-12 rounded-[14px] bg-[#16213A]/10 dark:bg-slate-800 text-[#16213A] dark:text-[#FEB21D] flex items-center justify-center">
                <UserCheck className="w-6 h-6" aria-hidden="true" />
              </div>
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  selectedRole === 'customer'
                    ? 'bg-[#FB8B11] text-[#16213A]'
                    : 'border border-slate-300 dark:border-slate-700 text-transparent'
                }`}
              >
                <Check className="w-5 h-5 stroke-[3]" aria-hidden="true" />
              </span>
            </div>

            <div className="mt-4">
              <h2 className="font-display text-2xl font-extrabold text-[#16213A] dark:text-white">
                {t('imACustomer', lang)}
              </h2>
              <p className="text-sm font-medium text-[#EA580C] dark:text-[#FEB21D] mb-1">
                {lang === 'hi' ? 'Customer · ग्राहक' : 'ग्राहक'}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {t('imACustomerDesc', lang)}
              </p>
            </div>
          </button>
        </div>

        {/* Continue Button */}
        <button
          type="button"
          disabled={!selectedRole}
          onClick={onContinue}
          className={`w-full min-h-[58px] px-6 py-3.5 rounded-[18px] font-display text-xl font-extrabold flex items-center justify-center gap-3 transition-all ${
            selectedRole
              ? 'bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] shadow-md hover:brightness-105 active:scale-[0.99] cursor-pointer'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
          }`}
        >
          <span>{t('continueBtn', lang)}</span>
          <ArrowRight className="w-6 h-6 stroke-[2.5]" aria-hidden="true" />
        </button>
      </main>
    </div>
  );
};
