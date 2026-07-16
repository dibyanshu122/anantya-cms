import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { supabase } from '../../lib/supabase';
import { FiPlus, FiSearch, FiCode, FiTrash2, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const SCHEMA_TYPES = [
  'Organization', 'WebPage', 'Article', 'BlogPosting', 
  'FAQPage', 'BreadcrumbList', 'Product', 'Service', 
  'LocalBusiness', 'VideoObject', 'Custom'
];

export default function SchemaManager() {
  const [schemas, setSchemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    schema_type: 'Organization',
    page_path: '/',
    json_ld: '',
    is_active: true
  });
  const [jsonError, setJsonError] = useState(null);

  useEffect(() => {
    fetchSchemas();
  }, []);

  async function fetchSchemas() {
    setLoading(true);
    const { data, error } = await supabase
      .from('schemas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) toast.error('Error fetching schemas');
    else setSchemas(data || []);
    setLoading(false);
  }

  const validateJson = (jsonString) => {
    if (!jsonString.trim()) return true; // empty is fine, but we'll enforce required on save
    try {
      JSON.parse(jsonString);
      setJsonError(null);
      return true;
    } catch (e) {
      setJsonError(e.message);
      return false;
    }
  };

  const handleJsonChange = (e) => {
    const val = e.target.value;
    setFormData({ ...formData, json_ld: val });
    validateJson(val);
  };

  const handleOpenModal = (schema = null) => {
    if (schema) {
      setEditId(schema.id);
      setFormData({
        name: schema.name,
        schema_type: schema.schema_type,
        page_path: schema.page_path,
        json_ld: schema.json_ld,
        is_active: schema.is_active
      });
      setJsonError(null);
    } else {
      setEditId(null);
      setFormData({
        name: '',
        schema_type: 'Organization',
        page_path: '/',
        json_ld: '{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "Anantya.ai",\n  "url": "https://anantya.ai",\n  "logo": "https://anantya.ai/logo.png"\n}',
        is_active: true
      });
      setJsonError(null);
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateJson(formData.json_ld)) {
      return toast.error('Invalid JSON. Please fix errors before saving.');
    }
    if (!formData.name || !formData.page_path || !formData.json_ld) {
      return toast.error('Please fill in all required fields.');
    }

    try {
      if (editId) {
        const { error } = await supabase
          .from('schemas')
          .update(formData)
          .eq('id', editId);
        if (error) throw error;
        toast.success('Schema updated');
      } else {
        const { error } = await supabase
          .from('schemas')
          .insert([formData]);
        if (error) throw error;
        toast.success('Schema created');
      }
      setShowModal(false);
      fetchSchemas();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this schema?')) return;
    const { error } = await supabase.from('schemas').delete().eq('id', id);
    if (error) toast.error('Error deleting schema');
    else {
      toast.success('Schema deleted');
      fetchSchemas();
    }
  };

  const filteredSchemas = schemas.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.schema_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="Schema Manager">
      <div className="cms-card" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search schemas..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '35px' }}
            />
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <FiPlus /> Add Schema
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="cms-table" style={{ width: '100%' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px' }}>Schema Name</th>
                <th style={{ padding: '12px' }}>Type</th>
                <th style={{ padding: '12px' }}>Page Path</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>Loading...</td></tr>
              ) : filteredSchemas.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No schemas found</td></tr>
              ) : (
                filteredSchemas.map(schema => (
                  <tr key={schema.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{schema.name}</td>
                    <td style={{ padding: '12px' }}>
                      <span className="badge badge-draft" style={{ background: 'rgba(1, 142, 158, 0.1)', color: 'var(--primary)' }}>
                        <FiCode size={12} /> {schema.schema_type}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace' }}>{schema.page_path}</td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge ${schema.is_active ? 'badge-published' : 'badge-draft'}`}>
                        {schema.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button className="btn btn-ghost" onClick={() => handleOpenModal(schema)} style={{ padding: '6px', marginRight: '5px' }}>
                        <FiEdit2 size={16} />
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(schema.id)} style={{ padding: '6px' }}>
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
          <div className="cms-card" style={{ width: '100%', maxWidth: '700px', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{editId ? 'Edit Schema' : 'Add New Schema'}</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost" style={{ padding: '5px' }}><FiX size={20}/></button>
            </div>
            
            <form onSubmit={handleSave} style={{ overflowY: 'auto', padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>Name (Internal)</label>
                  <input type="text" className="form-input" required
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Main Organization Schema" />
                </div>
                
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>Page Path</label>
                  <input type="text" className="form-input" required
                    value={formData.page_path} onChange={e => setFormData({...formData, page_path: e.target.value})}
                    placeholder="e.g. / or /about" />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>Schema Type</label>
                  <select className="form-select"
                    value={formData.schema_type} onChange={e => setFormData({...formData, schema_type: e.target.value})}
                  >
                    {SCHEMA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                    <span style={{ fontWeight: 500 }}>Active (Render on site)</span>
                  </label>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>JSON-LD Content</span>
                  {jsonError && <span style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>Invalid JSON</span>}
                  {!jsonError && formData.json_ld && <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>Valid JSON</span>}
                </label>
                <textarea 
                  className={`form-textarea ${jsonError ? 'inputError' : ''}`}
                  value={formData.json_ld} 
                  onChange={handleJsonChange}
                  rows="12"
                  style={{ fontFamily: 'monospace', fontSize: '0.9rem', width: '100%', background: '#0a0f1d', color: '#38bdf8', padding: '15px' }}
                />
                {jsonError && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '5px' }}>{jsonError}</div>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!!jsonError}>Save Schema</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
