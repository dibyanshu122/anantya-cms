import { IncomingForm } from 'formidable';
import sharp from 'sharp';
import fs from 'fs';
import { supabaseAdmin } from '../../lib/supabase';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = new IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(500).json({ error: 'Failed to upload image' });
    }

    const fileArray = files.file;
    if (!fileArray || fileArray.length === 0) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const file = fileArray[0];
    try {
      // Read the uploaded file
      const buffer = fs.readFileSync(file.filepath);

      // Analyze and Process with Sharp (WebP Conversion + Compression)
      const image = sharp(buffer);
      const metadata = await image.metadata();

      let pipeline = image;

      // Resize if too large
      if (metadata.width > 2500) {
        pipeline = pipeline.resize(2500);
      }

      // Convert to WebP and compress
      const optimizedBuffer = await pipeline
        .webp({ quality: 80 })
        .toBuffer();

      // Upload to Supabase Storage
      const customName = fields.customName ? fields.customName[0] : null;
      const sanitizedCustom = customName ? customName.replace(/[^a-z0-9]/gi, '-').toLowerCase() : '';
      const baseName = sanitizedCustom || file.originalFilename.split('.')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const fileName = `${Date.now()}-${baseName}.webp`;
      
      const { data, error } = await supabaseAdmin.storage
        .from('images')
        .upload(`blog-images/${fileName}`, optimizedBuffer, {
          contentType: 'image/webp',
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return res.status(500).json({ error: error.message });
      }

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('images')
        .getPublicUrl(`blog-images/${fileName}`);

      return res.status(200).json({ 
        url: publicUrl,
        name: fileName,
        size: Math.round(optimizedBuffer.length / 1024) + ' KB'
      });
      
    } catch (processError) {
      console.error('Image processing error:', processError);
      return res.status(500).json({ error: 'Failed to process image' });
    }
  });
}
