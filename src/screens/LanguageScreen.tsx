import React from 'react';
import { Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { Language, t } from '../i18n';
import { ShramikLogo } from '../components/ShramikLogo';

interface LanguageScreenProps {
  selectedLanguage?: Language;
  onSelectLanguage: (lang: Language) => void;
  onContinue: () => void;
  onBack: () => void;
}

export const LanguageScreen: React.FC<LanguageScreenProps> = ({
  selectedLanguage,
  onSelectLanguage,
  onContinue,
  onBack,
}) => {
  const activeLang: Language = selectedLanguage || 'en';

  return (
    <div className="min-h-screen flex flex-col justify-between px-4 py-6 md:py-10 max-w-2xl mx-auto">
      {/* Top Bar with Back & Step Indicator 1/2 */}
      <header className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[48px] min-w-[48px] px-3 rounded-[16px] flex items-center gap-2 text-sm font-semibold text-[#16213A] dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          <span>{selectedLanguage ? t('backBtn', activeLang) : 'Back · पीछे'}</span>
        </button>

        <ShramikLogo variant="compact" />

        <div className="text-sm font-bold text-[#EA580C] dark:text-[#FEB21D] tabular-nums whitespace-nowrap">
          {selectedLanguage ? t('step1Of2', activeLang) : '1 / 2'}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center py-8">
        <div className="mb-8 text-center sm:text-left">
          <p className="text-sm font-semibold text-[#EA580C] dark:text-[#FEB21D] mb-1">
            {selectedLanguage ? t('step1Of2', activeLang) : 'Step 1 of 2 · चरण 1 / 2'}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#16213A] dark:text-white mb-2">
            {selectedLanguage
              ? t('chooseLanguageTitle', activeLang)
              : 'अपनी भाषा चुनें · Choose your language'}
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300">
            {selectedLanguage
              ? t('chooseLanguageSub', activeLang)
              : 'आप इसे बाद में कभी भी बदल सकते हैं · You can change this anytime.'}
          </p>
        </div>

        {/* Two Big Language Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* Hindi Card */}
          <button
            type="button"
            onClick={() => onSelectLanguage('hi')}
            aria-pressed={selectedLanguage === 'hi'}
            className={`min-h-[140px] p-6 rounded-[20px] border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
              selectedLanguage === 'hi'
                ? 'bg-white dark:bg-[#17213A] border-[#FB8B11] ring-2 ring-[#FB8B11]/30 shadow-md'
                : 'bg-white dark:bg-[#17213A] border-slate-200 dark:border-slate-800 hover:border-[#FEB21D]'
            }`}
          >
            <div className="flex items-start justify-between w-full">
              <span className="font-display text-3xl sm:text-4xl font-extrabold text-[#16213A] dark:text-white">
                हिन्दी
              </span>
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  selectedLanguage === 'hi'
                    ? 'bg-[#FB8B11] text-[#16213A]'
                    : 'border border-slate-300 dark:border-slate-700 text-transparent'
                }`}
              >
                <Check className="w-5 h-5 stroke-[3]" aria-hidden="true" />
              </span>
            </div>
            <div className="text-base font-medium text-slate-600 dark:text-slate-300 mt-4">
              सरल हिन्दी में ऐप का उपयोग करें
            </div>
          </button>

          {/* English Card */}
          <button
            type="button"
            onClick={() => onSelectLanguage('en')}
            aria-pressed={selectedLanguage === 'en'}
            className={`min-h-[140px] p-6 rounded-[20px] border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
              selectedLanguage === 'en'
                ? 'bg-white dark:bg-[#17213A] border-[#FB8B11] ring-2 ring-[#FB8B11]/30 shadow-md'
                : 'bg-white dark:bg-[#17213A] border-slate-200 dark:border-slate-800 hover:border-[#FEB21D]'
            }`}
          >
            <div className="flex items-start justify-between w-full">
              <span className="font-display text-3xl sm:text-4xl font-extrabold text-[#16213A] dark:text-white">
                English
              </span>
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  selectedLanguage === 'en'
                    ? 'bg-[#FB8B11] text-[#16213A]'
                    : 'border border-slate-300 dark:border-slate-700 text-transparent'
                }`}
              >
                <Check className="w-5 h-5 stroke-[3]" aria-hidden="true" />
              </span>
            </div>
            <div className="text-base font-medium text-slate-600 dark:text-slate-300 mt-4">
              Use the app in simple English
            </div>
          </button>
        </div>

        {/* Continue Button */}
        <button
          type="button"
          disabled={!selectedLanguage}
          onClick={onContinue}
          className={`w-full min-h-[58px] px-6 py-3.5 rounded-[18px] font-display text-xl font-extrabold flex items-center justify-center gap-3 transition-all ${
            selectedLanguage
              ? 'bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] shadow-md hover:brightness-105 active:scale-[0.99] cursor-pointer'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
          }`}
        >
          <span>{selectedLanguage ? t('continueBtn', activeLang) : 'Continue · आगे बढ़ें'}</span>
          <ArrowRight className="w-6 h-6 stroke-[2.5]" aria-hidden="true" />
        </button>
      </main>
    </div>
  );
};
