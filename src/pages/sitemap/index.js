import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { supabase } from '../../lib/supabase';
import { FiMap, FiRefreshCw, FiGlobe, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function SitemapGenerator() {
  const [loading, setLoading] = useState(false);
  const [sitemapData, setSitemapData] = useState(null);
  const [lastGenerated, setLastGenerated] = useState(null);
  
  useEffect(() => {
    fetchSitemapStatus();
  }, []);

  async function fetchSitemapStatus() {
    // Note: since we're generating this dynamically, we can just fetch the most recent log
    const { data } = await supabase
      .from('sitemap_logs')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();
      
    if (data) {
      setLastGenerated(data);
    }
  }

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sitemap/generate', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to generate sitemap');
      
      setSitemapData(data.xml);
      toast.success(`Sitemap generated with ${data.urlCount} URLs!`);
      fetchSitemapStatus();
    } catch (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };

  return (
    <AdminLayout title="XML Sitemap">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
        
        {/* Main Content */}
        <div className="cms-card" style={{ padding: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '25px' }}>
            <div style={{ flex: '1 1 300px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '5px' }}>Generate Sitemap</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '600px' }}>
                Create an up-to-date sitemap.xml file containing all your active pages and published blogs.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a href="/api/sitemap/html" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: '1rem' }}>
                <FiGlobe /> HTML Sitemap
              </a>
              <button 
                className="btn btn-primary" 
                onClick={handleGenerate}
                disabled={loading}
                style={{ padding: '12px 24px', fontSize: '1rem' }}
              >
                {loading ? (
                  <><FiRefreshCw className="spin" /> Generating...</>
                ) : (
                  <><FiMap /> Generate XML Sitemap</>
                )}
              </button>
            </div>
          </div>

          {sitemapData && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0 }}>Generated XML Preview</h4>
                <a 
                  href={`data:text/xml;charset=utf-8,${encodeURIComponent(sitemapData)}`}
                  download="sitemap.xml"
                  className="btn btn-ghost"
                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                >
                  Download sitemap.xml
                </a>
              </div>
              <pre style={{ 
                background: 'rgba(0,0,0,0.3)', 
                padding: '20px', 
                borderRadius: '8px', 
                overflowX: 'auto',
                border: '1px solid var(--border)',
                color: 'var(--primary)',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                maxHeight: '400px'
              }}>
                {sitemapData}
              </pre>
            </div>
          )}
        </div>

        {/* Sidebar Status */}
        <div>
          <div className="cms-card" style={{ padding: '20px', marginBottom: '20px' }}>
            <h4 style={{ marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiGlobe /> Sitemap Status
            </h4>
            
            {lastGenerated ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', color: 'var(--success)' }}>
                  <FiCheckCircle size={20} />
                  <span style={{ fontWeight: 600 }}>Active & Available</span>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Last Generated</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
                    <FiClock color="var(--text-muted)" />
                    {new Date(lastGenerated.generated_at).toLocaleString()}
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Total URLs</label>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                    {lastGenerated.url_count}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '20px 0' }}>
                <FiAlertCircle size={30} opacity={0.5} />
                <span style={{ fontSize: '0.9rem', textAlign: 'center' }}>No sitemap has been generated yet.</span>
              </div>
            )}
          </div>
          
          <div className="cms-card" style={{ padding: '20px', background: 'rgba(1, 142, 158, 0.05)', border: '1px solid rgba(1, 142, 158, 0.2)' }}>
            <h4 style={{ marginTop: 0, color: 'var(--primary)' }}>How it works</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              The generator automatically scans your <strong>seo_pages</strong> and <strong>published blogs</strong>. It combines them and assigns default priorities based on the page type (e.g. Homepage gets 1.0, blogs get 0.7).
            </p>
          </div>
        </div>
        
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </AdminLayout>
  );
}
