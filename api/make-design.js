import { GoogleGenAI } from '@google/genai';
import { deductToken } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileData, mimeType, model, email, customApiKey } = req.body;
    
    if (!email) {
      return res.status(401).json({ error: 'Unauthorized: Harap login terlebih dahulu.' });
    }
    
    if (!fileData || !mimeType) {
      return res.status(400).json({ error: 'Please provide a UI reference image.' });
    }

    if (!customApiKey) {
        // Cek dan kurangi token
        await deductToken(email);
    }

    const envApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY;
    const finalApiKey = customApiKey || envApiKey;
    let selectedModel = 'gemini-1.5-flash';
    if (model === 'Gemini 1.5 Pro') selectedModel = 'gemini-1.5-pro';
    else if (model) selectedModel = model;

    const promptText = `
Anda adalah seorang UI/UX Designer ahli dan Frontend Engineer. 
Tugas Anda adalah menganalisis gambar UI yang diberikan dan menghasilkan panduan desain dalam format Markdown (design.md) yang component-driven.

Struktur design.md harus meliputi:
1. Global Theme (Warna Primer, Sekunder, Background, Teks)
2. Tipografi (Font, Ukuran, Ketebalan)
3. Komponen Utama (Navigasi, Tombol, Kartu, Input, dll) beserta detail tampilannya (padding, border radius, bayangan).
4. Layout Structure (Grid, Flexbox, Spacing)

Gunakan bahasa Indonesia. Pastikan hasil analisis sangat detail dan akurat sesuai dengan gambar yang diberikan, karena ini akan digunakan sebagai aturan mutlak untuk membangun UI.
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${finalApiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inlineData: { data: fileData, mimeType: mimeType } },
              { text: promptText }
            ]
          }
        ]
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
    console.error('Error generating design.md:', error);
    return res.status(500).json({ error: 'Failed to generate design.md', details: error.message });
  }
}
