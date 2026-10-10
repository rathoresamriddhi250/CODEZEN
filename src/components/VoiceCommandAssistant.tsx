import React, { useState, useEffect, useCallback } from 'react';
import {
  Mic,
  Volume2,
  VolumeX,
  X,
  Send,
  HelpCircle,
  Check,
  Edit3,
  Square,
  WifiOff,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Language, TimeSlotId, TradeId, t } from '../i18n';
import {
  getVoiceConsent,
  setVoiceConsent,
  getVoiceMuted,
  setVoiceMuted,
} from '../data/store';
import {
  speakClearVoice,
  stopAllVoice,
  listenToUserVoice,
  stopListeningVoice,
  isSpeechRecognitionSupported,
  isHindiVoiceAvailable,
  extractSafeScreenSummary,
} from '../utils/voice';
import {
  ParsedVoiceIntent,
  SAHAYAK_FAQ_TOPICS,
  parseVoiceIntent,
} from '../utils/voiceIntents';

export type GlobalVoiceAction =
  | { type: 'switch_language'; lang: Language }
  | {
      type: 'filter_trade';
      trade: TradeId | 'all';
      maxPrice?: number;
      searchQuery?: string;
    }
  | { type: 'search_jobs' }
  | {
      type: 'booking_help';
      workerId?: string;
      date: string;
      slot: TimeSlotId;
    }
  | { type: 'worker_add_record' }
  | { type: 'worker_mark_complete' }
  | { type: 'open_customer_history' }
  | { type: 'book_worker_again'; workerId: string }
  | { type: 'open_bookings' }
  | { type: 'open_profile'; section?: 'reviews' | 'journey' }
  | { type: 'open_post_job' }
  | { type: 'open_my_slots' }
  | { type: 'open_home' }
  | { type: 'switch_role' }
  | { type: 'logout' };

interface SessionTurn {
  id: string;
  heardText: string;
  replyText: string;
  detailText?: string;
}

interface VoiceCommandAssistantProps {
  lang: Language;
  onExecuteAction: (action: GlobalVoiceAction) => void;
}

/**
 * Helper to trigger Awaaz Sahayak from the 64px Home screen mic button or Sahayak sheet.
 */
export function triggerAwaazSahayak(startListening = true): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('shramik:open-awaaz-sahayak', {
        detail: { startListening },
      })
    );
  }
}

