import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { supabase } from '../../lib/supabase';
import { FiSave, FiPlus, FiTrash2, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AnnouncementsManager() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    text: '', link: '', background_color: '#018E9E', text_color: '#FFFFFF', is_active: false, type: 'banner', image_url: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (!error && data) setAnnouncements(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.text.trim()) return toast.error('Announcement text is required.');
    
    // If setting active, we might want to deactivate others (optional, depending on requirements, but let's just save)
    let error;
    if (editId) {
      const { error: err } = await supabase.from('announcements').update(formData).eq('id', editId);
      error = err;
    } else {
      const { error: err } = await supabase.from('announcements').insert([formData]);
      error = err;
    }

    if (error) {
      toast.error('Error saving: ' + error.message);
    } else {
      toast.success('Announcement saved!');
      setShowModal(false);
      fetchAnnouncements();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    await supabase.from('announcements').delete().eq('id', id);
    fetchAnnouncements();
  };

  const toggleActive = async (id, currentStatus) => {
    // If activating, deactivate all others first to ensure only one is active at a time
    if (!currentStatus) {
      await supabase.from('announcements').update({ is_active: false }).neq('id', 0); // deactivate all
    }
    await supabase.from('announcements').update({ is_active: !currentStatus }).eq('id', id);
    fetchAnnouncements();
  };

  const openModal = (item = null) => {
    if (item) {
      setEditId(item.id);
      setFormData({ 
        text: item.text, 
        link: item.link || '', 
        background_color: item.background_color || '#018E9E', 
        text_color: item.text_color || '#FFFFFF', 
        is_active: item.is_active,
        type: item.type || 'banner',
        image_url: item.image_url || ''
      });
    } else {
      setEditId(null);
      setFormData({ text: '', link: '', background_color: '#018E9E', text_color: '#FFFFFF', is_active: false, type: 'banner', image_url: '' });
    }
    setShowModal(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `popups/${fileName}`;

    try {
      const { error: uploadError, data } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      toast.success('Image uploaded!');
    } catch (error) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <AdminLayout title="Announcements & Popups">
      <div className="page-header">
        <div>
          <h2>Dynamic Announcement Bar</h2>
          <p className="page-subtitle">Manage the top notification bar for the main website.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => openModal()}>
            <FiPlus /> New Announcement
          </button>
        </div>
      </div>

      <div className="cms-card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : announcements.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No announcements found. Create one to show on the website.</div>
        ) : (
          <table className="cms-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Type</th>
                <th>Announcement Details</th>
                <th>Colors</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map(item => (
                <tr key={item.id}>
                  <td>
                    <button 
                      onClick={() => toggleActive(item.id, item.is_active)}
                      className="status-badge"
                      style={{ 
                        background: item.is_active ? 'var(--success-bg)' : 'var(--danger-bg)', 
                        color: item.is_active ? 'var(--success)' : 'var(--danger)',
                        border: 'none', cursor: 'pointer'
                      }}
                    >
                      {item.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td>
                    <span className="badge" style={{ background: 'var(--card-lighter)' }}>
                      {item.type === 'popup' ? 'Popup Modal' : 'Top Banner'}
                    </span>
                  </td>
                  <td>
                    {item.type === 'popup' && item.image_url && (
                      <img src={item.image_url} alt="Popup" style={{ height: 40, objectFit: 'contain', marginBottom: 8, borderRadius: 4 }} />
                    )}
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.text}</div>
                    {item.link && <div style={{ fontSize: 12, color: 'var(--primary)' }}>Link: {item.link}</div>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 4, background: item.background_color, border: '1px solid var(--border)' }} title="Background" />
                      <div style={{ width: 20, height: 20, borderRadius: 4, background: item.text_color, border: '1px solid var(--border)' }} title="Text" />
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-buttons">
                      <button className="icon-btn" onClick={() => openModal(item)}><FiEdit2 /></button>
                      <button className="icon-btn danger" onClick={() => handleDelete(item.id)}><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editId ? 'Edit Announcement' : 'New Announcement'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><FiX size={20} /></button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">Announcement Text *</label>
                <input type="text" className="form-input" value={formData.text} onChange={e => setFormData({...formData, text: e.target.value})} placeholder="e.g. Exciting news! We just launched..." />
              </div>
              <div>
                <label className="form-label">Link URL (Optional)</label>
                <input type="text" className="form-input" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} placeholder="e.g. /new-feature" />
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Background Color</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="color" value={formData.background_color} onChange={e => setFormData({...formData, background_color: e.target.value})} style={{ width: 40, height: 40, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                    <input type="text" className="form-input" value={formData.background_color} onChange={e => setFormData({...formData, background_color: e.target.value})} />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Text Color</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="color" value={formData.text_color} onChange={e => setFormData({...formData, text_color: e.target.value})} style={{ width: 40, height: 40, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                    <input type="text" className="form-input" value={formData.text_color} onChange={e => setFormData({...formData, text_color: e.target.value})} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Type</label>
                  <select 
                    className="form-select" 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="banner">Top Banner (Text Only)</option>
                    <option value="popup">Modal Popup (Image + Text)</option>
                  </select>
                </div>
              </div>

              {formData.type === 'popup' && (
                <div>
                  <label className="form-label">Popup Image (Optional)</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    disabled={uploadingImage}
                    className="form-input" 
                    style={{ padding: '8px' }}
                  />
                  {uploadingImage && <div style={{ fontSize: 12, marginTop: 4, color: 'var(--text-muted)' }}>Uploading...</div>}
                  {formData.image_url && (
                    <div style={{ marginTop: 8 }}>
                      <img src={formData.image_url} alt="Preview" style={{ maxHeight: 100, borderRadius: 4 }} />
                      <div style={{ fontSize: 12, color: 'var(--primary)', cursor: 'pointer', marginTop: 4 }} onClick={() => setFormData({...formData, image_url: ''})}>Remove Image</div>
                    </div>
                  )}
                </div>
              )}

              
              <div style={{ marginTop: 10, padding: 15, background: formData.background_color, color: formData.text_color, borderRadius: 8, textAlign: 'center', fontSize: 14 }}>
                <strong>Preview:</strong> {formData.text || 'Your text will appear here'}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>
                <FiSave style={{ marginRight: 6 }} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
