import { GoogleGenAI } from '@google/genai';
import { deductToken } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prdText, designText, model, email, customApiKey } = req.body;
    
    if (!email) {
      return res.status(401).json({ error: 'Unauthorized: Harap login terlebih dahulu.' });
    }
    
    if (!prdText || !designText) {
      return res.status(400).json({ error: 'Please provide both PRD and Design notes.' });
    }

    if (!customApiKey) {
        // Cek dan kurangi token
        await deductToken(email);
    }

    const envApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY;
    const finalApiKey = customApiKey || envApiKey;
    const ai = finalApiKey ? new GoogleGenAI({ apiKey: finalApiKey }) : new GoogleGenAI();
    
    let selectedModel = 'gemini-2.0-flash-exp';
    if (model === 'Gemini 1.5 Pro') selectedModel = 'gemini-1.5-pro-latest';
    else if (model === 'Gemini 3.5 Flash') selectedModel = 'gemini-2.0-flash-exp';
    else if (model) selectedModel = model;

    const promptText = `
Anda adalah AI Assistant spesialis pembuat prompt untuk Google Stitch (Generative UI Platform).
Tugas Anda adalah meracik SATU prompt instruksional yang sangat spesifik, padat, dan komprehensif berdasarkan dokumen PRD dan Design berikut.

PRD:
${prdText}

Design:
${designText}

Instruksi:
1. Lakukan cross-reference antara fitur yang dibutuhkan (dari PRD) dan batasan visual (dari Design).
2. Hasilkan satu paragraf panjang atau beberapa bullet points yang terstruktur (maksimal 200-300 kata) yang bisa langsung di-copy-paste ke Google Stitch oleh pengguna.
3. Gunakan bahasa Inggris (karena Google Stitch lebih optimal dengan bahasa Inggris).
4. Fokus pada struktur layout, warna spesifik (hex codes), tipografi, dan perilaku komponen. Jangan sertakan penjelasan apapun selain prompt itu sendiri. Prompt harus langsung dimulai dengan instruksi seperti "Build a..." atau "Create a...".
`;

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: promptText,
    });

    return res.status(200).json({ text: response.text });
  } catch (error) {
    console.error('Error generating prompt:', error);
    return res.status(500).json({ error: 'Failed to generate prompt', details: error.message });
  }
}
