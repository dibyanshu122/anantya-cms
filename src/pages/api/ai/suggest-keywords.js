import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { focusKeyword, content } = req.body;

  if (!focusKeyword) {
    return res.status(400).json({ message: 'Focus keyword is required' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `You are an expert SEO specialist. Generate a list of 5-10 highly relevant LSI (Latent Semantic Indexing) keywords or long-tail keywords for the target focus keyword: "${focusKeyword}".
    ${content ? `IMPORTANT: Analyze the following content and suggest LSI keywords that are specifically relevant to what is written in this content.\n\nContent:\n${content.substring(0, 3000)}\n\n` : ''}
    Output ONLY a raw JSON array of strings. Do not include markdown formatting or backticks.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    const text = response.text;
    
    let jsonStr = text.trim();
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.substring(7);
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.substring(3);
    if (jsonStr.endsWith('```')) jsonStr = jsonStr.substring(0, jsonStr.length - 3);
    
    const data = JSON.parse(jsonStr.trim());
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('AI Error:', error);
    return res.status(500).json({ message: 'Failed to generate keywords' });
  }
}
