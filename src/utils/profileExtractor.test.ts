import test from 'node:test';
import assert from 'node:assert/strict';
import { extractProfileFromTextIntelligent, normalizeNumerals } from './profileExtractor';

test('normalizeNumerals converts Kannada and Devanagari numerals to standard digits', () => {
  assert.equal(normalizeNumerals('೨೧ ವರ್ಷ ಮತ್ತು ೧.೫ ಲಕ್ಷ'), '21 ವರ್ಷ ಮತ್ತು 1.5 ಲಕ್ಷ');
  assert.equal(normalizeNumerals('२१ वर्ष और १.५ लाख'), '21 वर्ष और 1.5 लाख');
  assert.equal(normalizeNumerals('೪೬ ವರ್ಷ, ೨.೫ ಎಕರೆ'), '46 ವರ್ಷ, 2.5 ಎಕರೆ');
});

test('extractProfileFromTextIntelligent extracts English student profile', () => {
  const text = 'I am a 21 year old female B.Sc student from Belagavi with family income of 1.5 lakhs belonging to Cat-2A OBC and BPL card.';
  const result = extractProfileFromTextIntelligent(text);

  assert.equal(result.profile.age, 21);
  assert.equal(result.profile.gender, 'Female');
  assert.equal(result.profile.locationState, 'Karnataka');
  assert.equal(result.profile.district, 'Belagavi');
  assert.equal(result.profile.occupation, 'Student');
  assert.equal(result.profile.educationLevel, 'Undergraduate');
  assert.equal(result.profile.annualIncome, 150000);
  assert.equal(result.profile.socialCategory, 'OBC');
  assert.equal(result.profile.rationCardType, 'BPL');
  assert.ok(result.badges.length >= 7);
});

test('extractProfileFromTextIntelligent extracts Kannada student profile with Kannada script', () => {
  const text = 'ನಾನು ಬೆಳಗಾವಿಯ 21 ವರ್ಷದ ಬಿ.ಎಸ್ಸಿ ವಿದ್ಯಾರ್ಥಿನಿ, ಕುಟುಂಬದ ವಾರ್ಷಿಕ ಆದಾಯ 1.5 ಲಕ್ಷ ಮತ್ತು ಹಿಂದುಳಿದ ಪ್ರವರ್ಗ 2ಎ (OBC) ವರ್ಗಕ್ಕೆ ಸೇರಿದವಳು.';
  const result = extractProfileFromTextIntelligent(text);

  assert.equal(result.profile.age, 21);
  assert.equal(result.profile.gender, 'Female');
  assert.equal(result.profile.locationState, 'Karnataka');
  assert.equal(result.profile.district, 'Belagavi');
  assert.equal(result.profile.occupation, 'Student');
  assert.equal(result.profile.educationLevel, 'Undergraduate');
  assert.equal(result.profile.annualIncome, 150000);
  assert.equal(result.profile.socialCategory, 'OBC');
});

test('extractProfileFromTextIntelligent extracts Kannada farmer with landholding', () => {
  const text = 'ಮಂಡ್ಯದ ಸಣ್ಣ ರೈತ, ವಯಸ್ಸು 46, 2.5 ಎಕರೆ ಕೃಷಿ ಜಮೀನು, ಬಿಪಿಎಲ್ ಕಾರ್ಡ್ ಮತ್ತು ವಾರ್ಷಿಕ ಆದಾಯ 1.1 ಲಕ್ಷ.';
  const result = extractProfileFromTextIntelligent(text);

  assert.equal(result.profile.age, 46);
  assert.equal(result.profile.locationState, 'Karnataka');
  assert.equal(result.profile.district, 'Mandya');
  assert.equal(result.profile.occupation, 'Farmer');
  assert.equal(result.profile.isLandholder, true);
  assert.equal(result.profile.landHoldingAcres, 2.5);
  assert.equal(result.profile.rationCardType, 'BPL');
  assert.equal(result.profile.annualIncome, 110000);
});

test('extractProfileFromTextIntelligent extracts Hindi student profile', () => {
  const text = 'मैं बेलगावी की 21 वर्षीय छात्रा हूँ, बीएससी कर रही हूँ, परिवार की वार्षिक आय 1.5 लाख है और ओबीसी श्रेणी में आती हूँ।';
  const result = extractProfileFromTextIntelligent(text);

  assert.equal(result.profile.age, 21);
  assert.equal(result.profile.gender, 'Female');
  assert.equal(result.profile.locationState, 'Karnataka');
  assert.equal(result.profile.district, 'Belagavi');
  assert.equal(result.profile.occupation, 'Student');
  assert.equal(result.profile.educationLevel, 'Undergraduate');
  assert.equal(result.profile.annualIncome, 150000);
  assert.equal(result.profile.socialCategory, 'OBC');
});

test('extractProfileFromTextIntelligent extracts woman head of family with BPL', () => {
  const text = 'Female homemaker and family head from Mysuru with BPL card, seeking monthly assistance.';
  const result = extractProfileFromTextIntelligent(text);

  assert.equal(result.profile.gender, 'Female');
  assert.equal(result.profile.isHeadOfFamily, true);
  assert.equal(result.profile.district, 'Mysuru');
  assert.equal(result.profile.rationCardType, 'BPL');
});

test('extractProfileFromTextIntelligent extracts unemployed graduate in Bengaluru', () => {
  const text = 'I am 23 years old unemployed graduate searching for a job in Bengaluru with income 0';
  const result = extractProfileFromTextIntelligent(text);

  assert.equal(result.profile.age, 23);
  assert.equal(result.profile.occupation, 'Job Seeker');
  assert.equal(result.profile.isUnemployed, true);
  assert.equal(result.profile.district, 'Bengaluru Urban');
  assert.equal(result.profile.educationLevel, 'Undergraduate');
});

test('extractProfileFromTextIntelligent extracts artisan and differently abled condition', () => {
  const text = '35 year old differently abled artisan weaver from Shivamogga with income 90000';
  const result = extractProfileFromTextIntelligent(text);

  assert.equal(result.profile.age, 35);
  assert.equal(result.profile.isDifferentlyAbled, true);
  assert.equal(result.profile.occupation, 'Artisan');
  assert.equal(result.profile.district, 'Shivamogga');
  assert.equal(result.profile.annualIncome, 90000);
});

