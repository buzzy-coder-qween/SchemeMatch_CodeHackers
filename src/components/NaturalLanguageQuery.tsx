import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Loader2,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  CheckCircle2,
  RefreshCw,
  User,
  MapPin,
  Briefcase,
  GraduationCap,
  IndianRupee,
  ShieldCheck,
  Award,
  AlertCircle,
  HelpCircle,
  Radio,
} from 'lucide-react';
import { extractProfileFromText } from '../services/api';
import { UserProfile } from '../types/scheme';
import { ExtractedAttributeBadge } from '../utils/profileExtractor';
import {
  SupportedLanguage,
  getTranslation,
} from '../i18n/translations';
import {
  startSpeechRecognition,
  isSpeechRecognitionSupported,
  speakText,
  stopSpeech,
} from '../utils/speech';

interface NaturalLanguageQueryProps {
  currentLanguage: SupportedLanguage;
  onProfileExtracted: (extracted: Partial<UserProfile>, summaryText?: string) => void;
  currentProfile?: UserProfile;
}

interface VoicePreset {
  labelEn: string;
  labelKn: string;
  labelHi: string;
  icon: string;
  textEn: string;
  textKn: string;
  textHi: string;
}

const VOICE_PRESETS: VoicePreset[] = [
  {
    labelEn: 'Belagavi Student (21y, Female, OBC 2A)',
    labelKn: 'ಬೆಳಗಾವಿ ವಿದ್ಯಾರ್ಥಿನಿ (21ವ, ಬಿ.ಎಸ್ಸಿ, ಪ್ರವರ್ಗ 2ಎ)',
    labelHi: 'बेलगावी छात्रा (21 वर्ष, बीएससी, ओबीसी)',
    icon: '🎓',
    textEn: 'I am a 21 year old female B.Sc student from Belagavi with family income of 1.5 lakhs belonging to Cat-2A OBC and BPL card.',
    textKn: 'ನಾನು ಬೆಳಗಾವಿಯ 21 ವರ್ಷದ ಬಿ.ಎಸ್ಸಿ ವಿದ್ಯಾರ್ಥಿನಿ, ಕುಟುಂಬದ ವಾರ್ಷಿಕ ಆದಾಯ 1.5 ಲಕ್ಷ ಮತ್ತು ಹಿಂದುಳಿದ ಪ್ರವರ್ಗ 2ಎ (OBC) ವರ್ಗಕ್ಕೆ ಸೇರಿದವಳು.',
    textHi: 'मैं बेलगावी की 21 वर्षीय छात्रा हूँ, बीएससी कर रही हूँ, परिवार की वार्षिक आय 1.5 लाख है और ओबीसी श्रेणी में आती हूँ।',
  },
  {
    labelEn: 'Mandya Farmer (46y, 2.5 Acres, BPL)',
    labelKn: 'ಮಂಡ್ಯ ರೈತ (46ವ, 2.5 ಎಕರೆ ಜಮೀನು, ಬಿಪಿಎಲ್)',
    labelHi: 'मांड्या किसान (46 वर्ष, 2.5 एकड़ भूमि, बीपीएल)',
    icon: '🌾',
    textEn: 'Small farmer in Mandya, 46 years old, owning 2.5 acres of land, BPL card holder, annual income 1.1 lakhs.',
    textKn: 'ಮಂಡ್ಯದ ಸಣ್ಣ ರೈತ, ವಯಸ್ಸು 46, 2.5 ಎಕರೆ ಕೃಷಿ ಜಮೀನು, ಬಿಪಿಎಲ್ ಕಾರ್ಡ್ ಮತ್ತು ವಾರ್ಷಿಕ ಆದಾಯ 1.1 ಲಕ್ಷ.',
    textHi: 'मांड्या का 46 वर्षीय छोटा किसान, 2.5 एकड़ कृषि भूमि का मालिक, बीपीएल कार्ड धारक, आय 1.1 लाख।',
  },
  {
    labelEn: 'Mysuru Homemaker Head (BPL Card)',
    labelKn: 'ಮೈಸೂರು ಮಹಿಳಾ ಯಜಮಾನಿ (ಬಿಪಿಎಲ್ ಕಾರ್ಡ್)',
    labelHi: 'मैसूरु महिला मुखिया (बीपीएल कार्ड)',
    icon: '🏡',
    textEn: 'Female homemaker and family head from Mysuru with BPL card, seeking monthly assistance and food grains.',
    textKn: 'ಮೈಸೂರಿನ ಮಹಿಳಾ ಕುಟುಂಬದ ಯಜಮಾನಿ, ಬಿಪಿಎಲ್ ರೇಷನ್ ಕಾರ್ಡ್ ಹೊಂದಿದ್ದು ಮಾಸಿಕ ಧನಸಹಾಯಕ್ಕಾಗಿ ಹುಡುಕುತ್ತಿದ್ದೇನೆ.',
    textHi: 'मैसूरु की महिला गृहणी और परिवार की मुखिया, बीपीएल कार्ड धारक, मासिक सहायता की तलाश में।',
  },
  {
    labelEn: 'Bengaluru Unemployed Youth (23y, Graduate)',
    labelKn: 'ಬೆಂಗಳೂರು ನಿರುದ್ಯೋಗಿ ಪದವೀಧರ (23ವ)',
    labelHi: 'बेंगलुरु बेरोजगार स्नातक (23 वर्ष)',
    icon: '💼',
    textEn: 'I am a 23 year old unemployed engineering graduate from Bengaluru searching for a job for 6 months.',
    textKn: 'ನಾನು ಬೆಂಗಳೂರಿನ 23 ವರ್ಷದ ನಿರುದ್ಯೋಗಿ ಇಂಜಿನಿಯರಿಂಗ್ ಪದವೀಧರ, 6 ತಿಂಗಳಿಂದ ಉದ್ಯೋಗ ಹುಡುಕುತ್ತಿದ್ದೇನೆ.',
    textHi: 'मैं बेंगलुरु का 23 वर्षीय बेरोजगार इंजीनियरिंग स्नातक हूँ, 6 महीने से नौकरी की तलाश में हूँ।',
  },
];

