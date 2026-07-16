import { useState, useRef, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { FiUploadCloud, FiImage, FiSearch, FiTrash2, FiCopy, FiCheckCircle, FiEdit2 } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';

export default function MediaManager() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [customName, setCustomName] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.from('images').list('blog-images', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });
      if (error) throw error;
      
      const formattedImages = data.filter(file => file.name !== '.emptyFolderPlaceholder').map(file => {
        const publicUrl = supabase.storage.from('images').getPublicUrl(`blog-images/${file.name}`).data.publicUrl;
        return {
          id: file.id,
          url: publicUrl,
          name: file.name,
          size: (file.metadata?.size / 1024).toFixed(1) + ' KB',
          date: new Date(file.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        };
      });
      setImages(formattedImages);
    } catch (err) {
      console.error('Error fetching images:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (customName) formData.append('customName', customName);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Upload failed');
      
      const data = await res.json();
      
      const newImage = {
        id: Date.now(),
        url: data.url,
        name: data.name,
        size: data.size,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      };
      setImages([newImage, ...images]);
    } catch (err) {
      console.error(err);
      alert('Error uploading image');
    } finally {
      setUploading(false);
      setCustomName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const copyUrl = (id, url) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renameImage = async (oldName) => {
    const newName = prompt('Enter new name for the image:', oldName.replace('.webp', ''));
    if (!newName || newName === oldName) return;

    let sanitizedNewName = newName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    if (!sanitizedNewName.endsWith('.webp')) sanitizedNewName += '.webp';

    try {
      const { error } = await supabase.storage.from('images').move(`blog-images/${oldName}`, `blog-images/${sanitizedNewName}`);
      if (error) throw error;
      
      setImages(images.map(img => {
        if (img.name === oldName) {
          const publicUrl = supabase.storage.from('images').getPublicUrl(`blog-images/${sanitizedNewName}`).data.publicUrl;
          return { ...img, name: sanitizedNewName, url: publicUrl };
        }
        return img;
      }));
    } catch (err) {
      console.error('Error renaming image:', err);
      alert('Failed to rename image: ' + err.message);
    }
  };

  const deleteImage = async (name) => {
    if(confirm('Are you sure you want to delete this image?')) {
      try {
        const { error } = await supabase.storage.from('images').remove([`blog-images/${name}`]);
        if (error) throw error;
        setImages(images.filter(img => img.name !== name));
      } catch (err) {
        console.error('Error deleting image:', err);
        alert('Failed to delete image');
      }
    }
  };

  return (
    <AdminLayout title="Media Library & Image SEO">
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ position: 'relative', width: 300 }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search media..." 
            style={{ width: '100%', padding: '8px 12px 8px 36px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
          />
        </div>
        <div>
          <input type="file" ref={fileInputRef} onChange={handleUpload} accept="image/*" style={{ display: 'none' }} />
          <button 
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', background: '#018E9E',
              color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer'
            }}
          >
            <FiUploadCloud size={16} /> {uploading ? 'Compressing & Uploading...' : 'Upload Image'}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
        {images.map(img => (
          <div key={img.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 160, background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
              <img src={img.url} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={img.name}>
                {img.name}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
                <span>{img.date}</span>
                <span>{img.size}</span>
              </div>
              
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                <button 
                  onClick={() => copyUrl(img.id, img.url)}
                  style={{ flex: 1, padding: '6px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, fontSize: 11 }}
                >
                  {copiedId === img.id ? <><FiCheckCircle color="#22C55E" /> Copied</> : <><FiCopy /> Copy URL</>}
                </button>
                <button onClick={() => renameImage(img.name)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }} title="Rename Image">
                  <FiEdit2 size={14} />
                </button>
                <button onClick={() => deleteImage(img.name)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }} title="Delete Image">
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
