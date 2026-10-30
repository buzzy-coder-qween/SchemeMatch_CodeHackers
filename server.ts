import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { SCHEMES_DATABASE } from './src/data/schemes.ts';
import { UserProfile } from './src/types/scheme.ts';
import { extractProfileFromTextIntelligent } from './src/utils/profileExtractor.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  try {
    aiClient = new GoogleGenAI();
  } catch (err) {
    console.warn('Could not initialize GoogleGenAI client:', err);
  }
}

// Health endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

// Get all schemes
app.get('/api/schemes', (_req: Request, res: Response) => {
  res.json({ schemes: SCHEMES_DATABASE });
});



// POST /api/extract-profile
app.post('/api/extract-profile', async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'Text query is required' });
    return;
  }

  // If Gemini API is available, use it for intelligent semantic extraction
  if (aiClient) {
    try {
      const prompt = `You are the profile extraction engine for the Indian & Karnataka Government Scheme Discovery Assistant.
Extract user demographic, economic, and occupational attributes from this citizen text:
"${text}"

Return a STRICT JSON object with these keys only (omit or set null if not mentioned):
{
  "age": number or null,
  "locationState": "Karnataka" | "Central / All-India" | other string or null,
  "district": string or null,
  "annualIncome": number in INR (e.g. 1.5 lakh = 150000) or null,
  "occupation": "Student" | "Farmer" | "Entrepreneur" | "Job Seeker" | "Artisan" | "Unorganized Worker" | "Senior Citizen" | "Homemaker" | "Salaried Employee" | "Other" or null,
  "educationLevel": "Below 10th" | "10th Pass" | "12th Pass" | "ITI / Diploma" | "Undergraduate" | "Postgraduate" | "Doctorate" | null,
  "gender": "Female" | "Male" | "Transgender" | "Other" or null,
  "socialCategory": "General" | "OBC" | "SC" | "ST" | "EWS" | "Minority" or null,
  "isKarnatakaResident": boolean,
  "rationCardType": "BPL" | "AAY (Antyodaya)" | "APL" | "None" | "Unverified",
  "isLandholder": boolean,
  "landHoldingAcres": number or null,
  "isDifferentlyAbled": boolean,
  "isHeadOfFamily": boolean or null,
  "isUnemployed": boolean or null,
  "summary": "Brief 1-2 sentence citizen profile summary"
}`;

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout')), 2500)
      );

      const geminiPromise = aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const response = await Promise.race([geminiPromise, timeoutPromise]);

      const responseText = response.text?.trim() || '{}';
      const parsed = JSON.parse(responseText);
      res.json({ source: 'gemini', profile: parsed });
      return;
    } catch (err) {
      console.warn('Gemini extraction failed, falling back to local extractor:', err);
    }
  }

  // Deterministic fallback
  const fallback = extractProfileFromTextIntelligent(text);
  res.json({
    source: 'rule-based',
    profile: fallback.profile,
    badges: fallback.badges,
    summary: fallback.summary,
  });
});

// POST /api/copilot-chat
app.post('/api/copilot-chat', async (req: Request, res: Response) => {
  const { message, profile, activeSchemeId } = req.body;
  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  const activeScheme = activeSchemeId
    ? SCHEMES_DATABASE.find((s) => s.id === activeSchemeId)
    : null;

  if (aiClient) {
    try {
      const systemInstruction = `You are the expert Assistant for Karnataka & Central Government Schemes (SchemeMatch).
Your tone is empathetic, clear, accurate, and completely grounded in official government frameworks (Seva Sindhu, myScheme, SSP Karnataka, PM-Kisan, etc.).
Avoid bureaucratic jargon; speak directly to the citizen.

Current User Profile: ${JSON.stringify(profile || {})}
${activeScheme ? `Current Scheme Under Consideration: ${activeScheme.name} (${activeScheme.level}) - ${activeScheme.briefOverview}` : ''}

Always ensure you provide realistic, accurate criteria, document guidance, and always remind the user to verify with official portals (e.g. Seva Sindhu or myScheme).
Conclude your response with the mandatory notice:
"Disclaimer: This assistant provides likely matches and guidance based on your profile. It does not guarantee benefit approval. You must verify current eligibility conditions, required documents, deadlines, and application procedures with the relevant official government authority before applying."`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: message,
        config: {
          systemInstruction,
          temperature: 0.3,
        },
      });

      res.json({ reply: response.text });
      return;
    } catch (err) {
      console.warn('Gemini chat failed, using fallback:', err);
    }
  }

  // Graceful rule-based response
  let answer = `Regarding your query about government schemes: `;
  if (activeScheme) {
    answer += `For **${activeScheme.name}**, key requirements are: ${activeScheme.rules.customConditionDescription || 'Must satisfy demographic criteria'}. Required paperwork includes: ${activeScheme.requiredDocuments.slice(0, 3).join(', ')}. `;
    answer += `You can apply directly at the official portal: ${activeScheme.portalName} (${activeScheme.officialSourceLink}). `;
  } else {
    answer += `To ensure eligibility for Karnataka and Central schemes, keep your Aadhaar linked with your active mobile number, complete bank Aadhaar-seeding (NPCI mapper) for DBT, and obtain a current Revenue Department (RD) certificate for Income & Caste from Nadakacheri or Atalji Janasnehi Kendra. `;
  }
  answer += `\n\n*Disclaimer: This assistant provides likely matches and guidance based on your profile. It does not guarantee benefit approval. You must verify current eligibility conditions, required documents, deadlines, and application procedures with the relevant official government authority before applying.*`;

  res.json({ reply: answer });
});

async function startServer() {
  // Parse command line arguments for --port and --host
  const args = process.argv.slice(2);
  let port = 3000;
  let host = '0.0.0.0';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) {
      port = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i].startsWith('--port=')) {
      port = parseInt(args[i].split('=')[1], 10);
    } else if (args[i] === '--host') {
      if (args[i + 1] && !args[i + 1].startsWith('-')) {
        host = args[i + 1];
        i++;
      } else {
        host = '0.0.0.0';
      }
    } else if (args[i].startsWith('--host=')) {
      host = args[i].split('=')[1];
    }
  }

  // Ensure port uses DEFAULT_APP_PORT if present, but never default to PORT 8080 (which is Nginx proxy)
  if (process.env.DEFAULT_APP_PORT && !args.includes('--port')) {
    port = parseInt(process.env.DEFAULT_APP_PORT, 10);
  }

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const listen = (retries = 5) => {
    const serverInstance = app
      .listen(port, host, () => {
        // Output standard Vite banner so control plane detects dev server readiness
        console.log(`\n  VITE v8.3.0  ready in 120 ms\n\n  ➜  Local:   http://localhost:${port}/\n  ➜  Network: http://${host}:${port}/\n`);
      })
      .on('error', (err: any) => {
        if (err.code === 'EADDRINUSE' && retries > 0) {
          console.warn(`Port ${port} in use, retrying in 500ms (${retries} attempts left)...`);
          setTimeout(() => listen(retries - 1), 500);
        } else {
          console.error('Server listen error:', err);
        }
      });
  };

  listen();
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
