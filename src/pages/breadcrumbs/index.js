import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { supabase } from '../../lib/supabase';
import { FiPlus, FiTrash2, FiEdit2, FiSave, FiList, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function BreadcrumbsManager() {
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [formData, setFormData] = useState({
    page_path: '',
    page_name: '',
    trail: [{ label: 'Home', url: '/' }],
    is_manual_override: true,
    schema_enabled: true
  });

  useEffect(() => {
    fetchBreadcrumbs();
  }, []);

  async function fetchBreadcrumbs() {
    setLoading(true);
    const { data, error } = await supabase
      .from('breadcrumbs')
      .select('*')
      .order('page_path', { ascending: true });

    if (error) toast.error('Error fetching breadcrumbs');
    else setBreadcrumbs(data || []);
    setLoading(false);
  }

  const handleOpenModal = (bc = null) => {
    if (bc) {
      setEditId(bc.id);
      setFormData({
        page_path: bc.page_path,
        page_name: bc.page_name,
        trail: bc.trail || [],
        is_manual_override: bc.is_manual_override,
        schema_enabled: bc.schema_enabled
      });
    } else {
      setEditId(null);
      setFormData({
        page_path: '',
        page_name: '',
        trail: [{ label: 'Home', url: '/' }],
        is_manual_override: true,
        schema_enabled: true
      });
    }
    setShowModal(true);
  };

  const handleTrailChange = (index, field, value) => {
    const newTrail = [...formData.trail];
    newTrail[index][field] = value;
    setFormData({ ...formData, trail: newTrail });
  };

  const addTrailItem = () => {
    setFormData({
      ...formData,
      trail: [...formData.trail, { label: '', url: '' }]
    });
  };

  const removeTrailItem = (index) => {
    if (formData.trail.length <= 1) return toast.error('Must have at least one breadcrumb');
    const newTrail = formData.trail.filter((_, i) => i !== index);
    setFormData({ ...formData, trail: newTrail });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.page_path || !formData.page_name) {
      return toast.error('Page path and name are required');
    }
    // ensure path starts with /
    if (!formData.page_path.startsWith('/')) {
      formData.page_path = '/' + formData.page_path;
    }

    try {
      if (editId) {
        const { error } = await supabase.from('breadcrumbs').update(formData).eq('id', editId);
        if (error) throw error;
        toast.success('Breadcrumb updated');
      } else {
        const { error } = await supabase.from('breadcrumbs').insert([formData]);
        if (error) throw error;
        toast.success('Breadcrumb created');
      }
      setShowModal(false);
      fetchBreadcrumbs();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this breadcrumb config?')) return;
    const { error } = await supabase.from('breadcrumbs').delete().eq('id', id);
    if (error) toast.error('Error deleting');
    else {
      toast.success('Deleted');
      fetchBreadcrumbs();
    }
  };

  return (
    <AdminLayout title="Breadcrumbs Manager">
      <div className="cms-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0 }}>Custom Breadcrumbs</h3>
            <p style={{ margin: '5px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Override default breadcrumbs and generate JSON-LD schema automatically.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <FiPlus /> Add Breadcrumb
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="cms-table" style={{ width: '100%' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px' }}>Page Name</th>
                <th style={{ padding: '12px' }}>Path</th>
                <th style={{ padding: '12px' }}>Trail Preview</th>
                <th style={{ padding: '12px' }}>Schema</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>Loading...</td></tr>
              ) : breadcrumbs.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No custom breadcrumbs defined.</td></tr>
              ) : (
                breadcrumbs.map(bc => (
                  <tr key={bc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{bc.page_name}</td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{bc.page_path}</td>
                    <td style={{ padding: '12px', fontSize: '0.85rem' }}>
                      {bc.trail?.map((t, i) => (
                        <span key={i}>
                          <a href={t.url} style={{ color: 'var(--primary)' }} target="_blank" rel="noreferrer">{t.label}</a>
                          {i < bc.trail.length - 1 && <span style={{ margin: '0 5px', color: 'var(--text-muted)' }}>&gt;</span>}
                        </span>
                      ))}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge ${bc.schema_enabled ? 'badge-published' : 'badge-draft'}`}>
                        {bc.schema_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button className="btn btn-ghost" onClick={() => handleOpenModal(bc)} style={{ padding: '6px', marginRight: '5px' }}>
                        <FiEdit2 size={16} />
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(bc.id)} style={{ padding: '6px' }}>
                        <FiTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="cms-card" style={{ width: '100%', maxWidth: '600px', padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{editId ? 'Edit Breadcrumb' : 'Add Custom Breadcrumb'}</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost" style={{ padding: '5px' }}><FiX size={20}/></button>
            </div>
            
            <form onSubmit={handleSave} style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>Page Name</label>
                  <input type="text" className="form-input" required
                    value={formData.page_name} onChange={e => setFormData({...formData, page_name: e.target.value})}
                    placeholder="e.g. Features" />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>Target Page Path</label>
                  <input type="text" className="form-input" required
                    value={formData.page_path} onChange={e => setFormData({...formData, page_path: e.target.value})}
                    placeholder="e.g. /features" />
                </div>
              </div>

              <div style={{ background: 'var(--bg)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h4 style={{ margin: 0 }}>Breadcrumb Trail</h4>
                  <button type="button" className="btn btn-ghost" onClick={addTrailItem} style={{ padding: '4px 10px', fontSize: '0.85rem' }}>
                    <FiPlus /> Add Level
                  </button>
                </div>
                
                {formData.trail.map((item, index) => (
                  <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                    <div style={{ width: '30px', color: 'var(--text-muted)', fontWeight: 'bold' }}>{index + 1}.</div>
                    <input type="text" className="form-input" placeholder="Label (e.g. Home)" required
                      value={item.label} onChange={e => handleTrailChange(index, 'label', e.target.value)}
                      style={{ flex: 1 }} />
                    <input type="text" className="form-input" placeholder="URL (e.g. /)" required
                      value={item.url} onChange={e => handleTrailChange(index, 'url', e.target.value)}
                      style={{ flex: 2 }} />
                    <button type="button" className="btn btn-ghost" onClick={() => removeTrailItem(index)} style={{ padding: '8px', color: 'var(--danger)' }}>
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.schema_enabled} onChange={e => setFormData({...formData, schema_enabled: e.target.checked})} />
                  <span style={{ fontWeight: 500 }}>Auto-generate Schema (BreadcrumbList)</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Config</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
