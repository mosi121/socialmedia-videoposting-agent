export interface PlatformContent {
  title: string;
  hook?: string;
  description: string;
  hashtags: string[];
  tips?: string[];
}

export interface GeneratedSocialPack {
  summary: string;
  youtube: PlatformContent & { isShort: boolean };
  instagram: PlatformContent & { callToAction: string };
  facebook: PlatformContent & { discussionQuestion: string };
  tiktok: PlatformContent & { soundSuggestion: string };
}

export async function generateSocialContent(params: {
  topic: string;
  userNotes?: string;
  tone?: string;
  isShortForm?: boolean;
}): Promise<GeneratedSocialPack> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in .env.local');
  }

  const prompt = `
You are an elite viral social media strategist and copywriting expert for high-growth creators and brands.
Analyze the following video topic and context, then generate tailored, high-converting metadata packages for:
1. YouTube (Shorts & Search-Optimized Video)
2. Instagram (Reels & Feed)
3. Facebook (Pages & Reels)
4. TikTok (Viral Hook-driven)

VIDEO CONTEXT:
Topic/Title: "${params.topic}"
Creator Notes/Context: "${params.userNotes || 'None provided'}"
Desired Tone: "${params.tone || 'High-energy, engaging, authoritative, viral'}"
Format: ${params.isShortForm !== false ? 'Vertical Short-form (9:16 Shorts/Reels/TikTok)' : 'Horizontal Standard Video (16:9)'}

INSTRUCTIONS FOR EACH PLATFORM:
- YouTube: High CTR title (<70 chars), detailed description with hook in first 2 lines, timestamp placeholders, and 8-12 search tags.
- Instagram: Aesthetic caption with line breaks, strong opening hook line, clear Call-To-Action (save/share/comment), and 5-10 targeted hashtags.
- Facebook: Conversational storytelling angle, relational tone, asking a specific discussion question to trigger comment section debates.
- TikTok: Punchy 3-second visual/audio hook, brief witty caption (<150 chars), 4-6 high-velocity hashtags (e.g. #fyp, niche tags), and a suggested trending audio/vibe.

CRITICAL: Return ONLY a raw valid JSON object (no markdown code blocks, no backticks, no explanatory text) matching this schema:
{
  "summary": "1-sentence executive overview of the video angle",
  "youtube": {
    "title": "string",
    "hook": "string",
    "description": "string",
    "hashtags": ["#tag1", "#tag2"],
    "isShort": ${params.isShortForm !== false}
  },
  "instagram": {
    "title": "string",
    "hook": "string",
    "description": "string",
    "hashtags": ["#tag1", "#tag2"],
    "callToAction": "string"
  },
  "facebook": {
    "title": "string",
    "hook": "string",
    "description": "string",
    "hashtags": ["#tag1", "#tag2"],
    "discussionQuestion": "string"
  },
  "tiktok": {
    "title": "string",
    "hook": "string",
    "description": "string",
    "hashtags": ["#tag1", "#tag2"],
    "soundSuggestion": "string"
  }
}
`;

  // We use gemini-3.5-flash-lite which is verified working with our key
  const model = 'gemini-3.5-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Gemini API returned an empty response');
  }

  try {
    const cleanedText = rawText.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
    return JSON.parse(cleanedText) as GeneratedSocialPack;
  } catch (err: any) {
    throw new Error(`Failed to parse Gemini JSON output: ${err.message}. Raw: ${rawText}`);
  }
}
