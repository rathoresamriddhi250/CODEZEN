import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ShieldCheck,
  BadgeCheck,
} from 'lucide-react';
import {
  GovtIdType,
  Language,
  RateUnit,
  TRADES,
  TradeId,
  getGovtIdLabel,
  getRateUnitLabel,
  getTradeLabel,
  t,
} from '../i18n';
import { GeoLocation, SAMPLE_LOCALITIES } from '../data/store';
import { ShramikLogo } from '../components/ShramikLogo';
import { TradeIcon } from '../components/TradeIcon';
import { LocationSelector } from '../components/LocationSelector';

interface QuickSetupScreenProps {
  lang: Language;
  role: 'worker' | 'customer';
  initialTrade?: TradeId;
  onComplete: (data: {
    role: 'worker' | 'customer';
    name: string;
    trade?: TradeId;
    customTradeName?: string;
    rateAmount?: number;
    rateUnit?: RateUnit;
    govtVerified?: boolean;
    govtIdType?: GovtIdType;
    govtIdNumber?: string;
    location: GeoLocation;
  }) => void;
  onBack: () => void;
}

export const QuickSetupScreen: React.FC<QuickSetupScreenProps> = ({
  lang,
  role,
  initialTrade = 'painter',
  onComplete,
  onBack,
}) => {
  const [name, setName] = useState('');
  const [trade, setTrade] = useState<TradeId>(initialTrade);
  const [customTradeName, setCustomTradeName] = useState('');
  const [rateAmount, setRateAmount] = useState('600');
  const [rateUnit, setRateUnit] = useState<RateUnit>('day');

  // Government Verification State for Worker
  const [govtIdType, setGovtIdType] = useState<GovtIdType>('aadhaar');
  const [govtIdNumber, setGovtIdNumber] = useState('');
  const [govtVerified, setGovtVerified] = useState(false);

  const [location, setLocation] = useState<GeoLocation | undefined>(
    SAMPLE_LOCALITIES[0]
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleVerifyGovtId = () => {
    setErrorMsg(null);
    const cleaned = govtIdNumber.replace(/\s+/g, '');
    if (cleaned.length < 6) {
      setErrorMsg(t('errGovtIdRequired', lang));
      setGovtVerified(false);
      return;
    }
    setGovtVerified(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg(t('errNameRequired', lang));
      return;
    }

    if (role === 'worker') {
      if (trade === 'other' && !customTradeName.trim()) {
        setErrorMsg(t('errCustomTradeRequired', lang));
        return;
      }

      const parsedRate = Number(rateAmount);
      if (!parsedRate || parsedRate <= 0) {
        setErrorMsg(t('errRateRequired', lang));
        return;
      }

      if (!govtVerified || govtIdNumber.replace(/\s+/g, '').length < 6) {
        setErrorMsg(t('errGovtIdRequired', lang));
        return;
      }
    }

    if (!location) {
      setErrorMsg(t('errLocationRequired', lang));
      return;
    }

    onComplete({
      role,
      name: name.trim(),
      trade: role === 'worker' ? trade : undefined,
      customTradeName:
        role === 'worker' && trade === 'other' ? customTradeName.trim() : undefined,
      rateAmount: role === 'worker' ? Number(rateAmount) : undefined,
      rateUnit: role === 'worker' ? rateUnit : undefined,
      govtVerified: role === 'worker' ? govtVerified : undefined,
      govtIdType: role === 'worker' ? govtIdType : undefined,
      govtIdNumber: role === 'worker' ? govtIdNumber.trim() : undefined,
      location,
    });
  };

  return (
    <div className="min-h-screen flex flex-col px-4 py-6 md:py-10 max-w-2xl mx-auto">
      {/* Header */}
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

        <span className="text-xs font-bold text-[#EA580C] dark:text-[#FEB21D] whitespace-nowrap">
          {t('step3Of3', lang)}
        </span>
      </header>

      <main className="flex-1 py-6">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#16213A] dark:text-white mb-6">
          {role === 'worker'
            ? t('quickSetupWorkerTitle', lang)
            : t('quickSetupCustomerTitle', lang)}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name & Trade Card */}
          <div className="bg-white dark:bg-[#17213A] p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 space-y-5">
            <div>
              <label
                htmlFor="setup-name"
                className="block text-base font-bold text-[#16213A] dark:text-white mb-2"
              >
                {t('yourNameLabel', lang)}
              </label>
              <input
                id="setup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('yourNamePlaceholder', lang)}
                className="w-full min-h-[56px] px-4 rounded-[16px] bg-slate-50 dark:bg-[#0E1527] border border-slate-300 dark:border-slate-700 text-lg font-medium text-[#16213A] dark:text-white focus:outline-none focus:border-[#FB8B11]"
              />
            </div>

            {role === 'worker' && (
              <>
                {/* Unique Instagram-Style Worker @handle & Shramik ID Preview */}
                <div className="p-3.5 rounded-[14px] bg-amber-50/80 dark:bg-[#0E1527] border border-[#FEB21D]/60 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {t('workerHandleLabel', lang)}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t('workerHandleHint', lang)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-xs sm:text-sm font-extrabold text-[#EA580C] dark:text-[#FEB21D] bg-white dark:bg-[#17213A] px-2.5 py-1.5 rounded-[10px] border border-[#FEB21D]/40">
                      @{(name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) || 'ramesh')}_{trade}42
                    </span>
                    <span className="font-mono text-xs font-extrabold text-[#16213A] dark:text-white bg-white dark:bg-[#17213A] px-2.5 py-1.5 rounded-[10px] border border-slate-300 dark:border-slate-700">
                      SH-48213
                    </span>
                  </div>
                </div>

                {/* Main Trade Selection (including Others) */}
                <div>
                  <label className="block text-base font-bold text-[#16213A] dark:text-white mb-2.5">
                    {t('mainTradeLabel', lang)}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
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
                              : 'bg-slate-50 dark:bg-[#0E1527] text-[#16213A] dark:text-slate-100 border-slate-200 dark:border-slate-800 hover:border-[#FB8B11]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <TradeIcon
                              trade={tr}
                              className={`w-5 h-5 shrink-0 ${
                                active
                                  ? 'text-[#FEB21D] dark:text-[#16213A]'
                                  : 'text-[#FB8B11]'
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

                {/* Custom Skill Name Input when "Others" is chosen */}
                {trade === 'other' && (
                  <div>
                    <label
                      htmlFor="custom-trade-input"
                      className="block text-base font-bold text-[#16213A] dark:text-white mb-2"
                    >
                      {t('customTradeLabel', lang)}
                    </label>
                    <input
                      id="custom-trade-input"
                      type="text"
                      value={customTradeName}
                      onChange={(e) => setCustomTradeName(e.target.value)}
                      placeholder={t('customTradePlaceholder', lang)}
                      className="w-full min-h-[56px] px-4 rounded-[16px] bg-slate-50 dark:bg-[#0E1527] border border-slate-300 dark:border-slate-700 text-base font-medium text-[#16213A] dark:text-white focus:outline-none focus:border-[#FB8B11]"
                    />
                  </div>
                )}

                {/* Rate Amount + Unit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="setup-rate"
                      className="block text-base font-bold text-[#16213A] dark:text-white mb-2"
                    >
                      {t('rateAmountLabel', lang)}
                    </label>
                    <input
                      id="setup-rate"
                      type="number"
                      min="50"
                      step="10"
                      value={rateAmount}
                      onChange={(e) => setRateAmount(e.target.value)}
                      placeholder={t('rateAmountPlaceholder', lang)}
                      className="w-full min-h-[56px] px-4 rounded-[16px] bg-slate-50 dark:bg-[#0E1527] border border-slate-300 dark:border-slate-700 text-lg font-bold tabular-nums text-[#16213A] dark:text-white focus:outline-none focus:border-[#FB8B11]"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-bold text-[#16213A] dark:text-white mb-2">
                      {t('rateUnitLabel', lang)}
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-[#0E1527] p-1.5 rounded-[16px] min-h-[56px]">
                      {(['hour', 'day', 'job'] as RateUnit[]).map((u) => {
                        const active = rateUnit === u;
                        return (
                          <button
                            key={u}
                            type="button"
                            onClick={() => setRateUnit(u)}
                            className={`rounded-[12px] text-sm font-bold transition-colors whitespace-nowrap cursor-pointer ${
                              active
                                ? 'bg-white dark:bg-[#17213A] text-[#16213A] dark:text-[#FEB21D] shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-[#16213A]'
                            }`}
                          >
                            {getRateUnitLabel(u, lang)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Government ID Verification Section for Worker */}
          {role === 'worker' && (
            <div className="bg-white dark:bg-[#17213A] p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-[14px] bg-[#FEB21D]/20 text-[#EA580C] dark:text-[#FEB21D] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-[#16213A] dark:text-white">
                    {t('govtVerificationTitle', lang)}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {t('govtVerificationSub', lang)}
                  </p>
                </div>
              </div>

              {/* Select Government ID Type */}
              <div>
                <label className="block text-sm font-bold text-[#16213A] dark:text-white mb-2">
                  {t('govtIdTypeLabel', lang)}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(['aadhaar', 'eshram', 'pan_voter'] as GovtIdType[]).map((idType) => {
                    const active = govtIdType === idType;
                    return (
                      <button
                        key={idType}
                        type="button"
                        onClick={() => {
                          setGovtIdType(idType);
                          setGovtVerified(false);
                        }}
                        className={`min-h-[52px] px-3.5 py-2 rounded-[14px] border text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#16213A] text-white border-[#16213A] dark:bg-[#FEB21D] dark:text-[#16213A] dark:border-[#FEB21D]'
                            : 'bg-slate-50 dark:bg-[#0E1527] text-[#16213A] dark:text-slate-200 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <span className="text-xs font-bold">
                          {getGovtIdLabel(idType, lang)}
                        </span>
                        {active && <Check className="w-4 h-4 shrink-0" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ID Number Input + Verify Button */}
              <div>
                <label
                  htmlFor="govt-id-input"
                  className="block text-sm font-bold text-[#16213A] dark:text-white mb-1.5"
                >
                  {t('govtIdNumberLabel', lang)}
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    id="govt-id-input"
                    type="text"
                    value={govtIdNumber}
                    onChange={(e) => {
                      setGovtIdNumber(e.target.value);
                      setGovtVerified(false);
                    }}
                    placeholder={t(`govtIdPlaceholder_${govtIdType}`, lang)}
                    className="flex-1 min-h-[54px] px-4 rounded-[14px] bg-slate-50 dark:bg-[#0E1527] border border-slate-300 dark:border-slate-700 text-base font-bold tabular-nums text-[#16213A] dark:text-white focus:outline-none focus:border-[#FB8B11]"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyGovtId}
                    className={`min-h-[54px] px-5 rounded-[14px] font-bold text-sm flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      govtVerified
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#16213A] text-white dark:bg-[#FEB21D] dark:text-[#16213A]'
                    }`}
                  >
                    <BadgeCheck className="w-5 h-5" aria-hidden="true" />
                    <span>
                      {govtVerified ? t('idVerifiedSuccess', lang) : t('verifyIdBtn', lang)}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Location Card */}
          <div className="bg-white dark:bg-[#17213A] p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800">
            <h2 className="font-display text-xl font-bold text-[#16213A] dark:text-white mb-1">
              {t('locationSectionTitle', lang)}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              {t('locationSectionDesc', lang)}
            </p>
            <LocationSelector
              lang={lang}
              value={location}
              onChange={(loc) => setLocation(loc)}
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
            className="w-full min-h-[60px] px-6 py-3.5 rounded-[18px] bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] font-display text-xl font-extrabold shadow-md hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <span>{t('finishSetupBtn', lang)}</span>
            <ArrowRight className="w-6 h-6 stroke-[2.5]" aria-hidden="true" />
          </button>
        </form>
      </main>
    </div>
  );
};
