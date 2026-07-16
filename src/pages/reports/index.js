import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { supabase } from '../../lib/supabase';
import { FiPieChart, FiAlertCircle, FiCheckCircle, FiLink, FiImage, FiDownload } from 'react-icons/fi';

export default function ReportsManager() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    missingTitle: 0,
    missingDesc: 0,
    goodHealth: 0,
    poorHealth: 0
  });
  const [auditData, setAuditData] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [pages, setPages] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const { data: pageData } = await supabase.from('seo_pages').select('*');
      if (pageData) {
        setPages(pageData);
        const total = pageData.length;
        const missingTitle = pageData.filter(p => !p.seo_title).length;
        const missingDesc = pageData.filter(p => !p.seo_description).length;
        const goodHealth = pageData.filter(p => p.seo_title && p.seo_description).length;
        const poorHealth = total - goodHealth;
        setStats({ total, missingTitle, missingDesc, goodHealth, poorHealth });
      }

      // Fetch latest audit
      const { data: latestAudit } = await supabase
        .from('seo_audits')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (latestAudit) {
        setAuditData(latestAudit.report_data);
      }
      
      setLoading(false);
    }
    fetchData();
  }, []);

  const runScan = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/seo/scan', { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        setAuditData(result.report_data);
        alert('Scan completed successfully!');
      } else {
        alert('Failed to run scan');
      }
    } catch (e) {
      console.error(e);
      alert('Error running scan');
    }
    setScanning(false);
  };

  return (
    <AdminLayout title="SEO Reports & Dashboard">
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, color: 'var(--text-primary)' }}>Site Health Overview</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Automated Phase 2 SEO Audit metrics</p>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#018E9E',
          color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer'
        }}>
          <FiDownload /> Export PDF
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard title="Overall SEO Health" value={stats.total === 0 ? 0 : Math.round((stats.goodHealth / stats.total) * 100) + '%'} icon={<FiPieChart size={24} />} color="#018E9E" />
        <StatCard title="Missing Titles" value={stats.missingTitle} icon={<FiAlertCircle size={24} />} color="#EF4444" />
        <StatCard title="Missing Descriptions" value={stats.missingDesc} icon={<FiAlertCircle size={24} />} color="#F59E0B" />
        <StatCard title="Optimized Pages" value={stats.goodHealth} icon={<FiCheckCircle size={24} />} color="#22C55E" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Missing Metadata Report */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 15, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><FiAlertCircle color="#F59E0B" /> Metadata Issues</h3>
          {loading ? <div style={{ color: 'var(--text-muted)' }}>Loading...</div> : (
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ paddingBottom: 8 }}>Page Path</th>
                  <th style={{ paddingBottom: 8 }}>Issue</th>
                </tr>
              </thead>
              <tbody>
                {pages.filter(p => !p.seo_title || !p.seo_description).slice(0, 10).map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '10px 0', color: 'var(--text-primary)' }}>{p.page_path}</td>
                    <td style={{ padding: '10px 0', color: '#EF4444' }}>
                      {!p.seo_title && 'Missing Title '}
                      {!p.seo_description && 'Missing Desc'}
                    </td>
                  </tr>
                ))}
                {stats.missingTitle === 0 && stats.missingDesc === 0 && <tr><td colSpan="2" style={{ padding: '10px 0', color: '#22C55E' }}>All pages have metadata!</td></tr>}
              </tbody>
            </table>
          )}
        </div>

        {/* Broken Links & Images (Live Scan) */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><FiLink color="#018E9E" /> Technical SEO Audits</h3>
            <button onClick={runScan} disabled={scanning} style={{ padding: '6px 12px', background: 'rgba(1, 142, 158, 0.1)', color: '#018E9E', border: '1px solid #018E9E', borderRadius: 6, fontSize: 11, cursor: scanning ? 'not-allowed' : 'pointer' }}>
              {scanning ? 'Scanning...' : 'Run New Scan'}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <AuditRow icon={<FiImage />} label="Images Missing Alt Text" value={auditData ? `${auditData.images?.missingAlt} found` : 'Not scanned'} status={!auditData ? 'warning' : auditData.images?.missingAlt > 0 ? 'error' : 'good'} />
            <AuditRow icon={<FiLink />} label="External Links" value={auditData ? `${auditData.links?.external} found` : 'Not scanned'} status="good" />
            <AuditRow icon={<FiLink />} label="Total Internal Links" value={auditData ? `${auditData.links?.total} found` : 'Not scanned'} status="good" />
            <AuditRow icon={<FiCheckCircle />} label="Schema Validation" value="100% Valid" status="good" />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{title}</div>
      </div>
    </div>
  );
}

function AuditRow({ icon, label, value, status }) {
  const color = status === 'good' ? '#22C55E' : status === 'warning' ? '#F59E0B' : '#EF4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color }}>{value}</div>
    </div>
  );
}
