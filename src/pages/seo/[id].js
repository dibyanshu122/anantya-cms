import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import AIAssistantPanel from '../../components/seo/AIAssistantPanel';
import { supabase } from '../../lib/supabase';
import {
  FiSave, FiArrowLeft, FiEye, FiImage, FiInfo, FiGlobe,
  FiTwitter, FiFacebook, FiCheckCircle, FiAlertCircle,
} from 'react-icons/fi';
import SchemaBuilder from '../../components/seo/SchemaBuilder';

const SCHEMA_TYPES = [
  'None', 'Article', 'BlogPosting', 'Organization', 'WebSite', 'WebPage',
  'Product', 'FAQPage', 'HowTo', 'BreadcrumbList', 'LocalBusiness', 'Service',
];

const ROBOTS_INDEX = ['index', 'noindex'];
const ROBOTS_FOLLOW = ['follow', 'nofollow'];

const CHAR_TARGETS = { seo_title: { min: 50, max: 60 }, seo_description: { min: 150, max: 160 } };

function CharCounter({ value = '', field }) {
  const len = value.length;
  const { min, max } = CHAR_TARGETS[field] || { min: 0, max: 999 };
  const color = len === 0 ? 'var(--text-muted)' : len < min ? '#F59E0B' : len <= max ? '#22C55E' : '#EF4444';
  return (
    <span style={{ fontSize: 11, color, fontWeight: 600 }}>
      {len}/{max}
      {len > 0 && (len < min ? ' (too short)' : len > max ? ' (too long)' : ' ✓')}
    </span>
  );
}

