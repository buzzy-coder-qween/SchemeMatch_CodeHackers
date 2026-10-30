import test from 'node:test';
import assert from 'node:assert/strict';
import { SCHEMES_DATABASE } from '../data/schemes';
import {
  evaluateSchemeEligibility,
  rankMatchingSchemes,
  generateMarkdownReport,
  MANDATORY_DISCLAIMER,
} from './matchingEngine';
import { UserProfile } from '../types/scheme';

test('Karnataka female college student matches SSP scholarship and Shakti scheme', () => {
  const studentProfile: UserProfile = {
    age: 20,
    locationState: 'Karnataka',
    district: 'Belagavi',
    annualIncome: 150000,
    occupation: 'Student',
    educationLevel: 'Undergraduate',
    gender: 'Female',
    socialCategory: 'OBC',
    isKarnatakaResident: true,
    rationCardType: 'BPL',
    isLandholder: false,
    isDifferentlyAbled: false,
  };

  const results = rankMatchingSchemes(studentProfile, SCHEMES_DATABASE);

  // Should have high match for SSP Scholarship and Shakti Scheme
  const ssp = results.find((r) => r.scheme.id === 'karnataka-ssp-scholarship');
  const shakti = results.find((r) => r.scheme.id === 'shakti-scheme');

  assert.ok(ssp, 'SSP scholarship should be evaluated');
  assert.equal(ssp?.relevanceIndicator, 'High');
  assert.ok(ssp?.matchScore >= 80, 'SSP match score should be high for eligible OBC student');
  assert.ok(
    ssp?.matchingAttributes.some((m) => m.includes('Student')),
    'Matching attributes should reflect occupation Student'
  );

  assert.ok(shakti, 'Shakti scheme should be evaluated');
  assert.equal(shakti?.relevanceIndicator, 'High');
  assert.ok(shakti?.isEligible, 'Female resident of Karnataka is eligible for Shakti scheme');
});

test('Karnataka female head of household with BPL card matches Gruha Lakshmi scheme', () => {
  const homemakerProfile: UserProfile = {
    age: 38,
    locationState: 'Karnataka',
    district: 'Mysuru',
    annualIncome: 90000,
    occupation: 'Homemaker',
    educationLevel: '10th Pass',
    gender: 'Female',
    socialCategory: 'General',
    isKarnatakaResident: true,
    rationCardType: 'BPL',
    isLandholder: false,
    isDifferentlyAbled: false,
    isHeadOfFamily: true,
  };

  const gruhaLakshmi = SCHEMES_DATABASE.find((s) => s.id === 'gruha-lakshmi')!;
  const result = evaluateSchemeEligibility(homemakerProfile, gruhaLakshmi);

  assert.equal(result.relevanceIndicator, 'High');
  assert.ok(result.matchScore >= 80);
  assert.ok(result.matchingAttributes.some((m) => m.includes('Resident of Karnataka')));
  assert.ok(result.matchingAttributes.some((m) => m.includes('Female')));
});

test('Farmer with cultivable land matches PM-KISAN and Raitha Siri', () => {
  const farmerProfile: UserProfile = {
    age: 45,
    locationState: 'Karnataka',
    district: 'Mandya',
    annualIncome: 120000,
    occupation: 'Farmer',
    educationLevel: '10th Pass',
    gender: 'Male',
    socialCategory: 'OBC',
    isKarnatakaResident: true,
    rationCardType: 'BPL',
    isLandholder: true,
    landHoldingAcres: 2.5,
    isDifferentlyAbled: false,
  };

  const results = rankMatchingSchemes(farmerProfile, SCHEMES_DATABASE);

  const pmKisan = results.find((r) => r.scheme.id === 'pm-kisan');
  const raithaSiri = results.find((r) => r.scheme.id === 'raitha-siri');

  assert.ok(pmKisan, 'PM-KISAN should be present');
  assert.equal(pmKisan?.relevanceIndicator, 'High');
  assert.ok(raithaSiri, 'Raitha Siri should be present');
  assert.equal(raithaSiri?.relevanceIndicator, 'High');
});

test('Unemployed Karnataka youth matches Yuva Nidhi', () => {
  const youthProfile: UserProfile = {
    age: 23,
    locationState: 'Karnataka',
    district: 'Dharwad',
    annualIncome: 50000,
    occupation: 'Job Seeker',
    educationLevel: 'Undergraduate',
    gender: 'Male',
    socialCategory: 'General',
    isKarnatakaResident: true,
    rationCardType: 'APL',
    isLandholder: false,
    isDifferentlyAbled: false,
    isUnemployed: true,
    unemploymentDurationMonths: 8,
  };

  const yuvaNidhi = SCHEMES_DATABASE.find((s) => s.id === 'yuva-nidhi')!;
  const result = evaluateSchemeEligibility(youthProfile, yuvaNidhi);

  assert.equal(result.relevanceIndicator, 'High');
  assert.ok(result.isEligible);
});

test('Unverified profile attributes are flagged in missingOrUnverified', () => {
  const incompleteProfile: UserProfile = {
    age: null,
    locationState: 'Karnataka',
    annualIncome: null,
    occupation: '',
    educationLevel: '',
    gender: '',
    socialCategory: '',
    isKarnatakaResident: true,
    rationCardType: 'Unverified',
    isLandholder: false,
    isDifferentlyAbled: false,
  };

  const ssp = SCHEMES_DATABASE.find((s) => s.id === 'karnataka-ssp-scholarship')!;
  const result = evaluateSchemeEligibility(incompleteProfile, ssp);

  assert.ok(result.missingOrUnverified.length > 0, 'Should flag missing income and occupation');
  assert.ok(
    result.missingOrUnverified.some((m) => m.toLowerCase().includes('income')),
    'Should flag missing income'
  );
});

test('Markdown report generator contains all 4 mandatory sections and exact disclaimer', () => {
  const sampleProfile: UserProfile = {
    age: 21,
    locationState: 'Karnataka',
    annualIncome: 180000,
    occupation: 'Student',
    educationLevel: 'Undergraduate',
    gender: 'Female',
    socialCategory: 'OBC',
    isKarnatakaResident: true,
    rationCardType: 'BPL',
    isLandholder: false,
    isDifferentlyAbled: false,
  };

  const results = rankMatchingSchemes(sampleProfile, SCHEMES_DATABASE);
  const report = generateMarkdownReport(sampleProfile, results);

  assert.ok(report.includes('### 1. Top Recommended Schemes (Ranked)'), 'Must include Section 1');
  assert.ok(report.includes('### 2. Match Breakdown & Explanation'), 'Must include Section 2');
  assert.ok(report.includes('### 3. Missing or Unverified Information'), 'Must include Section 3');
  assert.ok(report.includes('### 4. Application Checklist & Action Plan'), 'Must include Section 4');
  assert.ok(report.includes(MANDATORY_DISCLAIMER), 'Must include exact mandatory disclaimer');
});
