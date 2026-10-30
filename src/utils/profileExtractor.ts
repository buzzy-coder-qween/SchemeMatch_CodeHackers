import { UserProfile, OccupationType, EducationLevel, GenderType, SocialCategory, RationCardType } from '../types/scheme';

export interface ExtractedAttributeBadge {
  key: keyof UserProfile | 'landHoldingAcres';
  label: string;
  value: string;
  iconName?: string;
}

export interface ExtractionResult {
  profile: Partial<UserProfile>;
  badges: ExtractedAttributeBadge[];
  summary: string;
}

// Convert Kannada and Devanagari numerals to standard Western Arabic digits
export function normalizeNumerals(text: string): string {
  const kannadaDigits: Record<string, string> = {
    '೦': '0', '೧': '1', '೨': '2', '೩': '3', '೪': '4',
    '೫': '5', '೬': '6', '೭': '7', '೮': '8', '೯': '9',
  };
  const devanagariDigits: Record<string, string> = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  };

  return text
    .replace(/[೦-೯]/g, (d) => kannadaDigits[d] || d)
    .replace(/[०-९]/g, (d) => devanagariDigits[d] || d);
}

const KARNATAKA_DISTRICT_MAP: Record<string, string[]> = {
  'Belagavi': ['belagavi', 'belgaum', 'ಬೆಳಗಾವಿ', 'बेलगावी'],
  'Mandya': ['mandya', 'ಮಂಡ್ಯ', 'मांड्या'],
  'Mysuru': ['mysuru', 'mysore', 'ಮೈಸೂರು', 'मैसूरु', 'मैसूर'],
  'Bengaluru Urban': ['bengaluru urban', 'bangalore urban', 'bengaluru', 'bangalore', 'ಬೆಂಗಳೂರು', 'बेंगलुरु'],
  'Bengaluru Rural': ['bengaluru rural', 'bangalore rural', 'ಬೆಂಗಳೂರು ಗ್ರಾಮಾಂತರ'],
  'Dharwad': ['dharwad', 'hubli', 'hubballi', 'ಧಾರವಾಡ', 'ಹುಬ್ಬಳ್ಳಿ', 'धारवाड़', 'हुबली'],
  'Kalaburagi': ['kalaburagi', 'gulbarga', 'ಕಲಬುರಗಿ', 'ಗುಲ್ಬರ್ಗ', 'कलबुर्गी', 'गुलबर्गा'],
  'Dakshina Kannada': ['dakshina kannada', 'mangalore', 'mangaluru', 'ದಕ್ಷಿಣ ಕನ್ನಡ', 'ಮಂಗಳೂರು', 'मंगलुरु', 'दक्षिण कन्नड़'],
  'Udupi': ['udupi', 'ಉಡುಪಿ', 'उडुपी'],
  'Tumakuru': ['tumakuru', 'tumkur', 'ತುಮಕೂರು', 'तुमकुरु'],
  'Shivamogga': ['shivamogga', 'shimoga', 'ಶಿವಮೊಗ್ಗ', 'शिवमोग्गा'],
  'Ballari': ['ballari', 'bellary', 'ಬಳ್ಳಾರಿ', 'बल्लारी'],
  'Hassan': ['hassan', 'ಹಾಸನ', 'हासन'],
  'Bagalkote': ['bagalkote', 'bagalkot', 'ಬಾಗಲಕೋಟೆ', 'बागलकोट'],
  'Bidar': ['bidar', 'ಬೀದರ್', 'बीदर'],
  'Chamarajanagara': ['chamarajanagara', 'chamarajanagar', 'ಚಾಮರಾಜನಗರ', 'चामराजनगर'],
  'Chikkaballapura': ['chikkaballapura', 'ಚಿಕ್ಕಬಳ್ಳಾಪುರ', 'चिक्कबल्लापुर'],
  'Chikkamagaluru': ['chikkamagaluru', 'ಚಿಕ್ಕಮಗಳೂರು', 'चिकमगलूर'],
  'Chitradurga': ['chitradurga', 'ಚಿತ್ರದುರ್ಗ', 'चित्रदुर्ग'],
  'Davanagere': ['davanagere', 'ದಾವಣಗೆರೆ', 'दावणगेरे'],
  'Gadag': ['gadag', 'ಗದಗ', 'गदग'],
  'Haveri': ['haveri', 'ಹಾವೇರಿ', 'हावेरी'],
  'Kodagu': ['kodagu', 'coorg', 'ಕೊಡಗು', 'कूर्ग'],
  'Kolar': ['kolar', 'ಕೋಲಾರ', 'कोलार'],
  'Koppal': ['koppal', 'ಕೊಪ್ಪಳ', 'कोप्पल'],
  'Raichur': ['raichur', 'ರಾಯಚೂರು', 'रायचूर'],
  'Ramanagara': ['ramanagara', 'ರಾಮನಗರ', 'रामनगर'],
  'Uttara Kannada': ['uttara kannada', 'karwar', 'ಉತ್ತರ ಕನ್ನಡ', 'ಕಾರವಾರ', 'उत्तर कन्नड़'],
  'Vijayanagara': ['vijayanagara', 'hospet', 'ವಿಜಯನಗರ', 'ಹೊಸಪೇಟೆ', 'विजयनगर'],
  'Yadgir': ['yadgir', 'ಯಾದಗಿರಿ', 'यादगीर'],
};