export const NaturalLanguageQuery: React.FC<NaturalLanguageQueryProps> = ({
  currentLanguage,
  onProfileExtracted,
}) => {
  const [text, setText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [lastExtractedSummary, setLastExtractedSummary] = useState<string | null>(null);
  const [connectedBadges, setConnectedBadges] = useState<ExtractedAttributeBadge[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [autoConnect, setAutoConnect] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState(0);

  const stopRecognitionRef = useRef<(() => void) | null>(null);
  const t = (key: string) => getTranslation(currentLanguage, key);

  // Stop listening and speech on unmount
  useEffect(() => {
    return () => {
      if (stopRecognitionRef.current) {
        stopRecognitionRef.current();
      }
      stopSpeech();
    };
  }, []);

  const handleToggleVoice = () => {
    setSpeechError(null);

    // If already listening, stop and extract immediately
    if (isListening) {
      if (stopRecognitionRef.current) {
        stopRecognitionRef.current();
        stopRecognitionRef.current = null;
      }
      setIsListening(false);
      setVolumeLevel(0);
      setInterimText('');

      const combined = (text + (interimText ? ` ${interimText}` : '')).trim();
      if (combined && autoConnect) {
        handleExtract(combined);
      }
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setSpeechError(
        currentLanguage === 'kn'
          ? 'ನಿಮ್ಮ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಮೈಕ್ರೊಫೋನ್ ಗುರುತಿಸುವಿಕೆ ಬೆಂಬಲಿತವಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಕೆಳಗಿನ ಮಾದರಿ ಧ್ವನಿ ಬಟನ್‌ಗಳನ್ನು ಬಳಸಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.'
          : currentLanguage === 'hi'
          ? 'आपके ब्राउज़र में आवाज़ पहचान सीधे समर्थित नहीं है। कृपया नीचे दिए गए आवाज़ नमूनों का उपयोग करें या लिखें।'
          : 'Speech recognition is not natively supported in this browser. Please use the voice sample presets below or type directly.'
      );
      return;
    }

    setIsListening(true);
    setInterimText('');

    const stopFn = startSpeechRecognition(currentLanguage, {
      onStart: () => {
        setIsListening(true);
        setSpeechError(null);
      },
      onInterim: (interim) => {
        setInterimText(interim);
      },
      onResult: (transcript, isFinal) => {
        setText(transcript);
        setInterimText('');
        if (isFinal) {
          setIsListening(false);
          setVolumeLevel(0);
          if (autoConnect && transcript.trim()) {
            handleExtract(transcript);
          }
        }
      },
      onVolumeChange: (vol) => {
        setVolumeLevel(vol);
      },
      onError: (err) => {
        setIsListening(false);
        setVolumeLevel(0);
        setInterimText('');
        setSpeechError(err);
      },
      onEnd: () => {
        setIsListening(false);
        setVolumeLevel(0);
      },
    });

    stopRecognitionRef.current = stopFn;
  };

  const handleExtract = async (inputQuery?: string) => {
    const query = (inputQuery || text).trim();
    if (!query) return;

    setLoading(true);
    setSpeechError(null);
    try {
      const result = await extractProfileFromText(query);
      const profile = result.profile;
      setConnectedBadges(result.badges || []);

      const count = result.badges?.length || Object.values(profile).filter((v) => v !== null && v !== undefined && v !== '').length;

      const summary = currentLanguage === 'kn'
        ? `${count} ಪ್ರೊಫೈಲ್ ವಿವರಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಪ್ರೊಫೈಲ್‌ಗೆ ಸಂಪರ್ಕಿಸಲಾಗಿದೆ.`
        : currentLanguage === 'hi'
        ? `${count} प्रोफ़ाइल विवरण सफलतापूर्वक प्रोफ़ाइल से जोड़े गए।`
        : `Successfully connected ${count} attributes to Citizen Profile via ${result.source === 'gemini' ? 'Gemini AI' : 'Multilingual Engine'}`;

      setLastExtractedSummary(summary);

      // Connect immediately to citizen profile attributes
      onProfileExtracted(profile, query);
    } catch (err) {
      console.error('Extraction error:', err);
      setSpeechError('Could not parse profile attributes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (preset: VoicePreset) => {
    const chosenText =
      currentLanguage === 'kn' ? preset.textKn : currentLanguage === 'hi' ? preset.textHi : preset.textEn;
    setText(chosenText);
    setInterimText('');
    handleExtract(chosenText);
  };

  const handleReadOutSummary = () => {
    if (isPlayingAudio) {
      stopSpeech();
      setIsPlayingAudio(false);
      return;
    }

    if (lastExtractedSummary) {
      setIsPlayingAudio(true);
      speakText(lastExtractedSummary, currentLanguage, {
        onEnd: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false),
      });
    }
  };

  const displayText = interimText ? `${text ? text + ' ' : ''}${interimText}` : text;

  return (
    <div className="bg-gradient-to-br from-indigo-50/70 via-white to-amber-50/50 rounded-2xl border border-indigo-200/80 p-4 sm:p-6 shadow-sm space-y-4">
      {/* Header with Title and Voice Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-sm flex items-center justify-center">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 flex-wrap">
              <span>{t('voiceInputTitle')}</span>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-indigo-200 shadow-2xs">
                <Radio className={`w-2.5 h-2.5 ${isListening ? 'text-rose-600 animate-pulse' : 'text-indigo-600'}`} />
                {currentLanguage === 'kn' ? 'ಲೈವ್ ಧ್ವನಿ ಸೌಲಭ್ಯ' : currentLanguage === 'hi' ? 'लाइव आवाज़ सहायता' : 'Real-Time Voice Enabled'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('voiceInputDesc')}
            </p>
          </div>
        </div>

        {/* Speak Now Main Action Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleVoice}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-4 ring-rose-200'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
            title="Click to speak using your microphone"
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>{t('stopVoiceBtn')}</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>{t('startVoiceBtn')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Voice Listening Active Waveform Banner */}
      {isListening && (
        <div className="p-3 bg-rose-50/90 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-950 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600" />
            </span>
            <div>
              <span className="font-bold block text-rose-900">{t('voiceListening')}</span>
              <span className="text-[11px] text-rose-700">
                {currentLanguage === 'kn'
                  ? 'ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ (ವಯಸ್ಸು, ಶಿಕ್ಷಣ, ಜಿಲ್ಲೆ, ಆದಾಯ...)'
                  : currentLanguage === 'hi'
                  ? 'हिंदी में बोलें (आयु, शिक्षा, जिला, आय...)'
                  : 'Speak your Age, Education, District, Income, Category into mic...'}
              </span>
            </div>
          </div>

          {/* Dynamic Audio Equalizer Bars */}
          <div className="flex items-end gap-1 h-6 px-3 py-1 bg-white/80 rounded-lg border border-rose-200">
            {[0.4, 0.8, 1.2, 0.6, 1.0, 0.5].map((factor, i) => {
              const heightPct = Math.max(15, Math.min(100, (volumeLevel || 20) * factor));
              return (
                <div
                  key={i}
                  className="w-1.5 bg-rose-500 rounded-full transition-all duration-75"
                  style={{ height: `${heightPct}%` }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Speech Error Banner if microphone was denied or failed */}
      {speechError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <span className="font-bold block mb-0.5">Microphone Notice:</span>
            <p className="text-[11px] leading-relaxed text-amber-800">{speechError}</p>
            <p className="text-[10px] text-amber-700 mt-1 font-medium">
              💡 Tip: Click any of the 1-Click Voice Presets below to test automatic profile connection!
            </p>
          </div>
        </div>
      )}

      {/* Spoken Text Area with Live Visualizer */}
      <div className="relative space-y-2">
        <textarea
          rows={3}
          value={displayText}
          onChange={(e) => {
            setText(e.target.value);
            setInterimText('');
          }}
          placeholder={
            currentLanguage === 'kn'
              ? 'ಉದಾಹರಣೆಗೆ: ನಾನು ಬೆಳಗಾವಿಯ 21 ವರ್ಷದ ಬಿ.ಎಸ್ಸಿ ವಿದ್ಯಾರ್ಥಿನಿ. ಕುಟುಂಬದ ವಾರ್ಷಿಕ ಆದಾಯ 1.5 ಲಕ್ಷ, ಪ್ರವರ್ಗ 2ಎ ಒಬಿಸಿ ಮತ್ತು ಬಿಪಿಎಲ್ ಕಾರ್ಡ್...'
              : currentLanguage === 'hi'
              ? 'उदाहरण: मैं बेलगावी की 21 वर्षीय छात्रा हूँ, बीएससी कर रही हूँ, परिवार की वार्षिक आय 1.5 लाख है और ओबीसी श्रेणी में आती हूँ...'
              : 'e.g. I am a 21 year old female B.Sc student from Belagavi with family income of 1.5 lakhs belonging to Cat-2A OBC and BPL card...'
          }
          className={`w-full text-xs sm:text-sm p-3.5 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-slate-800 placeholder:text-slate-400 transition ${
            isListening ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-300'
          }`}
        />

        {/* Action Controls & Auto-connect Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700">
            <input
              type="checkbox"
              checked={autoConnect}
              onChange={(e) => setAutoConnect(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
            />
            <span className="font-medium text-[11px] sm:text-xs text-slate-600">
              {t('autoConnectProfile')}
            </span>
          </label>

          <div className="flex items-center gap-2 justify-end">
            {text && (
              <button
                type="button"
                onClick={() => {
                  setText('');
                  setInterimText('');
                  setConnectedBadges([]);
                  setLastExtractedSummary(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={() => handleExtract()}
              disabled={loading || !text.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white shadow-sm transition cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t('analyzingProfile')}</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{t('extractBtn')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 1-Click Voice Sample Presets */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
          {t('voicePresetsTitle')}
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {VOICE_PRESETS.map((p, idx) => {
            const label =
              currentLanguage === 'kn' ? p.labelKn : currentLanguage === 'hi' ? p.labelHi : p.labelEn;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className="text-left p-2.5 rounded-xl bg-white hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-300 text-slate-800 transition flex items-center gap-2 group shadow-2xs cursor-pointer"
              >
                <span className="text-base shrink-0">{p.icon}</span>
                <span className="text-[11px] font-semibold text-slate-700 group-hover:text-indigo-950 line-clamp-2">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Connected Citizen Profile Attributes Panel */}
      {connectedBadges.length > 0 && (
        <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-3 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <h4 className="text-xs font-bold text-emerald-950">
                {t('connectedAttributesTitle')} ({connectedBadges.length})
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300">
                ✓ Synced to Profile & Schemes
              </span>
              <button
                type="button"
                onClick={handleReadOutSummary}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300 transition"
              >
                {isPlayingAudio ? (
                  <>
                    <VolumeX className="w-3 h-3 text-emerald-700" />
                    <span>{t('stopAudio')}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3 h-3 text-emerald-700" />
                    <span>{t('listenAudio')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-1">
            {connectedBadges.map((badge, idx) => (
              <div
                key={idx}
                className="p-2 rounded-lg bg-white border border-emerald-200/90 shadow-2xs flex flex-col justify-between"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {badge.label}
                </span>
                <span className="text-xs font-extrabold text-emerald-950 mt-0.5 truncate">
                  {badge.value}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-1 flex items-center justify-between text-[11px] text-emerald-800 font-medium">
            <span>{t('connectedSuccessMsg')}</span>
            <button
              type="button"
              onClick={() => handleExtract()}
              className="inline-flex items-center gap-1 text-emerald-900 underline hover:text-emerald-950 font-bold"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{t('syncProfileBtn')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
