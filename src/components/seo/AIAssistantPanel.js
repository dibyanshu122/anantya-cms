import { useState } from 'react';
import { FiCpu, FiRefreshCw, FiCheck } from 'react-icons/fi';

export default function AIAssistantPanel({ content, focusKeyword, onApplyMeta, onApplyKeywords }) {
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [loadingKw, setLoadingKw] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  
  const [suggestedMeta, setSuggestedMeta] = useState(null);
  const [suggestedKw, setSuggestedKw] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  
  const [error, setError] = useState('');

  const generateMeta = async () => {
    if (!content) {
      setError('Content is empty. Add some content first.');
      return;
    }
    setLoadingMeta(true);
    setError('');
    try {
      const res = await fetch('/api/ai/generate-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, focusKeyword }),
      });
      if (!res.ok) throw new Error('Failed to generate meta');
      const data = await res.json();
      setSuggestedMeta(data);
    } catch (err) {
      setError(err.message);
    }
    setLoadingMeta(false);
  };

  const generateKeywords = async () => {
    if (!focusKeyword) {
      setError('Focus Keyword is required to suggest related keywords.');
      return;
    }
    setLoadingKw(true);
    setError('');
    try {
      const res = await fetch('/api/ai/suggest-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focusKeyword }),
      });
      if (!res.ok) throw new Error('Failed to suggest keywords');
      const data = await res.json();
      setSuggestedKw(data);
    } catch (err) {
      setError(err.message);
    }
    setLoadingKw(false);
  };

  const analyzeContent = async () => {
    if (!content || !focusKeyword) {
      setError('Both Content and Focus Keyword are required for analysis.');
      return;
    }
    setLoadingAnalysis(true);
    setError('');
    try {
      const res = await fetch('/api/ai/content-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, keyword: focusKeyword }),
      });
      if (!res.ok) throw new Error('Failed to analyze content');
      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      setError(err.message);
    }
    setLoadingAnalysis(false);
  };

  return (
    <div style={{
      background: 'rgba(1, 142, 158, 0.05)',
      border: '1px solid #018E9E',
      borderRadius: '8px',
      padding: '16px',
      marginTop: '16px'
    }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0', fontSize: '14px', color: '#018E9E' }}>
        <FiCpu /> AI SEO Assistant
      </h3>

      {error && <div style={{ color: '#EF4444', fontSize: '12px', marginBottom: '12px' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <button
          onClick={generateMeta}
          disabled={loadingMeta}
          style={{
            padding: '8px', borderRadius: '6px', background: '#018E9E', color: '#fff',
            border: 'none', cursor: loadingMeta ? 'not-allowed' : 'pointer', fontSize: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}
        >
          {loadingMeta ? <FiRefreshCw className="spin" /> : 'Generate Meta Tags'}
        </button>
        <button
          onClick={generateKeywords}
          disabled={loadingKw}
          style={{
            padding: '8px', borderRadius: '6px', background: 'transparent', color: '#018E9E',
            border: '1px solid #018E9E', cursor: loadingKw ? 'not-allowed' : 'pointer', fontSize: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}
        >
          {loadingKw ? <FiRefreshCw className="spin" /> : 'Suggest LSI Keywords'}
        </button>
        <button
          onClick={analyzeContent}
          disabled={loadingAnalysis}
          style={{
            gridColumn: '1 / -1',
            padding: '8px', borderRadius: '6px', background: 'linear-gradient(135deg, #018E9E, #026773)', color: '#fff',
            border: 'none', cursor: loadingAnalysis ? 'not-allowed' : 'pointer', fontSize: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}
        >
          {loadingAnalysis ? <FiRefreshCw className="spin" /> : 'Analyze Content Gaps & Links'}
        </button>
      </div>

      {suggestedMeta && (
        <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)', marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>Suggested Title:</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{suggestedMeta.title}</div>
          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>Suggested Description:</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>{suggestedMeta.description}</div>
          <button
            onClick={() => onApplyMeta(suggestedMeta)}
            style={{
              padding: '6px 12px', borderRadius: '4px', background: '#22C55E', color: '#fff',
              border: 'none', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            <FiCheck /> Apply Meta Tags
          </button>
        </div>
      )}

      {suggestedKw && suggestedKw.length > 0 && (
        <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>Suggested Keywords:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {suggestedKw.map((kw, i) => (
              <span key={i} style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                {kw}
              </span>
            ))}
          </div>
          <button
            onClick={() => onApplyKeywords(suggestedKw)}
            style={{
              padding: '6px 12px', borderRadius: '4px', background: '#22C55E', color: '#fff',
              border: 'none', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            <FiCheck /> Copy to Clipboard
          </button>
        </div>
      )}

      {analysisResult && (
        <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)', marginTop: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#EF4444' }}>Content Gaps Identified:</div>
          <ul style={{ paddingLeft: '20px', margin: '0 0 16px 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            {analysisResult.gaps?.map((gap, i) => (
              <li key={i} style={{ marginBottom: '4px' }}>{gap}</li>
            ))}
          </ul>
          
          <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#22C55E' }}>Internal Link Suggestions:</div>
          {analysisResult.linkSuggestions?.map((link, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '4px', marginBottom: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Anchor: <strong>"{link.textToAnchor}"</strong></div>
              <div style={{ fontSize: '11px', color: '#018E9E', margin: '4px 0' }}>{link.url}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}><em>{link.reason}</em></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