export function extractProfileFromTextIntelligent(rawText: string): ExtractionResult {
  if (!rawText || typeof rawText !== 'string') {
    return { profile: {}, badges: [], summary: '' };
  }

  const normalized = normalizeNumerals(rawText);
  const lower = normalized.toLowerCase();
  const extracted: Partial<UserProfile> = {};
  const badges: ExtractedAttributeBadge[] = [];

  // 1. Age Extraction
  const ageMatch =
    lower.match(/(?:age\s*(?:is|:)?\s*|(\d{1,2})\s*(?:years?|yrs?|yr|ವರ್ಷದ|ವರ್ಷ|साल|वर्ष)\s*(?:old)?|(?:ವಯಸ್ಸು|ಆಯಸ್ಸು|उम्र|आयु)\s*(?:is|:)?\s*(\d{1,2})|i am\s*(\d{1,2}))/i);

  if (ageMatch) {
    const rawVal = ageMatch[1] || ageMatch[2] || ageMatch[3];
    if (rawVal) {
      const val = parseInt(rawVal, 10);
      if (!isNaN(val) && val >= 1 && val <= 110) {
        extracted.age = val;
        badges.push({ key: 'age', label: 'Age', value: `${val} Years` });
      }
    }
  } else {
    // Secondary simple age check e.g. "21 years", "46 ವರ್ಷ", "21 साल"
    const simpleAge = lower.match(/\b(\d{1,2})\s*(?:ವರ್ಷ|ವರ್ಷದ|ವಯಸ್ಸಿನ|साल|वर्ष|yrs?|years?)\b/i);
    if (simpleAge) {
      const val = parseInt(simpleAge[1], 10);
      if (!isNaN(val) && val >= 1 && val <= 110) {
        extracted.age = val;
        badges.push({ key: 'age', label: 'Age', value: `${val} Years` });
      }
    }
  }

  // 2. Gender Extraction
  const femaleTerms = [
    'female', 'woman', 'women', 'girl', 'mother', 'daughter', 'lady', 'housewife', 'homemaker',
    'ಮಹಿಳೆ', 'ಹೆಣ್ಣು', 'ವಿದ್ಯಾರ್ಥಿನಿ', 'ತಾಯಿ', 'ಯಜಮಾನಿ', 'ಗೃಹಿಣಿ', 'ಹೆಣ್ಣುಮಗಳು',
    'महिला', 'छात्रा', 'लड़की', 'माँ', 'माता', 'गृहणी', 'नारी', 'स्त्री',
  ];
  const maleTerms = [
    'male', 'man', 'men', 'boy', 'father', 'son', 'gentleman',
    'ಪುರುಷ', 'ಗಂಡು', 'ಹುಡುಗ', 'ತಂದೆ',
    'पुरुष', 'लड़का', 'पिता',
  ];
  const transTerms = [
    'transgender', 'trans', 'third gender',
    'ತೃತೀಯಲಿಂಗಿ', 'ಮಂಗಳಮುಖಿ',
    'ट्रांसजेंडर', 'किन्नर',
  ];

  if (transTerms.some((t) => lower.includes(t))) {
    extracted.gender = 'Transgender';
    badges.push({ key: 'gender', label: 'Gender', value: 'Transgender' });
  } else if (femaleTerms.some((t) => lower.includes(t))) {
    extracted.gender = 'Female';
    badges.push({ key: 'gender', label: 'Gender', value: 'Female' });
  } else if (maleTerms.some((t) => lower.includes(t))) {
    extracted.gender = 'Male';
    badges.push({ key: 'gender', label: 'Gender', value: 'Male' });
  }

  // 3. Location / State & District
  let matchedDistrict: string | null = null;
  for (const [distName, aliases] of Object.entries(KARNATAKA_DISTRICT_MAP)) {
    if (aliases.some((alias) => lower.includes(alias.toLowerCase()))) {
      matchedDistrict = distName;
      break;
    }
  }

  const karnatakaTerms = ['karnataka', 'ಕರ್ನಾಟಕ', 'कर्नाटक'];
  if (matchedDistrict || karnatakaTerms.some((k) => lower.includes(k))) {
    extracted.locationState = 'Karnataka';
    extracted.isKarnatakaResident = true;
    badges.push({ key: 'locationState', label: 'State', value: 'Karnataka' });
    if (matchedDistrict) {
      extracted.district = matchedDistrict;
      badges.push({ key: 'district', label: 'District', value: matchedDistrict });
    }
  } else if (lower.includes('all-india') || lower.includes('central') || lower.includes('india') || lower.includes('ಭಾರತ') || lower.includes('भारत')) {
    extracted.locationState = 'Central / All-India';
    extracted.isKarnatakaResident = false;
    badges.push({ key: 'locationState', label: 'State', value: 'Central / All-India' });
  }

  // 4. Landholding / Acres
  const acreMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:acres?|acre|ಎಕರೆ|एकड़)/i);
  if (acreMatch) {
    const acres = parseFloat(acreMatch[1]);
    if (!isNaN(acres) && acres > 0) {
      extracted.isLandholder = true;
      extracted.landHoldingAcres = acres;
      badges.push({ key: 'landHoldingAcres', label: 'Land Ownership', value: `${acres} Acres (RTC/FRUITS)` });
    }
  }

  // 5. Occupation
  const studentTerms = [
    'student', 'college', 'school', 'studying', 'study', 'undergrad', 'postgrad', 'phd',
    'ವಿದ್ಯಾರ್ಥಿ', 'ವಿದ್ಯಾರ್ಥಿನಿ', 'ಕಾಲೇಜು', 'ಶಾಲೆ', 'ಓದುತ್ತಿದ್ದೇನೆ', 'ವಿದ್ಯಾಭ್ಯಾಸ',
    'छात्र', 'छात्रा', 'विद्यार्थी', 'कॉलेज', 'स्कूल', 'पढ़ाई',
  ];
  const farmerTerms = [
    'farmer', 'farming', 'agriculture', 'cultivat', 'peasant', 'agri',
    'ರೈತ', 'ಕೃಷಿಕ', 'ಕೃಷಿ', 'ಬೆಳೆಗಾರ', 'ತೋಟಗಾರಿಕೆ',
    'किसान', 'खेती', 'कृषक', 'कृषि', 'काश्तकार',
  ];
  const entrepreneurTerms = [
    'entrepreneur', 'startup', 'business', 'shopkeeper', 'retailer', 'msme', 'self employed',
    'ಉದ್ಯಮಿ', 'ವ್ಯಾಪಾರಿ', 'ಸ್ಟಾರ್ಟಪ್', 'ಸ್ವಯಂ ಉದ್ಯೋಗ', 'ವ್ಯವಹಾರ',
    'उद्यमी', 'व्यापारी', 'व्यवसाय', 'स्टार्टअप', 'स्वरोजगार',
  ];
  const jobSeekerTerms = [
    'job seeker', 'unemployed', 'searching for job', 'looking for job', 'job hunt', 'graduated',
    'ನಿರುದ್ಯೋಗಿ', 'ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿ', 'ಕೆಲಸ ಹುಡುಕುತ್ತಿದ್ದೇನೆ', 'ಕೆಲಸವಿಲ್ಲ',
    'बेरोजगार', 'नौकरी की तलाश', 'रोजगार की तलाश',
  ];
  const artisanTerms = [
    'artisan', 'craft', 'weaver', 'carpenter', 'potter', 'blacksmith', 'goldsmith', 'vishwakarma',
    'ಕುಶಲಕರ್ಮಿ', 'ವಿಶ್ವಕರ್ಮ', 'ನೇಯ್ಗೆ', 'ಬಡಗಿ', 'ಕಮ್ಮಾರ', 'ಅಕ್ಕಸಾಲಿಗ',
    'कारीगर', 'शिल्पकार', 'विश्वकर्मा', 'बढ़ई', 'बुनकर', 'लोहार', 'सुनार',
  ];
  const homemakerTerms = [
    'homemaker', 'housewife',
    'ಗೃಹಿಣಿ', 'ಮನೆಯೊಡತಿ',
    'गृहणी',
  ];
  const seniorTerms = [
    'senior citizen', 'elderly', 'pensioner', 'retired', 'aged',
    'ಹಿರಿಯ ನಾಗರಿಕ', 'ವೃದ್ಧ', 'ಪಿಂಚಣಿದಾರ',
    'वरिष्ठ नागरिक', 'बुजुर्ग', 'पेंशनर',
  ];

  if (farmerTerms.some((t) => lower.includes(t))) {
    extracted.occupation = 'Farmer';
    extracted.isLandholder = true;
    badges.push({ key: 'occupation', label: 'Occupation', value: 'Farmer' });
  } else if (studentTerms.some((t) => lower.includes(t))) {
    extracted.occupation = 'Student';
    badges.push({ key: 'occupation', label: 'Occupation', value: 'Student' });
  } else if (entrepreneurTerms.some((t) => lower.includes(t))) {
    extracted.occupation = 'Entrepreneur';
    badges.push({ key: 'occupation', label: 'Occupation', value: 'Entrepreneur' });
  } else if (jobSeekerTerms.some((t) => lower.includes(t))) {
    extracted.occupation = 'Job Seeker';
    extracted.isUnemployed = true;
    badges.push({ key: 'occupation', label: 'Occupation', value: 'Job Seeker' });
  } else if (artisanTerms.some((t) => lower.includes(t))) {
    extracted.occupation = 'Artisan';
    badges.push({ key: 'occupation', label: 'Occupation', value: 'Artisan' });
  } else if (homemakerTerms.some((t) => lower.includes(t))) {
    extracted.occupation = 'Homemaker';
    badges.push({ key: 'occupation', label: 'Occupation', value: 'Homemaker' });
  } else if (seniorTerms.some((t) => lower.includes(t))) {
    extracted.occupation = 'Senior Citizen';
    badges.push({ key: 'occupation', label: 'Occupation', value: 'Senior Citizen' });
  }

  // 6. Education Level
  const undergradTerms = [
    'undergraduate', 'b.sc', 'bsc', 'b.com', 'bcom', 'b.a', 'ba', 'b.tech', 'btech', 'b.e', 'be', 'degree',
    'ಪದವಿ', 'ಡಿಗ್ರಿ', 'ಬಿ.ಎಸ್ಸಿ', 'ಬಿ.ಕಾಂ', 'ಬಿ.ಎ', 'ಇಂಜಿನಿಯರಿಂಗ್',
    'स्नातक', 'ग्रेजुएशन', 'बीएससी', 'बीए', 'बीकॉम', 'बीटेक',
  ];
  const postgradTerms = [
    'postgraduate', 'masters', 'm.sc', 'msc', 'm.tech', 'mtech', 'm.com', 'm.a', 'mba', 'mca',
    'ಸ್ನಾತಕೋತ್ತರ', 'ಎಂ.ಎಸ್ಸಿ', 'ಎಂ.ಟೆಕ್', 'ಎಂ.ಎ',
    'स्नातकोत्तर', 'पोस्ट ग्रेजुएशन', 'एमएससी', 'एमटेक', 'एमए',
  ];
  const doctorateTerms = ['phd', 'doctorate', 'ಡಾಕ್ಟರೇಟ್', 'ಪಿಎಚ್‌ಡಿ', 'डॉक्टरेट', 'पीएचडी'];
  const twelvethTerms = [
    '12th pass', '12th', 'puc pass', 'puc', 'higher secondary', 'intermediate',
    '12ನೇ ತರಗತಿ', 'ಪಿಯುಸಿ',
    '12वीं', 'बारहवीं', 'इंटरमीडिएट',
  ];
  const tenthTerms = [
    '10th pass', '10th', 'sslc pass', 'sslc', 'secondary', 'matric',
    '10ನೇ ತರಗತಿ', 'ಎಸ್ಎಸ್ಎಲ್ಸಿ',
    '10वीं', 'दसवीं', 'मैट्रिक',
  ];
  const diplomaTerms = ['diploma', 'iti', 'polytechnic', 'ಡಿಪ್ಲೊಮಾ', 'ಐಟಿಐ', 'ಪಾಲಿಟೆಕ್ನಿಕ್', 'डिप्लोमा', 'आईटीआई'];

  if (doctorateTerms.some((t) => lower.includes(t))) {
    extracted.educationLevel = 'Doctorate';
    badges.push({ key: 'educationLevel', label: 'Education', value: 'Doctorate / PhD' });
  } else if (postgradTerms.some((t) => lower.includes(t))) {
    extracted.educationLevel = 'Postgraduate';
    badges.push({ key: 'educationLevel', label: 'Education', value: 'Postgraduate' });
  } else if (undergradTerms.some((t) => lower.includes(t))) {
    extracted.educationLevel = 'Undergraduate';
    badges.push({ key: 'educationLevel', label: 'Education', value: 'Undergraduate' });
  } else if (diplomaTerms.some((t) => lower.includes(t))) {
    extracted.educationLevel = 'ITI / Diploma';
    badges.push({ key: 'educationLevel', label: 'Education', value: 'ITI / Diploma' });
  } else if (twelvethTerms.some((t) => lower.includes(t))) {
    extracted.educationLevel = '12th Pass';
    badges.push({ key: 'educationLevel', label: 'Education', value: '12th Pass (PUC)' });
  } else if (tenthTerms.some((t) => lower.includes(t))) {
    extracted.educationLevel = '10th Pass';
    badges.push({ key: 'educationLevel', label: 'Education', value: '10th Pass (SSLC)' });
  }

  // 7. Social Category
  const hasSC = /\b(?:sc|scheduled caste|dalit)\b/i.test(lower) || ['ಪರಿಶಿಷ್ಟ ಜಾತಿ', 'ಎಸ್.ಸಿ', 'ಎಸ್ಸಿ', 'अनुसूचित जाति', 'एससी'].some((t) => lower.includes(t));
  const hasST = /\b(?:st|scheduled tribe|adivasi)\b/i.test(lower) || ['ಪರಿಶಿಷ್ಟ ಪಂಗಡ', 'ಎಸ್.ಟಿ', 'ಎಸ್ಟಿ', 'अनुसूचित जनजाति', 'एसटी', 'आदिवासी'].some((t) => lower.includes(t));
  const obcTerms = [
    'obc', 'cat-1', 'cat-2a', 'cat-2b', 'cat-3a', 'cat-3b', 'cat 2a', 'category 2a', 'backward class',
    'ಹಿಂದುಳಿದ ವರ್ಗ', 'ಪ್ರವರ್ಗ 2ಎ', 'ಪ್ರವರ್ಗ 2ಬಿ', 'ಪ್ರವರ್ಗ 1', 'ಪ್ರವರ್ಗ 3ಎ', 'ಪ್ರವರ್ಗ 3ಬಿ', '2ಎ ಒಬಿಸಿ', 'ಪ್ರವರ್ಗ',
    'ओबीसी', 'अन्य पिछड़ा वर्ग', 'पिछड़ा वर्ग',
  ];
  const minorityTerms = [
    'minority', 'muslim', 'christian', 'jain', 'sikh', 'parsi', 'buddhist',
    'ಅಲ್ಪಸಂಖ್ಯಾತ', 'ಮುಸ್ಲಿಂ', 'ಕ್ರಿಶ್ಚಿಯನ್', 'ಜೈನ', 'ಸಿಖ್',
    'अल्पसंख्यक', 'मुस्लिम', 'ईसाई', 'जैन', 'सिख',
  ];
  const ewsTerms = ['ews', 'economically weaker', 'ಇಡಬ್ಲ್ಯೂಎಸ್', 'ईडब्ल्यूएस'];
  const generalTerms = ['general', 'general category', 'gm', 'ಸಾಮಾನ್ಯ ವರ್ಗ', 'ಸಾಮಾನ್ಯ', 'सामान्य'];

  if (obcTerms.some((t) => lower.includes(t))) {
    extracted.socialCategory = 'OBC';
    badges.push({ key: 'socialCategory', label: 'Social Category', value: 'OBC' });
  } else if (hasSC) {
    extracted.socialCategory = 'SC';
    badges.push({ key: 'socialCategory', label: 'Social Category', value: 'SC' });
  } else if (hasST) {
    extracted.socialCategory = 'ST';
    badges.push({ key: 'socialCategory', label: 'Social Category', value: 'ST' });
  } else if (minorityTerms.some((t) => lower.includes(t))) {
    extracted.socialCategory = 'Minority';
    badges.push({ key: 'socialCategory', label: 'Social Category', value: 'Minority' });
  } else if (ewsTerms.some((t) => lower.includes(t))) {
    extracted.socialCategory = 'EWS';
    badges.push({ key: 'socialCategory', label: 'Social Category', value: 'EWS' });
  } else if (generalTerms.some((t) => lower.includes(t))) {
    extracted.socialCategory = 'General';
    badges.push({ key: 'socialCategory', label: 'Social Category', value: 'General' });
  }

  // 8. Annual Family Income
  const lakhMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:lakhs?|lac|lacs|ಲಕ್ಷ|लाख)/i);
  if (lakhMatch) {
    const val = parseFloat(lakhMatch[1]);
    if (!isNaN(val) && val > 0) {
      const annualIncome = Math.round(val * 100000);
      extracted.annualIncome = annualIncome;
      badges.push({ key: 'annualIncome', label: 'Income', value: `₹${val} Lakh (₹${annualIncome.toLocaleString('en-IN')})` });
    }
  } else {
    // Numeric currency match e.g. "income 150000", "80000 per year", "ಆದಾಯ 150000"
    const directNumMatch = lower.match(/(?:income|salary|earning|ಆದಾಯ|आय|₹|rs\.?)\s*(?:is|:)?\s*(\d{4,7})/i);
    if (directNumMatch) {
      const val = parseInt(directNumMatch[1], 10);
      if (!isNaN(val) && val > 0) {
        extracted.annualIncome = val;
        badges.push({ key: 'annualIncome', label: 'Income', value: `₹${val.toLocaleString('en-IN')}` });
      }
    }
  }

  // 9. Ration Card Type
  const aayTerms = ['antyodaya', 'aay', 'ಅಂತ್ಯೋದಯ', 'अंत्योदय'];
  const bplTerms = ['bpl', 'below poverty line', 'priority household', 'phh', 'ಬಿಪಿಎಲ್', 'ರೇಷನ್ ಕಾರ್ಡ್', 'बीपीएल'];
  const aplTerms = ['apl', 'above poverty line', 'non-priority', 'ಎಪಿಎಲ್', 'एपीएल'];

  if (aayTerms.some((t) => lower.includes(t))) {
    extracted.rationCardType = 'AAY (Antyodaya)';
    badges.push({ key: 'rationCardType', label: 'Ration Card', value: 'AAY (Antyodaya)' });
  } else if (bplTerms.some((t) => lower.includes(t))) {
    extracted.rationCardType = 'BPL';
    badges.push({ key: 'rationCardType', label: 'Ration Card', value: 'BPL (Priority)' });
  } else if (aplTerms.some((t) => lower.includes(t))) {
    extracted.rationCardType = 'APL';
    badges.push({ key: 'rationCardType', label: 'Ration Card', value: 'APL' });
  }

  // 10. Specific Beneficiary Conditions
  // Head of Family (Woman Head)
  const headTerms = [
    'family head', 'head of family', 'female head', 'woman head', 'woman family head',
    'ಕುಟುಂಬದ ಯಜಮಾನಿ', 'ಮನೆಯೊಡತಿ', 'ಮಹಿಳಾ ಯಜಮಾನಿ',
    'परिवार की मुखिया', 'महिला मुखिया',
  ];
  if (headTerms.some((t) => lower.includes(t))) {
    extracted.isHeadOfFamily = true;
    if (!extracted.gender) extracted.gender = 'Female';
    badges.push({ key: 'isHeadOfFamily', label: 'Special Status', value: 'Woman Head of Family' });
  }

  // Differently Abled / PwD
  const pwdTerms = [
    'differently abled', 'disabled', 'pwd', 'udid', 'handicap',
    'ವಿಶೇಷ ಚೇತನ', 'ಅಂಗವಿಕಲ', 'ದಿವ್ಯಾಂಗ', 'ವಿಕಲಚೇತನ',
    'दिव्यांग', 'विकलांग',
  ];
  if (pwdTerms.some((t) => lower.includes(t))) {
    extracted.isDifferentlyAbled = true;
    badges.push({ key: 'isDifferentlyAbled', label: 'Special Status', value: 'Differently Abled (PwD)' });
  }

  // Unemployed
  const unemployedTerms = ['unemployed', 'ನಿರುದ್ಯೋಗಿ', 'ಕೆಲಸವಿಲ್ಲ', 'बेरोजगार'];
  if (unemployedTerms.some((t) => lower.includes(t))) {
    extracted.isUnemployed = true;
    if (!badges.some((b) => b.key === 'isUnemployed')) {
      badges.push({ key: 'isUnemployed', label: 'Employment Status', value: 'Unemployed' });
    }
  }

  const summary = `Extracted ${badges.length} citizen attributes: ${badges.map((b) => `${b.label}: ${b.value}`).join(' • ')}`;

  return {
    profile: extracted,
    badges,
    summary,
  };
}
