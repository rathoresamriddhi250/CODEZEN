/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  CalendarClock,
  ClipboardList,
  User,
  Search,
  PlusCircle,
  LogOut,
  LogIn,
} from 'lucide-react';
import {
  AppUserState,
  Booking,
  GeoLocation,
  JobPost,
  WorkerProfile,
  completeQuickSetup,
  createDemoConfirmedBooking,
  getBookings,
  getJobPosts,
  getUserState,
  getWorkers,
  isUserOnboarded,
  logoutUser,
  setLanguage,
  setRole,
  switchRoleForDemo,
} from './data/store';
import { GovtIdType, Language, RateUnit, TRADES, TimeSlotId, TradeId, t } from './i18n';
import { ShramikLogo } from './components/ShramikLogo';
import { ShramikChatbot } from './components/ShramikChatbot';
import {
  GlobalVoiceAction,
  VoiceCommandAssistant,
} from './components/VoiceCommandAssistant';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { LanguageScreen } from './screens/LanguageScreen';
import { RoleScreen } from './screens/RoleScreen';
import { QuickSetupScreen } from './screens/QuickSetupScreen';
import { WorkerFindJobsScreen } from './screens/WorkerFindJobsScreen';
import { WorkerMySlotsScreen } from './screens/WorkerMySlotsScreen';
import { CustomerFindWorkersScreen } from './screens/CustomerFindWorkersScreen';
import { CustomerPostJobScreen } from './screens/CustomerPostJobScreen';
import { BookingsScreen } from './screens/BookingsScreen';
import { ProfileScreen } from './screens/ProfileScreen';

type OnboardingStep = 'welcome' | 'language' | 'role' | 'setup' | 'app';
type WorkerTab = 'jobs' | 'slots' | 'bookings' | 'profile';
type CustomerTab = 'workers' | 'post' | 'bookings' | 'profile';

function getInitialTradeFromUrl(): TradeId | 'all' {
  if (typeof window === 'undefined') return 'all';
  const params = new URLSearchParams(window.location.search);
  const tr = params.get('trade')?.toLowerCase() as TradeId | undefined;
  if (tr && TRADES.includes(tr)) {
    return tr;
  }
  return 'all';
}

