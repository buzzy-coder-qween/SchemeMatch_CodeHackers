import React from 'react';
import {
  UserProfile,
  OccupationType,
  EducationLevel,
  GenderType,
  SocialCategory,
  RationCardType,
} from '../types/scheme';
import {
  User,
  MapPin,
  IndianRupee,
  Briefcase,
  GraduationCap,
  Users,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { SupportedLanguage, getTranslation } from '../i18n/translations';

interface ProfileBuilderProps {
  profile: UserProfile;
  currentLanguage: SupportedLanguage;
  onChange: (updated: Partial<UserProfile>) => void;
  syncNotice?: string | null;
}

const KARNATAKA_DISTRICTS = [
  'Bagalkote',
  'Ballari',
  'Belagavi',
  'Bengaluru Rural',
  'Bengaluru Urban',
  'Bidar',
  'Chamarajanagara',
  'Chikkaballapura',
  'Chikkamagaluru',
  'Chitradurga',
  'Dakshina Kannada',
  'Davanagere',
  'Dharwad',
  'Gadag',
  'Hassan',
  'Haveri',
  'Kalaburagi',
  'Kodagu',
  'Kolar',
  'Koppal',
  'Mandya',
  'Mysuru',
  'Raichur',
  'Ramanagara',
  'Shivamogga',
  'Tumakuru',
  'Udupi',
  'Uttara Kannada',
  'Vijayanagara',
  'Yadgir',
];

const OCCUPATIONS: { id: OccupationType; en: string; kn: string; hi: string }[] = [
  { id: 'Student', en: 'Student', kn: 'ವಿದ್ಯಾರ್ಥಿ', hi: 'छात्र / छात्रा' },
  { id: 'Farmer', en: 'Farmer', kn: 'ರೈತ / ಕೃಷಿಕ', hi: 'किसान' },
  { id: 'Entrepreneur', en: 'Entrepreneur / Business', kn: 'ಉದ್ಯಮಿ / ವ್ಯಾಪಾರಿ', hi: 'उद्यमी / व्यापारी' },
  { id: 'Job Seeker', en: 'Job Seeker / Unemployed', kn: 'ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿ / ನಿರುದ್ಯೋಗಿ', hi: 'नौकरी तलाशने वाले' },
  { id: 'Artisan', en: 'Artisan / Craftsperson', kn: 'ಕುಶಲಕರ್ಮಿ / ವಿಶ್ವಕರ್ಮ', hi: 'कारीगर / शिल्पकार' },
  { id: 'Unorganized Worker', en: 'Unorganized Worker', kn: 'ಅಸಂಘಟಿತ ವಲಯದ ಕಾರ್ಮಿಕ', hi: 'असंगठित क्षेत्र के मजदूर' },
  { id: 'Senior Citizen', en: 'Senior Citizen (Elderly)', kn: 'ಹಿರಿಯ ನಾಗರಿಕ', hi: 'वरिष्ठ नागरिक' },
  { id: 'Homemaker', en: 'Homemaker', kn: 'ಗೃಹಿಣಿ', hi: 'गृहणी' },
  { id: 'Salaried Employee', en: 'Salaried Employee', kn: 'ವೇತನ ಪಡೆಯುವ ನೌಕರ', hi: 'वेतनभोगी कर्मचारी' },
  { id: 'Other', en: 'Other', kn: 'ಇತರೆ', hi: 'अन्य' },
];

const EDUCATION_LEVELS: { id: EducationLevel; en: string; kn: string; hi: string }[] = [
  { id: 'Below 10th', en: 'Below 10th', kn: '10ನೇ ತರಗತಿಗಿಂತ ಕಡಿಮೆ', hi: '10वीं से कम' },
  { id: '10th Pass', en: '10th Pass (SSLC)', kn: '10ನೇ ತರಗತಿ ತೇರ್ಗಡೆ (SSLC)', hi: '10वीं पास' },
  { id: '12th Pass', en: '12th Pass (PUC)', kn: '12ನೇ ತರಗತಿ ತೇರ್ಗಡೆ (PUC)', hi: '12वीं पास (इंटरमीडिएट)' },
  { id: 'ITI / Diploma', en: 'ITI / Diploma / Polytechnic', kn: 'ಐಟಿಐ / ಡಿಪ್ಲೊಮಾ / ಪಾಲಿಟೆಕ್ನಿಕ್', hi: 'आईटीआई / डिप्लोमा' },
  { id: 'Undergraduate', en: 'Undergraduate (Degree / B.Tech / B.Sc)', kn: 'ಪದವಿ (BA / B.Com / B.Sc / BE)', hi: 'स्नातक (ग्रेजुएशन)' },
  { id: 'Postgraduate', en: 'Postgraduate (Master’s / Professional)', kn: 'ಸ್ನಾತಕೋತ್ತರ ಪದವಿ (PG / MA / M.Tech)', hi: 'स्नातकोत्तर (पोस्ट ग्रेजुएशन)' },
  { id: 'Doctorate', en: 'Doctorate / PhD', kn: 'ಡಾಕ್ಟರೇಟ್ / ಪಿಎಚ್‌ಡಿ', hi: 'डॉक्टरेट / पीएचडी' },
  { id: 'None / Not Applicable', en: 'None / Not Applicable', kn: 'ಅನ್ವಯಿಸುವುದಿಲ್ಲ', hi: 'लागू नहीं' },
];

const SOCIAL_CATEGORIES: SocialCategory[] = [
  'General',
  'OBC',
  'SC',
  'ST',
  'EWS',
  'Minority',
];

const RATION_CARDS: RationCardType[] = [
  'BPL',
  'AAY (Antyodaya)',
  'APL',
  'None',
  'Unverified',
];

export const ProfileBuilder: React.FC<ProfileBuilderProps> = ({
  profile,
  currentLanguage,
  onChange,
  syncNotice,
}) => {
  const t = (key: string) => getTranslation(currentLanguage, key);

  // Calculate profile completeness
  const coreFields = [
    Boolean(profile.age),
    Boolean(profile.gender),
    Boolean(profile.locationState),
    Boolean(profile.annualIncome !== null && profile.annualIncome !== undefined),
    Boolean(profile.occupation),
    Boolean(profile.socialCategory),
    Boolean(profile.rationCardType && profile.rationCardType !== 'Unverified'),
  ];
  const completedCount = coreFields.filter(Boolean).length;
  const completenessPercent = Math.round((completedCount / coreFields.length) * 100);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
      {/* Header & Completeness Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-amber-600" />
            <span>{t('profileTitle')}</span>
          </h2>
          <p className="text-xs text-slate-500">
            {t('profileSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-28 sm:w-36 bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                completenessPercent >= 80
                  ? 'bg-emerald-500'
                  : completenessPercent >= 50
                  ? 'bg-amber-500'
                  : 'bg-rose-400'
              }`}
              style={{ width: `${completenessPercent}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            {completenessPercent}% {t('profileComplete')}
          </span>
        </div>
      </div>

      {syncNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 font-semibold shadow-2xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Age */}
        <div>
          <label htmlFor="input-age" className="block text-xs font-semibold text-slate-700 mb-1">
            {t('ageLabel')} <span className="text-rose-500">*</span>
          </label>
          <input
            id="input-age"
            type="number"
            min={1}
            max={110}
            value={profile.age ?? ''}
            onChange={(e) =>
              onChange({ age: e.target.value ? parseInt(e.target.value, 10) : null })
            }
            placeholder="e.g. 21"
            className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-800"
          />
        </div>

        {/* Gender */}
        <div>
          <label htmlFor="input-gender" className="block text-xs font-semibold text-slate-700 mb-1">
            {t('genderLabel')} <span className="text-rose-500">*</span>
          </label>
          <select
            id="input-gender"
            value={profile.gender}
            onChange={(e) => onChange({ gender: e.target.value as GenderType })}
            className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-800 bg-white"
          >
            <option value="">{t('selectGender')}</option>
            <option value="Female">{t('genderFemale')}</option>
            <option value="Male">{t('genderMale')}</option>
            <option value="Transgender">{t('genderTrans')}</option>
            <option value="Other">{t('genderOther')}</option>
          </select>
        </div>

        {/* State / Domicile */}
        <div>
          <label htmlFor="input-state" className="block text-xs font-semibold text-slate-700 mb-1">
            {t('locationLabel')} <span className="text-rose-500">*</span>
          </label>
          <select
            id="input-state"
            value={profile.locationState}
            onChange={(e) => {
              const val = e.target.value;
              onChange({
                locationState: val,
                isKarnatakaResident: val.toLowerCase().includes('karnataka'),
              });
            }}
            className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-800 bg-white"
          >
            <option value="Karnataka">{t('stateKarnataka')}</option>
            <option value="Central / All-India">{t('stateCentral')}</option>
            <option value="Other State">{t('stateOther')}</option>
          </select>
        </div>

        {/* District (if Karnataka) */}
        {profile.isKarnatakaResident && (
          <div>
            <label htmlFor="input-district" className="block text-xs font-semibold text-slate-700 mb-1">
              {t('districtLabel')}
            </label>
            <select
              id="input-district"
              value={profile.district || ''}
              onChange={(e) => onChange({ district: e.target.value })}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-800 bg-white"
            >
              <option value="">{t('selectDistrict')}</option>
              {KARNATAKA_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Annual Income */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="input-income" className="block text-xs font-semibold text-slate-700">
              {t('incomeLabel')} <span className="text-rose-500">*</span>
            </label>
            {profile.annualIncome !== null && (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                ₹{(profile.annualIncome / 100000).toFixed(2)} Lakhs
              </span>
            )}
          </div>
          <input
            id="input-income"
            type="number"
            step="10000"
            min={0}
            max={5000000}
            value={profile.annualIncome ?? ''}
            onChange={(e) =>
              onChange({
                annualIncome: e.target.value ? parseInt(e.target.value, 10) : null,
              })
            }
            placeholder="e.g. 150000"
            className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-800"
          />
        </div>

        {/* Occupation */}
        <div>
          <label htmlFor="input-occupation" className="block text-xs font-semibold text-slate-700 mb-1">
            {t('occupationLabel')} <span className="text-rose-500">*</span>
          </label>
          <select
            id="input-occupation"
            value={profile.occupation}
            onChange={(e) => {
              const val = e.target.value as OccupationType;
              onChange({
                occupation: val,
                isUnemployed: val === 'Job Seeker',
                isLandholder: val === 'Farmer' ? true : profile.isLandholder,
              });
            }}
            className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-800 bg-white"
          >
            <option value="">{t('selectOccupation')}</option>
            {OCCUPATIONS.map((occ) => (
              <option key={occ.id} value={occ.id}>
                {currentLanguage === 'kn' ? occ.kn : currentLanguage === 'hi' ? occ.hi : occ.en}
              </option>
            ))}
          </select>
        </div>

        {/* Education Level */}
        <div>
          <label htmlFor="input-education" className="block text-xs font-semibold text-slate-700 mb-1">
            {t('educationLabel')}
          </label>
          <select
            id="input-education"
            value={profile.educationLevel}
            onChange={(e) => onChange({ educationLevel: e.target.value as EducationLevel })}
            className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-800 bg-white"
          >
            <option value="">{t('selectEducation')}</option>
            {EDUCATION_LEVELS.map((edu) => (
              <option key={edu.id} value={edu.id}>
                {currentLanguage === 'kn' ? edu.kn : currentLanguage === 'hi' ? edu.hi : edu.en}
              </option>
            ))}
          </select>
        </div>

        {/* Social Category */}
        <div>
          <label htmlFor="input-category" className="block text-xs font-semibold text-slate-700 mb-1">
            {t('categoryLabel')} <span className="text-rose-500">*</span>
          </label>
          <select
            id="input-category"
            value={profile.socialCategory}
            onChange={(e) => onChange({ socialCategory: e.target.value as SocialCategory })}
            className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-800 bg-white"
          >
            <option value="">{t('selectCategory')}</option>
            {SOCIAL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat} (e.g. {cat === 'OBC' ? 'Cat-1, 2A, 2B, 3A, 3B' : cat})
              </option>
            ))}
          </select>
        </div>

        {/* Ration Card Type */}
        <div>
          <label htmlFor="input-ration" className="block text-xs font-semibold text-slate-700 mb-1">
            {t('rationCardLabel')} <span className="text-rose-500">*</span>
          </label>
          <select
            id="input-ration"
            value={profile.rationCardType}
            onChange={(e) => onChange({ rationCardType: e.target.value as RationCardType })}
            className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-800 bg-white"
          >
            {RATION_CARDS.map((card) => (
              <option key={card} value={card}>
                {card === 'BPL'
                  ? 'BPL (Below Poverty Line - Priority Card)'
                  : card === 'AAY (Antyodaya)'
                  ? 'AAY (Antyodaya Anna Yojana - Poorest)'
                  : card === 'APL'
                  ? 'APL (Above Poverty Line)'
                  : card}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Specific Beneficiary Checkboxes */}
      <div className="pt-3 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-700 mb-2.5 uppercase tracking-wider">
          {t('specificConditionsTitle')}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Head of Family */}
          <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
            <input
              type="checkbox"
              checked={profile.isHeadOfFamily ?? false}
              onChange={(e) => onChange({ isHeadOfFamily: e.target.checked })}
              className="mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
            />
            <div>
              <span className="text-xs font-semibold text-slate-800 block">
                {t('headOfFamily')}
              </span>
              <span className="text-[11px] text-slate-500">
                {t('headOfFamilySub')}
              </span>
            </div>
          </label>

          {/* Landholder */}
          <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
            <input
              type="checkbox"
              checked={profile.isLandholder}
              onChange={(e) => onChange({ isLandholder: e.target.checked })}
              className="mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
            />
            <div>
              <span className="text-xs font-semibold text-slate-800 block">
                {t('landholder')}
              </span>
              <span className="text-[11px] text-slate-500">
                {t('landholderSub')}
              </span>
            </div>
          </label>

          {/* Unemployed Graduate */}
          <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
            <input
              type="checkbox"
              checked={profile.isUnemployed ?? false}
              onChange={(e) => onChange({ isUnemployed: e.target.checked })}
              className="mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
            />
            <div>
              <span className="text-xs font-semibold text-slate-800 block">
                {t('unemployed')}
              </span>
              <span className="text-[11px] text-slate-500">
                {t('unemployedSub')}
              </span>
            </div>
          </label>

          {/* Differently Abled */}
          <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
            <input
              type="checkbox"
              checked={profile.isDifferentlyAbled}
              onChange={(e) => onChange({ isDifferentlyAbled: e.target.checked })}
              className="mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
            />
            <div>
              <span className="text-xs font-semibold text-slate-800 block">
                {t('differentlyAbled')}
              </span>
              <span className="text-[11px] text-slate-500">
                {t('differentlyAbledSub')}
              </span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