function OgPreview({ title, description, imageUrl, url }) {
  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden',
      background: 'var(--bg-base)', maxWidth: 500,
    }}>
      <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <FiFacebook size={14} color="#1877f2" />
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Open Graph Preview</span>
      </div>
      {imageUrl && (
        <img src={imageUrl} alt="OG Preview" onError={e => e.target.style.display = 'none'}
          style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
      )}
      {!imageUrl && (
        <div style={{ width: '100%', height: 160, background: 'rgba(1,142,158,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FiImage size={32} color="var(--text-muted)" />
        </div>
      )}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 11, color: '#018E9E', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {url || 'anantya.ai'}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.3 }}>
          {title || 'Page Title'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {description || 'Page description will appear here.'}
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

function FormRow({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '9px 12px', background: 'var(--bg-base)',
  border: '1px solid var(--border)', borderRadius: 8,
  color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box',
};

const selectStyle = {
  ...inputStyle, appearance: 'none', cursor: 'pointer',
};

export default function SeoEditor() {
  const router = useRouter();
  const { id } = router.query;
  const isNew = id === 'new';

  const [form, setForm] = useState({
    page_name: '', page_path: '', seo_title: '', seo_description: '',
    focus_keyword: '', canonical_url: '', custom_slug: '',
    robots_index: 'index', robots_follow: 'follow',
    og_title: '', og_description: '', og_image: '',
    twitter_image: '', breadcrumb_title: '', schema_type: 'None',
    schema_json: ''
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!id || isNew) return;
    supabase.from('seo_pages').select('*').eq('id', id).single().then(({ data, error }) => {
      if (error) showToast(error.message, 'error');
      else if (data) setForm(f => ({ ...f, ...data }));
      setLoading(false);
    });
  }, [id, isNew]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.seo_title.trim()) return showToast('SEO Title is required.', 'error');
    setSaving(true);
    const payload = { ...form, updated_at: new Date().toISOString() };
    let error;
    if (isNew) {
      const result = await supabase.from('seo_pages').insert([payload]);
      error = result.error;
    } else {
      const result = await supabase.from('seo_pages').update(payload).eq('id', id);
      error = result.error;
    }
    if (error) showToast(error.message, 'error');
    else { showToast('SEO page saved successfully!'); if (isNew) router.push('/seo'); }
    setSaving(false);
  };

  if (loading) {
    return (
      <AdminLayout title="SEO Editor">
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
      </AdminLayout>
    );
  }

  const titleScore = form.seo_title.length >= 50 && form.seo_title.length <= 60;
  const descScore = form.seo_description.length >= 150 && form.seo_description.length <= 160;
  const kwInTitle = form.focus_keyword && form.seo_title.toLowerCase().includes(form.focus_keyword.toLowerCase());
  const healthScore = [titleScore, descScore, !!form.focus_keyword, kwInTitle, !!form.og_image].filter(Boolean).length;

  return (
    <AdminLayout title={`SEO Editor${form.page_name ? ` — ${form.page_name}` : ''}`}>
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

      {/* Top Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12 }}>
        <button onClick={() => router.back()} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
          color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13,
        }}>
          <FiArrowLeft size={14} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            background: `rgba(${healthScore >= 4 ? '34,197,94' : healthScore >= 2 ? '245,158,11' : '239,68,68'},0.12)`,
            border: `1px solid rgba(${healthScore >= 4 ? '34,197,94' : healthScore >= 2 ? '245,158,11' : '239,68,68'},0.25)`,
            borderRadius: 8, fontSize: 12, fontWeight: 600,
            color: healthScore >= 4 ? '#22C55E' : healthScore >= 2 ? '#F59E0B' : '#EF4444',
          }}>
            {healthScore >= 4 ? <FiCheckCircle size={13} /> : <FiAlertCircle size={13} />}
            SEO Health: {healthScore}/5
          </div>
          <button onClick={handleSave} disabled={saving} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px',
            background: '#018E9E', border: 'none', borderRadius: 8, color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}>
            <FiSave size={14} /> {saving ? 'Saving…' : 'Save SEO'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
        <div>
          {/* Page Info */}
          <SectionCard title="Page Information">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FormRow label="Page Name">
                <input value={form.page_name} onChange={e => set('page_name', e.target.value)}
                  placeholder="e.g. About Us" style={inputStyle} />
              </FormRow>
              <FormRow label="Page Path">
                <input value={form.page_path} onChange={e => set('page_path', e.target.value)}
                  placeholder="/about" style={inputStyle} />
              </FormRow>
            </div>
          </SectionCard>

          {/* Core SEO */}
          <SectionCard title="Core SEO Fields">
            <AIAssistantPanel 
              content={`SEO for page: ${form.page_name}`} 
              focusKeyword={form.focus_keyword}
              onApplyMeta={(meta) => setForm(f => ({ ...f, seo_title: meta.title, seo_description: meta.description }))}
              onApplyKeywords={(kws) => setForm(f => ({ ...f, focus_keyword: kws.join(', ') }))}
            />
            <FormRow label="SEO Title" hint="Ideal: 50–60 characters">
              <input value={form.seo_title} onChange={e => set('seo_title', e.target.value)}
                placeholder="Enter SEO title…" style={inputStyle} maxLength={80} />
              <div style={{ marginTop: 4 }}><CharCounter value={form.seo_title} field="seo_title" /></div>
            </FormRow>
            <FormRow label="Meta Description" hint="Ideal: 150–160 characters">
              <textarea value={form.seo_description} onChange={e => set('seo_description', e.target.value)}
                placeholder="Enter meta description…" rows={3}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} maxLength={200} />
              <div style={{ marginTop: 4 }}><CharCounter value={form.seo_description} field="seo_description" /></div>
            </FormRow>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FormRow label="Focus Keyword">
                <input value={form.focus_keyword} onChange={e => set('focus_keyword', e.target.value)}
                  placeholder="e.g. whatsapp chatbot" style={inputStyle} />
              </FormRow>
              <FormRow label="Custom Slug">
                <input value={form.custom_slug} onChange={e => set('custom_slug', e.target.value)}
                  placeholder="e.g. about-us" style={inputStyle} />
              </FormRow>
              <FormRow label="Canonical URL">
                <input value={form.canonical_url} onChange={e => set('canonical_url', e.target.value)}
                  placeholder="https://anantya.ai/page" style={inputStyle} />
              </FormRow>
              <FormRow label="Breadcrumb Title">
                <input value={form.breadcrumb_title} onChange={e => set('breadcrumb_title', e.target.value)}
                  placeholder="Short nav title" style={inputStyle} />
              </FormRow>
            </div>
          </SectionCard>

          {/* Robots */}
          <SectionCard title="Robots & Indexing">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <FormRow label="Index Directive">
                <select value={form.robots_index} onChange={e => set('robots_index', e.target.value)} style={selectStyle}>
                  {ROBOTS_INDEX.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </FormRow>
              <FormRow label="Follow Directive">
                <select value={form.robots_follow} onChange={e => set('robots_follow', e.target.value)} style={selectStyle}>
                  {ROBOTS_FOLLOW.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </FormRow>
              <FormRow label="Schema Type">
                <select value={form.schema_type} onChange={e => set('schema_type', e.target.value)} style={selectStyle}>
                  {SCHEMA_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </FormRow>
            </div>
            <div style={{
              padding: '10px 14px', background: 'var(--bg-base)', border: '1px solid var(--border)',
              borderRadius: 8, fontFamily: 'monospace', fontSize: 12, color: '#018E9E', marginBottom: 20
            }}>
              Meta Robots: <strong>{form.robots_index}, {form.robots_follow}</strong>
            </div>
            
            <SchemaBuilder 
              schemaType={form.schema_type} 
              initialSchema={form.schema_json} 
              onChange={(json) => set('schema_json', json)} 
            />
          </SectionCard>

          {/* OG / Social */}
          <SectionCard title="Open Graph & Social">
            <FormRow label="OG Title">
              <input value={form.og_title} onChange={e => set('og_title', e.target.value)}
                placeholder="Leave blank to use SEO Title" style={inputStyle} />
            </FormRow>
            <FormRow label="OG Description">
              <textarea value={form.og_description} onChange={e => set('og_description', e.target.value)}
                placeholder="Leave blank to use Meta Description" rows={2}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
            </FormRow>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FormRow label="OG Image URL">
                <input value={form.og_image} onChange={e => set('og_image', e.target.value)}
                  placeholder="https://…/og-image.jpg" style={inputStyle} />
              </FormRow>
              <FormRow label="Twitter Card Image URL">
                <input value={form.twitter_image} onChange={e => set('twitter_image', e.target.value)}
                  placeholder="https://…/twitter-card.jpg" style={inputStyle} />
              </FormRow>
            </div>
          </SectionCard>
        </div>

        {/* Right Panel */}
        <div>
          {/* OG Preview */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                <FiEye size={14} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Social Preview
              </h3>
            </div>
            <div style={{ padding: 20 }}>
              <OgPreview
                title={form.og_title || form.seo_title}
                description={form.og_description || form.seo_description}
                imageUrl={form.og_image}
                url={form.canonical_url || form.page_path}
              />
            </div>
          </div>

          {/* SEO Checklist */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>SEO Checklist</h3>
            </div>
            <div style={{ padding: 20 }}>
              {[
                { label: 'SEO Title (50–60 chars)', ok: titleScore },
                { label: 'Meta Description (150–160 chars)', ok: descScore },
                { label: 'Focus Keyword set', ok: !!form.focus_keyword },
                { label: 'Keyword in SEO Title', ok: kwInTitle },
                { label: 'OG Image set', ok: !!form.og_image },
                { label: 'Canonical URL set', ok: !!form.canonical_url },
                { label: 'Schema Type set', ok: form.schema_type !== 'None' },
              ].map(({ label, ok }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  {ok
                    ? <FiCheckCircle size={14} color="#22C55E" />
                    : <FiAlertCircle size={14} color="#F59E0B" />}
                  <span style={{ fontSize: 12, color: ok ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
