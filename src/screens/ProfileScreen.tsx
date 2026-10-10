import React, { useState, useMemo } from 'react';
import {
  Check,
  RefreshCw,
  ArrowLeftRight,
  Globe,
  CheckCircle2,
  ShieldCheck,
  BadgeCheck,
  LogOut,
  Flag as FlagIcon,
} from 'lucide-react';
import {
  AppUserState,
  GeoLocation,
  getWorkers,
  listFlags,
  logoutUser,
  resetDemoData,
  setLanguage,
  switchRoleForDemo,
  updateProfile,
} from '../data/store';
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
import { TradeIcon } from '../components/TradeIcon';
import { LocationSelector } from '../components/LocationSelector';
import { WorkerReviewsSection } from '../components/WorkerReviewsSection';
import { UstadGawahiSection } from '../components/UstadGawahiSection';
import { WorkerCertificateCard } from '../components/WorkerCertificateCard';

interface ProfileScreenProps {
  user: AppUserState;
  lang: Language;
  onRefresh: () => void;
  onRoleSwitched: () => void;
  onLoggedOut: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  lang,
  onRefresh,
  onRoleSwitched,
  onLoggedOut,
}) => {
  const isWorker = user.role === 'worker';
  const [name, setName] = useState(
    isWorker ? user.workerName || user.customerName : user.customerName || user.workerName
  );
  const [trade, setTrade] = useState<TradeId>(user.workerTrade || 'painter');
  const [customTradeName, setCustomTradeName] = useState(
    user.workerCustomTrade || ''
  );
  const [rateAmount, setRateAmount] = useState(String(user.workerRateAmount || 600));
  const [rateUnit, setRateUnit] = useState<RateUnit>(user.workerRateUnit || 'day');

  // Government Verification State
  const [govtIdType, setGovtIdType] = useState<GovtIdType>(
    user.workerGovtIdType || 'aadhaar'
  );
  const [govtIdNumber, setGovtIdNumber] = useState(user.workerGovtIdNumber || '');
  const [govtVerified, setGovtVerified] = useState<boolean>(
    Boolean(user.workerGovtVerified)
  );

  const [location, setLocation] = useState<GeoLocation | undefined>(user.location);
  const [feedback, setFeedback] = useState<string | null>(null);

  const workers = useMemo(() => getWorkers(), [user]);
  const myWorkerProfile = useMemo(
    () => workers.find((w) => w.id === user.workerId) || workers[0],
    [workers, user.workerId]
  );
  const flags = useMemo(() => listFlags(), [user, feedback]);

  const handleVerifyGovtId = () => {
    const cleaned = govtIdNumber.replace(/\s+/g, '');
    if (cleaned.length < 4) {
      setGovtVerified(false);
      return;
    }
    setGovtVerified(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateProfile({
      name: name.trim(),
      trade: isWorker ? trade : undefined,
      customTradeName: isWorker && trade === 'other' ? customTradeName : '',
      rateAmount: isWorker ? Number(rateAmount) || 600 : undefined,
      rateUnit: isWorker ? rateUnit : undefined,
      govtVerified: isWorker ? govtVerified : undefined,
      govtIdType: isWorker ? govtIdType : undefined,
      govtIdNumber: isWorker ? govtIdNumber : undefined,
      location,
    });
    setFeedback(t('profileSavedMsg', lang));
    onRefresh();
  };

  const handleChangeLanguage = (nextLang: Language) => {
    setLanguage(nextLang);
    onRefresh();
  };

  const handleSwitchView = () => {
    switchRoleForDemo();
    onRefresh();
    onRoleSwitched();
  };

  const handleResetDemo = () => {
    resetDemoData();
    setFeedback(t('resetDemoDataConfirm', lang));
    onRefresh();
  };

  const handleLogout = () => {
    logoutUser();
    onRefresh();
    onLoggedOut();
  };

  return (
    <div className="space-y-6">
      {/* Header & Language Switcher Card */}
      <div className="bg-white dark:bg-[#17213A] rounded-[20px] p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[#EA580C] dark:text-[#FEB21D]">
                {t('roleLabel', lang)}:{' '}
                {isWorker ? t('roleWorker', lang) : t('roleCustomer', lang)}
              </span>
              {isWorker && (
                <>
                  <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-[#16213A] text-[#FEB21D]">
                    {user.workerHandle || '@shramik_painter42'}
                  </span>
                  <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-amber-50 dark:bg-[#0E1527] text-[#EA580C] dark:text-[#FEB21D] border border-[#FEB21D]/50">
                    {user.workerShramikId || 'SH-48299'}
                  </span>
                </>
              )}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#16213A] dark:text-white">
              {t('profileTitle', lang)}
            </h1>
          </div>

          {/* Prominent Log Out Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="min-h-[48px] px-4 py-2.5 rounded-[14px] border-2 border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/30 text-red-700 dark:text-red-300 font-bold text-sm flex items-center justify-center gap-2 hover:border-red-500 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span>{t('logoutBtn', lang)}</span>
          </button>
        </div>

        {feedback && (
          <div className="p-4 rounded-[16px] bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold text-sm flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Instant Language Switcher */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="block text-base font-bold text-[#16213A] dark:text-white mb-2.5 flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#FB8B11]" aria-hidden="true" />
            <span>{t('languageSettingLabel', lang)}</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleChangeLanguage('hi')}
              className={`min-h-[56px] px-4 rounded-[16px] border-2 font-display text-lg font-extrabold flex items-center justify-between transition-colors cursor-pointer ${
                lang === 'hi'
                  ? 'bg-[#16213A] text-white border-[#16213A] dark:bg-[#FEB21D] dark:text-[#16213A] dark:border-[#FEB21D]'
                  : 'bg-[#F3F5F9] dark:bg-[#0E1527] text-[#16213A] dark:text-slate-200 border-slate-200 dark:border-slate-800'
              }`}
            >
              <span>हिन्दी</span>
              {lang === 'hi' && <Check className="w-5 h-5 stroke-[3]" aria-hidden="true" />}
            </button>

            <button
              type="button"
              onClick={() => handleChangeLanguage('en')}
              className={`min-h-[56px] px-4 rounded-[16px] border-2 font-display text-lg font-extrabold flex items-center justify-between transition-colors cursor-pointer ${
                lang === 'en'
                  ? 'bg-[#16213A] text-white border-[#16213A] dark:bg-[#FEB21D] dark:text-[#16213A] dark:border-[#FEB21D]'
                  : 'bg-[#F3F5F9] dark:bg-[#0E1527] text-[#16213A] dark:text-slate-200 border-slate-200 dark:border-slate-800'
              }`}
            >
              <span>English</span>
              {lang === 'en' && <Check className="w-5 h-5 stroke-[3]" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile & Location Card */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-white dark:bg-[#17213A] rounded-[20px] p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-6"
      >
        <div>
          <label
            htmlFor="prof-name"
            className="block text-base font-bold text-[#16213A] dark:text-white mb-2"
          >
            {t('yourNameLabel', lang)}
          </label>
          <input
            id="prof-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full min-h-[56px] px-4 rounded-[16px] bg-[#F3F5F9] dark:bg-[#0E1527] border border-slate-300 dark:border-slate-700 text-lg font-bold text-[#16213A] dark:text-white focus:outline-none focus:border-[#FB8B11]"
          />
        </div>

        {isWorker && (
          <>
            <div>
              <label className="block text-base font-bold text-[#16213A] dark:text-white mb-2.5">
                {t('mainTradeLabel', lang)}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
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
                          : 'bg-[#F3F5F9] dark:bg-[#0E1527] text-[#16213A] dark:text-slate-200 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <TradeIcon
                          trade={tr}
                          className={`w-5 h-5 shrink-0 ${
                            active ? 'text-[#FEB21D] dark:text-[#16213A]' : 'text-[#FB8B11]'
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

            {trade === 'other' && (
              <div>
                <label
                  htmlFor="prof-custom-trade"
                  className="block text-base font-bold text-[#16213A] dark:text-white mb-2"
                >
                  {t('customTradeLabel', lang)}
                </label>
                <input
                  id="prof-custom-trade"
                  type="text"
                  value={customTradeName}
                  onChange={(e) => setCustomTradeName(e.target.value)}
                  placeholder={t('customTradePlaceholder', lang)}
                  className="w-full min-h-[56px] px-4 rounded-[16px] bg-[#F3F5F9] dark:bg-[#0E1527] border border-slate-300 dark:border-slate-700 text-base font-medium text-[#16213A] dark:text-white focus:outline-none focus:border-[#FB8B11]"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="prof-rate"
                  className="block text-base font-bold text-[#16213A] dark:text-white mb-2"
                >
                  {t('rateAmountLabel', lang)}
                </label>
                <input
                  id="prof-rate"
                  type="number"
                  min="50"
                  step="10"
                  value={rateAmount}
                  onChange={(e) => setRateAmount(e.target.value)}
                  className="w-full min-h-[56px] px-4 rounded-[16px] bg-[#F3F5F9] dark:bg-[#0E1527] border border-slate-300 dark:border-slate-700 text-lg font-bold tabular-nums text-[#16213A] dark:text-white focus:outline-none focus:border-[#FB8B11]"
                />
              </div>

              <div>
                <label className="block text-base font-bold text-[#16213A] dark:text-white mb-2">
                  {t('rateUnitLabel', lang)}
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-[#F3F5F9] dark:bg-[#0E1527] p-1.5 rounded-[16px] min-h-[56px]">
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
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {getRateUnitLabel(u, lang)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Government ID Submission Section in Profile */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#FB8B11]" aria-hidden="true" />
                <h2 className="font-display text-xl font-bold text-[#16213A] dark:text-white">
                  {t('govtVerificationTitle', lang)}
                </h2>
              </div>

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
                      className={`min-h-[50px] px-3.5 py-2 rounded-[14px] border text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#16213A] text-white border-[#16213A] dark:bg-[#FEB21D] dark:text-[#16213A] dark:border-[#FEB21D]'
                          : 'bg-[#F3F5F9] dark:bg-[#0E1527] text-[#16213A] dark:text-slate-200 border-slate-200 dark:border-slate-800'
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

              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  maxLength={12}
                  value={govtIdNumber}
                  onChange={(e) => {
                    setGovtIdNumber(e.target.value);
                    setGovtVerified(false);
                  }}
                  placeholder={t(`govtIdPlaceholder_${govtIdType}`, lang)}
                  className="flex-1 min-h-[54px] px-4 rounded-[14px] bg-[#F3F5F9] dark:bg-[#0E1527] border border-slate-300 dark:border-slate-700 text-base font-bold tabular-nums text-[#16213A] dark:text-white focus:outline-none focus:border-[#FB8B11]"
                />
                <button
                  type="button"
                  onClick={handleVerifyGovtId}
                  className={`min-h-[54px] px-5 rounded-[14px] font-bold text-sm flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
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
          </>
        )}

        {/* Location Change Section */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
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

        <button
          type="submit"
          className="w-full min-h-[58px] px-6 py-3.5 rounded-[18px] bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] font-display text-xl font-extrabold shadow-sm hover:brightness-105 cursor-pointer"
        >
          {t('updateProfileBtn', lang)}
        </button>
      </form>

      {/* Worker Work Proof Certificate, Experience Badge, Ustad Ki Gawahi & Reviews */}
      {isWorker && myWorkerProfile && (
        <>
          <WorkerCertificateCard
            worker={myWorkerProfile}
            lang={lang}
            canEdit={true}
            onRefresh={onRefresh}
          />
          <UstadGawahiSection
            worker={myWorkerProfile}
            lang={lang}
            canEdit={true}
            onRefresh={onRefresh}
          />
          <WorkerReviewsSection
            worker={myWorkerProfile}
            lang={lang}
            canWorkerReply={true}
            onRefresh={onRefresh}
          />
        </>
      )}

      {/* PART 4: Admin Flag List (Reported Reviews, Workers & Disputed Jobs) */}
      <div className="bg-white dark:bg-[#17213A] rounded-[20px] p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <FlagIcon className="w-5 h-5 text-[#FB8B11]" />
          <h2 className="font-display text-xl font-extrabold text-[#16213A] dark:text-white">
            {t('adminFlagsTitle', lang)} ({flags.length})
          </h2>
        </div>

        {flags.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('noFlagsYet', lang)}
          </p>
        ) : (
          <div className="space-y-2.5">
            {flags.map((fl) => (
              <div
                key={fl.id}
                className="p-3.5 rounded-[14px] bg-[#F3F5F9] dark:bg-[#0E1527] border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-mono font-extrabold uppercase px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-200 mr-2">
                    {fl.type}
                  </span>
                  <span className="font-bold text-[#16213A] dark:text-white">
                    {fl.reason}
                  </span>
                  <span className="text-slate-500 ml-2 font-mono">
                    [{fl.targetId}]
                  </span>
                </div>
                <span className="font-semibold text-slate-500 tabular-nums">
                  {fl.createdAt} · {fl.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account, Role & Demo Controls */}
      <div className="bg-white dark:bg-[#17213A] rounded-[20px] p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <h2 className="font-display text-xl font-extrabold text-[#16213A] dark:text-white">
          {t('demoControlsTitle', lang)}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={handleSwitchView}
            className="min-h-[56px] px-4 py-3 rounded-[16px] bg-[#16213A] text-white dark:bg-[#FEB21D] dark:text-[#16213A] font-display text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              {isWorker ? t('switchToCustomerView', lang) : t('switchToWorkerView', lang)}
            </span>
          </button>

          <button
            type="button"
            onClick={handleResetDemo}
            className="min-h-[56px] px-4 py-3 rounded-[16px] border-2 border-slate-300 dark:border-slate-700 text-[#16213A] dark:text-slate-200 font-bold text-sm flex items-center justify-center gap-2 hover:border-[#FB8B11] cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-[#FB8B11] shrink-0" aria-hidden="true" />
            <span>{t('resetDemoDataBtn', lang)}</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="min-h-[56px] px-4 py-3 rounded-[16px] border-2 border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/30 text-red-700 dark:text-red-300 font-bold text-sm flex items-center justify-center gap-2 hover:border-red-500 cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{t('logoutBtn', lang)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
