import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ShramikLogo } from '../components/ShramikLogo';
import { Language, t } from '../i18n';

interface WelcomeScreenProps {
  lang?: Language;
  hasSavedAccount?: boolean;
  onGetStarted: () => void;
  onExploreWithoutLogin?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  lang = 'en',
  onGetStarted,
  onExploreWithoutLogin,
}) => {
  return (
    <div className="min-h-screen flex flex-col justify-between px-4 py-8 md:py-12 max-w-4xl mx-auto motion-safe:animate-[fadeIn_350ms_ease-out]">
      <div className="flex-1 flex flex-col items-center justify-center text-center my-auto space-y-5">
        {/* a. Shramik logo (large) */}
        <div className="w-full max-w-md bg-white dark:bg-[#17213A] rounded-[20px] p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800">
          <ShramikLogo variant="hero" showHindiTagline={true} />
        </div>

        {/* b. Line: "Welcome to Shramik" (Hindi: "श्रमिक में आपका स्वागत है") */}
        <p className="font-display text-lg sm:text-xl font-bold text-[#16213A] dark:text-slate-200">
          Welcome to Shramik · श्रमिक में आपका स्वागत है
        </p>

        {/* c. Quote in helmet orange #FB8B11, Baloo 2, large */}
        <div className="space-y-1.5 max-w-2xl">
          <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-extrabold text-[#FB8B11] tracking-tight leading-snug">
            “हर हुनर की पहचान, हर मेहनत का सम्मान।”
          </h1>
          {lang === 'en' && (
            <p className="text-sm sm:text-base font-semibold text-slate-600 dark:text-slate-300">
              Every skill recognised, every effort respected.
            </p>
          )}
        </div>

        {/* d. Motto below: "Real Skills. Trusted Work." in navy, smaller */}
        <p className="font-display text-lg sm:text-2xl font-extrabold text-[#16213A] dark:text-white tracking-wide">
          Real Skills. Trusted Work.
        </p>

        {/* e. Gradient "Get Started" button (56px+ tap target) */}
        <div className="w-full max-w-md pt-3 space-y-3">
          <button
            type="button"
            onClick={onGetStarted}
            className="w-full min-h-[60px] px-6 py-3.5 rounded-[18px] bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] font-display text-xl font-extrabold shadow-md hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <span>Get Started · शुरू करें</span>
            <ArrowRight className="w-6 h-6 stroke-[2.5]" aria-hidden="true" />
          </button>

          {onExploreWithoutLogin && (
            <button
              type="button"
              onClick={onExploreWithoutLogin}
              className="w-full min-h-[56px] px-5 py-2.5 rounded-[16px] bg-white dark:bg-[#17213A] border-2 border-[#16213A]/20 dark:border-slate-700 text-[#16213A] dark:text-white font-bold text-sm hover:border-[#FB8B11] transition-colors cursor-pointer"
            >
              {t('exploreWithoutLoginBtn', lang)} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
