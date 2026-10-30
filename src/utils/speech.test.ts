import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanTextForSpeech, getVoiceLangTag } from './speech';
import { getTranslation, SUPPORTED_LANGUAGES } from '../i18n/translations';

test('getVoiceLangTag maps supported languages correctly', () => {
  assert.equal(getVoiceLangTag('kn'), 'kn-IN');
  assert.equal(getVoiceLangTag('hi'), 'hi-IN');
  assert.equal(getVoiceLangTag('en'), 'en-IN');
});

test('cleanTextForSpeech strips markdown formatting for natural voice synthesis', () => {
  const markdown = '### 1. **Gruha Lakshmi Scheme** (Karnataka)\n* Financial Benefit: ₹2,000/month. Visit [Seva Sindhu](https://sevasindhu.karnataka.gov.in)';
  const cleaned = cleanTextForSpeech(markdown);

  assert.ok(!cleaned.includes('###'));
  assert.ok(!cleaned.includes('**'));
  assert.ok(!cleaned.includes('https://'));
  assert.ok(cleaned.includes('Gruha Lakshmi Scheme'));
  assert.ok(cleaned.includes('Seva Sindhu'));
});

test('getTranslation retrieves English, Kannada, and Hindi localized strings', () => {
  const enTitle = getTranslation('en', 'heroTitle');
  const knTitle = getTranslation('kn', 'heroTitle');
  const hiTitle = getTranslation('hi', 'heroTitle');

  assert.ok(enTitle.includes('Personalized Scheme Discovery'));
  assert.ok(knTitle.includes('ಕರ್ನಾಟಕ'));
  assert.ok(hiTitle.includes('कर्नाटक'));

  // Fallback to English if key missing
  assert.equal(getTranslation('kn', 'nonExistentKey123'), 'nonExistentKey123');
});

test('Supported languages include English, Kannada, and Hindi', () => {
  const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
  assert.ok(codes.includes('en'));
  assert.ok(codes.includes('kn'));
  assert.ok(codes.includes('hi'));
});
