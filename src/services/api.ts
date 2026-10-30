import { UserProfile } from '../types/scheme';
import {
  extractProfileFromTextIntelligent,
  ExtractionResult,
} from '../utils/profileExtractor';

export async function extractProfileFromText(
  text: string
): Promise<ExtractionResult & { source: string }> {
  try {
    const res = await fetch('/api/extract-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.profile && Object.keys(data.profile).length > 0) {
        const local = extractProfileFromTextIntelligent(text);
        const mergedProfile = { ...local.profile, ...data.profile };
        // Generate complete badges for all merged attributes
        const reExtracted = extractProfileFromTextIntelligent(JSON.stringify(mergedProfile));
        return {
          profile: mergedProfile,
          badges: reExtracted.badges.length > 0 ? reExtracted.badges : local.badges,
          summary: data.profile.summary || local.summary,
          source: data.source || 'server',
        };
      }
    }
  } catch (err) {
    console.warn('API call to /api/extract-profile failed, using intelligent local extraction fallback', err);
  }

  // Pure client fallback in case network error occurs
  const local = extractProfileFromTextIntelligent(text);
  return {
    ...local,
    source: 'client-fallback',
  };
}

export async function askCopilot(message: string, profile: UserProfile, activeSchemeId?: string): Promise<string> {
  try {
    const res = await fetch('/api/copilot-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, profile, activeSchemeId }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.reply;
    }
  } catch (err) {
    console.warn('API call to /api/copilot-chat failed, using client fallback', err);
  }

  return `Based on standard official guidelines:
1. Ensure your Aadhaar is linked with your active phone number.
2. For direct cash benefits (DBT), ensure your bank account is seeded with NPCI mapper.
3. For Karnataka state welfare programs, keep your Ration Card and Nadakacheri RD numbers ready.

*Disclaimer: This assistant provides likely matches and guidance based on your profile. It does not guarantee benefit approval. You must verify current eligibility conditions, required documents, deadlines, and application procedures with the relevant official government authority before applying.*`;
}
