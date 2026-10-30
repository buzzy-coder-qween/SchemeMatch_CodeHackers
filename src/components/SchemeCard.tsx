import React, { useState } from 'react';
import { SchemeMatchResult } from '../types/scheme';
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Building2,
  Phone,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  SupportedLanguage,
  getTranslation,
} from '../i18n/translations';
import { speakText, stopSpeech } from '../utils/speech';

interface SchemeCardProps {
  result: SchemeMatchResult;
  rank: number;
  currentLanguage: SupportedLanguage;
  onAskSchemeCopilot: (schemeId: string) => void;
}

export const SchemeCard: React.FC<SchemeCardProps> = ({
  result,
  rank,
  currentLanguage,
  onAskSchemeCopilot,
}) => {
  const [expanded, setExpanded] = useState<boolean>(rank <= 2);
  const [activeTab, setActiveTab] = useState<'reasoning' | 'checklist' | 'steps'>('reasoning');
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const t = (key: string) => getTranslation(currentLanguage, key);

  const toggleDoc = (doc: string) => {
    setCheckedDocs((prev) => ({ ...prev, [doc]: !prev[doc] }));
  };

  const scheme = result.scheme;
  const isHigh = result.relevanceIndicator === 'High';
  const isModerate = result.relevanceIndicator === 'Moderate';

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      stopSpeech();
      setIsPlayingAudio(false);
      return;
    }

    // Prepare speech text
    const speechContent = `${scheme.name}. ${scheme.level}. ${scheme.briefOverview} ${scheme.financialBenefit}. ${result.whyItFits}`;

    setIsPlayingAudio(true);
    speakText(speechContent, currentLanguage, {
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });
  };

  // Relevance indicator badge
  const indicatorBadge = isHigh ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
      {t('highMatches')} ({result.matchScore}%)
    </span>
  ) : isModerate ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
      {t('moderateMatches')} ({result.matchScore}%)
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
      <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
      Low Match ({result.matchScore}%)
    </span>
  );

  return (
    <div
      className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden shadow-sm ${
        isHigh
          ? 'border-emerald-300 hover:border-emerald-400 ring-1 ring-emerald-400/20'
          : isModerate
          ? 'border-amber-200 hover:border-amber-300'
          : 'border-slate-200 opacity-90'
      }`}
    >
      {/* Top Banner / Scheme Identification */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${
                isHigh
                  ? 'bg-emerald-600 text-white'
                  : isModerate
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-700 text-slate-200'
              }`}
            >
              #{rank}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                    scheme.level === 'Karnataka State'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  }`}
                >
                  {scheme.level === 'Karnataka State' ? t('karnatakaState') : t('centralGovt')}
                </span>

                <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {scheme.category}
                </span>

                {scheme.kannadaName && (
                  <span className="text-xs text-slate-500 font-medium">
                    ({scheme.kannadaName})
                  </span>
                )}
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                {scheme.name}
              </h3>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{scheme.department}</span>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
            {indicatorBadge}
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 text-right">
              {scheme.financialBenefit}
            </span>
          </div>
        </div>

        {/* Overview text */}
        <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
          {scheme.briefOverview}
        </p>

        {/* Quick Highlights */}
        <div className="flex items-center gap-1.5 flex-wrap mt-3">
          {scheme.keyHighlights.slice(0, 2).map((h, i) => (
            <span
              key={i}
              className="text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200"
            >
              • {h}
            </span>
          ))}
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 transition"
            >
              <span>{expanded ? t('hideDetails') : t('viewFullMatch')}</span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Voice Readout Button */}
            <button
              type="button"
              onClick={handleToggleAudio}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg border transition ${
                isPlayingAudio
                  ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-200 animate-pulse'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
              }`}
              title="Listen to scheme explanation spoken aloud"
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-rose-600" />
                  <span>{t('stopAudio')}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>{t('listenAudio')}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onAskSchemeCopilot(scheme.id)}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 hover:text-indigo-800 py-1.5 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t('askCopilotBtn')}</span>
            </button>
          </div>

          <a
            href={scheme.officialSourceLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 py-1.5 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 transition"
          >
            <span>{t('applyOnPortal')} {scheme.portalName}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Expanded Accordion: Detailed Explainability, Checklist, Steps */}
      {expanded && (
        <div className="bg-slate-50/70 border-t border-slate-200 p-4 sm:p-5 space-y-4">
          {/* Internal Tabs */}
          <div className="flex items-center border-b border-slate-200 gap-2 pb-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('reasoning')}
              className={`text-xs font-bold py-1.5 px-3 rounded-md transition whitespace-nowrap ${
                activeTab === 'reasoning'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {t('tabReasoning')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('checklist')}
              className={`text-xs font-bold py-1.5 px-3 rounded-md transition whitespace-nowrap ${
                activeTab === 'checklist'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {t('tabDocuments')} ({scheme.requiredDocuments.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('steps')}
              className={`text-xs font-bold py-1.5 px-3 rounded-md transition whitespace-nowrap ${
                activeTab === 'steps'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {t('tabSteps')} ({scheme.applicationSteps.length})
            </button>
          </div>

          {/* TAB 1: REASONING & WHY IT FITS */}
          {activeTab === 'reasoning' && (
            <div className="space-y-3.5">
              {/* Plain-Language Why It Fits */}
              <div className="p-3.5 rounded-lg bg-emerald-50/80 border border-emerald-200">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t('explainableReasoning')}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleToggleAudio}
                    className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300"
                  >
                    <Volume2 className="w-3 h-3 text-emerald-700" />
                    <span>{isPlayingAudio ? t('stopAudio') : t('listenAudio')}</span>
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed">
                  {result.whyItFits}
                </p>
              </div>

              {/* Matching Attributes List */}
              <div>
                <h5 className="text-xs font-bold text-slate-800 mb-2">
                  {t('matchingAttributes')}
                </h5>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.matchingAttributes.map((attr, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 flex items-start gap-2 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{attr}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Missing or Unverified Information Alert */}
              {result.missingOrUnverified.length > 0 ? (
                <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200">
                  <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5 mb-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{t('missingInfo')}</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-amber-900">
                    {result.missingOrUnverified.map((gap, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="font-bold">•</span>
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t('noMissingInfo')}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REQUIRED DOCUMENTS CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <p className="text-xs text-slate-600">
                  {currentLanguage === 'kn'
                    ? 'ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ಮೊದಲು ನಿಮ್ಮ ಬಳಿ ಇರುವ ದಾಖಲೆಗಳನ್ನು ಗುರುತು ಮಾಡಿ:'
                    : currentLanguage === 'hi'
                    ? 'आवेदन शुरू करने से पहले अपने पास उपलब्ध दस्तावेजों को चिह्नित करें:'
                    : 'Check off the documents you have ready before initiating the application:'}
                </p>
                {scheme.helpline && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                    <Phone className="w-3 h-3 text-slate-400" />
                    Helpline: {scheme.helpline}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {scheme.requiredDocuments.map((doc, idx) => {
                  const isChecked = Boolean(checkedDocs[doc]);
                  return (
                    <label
                      key={idx}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleDoc(doc)}
                        className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span className={`text-xs sm:text-sm ${isChecked ? 'line-through text-slate-500' : ''}`}>
                        {doc}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: STEP-BY-STEP APPLICATION ROADMAP */}
          {activeTab === 'steps' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                {currentLanguage === 'kn'
                  ? `${scheme.portalName} ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಅಧಿಕೃತ ಹಂತಗಳು:`
                  : currentLanguage === 'hi'
                  ? `${scheme.portalName} पर आवेदन करने की आधिकारिक प्रक्रिया:`
                  : `Official step-by-step procedure to submit your application on ${scheme.portalName}:`}
              </p>

              <ol className="space-y-2.5">
                {scheme.applicationSteps.map((step, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 shadow-xs"
                  >
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {t('applyOnPortal')} <span className="font-semibold text-slate-700">{scheme.portalName}</span>
                </span>
                <a
                  href={scheme.officialSourceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition shadow-sm"
                >
                  <span>Launch Official Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
