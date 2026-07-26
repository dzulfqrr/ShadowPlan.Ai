import { GoogleGenAI } from '@google/genai';
import { deductToken } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { notes, fileData, mimeType, model, email, customApiKey } = req.body;
    
    if (!email) {
      return res.status(401).json({ error: 'Unauthorized: Harap login terlebih dahulu.' });
    }
    
    if (!notes && !fileData) {
      return res.status(400).json({ error: 'Please provide notes or a reference file.' });
    }

    // Cek dan kurangi token pengguna (bisa dinonaktifkan jika ada customApiKey jika diinginkan)
    if (!customApiKey) {
        await deductToken(email);
    }

    // Initialize Gemini SDK
    const envApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY;
    const finalApiKey = customApiKey || envApiKey;
    const ai = finalApiKey ? new GoogleGenAI({ apiKey: finalApiKey }) : new GoogleGenAI();
    
    let selectedModel = 'gemini-1.5-flash';
    if (model === 'Gemini 1.5 Pro') selectedModel = 'gemini-1.5-pro';
    else if (model && model !== 'Gemini 1.5 Flash' && model !== 'Gemini 3.5 Flash') selectedModel = model;

    const promptText = `
Anda adalah seorang Product Manager ahli. 
Tugas Anda adalah membuat Product Requirements Document (PRD) yang terstruktur dan profesional dalam format Markdown berdasarkan informasi berikut:

Catatan Proyek:
${notes || 'Tidak ada catatan tambahan.'}

Instruksi Format PRD:
1. Executive Summary
2. Target Audience
3. Core Features
4. Non-Functional Requirements
5. User Flow

Gunakan bahasa Indonesia yang profesional. Jika ada gambar/dokumen referensi yang dilampirkan, analisis dengan saksama.
`;

    const contents = [];
    
    if (fileData && mimeType) {
      // Add the file to the prompt
      // Vercel limits payload size, but for standard images it's usually fine
      contents.push({
        inlineData: {
          data: fileData,
          mimeType: mimeType
        }
      });
    }
    
    contents.push(promptText);

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: contents,
    });

    return res.status(200).json({ text: response.text });
  } catch (error) {
    console.error('Error generating PRD:', error);
    return res.status(500).json({ error: 'Failed to generate PRD', details: error.message });
  }
}
