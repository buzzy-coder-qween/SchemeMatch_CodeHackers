import {
  CriterionEvaluation,
  Scheme,
  SchemeMatchResult,
  UserProfile,
} from '../types/scheme';

export const MANDATORY_DISCLAIMER =
  '> *Disclaimer: This assistant provides likely matches and guidance based on your profile. It does not guarantee benefit approval. You must verify current eligibility conditions, required documents, deadlines, and application procedures with the relevant official government authority before applying.*';

export function evaluateSchemeEligibility(
  profile: UserProfile,
  scheme: Scheme
): SchemeMatchResult {
  const evaluations: CriterionEvaluation[] = [];
  const matchingAttributes: string[] = [];
  const missingOrUnverified: string[] = [];
  const failedCriteria: string[] = [];

  let hardGateFailed = false;
  let rawScore = 0;
  let maxPossibleScore = 0;

  const rules = scheme.rules;

  // 1. Location / State Check (Weight: 20)
  maxPossibleScore += 20;
  const isKarnatakaScheme = scheme.level === 'Karnataka State' || rules.requiresKarnatakaResident;
  if (isKarnatakaScheme) {
    if (profile.isKarnatakaResident || profile.locationState.toLowerCase().includes('karnataka')) {
      rawScore += 20;
      matchingAttributes.push(`Resident of Karnataka matches ${scheme.level} mandate.`);
      evaluations.push({
        attributeName: 'Location & Domicile',
        userValue: profile.locationState || 'Karnataka',
        expectedRule: 'Must be a domicile resident of Karnataka',
        status: 'satisfied',
        note: 'Karnataka residency criteria fully satisfied.',
      });
    } else if (!profile.locationState) {
      rawScore += 10;
      missingOrUnverified.push(
        `State/residency is unverified. This is a Karnataka State scheme requiring proof of Karnataka domicile.`
      );
      evaluations.push({
        attributeName: 'Location & Domicile',
        userValue: 'Not specified',
        expectedRule: 'Karnataka resident',
        status: 'unverified',
        note: 'Please confirm whether you reside in Karnataka.',
      });
    } else {
      hardGateFailed = true;
      failedCriteria.push(`Scheme is exclusive to Karnataka residents (User located in ${profile.locationState}).`);
      evaluations.push({
        attributeName: 'Location & Domicile',
        userValue: profile.locationState,
        expectedRule: 'Karnataka resident only',
        status: 'failed',
        note: `Applicant does not reside in Karnataka.`,
      });
    }
  } else {
    // Central scheme: pan-India
    rawScore += 20;
    matchingAttributes.push(`Central Government scheme applicable across India (including Karnataka).`);
    evaluations.push({
      attributeName: 'Location & Domicile',
      userValue: profile.locationState || 'All-India',
      expectedRule: 'Pan-India / Central Government',
      status: 'satisfied',
      note: 'All Indian citizens eligible by location.',
    });
  }

  // 2. Gender Check (Weight: 15)
  if (rules.genders && rules.genders.length > 0) {
    maxPossibleScore += 15;
    if (profile.gender) {
      if (rules.genders.includes(profile.gender)) {
        rawScore += 15;
        matchingAttributes.push(`Gender (${profile.gender}) matches scheme target group (${rules.genders.join('/')}).`);
        evaluations.push({
          attributeName: 'Gender',
          userValue: profile.gender,
          expectedRule: rules.genders.join(', '),
          status: 'satisfied',
          note: `Targeted exclusively for ${rules.genders.join('/')} beneficiaries.`,
        });
      } else {
        hardGateFailed = true;
        failedCriteria.push(`Scheme is targeted for ${rules.genders.join('/')} applicants (User gender: ${profile.gender}).`);
        evaluations.push({
          attributeName: 'Gender',
          userValue: profile.gender,
          expectedRule: rules.genders.join(', '),
          status: 'failed',
          note: `Ineligible based on gender targeting.`,
        });
      }
    } else {
      missingOrUnverified.push(`Gender not specified. This scheme targets: ${rules.genders.join('/')}.`);
      evaluations.push({
        attributeName: 'Gender',
        userValue: 'Not provided',
        expectedRule: rules.genders.join(', '),
        status: 'unverified',
        note: 'Please specify your gender to confirm eligibility.',
      });
    }
  }

  // 3. Age Check (Weight: 15)
  if (rules.minAge !== undefined || rules.maxAge !== undefined) {
    maxPossibleScore += 15;
    const min = rules.minAge ?? 0;
    const max = rules.maxAge ?? 120;
    if (profile.age !== null && profile.age !== undefined && profile.age > 0) {
      if (profile.age >= min && profile.age <= max) {
        rawScore += 15;
        matchingAttributes.push(`Age ${profile.age} is within the required range of ${min}-${max} years.`);
        evaluations.push({
          attributeName: 'Age',
          userValue: `${profile.age} years`,
          expectedRule: `${min} to ${max} years`,
          status: 'satisfied',
          note: `Applicant age qualifies.`,
        });
      } else {
        hardGateFailed = true;
        failedCriteria.push(`Age ${profile.age} is outside the allowed bracket of ${min}-${max} years.`);
        evaluations.push({
          attributeName: 'Age',
          userValue: `${profile.age} years`,
          expectedRule: `${min} to ${max} years`,
          status: 'failed',
          note: `Age does not meet eligibility bounds.`,
        });
      }
    } else {
      missingOrUnverified.push(
        `Age details not provided. Please verify if your age is between ${min} and ${max} years.`
      );
      evaluations.push({
        attributeName: 'Age',
        userValue: 'Not provided',
        expectedRule: `${min} to ${max} years`,
        status: 'unverified',
        note: 'Age verification needed.',
      });
    }
  }

  // 4. Annual Income Ceiling Check (Weight: 20)
  if (rules.maxIncome !== undefined) {
    maxPossibleScore += 20;
    const ceiling = rules.maxIncome;
    const formattedCeiling = `₹${(ceiling / 100000).toFixed(1)} Lakhs (₹${ceiling.toLocaleString('en-IN')})`;

    if (profile.annualIncome !== null && profile.annualIncome !== undefined) {
      if (profile.annualIncome <= ceiling) {
        rawScore += 20;
        matchingAttributes.push(
          `Annual family income of ₹${profile.annualIncome.toLocaleString('en-IN')} is within ceiling of ${formattedCeiling}.`
        );
        evaluations.push({
          attributeName: 'Annual Income',
          userValue: `₹${profile.annualIncome.toLocaleString('en-IN')}`,
          expectedRule: `Maximum ${formattedCeiling} / year`,
          status: 'satisfied',
          note: 'Income criteria satisfied.',
        });
      } else {
        hardGateFailed = true;
        failedCriteria.push(
          `Family income ₹${profile.annualIncome.toLocaleString('en-IN')} exceeds the scheme maximum ceiling of ${formattedCeiling}.`
        );
        evaluations.push({
          attributeName: 'Annual Income',
          userValue: `₹${profile.annualIncome.toLocaleString('en-IN')}`,
          expectedRule: `Maximum ${formattedCeiling} / year`,
          status: 'failed',
          note: 'Exceeds income limit.',
        });
      }
    } else {
      missingOrUnverified.push(
        `Annual income details not provided. Please verify if your family income is below ${formattedCeiling} and obtain an Income Certificate (RD number).`
      );
      evaluations.push({
        attributeName: 'Annual Income',
        userValue: 'Not provided',
        expectedRule: `Maximum ${formattedCeiling} / year`,
        status: 'unverified',
        note: 'Income certificate or self-declaration pending.',
      });
    }
  }

  // 5. Occupation & Livelihood Alignment (Weight: 15)
  if (rules.occupations && rules.occupations.length > 0) {
    maxPossibleScore += 15;
    if (profile.occupation) {
      if (rules.occupations.includes(profile.occupation)) {
        rawScore += 15;
        matchingAttributes.push(
          `Occupation '${profile.occupation}' matches targeted beneficiary group (${rules.occupations.join(', ')}).`
        );
        evaluations.push({
          attributeName: 'Occupation',
          userValue: profile.occupation,
          expectedRule: rules.occupations.join(', '),
          status: 'satisfied',
          note: 'Direct match for occupational target group.',
        });
      } else {
        failedCriteria.push(
          `Occupation '${profile.occupation}' does not directly align with ${rules.occupations.join(', ')}.`
        );
        evaluations.push({
          attributeName: 'Occupation',
          userValue: profile.occupation,
          expectedRule: rules.occupations.join(', '),
          status: 'failed',
          note: 'Does not match targeted profession.',
        });
      }
    } else {
      missingOrUnverified.push(
        `Occupation is unstated. This program specifically supports: ${rules.occupations.join(', ')}.`
      );
      evaluations.push({
        attributeName: 'Occupation',
        userValue: 'Not provided',
        expectedRule: rules.occupations.join(', '),
        status: 'unverified',
        note: 'Occupation clarification needed.',
      });
    }
  }

  // 6. Social Category / Reservation Check (Weight: 10)
  if (rules.socialCategories && rules.socialCategories.length > 0) {
    maxPossibleScore += 10;
    if (profile.socialCategory) {
      if (rules.socialCategories.includes(profile.socialCategory)) {
        rawScore += 10;
        matchingAttributes.push(
          `Social category '${profile.socialCategory}' qualifies under targeted categories (${rules.socialCategories.join(', ')}).`
        );
        evaluations.push({
          attributeName: 'Social Category',
          userValue: profile.socialCategory,
          expectedRule: rules.socialCategories.join(', '),
          status: 'satisfied',
          note: 'Social category criteria met.',
        });
      } else {
        failedCriteria.push(
          `Social category '${profile.socialCategory}' not covered in targeted list (${rules.socialCategories.join(', ')}).`
        );
        evaluations.push({
          attributeName: 'Social Category',
          userValue: profile.socialCategory,
          expectedRule: rules.socialCategories.join(', '),
          status: 'failed',
          note: 'Category not eligible for this reservation/scheme.',
        });
      }
    } else {
      missingOrUnverified.push(
        `Social category not declared. Scheme is specifically targeted for: ${rules.socialCategories.join(', ')}.`
      );
      evaluations.push({
        attributeName: 'Social Category',
        userValue: 'Not provided',
        expectedRule: rules.socialCategories.join(', '),
        status: 'unverified',
        note: 'Caste certificate / category declaration needed.',
      });
    }
  }

  // 7. Specific Conditions: Ration Card (Weight: 10)
  if (rules.allowedRationCards && rules.allowedRationCards.length > 0) {
    maxPossibleScore += 10;
    if (profile.rationCardType && profile.rationCardType !== 'Unverified') {
      if (rules.allowedRationCards.includes(profile.rationCardType)) {
        rawScore += 10;
        matchingAttributes.push(`Ration Card type (${profile.rationCardType}) qualifies for priority benefit.`);
        evaluations.push({
          attributeName: 'Ration Card',
          userValue: profile.rationCardType,
          expectedRule: rules.allowedRationCards.join(' or '),
          status: 'satisfied',
          note: 'Eligible card type confirmed.',
        });
      } else {
        failedCriteria.push(
          `Ration Card '${profile.rationCardType}' is not among eligible types (${rules.allowedRationCards.join(', ')}).`
        );
        evaluations.push({
          attributeName: 'Ration Card',
          userValue: profile.rationCardType,
          expectedRule: rules.allowedRationCards.join(' or '),
          status: 'failed',
          note: 'Card type does not meet eligibility threshold.',
        });
      }
    } else {
      missingOrUnverified.push(
        `Ration card type unconfirmed. Scheme requires ${rules.allowedRationCards.join(' or ')} card to sanction benefits.`
      );
      evaluations.push({
        attributeName: 'Ration Card',
        userValue: 'Unverified / Not provided',
        expectedRule: rules.allowedRationCards.join(' or '),
        status: 'unverified',
        note: 'Check if household has an active BPL/Antyodaya or APL card.',
      });
    }
  }

  // 8. Specific Conditions: Landholding (Weight: 15)
  if (rules.requiresLandholder) {
    maxPossibleScore += 15;
    if (profile.isLandholder) {
      rawScore += 15;
      matchingAttributes.push(
        `Cultivable land ownership confirmed (Bhoomi RTC / Pahani record required).`
      );
      evaluations.push({
        attributeName: 'Agricultural Landholding',
        userValue: profile.landHoldingAcres ? `${profile.landHoldingAcres} acres` : 'Yes (Landholder)',
        expectedRule: 'Must own cultivable agricultural land',
        status: 'satisfied',
        note: 'Landholder requirement satisfied.',
      });
    } else {
      hardGateFailed = true;
      failedCriteria.push(`Requires applicant to own cultivable agricultural land (applicant marked as non-landholder).`);
      evaluations.push({
        attributeName: 'Agricultural Landholding',
        userValue: 'No land ownership',
        expectedRule: 'Must own agricultural land',
        status: 'failed',
        note: 'Ineligible because landholding is mandatory.',
      });
    }
  }

  // 9. Specific Conditions: Head of Family
  if (rules.requiresHeadOfFamily) {
    if (profile.isHeadOfFamily === true) {
      rawScore += 5;
      matchingAttributes.push(`Applicant is designated as the woman head of household in the family record.`);
    } else if (profile.isHeadOfFamily === false) {
      missingOrUnverified.push(
        `Must verify whether the applicant is registered as the woman head in the Ration card / Kutumba database.`
      );
    }
  }

  // 10. Specific Conditions: Unemployment
  if (rules.requiresUnemployed) {
    if (profile.isUnemployed === true || profile.occupation === 'Job Seeker') {
      rawScore += 5;
      matchingAttributes.push(`Unemployed graduate/diploma holder status aligns with allowance criteria.`);
    } else {
      missingOrUnverified.push(
        `Requires applicant to be unemployed for at least 180 days after completion of degree/diploma.`
      );
    }
  }

  // Normalize final score
  let finalScore = 0;
  if (maxPossibleScore > 0) {
    finalScore = Math.round((rawScore / maxPossibleScore) * 100);
  }

  // If hard gate failed, cap score and mark ineligible
  if (hardGateFailed) {
    finalScore = Math.min(finalScore, 20);
  }

  // Determine relevance indicator
  let relevanceIndicator: 'High' | 'Moderate' | 'Low' | 'Ineligible';
  if (hardGateFailed || finalScore < 30) {
    relevanceIndicator = 'Ineligible';
  } else if (finalScore >= 75) {
    relevanceIndicator = 'High';
  } else if (finalScore >= 50) {
    relevanceIndicator = 'Moderate';
  } else {
    relevanceIndicator = 'Low';
  }

  // Generate plain-language 'Why it fits' explanation
  const whyItFits = buildPlainLanguageExplanation(
    profile,
    scheme,
    matchingAttributes,
    missingOrUnverified,
    failedCriteria,
    relevanceIndicator
  );

  return {
    scheme,
    matchScore: finalScore,
    relevanceIndicator,
    isEligible: !hardGateFailed && finalScore >= 50,
    matchingAttributes,
    whyItFits,
    evaluations,
    missingOrUnverified,
    requiredDocuments: scheme.requiredDocuments,
    applicationSteps: scheme.applicationSteps,
    officialSourceLink: scheme.officialSourceLink,
    portalName: scheme.portalName,
  };
}

