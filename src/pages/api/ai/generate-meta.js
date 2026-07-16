import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { content, focusKeyword } = req.body;

  if (!content) {
    return res.status(400).json({ message: 'Content is required' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `You are an expert SEO specialist. Generate an SEO Meta Title and Meta Description for the following content.
    CRITICAL CONSTRAINTS:
    1. TITLE LENGTH: Must be STRICTLY between 50 and 60 characters long.
    2. DESCRIPTION LENGTH: Must be STRICTLY between 150 and 160 characters long.
    ${focusKeyword ? `3. KEYWORD: You MUST include the exact focus keyword "${focusKeyword}" in BOTH the title and the description.` : ''}
    
    Output ONLY a raw JSON object with keys "title" and "description". Do not include markdown formatting or backticks.
    
    Content:
    ${content.substring(0, 3000)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    const text = response.text;
    
    // Parse the JSON safely in case the model returns backticks
    let jsonStr = text.trim();
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.substring(7);
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.substring(3);
    if (jsonStr.endsWith('```')) jsonStr = jsonStr.substring(0, jsonStr.length - 3);
    
    const data = JSON.parse(jsonStr.trim());
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('AI Error:', error);
    return res.status(500).json({ message: 'Failed to generate meta data' });
  }
}
