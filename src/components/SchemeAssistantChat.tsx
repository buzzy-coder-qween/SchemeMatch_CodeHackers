import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  Loader2,
  Bot,
  User,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { UserProfile, Scheme } from '../types/scheme';
import { askCopilot } from '../services/api';
import { MANDATORY_DISCLAIMER } from '../utils/matchingEngine';
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

interface SchemeAssistantChatProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  schemes: Scheme[];
  prefilledSchemeId?: string | null;
  currentLanguage: SupportedLanguage;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const SchemeAssistantChat: React.FC<SchemeAssistantChatProps> = ({
  isOpen,
  onClose,
  profile,
  schemes,
  prefilledSchemeId,
  currentLanguage,
}) => {
  const activeScheme = prefilledSchemeId
    ? schemes.find((s) => s.id === prefilledSchemeId)
    : null;

  const t = (key: string) => getTranslation(currentLanguage, key);

  const getInitialGreeting = () => {
    if (currentLanguage === 'kn') {
      return activeScheme
        ? `ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಯೋಜನಾ ಅರ್ಹತಾ ಸಹಾಯಕ. **${activeScheme.name}**, ಅಗತ್ಯ ದಾಖಲೆಗಳು ಅಥವಾ ಸೇವಾ ಸಿಂಧು ನೋಂದಣಿ ಬಗ್ಗೆ ಯಾವುದೇ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ.`
        : `ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಕರ್ನಾಟಕ ಮತ್ತು ಕೇಂದ್ರ ಸರ್ಕಾರದ ಯೋಜನೆಗಳ ಸಹಾಯಕ. ಗೃಹಲಕ್ಷ್ಮಿ, ಯುವ ನಿಧಿ, ಎಸ್‌ಎಸ್‌ಪಿ ಸ್ಕಾಲರ್‌ಶಿಪ್, ಪಿಎಂ-ಕಿಸಾನ್, ಜಾತಿ/ಆದಾಯ ಪ್ರಮಾಣಪತ್ರಗಳ ಆರ್‌ಡಿ ನಂಬರ್ ಅಥವಾ ಎನ್‌ಪಿಸಿಐ ಆಧಾರ್ ಲಿಂಕ್ ಬಗ್ಗೆ ಕೇಳಿ!`;
    }
    if (currentLanguage === 'hi') {
      return activeScheme
        ? `नमस्ते! मैं आपका योजना पात्रता सहायक हूँ। **${activeScheme.name}**, आवश्यक दस्तावेज़ या आवेदन प्रक्रिया के बारे में कुछ भी पूछें।`
        : `नमस्ते! मैं कर्नाटक एवं केंद्र सरकार की योजनाओं का पात्रता सहायक हूँ। गृह लक्ष्मी, युवा निधि, एसएसपी छात्रवृत्ति, पीएम-किसान, आरडी नंबर या आधार बैंक सीडिंग के बारे में पूछें!`;
    }
    return activeScheme
      ? `Namaskara! I am your Scheme Discovery & Eligibility Copilot. I can help answer specific questions about **${activeScheme.name}**, required documents, or Seva Sindhu portal registration. What would you like to know?`
      : `Namaskara! I am your Karnataka and Central Government Schemes Eligibility Copilot. Ask me about Gruha Lakshmi, Yuva Nidhi, SSP scholarships, PM-KISAN, required certificates (RD numbers), or NPCI Aadhaar bank mapping!`;
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: getInitialGreeting(),
      timestamp: 'Just now',
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const stopVoiceRef = React.useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (stopVoiceRef.current) stopVoiceRef.current();
      stopSpeech();
    };
  }, []);

  if (!isOpen) return null;

  const handleToggleVoiceInput = () => {
    setVoiceNotice(null);
    if (isListening) {
      if (stopVoiceRef.current) {
        stopVoiceRef.current();
        stopVoiceRef.current = null;
      }
      setIsListening(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setVoiceNotice('Microphone speech recognition is not supported in this browser. Please type your query.');
      return;
    }

    setIsListening(true);
    const stopFn = startSpeechRecognition(currentLanguage, {
      onResult: (transcript, isFinal) => {
        setInput(transcript);
        if (isFinal) {
          setIsListening(false);
        }
      },
      onError: (err) => {
        setIsListening(false);
        setVoiceNotice(err);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    stopVoiceRef.current = stopFn;
  };

  const handleSpeakMessage = (msgId: string, text: string) => {
    if (currentlySpeakingId === msgId) {
      stopSpeech();
      setCurrentlySpeakingId(null);
      return;
    }

    setCurrentlySpeakingId(msgId);
    speakText(text, currentLanguage, {
      onEnd: () => setCurrentlySpeakingId(null),
      onError: () => setCurrentlySpeakingId(null),
    });
  };

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: textToSend,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const reply = await askCopilot(textToSend, profile, prefilledSchemeId || undefined);
      const botMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: reply,
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: `Unable to process request right now. Please verify official requirements directly on Seva Sindhu (sevasindhu.karnataka.gov.in) or myScheme (myscheme.gov.in).\n\n${MANDATORY_DISCLAIMER}`,
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = currentLanguage === 'kn'
    ? [
        'ಗೃಹಲಕ್ಷ್ಮಿ ಯೋಜನೆಗೆ ಇ-ಕೆವೈಸಿ ಹೇಗೆ ಮಾಡಬೇಕು?',
        'ಜಾತಿ ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣಪತ್ರದ ಆರ್‌ಡಿ ನಂಬರ್ ಎಂದರೇನು?',
        'ಯುವ ನಿಧಿ ಯೋಜನೆಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ವಿಧಾನವೇನು?',
      ]
    : currentLanguage === 'hi'
    ? [
        'गृह लक्ष्मी योजना के लिए ई-केवाईसी कैसे करें?',
        'कर्नाटक जाति व आय प्रमाण पत्र का आरडी नंबर क्या है?',
        'बैंक खाते में एनपीसीआई आधार सीडिंग कैसे कराएं?',
      ]
    : activeScheme
    ? [
        `What documents are needed for ${activeScheme.name}?`,
        `How do I apply for ${activeScheme.name} on the portal?`,
        `Am I eligible based on my current income?`,
      ]
    : [
        'How does Gruha Lakshmi e-KYC work with Aadhaar?',
        'What is an RD number for Karnataka caste/income certificate?',
        'Can I apply for both Yuva Nidhi and SSP scholarship?',
        'What is bank NPCI Aadhaar mapping for DBT cash?',
      ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="copilot-chat-title"
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end"
    >
      <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Chat Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 id="copilot-chat-title" className="text-base font-bold text-white flex items-center gap-2">
                <span>{t('schemeCopilot')}</span>
                {activeScheme && (
                  <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded border border-indigo-400/30">
                    {activeScheme.name}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                {currentLanguage === 'kn'
                  ? 'ಧ್ವನಿ ಮತ್ತು ಲಿಖಿತ ಸಹಾಯ'
                  : currentLanguage === 'hi'
                  ? 'ध्वनि एवं लिखित सहायता'
                  : 'Voice-enabled advice for Karnataka & Central welfare'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            aria-label="Close assistant chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3.5 bg-slate-50/50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs relative group ${
                  m.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none whitespace-pre-wrap'
                }`}
              >
                <div>{m.text}</div>

                {/* Read Aloud button for assistant replies */}
                {m.sender === 'assistant' && (
                  <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleSpeakMessage(m.id, m.text)}
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded transition ${
                        currentlySpeakingId === m.id
                          ? 'bg-rose-100 text-rose-800 animate-pulse'
                          : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
                      }`}
                      title="Listen to this message"
                    >
                      {currentlySpeakingId === m.id ? (
                        <>
                          <VolumeX className="w-3 h-3 text-rose-600" />
                          <span>{t('stopAudio')}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3" />
                          <span>{t('listenAudio')}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5 items-center text-xs text-slate-500">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <span className="p-3 bg-white rounded-xl border border-slate-200 text-slate-600">
                {t('analyzingProfile')}
              </span>
            </div>
          )}
        </div>

        {/* Suggested Quick Prompts */}
        <div className="px-4 py-2 bg-slate-100/90 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] font-semibold text-slate-500 shrink-0">
            {currentLanguage === 'kn' ? 'ಪ್ರಶ್ನೆಗಳು:' : currentLanguage === 'hi' ? 'सुझाव:' : 'Ask:'}
          </span>
          {sampleQuestions.slice(0, 3).map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(q)}
              className="text-[11px] px-2.5 py-1 rounded-md bg-white hover:bg-indigo-50 hover:text-indigo-900 text-slate-700 transition border border-slate-200 whitespace-nowrap shrink-0 shadow-2xs"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Listening notification if mic active */}
        {isListening && (
          <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 flex items-center justify-between text-xs text-rose-800">
            <span className="font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              {t('voiceListening')}
            </span>
            <button
              type="button"
              onClick={() => setIsListening(false)}
              className="text-xs text-rose-700 underline font-bold"
            >
              {t('stopVoiceBtn')}
            </button>
          </div>
        )}

        {/* Voice error/info notice */}
        {voiceNotice && (
          <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 text-xs text-amber-900 flex items-center justify-between">
            <span>{voiceNotice}</span>
            <button
              type="button"
              onClick={() => setVoiceNotice(null)}
              className="text-[10px] text-amber-700 underline font-semibold ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Input Bar with Mic button */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleVoiceInput}
            className={`p-2.5 rounded-xl transition ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Click to speak (Voice input)"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-indigo-600" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder={
              currentLanguage === 'kn'
                ? 'ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಪ್ರಶ್ನೆ ಕೇಳಿ ಅಥವಾ ಮಾತನಾಡಿ...'
                : currentLanguage === 'hi'
                ? 'योजनाओं के बारे में सवाल पूछें या बोलें...'
                : 'Ask a question about scheme criteria, documents...'
            }
            className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800"
          />

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white transition shadow-sm"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
