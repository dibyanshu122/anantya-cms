import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { prompt, currentContent, type = 'generate' } = req.body;

  if (!prompt && type === 'generate') {
    return res.status(400).json({ message: 'Prompt is required' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    let systemInstruction = "";
    if (type === 'generate') {
      systemInstruction = `You are an expert SEO content writer. Write a high-quality, engaging, and informative blog section based on the user's prompt. 
      Format the output in HTML (using <p>, <h2>, <ul>, etc.). Do NOT wrap the entire response in a markdown code block, just return the raw HTML.`;
    } else if (type === 'improve') {
      systemInstruction = `You are an expert editor. Improve the following HTML content to make it more engaging, readable, and SEO-friendly.
      Format the output in HTML. Do NOT wrap the entire response in a markdown code block.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: type === 'generate' ? prompt : `Improve this content:\n\n${currentContent}`,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const generatedHtml = response.text().replace(/^```html\s*|```$/g, '').trim();

    return res.status(200).json({ content: generatedHtml });
  } catch (error) {
    console.error('AI Content Generation Error:', error);
    return res.status(500).json({ message: 'Failed to generate content', error: error.message });
  }
}
