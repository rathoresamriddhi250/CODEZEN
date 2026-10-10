import { Language } from '../i18n';
import { getVoiceMuted } from '../data/store';
import { sanitizeForSpeech, trimToMax20Words } from './voiceIntents';

let cachedVoices: SpeechSynthesisVoice[] = [];
let activeRecognition: {
  stop: () => void;
  abort: () => void;
} | null = null;
let silenceTimeoutId: number | null = null;

function loadBrowserVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  const list = window.speechSynthesis.getVoices();
  if (list && list.length > 0) {
    cachedVoices = list;
  }
  return cachedVoices;
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadBrowserVoices();
  if ('onvoiceschanged' in window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {
      loadBrowserVoices();
    };
  }
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
}

export function isHindiVoiceAvailable(): boolean {
  const voices = loadBrowserVoices();
  if (voices.length === 0) {
    // If voices array is empty before first synth call, check if speechSynthesis exists
    return Boolean(typeof window !== 'undefined' && window.speechSynthesis);
  }
  return voices.some((v) => v.lang.toLowerCase().startsWith('hi'));
}

function pickBestVoice(lang: Language): SpeechSynthesisVoice | null {
  const voices = loadBrowserVoices();
  if (!voices.length) return null;

  if (lang === 'hi') {
    const hiVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('hi'));
    if (hiVoices.length === 0) return null;
    return (
      hiVoices.find((v) => v.lang.toLowerCase() === 'hi-in' && v.name.includes('Google')) ||
      hiVoices.find((v) => v.lang.toLowerCase() === 'hi-in') ||
      hiVoices[0]
    );
  }

  const enVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  return (
    enVoices.find((v) => v.lang.toLowerCase() === 'en-in' && v.name.includes('Google')) ||
    enVoices.find((v) => v.lang.toLowerCase() === 'en-in') ||
    enVoices[0] ||
    null
  );
}

export function stopAllVoice(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export interface SpeakVoiceOptions {
  lang: Language;
  max20Words?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onMissingHindiVoice?: () => void;
}

/**
 * Speaks a reply using browser speechSynthesis in the chosen language (hi-IN or en-IN).
 * Respects mute setting, keeps replies under 20 words, and never reads out mobile numbers, IDs, or addresses.
 * If lang === 'hi' and no Hindi voice is installed, shows text only and triggers onMissingHindiVoice.
 */
export function speakClearVoice(rawText: string, options: SpeakVoiceOptions): void {
  const { lang, max20Words = true, onStart, onEnd, onMissingHindiVoice } = options;

  stopAllVoice();

  if (getVoiceMuted()) {
    onEnd?.();
    return;
  }

  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onEnd?.();
    return;
  }

  const safeText = max20Words
    ? trimToMax20Words(rawText)
    : sanitizeForSpeech(rawText);

  if (!safeText) {
    onEnd?.();
    return;
  }

  const voices = loadBrowserVoices();
  const preferredVoice = pickBestVoice(lang);

  // PART 4C Rule 4: "If no Hindi voice is installed, show text only and a small note 'Hindi voice not available on this phone'."
  if (lang === 'hi' && voices.length > 0 && !preferredVoice) {
    onMissingHindiVoice?.();
    onEnd?.();
    return;
  }

  try {
    const utter = new SpeechSynthesisUtterance(safeText);
    utter.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    if (preferredVoice) {
      utter.voice = preferredVoice;
    }
    utter.rate = 0.95;
    utter.pitch = 1.0;

    utter.onstart = () => {
      onStart?.();
    };
    utter.onend = () => {
      onEnd?.();
    };
    utter.onerror = () => {
      onEnd?.();
    };

    window.speechSynthesis.speak(utter);
  } catch {
    onEnd?.();
  }
}