function buildPlainLanguageExplanation(
  profile: UserProfile,
  scheme: Scheme,
  matches: string[],
  unverified: string[],
  fails: string[],
  indicator: string
): string {
  if (indicator === 'Ineligible') {
    return `This scheme does not match your current profile primarily because: ${fails.join(
      ' '
    )} However, if your circumstances change, you may re-evaluate.`;
  }

  const parts: string[] = [];

  parts.push(
    `This scheme is a **${indicator} Match (${matches.length} matching attributes)** for your profile.`
  );

  if (matches.length > 0) {
    parts.push(
      `Your background as a ${profile.occupation || 'citizen'} ${
        profile.gender ? `(${profile.gender})` : ''
      } ${
        profile.annualIncome
          ? `with family income of ₹${profile.annualIncome.toLocaleString('en-IN')}`
          : ''
      } directly fits the criteria for ${scheme.name}. Specifically, ${scheme.financialBenefit}`
    );
  }

  if (unverified.length > 0) {
    parts.push(
      `To finalize approval, ensure you address ${unverified.length} pending verification check(s): ${unverified[0]}`
    );
  }

  return parts.join(' ');
}

export function rankMatchingSchemes(
  profile: UserProfile,
  schemes: Scheme[]
): SchemeMatchResult[] {
  const results = schemes.map((s) => evaluateSchemeEligibility(profile, s));

  // Sort descending by matchScore, then High > Moderate > Low
  return results.sort((a, b) => {
    if (a.matchScore !== b.matchScore) {
      return b.matchScore - a.matchScore;
    }
    const indicatorWeight: Record<string, number> = {
      High: 3,
      Moderate: 2,
      Low: 1,
      Ineligible: 0,
    };
    return (indicatorWeight[b.relevanceIndicator] || 0) - (indicatorWeight[a.relevanceIndicator] || 0);
  });
}

