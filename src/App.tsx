import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, SchemeMatchResult } from './types/scheme';
import { SCHEMES_DATABASE } from './data/schemes';
import {
  rankMatchingSchemes,
  generateMarkdownReport,
  MANDATORY_DISCLAIMER,
} from './utils/matchingEngine';
import {
  SupportedLanguage,
  getTranslation,
} from './i18n/translations';
import { speakText, stopSpeech } from './utils/speech';
import { Header } from './components/Header';
import { PersonaSelector } from './components/PersonaSelector';
import { NaturalLanguageQuery } from './components/NaturalLanguageQuery';
import { ProfileBuilder } from './components/ProfileBuilder';
import { FilterBar } from './components/FilterBar';
import { SchemeCard } from './components/SchemeCard';
import { MarkdownReportModal } from './components/MarkdownReportModal';
import { DocumentChecklistDrawer } from './components/DocumentChecklistDrawer';
import { SchemeAssistantChat } from './components/SchemeAssistantChat';
import {
  Sparkles,
  SlidersHorizontal,
  MessageSquareText,
  Users2,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Building2,
  ExternalLink,
  Volume2,
  VolumeX,
} from 'lucide-react';

const DEFAULT_PROFILE: UserProfile = {
  age: 21,
  locationState: 'Karnataka',
  district: 'Belagavi',
  areaType: 'Semi-Urban',
  annualIncome: 150000,
  occupation: 'Student',
  educationLevel: 'Undergraduate',
  gender: 'Female',
  socialCategory: 'OBC',
  isKarnatakaResident: true,
  rationCardType: 'BPL',
  isLandholder: false,
  isDifferentlyAbled: false,
  isHeadOfFamily: false,
  isUnemployed: false,
};

const BLANK_PROFILE: UserProfile = {
  age: null,
  locationState: 'Karnataka',
  district: '',
  areaType: 'Urban',
  annualIncome: null,
  occupation: '',
  educationLevel: '',
  gender: '',
  socialCategory: '',
  isKarnatakaResident: true,
  rationCardType: 'Unverified',
  isLandholder: false,
  isDifferentlyAbled: false,
  isHeadOfFamily: false,
  isUnemployed: false,
};

