import { SupportedLanguage } from '../i18n/translations';

// Declare types for Web Speech API
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as IWindow;
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function getVoiceLangTag(lang: SupportedLanguage): string {
  switch (lang) {
    case 'kn':
      return 'kn-IN';
    case 'hi':
      return 'hi-IN';
    case 'en':
    default:
      return 'en-IN';
  }
}

export interface RecognitionCallbacks {
  onResult: (transcript: string, isFinal?: boolean) => void;
  onInterim?: (interim: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  onStart?: () => void;
  onVolumeChange?: (volume: number) => void; // 0 to 100 volume level
}

export function startSpeechRecognition(
  lang: SupportedLanguage,
  callbacks: RecognitionCallbacks
): (() => void) | null {
  if (typeof window === 'undefined') return null;

  if (!isSpeechRecognitionSupported()) {
    callbacks.onError?.('Speech recognition is not natively supported in this browser. Please use the microphone simulator or type your details.');
    return null;
  }

  try {
    const win = window as unknown as IWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass();

    recognition.lang = getVoiceLangTag(lang);
    recognition.continuous = true; // Keep listening until user pauses or clicks stop
    recognition.interimResults = true; // Show live words as user speaks
    recognition.maxAlternatives = 1;

    let accumulatedText = '';
    let stoppedManually = false;
    let micStream: MediaStream | null = null;
    let audioCtx: AudioContext | null = null;
    let animId: number | null = null;

    // Optional audio volume meter using Web Audio API
    if (callbacks.onVolumeChange && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          micStream = stream;
          try {
            const AudioContextClass = win.AudioContext || win.webkitAudioContext;
            if (AudioContextClass) {
              audioCtx = new AudioContextClass();
              const source = audioCtx.createMediaStreamSource(stream);
              const analyser = audioCtx.createAnalyser();
              analyser.fftSize = 256;
              source.connect(analyser);

              const dataArray = new Uint8Array(analyser.frequencyBinCount);
              const trackVolume = () => {
                if (stoppedManually) return;
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                  sum += dataArray[i];
                }
                const average = sum / dataArray.length;
                const normalized = Math.min(100, Math.round((average / 128) * 100));
                callbacks.onVolumeChange?.(normalized);
                animId = requestAnimationFrame(trackVolume);
              };
              trackVolume();
            }
          } catch {
            // AudioContext not allowed or failed, non-blocking
          }
        })
        .catch((err) => {
          console.warn('Microphone stream access for volume meter failed:', err);
        });
    }

    recognition.onstart = () => {
      callbacks.onStart?.();
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const trans = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) {
          accumulatedText += (accumulatedText ? ' ' : '') + trans;
        } else {
          interim += trans;
        }
      }

      if (interim && callbacks.onInterim) {
        callbacks.onInterim(interim);
      }

      const fullTranscript = (accumulatedText + (interim ? ` ${interim}` : '')).trim();
      if (fullTranscript) {
        callbacks.onResult(fullTranscript, false);
      }
    };

    recognition.onerror = (event: any) => {
      // Don't treat transient 'no-speech' as a fatal error
      if (event.error === 'no-speech') {
        return;
      }

      let errorMsg = event.error || 'Speech recognition error';
      if (event.error === 'not-allowed') {
        errorMsg = 'Microphone permission was not allowed. Please enable microphone permissions in your browser bar.';
      } else if (event.error === 'network') {
        errorMsg = 'Speech network error. Please verify your connection or use the quick voice samples.';
      } else if (event.error === 'audio-capture') {
        errorMsg = 'No microphone device was detected on your system.';
      }

      callbacks.onError?.(errorMsg);
    };

    recognition.onend = () => {
      if (!stoppedManually && accumulatedText) {
        callbacks.onResult(accumulatedText.trim(), true);
      }
      callbacks.onEnd?.();
    };

    recognition.start();

    // Return cleanup stopper
    return () => {
      stoppedManually = true;
      if (animId) cancelAnimationFrame(animId);
      if (audioCtx) {
        try {
          audioCtx.close();
        } catch {}
      }
      if (micStream) {
        try {
          micStream.getTracks().forEach((track) => track.stop());
        } catch {}
      }
      try {
        recognition.stop();
      } catch {
        // Ignore stop errors if already stopped
      }
    };
  } catch (err: any) {
    console.warn('Failed to start speech recognition:', err);
    callbacks.onError?.(err?.message || 'Could not initialize microphone speech recognition.');
    return null;
  }
}

// Clean markdown tags and URLs for natural voice readout
export function cleanTextForSpeech(rawText: string): string {
  return rawText
    .replace(/#{1,6}\s?/g, '') // Remove headers
    .replace(/\*{1,3}/g, '') // Remove bold/italics
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links, keep label
    .replace(/https?:\/\/\S+/g, '') // Remove URLs
    .replace(/[•\-\_]/g, ' ') // Replace bullets with space
    .replace(/\s+/g, ' ')
    .trim();
}

export function speakText(
  text: string,
  lang: SupportedLanguage,
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  }
): void {
  if (!isSpeechSynthesisSupported()) {
    options?.onError?.();
    return;
  }

  // Cancel any ongoing speech first
  window.speechSynthesis.cancel();

  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) return;

  const utterance = new SpeechSynthesisUtterance(cleaned);
  const targetTag = getVoiceLangTag(lang);
  utterance.lang = targetTag;
  utterance.rate = 0.95; // Slightly slower, clear conversational pace
  utterance.pitch = 1.0;

  // Attempt to find matching voice
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(
    (v) => v.lang.toLowerCase() === targetTag.toLowerCase() || v.lang.toLowerCase().startsWith(lang)
  );
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  utterance.onstart = () => {
    options?.onStart?.();
  };

  utterance.onend = () => {
    options?.onEnd?.();
  };

  utterance.onerror = () => {
    options?.onError?.();
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeech(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}
