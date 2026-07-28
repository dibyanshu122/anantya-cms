import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { supabase } from '../../lib/supabase';
import { FiSave, FiSettings, FiClock, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { triggerBuild } from '../../lib/triggerBuild';

const DEFAULT_LLMS = `# Anantya.ai

Anantya.ai is a comprehensive WhatsApp Business API platform designed to help businesses automate, market, and support their customers directly on WhatsApp.

## Features
- **WhatsApp Broadcasting & Marketing:** Send targeted bulk promotional messages, updates, and alerts to customers.
- **WhatsApp Automation & Chatbots:** Build intelligent chatbots for 24/7 customer support, lead generation, and workflow automation.
- **Shared Team Inbox:** Manage customer queries collaboratively with multi-agent support.
- **Click-to-WhatsApp Ads:** Connect Meta advertising directly to your WhatsApp inbox to increase conversions.
- **Integrations:** Connect seamlessly with CRM systems, Shopify, WooCommerce, Zapier, and more.
- **Analytics & Reporting:** Track message delivery, read receipts, engagement rates, and ROI.

## Links
- Website: https://anantya.ai
- Blog: https://anantya.ai/blog
- Pricing: https://anantya.ai/pricing

*Generated automatically for AI assistants and LLMs.*
`;

export default function LlmsTxtEditor() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchLlmsTxt();
  }, []);

  async function fetchLlmsTxt() {
    setLoading(true);
    const { data, error } = await supabase
      .from('llms_txt')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load llms.txt');
    } else {
      if (data && data.length > 0) {
        setContent(data[0].content);
        setHistory(data.slice(0, 5)); // Keep last 5 for history
      } else {
        setContent(DEFAULT_LLMS);
      }
    }
    setLoading(false);
  }

  const handleSave = async () => {
    setSaving(true);
    
    // In our DB schema we just insert a new row to act as version history
    const { error } = await supabase
      .from('llms_txt')
      .insert([{ 
        content,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('llms.txt saved! Triggering build...');
      await triggerBuild();
      fetchLlmsTxt();
    }
    setSaving(false);
  };

  const insertSnippet = (snippet) => {
    setContent(prev => prev + (prev.endsWith('\n\n') ? '' : '\n\n') + snippet);
  };

  return (
    <AdminLayout title="llms.txt Editor">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
        
        {/* Editor */}
        <div className="cms-card" style={{ padding: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0 }}>Edit llms.txt</h3>
              <p style={{ margin: '5px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Manage how AI Search Engines (ChatGPT, SGE, Claude) read your site.
              </p>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={handleSave}
              disabled={saving || loading}
            >
              <FiSave /> {saving ? 'Saving...' : 'Save & Deploy'}
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
            <h4 style={{ marginTop: 0, marginBottom: '15px' }}>Quick Add Blocks</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                className="btn btn-ghost" 
                style={{ justifyContent: 'flex-start' }}
                onClick={() => insertSnippet('## Key Competitors\n- Competitor A\n- Competitor B')}
              >
                Add Competitors Block
              </button>
              <button 
                className="btn btn-ghost"
                style={{ justifyContent: 'flex-start' }}
                onClick={() => insertSnippet('## Pricing Plans\n- Basic: $X/mo\n- Pro: $Y/mo\n- Custom: Contact Sales')}
              >
                Add Pricing Block
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
                        {new Date(h.created_at || h.updated_at).toLocaleString()}
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
