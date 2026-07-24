import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiImage, FiX, FiCheck, FiFolder, FiChevronRight, FiVideo } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';

export default function MediaSelector({ onSelect, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchItems();
  }, [currentPath]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const folderPath = currentPath ? `blog-images/${currentPath}` : 'blog-images';
      const { data, error } = await supabase.storage.from('images').list(folderPath, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      });
      if (error) throw error;
      
      const formattedItems = data.filter(file => file.name !== '.emptyFolderPlaceholder').map(file => {
        if (file.id === null || !file.metadata) {
          return { isFolder: true, name: file.name, id: 'folder-'+file.name };
        }
        const publicUrl = supabase.storage.from('images').getPublicUrl(`${folderPath}/${file.name}`).data.publicUrl;
        return { 
          isFolder: false,
          id: file.id, 
          url: publicUrl, 
          name: file.name,
          type: file.metadata?.mimetype?.startsWith('video/') ? 'video' : 'image'
        };
      });
      setItems(formattedItems);
    } catch (err) {
      console.error('Error fetching media library:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#1E293B', width: '90%', maxWidth: '800px', height: '80vh', borderRadius: '12px', display: 'flex', flexDirection: 'column', border: '1px solid #334155', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0F172A' }}>
          <h3 style={{ color: '#F1F5F9', margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiImage /> Select Media
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
            <FiX size={24} />
          </button>
        </div>
        
        {/* Breadcrumb */}
        <div style={{ padding: '10px 20px', background: '#1E293B', display: 'flex', alignItems: 'center', gap: 8, color: '#94A3B8', fontSize: 14, borderBottom: '1px solid #334155' }}>
          <span style={{ cursor: 'pointer', color: currentPath ? '#018E9E' : 'inherit' }} onClick={() => setCurrentPath('')}>Home</span>
          {currentPath && currentPath.split('/').map((part, index, arr) => (
             <span key={index} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
               <FiChevronRight />
               <span 
                 style={{ cursor: 'pointer', color: index === arr.length - 1 ? 'inherit' : '#018E9E' }}
                 onClick={() => setCurrentPath(arr.slice(0, index + 1).join('/'))}
               >
                 {part}
               </span>
             </span>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ color: '#94A3B8', textAlign: 'center', marginTop: '40px' }}>Loading items...</div>
          ) : items.length === 0 ? (
            <div style={{ color: '#94A3B8', textAlign: 'center', marginTop: '40px' }}>No items found in this folder.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
              {items.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => {
                    if (item.isFolder) {
                      setCurrentPath(currentPath ? `${currentPath}/${item.name}` : item.name);
                    } else {
                      onSelect(item.url, item.type);
                    }
                  }}
                  style={{ 
                    cursor: 'pointer', border: '2px solid transparent', borderRadius: '8px', overflow: 'hidden', 
                    background: '#0F172A', transition: 'all 0.2s', position: 'relative'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = '#018E9E'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
                >
                  <div style={{ height: '120px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222', color: item.isFolder ? '#018E9E' : '#fff' }}>
                    {item.isFolder ? (
                       <FiFolder size={48} />
                    ) : item.type === 'video' ? (
                       <>
                         <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
                         <FiVideo size={24} style={{ position: 'absolute' }} />
                       </>
                    ) : (
                       <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <div style={{ padding: '8px', fontSize: '11px', color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
