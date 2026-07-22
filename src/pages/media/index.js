import { useState, useRef, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { FiUploadCloud, FiSearch, FiTrash2, FiCopy, FiCheckCircle, FiFolder, FiFolderPlus, FiChevronRight, FiVideo, FiImage } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';

export default function MediaManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [currentPath, setCurrentPath] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchItems();
  }, [currentPath]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const folderPath = currentPath ? `blog-images/${currentPath}` : 'blog-images';
      const { data, error } = await supabase.storage.from('images').list(folderPath, {
        limit: 500,
        offset: 0,
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
          type: file.metadata?.mimetype?.startsWith('video/') ? 'video' : 'image',
          size: (file.metadata?.size / 1024).toFixed(1) + ' KB',
          date: new Date(file.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        };
      });
      setItems(formattedItems);
    } catch (err) {
      console.error('Error fetching media:', err);
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
    if (currentPath) formData.append('folder', currentPath);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Upload failed');
      
      await fetchItems();
    } catch (err) {
      console.error(err);
      alert('Error uploading file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const createFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;
    
    const sanitized = folderName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const folderPath = currentPath ? `blog-images/${currentPath}/${sanitized}` : `blog-images/${sanitized}`;
    
    try {
      const { error } = await supabase.storage.from('images').upload(`${folderPath}/.emptyFolderPlaceholder`, new Blob(['']));
      if (error) throw error;
      await fetchItems();
    } catch (err) {
      console.error('Error creating folder:', err);
      alert('Failed to create folder');
    }
  };

  const copyUrl = (id, url) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteItem = async (name, isFolder) => {
    if(confirm('Are you sure you want to delete this?')) {
      try {
        const pathToDelete = currentPath ? `blog-images/${currentPath}/${name}` : `blog-images/${name}`;
        if (isFolder) {
          const { data } = await supabase.storage.from('images').list(pathToDelete);
          if (data && data.length > 0) {
            const filesToRemove = data.map(x => `${pathToDelete}/${x.name}`);
            if (filesToRemove.length > 0) {
              await supabase.storage.from('images').remove(filesToRemove);
            }
          }
        } else {
          const { error } = await supabase.storage.from('images').remove([pathToDelete]);
          if (error) throw error;
        }
        await fetchItems();
      } catch (err) {
        console.error('Error deleting item:', err);
        alert('Failed to delete item');
      }
    }
  };

  return (
    <AdminLayout title="Media Library">
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontWeight: 600 }}>
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
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={createFolder}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)',
              color: 'var(--text-primary)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
            }}
          >
            <FiFolderPlus size={16} /> New Folder
          </button>
          <input type="file" ref={fileInputRef} onChange={handleUpload} accept="image/*,video/*" style={{ display: 'none' }} />
          <button 
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', background: '#018E9E',
              color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer'
            }}
          >
            <FiUploadCloud size={16} /> {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
      ) : items.length === 0 ? (
        <div style={{ color: 'var(--text-muted)' }}>No items found. Upload files or create a folder.</div>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
        {items.map(item => (
          <div key={item.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {item.isFolder ? (
              <div 
                onClick={() => setCurrentPath(currentPath ? `${currentPath}/${item.name}` : item.name)}
                style={{ height: 160, background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#018E9E' }}
              >
                <FiFolder size={64} />
              </div>
            ) : item.type === 'video' ? (
              <div style={{ height: 160, background: '#000', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
                <FiVideo size={32} style={{ position: 'absolute' }} />
              </div>
            ) : (
              <div style={{ height: 160, background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
                <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            
            <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.name}>
                {item.name}
              </div>
              {!item.isFolder && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
                  <span>{item.date}</span>
                  <span>{item.size}</span>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                {!item.isFolder && (
                  <button 
                    onClick={() => copyUrl(item.id, item.url)}
                    style={{ flex: 1, padding: '6px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, fontSize: 11 }}
                  >
                    {copiedId === item.id ? <><FiCheckCircle color="#22C55E" /> Copied</> : <><FiCopy /> Copy URL</>}
                  </button>
                )}
                <button onClick={() => deleteItem(item.name, item.isFolder)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, marginLeft: 'auto' }} title="Delete">
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </AdminLayout>
  );
}
