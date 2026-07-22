import { IncomingForm } from 'formidable';
import sharp from 'sharp';
import fs from 'fs';
import { supabaseAdmin } from '../../lib/supabase';

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '100mb', // Increased for videos
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = new IncomingForm({ maxFileSize: 100 * 1024 * 1024 });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(500).json({ error: 'Failed to upload file' });
    }

    const fileArray = files.file;
    if (!fileArray || fileArray.length === 0) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const file = fileArray[0];
    try {
      const buffer = fs.readFileSync(file.filepath);
      
      const isVideo = file.mimetype?.startsWith('video/');
      const isGif = file.mimetype === 'image/gif';
      
      let finalBuffer = buffer;
      let fileExt = file.originalFilename.split('.').pop().toLowerCase();
      let contentType = file.mimetype || 'application/octet-stream';

      if (!isVideo && !isGif && file.mimetype?.startsWith('image/')) {
        // Analyze and Process with Sharp (WebP Conversion + Compression) for images
        fileExt = 'webp';
        contentType = 'image/webp';
        const image = sharp(buffer);
        const metadata = await image.metadata();

        let pipeline = image;

        // Resize if too large
        if (metadata.width && metadata.width > 2500) {
          pipeline = pipeline.resize(2500);
        }

        finalBuffer = await pipeline.webp({ quality: 80 }).toBuffer();
      }

      // Upload to Supabase Storage
      const customName = fields.customName ? fields.customName[0] : null;
      const folderPath = fields.folder && fields.folder[0] ? fields.folder[0] : '';
      
      const sanitizedCustom = customName ? customName.replace(/[^a-z0-9.-]/gi, '-').toLowerCase() : '';
      const baseName = sanitizedCustom || file.originalFilename.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const fileName = `${Date.now()}-${baseName}.${fileExt}`;
      
      const uploadPath = folderPath ? `blog-images/${folderPath}/${fileName}` : `blog-images/${fileName}`;
      
      const { data, error } = await supabaseAdmin.storage
        .from('images')
        .upload(uploadPath, finalBuffer, {
          contentType: contentType,
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return res.status(500).json({ error: error.message });
      }

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('images')
        .getPublicUrl(uploadPath);

      return res.status(200).json({ 
        url: publicUrl,
        name: fileName,
        size: Math.round(finalBuffer.length / 1024) + ' KB',
        type: isVideo ? 'video' : 'image'
      });
      
    } catch (processError) {
      console.error('Processing error:', processError);
      return res.status(500).json({ error: 'Failed to process file' });
    }
  });
}
