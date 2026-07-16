import React, { useState } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/layout/AdminLayout';
import { FiSearch, FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi';

export default function SeoAnalyzer() {
  const [inputType, setInputType] = useState('text'); // 'text' or 'url'
  const [inputValue, setInputValue] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);

  const analyzeContent = () => {
    if (!inputValue.trim()) return;
    setAnalyzing(true);
    
    // In a real app with 'url' type, we would fetch the HTML via an API route.
    // For Phase 1 (Static CMS), we are doing direct client-side analysis of raw HTML/text.
    
    setTimeout(() => {
      // 1. Strip HTML tags for plain text length
      const plainText = inputValue.replace(/<[^>]+>/g, ' ');
      const wordCount = plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
      
      // 2. Look for Headings
      const hasH1 = /<h1[^>]*>/.test(inputValue);
      const h1Count = (inputValue.match(/<h1[^>]*>/g) || []).length;
      const hasH2 = /<h2[^>]*>/.test(inputValue);

      // 3. Look for images & alt tags
      const images = inputValue.match(/<img[^>]*>/g) || [];
      const imagesWithoutAlt = images.filter(img => !/alt=["'][^"']+["']/.test(img));

      // 4. Look for links
      const links = inputValue.match(/<a[^>]*href=["'][^"']+["'][^>]*>/gi) || [];
      const internalLinks = links.filter(link => {
        const href = link.match(/href=["']([^"']+)["']/i);
        if (!href) return false;
        return href[1].startsWith('/') || href[1].includes('anantya.ai');
      });

      const checks = [
        {
          id: 'wordCount',
          label: 'Word count should be > 300 words',
          status: wordCount >= 300 ? 'passed' : wordCount > 0 ? 'warning' : 'failed',
          value: `${wordCount} words`
        },
        {
          id: 'h1',
          label: 'Exactly one H1 tag',
          status: h1Count === 1 ? 'passed' : 'failed',
          value: h1Count === 0 ? 'Missing H1' : h1Count === 1 ? '1 H1 tag found' : `${h1Count} H1 tags found (too many)`
        },
        {
          id: 'h2',
          label: 'Use H2 subheadings',
          status: hasH2 ? 'passed' : 'warning',
          value: hasH2 ? 'H2 tags found' : 'No H2 tags found'
        },
        {
          id: 'images',
          label: 'All images have ALT text',
          status: images.length === 0 ? 'passed' : imagesWithoutAlt.length === 0 ? 'passed' : 'failed',
          value: images.length === 0 ? 'No images' : `${imagesWithoutAlt.length} of ${images.length} images missing alt text`
        },
        {
          id: 'links',
          label: 'Internal linking (>= 2 links)',
          status: internalLinks.length >= 2 ? 'passed' : internalLinks.length > 0 ? 'warning' : 'failed',
          value: `${internalLinks.length} internal links found`
        }
      ];

      const passed = checks.filter(c => c.status === 'passed').length;
      const score = Math.round((passed / checks.length) * 100);

      setResults({ score, checks });
      setAnalyzing(false);
    }, 800); // Simulate network/processing delay
  };

  return (
    <AdminLayout title="SEO Content Analyzer">
      <Head><title>SEO Analyzer | Anantya CMS</title></Head>

      <div className="dash-grid" style={{ gridTemplateColumns: '1fr', maxWidth: 800 }}>
        <div className="cms-card">
          <h2 style={{ margin: '0 0 16px 0', fontSize: 18 }}>Analyze Content SEO</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
            Paste your raw HTML or Markdown content below to instantly analyze its structure, headings, links, and word count against Anantya's SEO best practices.
          </p>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <button 
              className={`btn ${inputType === 'text' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setInputType('text')}
            >
              Paste Content
            </button>
            <button 
              className={`btn ${inputType === 'url' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setInputType('url')}
            >
              Fetch from URL
            </button>
          </div>

          {inputType === 'text' ? (
            <textarea
              className="form-input"
              rows={10}
              placeholder="Paste raw HTML content here..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: 13 }}
            />
          ) : (
            <input
              type="url"
              className="form-input"
              placeholder="https://anantya.ai/blog/..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
            />
          )}

          <div style={{ marginTop: 20 }}>
            <button className="btn btn-primary" onClick={analyzeContent} disabled={analyzing || !inputValue.trim()}>
              <FiSearch size={16} style={{ marginRight: 8 }} />
              {analyzing ? 'Analyzing...' : 'Run Analyzer'}
            </button>
          </div>
        </div>

        {results && (
          <div className="cms-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Analysis Results</h3>
              <div style={{ 
                fontSize: 28, fontWeight: 700, 
                color: results.score >= 80 ? 'var(--success)' : results.score >= 50 ? 'var(--warning)' : 'var(--danger)' 
              }}>
                {results.score}/100
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {results.checks.map(check => (
                <div key={check.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ marginTop: 2 }}>
                    {check.status === 'passed' ? (
                      <FiCheckCircle color="var(--success)" size={18} />
                    ) : check.status === 'warning' ? (
                      <FiAlertCircle color="var(--warning)" size={18} />
                    ) : (
                      <FiXCircle color="var(--danger)" size={18} />
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{check.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{check.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