export function cleanSpokenSearchText(raw: string): string {
  return raw
    .replace(/[.,!?।"'`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stopListeningVoice(): void {
  if (silenceTimeoutId !== null) {
    window.clearTimeout(silenceTimeoutId);
    silenceTimeoutId = null;
  }
  if (activeRecognition) {
    try {
      activeRecognition.stop();
    } catch {
      // ignore
    }
    activeRecognition = null;
  }
}

export interface ListenVoiceOptions {
  lang: Language;
  onStart?: () => void;
  onInterim?: (liveTranscript: string) => void;
  onResult: (finalTranscript: string) => void;
  onError?: (reason: 'unsupported' | 'permission_denied' | 'offline' | 'no_speech') => void;
  onEnd?: () => void;
  onVolumeChange?: (level: number) => void;
}

/**
 * PART 4C Rule 1:
 * Uses SpeechRecognition (webkitSpeechRecognition) with lang hi-IN when app language is Hindi,
 * en-IN when English, and a 10 second silence timeout.
 * Tap to start, tap again to stop. No always-on listening and no wake word.
 */
export function listenToUserVoice(options: ListenVoiceOptions): void {
  const { lang, onStart, onInterim, onResult, onError, onEnd } = options;

  stopAllVoice();
  stopListeningVoice();

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    onError?.('offline');
    onEnd?.();
    return;
  }

  const win = window as unknown as {
    SpeechRecognition?: new () => {
      lang: string;
      interimResults: boolean;
      maxAlternatives: number;
      continuous: boolean;
      onstart: (() => void) | null;
      onresult:
        | ((e: {
            results?: ArrayLike<ArrayLike<{ transcript?: string }> & { isFinal?: boolean }>;
          }) => void)
        | null;
      onerror: ((e: { error?: string }) => void) | null;
      onend: (() => void) | null;
      start: () => void;
      stop: () => void;
      abort: () => void;
    };
    webkitSpeechRecognition?: new () => {
      lang: string;
      interimResults: boolean;
      maxAlternatives: number;
      continuous: boolean;
      onstart: (() => void) | null;
      onresult:
        | ((e: {
            results?: ArrayLike<ArrayLike<{ transcript?: string }> & { isFinal?: boolean }>;
          }) => void)
        | null;
      onerror: ((e: { error?: string }) => void) | null;
      onend: (() => void) | null;
      start: () => void;
      stop: () => void;
      abort: () => void;
    };
  };

  const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
  if (!SpeechRec) {
    onError?.('unsupported');
    onEnd?.();
    return;
  }

  let latestTranscript = '';
  let hasResolved = false;

  const resetSilenceTimer = () => {
    if (silenceTimeoutId !== null) {
      window.clearTimeout(silenceTimeoutId);
    }
    // 10 second silence timeout as required by PART 4C
    silenceTimeoutId = window.setTimeout(() => {
      stopListeningVoice();
    }, 10000);
  };

  try {
    const rec = new SpeechRec();
    rec.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = false;

    activeRecognition = rec;

    rec.onstart = () => {
      onStart?.();
      resetSilenceTimer();
    };

    rec.onresult = (event) => {
      resetSilenceTimer();
      let combined = '';
      const results = event?.results;
      if (results) {
        for (let i = 0; i < results.length; i++) {
          const piece = results[i]?.[0]?.transcript || '';
          combined += piece + ' ';
        }
      }
      const cleaned = combined.trim();
      if (cleaned) {
        latestTranscript = cleaned;
        onInterim?.(cleaned);
      }
    };

    rec.onerror = (event) => {
      if (silenceTimeoutId !== null) {
        window.clearTimeout(silenceTimeoutId);
        silenceTimeoutId = null;
      }
      const errCode = event?.error || '';
      if (errCode === 'not-allowed' || errCode === 'service-not-allowed') {
        hasResolved = true;
        onError?.('permission_denied');
      } else if (errCode === 'network') {
        hasResolved = true;
        onError?.('offline');
      } else if (!latestTranscript) {
        hasResolved = true;
        onError?.('no_speech');
      }
    };

    rec.onend = () => {
      if (silenceTimeoutId !== null) {
        window.clearTimeout(silenceTimeoutId);
        silenceTimeoutId = null;
      }
      activeRecognition = null;
      if (!hasResolved) {
        hasResolved = true;
        if (latestTranscript.trim()) {
          onResult(latestTranscript.trim());
        } else {
          onError?.('no_speech');
        }
      }
      onEnd?.();
    };

    rec.start();
  } catch {
    onError?.('unsupported');
    onEnd?.();
  }
}

/**
 * Reads the current screen's main headings and text aloud (under 20 words, sanitized of mobile numbers, IDs, and addresses).
 */
export function extractSafeScreenSummary(lang: Language): string {
  if (typeof document === 'undefined') return '';
  const mainEl = document.querySelector('main');
  if (!mainEl) return '';

  const headings = Array.from(mainEl.querySelectorAll('h1, h2'))
    .map((el) => (el.textContent || '').trim())
    .filter(Boolean)
    .slice(0, 3);

  const joined = headings.join('. ');
  const sanitized = sanitizeForSpeech(joined);
  if (!sanitized) {
    return lang === 'hi'
      ? 'श्रमिक मुख्य स्क्रीन खुली है।'
      : 'Shramik main screen is open.';
  }
  return trimToMax20Words(sanitized);
}
