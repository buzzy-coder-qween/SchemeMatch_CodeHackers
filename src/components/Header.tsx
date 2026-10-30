import React from 'react';
import {
  FileText,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  FolderCheck,
  Languages,
  Mic,
} from 'lucide-react';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  getTranslation,
} from '../i18n/translations';

interface HeaderProps {
  onOpenReport: () => void;
  onOpenCopilot: () => void;
  onOpenDocChecklist: () => void;
  onResetProfile: () => void;
  totalSchemes: number;
  eligibleCount: number;
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenReport,
  onOpenCopilot,
  onOpenDocChecklist,
  onResetProfile,
  totalSchemes,
  eligibleCount,
  currentLanguage,
  onLanguageChange,
}) => {
  const t = (key: string) => getTranslation(currentLanguage, key);

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Logo & Platform Info */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white font-bold text-xl tracking-wider">
              SM
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span>{t('appName')}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {t('tagline')}
                  </span>
                </h1>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  Seva Sindhu & myScheme
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {t('headerSub')}
              </p>
            </div>
          </div>

          {/* Controls: Language Selector, Metrics, Actions */}
          <div className="flex items-center flex-wrap gap-2 justify-between lg:justify-end">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700">
              <div className="flex items-center gap-1 px-2 py-1 text-slate-400 text-xs font-medium">
                <Languages className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Language:</span>
              </div>
              <div className="flex items-center gap-1">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => onLanguageChange(lang.code)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                      currentLanguage === lang.code
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                    }`}
                    title={`Switch language to ${lang.label}`}
                  >
                    {lang.nativeLabel}
                  </button>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div className="hidden xl:flex items-center bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-300 space-x-2">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {eligibleCount} {t('matched')}
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">{totalSchemes} {t('verifiedPrograms')}</span>
            </div>

            {/* Document Checklist */}
            <button
              type="button"
              onClick={onOpenDocChecklist}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title={t('docChecklist')}
            >
              <FolderCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{t('docChecklist')}</span>
              <span className="sm:hidden">Checklist</span>
            </button>

            {/* Formal Report */}
            <button
              type="button"
              onClick={onOpenReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-sm transition"
              title={t('viewFormalReport')}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t('viewFormalReport')}</span>
            </button>

            {/* Copilot with Voice Support */}
            <button
              type="button"
              onClick={onOpenCopilot}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/90 hover:bg-indigo-600 text-white shadow-sm transition"
              title={t('schemeCopilot')}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              <span>{t('schemeCopilot')}</span>
              <Mic className="w-3 h-3 text-indigo-200 opacity-80" />
            </button>

            {/* Reset */}
            <button
              type="button"
              onClick={onResetProfile}
              className="inline-flex items-center p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title={t('resetProfile')}
              aria-label={t('resetProfile')}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
