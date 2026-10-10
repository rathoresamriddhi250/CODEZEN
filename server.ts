import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHRAMIK_SYSTEM_INSTRUCTION = `You are "Shramik Sahayak" (श्रमिक सहायक), the official helpful assistant for the Shramik (श्रमिक) web application.
Motto: "हर हुनर की पहचान, हर मेहनत का सम्मान।" — "Real Skills. Trusted Work." (Skill · Work · Trust / कौशल · काम · भरोसा).

About Shramik & Our Work:
1. Why Shramik Exists: Painters, carpenters, tailors, electricians, plumbers, masons, and other skilled workers have years of skill, and Shramik gives them a verified digital identity (unique Instagram-style @handle IDs like @ramesh.painter_01, Government ID verification via Aadhaar/e-Shram/PAN, work completion photo proof, and 5-star customer ratings).
2. Location & Slot Booking: Connects workers and customers within 6 km. Supports booking 6 daily time slots (8-10 AM, 10 AM-12 PM, 12-2 PM, 2-4 PM, 4-6 PM, 6-8 PM) across Today + the Next 10 Days.
3. Work Completion Photo Rule: When work is completed, it is MANDATORY for the Worker to upload a photo of the finished work as proof. The Customer can also optionally upload a work photo.
4. 5-Star Rating & Review System: Customers rate workers from 1 to 5 stars across:
   - Work Finished (काम पूरा हुआ)
   - Satisfied by Work (काम से संतुष्टि)
   - Women Safety (महिला सुरक्षा)
   - Safety (सुरक्षा मानक)
   - Behaviour (व्यवहार)
   - Others (अन्य)
   If a rating is <= 3 stars, the app asks what went wrong (Talking rudely, Asking extra money, Came late, Others).
   If a rating is > 3 stars (4 or 5 stars), the app asks what they liked most (Work, App, Security, Service).

Always reply warmly, concisely (2-4 short sentences or bullet points), and in the language the user used (Hindi or English).`;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  app.post('/api/chat', async (req, res) => {
    try {
      const { message, lang } = req.body as { message?: string; lang?: string };
      if (!message || !message.trim()) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(503).json({ fallback: true });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `User preferred language: ${lang === 'hi' ? 'Hindi' : 'English'}\nUser question: ${message}`,
        config: {
          systemInstruction: SHRAMIK_SYSTEM_INSTRUCTION,
        },
      });

      res.json({ reply: response.text || '' });
    } catch (err) {
      res.status(503).json({ fallback: true, error: String(err) });
    }
  });

  // Conversational Voice Assistant endpoint (returns spoken-friendly plain text without symbols)
  app.post('/api/voice-assistant', async (req, res) => {
    try {
      const { message, lang, contextSummary } = req.body as {
        message?: string;
        lang?: string;
        contextSummary?: string;
      };
      if (!message || !message.trim()) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(503).json({ fallback: true });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const voiceSystemInstruction = `${SHRAMIK_SYSTEM_INSTRUCTION}
IMPORTANT FOR VOICE OUTPUT:
- You are speaking directly out loud to the user like a warm, respectful human voice assistant.
- Do NOT use markdown (*, #, -, bullets), brackets, slashes, or English technical symbols.
- Keep your spoken answer very clear, natural, conversational, and 1 to 3 sentences long.
- If the user is speaking Hindi or Hinglish, reply in simple, warm, everyday spoken Hindi (or English if lang is 'en').
- End with a short helpful follow-up question so it feels like a real conversation.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Language: ${lang === 'hi' ? 'Hindi (hi-IN)' : 'English (en-IN)'}\nApp Context: ${contextSummary || 'Customer browsing nearby skilled workers'}\nUser said: "${message}"`,
        config: {
          systemInstruction: voiceSystemInstruction,
        },
      });

      res.json({ reply: response.text || '' });
    } catch (err) {
      res.status(503).json({ fallback: true, error: String(err) });
    }
  });

  // Direct Microphone Audio Understanding endpoint (listens to user's actual voice audio and replies)
  app.post('/api/voice-audio', async (req, res) => {
    try {
      const { audioBase64, mimeType, lang, mode } = req.body as {
        audioBase64?: string;
        mimeType?: string;
        lang?: string;
        mode?: 'search' | 'assistant';
      };
      if (!audioBase64) {
        res.status(400).json({ error: 'Audio data is required' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(503).json({ fallback: true });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Normalize MIME type (strip ';codecs=opus' etc. so Gemini accepts it cleanly)
      const cleanMimeType = (mimeType || 'audio/webm').split(';')[0].trim() || 'audio/webm';

      // Step 1: Transcribe the user's spoken audio using gemini-3.5-transcribe
      const transcribeRes = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: cleanMimeType,
                data: audioBase64,
              },
            },
            {
              text:
                lang === 'hi'
                  ? 'Transcribe this spoken audio accurately. If spoken in Hindi or Hinglish, transcribe in Hindi (Devanagari) or English words as spoken. Return ONLY the exact spoken words without quotes or explanation. If there is only silence or background noise, return an empty string.'
                  : 'Transcribe this spoken audio accurately. Return ONLY the exact spoken words without quotes or explanation. If there is only silence or background noise, return an empty string.',
            },
          ],
        },
      });

      const transcript = (transcribeRes.text || '')
        .replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
        .trim();

      if (!transcript) {
        res.json({ transcript: '', reply: '' });
        return;
      }

      // If called from "Speak to Search", return the transcript immediately for instant search!
      if (mode === 'search') {
        res.json({ transcript, reply: '' });
        return;
      }

      // Step 2: Generate a warm spoken reply for the voice assistant
      const voiceSystemInstruction = `${SHRAMIK_SYSTEM_INSTRUCTION}
IMPORTANT FOR VOICE OUTPUT:
- You are speaking directly out loud to the user like a warm, respectful human voice assistant.
- Do NOT use markdown (*, #, -, bullets), brackets, slashes, or English technical symbols.
- Keep your spoken answer very clear, natural, conversational, and 1 to 3 sentences long.
- Reply in ${lang === 'hi' ? 'simple everyday Hindi' : 'clear Indian English'}.`;

      const replyRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `User said: "${transcript}"`,
        config: {
          systemInstruction: voiceSystemInstruction,
        },
      });

      res.json({
        transcript,
        reply: (replyRes.text || '').trim(),
      });
    } catch (err) {
      res.status(503).json({ fallback: true, error: String(err) });
    }
  });

  // High-Clarity Gemini Text-to-Speech endpoint (gemini-3.8-flash-lite-tts -> WAV audio)
  app.post('/api/tts', async (req, res) => {
    try {
      const { text, lang, slow } = req.body as {
        text?: string;
        lang?: string;
        slow?: boolean;
      };
      if (!text || !text.trim()) {
        res.status(400).json({ error: 'Text is required' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(503).json({ fallback: true });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const stylePrompt =
        lang === 'hi'
          ? slow
            ? 'Warm, very clear, slow and articulate Indian Hindi voice assistant speaking naturally and politely'
            : 'Warm, crystal-clear, friendly Indian Hindi voice assistant speaking naturally and conversationally'
          : slow
            ? 'Warm, very clear, slow and articulate Indian English voice assistant speaking naturally'
            : 'Warm, crystal-clear, friendly Indian English voice assistant speaking naturally';

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: text.trim(),
                // @ts-ignore - speechMetadata supported by gemini-3.8-flash-lite-tts
                speechMetadata: {
                  style: stylePrompt,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Kore',
              },
            },
          },
        },
      });

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        res.status(503).json({ fallback: true });
        return;
      }

      res.json({ audioBase64: base64Audio, mimeType: 'audio/wav' });
    } catch (err) {
      res.status(503).json({ fallback: true, error: String(err) });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Shramik server running on http://0.0.0.0:${port}`);
  });
}

startServer();