export const VoiceCommandAssistant: React.FC<VoiceCommandAssistantProps> = ({
  lang,
  onExecuteAction,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // PART 4C Rule 8 States: listening, thinking, speaking, muted, permission denied, offline
  const [assistantState, setAssistantState] = useState<
    'idle' | 'listening' | 'thinking' | 'speaking'
  >('idle');
  const [isMuted, setIsMuted] = useState<boolean>(() => getVoiceMuted());
  const [speechSupported, setSpeechSupported] = useState<boolean>(() =>
    isSpeechRecognitionSupported()
  );
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isOffline, setIsOffline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [missingHindiVoice, setMissingHindiVoice] = useState(false);

  // Privacy consent state (PART 4C Rule 6 & 7)
  const [showPrivacyPrompt, setShowPrivacyPrompt] = useState(false);
  const [pendingStartAfterConsent, setPendingStartAfterConsent] = useState(false);

  // Live recognized text & typed fallback input
  const [liveTranscript, setLiveTranscript] = useState('');
  const [typedInput, setTypedInput] = useState('');

  // Safety Rule 3: Confirmation Card before search or booking intent ("I heard: ... Yes / Edit")
  const [pendingConfirm, setPendingConfirm] = useState<{
    heardText: string;
    intent: ParsedVoiceIntent;
    isEditing: boolean;
    editDraft: string;
  } | null>(null);

  // Safety Rule 3: Top 3 choices as big buttons when confidence is low or 2 intents match
  const [ambiguousChoices, setAmbiguousChoices] = useState<{
    heardText: string;
    choices: ParsedVoiceIntent[];
  } | null>(null);

  // "What can I say?" 8 example commands toggle
  const [showWhatCanISay, setShowWhatCanISay] = useState(false);

  // Short in-memory session history cleared on close (PART 4C Rule 6)
  const [sessionHistory, setSessionHistory] = useState<SessionTurn[]>([]);

  // Monitor online/offline state
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => {
      setIsOffline(true);
      stopListeningVoice();
      setAssistantState('idle');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check Hindi voice availability when language is Hindi
  useEffect(() => {
    setSpeechSupported(isSpeechRecognitionSupported());
    if (lang === 'hi') {
      setMissingHindiVoice(!isHindiVoiceAvailable());
    } else {
      setMissingHindiVoice(false);
    }
  }, [lang, isOpen]);

  // Handle language switch mid-session (PART 4C Rule 8)
  useEffect(() => {
    if (assistantState === 'listening') {
      stopListeningVoice();
      setAssistantState('idle');
    }
  }, [lang]);

  const speakReply = useCallback(
    (text: string, targetLang: Language = lang) => {
      if (getVoiceMuted()) {
        setAssistantState('idle');
        return;
      }
      speakClearVoice(text, {
        lang: targetLang,
        max20Words: true,
        onStart: () => setAssistantState('speaking'),
        onEnd: () => setAssistantState('idle'),
        onMissingHindiVoice: () => {
          setMissingHindiVoice(true);
          setAssistantState('idle');
        },
      });
    },
    [lang]
  );

  const appendTurn = useCallback(
    (heardText: string, replyText: string, detailText?: string) => {
      setSessionHistory((prev) => [
        {
          id: `turn-${Date.now()}`,
          heardText,
          replyText,
          detailText,
        },
        ...prev.slice(0, 4),
      ]);
    },
    []
  );

  /**
   * Executes a confirmed or direct voice intent
   */
  const executeIntent = useCallback(
    (heardText: string, intent: ParsedVoiceIntent) => {
      setPendingConfirm(null);
      setAmbiguousChoices(null);

      const replyLang: Language =
        intent.kind === 'switch_language' && intent.targetLang
          ? intent.targetLang
          : lang;

      const replyText =
        replyLang === 'hi' ? intent.spokenReplyHi : intent.spokenReplyEn;
      const detailText =
        replyLang === 'hi' ? intent.displayTextHi : intent.displayTextEn;

      switch (intent.kind) {
        case 'switch_language':
          if (intent.targetLang) {
            onExecuteAction({ type: 'switch_language', lang: intent.targetLang });
          }
          appendTurn(heardText, replyText);
          speakReply(replyText, replyLang);
          break;

        case 'search_workers':
          onExecuteAction({
            type: 'filter_trade',
            trade: intent.trade || 'all',
            maxPrice: intent.maxPrice,
            searchQuery: intent.searchQuery,
          });
          appendTurn(heardText, replyText);
          speakReply(replyText, replyLang);
          break;

        case 'search_jobs':
          onExecuteAction({ type: 'search_jobs' });
          appendTurn(heardText, replyText);
          speakReply(replyText, replyLang);
          break;

        case 'booking_help':
          onExecuteAction({
            type: 'booking_help',
            workerId: intent.targetWorkerId || 'worker-sample-1',
            date: intent.bookingDate || '',
            slot: intent.bookingSlot || '10-12',
          });
          appendTurn(heardText, replyText, t('awaazSafetyTapConfirm', replyLang));
          speakReply(replyText, replyLang);
          break;

        case 'worker_add_record':
          onExecuteAction({ type: 'worker_add_record' });
          appendTurn(heardText, replyText, t('awaazSafetyTapConfirm', replyLang));
          speakReply(replyText, replyLang);
          break;

        case 'worker_mark_complete':
          onExecuteAction({ type: 'worker_mark_complete' });
          appendTurn(heardText, replyText, t('awaazSafetyTapConfirm', replyLang));
          speakReply(replyText, replyLang);
          break;

        case 'nav_profile':
          onExecuteAction({ type: 'open_profile' });
          appendTurn(heardText, replyText);
          speakReply(replyText, replyLang);
          break;

        case 'nav_reviews':
          onExecuteAction({ type: 'open_profile', section: 'reviews' });
          appendTurn(heardText, replyText);
          speakReply(replyText, replyLang);
          break;

        case 'nav_bookings':
          onExecuteAction({ type: 'open_bookings' });
          appendTurn(heardText, replyText);
          speakReply(replyText, replyLang);
          break;

        case 'nav_my_work':
          onExecuteAction({ type: 'open_my_slots' });
          appendTurn(heardText, replyText);
          speakReply(replyText, replyLang);
          break;

        case 'nav_history':
          onExecuteAction({ type: 'open_customer_history' });
          appendTurn(heardText, replyText);
          speakReply(replyText, replyLang);
          break;

        case 'nav_home':
          onExecuteAction({ type: 'open_home' });
          appendTurn(heardText, replyText);
          speakReply(replyText, replyLang);
          break;

        case 'faq_help':
          appendTurn(heardText, replyText, detailText);
          speakReply(replyText, replyLang);
          break;

        case 'read_aloud': {
          const summary = extractSafeScreenSummary(replyLang);
          const fullRead = `${replyText} ${summary}`;
          appendTurn(heardText, replyText, summary);
          speakReply(fullRead, replyLang);
          break;
        }

        case 'destructive_guard':
          appendTurn(heardText, replyText);
          speakReply(replyText, replyLang);
          break;

        case 'unknown':
        default:
          appendTurn(heardText, t('awaazNotUnderstood', replyLang));
          speakReply(t('awaazNotUnderstood', replyLang), replyLang);
          break;
      }
    },
    [appendTurn, lang, onExecuteAction, speakReply]
  );

  /**
   * Processes spoken or typed utterance through the rule-based intent parser
   * and applies PART 4C Safety Rules (Confirmation Card & Top-3 Ambiguous Choices).
   */
  const processUtterance = useCallback(
    (rawText: string) => {
      const clean = rawText.trim();
      if (!clean) {
        setAssistantState('idle');
        return;
      }

      setAssistantState('thinking');
      setLiveTranscript('');
      setPendingConfirm(null);
      setAmbiguousChoices(null);

      const parsed = parseVoiceIntent(clean);

      // Rule 3: If confidence is low or two intents match, show the top 3 choices as big buttons
      if (parsed.ambiguousChoices && parsed.ambiguousChoices.length > 0) {
        setAmbiguousChoices({
          heardText: clean,
          choices: parsed.ambiguousChoices.slice(0, 3),
        });
        const msg =
          parsed.primary.kind === 'unknown'
            ? t('awaazNotUnderstood', lang)
            : t('awaazAmbiguousPrompt', lang);
        appendTurn(clean, msg);
        speakReply(msg, lang);
        return;
      }

      // Rule 3: Before navigating on a search or booking intent, show a confirmation card:
      // "I heard: 'painter chahiye'. Open painters near you?" with Yes and Edit buttons.
      if (parsed.primary.requiresConfirmation) {
        setPendingConfirm({
          heardText: clean,
          intent: parsed.primary,
          isEditing: false,
          editDraft: clean,
        });
        const confirmPrompt =
          lang === 'hi'
            ? parsed.primary.confirmPromptHi || ''
            : parsed.primary.confirmPromptEn || '';
        const spokenConfirm = `${t('awaazConfirmHeardPrefix', lang)} ${clean}. ${confirmPrompt}`;
        speakReply(spokenConfirm, lang);
        return;
      }

      // Direct safe action (navigation, settings, FAQ, read aloud, worker screen open)
      executeIntent(clean, parsed.primary);
    },
    [appendTurn, executeIntent, lang, speakReply]
  );

  const beginBrowserListening = useCallback(() => {
    if (isOffline) {
      setAssistantState('idle');
      return;
    }
    if (!isSpeechRecognitionSupported()) {
      setSpeechSupported(false);
      setAssistantState('idle');
      return;
    }

    stopAllVoice();
    setLiveTranscript('');
    setPendingConfirm(null);
    setAmbiguousChoices(null);

    listenToUserVoice({
      lang,
      onStart: () => {
        setAssistantState('listening');
      },
      onInterim: (live) => {
        setLiveTranscript(live);
      },
      onResult: (finalTranscript) => {
        processUtterance(finalTranscript);
      },
      onError: (reason) => {
        setAssistantState('idle');
        if (reason === 'permission_denied') {
          setPermissionDenied(true);
        } else if (reason === 'unsupported') {
          setSpeechSupported(false);
        } else if (reason === 'offline') {
          setIsOffline(true);
        } else if (reason === 'no_speech') {
          appendTurn('—', t('awaazNotUnderstood', lang));
        }
      },
      onEnd: () => {
        setAssistantState((prev) => (prev === 'listening' ? 'idle' : prev));
      },
    });
  }, [appendTurn, isOffline, lang, processUtterance]);

  /**
   * Tap to start, tap again to stop. Checks one-time privacy consent before first mic use.
   */
  const handleMicToggle = useCallback(() => {
    if (assistantState === 'listening') {
      stopListeningVoice();
      setAssistantState('idle');
      return;
    }

    const consent = getVoiceConsent();
    if (!consent || !consent.accepted) {
      setShowPrivacyPrompt(true);
      setPendingStartAfterConsent(true);
      return;
    }

    beginBrowserListening();
  }, [assistantState, beginBrowserListening]);

  // Listen for global event from the 64px Home Screen Mic Button
  useEffect(() => {
    const handleOpenEvent = (e: Event) => {
      const custom = e as CustomEvent<{ startListening?: boolean }>;
      setIsOpen(true);
      if (custom.detail?.startListening) {
        const consent = getVoiceConsent();
        if (!consent || !consent.accepted) {
          setShowPrivacyPrompt(true);
          setPendingStartAfterConsent(true);
        } else {
          beginBrowserListening();
        }
      }
    };
    window.addEventListener('shramik:open-awaaz-sahayak', handleOpenEvent);
    return () => {
      window.removeEventListener('shramik:open-awaaz-sahayak', handleOpenEvent);
    };
  }, [beginBrowserListening]);

  const handleAcceptPrivacy = () => {
    setVoiceConsent(true);
    setShowPrivacyPrompt(false);
    if (pendingStartAfterConsent) {
      setPendingStartAfterConsent(false);
      beginBrowserListening();
    }
  };

  const handleDeclinePrivacy = () => {
    setVoiceConsent(false);
    setShowPrivacyPrompt(false);
    setPendingStartAfterConsent(false);
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setVoiceMuted(next);
    setIsMuted(next);
    if (next) {
      stopAllVoice();
      if (assistantState === 'speaking') {
        setAssistantState('idle');
      }
    }
  };

  const handleStopSpeaking = () => {
    stopAllVoice();
    if (assistantState === 'speaking') {
      setAssistantState('idle');
    }
  };

  // Clear in-memory session history on close (PART 4C Rule 6)
  const handleCloseModal = () => {
    stopListeningVoice();
    stopAllVoice();
    setAssistantState('idle');
    setLiveTranscript('');
    setPendingConfirm(null);
    setAmbiguousChoices(null);
    setSessionHistory([]);
    setIsOpen(false);
  };

  const exampleCommands: { phrase: string; label: string }[] = [
    { phrase: 'painter chahiye', label: t('awaazEx1', lang) },
    { phrase: 'plumber 500 se kam', label: t('awaazEx2', lang) },
    { phrase: 'kaam dhundo', label: t('awaazEx3', lang) },
    { phrase: 'kal subah 10 baje slot book karo', label: t('awaazEx4', lang) },
    { phrase: 'naya kaam jodo', label: t('awaazEx5', lang) },
    { phrase: 'kaam poora hua', label: t('awaazEx6', lang) },
    { phrase: 'meri bookings', label: t('awaazEx7', lang) },
    { phrase: 'ye padh ke sunao', label: t('awaazEx8', lang) },
  ];

  const micUnavailable = !speechSupported || permissionDenied;

  return (
    <>
      {/* Floating Round 64px Mic Button (Bottom Left, accessible from anywhere) */}
      <div className="fixed bottom-20 md:bottom-6 left-4 z-40">
        {!isOpen && (
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              const consent = getVoiceConsent();
              if (!consent || !consent.accepted) {
                setShowPrivacyPrompt(true);
                setPendingStartAfterConsent(true);
              }
            }}
            className="w-16 h-16 min-w-[64px] min-h-[64px] rounded-full bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] font-display font-extrabold shadow-xl border-2 border-white dark:border-[#16213A] flex items-center justify-center hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            aria-label={t('awaazHomeMicBtnLabel', lang)}
            title={t('awaazTitle', lang)}
          >
            <Mic className="w-7 h-7 stroke-[2.5]" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Awaaz Sahayak Sheet / Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#0E1527]/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t('awaazTitle', lang)}
        >
          <div className="w-full max-w-lg bg-white dark:bg-[#17213A] rounded-t-[26px] sm:rounded-[26px] border-2 border-[#FB8B11] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Header: Title + Status Badge + Mute Toggle + Stop Button + Close */}
            <div className="bg-[#16213A] text-white px-4 py-3.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    assistantState === 'listening'
                      ? 'bg-red-500 text-white motion-safe:animate-pulse'
                      : 'bg-gradient-to-br from-[#FEB21D] to-[#EA580C] text-[#16213A]'
                  }`}
                >
                  <Mic className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-extrabold leading-tight text-white truncate">
                      {t('awaazTitle', lang)}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-white/15 text-[#FEB21D]">
                      {assistantState === 'listening'
                        ? t('awaazListeningState', lang)
                        : assistantState === 'thinking'
                        ? t('awaazThinkingState', lang)
                        : assistantState === 'speaking'
                        ? t('awaazSpeakingState', lang)
                        : isMuted
                        ? t('awaazMutedState', lang)
                        : lang === 'hi'
                        ? 'hi-IN'
                        : 'en-IN'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 truncate">
                    {t('awaazSubtitle', lang)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Stop Speaking Button */}
                {assistantState === 'speaking' && (
                  <button
                    type="button"
                    onClick={handleStopSpeaking}
                    className="min-h-[40px] px-2.5 py-1 rounded-[10px] bg-red-600 text-white text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>{t('awaazStopSpeakingBtn', lang)}</span>
                  </button>
                )}

                {/* Mute Toggle */}
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className={`min-h-[40px] px-2.5 py-1 rounded-[10px] text-xs font-extrabold flex items-center gap-1 cursor-pointer ${
                    isMuted
                      ? 'bg-amber-500/20 text-[#FEB21D] border border-[#FEB21D]/50'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  aria-label={isMuted ? t('awaazUnmuteToggle', lang) : t('awaazMuteToggle', lang)}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-[#FEB21D]" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>
                    {isMuted ? t('awaazUnmuteToggle', lang) : t('awaazMuteToggle', lang)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-10 h-10 rounded-[12px] bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                  aria-label="Close Awaaz Sahayak"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 bg-[#F3F5F9] dark:bg-[#0E1527]">
              {/* PART 4C Rule 4: Note if no Hindi voice is installed */}
              {lang === 'hi' && missingHindiVoice && (
                <div className="px-3.5 py-2 rounded-[12px] bg-amber-100 dark:bg-amber-950/60 border border-[#FEB21D] text-xs font-bold text-[#16213A] dark:text-[#FEB21D] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{t('awaazNoHindiVoiceNote', lang)}</span>
                </div>
              )}

              {/* PART 4C Rule 5: Offline Fallback */}
              {isOffline && (
                <div className="p-3.5 rounded-[14px] bg-amber-100 dark:bg-amber-950/70 border-2 border-[#FB8B11] text-sm font-extrabold text-[#16213A] dark:text-[#FEB21D] flex items-center gap-2.5">
                  <WifiOff className="w-5 h-5 shrink-0 text-[#EA580C]" />
                  <span>{t('awaazOfflineFallback', lang)}</span>
                </div>
              )}

              {/* PART 4C Rule 5: Unsupported browser or mic permission denied -> hide mic, show honest message */}
              {micUnavailable ? (
                <div className="p-4 rounded-[16px] bg-amber-50 dark:bg-[#17213A] border-2 border-[#FEB21D] text-sm font-bold text-[#16213A] dark:text-slate-100 flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-[#FB8B11] shrink-0" />
                  <span>{t('awaazUnsupportedFallback', lang)}</span>
                </div>
              ) : showPrivacyPrompt ? (
                /* PART 4C Rule 6: One-time Privacy Note before first use */
                <div className="p-4 rounded-[18px] bg-white dark:bg-[#17213A] border-2 border-[#FB8B11] space-y-3.5 shadow-md">
                  <h3 className="font-display text-lg font-extrabold text-[#16213A] dark:text-white">
                    {t('awaazPrivacyTitle', lang)}
                  </h3>
                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                    {t('awaazPrivacyNote', lang)}
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleAcceptPrivacy}
                      className="min-h-[56px] px-4 py-2.5 rounded-[14px] bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] font-display text-base font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-5 h-5 stroke-[2.5]" />
                      <span>{t('awaazAcceptBtn', lang)}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDeclinePrivacy}
                      className="min-h-[56px] px-4 py-2.5 rounded-[14px] border-2 border-slate-300 dark:border-slate-700 text-[#16213A] dark:text-slate-200 font-bold text-base flex items-center justify-center cursor-pointer"
                    >
                      {t('awaazNotNowBtn', lang)}
                    </button>
                  </div>
                </div>
              ) : (
                /* Big 64px Round Mic Button + Animated Pulse (respects prefers-reduced-motion) + Live Text */
                <div className="p-4 rounded-[20px] bg-white dark:bg-[#17213A] border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center space-y-3">
                  <button
                    type="button"
                    onClick={handleMicToggle}
                    className={`w-16 h-16 min-w-[64px] min-h-[64px] rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer ${
                      assistantState === 'listening'
                        ? 'bg-red-600 text-white ring-4 ring-red-400/50 motion-safe:animate-pulse'
                        : 'bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] hover:brightness-105'
                    }`}
                    aria-label={
                      assistantState === 'listening'
                        ? t('awaazTapToStop', lang)
                        : t('awaazTapToStart', lang)
                    }
                  >
                    <Mic className="w-8 h-8 stroke-[2.5]" />
                  </button>

                  <div>
                    <div className="font-display text-base font-extrabold text-[#16213A] dark:text-white">
                      {assistantState === 'listening'
                        ? `${t('awaazListeningState', lang)} (${t('awaazTapToStop', lang)})`
                        : t('awaazTapToStart', lang)}
                    </div>
                    {assistantState === 'listening' && (
                      <p className="text-sm font-bold text-[#EA580C] dark:text-[#FEB21D] mt-1">
                        {liveTranscript
                          ? `${t('awaazLiveTextLabel', lang)} “${liveTranscript}”`
                          : t('voiceListeningPrompt', lang)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* PART 4C Rule 3: Confirmation Card before search or booking intent ("I heard: ... Yes / Edit") */}
              {pendingConfirm && (
                <div className="p-4 rounded-[18px] bg-amber-50 dark:bg-[#17213A] border-2 border-[#FB8B11] space-y-3 shadow-md">
                  <div className="text-sm font-bold text-[#16213A] dark:text-white">
                    <span className="text-[#EA580C] dark:text-[#FEB21D] mr-1">
                      {t('awaazConfirmHeardPrefix', lang)}
                    </span>
                    <span>'{pendingConfirm.heardText}'.</span>{' '}
                    <span>
                      {lang === 'hi'
                        ? pendingConfirm.intent.confirmPromptHi
                        : pendingConfirm.intent.confirmPromptEn}
                    </span>
                  </div>

                  {pendingConfirm.isEditing ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        processUtterance(pendingConfirm.editDraft);
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={pendingConfirm.editDraft}
                        onChange={(e) =>
                          setPendingConfirm({
                            ...pendingConfirm,
                            editDraft: e.target.value,
                          })
                        }
                        className="flex-1 min-h-[56px] px-3.5 rounded-[14px] bg-white dark:bg-[#0E1527] border-2 border-[#FB8B11] text-sm font-bold text-[#16213A] dark:text-white focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="min-h-[56px] px-4 rounded-[14px] bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] font-display font-extrabold text-sm cursor-pointer"
                      >
                        {t('awaazConfirmApplyEditBtn', lang)}
                      </button>
                    </form>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          executeIntent(pendingConfirm.heardText, pendingConfirm.intent)
                        }
                        className="min-h-[56px] px-4 py-2.5 rounded-[14px] bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] font-display text-base font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-5 h-5 stroke-[2.5]" />
                        <span>{t('awaazConfirmYesBtn', lang)}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPendingConfirm({
                            ...pendingConfirm,
                            isEditing: true,
                          })
                        }
                        className="min-h-[56px] px-4 py-2.5 rounded-[14px] bg-white dark:bg-[#0E1527] border-2 border-slate-300 dark:border-slate-700 text-[#16213A] dark:text-white font-display text-base font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4 text-[#FB8B11]" />
                        <span>{t('awaazConfirmEditBtn', lang)}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* PART 4C Rule 3: Top 3 Choices as Big Buttons when confidence is low or 2 intents match */}
              {ambiguousChoices && (
                <div className="p-4 rounded-[18px] bg-white dark:bg-[#17213A] border-2 border-[#FEB21D] space-y-2.5">
                  <p className="text-xs font-extrabold text-[#EA580C] dark:text-[#FEB21D]">
                    {t('awaazAmbiguousPrompt', lang)}
                  </p>
                  <div className="space-y-2">
                    {ambiguousChoices.choices.map((choice) => (
                      <button
                        key={choice.id}
                        type="button"
                        onClick={() =>
                          executeIntent(
                            lang === 'hi' ? choice.choiceLabelHi : choice.choiceLabelEn,
                            choice
                          )
                        }
                        className="w-full min-h-[56px] px-4 py-3 rounded-[14px] bg-[#F3F5F9] dark:bg-[#0E1527] hover:bg-[#FEB21D]/20 border-2 border-slate-200 dark:border-slate-700 text-left font-display text-sm font-extrabold text-[#16213A] dark:text-white flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <span>
                          {lang === 'hi' ? choice.choiceLabelHi : choice.choiceLabelEn}
                        </span>
                        <Sparkles className="w-4 h-4 text-[#FB8B11] shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Short in-memory session history (cleared on close) */}
              {sessionHistory.length > 0 && (
                <div className="space-y-2">
                  {sessionHistory.map((turn) => (
                    <div
                      key={turn.id}
                      className="p-3.5 rounded-[16px] bg-white dark:bg-[#17213A] border border-slate-200 dark:border-slate-800 space-y-1.5"
                    >
                      <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {t('voiceYouSaidLabel', lang)}{' '}
                        <span className="text-[#16213A] dark:text-white">
                          “{turn.heardText}”
                        </span>
                      </div>
                      <div className="text-sm font-extrabold text-[#16213A] dark:text-[#FEB21D]">
                        {turn.replyText}
                      </div>
                      {turn.detailText && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-800">
                          {turn.detailText}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Typed Command / Search Input Box (Always available for fallback or typing) */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!typedInput.trim()) return;
                  const q = typedInput.trim();
                  setTypedInput('');
                  processUtterance(q);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={typedInput}
                  onChange={(e) => setTypedInput(e.target.value)}
                  placeholder={t('voiceTypeOrSpeakPlaceholder', lang)}
                  className="flex-1 min-h-[56px] px-4 rounded-[16px] bg-white dark:bg-[#17213A] border border-slate-300 dark:border-slate-700 text-sm font-bold text-[#16213A] dark:text-white focus:outline-none focus:border-[#FB8B11]"
                />
                <button
                  type="submit"
                  className="min-h-[56px] px-5 rounded-[16px] bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] font-display font-extrabold text-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{t('voiceSendBtn', lang)}</span>
                </button>
              </form>

              {/* PART 4C Rule 5: "What can I say?" button listing 8 example commands */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setShowWhatCanISay((prev) => !prev)}
                  className="w-full min-h-[56px] px-4 py-2.5 rounded-[16px] bg-white dark:bg-[#17213A] border-2 border-[#FB8B11]/60 text-[#16213A] dark:text-[#FEB21D] font-display text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <HelpCircle className="w-5 h-5 text-[#FB8B11]" />
                  <span>
                    {showWhatCanISay
                      ? t('awaazHideExamplesBtn', lang)
                      : t('awaazWhatCanISayBtn', lang)}
                  </span>
                </button>

                {showWhatCanISay && (
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {exampleCommands.map((ex, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => processUtterance(ex.phrase)}
                        className="min-h-[56px] px-3.5 py-2.5 rounded-[14px] bg-white dark:bg-[#17213A] hover:bg-[#FEB21D]/15 border border-slate-200 dark:border-slate-800 text-left text-xs sm:text-sm font-bold text-[#16213A] dark:text-slate-100 flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <span>{ex.label}</span>
                        <Sparkles className="w-4 h-4 text-[#FB8B11] shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sahayak FAQ Quick Chips (reusing shared SAHAYAK_FAQ_TOPICS) */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                  {t('voiceExamplesTitle', lang)}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SAHAYAK_FAQ_TOPICS.slice(0, 6).map((topic) => (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => processUtterance(topic.keywords[0])}
                      className="min-h-[44px] px-3 py-1.5 rounded-full bg-white dark:bg-[#17213A] border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#16213A] dark:text-slate-200 hover:border-[#FB8B11] cursor-pointer"
                    >
                      {t(topic.qKey, lang)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
