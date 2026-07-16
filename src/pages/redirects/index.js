import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { supabase } from '../../lib/supabase';
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight,
  FiLink, FiArrowRight, FiUpload, FiFilter, FiX, FiCheckCircle,
  FiRefreshCw, FiActivity,
} from 'react-icons/fi';

const TYPE_COLORS = { 301: '#018E9E', 302: '#F59E0B' };

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12,
      padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}18` }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{label}</div>
      </div>
    </div>
  );
}

const EMPTY = { source_url: '', destination_url: '', type: '301', notes: '', is_active: true };

function RedirectModal({ redirect, onClose, onSave }) {
  const [form, setForm] = useState(redirect || EMPTY);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.source_url.trim() || !form.destination_url.trim()) return alert('Source and destination are required.');
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px', background: 'var(--bg-base)',
    border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)',
    fontSize: 13, boxSizing: 'border-box',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14,
        width: '100%', maxWidth: 520, overflow: 'hidden',
      }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            {redirect ? 'Edit Redirect' : 'Add Redirect'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <FiX size={18} />
          </button>
        </div>
        <div style={{ padding: 24 }}>
          {[
            { label: 'Source URL', key: 'source_url', placeholder: '/old-page' },
            { label: 'Destination URL', key: 'destination_url', placeholder: '/new-page or https://...' },
            { label: 'Notes (optional)', key: 'notes', placeholder: 'Why this redirect exists…' },
          ].map(({ label, key, placeholder }) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</label>
              <input value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder} style={inputStyle} />
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Redirect Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}
                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                <option value="301">301 – Permanent</option>
                <option value="302">302 – Temporary</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Status</label>
              <button onClick={() => set('is_active', !form.is_active)} style={{
                width: '100%', padding: '9px 12px', background: form.is_active ? 'rgba(34,197,94,0.12)' : 'var(--bg-base)',
                border: `1px solid ${form.is_active ? '#22C55E' : 'var(--border)'}`,
                borderRadius: 8, color: form.is_active ? '#22C55E' : 'var(--text-muted)',
                cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                {form.is_active ? <><FiToggleRight size={16} /> Active</> : <><FiToggleLeft size={16} /> Inactive</>}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{
              padding: '9px 18px', background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13,
            }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{
              padding: '9px 20px', background: '#018E9E', border: 'none',
              borderRadius: 8, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 600, opacity: saving ? 0.7 : 1,
            }}>
              {saving ? 'Saving…' : 'Save Redirect'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CsvModal({ onClose, onImport }) {
  const [csv, setCsv] = useState('');
  const handleImport = () => {
    const rows = csv.trim().split('\n').map(line => {
      const [source_url, destination_url, type = '301'] = line.split(',').map(s => s.trim());
      return { source_url, destination_url, type, is_active: true, notes: 'CSV Import' };
    }).filter(r => r.source_url && r.destination_url);
    if (!rows.length) return alert('No valid rows found. Format: source,destination,type');
    onImport(rows);
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, width: '100%', maxWidth: 500 }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Bulk CSV Import</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiX size={18} /></button>
        </div>
        <div style={{ padding: 24 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>Format: <code style={{ color: '#018E9E' }}>source_url,destination_url,type</code> (one per line)</p>
          <textarea
            value={csv} onChange={e => setCsv(e.target.value)}
            placeholder={`/old-page,/new-page,301\n/another,https://new.com,302`}
            rows={8}
            style={{
              width: '100%', padding: '10px 12px', background: 'var(--bg-base)',
              border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)',
              fontSize: 12, fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <button onClick={onClose} style={{ padding: '9px 18px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            <button onClick={handleImport} style={{ padding: '9px 20px', background: '#018E9E', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Import</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RedirectsIndex() {
  const [redirects, setRedirects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCsv, setShowCsv] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [toast, setToast] = useState(null);
  const [deleting, setDeleting] = useState(null);
  
  // Tabs: 'redirects' | 'logs'
  const [activeTab, setActiveTab] = useState('redirects');
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    const { data, error } = await supabase.from('redirect_logs').select('*, redirects(source_url, destination_url)').order('logged_at', { ascending: false }).limit(100);
    if (!error) setLogs(data || []);
    setLoadingLogs(false);
  }, []);

  const fetchRedirects = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('redirects').select('*').order('created_at', { ascending: false });
    if (error) showToast(error.message, 'error');
    else setRedirects(data || []);
    setLoading(false);
  }, [showToast]);

  useEffect(() => { 
    if (activeTab === 'redirects') fetchRedirects();
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab, fetchRedirects, fetchLogs]);

  const filtered = redirects.filter(r =>
    !search || r.source_url?.toLowerCase().includes(search.toLowerCase()) || r.destination_url?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: redirects.length,
    r301: redirects.filter(r => r.type === '301').length,
    r302: redirects.filter(r => r.type === '302').length,
    active: redirects.filter(r => r.is_active).length,
  };

  const handleSave = async (form) => {
    const payload = { ...form, updated_at: new Date().toISOString() };
    if (editItem) {
      const { error } = await supabase.from('redirects').update(payload).eq('id', editItem.id);
      if (error) showToast(error.message, 'error');
      else showToast('Redirect updated.');
    } else {
      const { error } = await supabase.from('redirects').insert([{ ...payload, hit_count: 0, created_at: new Date().toISOString() }]);
      if (error) showToast(error.message, 'error');
      else showToast('Redirect added.');
    }
    setShowModal(false);
    setEditItem(null);
    fetchRedirects();
  };

  const toggleActive = async (r) => {
    const { error } = await supabase.from('redirects').update({ is_active: !r.is_active }).eq('id', r.id);
    if (error) showToast(error.message, 'error');
    else fetchRedirects();
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    const { error } = await supabase.from('redirects').delete().eq('id', id);
    if (error) showToast(error.message, 'error');
    else { showToast('Redirect deleted.'); fetchRedirects(); }
    setDeleting(null);
  };

  const handleCsvImport = async (rows) => {
    const { error } = await supabase.from('redirects').insert(rows.map(r => ({ ...r, hit_count: 0, created_at: new Date().toISOString() })));
    if (error) showToast(error.message, 'error');
    else { showToast(`Imported ${rows.length} redirects.`); setShowCsv(false); fetchRedirects(); }
  };

  return (
    <AdminLayout title="Redirect Manager">
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 24, zIndex: 9999, background: toast.type === 'error' ? '#EF4444' : '#22C55E', color: '#fff', padding: '10px 18px', borderRadius: 8, fontWeight: 600, fontSize: 13, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          {toast.msg}
        </div>
      )}
      {showModal && <RedirectModal redirect={editItem} onClose={() => { setShowModal(false); setEditItem(null); }} onSave={handleSave} />}
      {showCsv && <CsvModal onClose={() => setShowCsv(false)} onImport={handleCsvImport} />}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => setActiveTab('redirects')} style={{ padding: '10px 16px', background: 'transparent', border: 'none', borderBottom: activeTab === 'redirects' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'redirects' ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Manage Redirects</button>
        <button onClick={() => setActiveTab('logs')} style={{ padding: '10px 16px', background: 'transparent', border: 'none', borderBottom: activeTab === 'logs' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'logs' ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Redirect Logs</button>
      </div>

      {activeTab === 'redirects' ? (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
            <StatCard icon={FiLink} label="Total Redirects" value={stats.total} color="#018E9E" />
            <StatCard icon={FiArrowRight} label="301 Permanent" value={stats.r301} color="#018E9E" />
            <StatCard icon={FiActivity} label="302 Temporary" value={stats.r302} color="#F59E0B" />
            <StatCard icon={FiCheckCircle} label="Active" value={stats.active} color="#22C55E" />
          </div>

          {/* Table Card */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <FiSearch size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by source URL…"
              style={{ width: '100%', paddingLeft: 34, padding: '9px 12px 9px 34px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }} />
          </div>
          <button onClick={() => setShowCsv(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>
            <FiUpload size={14} /> CSV Import
          </button>
          <button onClick={fetchRedirects} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>
            <FiRefreshCw size={14} />
          </button>
          <button onClick={() => { setEditItem(null); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#018E9E', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            <FiPlus size={15} /> Add Redirect
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Loading redirects…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>No redirects found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                  {['Source URL', 'Destination URL', 'Type', 'Hits', 'Created', 'Active', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '13px 16px', fontFamily: 'monospace', fontSize: 12, color: '#018E9E', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.source_url}</td>
                    <td style={{ padding: '13px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.destination_url}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 700, background: `${TYPE_COLORS[r.type] || '#888'}18`, color: TYPE_COLORS[r.type] || '#888' }}>
                        {r.type}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', color: 'var(--text-muted)', fontSize: 12 }}>{r.hit_count ?? 0}</td>
                    <td style={{ padding: '13px 16px', color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <button onClick={() => toggleActive(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: r.is_active ? '#22C55E' : 'var(--text-muted)', fontSize: 18 }}>
                        {r.is_active ? <FiToggleRight size={22} /> : <FiToggleLeft size={22} />}
                      </button>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => { setEditItem(r); setShowModal(true); }} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(1,142,158,0.12)', border: 'none', borderRadius: 6, color: '#018E9E', cursor: 'pointer' }}>
                          <FiEdit2 size={13} />
                        </button>
                        <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 6, color: '#EF4444', cursor: 'pointer' }}>
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </>
      ) : (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 14 }}>Recent Redirect Logs (Last 100)</h3>
            <button onClick={fetchLogs} className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}>
              <FiRefreshCw size={13} style={{ marginRight: 6 }}/> Refresh
            </button>
          </div>
          {loadingLogs ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Loading logs…</div>
          ) : logs.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>No logs recorded yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Time</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Source URL</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Destination</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>IP Address</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>User Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: 12 }}>{new Date(l.logged_at).toLocaleString()}</td>
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: '#018E9E' }}>{l.redirects?.source_url || 'Unknown'}</td>
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{l.redirects?.destination_url || 'Unknown'}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>{l.ip_address}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.user_agent}>{l.user_agent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
