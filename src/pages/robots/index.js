import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { supabase } from '../../lib/supabase';
import { FiSave, FiSettings, FiClock, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

const DEFAULT_ROBOTS = `User-agent: *
Allow: /

Sitemap: https://anantya.ai/sitemap.xml`;

export default function RobotsTxtEditor() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchRobotsTxt();
  }, []);

  async function fetchRobotsTxt() {
    setLoading(true);
    const { data, error } = await supabase
      .from('robots_txt')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      toast.error('Failed to load robots.txt');
    } else {
      if (data && data.length > 0) {
        setContent(data[0].content);
        setHistory(data.slice(0, 5)); // Keep last 5 for history
      } else {
        setContent(DEFAULT_ROBOTS);
      }
    }
    setLoading(false);
  }

  const handleSave = async () => {
    setSaving(true);
    
    // In our DB schema we just insert a new row to act as version history
    const { error } = await supabase
      .from('robots_txt')
      .insert([{ 
        content,
        updated_at: new Date().toISOString()
      }]);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Robots.txt saved successfully');
      fetchRobotsTxt();
    }
    setSaving(false);
  };

  const insertSnippet = (snippet) => {
    setContent(prev => prev + (prev.endsWith('\n\n') ? '' : '\n\n') + snippet);
  };

  return (
    <AdminLayout title="Robots.txt Editor">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
        
        {/* Editor */}
        <div className="cms-card" style={{ padding: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0 }}>Edit robots.txt</h3>
              <p style={{ margin: '5px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Manage how search engines crawl your site.
              </p>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={handleSave}
              disabled={saving || loading}
            >
              <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              minHeight: '400px',
              padding: '20px',
              background: '#0a0f1d',
              color: '#38bdf8',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontFamily: 'Consolas, Monaco, monospace',
              fontSize: '14px',
              lineHeight: '1.6',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Sidebar */}
        <div>
          <div className="cms-card" style={{ padding: '20px', marginBottom: '20px' }}>
            <h4 style={{ marginTop: 0, marginBottom: '15px' }}>Quick Add Rules</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                className="btn btn-ghost" 
                style={{ justifyContent: 'flex-start' }}
                onClick={() => insertSnippet('User-agent: *\nDisallow: /admin\nDisallow: /private')}
              >
                Block Admin Folders
              </button>
              <button 
                className="btn btn-ghost"
                style={{ justifyContent: 'flex-start' }}
                onClick={() => insertSnippet('User-agent: ChatGPT-User\nDisallow: /')}
              >
                Block AI Bots (ChatGPT)
              </button>
              <button 
                className="btn btn-ghost"
                style={{ justifyContent: 'flex-start' }}
                onClick={() => insertSnippet('Sitemap: https://anantya.ai/sitemap.xml')}
              >
                Add Sitemap
              </button>
            </div>
          </div>

          <div className="cms-card" style={{ padding: '20px' }}>
            <h4 style={{ marginTop: 0, marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiClock /> Version History
            </h4>
            {history.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {history.map((h, i) => (
                  <li key={h.id} style={{ 
                    padding: '10px 0', 
                    borderBottom: i !== history.length - 1 ? '1px solid var(--border)' : 'none',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}>
                    {i === 0 ? <FiCheck color="var(--success)" style={{ marginTop: '3px' }}/> : <div style={{width: 14}}></div>}
                    <div>
                      <div style={{ fontSize: '0.9rem', color: i === 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {new Date(h.updated_at).toLocaleString()}
                      </div>
                      {i === 0 && <span style={{ fontSize: '0.75rem', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', padding: '2px 6px', borderRadius: '4px' }}>Current</span>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>No history available.</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
