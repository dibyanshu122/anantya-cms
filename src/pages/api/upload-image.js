import formidable from 'formidable';
import sharp from 'sharp';
import { supabase } from '../../lib/supabase';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Form parsing failed' });
    }

    const file = files.file?.[0] || files.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      // Convert to WebP and Compress
      const buffer = await sharp(file.filepath)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
      const filePath = `blog-images/${fileName}`;

      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, buffer, {
          contentType: 'image/webp',
          upsert: false
        });

      if (error) throw error;

      const { data: publicData } = supabase.storage.from('images').getPublicUrl(filePath);

      res.status(200).json({ url: publicData.publicUrl });
    } catch (processError) {
      console.error(processError);
      res.status(500).json({ error: 'Image processing failed: ' + processError.message });
    }
  });
}
