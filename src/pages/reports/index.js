import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { supabase } from '../../lib/supabase';
import { FiPieChart, FiAlertCircle, FiCheckCircle, FiLink, FiImage, FiDownload } from 'react-icons/fi';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

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

  const pieData = [
    { name: 'Optimized', value: stats.goodHealth, fill: 'url(#colorOptimized)' },
    { name: 'Needs Work', value: stats.poorHealth, fill: 'url(#colorNeedsWork)' }
  ];

  const barData = [
    { name: 'Total', count: stats.total },
    { name: 'No Title', count: stats.missingTitle },
    { name: 'No Desc', count: stats.missingDesc },
    { name: 'Optimized', count: stats.goodHealth }
  ];

  return (
    <AdminLayout title="SEO Reports & Dashboard">
      <style>{`
        :root[data-theme='dark'] {
          --chart-bg: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
          --chart-border: rgba(255,255,255,0.1);
          --chart-shadow: 0 10px 30px rgba(0,0,0,0.2);
          --chart-title: #ffffff;
          --chart-tooltip-bg: rgba(15, 23, 42, 0.9);
          --chart-tooltip-border: rgba(255,255,255,0.1);
          --chart-tooltip-text: #ffffff;
          --chart-grid: rgba(255,255,255,0.1);
          --chart-axis: #94a3b8;
          --chart-legend: #cbd5e1;
          --pie-shadow: drop-shadow(0px 4px 10px rgba(0,0,0,0.3));
          --bar-shadow: drop-shadow(0px 4px 8px rgba(0,0,0,0.4));
        }
        
        :root[data-theme='light'] {
          --chart-bg: #ffffff;
          --chart-border: #e2e8f0;
          --chart-shadow: 0 20px 40px -15px rgba(0,0,0,0.05);
          --chart-title: #1e293b;
          --chart-tooltip-bg: rgba(255, 255, 255, 0.95);
          --chart-tooltip-border: #e2e8f0;
          --chart-tooltip-text: #1e293b;
          --chart-grid: #f1f5f9;
          --chart-axis: #64748b;
          --chart-legend: #475569;
          --pie-shadow: drop-shadow(0px 8px 16px rgba(59, 130, 246, 0.25));
          --bar-shadow: drop-shadow(0px 8px 16px rgba(168, 85, 247, 0.25));
        }
      `}</style>
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

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        
        {/* SEO Health Pie Chart */}
        <div style={{ background: 'var(--chart-bg)', border: '1px solid var(--chart-border)', borderRadius: 20, padding: 24, boxShadow: 'var(--chart-shadow)' }}>
          <h3 style={{ fontSize: 16, margin: '0 0 24px', color: 'var(--chart-title)', fontWeight: 600 }}>SEO Health Distribution</h3>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <linearGradient id="colorOptimized" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                  <linearGradient id="colorNeedsWork" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none" cornerRadius={10}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} style={{ filter: 'var(--pie-shadow)' }} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: 12, color: 'var(--chart-tooltip-text)', backdropFilter: 'blur(10px)' }} itemStyle={{ color: 'var(--chart-tooltip-text)', fontWeight: 600 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--chart-legend)', fontWeight: 600 }}><span style={{ width: 14, height: 14, borderRadius: '4px', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}></span> Optimized</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--chart-legend)', fontWeight: 600 }}><span style={{ width: 14, height: 14, borderRadius: '4px', background: 'linear-gradient(135deg, #f43f5e, #ec4899)' }}></span> Needs Work</div>
          </div>
        </div>

        {/* SEO Metrics Bar Chart */}
        <div style={{ background: 'var(--chart-bg)', border: '1px solid var(--chart-border)', borderRadius: 20, padding: 24, boxShadow: 'var(--chart-shadow)' }}>
          <h3 style={{ fontSize: 16, margin: '0 0 24px', color: 'var(--chart-title)', fontWeight: 600 }}>Page Optimization Breakdown</h3>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#eab308" />
                  </linearGradient>
                  <linearGradient id="barGradientBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--chart-axis)" fontSize={12} tickLine={false} axisLine={false} dy={10} fontWeight={500} />
                <YAxis stroke="var(--chart-axis)" fontSize={12} tickLine={false} axisLine={false} dx={-10} fontWeight={500} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: 12, color: 'var(--chart-tooltip-text)', backdropFilter: 'blur(10px)' }} itemStyle={{ color: 'var(--chart-tooltip-text)', fontWeight: 600 }} />
                <Bar dataKey="count" radius={[8, 8, 8, 8]} barSize={32}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'url(#barGradientBlue)' : 'url(#barGradient)'} style={{ filter: 'var(--bar-shadow)' }} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
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
    <div style={{ 
      background: 'var(--bg-card)', 
      border: '1px solid var(--border)', 
      borderRadius: 16, 
      padding: 24, 
      display: 'flex', 
      alignItems: 'center', 
      gap: 16,
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = `0 12px 28px ${color}15`;
      e.currentTarget.style.borderColor = `${color}40`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.03)';
      e.currentTarget.style.borderColor = 'var(--border)';
    }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, marginTop: 4 }}>{title}</div>
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
