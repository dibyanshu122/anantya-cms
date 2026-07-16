import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { supabase } from '../../lib/supabase';
import { FiSave, FiPlus, FiTrash2, FiEdit2, FiCheck, FiX, FiImage, FiMoreVertical } from 'react-icons/fi';
import toast from 'react-hot-toast';
import MediaSelector from '../../components/common/MediaSelector';

export default function AnnouncementsManager() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    text: '', link: '', background_color: '#018E9E', text_color: '#FFFFFF', is_active: false, type: 'banner', image_url: '',
    button_text: 'Learn More', start_date: '', end_date: '', target_pages: '/', position: 'center', delay_time: 0, scroll_percentage: 0
  });
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (!error && data) setAnnouncements(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.text.trim()) return toast.error('Announcement text is required.');
    
    // Convert empty strings to null for timestamp fields to prevent Supabase errors
    const payload = {
      ...formData,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null
    };
    
    let error;
    if (editId) {
      const { error: err } = await supabase.from('announcements').update(payload).eq('id', editId);
      error = err;
    } else {
      const { error: err } = await supabase.from('announcements').insert([payload]);
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
        image_url: item.image_url || '',
        button_text: item.button_text || 'Learn More',
        start_date: item.start_date ? new Date(item.start_date).toISOString().slice(0, 16) : '',
        end_date: item.end_date ? new Date(item.end_date).toISOString().slice(0, 16) : '',
        target_pages: item.target_pages || '/',
        position: item.position || 'center',
        delay_time: item.delay_time || 0,
        scroll_percentage: item.scroll_percentage || 0
      });
    } else {
      setEditId(null);
      setFormData({ text: '', link: '', background_color: '#018E9E', text_color: '#FFFFFF', is_active: false, type: 'banner', image_url: '', button_text: 'Learn More', start_date: '', end_date: '', target_pages: '/', position: 'center', delay_time: 0, scroll_percentage: 0 });
    }
    setShowModal(true);
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
                <th>Type & Position</th>
                <th>Announcement Details</th>
                <th>Stats</th>
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
                    <span className="badge" style={{ background: 'var(--card-lighter)', display: 'block', marginBottom: '4px' }}>
                      {item.type === 'popup' ? 'Popup Modal' : 'Top Banner'}
                    </span>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Position: {item.position || 'center'}
                    </div>
                  </td>
                  <td>
                    {item.type === 'popup' && item.image_url && (
                      <img src={item.image_url} alt="Popup" style={{ height: 40, objectFit: 'contain', marginBottom: 8, borderRadius: 4 }} />
                    )}
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.text}</div>
                    {item.link && <div style={{ fontSize: 12, color: 'var(--primary)' }}>[{item.button_text || 'Learn More'}] → {item.link}</div>}
                    {item.target_pages && item.target_pages !== 'all' && (
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Pages: {item.target_pages}</div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                      <span style={{ color: 'var(--info)' }}>👁️ {item.views_count || 0} Views</span>
                      <span style={{ color: 'var(--success)' }}>🖱️ {item.clicks_count || 0} Clicks</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 4, background: item.background_color, border: '1px solid var(--border)' }} title="Background" />
                      <div style={{ width: 20, height: 20, borderRadius: 4, background: item.text_color, border: '1px solid var(--border)' }} title="Text" />
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', position: 'relative' }}>
                    <div className="action-buttons" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button 
                        className="icon-btn" 
                        onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                        style={{ background: 'transparent', color: 'var(--text)', border: 'none' }}
                      >
                        <FiMoreVertical size={20} />
                      </button>
                      
                      {activeDropdown === item.id && (
                        <>
                          <div 
                            style={{ position: 'fixed', inset: 0, zIndex: 99 }} 
                            onClick={(e) => { e.stopPropagation(); setActiveDropdown(null); }} 
                          />
                          <div style={{
                            position: 'absolute',
                            right: '30px',
                            top: '30px',
                            background: 'var(--elevated)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            boxShadow: 'var(--shadow-lg)',
                            zIndex: 100,
                            display: 'flex',
                            flexDirection: 'column',
                            minWidth: '120px',
                            padding: '6px'
                          }}>
                            <button 
                              onClick={(e) => { e.stopPropagation(); openModal(item); setActiveDropdown(null); }}
                              style={{ padding: '10px 12px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '6px', fontSize: '14px', color: 'var(--text)' }}
                              onMouseOver={(e) => e.currentTarget.style.background = 'var(--card-hover)'}
                              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <FiEdit2 size={16} /> Edit
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDelete(item.id); setActiveDropdown(null); }}
                              style={{ padding: '10px 12px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', borderRadius: '6px', fontSize: '14px' }}
                              onMouseOver={(e) => e.currentTarget.style.background = 'var(--danger-bg)'}
                              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <FiTrash2 size={16} /> Delete
                            </button>
                          </div>
                        </>
                      )}
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
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '70vh', overflowY: 'auto' }}>
              <div>
                <label className="form-label">Announcement Text *</label>
                <input type="text" className="form-input" value={formData.text} onChange={e => setFormData({...formData, text: e.target.value})} placeholder="e.g. Exciting news! We just launched..." />
              </div>
              
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Link URL (Optional)</label>
                  <input type="text" className="form-input" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} placeholder="e.g. /new-feature" />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Button Text</label>
                  <input type="text" className="form-input" value={formData.button_text} onChange={e => setFormData({...formData, button_text: e.target.value})} placeholder="e.g. Learn More" />
                </div>
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
                <div style={{ flex: 1 }}>
                  <label className="form-label">Position</label>
                  <select className="form-select" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})}>
                    {formData.type === 'banner' ? (
                      <>
                        <option value="top">Top</option>
                        <option value="bottom">Bottom</option>
                      </>
                    ) : (
                      <>
                        <option value="center">Center</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-right">Bottom Right</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Target Pages (Comma separated, Default: / for home)</label>
                  <input type="text" className="form-input" value={formData.target_pages} onChange={e => setFormData({...formData, target_pages: e.target.value})} placeholder="e.g. /, /pricing, /about (use 'all' for every page)" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Start Date (Optional)</label>
                  <input type="datetime-local" className="form-input" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">End Date (Optional)</label>
                  <input type="datetime-local" className="form-input" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Show Delay (Seconds)</label>
                  <input type="number" className="form-input" value={formData.delay_time} onChange={e => setFormData({...formData, delay_time: parseInt(e.target.value) || 0})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Scroll Trigger (%)</label>
                  <input type="number" className="form-input" value={formData.scroll_percentage} onChange={e => setFormData({...formData, scroll_percentage: parseInt(e.target.value) || 0})} max="100" />
                </div>
              </div>

              {formData.type === 'popup' && (
                <div>
                  <label className="form-label">Popup Image (Optional)</label>
                  {!formData.image_url ? (
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => setShowMediaSelector(true)}
                      style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', border: '1px dashed var(--border)' }}
                    >
                      <FiImage /> Select Image from Media Library
                    </button>
                  ) : (
                    <div style={{ marginTop: 8, position: 'relative', display: 'inline-block' }}>
                      <img src={formData.image_url} alt="Preview" style={{ maxHeight: 120, borderRadius: 8, border: '1px solid var(--border)' }} />
                      <button 
                        className="btn btn-danger btn-sm" 
                        style={{ position: 'absolute', top: -8, right: -8, padding: 4, borderRadius: '50%' }}
                        onClick={() => setFormData({...formData, image_url: ''})}
                      >
                        <FiX size={14} />
                      </button>
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
      {showMediaSelector && (
        <MediaSelector
          onSelect={(url) => {
            setFormData({...formData, image_url: url});
            setShowMediaSelector(false);
          }}
          onClose={() => setShowMediaSelector(false)}
        />
      )}
    </AdminLayout>
  );
}
