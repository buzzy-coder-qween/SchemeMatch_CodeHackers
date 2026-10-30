export type SocialCategory = 'General' | 'OBC' | 'SC' | 'ST' | 'EWS' | 'Minority';

export type OccupationType =
  | 'Student'
  | 'Farmer'
  | 'Entrepreneur'
  | 'Job Seeker'
  | 'Artisan'
  | 'Unorganized Worker'
  | 'Senior Citizen'
  | 'Homemaker'
  | 'Salaried Employee'
  | 'Other';

export type EducationLevel =
  | 'Below 10th'
  | '10th Pass'
  | '12th Pass'
  | 'ITI / Diploma'
  | 'Undergraduate'
  | 'Postgraduate'
  | 'Doctorate'
  | 'None / Not Applicable';

export type RationCardType = 'BPL' | 'AAY (Antyodaya)' | 'APL' | 'None' | 'Unverified';

export type GenderType = 'Female' | 'Male' | 'Transgender' | 'Other';

export interface UserProfile {
  age: number | null;
  locationState: string; // 'Karnataka', 'Central / All-India', or other state
  district?: string;
  areaType?: 'Rural' | 'Urban' | 'Semi-Urban';
  annualIncome: number | null; // In INR (e.g., 180000)
  occupation: OccupationType | '';
  educationLevel: EducationLevel | '';
  gender: GenderType | '';
  socialCategory: SocialCategory | '';
  isKarnatakaResident: boolean;
  rationCardType: RationCardType;
  isLandholder: boolean;
  landHoldingAcres?: number;
  isDifferentlyAbled: boolean; // PwD
  isHeadOfFamily?: boolean;
  isUnemployed?: boolean;
  unemploymentDurationMonths?: number;
  hasRegisteredBusiness?: boolean;
  additionalNotes?: string;
}

export type SchemeLevel = 'Karnataka State' | 'Central Government';

export type SchemeCategory =
  | 'Financial Assistance'
  | 'Education & Scholarship'
  | 'Agriculture & Farming'
  | 'Women & Child Welfare'
  | 'Employment & Skills'
  | 'Healthcare & Insurance'
  | 'Housing & Shelter'
  | 'Social Security & Pension';

export interface SchemeRuleCriteria {
  minAge?: number;
  maxAge?: number;
  states?: string[]; // e.g. ['Karnataka'] or ['Central / All-India', 'Karnataka', 'All']
  maxIncome?: number; // In INR per annum
  occupations?: OccupationType[];
  educationLevels?: EducationLevel[];
  genders?: GenderType[];
  socialCategories?: SocialCategory[];
  allowedRationCards?: RationCardType[];
  requiresKarnatakaResident?: boolean;
  requiresLandholder?: boolean;
  requiresDifferentlyAbled?: boolean;
  requiresHeadOfFamily?: boolean;
  requiresUnemployed?: boolean;
  customConditionDescription?: string;
}

export interface Scheme {
  id: string;
  name: string;
  kannadaName?: string;
  level: SchemeLevel;
  department: string;
  category: SchemeCategory;
  briefOverview: string;
  financialBenefit: string;
  keyHighlights: string[];
  rules: SchemeRuleCriteria;
  requiredDocuments: string[];
  applicationSteps: string[];
  officialSourceLink: string;
  portalName: string;
  helpline?: string;
  tags: string[];
}

export interface CriterionEvaluation {
  attributeName: string;
  userValue: string | number | boolean | null | undefined;
  expectedRule: string;
  status: 'satisfied' | 'failed' | 'unverified';
  note: string;
}

export interface SchemeMatchResult {
  scheme: Scheme;
  matchScore: number; // 0 - 100
  relevanceIndicator: 'High' | 'Moderate' | 'Low' | 'Ineligible';
  isEligible: boolean;
  matchingAttributes: string[];
  whyItFits: string;
  evaluations: CriterionEvaluation[];
  missingOrUnverified: string[];
  requiredDocuments: string[];
  applicationSteps: string[];
  officialSourceLink: string;
  portalName: string;
}
