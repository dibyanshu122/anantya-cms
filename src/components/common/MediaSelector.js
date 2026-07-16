import { useState, useEffect } from 'react';
import { FiImage, FiX, FiCheck } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';

export default function MediaSelector({ onSelect, onClose }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.from('images').list('blog-images', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      });
      if (error) throw error;
      
      const formattedImages = data.filter(file => file.name !== '.emptyFolderPlaceholder').map(file => {
        const publicUrl = supabase.storage.from('images').getPublicUrl(`blog-images/${file.name}`).data.publicUrl;
        return { id: file.id, url: publicUrl, name: file.name };
      });
      setImages(formattedImages);
    } catch (err) {
      console.error('Error fetching media library:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#1E293B', width: '90%', maxWidth: '800px', height: '80vh', borderRadius: '12px', display: 'flex', flexDirection: 'column', border: '1px solid #334155', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0F172A' }}>
          <h3 style={{ color: '#F1F5F9', margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiImage /> Select from Media Library
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ color: '#94A3B8', textAlign: 'center', marginTop: '40px' }}>Loading images...</div>
          ) : images.length === 0 ? (
            <div style={{ color: '#94A3B8', textAlign: 'center', marginTop: '40px' }}>No images found. Please upload via Media Library first.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
              {images.map(img => (
                <div 
                  key={img.id} 
                  onClick={() => onSelect(img.url)}
                  style={{ 
                    cursor: 'pointer', border: '2px solid transparent', borderRadius: '8px', overflow: 'hidden', 
                    background: '#0F172A', transition: 'all 0.2s', position: 'relative'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = '#018E9E'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
                >
                  <div style={{ height: '120px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222' }}>
                    <img src={img.url} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '8px', fontSize: '11px', color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {img.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
