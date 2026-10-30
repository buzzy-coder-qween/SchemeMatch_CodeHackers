import React from 'react';
import { SchemeCategory, SchemeLevel } from '../types/scheme';
import { Search, Filter } from 'lucide-react';
import { SupportedLanguage, getTranslation } from '../i18n/translations';

interface FilterBarProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedLevel: string;
  onSelectLevel: (lvl: string) => void;
  matchThreshold: 'all' | 'high' | 'eligible';
  onSelectThreshold: (th: 'all' | 'high' | 'eligible') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currentLanguage: SupportedLanguage;
}

const CATEGORIES: { key: string; value: string }[] = [
  { key: 'allSectors', value: 'ALL' },
  { key: 'womenChild', value: 'Women & Child Welfare' },
  { key: 'educationScholarship', value: 'Education & Scholarship' },
  { key: 'agriFarming', value: 'Agriculture & Farming' },
  { key: 'employmentSkills', value: 'Employment & Skills' },
  { key: 'healthcareInsurance', value: 'Healthcare & Insurance' },
  { key: 'pensionSocial', value: 'Social Security & Pension' },
  { key: 'housingShelter', value: 'Housing & Shelter' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedLevel,
  onSelectLevel,
  matchThreshold,
  onSelectThreshold,
  searchQuery,
  onSearchChange,
  currentLanguage,
}) => {
  const t = (key: string) => getTranslation(currentLanguage, key);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-800 placeholder:text-slate-400"
          />
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> {t('schemeLevel')}
          </span>
          {[
            { label: t('allSchemes'), value: 'ALL' },
            { label: t('karnatakaState'), value: 'Karnataka State' },
            { label: t('centralGovt'), value: 'Central Government' },
          ].map((lvl) => (
            <button
              key={lvl.value}
              type="button"
              onClick={() => onSelectLevel(lvl.value)}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition ${
                selectedLevel === lvl.value
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {lvl.label}
            </button>
          ))}
        </div>

        {/* Match Threshold Filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 mr-1">{t('matchFilter')}</span>
          {[
            { label: t('allRanked'), value: 'all' },
            { label: t('eligibleOnly'), value: 'eligible' },
            { label: t('highMatchOnly'), value: 'high' },
          ].map((th) => (
            <button
              key={th.value}
              type="button"
              onClick={() => onSelectThreshold(th.value as any)}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition ${
                matchThreshold === th.value
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {th.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => onSelectCategory(cat.value)}
            className={`text-xs px-3 py-1 rounded-full whitespace-nowrap transition font-medium ${
              selectedCategory === cat.value
                ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {t(cat.key)}
          </button>
        ))}
      </div>
    </div>
  );
};
