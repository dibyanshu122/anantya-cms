import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AdminLayout from '../../components/layout/AdminLayout';
import { supabase } from '../../lib/supabase';
import { triggerBuild } from '../../lib/triggerBuild';
import {
  FiSearch, FiEdit2, FiCheckCircle, FiAlertCircle, FiXCircle,
  FiRefreshCw, FiFilter, FiExternalLink, FiTrendingUp,
} from 'react-icons/fi';

const SEO_COLORS = {
  good: '#22C55E',
  warning: '#F59E0B',
  bad: '#EF4444',
};

function getSeoStatus(row) {
  const hasTitle = row.seo_title && row.seo_title.trim().length > 0;
  const hasDesc = row.seo_description && row.seo_description.trim().length > 0;
  if (hasTitle && hasDesc) return 'good';
  if (hasTitle || hasDesc) return 'warning';
  return 'bad';
}

function StatusBadge({ status }) {
  const cfg = {
    good: { color: SEO_COLORS.good, Icon: FiCheckCircle, label: 'Good' },
    warning: { color: SEO_COLORS.warning, Icon: FiAlertCircle, label: 'Needs Work' },
    bad: { color: SEO_COLORS.bad, Icon: FiXCircle, label: 'Missing' },
  };
  const { color, Icon, label } = cfg[status] || cfg.bad;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color, fontWeight: 600, fontSize: 12 }}>
      <Icon size={13} />
      {label}
    </span>
  );
}

