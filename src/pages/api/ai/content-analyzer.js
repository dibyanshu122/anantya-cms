import { GoogleGenAI } from '@google/genai';
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { content, keyword, pageUrl } = req.body;

  if (!content) {
    return res.status(400).json({ message: 'Content is required for analysis' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Fetch all existing blogs to find internal linking opportunities
    const { data: allBlogs } = await supabase.from('blogs').select('title, slug');
    const blogListString = allBlogs?.map(b => `- ${b.title} (/blog/${b.slug})`).join('\n') || '';
    
    const prompt = `
    You are an expert SEO auditor. Analyze the following blog content targeting the focus keyword: "${keyword}".
    
    1. Content Gap Analysis: Identify 2-3 missing subtopics or questions that competitors usually answer for this keyword, but this content is missing.
    2. Internal Link Suggestions: Based on the content provided, suggest 1-2 internal links from this list of our existing blogs:
    ${blogListString}
    (Exclude the current page if its URL is in the list).

    Respond in strict JSON format:
    {
      "gaps": ["gap 1", "gap 2"],
      "linkSuggestions": [
        { "textToAnchor": "words in content", "url": "/blog/suggested-slug", "reason": "Why link here" }
      ]
    }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
      }
    });

    let resultText = response.text().replace(/^```json\s*|```$/g, '').trim();
    const resultJson = JSON.parse(resultText);

    return res.status(200).json(resultJson);
  } catch (error) {
    console.error('Content Analyzer Error:', error);
    return res.status(500).json({ message: 'Failed to analyze content', error: error.message });
  }
}
