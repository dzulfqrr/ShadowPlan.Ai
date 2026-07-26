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
    const ai = finalApiKey ? new GoogleGenAI({ apiKey: finalApiKey }) : new GoogleGenAI();
    
    let selectedModel = 'gemini-1.5-flash';
    if (model === 'Gemini 1.5 Pro') selectedModel = 'gemini-1.5-pro';
    else if (model && model !== 'Gemini 1.5 Flash' && model !== 'Gemini 3.5 Flash') selectedModel = model;

    const promptText = `
Anda adalah ShadowPlan AI, asisten AI canggih yang dibuat oleh Blackone.ai Group.
Jawab pertanyaan atau instruksi pengguna berikut ini dengan informatif, ramah, dan profesional menggunakan bahasa Indonesia.

Pesan Pengguna:
${message}
`;

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: promptText,
    });

    return res.status(200).json({ text: response.text });
  } catch (error) {
    console.error('Error generating chat:', error);
    return res.status(500).json({ error: 'Failed to generate chat response', details: error.message });
  }
}