export default function App() {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [inputTab, setInputTab] = useState<'form' | 'natural' | 'personas'>('form');

  // Modals & Drawers
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isDocChecklistOpen, setIsDocChecklistOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [activeCopilotSchemeId, setActiveCopilotSchemeId] = useState<string | null>(null);
  const [isHeroAudioPlaying, setIsHeroAudioPlaying] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [matchThreshold, setMatchThreshold] = useState<'all' | 'high' | 'eligible'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const t = (key: string) => getTranslation(currentLanguage, key);

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  // 1. Rule-Based Weighted Ranking Engine Calculation
  const rankedResults = useMemo(() => {
    return rankMatchingSchemes(profile, SCHEMES_DATABASE);
  }, [profile]);

  // 2. Filtered and Searched Results
  const filteredResults = useMemo(() => {
    return rankedResults.filter((res) => {
      // Level filter
      if (selectedLevel !== 'ALL' && res.scheme.level !== selectedLevel) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'ALL' && res.scheme.category !== selectedCategory) {
        return false;
      }
      // Match threshold
      if (matchThreshold === 'eligible' && !res.isEligible) {
        return false;
      }
      if (matchThreshold === 'high' && res.relevanceIndicator !== 'High') {
        return false;
      }
      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = res.scheme.name.toLowerCase().includes(q);
        const matchesKannada = res.scheme.kannadaName?.toLowerCase().includes(q);
        const matchesOverview = res.scheme.briefOverview.toLowerCase().includes(q);
        const matchesTags = res.scheme.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesKannada && !matchesOverview && !matchesTags) {
          return false;
        }
      }
      return true;
    });
  }, [rankedResults, selectedLevel, selectedCategory, matchThreshold, searchQuery]);

  // 3. Exact Markdown Report Generation
  const markdownReport = useMemo(() => {
    return generateMarkdownReport(profile, rankedResults);
  }, [profile, rankedResults]);

  // Metric counts
  const highMatchCount = rankedResults.filter((r) => r.relevanceIndicator === 'High').length;
  const moderateMatchCount = rankedResults.filter((r) => r.relevanceIndicator === 'Moderate').length;
  const eligibleCount = highMatchCount + moderateMatchCount;

  const handleUpdateProfile = (partial: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...partial }));
  };

  const handleSelectPersona = (persona: any) => {
    setProfile(persona.profile);
    setInputTab('form');
  };

  const [profileSyncNotice, setProfileSyncNotice] = useState<string | null>(null);

  const handleProfileExtracted = (extracted: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...extracted }));
    const count = Object.values(extracted).filter((v) => v !== null && v !== undefined && v !== '').length;
    setProfileSyncNotice(
      currentLanguage === 'kn'
        ? `ಧ್ವನಿ/ವಿವರಣೆಯಿಂದ ${count} ಗುಣಲಕ್ಷಣಗಳು ಯಶಸ್ವಿಯಾಗಿ ಪ್ರೊಫೈಲ್‌ಗೆ ನವೀಕರಿಸಲ್ಪಟ್ಟಿವೆ!`
        : currentLanguage === 'hi'
        ? `आवाज़/इनपुट से ${count} विवरण सफलतापूर्वक आपकी प्रोफ़ाइल में जुड़ गए हैं!`
        : `${count} attributes successfully synced from voice / natural input to your profile!`
    );
    setTimeout(() => setProfileSyncNotice(null), 5000);
  };

  const handleAskSchemeCopilot = (schemeId: string) => {
    setActiveCopilotSchemeId(schemeId);
    setIsCopilotOpen(true);
  };

  const handleToggleHeroAudio = () => {
    if (isHeroAudioPlaying) {
      stopSpeech();
      setIsHeroAudioPlaying(false);
      return;
    }

    const heroSpeech = `${t('heroTitle')}. ${t('heroDesc')} ${eligibleCount} ${t('matched')}.`;
    setIsHeroAudioPlaying(true);
    speakText(heroSpeech, currentLanguage, {
      onEnd: () => setIsHeroAudioPlaying(false),
      onError: () => setIsHeroAudioPlaying(false),
    });
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col">
      {/* Platform Header with Language Switcher */}
      <Header
        onOpenReport={() => setIsReportOpen(true)}
        onOpenCopilot={() => {
          setActiveCopilotSchemeId(null);
          setIsCopilotOpen(true);
        }}
        onOpenDocChecklist={() => setIsDocChecklistOpen(true)}
        onResetProfile={() => setProfile(BLANK_PROFILE)}
        totalSchemes={SCHEMES_DATABASE.length}
        eligibleCount={eligibleCount}
        currentLanguage={currentLanguage}
        onLanguageChange={(lang) => {
          stopSpeech();
          setCurrentLanguage(lang);
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero Section with Context & Voice Readout */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 sm:p-7 text-white shadow-lg relative overflow-hidden border border-slate-800">
          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('heroBadge')}</span>
              </div>

              {/* Voice Listen Button */}
              <button
                type="button"
                onClick={handleToggleHeroAudio}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition border ${
                  isHeroAudioPlaying
                    ? 'bg-rose-500/30 text-rose-200 border-rose-400 animate-pulse'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title="Listen to platform overview"
              >
                {isHeroAudioPlaying ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-300" />
                    <span>{t('stopAudio')}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                    <span>{t('listenAudio')}</span>
                  </>
                )}
              </button>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
              {t('heroTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              {t('heroDesc')}
            </p>

            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setIsReportOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition"
              >
                <FileCheck className="w-4 h-4" />
                <span>{t('generateOfficialReport')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveCopilotSchemeId(null);
                  setIsCopilotOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition"
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>{t('eligibilityCopilot')}</span>
              </button>
            </div>
          </div>

          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-10 translate-y-10">
            <div className="w-72 h-72 rounded-full bg-amber-400 blur-3xl" />
          </div>
        </div>

        {/* Profile Input Mode Switcher */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 overflow-x-auto">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <button
                type="button"
                onClick={() => setInputTab('form')}
                className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold py-2 px-3.5 rounded-lg transition ${
                  inputTab === 'form'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>{t('tabGuided')}</span>
              </button>

              <button
                type="button"
                onClick={() => setInputTab('natural')}
                className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold py-2 px-3.5 rounded-lg transition ${
                  inputTab === 'natural'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <MessageSquareText className="w-4 h-4" />
                <span>{t('tabNatural')}</span>
              </button>

              <button
                type="button"
                onClick={() => setInputTab('personas')}
                className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold py-2 px-3.5 rounded-lg transition ${
                  inputTab === 'personas'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <Users2 className="w-4 h-4" />
                <span>{t('tabPersonas')}</span>
              </button>
            </div>
          </div>

          {/* Active Input Panel */}
          {inputTab === 'form' && (
            <ProfileBuilder
              profile={profile}
              currentLanguage={currentLanguage}
              onChange={handleUpdateProfile}
              syncNotice={profileSyncNotice}
            />
          )}

          {inputTab === 'natural' && (
            <div className="space-y-4">
              <NaturalLanguageQuery
                currentLanguage={currentLanguage}
                onProfileExtracted={handleProfileExtracted}
                currentProfile={profile}
              />
              <ProfileBuilder
                profile={profile}
                currentLanguage={currentLanguage}
                onChange={handleUpdateProfile}
                syncNotice={profileSyncNotice}
              />
            </div>
          )}

          {inputTab === 'personas' && (
            <div className="space-y-4">
              <PersonaSelector currentProfile={profile} onSelectPersona={handleSelectPersona} />
              <ProfileBuilder
                profile={profile}
                currentLanguage={currentLanguage}
                onChange={handleUpdateProfile}
                syncNotice={profileSyncNotice}
              />
            </div>
          )}
        </div>

        {/* Dynamic Match Summary Banner */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
              {highMatchCount}★
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>{t('rankedResults')}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  {highMatchCount} {t('highMatches')}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                  {moderateMatchCount} {t('moderateMatches')}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {profile.occupation || 'citizen'} • {profile.locationState || 'India'}
                {profile.annualIncome ? ` (₹${(profile.annualIncome / 100000).toFixed(1)}L)` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDocChecklistOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
            >
              <span>{t('verifyPaperwork')}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsReportOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition shadow-sm"
            >
              <span>{t('viewReportBtn')}</span>
            </button>
          </div>
        </div>

        {/* Filter Bar with Localized Text */}
        <FilterBar
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedLevel={selectedLevel}
          onSelectLevel={setSelectedLevel}
          matchThreshold={matchThreshold}
          onSelectThreshold={setMatchThreshold}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          currentLanguage={currentLanguage}
        />

        {/* Ranked Schemes List */}
        <div className="space-y-4">
          {filteredResults.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">
                {currentLanguage === 'kn'
                  ? 'ಆಯ್ಕೆಮಾಡಿದ ಫಿಲ್ಟರ್‌ಗಳಿಗೆ ಯಾವುದೇ ಯೋಜನೆಗಳು ಹೊಂದಿಕೆಯಾಗಿಲ್ಲ'
                  : currentLanguage === 'hi'
                  ? 'चयनित फ़िल्टर के अनुसार कोई योजना नहीं मिली'
                  : 'No Schemes Match the Selected Filters'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {currentLanguage === 'kn'
                  ? 'ಹುಡುಕಾಟ ಫಿಲ್ಟರ್‌ಗಳನ್ನು ಮರುಹೊಂದಿಸಿ ಅಥವಾ ಆದಾಯ ಮಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ.'
                  : currentLanguage === 'hi'
                  ? 'कृपया फ़िल्टर रीसेट करें या आय सीमा का समायोजन करें।'
                  : 'Try resetting your search filters, widening income brackets, or exploring all schemes.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSelectedLevel('ALL');
                  setMatchThreshold('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
              >
                Reset Filter Settings
              </button>
            </div>
          ) : (
            filteredResults.map((result, idx) => (
              <SchemeCard
                key={result.scheme.id}
                result={result}
                rank={idx + 1}
                currentLanguage={currentLanguage}
                onAskSchemeCopilot={handleAskSchemeCopilot}
              />
            ))
          )}
        </div>

        {/* Official Portal Reference Strip */}
        <div className="bg-slate-900 text-slate-300 rounded-xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Official Government Delivery & Verification Portals</span>
            </h4>
            <span className="text-[11px] text-slate-400">Authentic Public Access Gateways</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <a
              href="https://sevasindhu.karnataka.gov.in"
              target="_blank"
              rel="noreferrer"
              className="p-3 bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700/80 flex flex-col justify-between group transition"
            >
              <div>
                <span className="font-bold text-white group-hover:text-amber-300 block">
                  Seva Sindhu Karnataka
                </span>
                <span className="text-[11px] text-slate-400">
                  Gruha Lakshmi, Yuva Nidhi, Shakti
                </span>
              </div>
              <span className="text-[10px] text-amber-400 font-mono mt-2 flex items-center gap-1">
                sevasindhu.karnataka.gov.in <ExternalLink className="w-2.5 h-2.5" />
              </span>
            </a>

            <a
              href="https://myscheme.gov.in"
              target="_blank"
              rel="noreferrer"
              className="p-3 bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700/80 flex flex-col justify-between group transition"
            >
              <div>
                <span className="font-bold text-white group-hover:text-amber-300 block">
                  myScheme Central Portal
                </span>
                <span className="text-[11px] text-slate-400">
                  National e-Governance Division (NeGD)
                </span>
              </div>
              <span className="text-[10px] text-amber-400 font-mono mt-2 flex items-center gap-1">
                myscheme.gov.in <ExternalLink className="w-2.5 h-2.5" />
              </span>
            </a>

            <a
              href="https://ssp.postmatric.karnataka.gov.in"
              target="_blank"
              rel="noreferrer"
              className="p-3 bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700/80 flex flex-col justify-between group transition"
            >
              <div>
                <span className="font-bold text-white group-hover:text-amber-300 block">
                  Karnataka SSP Portal
                </span>
                <span className="text-[11px] text-slate-400">
                  State Post-Matric Scholarships
                </span>
              </div>
              <span className="text-[10px] text-amber-400 font-mono mt-2 flex items-center gap-1">
                ssp.postmatric.karnataka.gov.in <ExternalLink className="w-2.5 h-2.5" />
              </span>
            </a>

            <a
              href="https://pmkisan.gov.in"
              target="_blank"
              rel="noreferrer"
              className="p-3 bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700/80 flex flex-col justify-between group transition"
            >
              <div>
                <span className="font-bold text-white group-hover:text-amber-300 block">
                  PM-KISAN Samman Nidhi
                </span>
                <span className="text-[11px] text-slate-400">
                  Direct Income Support to Farmers
                </span>
              </div>
              <span className="text-[10px] text-amber-400 font-mono mt-2 flex items-center gap-1">
                pmkisan.gov.in <ExternalLink className="w-2.5 h-2.5" />
              </span>
            </a>
          </div>
        </div>

        {/* Localized Statutory Transparency Notice */}
        <div className="bg-amber-50/90 border border-amber-300/80 rounded-xl p-4 text-xs text-amber-950 leading-relaxed shadow-xs flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold block mb-0.5 text-amber-900">
              {t('statutoryNotice')}
            </span>
            <p className="italic">
              {t('disclaimerText')}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-5 border-t border-slate-800 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-bold text-white">SchemeMatch</span> • Personalized Scheme Discovery & Eligibility Assistant for Karnataka & All-India.
          </div>
          <div className="text-[11px] text-slate-500">
            Grounded in standard Central and Karnataka government schemes (Seva Sindhu, myScheme, SSP).
          </div>
        </div>
      </footer>

      {/* Structured 4-Part Markdown Report Modal */}
      <MarkdownReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        markdownContent={markdownReport}
      />

      {/* Document Checklist Drawer */}
      <DocumentChecklistDrawer
        isOpen={isDocChecklistOpen}
        onClose={() => setIsDocChecklistOpen(false)}
        results={rankedResults}
      />

      {/* Scheme Eligibility Copilot Drawer with Voice Input and Speech Output */}
      <SchemeAssistantChat
        isOpen={isCopilotOpen}
        onClose={() => {
          setIsCopilotOpen(false);
          setActiveCopilotSchemeId(null);
        }}
        profile={profile}
        schemes={SCHEMES_DATABASE}
        prefilledSchemeId={activeCopilotSchemeId}
        currentLanguage={currentLanguage}
      />
    </div>
  );
}