export default function App() {
  const [user, setUser] = useState<AppUserState>(() => getUserState());
  const [workers, setWorkers] = useState<WorkerProfile[]>(() => getWorkers());
  const [jobPosts, setJobPosts] = useState<JobPost[]>(() => getJobPosts());
  const [bookings, setBookings] = useState<Booking[]>(() => getBookings());

  const initialTradeParam = getInitialTradeFromUrl();

  /**
   * PART 4B Routing Fix:
   * - New visitor (no `shramik_onboarded` in localStorage): always show Welcome screen first,
   *   then Language, then Role, then Quick setup.
   * - Returning logged-in visitor (`shramik_onboarded === "true"` and a saved user exists):
   *   go straight to their home screen (Worker home or Customer home). Do NOT show Welcome or Language again.
   * - Shared link with `?trade=painter`: let the visitor see the search screen directly.
   */
  const [step, setStep] = useState<OnboardingStep>(() => {
    if (initialTradeParam !== 'all') {
      return 'app';
    }
    if (isUserOnboarded()) {
      return 'app';
    }
    return 'welcome';
  });

  const [preselectedTrade, setPreselectedTrade] = useState<TradeId>(
    initialTradeParam !== 'all' ? initialTradeParam : 'painter'
  );
  const [sharedTradeFilter, setSharedTradeFilter] = useState<TradeId | 'all'>(
    initialTradeParam
  );
  const [sharedMaxPrice, setSharedMaxPrice] = useState<number | null>(null);
  const [prefilledBookingDate, setPrefilledBookingDate] = useState<string | null>(null);
  const [prefilledBookingSlot, setPrefilledBookingSlot] = useState<TimeSlotId | null>(
    null
  );
  const [returnToWorkerIdAfterLogin, setReturnToWorkerIdAfterLogin] = useState<
    string | null
  >(null);

  const [workerTab, setWorkerTab] = useState<WorkerTab>('jobs');
  const [customerTab, setCustomerTab] = useState<CustomerTab>('workers');
  const [customerSubView, setCustomerSubView] = useState<'search' | 'history'>('search');
  const [voiceTriggerCounter, setVoiceTriggerCounter] = useState(0);
  const [isLoadingView, setIsLoadingView] = useState(false);

  const refreshStore = useCallback(() => {
    setUser(getUserState());
    setWorkers(getWorkers());
    setJobPosts(getJobPosts());
    setBookings(getBookings());
  }, []);

  useEffect(() => {
    refreshStore();
  }, [refreshStore]);

  const handleGlobalVoiceAction = (action: GlobalVoiceAction) => {
    const scrollTargetById = (elementId: string) => {
      window.setTimeout(() => {
        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    };

    switch (action.type) {
      case 'switch_language':
        setLanguage(action.lang);
        refreshStore();
        break;
      case 'filter_trade':
        if (step !== 'app') setStep('app');
        if (user.role === 'worker' && user.onboardingComplete) {
          switchRoleForDemo();
          refreshStore();
        }
        setSharedTradeFilter(action.trade);
        setSharedMaxPrice(action.maxPrice ?? null);
        setPrefilledBookingDate(null);
        setPrefilledBookingSlot(null);
        setCustomerSubView('search');
        setReturnToWorkerIdAfterLogin(null);
        setCustomerTab('workers');
        setVoiceTriggerCounter((c) => c + 1);
        break;
      case 'search_jobs':
        if (step !== 'app') setStep('app');
        if (user.role !== 'worker') {
          if (user.onboardingComplete) {
            switchRoleForDemo();
          } else {
            setRole('worker');
          }
          refreshStore();
        }
        setWorkerTab('jobs');
        break;
      case 'booking_help':
        if (step !== 'app') setStep('app');
        if (user.role === 'worker' && user.onboardingComplete) {
          switchRoleForDemo();
          refreshStore();
        }
        setCustomerSubView('search');
        setPrefilledBookingDate(action.date);
        setPrefilledBookingSlot(action.slot);
        setReturnToWorkerIdAfterLogin(action.workerId || 'worker-sample-1');
        setCustomerTab('workers');
        setVoiceTriggerCounter((c) => c + 1);
        break;
      case 'worker_add_record':
        if (step !== 'app') setStep('app');
        if (user.role !== 'worker') {
          if (user.onboardingComplete) {
            switchRoleForDemo();
          } else {
            setRole('worker');
          }
          refreshStore();
        }
        setWorkerTab('profile');
        scrollTargetById('work-journey-form');
        break;
      case 'worker_mark_complete': {
        if (step !== 'app') setStep('app');
        if (user.role !== 'worker') {
          if (user.onboardingComplete) {
            switchRoleForDemo();
          } else {
            setRole('worker');
          }
        }
        const currentBks = getBookings();
        if (!currentBks.some((b) => b.status === 'confirmed')) {
          createDemoConfirmedBooking();
        }
        refreshStore();
        setWorkerTab('bookings');
        break;
      }
      case 'open_customer_history':
        if (step !== 'app') setStep('app');
        if (user.role === 'worker' && user.onboardingComplete) {
          switchRoleForDemo();
          refreshStore();
        }
        setCustomerSubView('history');
        setReturnToWorkerIdAfterLogin(null);
        setCustomerTab('workers');
        setVoiceTriggerCounter((c) => c + 1);
        break;
      case 'book_worker_again':
        if (step !== 'app') setStep('app');
        if (user.role === 'worker' && user.onboardingComplete) {
          switchRoleForDemo();
          refreshStore();
        }
        setCustomerSubView('history');
        setPrefilledBookingDate(null);
        setPrefilledBookingSlot(null);
        setReturnToWorkerIdAfterLogin(action.workerId);
        setCustomerTab('workers');
        setVoiceTriggerCounter((c) => c + 1);
        break;
      case 'open_bookings':
        if (step !== 'app') setStep('app');
        if (user.role === 'worker' && user.onboardingComplete) {
          setWorkerTab('bookings');
        } else {
          setCustomerTab('bookings');
        }
        break;
      case 'open_profile':
        if (step !== 'app') setStep('app');
        if (action.section === 'reviews' && user.role !== 'worker') {
          if (user.onboardingComplete) {
            switchRoleForDemo();
          } else {
            setRole('worker');
          }
          refreshStore();
          setWorkerTab('profile');
          scrollTargetById('worker-reviews-section');
          break;
        }
        if (user.role === 'worker' && user.onboardingComplete) {
          setWorkerTab('profile');
        } else {
          setCustomerTab('profile');
        }
        if (action.section === 'reviews') {
          scrollTargetById('worker-reviews-section');
        } else if (action.section === 'journey') {
          scrollTargetById('work-journey-form');
        }
        break;
      case 'open_home':
        if (step !== 'app') setStep('app');
        if (user.role === 'worker' && user.onboardingComplete) {
          setWorkerTab('jobs');
        } else {
          setReturnToWorkerIdAfterLogin(null);
          setCustomerSubView('search');
          setCustomerTab('workers');
          setVoiceTriggerCounter((c) => c + 1);
        }
        break;
      case 'open_post_job':
        if (step !== 'app') setStep('app');
        if (user.role === 'worker' && user.onboardingComplete) {
          switchRoleForDemo();
          refreshStore();
        }
        setCustomerTab('post');
        break;
      case 'open_my_slots':
        if (step !== 'app') setStep('app');
        if (user.role !== 'worker' && user.onboardingComplete) {
          switchRoleForDemo();
          refreshStore();
        }
        setWorkerTab('slots');
        break;
      case 'switch_role':
        switchRoleForDemo();
        refreshStore();
        break;
      case 'logout':
        logoutUser();
        refreshStore();
        setStep('welcome');
        break;
    }
  };

  // Replace history state when moving past Welcome so Back button does not loop back to Welcome
  const navigateReplaceFromWelcome = (nextStep: OnboardingStep) => {
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState({ step: nextStep }, '', window.location.pathname + window.location.search);
    }
    setStep(nextStep);
  };

  const triggerBriefSkeleton = (cb: () => void) => {
    setIsLoadingView(true);
    cb();
    window.setTimeout(() => {
      setIsLoadingView(false);
    }, 120);
  };

  const activeLang: Language = user.language || 'en';

  // Step 0: Welcome Page (for new visitors who haven't completed onboarding)
  if (step === 'welcome') {
    return (
      <>
        <WelcomeScreen
          lang={activeLang}
          hasSavedAccount={Boolean(user.onboardingComplete)}
          onGetStarted={() => navigateReplaceFromWelcome('language')}
          onExploreWithoutLogin={() => {
            setSharedTradeFilter('all');
            setCustomerTab('workers');
            navigateReplaceFromWelcome('app');
          }}
        />
        <ShramikChatbot lang={activeLang} />
      </>
    );
  }

  // Step 1: Choose Language Page
  if (step === 'language') {
    return (
      <>
        <LanguageScreen
          selectedLanguage={user.language}
          onSelectLanguage={(lang) => {
            setLanguage(lang);
            refreshStore();
          }}
          onContinue={() => setStep('role')}
          onBack={() => setStep('welcome')}
        />
        <ShramikChatbot lang={activeLang} />
      </>
    );
  }

  // Step 2: Register as Worker or Customer Selection
  if (step === 'role') {
    return (
      <>
        <RoleScreen
          lang={activeLang}
          selectedRole={user.role}
          onSelectRole={(role) => {
            setRole(role);
            refreshStore();
          }}
          onContinue={() => setStep('setup')}
          onBack={() => setStep('language')}
        />
        <ShramikChatbot lang={activeLang} />
      </>
    );
  }

  // Step 3: Registration Form (Worker or Customer)
  if (step === 'setup') {
    return (
      <>
        <QuickSetupScreen
          lang={activeLang}
          role={user.role || 'worker'}
          initialTrade={preselectedTrade}
          onComplete={(params: {
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
          }) => {
            completeQuickSetup(params);
            refreshStore();
            if (returnToWorkerIdAfterLogin) {
              setCustomerTab('workers');
            } else if (params.role === 'worker') {
              setWorkerTab('jobs');
            } else {
              setCustomerTab('workers');
            }
            navigateReplaceFromWelcome('app');
          }}
          onBack={() => setStep('role')}
        />
        <ShramikChatbot lang={activeLang} />
      </>
    );
  }

  // Main Application View (Worker or Customer, or Explore without login)
  const isWorker = user.onboardingComplete && user.role === 'worker';
  const myWorkerProfile = workers.find((w) => w.id === user.workerId);

  const pendingActionCount = bookings.filter((b) => {
    if (b.status !== 'pending' && b.status !== 'waiting_customer_confirmation') return false;
    if (b.status === 'waiting_customer_confirmation') {
      return !isWorker;
    }
    return isWorker ? b.startedBy === 'customer' : b.startedBy === 'worker';
  }).length;

  const handleLogout = () => {
    logoutUser();
    refreshStore();
    setReturnToWorkerIdAfterLogin(null);
    navigateReplaceFromWelcome('welcome');
  };

  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-10">
      {/* Top Bar Contract: [Brand title, one line] — [4 nav links, single-line] — [1 primary action] */}
      <header className="sticky top-0 z-30 h-14 md:h-16 bg-white/95 dark:bg-[#17213A]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            if (isWorker) {
              setWorkerTab('jobs');
            } else {
              setCustomerTab('workers');
            }
          }}
          className="whitespace-nowrap shrink-0"
          title="Shramik Home"
        >
          <ShramikLogo variant="compact" />
        </a>

        {/* Zone 2: 4 Single-line Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-600 dark:text-slate-300">
          {isWorker ? (
            <>
              <button
                type="button"
                onClick={() => setWorkerTab('jobs')}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  workerTab === 'jobs'
                    ? 'border-[#FB8B11] text-[#16213A] dark:text-white'
                    : 'border-transparent hover:text-[#16213A] dark:hover:text-white'
                }`}
              >
                {t('navFindJobs', activeLang)}
              </button>
              <button
                type="button"
                onClick={() => setWorkerTab('slots')}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  workerTab === 'slots'
                    ? 'border-[#FB8B11] text-[#16213A] dark:text-white'
                    : 'border-transparent hover:text-[#16213A] dark:hover:text-white'
                }`}
              >
                {t('navMySlots', activeLang)}
              </button>
              <button
                type="button"
                onClick={() => setWorkerTab('bookings')}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  workerTab === 'bookings'
                    ? 'border-[#FB8B11] text-[#16213A] dark:text-white'
                    : 'border-transparent hover:text-[#16213A] dark:hover:text-white'
                }`}
              >
                {t('navBookings', activeLang)}
                {pendingActionCount > 0 ? ` (${pendingActionCount})` : ''}
              </button>
              <button
                type="button"
                onClick={() => setWorkerTab('profile')}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  workerTab === 'profile'
                    ? 'border-[#FB8B11] text-[#16213A] dark:text-white'
                    : 'border-transparent hover:text-[#16213A] dark:hover:text-white'
                }`}
              >
                {t('navProfile', activeLang)}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setCustomerTab('workers')}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  customerTab === 'workers'
                    ? 'border-[#FB8B11] text-[#16213A] dark:text-white'
                    : 'border-transparent hover:text-[#16213A] dark:hover:text-white'
                }`}
              >
                {t('navFindWorkers', activeLang)}
              </button>
              <button
                type="button"
                onClick={() => setCustomerTab('post')}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  customerTab === 'post'
                    ? 'border-[#FB8B11] text-[#16213A] dark:text-white'
                    : 'border-transparent hover:text-[#16213A] dark:hover:text-white'
                }`}
              >
                {t('navPostJob', activeLang)}
              </button>
              <button
                type="button"
                onClick={() => setCustomerTab('bookings')}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  customerTab === 'bookings'
                    ? 'border-[#FB8B11] text-[#16213A] dark:text-white'
                    : 'border-transparent hover:text-[#16213A] dark:hover:text-white'
                }`}
              >
                {t('navBookings', activeLang)}
                {pendingActionCount > 0 ? ` (${pendingActionCount})` : ''}
              </button>
              <button
                type="button"
                onClick={() => setCustomerTab('profile')}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  customerTab === 'profile'
                    ? 'border-[#FB8B11] text-[#16213A] dark:text-white'
                    : 'border-transparent hover:text-[#16213A] dark:hover:text-white'
                }`}
              >
                {t('navProfile', activeLang)}
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: 1 Primary Action (Log Out or Sign In button) */}
        <div className="flex items-center shrink-0">
          {user.onboardingComplete ? (
            <button
              type="button"
              onClick={handleLogout}
              className="min-h-[40px] px-3.5 py-1.5 rounded-[12px] bg-[#16213A] text-white dark:bg-[#FEB21D] dark:text-[#16213A] text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t('logoutBtn', activeLang)}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep('language')}
              className="min-h-[40px] px-3.5 py-1.5 rounded-[12px] bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t('signInToBookBtn', activeLang)}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Responsive Content Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-5 md:py-8">
        {isLoadingView ? (
          <div className="space-y-4" aria-busy="true" aria-label={t('loadingText', activeLang)}>
            <div className="h-28 rounded-[20px] bg-white dark:bg-[#17213A] border border-slate-200 dark:border-slate-800 p-5 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-48 rounded-[20px] bg-white dark:bg-[#17213A] border border-slate-200 dark:border-slate-800 p-5 animate-pulse" />
              <div className="h-48 rounded-[20px] bg-white dark:bg-[#17213A] border border-slate-200 dark:border-slate-800 p-5 animate-pulse" />
            </div>
          </div>
        ) : isWorker ? (
          <>
            {workerTab === 'jobs' && (
              <WorkerFindJobsScreen
                user={user}
                lang={activeLang}
                jobPosts={jobPosts}
                bookings={bookings}
                onRefresh={refreshStore}
                onGoToProfile={() => setWorkerTab('profile')}
                onGoToBookings={() => setWorkerTab('bookings')}
              />
            )}
            {workerTab === 'slots' && (
              <WorkerMySlotsScreen
                user={user}
                workerProfile={myWorkerProfile}
                lang={activeLang}
                onRefresh={refreshStore}
              />
            )}
            {workerTab === 'bookings' && (
              <BookingsScreen
                user={user}
                lang={activeLang}
                bookings={bookings}
                workers={workers}
                onRefresh={refreshStore}
              />
            )}
            {workerTab === 'profile' && (
              <ProfileScreen
                user={user}
                lang={activeLang}
                onRefresh={refreshStore}
                onRoleSwitched={() => {
                  triggerBriefSkeleton(() => setCustomerTab('workers'));
                }}
                onLoggedOut={() => navigateReplaceFromWelcome('welcome')}
              />
            )}
          </>
        ) : (
          <>
            {customerTab === 'workers' && (
              <CustomerFindWorkersScreen
                user={user}
                lang={activeLang}
                workers={workers}
                initialTradeFilter={sharedTradeFilter}
                initialMaxPrice={sharedMaxPrice}
                initialSelectedWorkerId={returnToWorkerIdAfterLogin}
                initialBookingDate={prefilledBookingDate}
                initialBookingSlot={prefilledBookingSlot}
                initialSubView={customerSubView}
                voiceTriggerCounter={voiceTriggerCounter}
                onRefresh={refreshStore}
                onGoToProfile={() => setCustomerTab('profile')}
                onGoToBookings={() => setCustomerTab('bookings')}
                onRequireLoginForBooking={(workerId) => {
                  setReturnToWorkerIdAfterLogin(workerId);
                  setRole('customer');
                  setStep('language');
                }}
              />
            )}
            {customerTab === 'post' && (
              <CustomerPostJobScreen
                user={user}
                lang={activeLang}
                jobPosts={jobPosts}
                onRefresh={refreshStore}
              />
            )}
            {customerTab === 'bookings' && (
              <BookingsScreen
                user={user}
                lang={activeLang}
                bookings={bookings}
                workers={workers}
                onRefresh={refreshStore}
                onBookWorkerAgain={(workerId) => {
                  setReturnToWorkerIdAfterLogin(workerId);
                  setCustomerTab('workers');
                }}
              />
            )}
            {customerTab === 'profile' && (
              <ProfileScreen
                user={user}
                lang={activeLang}
                onRefresh={refreshStore}
                onRoleSwitched={() => {
                  triggerBriefSkeleton(() => setWorkerTab('jobs'));
                }}
                onLoggedOut={() => navigateReplaceFromWelcome('welcome')}
              />
            )}
          </>
        )}
      </main>

      {/* Global Voice Command Assistant + Shramik Sahayak Chatbot */}
      <VoiceCommandAssistant
        lang={activeLang}
        onExecuteAction={handleGlobalVoiceAction}
      />
      <ShramikChatbot
        lang={activeLang}
        onExecuteAction={handleGlobalVoiceAction}
      />

      {/* Fixed Bottom Navigation Tab Bar on Mobile */}
      <nav
        aria-label="Primary Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#17213A]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-4 items-center h-16 px-2"
      >
        {isWorker ? (
          <>
            <button
              type="button"
              onClick={() => setWorkerTab('jobs')}
              className={`min-h-[48px] flex flex-col items-center justify-center rounded-[12px] transition-colors cursor-pointer ${
                workerTab === 'jobs'
                  ? 'text-[#EA580C] dark:text-[#FEB21D] font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Briefcase className="w-5 h-5" aria-hidden="true" />
              <span className="text-[11px] mt-0.5 truncate max-w-full">
                {t('navFindJobs', activeLang)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setWorkerTab('slots')}
              className={`min-h-[48px] flex flex-col items-center justify-center rounded-[12px] transition-colors cursor-pointer ${
                workerTab === 'slots'
                  ? 'text-[#EA580C] dark:text-[#FEB21D] font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <CalendarClock className="w-5 h-5" aria-hidden="true" />
              <span className="text-[11px] mt-0.5 truncate max-w-full">
                {t('navMySlots', activeLang)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setWorkerTab('bookings')}
              className={`min-h-[48px] flex flex-col items-center justify-center rounded-[12px] transition-colors cursor-pointer ${
                workerTab === 'bookings'
                  ? 'text-[#EA580C] dark:text-[#FEB21D] font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <ClipboardList className="w-5 h-5" aria-hidden="true" />
              <span className="text-[11px] mt-0.5 truncate max-w-full">
                {t('navBookings', activeLang)}
                {pendingActionCount > 0 ? ` (${pendingActionCount})` : ''}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setWorkerTab('profile')}
              className={`min-h-[48px] flex flex-col items-center justify-center rounded-[12px] transition-colors cursor-pointer ${
                workerTab === 'profile'
                  ? 'text-[#EA580C] dark:text-[#FEB21D] font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <User className="w-5 h-5" aria-hidden="true" />
              <span className="text-[11px] mt-0.5 truncate max-w-full">
                {t('navProfile', activeLang)}
              </span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setCustomerTab('workers')}
              className={`min-h-[48px] flex flex-col items-center justify-center rounded-[12px] transition-colors cursor-pointer ${
                customerTab === 'workers'
                  ? 'text-[#EA580C] dark:text-[#FEB21D] font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Search className="w-5 h-5" aria-hidden="true" />
              <span className="text-[11px] mt-0.5 truncate max-w-full">
                {t('navFindWorkers', activeLang)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCustomerTab('post')}
              className={`min-h-[48px] flex flex-col items-center justify-center rounded-[12px] transition-colors cursor-pointer ${
                customerTab === 'post'
                  ? 'text-[#EA580C] dark:text-[#FEB21D] font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <PlusCircle className="w-5 h-5" aria-hidden="true" />
              <span className="text-[11px] mt-0.5 truncate max-w-full">
                {t('navPostJob', activeLang)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCustomerTab('bookings')}
              className={`min-h-[48px] flex flex-col items-center justify-center rounded-[12px] transition-colors cursor-pointer ${
                customerTab === 'bookings'
                  ? 'text-[#EA580C] dark:text-[#FEB21D] font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <ClipboardList className="w-5 h-5" aria-hidden="true" />
              <span className="text-[11px] mt-0.5 truncate max-w-full">
                {t('navBookings', activeLang)}
                {pendingActionCount > 0 ? ` (${pendingActionCount})` : ''}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCustomerTab('profile')}
              className={`min-h-[48px] flex flex-col items-center justify-center rounded-[12px] transition-colors cursor-pointer ${
                customerTab === 'profile'
                  ? 'text-[#EA580C] dark:text-[#FEB21D] font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <User className="w-5 h-5" aria-hidden="true" />
              <span className="text-[11px] mt-0.5 truncate max-w-full">
                {t('navProfile', activeLang)}
              </span>
            </button>
          </>
        )}
      </nav>
    </div>
  );
}
