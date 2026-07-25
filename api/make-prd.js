import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { notes, fileData, mimeType, model } = req.body;
    
    if (!notes && !fileData) {
      return res.status(400).json({ error: 'Please provide notes or a reference file.' });
    }

    // Initialize Gemini SDK (it automatically picks up GEMINI_API_KEY from environment)
    const ai = new GoogleGenAI({});
    
    const selectedModel = model === 'Gemini 3.1 Pro' ? 'gemini-3.1-pro' : 'gemini-3.5-flash';

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
