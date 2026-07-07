import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const EXTRACTION_PROMPT = `You are helping fill out a restaurant journal entry from a spoken review. Extract information and return ONLY a valid JSON object with these exact fields:

{
  "name": "restaurant or place name (string, empty if not mentioned)",
  "address": "full street address including street number, city, and postal code if you know it. If the person mentions the restaurant name and city/neighbourhood, use your knowledge to recall the full address. If you are not confident in the exact address, use whatever location detail was mentioned (e.g. the street or neighbourhood). Never guess a street number you are not sure about — leave it out rather than invent one.",
  "category": "one of: restaurant, coffee, bakery, bar, dessert, brunch, other",
  "rating": 0 to 5 integer (0 if not mentioned, infer from context like 'amazing' = 5, 'good' = 4, 'ok' = 3),
  "priceRange": 1 to 4 integer (1=$, 2=$$, 3=$$$, 4=$$$$, default 2 if not mentioned),
  "notes": "summary of the experience in their own words (string)",
  "occasion": "occasion if mentioned like 'date night', 'birthday', etc. (empty string if not mentioned)",
  "menuItems": [{"name": "dish name", "rating": 0 to 10 number with up to 3 decimal places (e.g. 9.337), or omit if not mentioned}]
}

For category: infer from context if not stated (e.g. 'coffee shop' → coffee, 'brunch spot' → brunch, 'bar' → bar).
For ratings: if they say 'I'd give it a X out of 10' for a dish, use that number. If they say 'X out of 5' for overall, use it directly. 'Amazing', 'loved it' → high rating. 'Disappointing' → low.
Return ONLY the JSON with no markdown, no explanation.`;

async function transcribeAudio(audioBlob: Blob): Promise<string> {
  // Audio is held in memory only for the duration of this function call.
  // It is never written to disk, logged, or stored anywhere.
  const arrayBuffer = await audioBlob.arrayBuffer();

  const file = new File([arrayBuffer], 'audio.webm', { type: audioBlob.type || 'audio/webm' });

  const transcription = await groq.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3',
    response_format: 'text',
  });

  return typeof transcription === 'string' ? transcription : (transcription as any).text ?? '';
}


async function extractPlaceData(transcript: string) {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `${EXTRACTION_PROMPT}\n\nReview transcript:\n"${transcript}"`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '{}';
  // Strip markdown code fences if Claude wraps the JSON
  const cleaned = text.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
  return JSON.parse(cleaned);
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') ?? '';

    let transcript = '';

    if (contentType.includes('multipart/form-data')) {
      // Audio blob from voice or video mode
      const form = await req.formData();
      const audio = form.get('audio') as Blob | null;
      const existingTranscript = form.get('transcript') as string | null;

      if (existingTranscript?.trim()) {
        transcript = existingTranscript;
      } else if (audio) {
        transcript = await transcribeAudio(audio);
      }
    } else {
      // Plain JSON with transcript text
      const body = await req.json();
      transcript = body.transcript ?? '';
    }

    if (!transcript.trim()) {
      return NextResponse.json({ error: 'No transcript to process' }, { status: 400 });
    }

    const placeData = await extractPlaceData(transcript);
    return NextResponse.json({ ...placeData, transcript });
  } catch (err: any) {
    console.error('AI entry error:', err);
    return NextResponse.json({ error: err.message ?? 'AI processing failed' }, { status: 500 });
  }
}
