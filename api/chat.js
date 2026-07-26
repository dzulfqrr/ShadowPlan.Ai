import { GoogleGenAI } from '@google/genai';
import { deductToken } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, model, email, customApiKey } = req.body;
    
    if (!email) {
      return res.status(401).json({ error: 'Unauthorized: Harap login terlebih dahulu.' });
    }
    
    if (!message) {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
    }

    if (!customApiKey) {
        // Cek dan kurangi token pengguna
        await deductToken(email);
    }

    const envApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY;
    const finalApiKey = customApiKey || envApiKey;
    let selectedModel = 'gemini-1.5-flash';
    if (model === 'Gemini 1.5 Pro') selectedModel = 'gemini-1.5-pro';
    
    const promptText = `
Anda adalah ShadowPlan AI, asisten AI canggih yang dibuat oleh Blackone.ai Group.
Jawab pertanyaan atau instruksi pengguna berikut ini dengan informatif, ramah, dan profesional menggunakan bahasa Indonesia.

Pesan Pengguna:
${message}
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${finalApiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: promptText }]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error:', data);
      throw new Error(data.error?.message || 'Gagal menghasilkan response dari AI.');
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return res.status(200).json({ text: replyText });
  } catch (error) {
    console.error('Error generating chat:', error);
    return res.status(500).json({ error: 'Failed to generate chat response', details: error.message });
  }
}
