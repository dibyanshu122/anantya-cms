import { useState, useRef, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { FiUploadCloud, FiSearch, FiTrash2, FiCopy, FiCheckCircle, FiFolder, FiFolderPlus, FiChevronRight, FiVideo, FiImage, FiEdit2 } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import ConfirmModal from '../../components/common/ConfirmModal';
import PromptModal from '../../components/common/PromptModal';

export default function MediaManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [currentPath, setCurrentPath] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderNameInput, setFolderNameInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [promptRename, setPromptRename] = useState(null);
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

  

  const copyUrl = (id, url) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renameItem = (oldName, isFolder) => {
    const defaultName = isFolder ? oldName : (oldName.split('.').slice(0, -1).join('.') || oldName);
    setPromptRename({ oldName, isFolder, defaultName });
  };

  const executeRename = async (newName) => {
    if (!promptRename || !newName || newName === promptRename.oldName) return;
    const { oldName, isFolder } = promptRename;

    let sanitizedNewName = newName.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    if (!isFolder) {
      const extension = oldName.split('.').pop();
      if (!sanitizedNewName.endsWith(`.${extension}`)) sanitizedNewName += `.${extension}`;
    }

    const oldPath = currentPath ? `blog-images/${currentPath}/${oldName}` : `blog-images/${oldName}`;
    const newPath = currentPath ? `blog-images/${currentPath}/${sanitizedNewName}` : `blog-images/${sanitizedNewName}`;

    try {
      const { error } = await supabase.storage.from('images').move(oldPath, newPath);
      if (error) throw error;
      await fetchItems();
    } catch (err) {
      console.error('Error renaming item:', err);
      alert('Failed to rename item. Make sure the name is unique.');
    }
  };

  const deleteItem = (name, isFolder) => {
    setConfirmDelete({ name, isFolder });
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    const { name, isFolder } = confirmDelete;
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
            className="btn btn-primary"
            onClick={() => setShowFolderModal(true)}
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
                <div style={{ display: 'flex', gap: 12, marginLeft: item.isFolder ? 0 : 'auto', width: item.isFolder ? '100%' : 'auto', justifyContent: item.isFolder ? 'flex-end' : 'flex-start' }}>
                  <button onClick={() => renameItem(item.name, item.isFolder)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }} title="Rename">
                    <FiEdit2 size={15} />
                  </button>
                  <button onClick={() => deleteItem(item.name, item.isFolder)} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }} title="Delete">
                    <FiTrash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Create Folder Modal */}
      <PromptModal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onSubmit={async (val) => {
          if (!val) return;
          const sanitized = val.replace(/[^a-z0-9]/gi, '-').toLowerCase();
          try {
            const folderPath = currentPath ? `blog-images/${currentPath}/${sanitized}/.keep` : `blog-images/${sanitized}/.keep`;
            const { error } = await supabase.storage.from('images').upload(folderPath, new Blob(['']), { contentType: 'text/plain' });
            if (error) throw error;
            await fetchItems();
          } catch (err) {
            console.error('Error creating folder:', err);
            alert('Failed to create folder');
          }
        }}
        title="Create New Folder"
        placeholder="Enter folder name"
        submitText="Create"
      />

      {/* Rename Item Modal */}
      <PromptModal
        isOpen={!!promptRename}
        onClose={() => setPromptRename(null)}
        onSubmit={executeRename}
        title={promptRename ? `Rename ${promptRename.isFolder ? 'Folder' : 'File'}` : ''}
        defaultValue={promptRename?.defaultName || ''}
        placeholder="Enter new name"
      />

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={executeDelete}
        title="Delete Item"
        message={confirmDelete ? `Are you sure you want to delete "${confirmDelete.name}"?${confirmDelete.isFolder ? ' This will delete all contents inside.' : ''}` : ''}
        confirmText="Delete"
      />
    </AdminLayout>
  );
}