/**
 * Formats the exact 4-part markdown response required by the user prompt:
 * 1. Top Recommended Schemes (Ranked)
 * 2. Match Breakdown & Explanation
 * 3. Missing or Unverified Information
 * 4. Application Checklist & Action Plan
 * + Mandatory Disclaimer
 */
export function generateMarkdownReport(
  profile: UserProfile,
  results: SchemeMatchResult[]
): string {
  const topEligible = results.filter((r) => r.relevanceIndicator === 'High' || r.relevanceIndicator === 'Moderate');
  const displaySchemes = topEligible.length > 0 ? topEligible.slice(0, 5) : results.slice(0, 3);

  let md = '';

  // Section 1: Top Recommended Schemes (Ranked)
  md += `### 1. Top Recommended Schemes (Ranked)\n\n`;
  if (displaySchemes.length === 0) {
    md += `*No direct matching schemes found for the provided profile. Consider adjusting income ceiling, residency, or checking open central schemes.*\n\n`;
  } else {
    displaySchemes.forEach((res, idx) => {
      md += `${idx + 1}. **${res.scheme.name}** (${res.scheme.level})\n`;
      md += `   * **Match Indicator**: **${res.relevanceIndicator} Match (${res.matchScore}% Score)**\n`;
      md += `   * **Overview**: ${res.scheme.briefOverview}\n`;
      md += `   * **Financial Benefit**: ${res.scheme.financialBenefit}\n`;
      md += `   * **Department & Portal**: ${res.scheme.department} | [${res.scheme.portalName}](${res.scheme.officialSourceLink})\n\n`;
    });
  }

  // Section 2: Match Breakdown & Explanation
  md += `### 2. Match Breakdown & Explanation\n\n`;
  displaySchemes.forEach((res) => {
    md += `#### ${res.scheme.name}\n`;
    md += `* **Matching Attributes**:\n`;
    if (res.matchingAttributes.length > 0) {
      res.matchingAttributes.forEach((attr) => {
        md += `  * ${attr}\n`;
      });
    } else {
      md += `  * Profile generally falls within program target group.\n`;
    }
    md += `* **Why it fits**:\n`;
    md += `  ${res.whyItFits}\n\n`;
  });

  // Section 3: Missing or Unverified Information
  md += `### 3. Missing or Unverified Information\n\n`;
  const aggregatedGaps = new Set<string>();
  displaySchemes.forEach((res) => {
    res.missingOrUnverified.forEach((gap) => aggregatedGaps.add(gap));
  });

  if (profile.annualIncome === null) {
    aggregatedGaps.add(
      'Annual Income Certificate details not provided; please verify if family income is below ₹2.5 - ₹3.0 lakhs to prevent application rejection.'
    );
  }
  if (!profile.rationCardType || profile.rationCardType === 'Unverified') {
    aggregatedGaps.add(
      'Ration Card status (BPL / Antyodaya / APL) not specified; critical for Gruha Lakshmi, Anna Bhagya, and Ayushman Bharat.'
    );
  }
  if (!profile.locationState) {
    aggregatedGaps.add('State domicile unconfirmed; Karnataka residency required for Seva Sindhu welfare schemes.');
  }

  if (aggregatedGaps.size > 0) {
    Array.from(aggregatedGaps).forEach((gap) => {
      md += `* ⚠️ **Attention Required**: ${gap}\n`;
    });
    md += `\n*Action*: Please update or confirm these fields in your profile or keep certified revenue documents ready before submitting formal applications.\n\n`;
  } else {
    md += `* ✅ **Profile Complete**: All core demographic, income, and category fields are verified for the recommended schemes.\n\n`;
  }

  // Section 4: Application Checklist & Action Plan
  md += `### 4. Application Checklist & Action Plan\n\n`;
  const allDocs = new Set<string>();
  displaySchemes.forEach((res) => {
    res.scheme.requiredDocuments.forEach((doc) => allDocs.add(doc));
  });

  md += `#### Required Documents\n`;
  if (allDocs.size > 0) {
    Array.from(allDocs)
      .slice(0, 8)
      .forEach((doc) => {
        md += `* [ ] ${doc}\n`;
      });
    md += `* [ ] Aadhaar-seeded Bank Account (verify NPCI DBT mapper active at your branch or post office)\n\n`;
  } else {
    md += `* [ ] Aadhaar Card\n* [ ] Bank Account Passbook\n* [ ] Income / Caste Certificate (if applicable)\n\n`;
  }

  md += `#### Step-by-Step Application Roadmap\n`;
  md += `1. **Document Readiness & e-KYC**: Ensure your Aadhaar is linked to your active mobile number and your primary bank account is mapped on the NPCI DBT gateway.\n`;
  md += `2. **Certificate Generation (Nadakacheri / Atalji Janasnehi)**: Obtain current RD numbers for Caste and Income certificates if required for scholarship or reservation.\n`;
  md += `3. **Portal Registration**: Register on the designated official portals indicated below:\n`;
  displaySchemes.forEach((res) => {
    md += `   * **${res.scheme.name}**: Apply at [${res.scheme.portalName}](${res.scheme.officialSourceLink})\n`;
  });
  md += `4. **Assistance Centers**: In Karnataka, you can also visit your nearest **Grama One**, **Karnataka One**, or **Bangalore One** citizen service center for biometric authentication and assisted filing.\n`;
  md += `5. **Track Acknowledgement**: Save the acknowledgment slip and track application status through SMS or portal reference.\n\n`;

  // Mandatory Disclaimer
  md += `${MANDATORY_DISCLAIMER}\n`;

  return md;
}