export default function SeoIndex() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPages = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('seo_pages')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) showToast(error.message, 'error');
    else setPages(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const filtered = pages.filter(p => {
    const matchSearch = !search ||
      p.page_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.page_path?.toLowerCase().includes(search.toLowerCase());
    const status = getSeoStatus(p);
    const matchStatus = filterStatus === 'all' || filterStatus === status;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: pages.length,
    good: pages.filter(p => getSeoStatus(p) === 'good').length,
    warning: pages.filter(p => getSeoStatus(p) === 'warning').length,
    bad: pages.filter(p => getSeoStatus(p) === 'bad').length,
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditValues({ seo_title: row.seo_title || '', seo_description: row.seo_description || '' });
  };

  const cancelEdit = () => { setEditingId(null); setEditValues({}); };

  const saveEdit = async (id) => {
    setSaving(true);
    const { error } = await supabase
      .from('seo_pages')
      .update({ ...editValues, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) showToast(error.message, 'error');
    else { showToast('SEO updated successfully'); fetchPages(); cancelEdit(); triggerBuild(); }
    setSaving(false);
  };

  const trunc = (str, len = 50) => {
    if (!str) return <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>;
    return str.length > len ? str.slice(0, len) + '…' : str;
  };

  return (
    <AdminLayout title="SEO Pages">
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 24, zIndex: 9999,
          background: toast.type === 'error' ? '#EF4444' : '#22C55E',
          color: '#fff', padding: '10px 18px', borderRadius: 8,
          fontWeight: 600, fontSize: 13, boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Pages', value: stats.total, color: '#018E9E', icon: FiTrendingUp },
          { label: 'Good SEO', value: stats.good, color: '#22C55E', icon: FiCheckCircle },
          { label: 'Needs Work', value: stats.warning, color: '#F59E0B', icon: FiAlertCircle },
          { label: 'Missing SEO', value: stats.bad, color: '#EF4444', icon: FiXCircle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: `${color}18`,
            }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
          borderBottom: '1px solid var(--border)', flexWrap: 'wrap',
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <FiSearch size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search pages…"
              style={{
                width: '100%', paddingLeft: 34, padding: '9px 12px 9px 34px',
                background: 'var(--bg-base)', border: '1px solid var(--border)',
                borderRadius: 8, color: 'var(--text-primary)', fontSize: 13,
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'good', 'warning', 'bad'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                  border: `1px solid ${filterStatus === s ? '#018E9E' : 'var(--border)'}`,
                  background: filterStatus === s ? 'rgba(1,142,158,0.15)' : 'transparent',
                  color: filterStatus === s ? '#018E9E' : 'var(--text-muted)',
                  cursor: 'pointer', textTransform: 'capitalize',
                }}
              >
                {s === 'all' ? 'All' : s === 'good' ? 'Good' : s === 'warning' ? 'Needs Work' : 'Missing'}
              </button>
            ))}
          </div>
          <button onClick={fetchPages} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
            background: 'var(--bg-base)', border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13,
          }}>
            <FiRefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Loading SEO pages…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>No pages found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                  {['Page Name', 'Path', 'SEO Title', 'Description', 'Status', 'Schema', 'Updated', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => {
                  const status = getSeoStatus(row);
                  const isEditing = editingId === row.id;
                  return (
                    <tr key={row.id} style={{
                      borderBottom: '1px solid var(--border)',
                      background: isEditing ? 'rgba(1,142,158,0.04)' : 'transparent',
                    }}>
                      <td style={{ padding: '13px 16px', fontWeight: 600, color: 'var(--text-primary)', maxWidth: 160 }}>
                        {row.page_name || '—'}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <a href={`https://anantya.ai${row.page_path}`} target="_blank" rel="noopener noreferrer"
                          style={{ color: '#018E9E', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                          {row.page_path} <FiExternalLink size={11} />
                        </a>
                      </td>
                      <td style={{ padding: '13px 16px', maxWidth: 180 }}>
                        {isEditing ? (
                          <input
                            value={editValues.seo_title}
                            onChange={e => setEditValues(v => ({ ...v, seo_title: e.target.value }))}
                            style={{
                              width: '100%', padding: '6px 10px',
                              background: 'var(--bg-base)', border: '1px solid #018E9E',
                              borderRadius: 6, color: 'var(--text-primary)', fontSize: 12,
                            }}
                            placeholder="SEO Title"
                          />
                        ) : (
                          <span style={{ color: row.seo_title ? 'var(--text-secondary)' : 'var(--text-muted)', fontStyle: row.seo_title ? 'normal' : 'italic' }}>
                            {trunc(row.seo_title, 45)}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '13px 16px', maxWidth: 200 }}>
                        {isEditing ? (
                          <input
                            value={editValues.seo_description}
                            onChange={e => setEditValues(v => ({ ...v, seo_description: e.target.value }))}
                            style={{
                              width: '100%', padding: '6px 10px',
                              background: 'var(--bg-base)', border: '1px solid #018E9E',
                              borderRadius: 6, color: 'var(--text-primary)', fontSize: 12,
                            }}
                            placeholder="Meta Description"
                          />
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>{trunc(row.seo_description, 55)}</span>
                        )}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <StatusBadge status={status} />
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        {row.schema_type ? (
                          <span style={{
                            background: 'rgba(1,142,158,0.12)', color: '#018E9E',
                            padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600,
                          }}>{row.schema_type}</span>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                      </td>
                      <td style={{ padding: '13px 16px', color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {row.updated_at ? new Date(row.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {isEditing ? (
                            <>
                              <button onClick={() => saveEdit(row.id)} disabled={saving} style={{
                                padding: '6px 12px', background: '#018E9E', border: 'none',
                                borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600,
                                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                              }}>
                                {saving ? 'Saving…' : 'Save'}
                              </button>
                              <button onClick={cancelEdit} style={{
                                padding: '6px 12px', background: 'transparent',
                                border: '1px solid var(--border)', borderRadius: 6,
                                color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
                              }}>Cancel</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(row)} style={{
                                width: 30, height: 30, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', background: 'rgba(1,142,158,0.12)',
                                border: 'none', borderRadius: 6, color: '#018E9E', cursor: 'pointer',
                              }} title="Quick Edit">
                                <FiEdit2 size={13} />
                              </button>
                              <Link href={`/seo/${row.id}`} style={{
                                padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6,
                                background: 'linear-gradient(135deg, #018E9E, #026773)',
                                border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600,
                                textDecoration: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                              }} title="Advanced AI Editor">
                                ✨ AI Edit
                              </Link>
                              <Link href={`/seo/${row.id}`} style={{
                                width: 30, height: 30, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', background: 'var(--bg-base)',
                                border: '1px solid var(--border)', borderRadius: 6,
                                color: 'var(--text-secondary)', cursor: 'pointer',
                              }} title="Full Edit">
                                <FiExternalLink size={14} />
                              </Link>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
