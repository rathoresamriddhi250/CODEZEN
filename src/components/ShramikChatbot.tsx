import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  HelpCircle,
  Mic,
  Volume2,
  VolumeX,
  Trash2,
  Check,
  Edit3,
  Square,
  AlertCircle,
  WifiOff,
} from 'lucide-react';
import { Language, TranslationKey, t } from '../i18n';
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
  FaqTopicDef,
  ParsedVoiceIntent,
  SAHAYAK_FAQ_TOPICS,
  parseVoiceIntent,
} from '../utils/voiceIntents';
import { GlobalVoiceAction } from './VoiceCommandAssistant';

interface ShramikChatbotProps {
  lang: Language;
  onExecuteAction?: (action: GlobalVoiceAction) => void;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  textKey?: TranslationKey;
  customText?: string;
}

function matchTopicAnswerKey(input: string): TranslationKey | null {
  const q = input.toLowerCase().trim();
  for (const topic of SAHAYAK_FAQ_TOPICS) {
    if (topic.keywords.some((kw) => q.includes(kw))) {
      return topic.aKey;
    }
  }
  return null;
}

export const ShramikChatbot: React.FC<ShramikChatbotProps> = ({
  lang,
  onExecuteAction,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'bot',
      textKey: 'chatbotWelcome',
    },
  ]);

  const [speechRecSupported, setSpeechRecSupported] = useState(() =>
    isSpeechRecognitionSupported()
  );
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isOffline, setIsOffline] = useState(() =>
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [missingHindiVoice, setMissingHindiVoice] = useState(false);
  const [isMuted, setIsMuted] = useState(() => getVoiceMuted());
  const [isListening, setIsListening] = useState(false);
  const [liveRecognizedText, setLiveRecognizedText] = useState('');
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [showPrivacyNote, setShowPrivacyNote] = useState(false);
  const [showWhatCanISay, setShowWhatCanISay] = useState(false);

  // Safety Rule 3: Confirmation card & Ambiguous Top-3 choices inside Sahayak sheet
  const [pendingConfirm, setPendingConfirm] = useState<{
    heardText: string;
    intent: ParsedVoiceIntent;
    isEditing: boolean;
    editDraft: string;
  } | null>(null);
  const [ambiguousChoices, setAmbiguousChoices] = useState<ParsedVoiceIntent[] | null>(
    null
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSpeechRecSupported(isSpeechRecognitionSupported());
    if (lang === 'hi') {
      setMissingHindiVoice(!isHindiVoiceAvailable());
    } else {
      setMissingHindiVoice(false);
    }
  }, [lang, isOpen]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => {
      setIsOffline(true);
      stopListeningVoice();
      setIsListening(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, pendingConfirm, ambiguousChoices]);

  const speakBotReply = (msgId: string, text: string, targetLang: Language = lang) => {
    if (getVoiceMuted()) return;
    speakClearVoice(text, {
      lang: targetLang,
      max20Words: true,
      onStart: () => setSpeakingMsgId(msgId),
      onEnd: () => setSpeakingMsgId(null),
      onMissingHindiVoice: () => {
        setMissingHindiVoice(true);
        setSpeakingMsgId(null);
      },
    });
  };

  const handleTopicTap = (topic: FaqTopicDef) => {
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      textKey: topic.qKey,
    };
    const botMsgId = `b-${Date.now() + 1}`;
    const botMsg: ChatMessage = {
      id: botMsgId,
      sender: 'bot',
      textKey: topic.aKey,
    };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    speakBotReply(botMsgId, t(topic.shortSpokenKey, lang), lang);
  };

  const executeIntentInChat = (heardText: string, intent: ParsedVoiceIntent) => {
    setPendingConfirm(null);
    setAmbiguousChoices(null);

    const replyLang: Language =
      intent.kind === 'switch_language' && intent.targetLang
        ? intent.targetLang
        : lang;
    const spokenText =
      replyLang === 'hi' ? intent.spokenReplyHi : intent.spokenReplyEn;
    const displayText =
      (replyLang === 'hi' ? intent.displayTextHi : intent.displayTextEn) || spokenText;

    const botMsgId = `b-${Date.now() + 1}`;
    setMessages((prev) => [
      ...prev,
      { id: botMsgId, sender: 'bot', customText: displayText },
    ]);

    if (onExecuteAction) {
      switch (intent.kind) {
        case 'switch_language':
          if (intent.targetLang) {
            onExecuteAction({ type: 'switch_language', lang: intent.targetLang });
          }
          break;
        case 'search_workers':
          onExecuteAction({
            type: 'filter_trade',
            trade: intent.trade || 'all',
            maxPrice: intent.maxPrice,
            searchQuery: intent.searchQuery,
          });
          break;
        case 'search_jobs':
          onExecuteAction({ type: 'search_jobs' });
          break;
        case 'booking_help':
          onExecuteAction({
            type: 'booking_help',
            workerId: intent.targetWorkerId || 'worker-sample-1',
            date: intent.bookingDate || '',
            slot: intent.bookingSlot || '10-12',
          });
          break;
        case 'worker_add_record':
          onExecuteAction({ type: 'worker_add_record' });
          break;
        case 'worker_mark_complete':
          onExecuteAction({ type: 'worker_mark_complete' });
          break;
        case 'nav_profile':
          onExecuteAction({ type: 'open_profile' });
          break;
        case 'nav_reviews':
          onExecuteAction({ type: 'open_profile', section: 'reviews' });
          break;
        case 'nav_bookings':
          onExecuteAction({ type: 'open_bookings' });
          break;
        case 'nav_my_work':
          onExecuteAction({ type: 'open_my_slots' });
          break;
        case 'nav_history':
          onExecuteAction({ type: 'open_customer_history' });
          break;
        case 'nav_home':
          onExecuteAction({ type: 'open_home' });
          break;
      }
    }

    if (intent.kind === 'read_aloud') {
      const summary = extractSafeScreenSummary(replyLang);
      speakBotReply(botMsgId, `${spokenText} ${summary}`, replyLang);
    } else {
      speakBotReply(botMsgId, spokenText, replyLang);
    }
  };

  const handleSendText = (rawText: string) => {
    const clean = rawText.trim();
    if (!clean) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      customText: clean,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setPendingConfirm(null);
    setAmbiguousChoices(null);

    // First check rule-based voice intent parser
    const parsed = parseVoiceIntent(clean);
    if (parsed.ambiguousChoices && parsed.ambiguousChoices.length > 0 && parsed.primary.kind !== 'unknown') {
      setAmbiguousChoices(parsed.ambiguousChoices.slice(0, 3));
      const botMsgId = `b-${Date.now() + 1}`;
      const msg = t('awaazAmbiguousPrompt', lang);
      setMessages((prev) => [...prev, { id: botMsgId, sender: 'bot', customText: msg }]);
      speakBotReply(botMsgId, msg, lang);
      return;
    }

    if (parsed.primary.requiresConfirmation) {
      setPendingConfirm({
        heardText: clean,
        intent: parsed.primary,
        isEditing: false,
        editDraft: clean,
      });
      const promptText =
        lang === 'hi'
          ? parsed.primary.confirmPromptHi || ''
          : parsed.primary.confirmPromptEn || '';
      speakBotReply(`confirm-${Date.now()}`, `${t('awaazConfirmHeardPrefix', lang)} ${clean}. ${promptText}`, lang);
      return;
    }

    if (parsed.primary.kind !== 'unknown') {
      executeIntentInChat(clean, parsed.primary);
      return;
    }

    // Fallback to FAQ topic match or honest Not Understood message
    const faqKey = matchTopicAnswerKey(clean);
    const botMsgId = `b-${Date.now() + 1}`;
    if (faqKey) {
      setMessages((prev) => [...prev, { id: botMsgId, sender: 'bot', textKey: faqKey }]);
      speakBotReply(botMsgId, t(faqKey, lang), lang);
    } else {
      const fallbackText = t('awaazNotUnderstood', lang);
      setMessages((prev) => [
        ...prev,
        { id: botMsgId, sender: 'bot', customText: fallbackText },
      ]);
      setAmbiguousChoices(parsed.ambiguousChoices || null);
      speakBotReply(botMsgId, fallbackText, lang);
    }
  };

  const handleClearChat = () => {
    stopAllVoice();
    stopListeningVoice();
    setSpeakingMsgId(null);
    setPendingConfirm(null);
    setAmbiguousChoices(null);
    setLiveRecognizedText('');
    setMessages([
      {
        id: 'welcome-msg',
        sender: 'bot',
        textKey: 'chatbotWelcome',
      },
    ]);
  };

  const handleCloseSheet = () => {
    // PART 4C Rule 6: Clear in-memory session history on close
    handleClearChat();
    setIsOpen(false);
  };

  const handleSpeakMessage = (msgId: string, text: string) => {
    if (speakingMsgId === msgId) {
      stopAllVoice();
      setSpeakingMsgId(null);
      return;
    }
    speakBotReply(msgId, text, lang);
  };

  const beginMicListening = () => {
    if (isOffline) return;
    setLiveRecognizedText('');
    listenToUserVoice({
      lang,
      onStart: () => setIsListening(true),
      onInterim: (liveText) => {
        setLiveRecognizedText(liveText);
        setInput(liveText);
      },
      onResult: (transcript) => {
        setIsListening(false);
        setLiveRecognizedText('');
        setInput('');
        if (transcript) {
          handleSendText(transcript);
        }
      },
      onError: (reason) => {
        setIsListening(false);
        setLiveRecognizedText('');
        if (reason === 'permission_denied') {
          setPermissionDenied(true);
        } else if (reason === 'unsupported') {
          setSpeechRecSupported(false);
        } else if (reason === 'offline') {
          setIsOffline(true);
        }
      },
      onEnd: () => {
        setIsListening(false);
      },
    });
  };

  const handleStartVoiceInput = () => {
    if (isListening) {
      stopListeningVoice();
      setIsListening(false);
      return;
    }

    const consent = getVoiceConsent();
    if (!consent || !consent.accepted) {
      setShowPrivacyNote(true);
      return;
    }

    beginMicListening();
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setVoiceMuted(next);
    setIsMuted(next);
    if (next) {
      stopAllVoice();
      setSpeakingMsgId(null);
    }
  };

  const micUnavailable = !speechRecSupported || permissionDenied;

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

  return (
    <>
      {/* Floating Round Button (56px, bottom right above bottom bar) */}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-40">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="min-h-[56px] min-w-[56px] px-4 py-3 rounded-full bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] font-display font-extrabold text-sm sm:text-base shadow-xl border-2 border-white dark:border-[#16213A] flex items-center gap-2 hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            aria-label={t('chatbotTitle', lang)}
          >
            <MessageCircle className="w-6 h-6 stroke-[2.5] shrink-0" aria-hidden="true" />
            <span>{t('chatbotTitle', lang)}</span>
          </button>
        )}
      </div>

      {/* Sahayak Chat Sheet */}
      {isOpen && (
        <div
          className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-50 w-[calc(100vw-24px)] max-w-md bg-white dark:bg-[#17213A] rounded-[22px] border-2 border-[#FB8B11]/70 shadow-2xl flex flex-col overflow-hidden max-h-[84vh]"
          role="dialog"
          aria-label={t('chatbotTitle', lang)}
        >
          {/* Header: Shramik Sahayak + Mute + Stop + Clear + Close */}
          <div className="bg-[#16213A] text-white px-4 py-3.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-[12px] bg-gradient-to-br from-[#FEB21D] to-[#EA580C] text-[#16213A] flex items-center justify-center font-extrabold shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-base font-extrabold leading-tight text-white truncate">
                  {t('chatbotTitle', lang)} · {t('awaazTitle', lang)}
                </h2>
                <p className="text-[11px] text-[#FEB21D] font-semibold truncate">
                  {isListening
                    ? t('awaazListeningState', lang)
                    : speakingMsgId
                    ? t('awaazSpeakingState', lang)
                    : isMuted
                    ? t('awaazMutedState', lang)
                    : t('chatbotSubtitle', lang)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {speakingMsgId && (
                <button
                  type="button"
                  onClick={() => {
                    stopAllVoice();
                    setSpeakingMsgId(null);
                  }}
                  className="min-h-[36px] px-2 py-1 rounded-[10px] bg-red-600 text-xs font-bold text-white flex items-center gap-1 cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-white" />
                  <span>{t('awaazStopSpeakingBtn', lang)}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleToggleMute}
                className="min-h-[36px] px-2 py-1 rounded-[10px] bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1 cursor-pointer"
                title={isMuted ? t('awaazUnmuteToggle', lang) : t('awaazMuteToggle', lang)}
              >
                {isMuted ? (
                  <VolumeX className="w-3.5 h-3.5 text-[#FEB21D]" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </button>

              <button
                type="button"
                onClick={handleClearChat}
                className="min-h-[36px] px-2 py-1 rounded-[10px] bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1 cursor-pointer"
                title={t('chatbotClearBtn', lang)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleCloseSheet}
                className="w-9 h-9 rounded-[10px] bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                aria-label="Close chatbot"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notices for Missing Hindi Voice, Offline, Unsupported/Denied, or Privacy Note */}
          <div className="px-3 pt-2 bg-[#F3F5F9] dark:bg-[#0E1527] space-y-2">
            {lang === 'hi' && missingHindiVoice && (
              <div className="px-3 py-1.5 rounded-[10px] bg-amber-100 dark:bg-amber-950/60 border border-[#FEB21D] text-[11px] font-bold text-[#16213A] dark:text-[#FEB21D] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{t('awaazNoHindiVoiceNote', lang)}</span>
              </div>
            )}

            {isOffline && (
              <div className="px-3 py-2 rounded-[10px] bg-amber-100 dark:bg-amber-950/70 border border-[#FB8B11] text-xs font-bold text-[#16213A] dark:text-[#FEB21D] flex items-center gap-1.5">
                <WifiOff className="w-4 h-4 shrink-0 text-[#EA580C]" />
                <span>{t('awaazOfflineFallback', lang)}</span>
              </div>
            )}

            {micUnavailable && (
              <div className="px-3 py-2 rounded-[10px] bg-amber-50 dark:bg-[#17213A] border border-[#FEB21D] text-xs font-bold text-[#16213A] dark:text-slate-200 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#FB8B11]" />
                <span>{t('awaazUnsupportedFallback', lang)}</span>
              </div>
            )}

            {showPrivacyNote && (
              <div className="p-3 rounded-[14px] bg-white dark:bg-[#17213A] border-2 border-[#FB8B11] space-y-2">
                <p className="text-xs font-bold text-[#16213A] dark:text-slate-100 leading-relaxed">
                  {t('awaazPrivacyNote', lang)}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceConsent(true);
                      setShowPrivacyNote(false);
                      beginMicListening();
                    }}
                    className="min-h-[48px] px-3 py-1.5 rounded-[12px] bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] font-display text-sm font-extrabold cursor-pointer"
                  >
                    {t('awaazAcceptBtn', lang)}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceConsent(false);
                      setShowPrivacyNote(false);
                    }}
                    className="min-h-[48px] px-3 py-1.5 rounded-[12px] border border-slate-300 dark:border-slate-700 text-xs font-bold text-[#16213A] dark:text-slate-200 cursor-pointer"
                  >
                    {t('awaazNotNowBtn', lang)}
                  </button>
                </div>
              </div>
            )}

            {isListening && (
              <div className="px-3 py-2 rounded-[12px] bg-red-600 text-white text-xs font-extrabold flex items-center justify-between gap-2 motion-safe:animate-pulse">
                <span>
                  {t('awaazListeningState', lang)}{' '}
                  {liveRecognizedText ? `“${liveRecognizedText}”` : ''}
                </span>
                <span className="text-[10px] underline">{t('awaazTapToStop', lang)}</span>
              </div>
            )}
          </div>

          {/* Messages List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F3F5F9] dark:bg-[#0E1527] max-h-[260px]">
            {messages.map((m) => {
              const displayText = m.textKey ? t(m.textKey, lang) : m.customText || '';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[90%] rounded-[16px] px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-[#16213A] text-white dark:bg-[#FEB21D] dark:text-[#16213A] font-bold'
                        : 'bg-white dark:bg-[#17213A] text-[#16213A] dark:text-slate-100 border border-slate-200/80 dark:border-slate-800 shadow-xs'
                    }`}
                  >
                    <p>{displayText}</p>
                    {m.sender === 'bot' && (
                      <button
                        type="button"
                        onClick={() => handleSpeakMessage(m.id, displayText)}
                        className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F3F5F9] dark:bg-[#0E1527] text-xs font-bold text-[#EA580C] dark:text-[#FEB21D] cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>
                          {speakingMsgId === m.id
                            ? t('chatbotStopListenBtn', lang)
                            : t('chatbotListenBtn', lang)}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Confirmation Card inside Sahayak Sheet */}
            {pendingConfirm && (
              <div className="p-3.5 rounded-[16px] bg-amber-50 dark:bg-[#17213A] border-2 border-[#FB8B11] space-y-2.5">
                <p className="text-xs font-extrabold text-[#16213A] dark:text-white">
                  {t('awaazConfirmHeardPrefix', lang)} '{pendingConfirm.heardText}'.{' '}
                  {lang === 'hi'
                    ? pendingConfirm.intent.confirmPromptHi
                    : pendingConfirm.intent.confirmPromptEn}
                </p>
                {pendingConfirm.isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={pendingConfirm.editDraft}
                      onChange={(e) =>
                        setPendingConfirm({
                          ...pendingConfirm,
                          editDraft: e.target.value,
                        })
                      }
                      className="flex-1 min-h-[48px] px-3 rounded-[12px] bg-white dark:bg-[#0E1527] border border-[#FB8B11] text-xs font-bold text-[#16213A] dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleSendText(pendingConfirm.editDraft)}
                      className="min-h-[48px] px-3 rounded-[12px] bg-[#FB8B11] text-[#16213A] text-xs font-extrabold cursor-pointer"
                    >
                      {t('awaazConfirmApplyEditBtn', lang)}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        executeIntentInChat(
                          pendingConfirm.heardText,
                          pendingConfirm.intent
                        )
                      }
                      className="min-h-[56px] px-3 py-2 rounded-[12px] bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] font-display text-sm font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
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
                      className="min-h-[56px] px-3 py-2 rounded-[12px] border border-slate-300 dark:border-slate-700 text-xs font-extrabold text-[#16213A] dark:text-white flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4 text-[#FB8B11]" />
                      <span>{t('awaazConfirmEditBtn', lang)}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Top 3 Ambiguous Choices as Big Buttons */}
            {ambiguousChoices && ambiguousChoices.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {ambiguousChoices.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() =>
                      executeIntentInChat(
                        lang === 'hi' ? choice.choiceLabelHi : choice.choiceLabelEn,
                        choice
                      )
                    }
                    className="w-full min-h-[56px] px-3.5 py-2.5 rounded-[14px] bg-white dark:bg-[#17213A] border-2 border-[#FEB21D] text-left text-xs font-extrabold text-[#16213A] dark:text-white flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <span>
                      {lang === 'hi' ? choice.choiceLabelHi : choice.choiceLabelEn}
                    </span>
                    <Sparkles className="w-4 h-4 text-[#FB8B11] shrink-0" />
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* "What can I say?" + Quick-Reply FAQ Topic Chips */}
          <div className="px-3 py-2.5 bg-white dark:bg-[#17213A] border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowWhatCanISay((prev) => !prev)}
                className="min-h-[40px] px-3 py-1 rounded-full bg-amber-50 dark:bg-[#0E1527] border border-[#FB8B11] text-xs font-extrabold text-[#EA580C] dark:text-[#FEB21D] flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>
                  {showWhatCanISay
                    ? t('awaazHideExamplesBtn', lang)
                    : t('awaazWhatCanISayBtn', lang)}
                </span>
              </button>
            </div>

            {showWhatCanISay ? (
              <div className="grid grid-cols-1 gap-1.5 max-h-[140px] overflow-y-auto">
                {exampleCommands.map((ex, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendText(ex.phrase)}
                    className="min-h-[44px] px-3 py-1.5 rounded-[10px] bg-[#F3F5F9] dark:bg-[#0E1527] hover:bg-[#FEB21D]/20 text-left text-xs font-bold text-[#16213A] dark:text-slate-200 cursor-pointer"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-[95px] overflow-y-auto">
                {SAHAYAK_FAQ_TOPICS.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => handleTopicTap(topic)}
                    className="px-2.5 py-1.5 rounded-full bg-[#F3F5F9] dark:bg-[#0E1527] hover:bg-[#FEB21D]/20 border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#16213A] dark:text-slate-200 flex items-center gap-1 text-left cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-[#FB8B11] shrink-0" />
                    <span>{t(topic.qKey, lang)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input Bar + Mic Button inside Sahayak Chat Sheet */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendText(input);
            }}
            className="p-3 bg-white dark:bg-[#17213A] border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
          >
            {!micUnavailable && (
              <button
                type="button"
                onClick={handleStartVoiceInput}
                aria-label={
                  isListening ? t('awaazTapToStop', lang) : t('awaazTapToStart', lang)
                }
                className={`min-h-[56px] min-w-[56px] rounded-full flex items-center justify-center shrink-0 cursor-pointer ${
                  isListening
                    ? 'bg-red-600 text-white motion-safe:animate-pulse'
                    : 'bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] shadow-sm'
                }`}
              >
                <Mic className="w-6 h-6 stroke-[2.5]" />
              </button>
            )}

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chatbotPlaceholder', lang)}
              className="flex-1 min-h-[56px] px-3.5 rounded-[14px] bg-[#F3F5F9] dark:bg-[#0E1527] border border-slate-300 dark:border-slate-700 text-sm text-[#16213A] dark:text-white focus:outline-none focus:border-[#FB8B11]"
            />
            <button
              type="submit"
              className="min-h-[56px] px-4 rounded-[14px] bg-gradient-to-r from-[#FEB21D] via-[#FB8B11] to-[#EA580C] text-[#16213A] font-bold text-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{t('chatbotSendBtn', lang)}</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
};
