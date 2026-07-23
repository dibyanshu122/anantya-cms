import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminLayout from '../../components/layout/AdminLayout';
import TipTapEditor from '../../components/blog/TipTapEditor';
import SeoScoreWidget from '../../components/seo/SeoScoreWidget';
import AIAssistantPanel from '../../components/seo/AIAssistantPanel';
import { FiSave, FiCheck, FiArrowLeft, FiImage } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import { triggerBuild } from '../../lib/triggerBuild';
import slugify from 'slugify';
import toast from 'react-hot-toast';
import MediaSelector from '../../components/common/MediaSelector';

export default function EditBlog() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Blog Content
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [featuredImageAlt, setFeaturedImageAlt] = useState('');
  const [featuredImageTitle, setFeaturedImageTitle] = useState('');
  const [featuredImageCaption, setFeaturedImageCaption] = useState('');

  // Missing Fields
  const [showRevisions, setShowRevisions] = useState(false);
  const [revisions, setRevisions] = useState([]);
  const [categoryIds, setCategoryIds] = useState([]);
  const [tagIds, setTagIds] = useState([]);
  const [authorId, setAuthorId] = useState('');
  const [faqs, setFaqs] = useState([]);
  const [allBlogsList, setAllBlogsList] = useState([]);
  
  // Blog Options
  const [isFeatured, setIsFeatured] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [estimatedReadTime, setEstimatedReadTime] = useState(0);
  const [allowComments, setAllowComments] = useState(true);
  
  // Lists from DB
  const [authorsList, setAuthorsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [tagsList, setTagsList] = useState([]);

  // SEO Info
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [seoScore, setSeoScore] = useState(0);

  // OG Tags
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  const [ogImage, setOgImage] = useState('');

  // Meta Info
  const [status, setStatus] = useState('draft');

  useEffect(() => {
    if (!id) return;
    const fetchBlog = async () => {
      try {
        const [blogRes, authorsRes, catRes, tagRes, blogCatsRes, blogTagsRes, allBlogsRes] = await Promise.all([
          supabase.from('blogs').select('*').eq('id', id).single(),
          supabase.from('authors').select('id, name').order('name'),
          supabase.from('categories').select('id, name').order('name'),
          supabase.from('tags').select('id, name').order('name'),
          id !== 'new' ? supabase.from('blog_categories').select('category_id').eq('blog_id', id) : { data: [] },
          id !== 'new' ? supabase.from('blog_tags').select('tag_id').eq('blog_id', id) : { data: [] },
          supabase.from('blogs').select('id, title').order('title')
        ]);

        if (blogRes.error && id !== 'new') throw blogRes.error;
        
        setAuthorsList(authorsRes.data || []);
        setCategoriesList(catRes.data || []);
        setTagsList(tagRes.data || []);
        setAllBlogsList(allBlogsRes.data || []);

        if (id !== 'new' && blogRes.data) {
          const data = blogRes.data;
          setTitle(data.title || '');
          setSlug(data.slug || '');
          setContent(data.content || '');
          setExcerpt(data.excerpt || '');
          setStatus(data.status || 'draft');
          setFeaturedImage(data.featured_image_url || data.featured_image?.url || '');
          setFeaturedImageAlt(data.featured_image_alt || data.featured_image?.alt || '');
          setFeaturedImageTitle(data.featured_image_title || '');
          setFeaturedImageCaption(data.featured_image_caption || '');
          setAuthorId(data.author_id || '');
          setAllowComments(data.allow_comments !== false);
          setEstimatedReadTime(data.estimated_read_time || 0);
          setCategoryIds(blogCatsRes.data?.map(c => c.category_id) || []);
          setTagIds(blogTagsRes.data?.map(t => t.tag_id) || []);

          // Fetch revisions and FAQs
          const { data: revData } = await supabase.from('blog_revisions').select('*').eq('blog_id', id).order('created_at', { ascending: false });
          if (revData) setRevisions(revData);

          const { data: faqsData } = await supabase.from('blog_faqs').select('*').eq('blog_id', id).order('sort_order');
          if (faqsData) setFaqs(faqsData);
          
          setIsFeatured(data.is_featured || false);
          setIsSticky(data.is_sticky || false);
          setScheduledAt(data.scheduled_at ? data.scheduled_at.slice(0, 16) : '');
          setEstimatedReadTime(data.estimated_read_time || 0);
          setSeoTitle(data.seo_title || '');
          setSeoDescription(data.seo_description || '');
          setFocusKeyword(data.focus_keyword || '');
          setCanonicalUrl(data.canonical_url || '');
          setOgTitle(data.og_title || '');
          setOgDescription(data.og_description || '');
          setOgImage(data.og_image || '');
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load blog');
      } finally {
        setFetching(false);
      }
    };
    fetchBlog();
  }, [id]);

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    if (!slug || slug === slugify(title.slice(0, -1), { lower: true, strict: true })) {
      setSlug(slugify(val, { lower: true, strict: true }));
    }
  };

  const handleAutoSave = async () => {
    if (!title || id === 'new' || status === 'published') return;
    try {
      const finalSlug = slug || slugify(title, { lower: true, strict: true });
      const textContent = content.replace(/<[^>]+>/g, ' ');
      const wordCount = textContent.trim().split(/\s+/).length;
      const calcReadTime = Math.ceil(wordCount / 200);
      
      const payload = {
        title, slug: finalSlug, content, excerpt, status,
        featured_image_url: featuredImage || null,
        featured_image_alt: featuredImageAlt || title,
        featured_image_title: featuredImageTitle || null,
        featured_image_caption: featuredImageCaption || null,
        featured_image: featuredImage ? { url: featuredImage, alt: featuredImageAlt || title } : null,
        author_id: authorId || null,
        is_featured: isFeatured, is_sticky: isSticky, allow_comments: allowComments,
        scheduled_at: scheduledAt || null,
        estimated_read_time: estimatedReadTime || calcReadTime,
        seo_title: seoTitle || title, seo_description: seoDescription || excerpt,
        focus_keyword: focusKeyword || null, canonical_url: canonicalUrl || null,
        seo_score: seoScore, og_title: ogTitle || null, og_description: ogDescription || null, og_image: ogImage || null,
      };
      await supabase.from('blogs').update(payload).eq('id', id);
    } catch (e) {
      console.error('Auto-save failed:', e);
    }
  };

  useEffect(() => {
    if (id === 'new' || !title || status === 'published') return;
    const timeout = setTimeout(() => {
      handleAutoSave();
    }, 15000);
    return () => clearTimeout(timeout);
  }, [title, content, excerpt, status, featuredImage, seoTitle, seoDescription, focusKeyword]);


  const [mediaTarget, setMediaTarget] = useState(null);

  const handleMediaSelect = (url) => {
    if (mediaTarget === 'featured') setFeaturedImage(url);
    if (mediaTarget === 'og') setOgImage(url);
    setMediaTarget(null);
  };

  const handleSave = async (saveStatus = status) => {
    if (!title) {
      toast.error('Title is required');
      return;
    }
    
    setLoading(true);
    const finalSlug = slug || slugify(title, { lower: true, strict: true });
    
    const textContent = content.replace(/<[^>]+>/g, ' ');
    const wordCount = textContent.trim().split(/\s+/).length;
    const calcReadTime = Math.ceil(wordCount / 200);
    
    try {
      const payload = {
        title,
        slug: finalSlug,
        content,
        excerpt,
        status: saveStatus,
        featured_image_url: featuredImage || null,
        featured_image_alt: featuredImageAlt || title,
        featured_image_title: featuredImageTitle || null,
        featured_image_caption: featuredImageCaption || null,
        featured_image: featuredImage ? { url: featuredImage, alt: featuredImageAlt || title } : null,
        author_id: authorId || null,
        is_featured: isFeatured,
        is_sticky: isSticky,
        allow_comments: allowComments,
        scheduled_at: scheduledAt || null,
        estimated_read_time: estimatedReadTime || calcReadTime,
        seo_title: seoTitle || title,
        seo_description: seoDescription || excerpt,
        focus_keyword: focusKeyword || null,
        canonical_url: canonicalUrl || null,
        seo_score: seoScore,
        og_title: ogTitle || null,
        og_description: ogDescription || null,
        og_image: ogImage || null,
      };
      
      if (saveStatus === 'published' && status !== 'published') {
        payload.published_at = new Date().toISOString();
      }

      let savedBlogId = id;
      
      if (id === 'new') {
        const { data, error } = await supabase.from('blogs').insert([payload]).select().single();
        if (error) throw error;
        savedBlogId = data.id;
      } else {
        const { error } = await supabase.from('blogs').update(payload).eq('id', id);
        if (error) throw error;
      }
      
      if (savedBlogId) {
        await supabase.from('blog_categories').delete().eq('blog_id', savedBlogId);
        if (categoryIds.length > 0) {
          const catInserts = categoryIds.map(cid => ({ blog_id: savedBlogId, category_id: cid }));
          await supabase.from('blog_categories').insert(catInserts);
        }

        await supabase.from('blog_tags').delete().eq('blog_id', savedBlogId);
        if (tagIds.length > 0) {
          const tagInserts = tagIds.map(tid => ({ blog_id: savedBlogId, tag_id: tid }));
          await supabase.from('blog_tags').insert(tagInserts);
        }

        await supabase.from('blog_faqs').delete().eq('blog_id', savedBlogId);
        if (faqs.length > 0) {
          const faqInserts = faqs.map((f, i) => ({
            blog_id: savedBlogId,
            question: f.question,
            answer: f.answer,
            sort_order: i
          }));
          await supabase.from('blog_faqs').insert(faqInserts);
        }

        await supabase.from('blog_revisions').insert([{
          blog_id: savedBlogId,
          content,
          title
        }]);
      }

      toast.success(saveStatus === 'published' ? 'Blog published!' : 'Draft saved!');
      
      // Trigger build if we are publishing, OR if we are unpublishing (saving a live blog as draft)
      if (saveStatus === 'published' || (status === 'published' && saveStatus === 'draft')) {
        triggerBuild();
      }
      
      router.push('/blogs');
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Failed to update blog');
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async () => {
    const prompt = window.prompt("What should the AI write about?");
    if (!prompt) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: 'generate' })
      });
      if (!res.ok) throw new Error('AI Generation failed');
      const data = await res.json();
      setContent(prev => prev + '\n\n' + data.content);
      toast.success('Content generated!');
    } catch (e) {
      toast.error('AI error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <AdminLayout title="Edit Blog Post">
        <div style={{ padding: 20 }}>Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Edit Blog Post">
      <Head><title>Edit Blog Post | Anantya CMS</title></Head>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 24 }}>{id === 'new' ? 'Create Post' : 'Edit Post'}</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          {id !== 'new' && (
            <button onClick={() => setShowRevisions(true)} className="btn btn-secondary">
              Revisions ({revisions.length})
            </button>
          )}
          <button onClick={() => handleSave('draft')} disabled={loading} className="btn btn-ghost">
            <FiSave size={16} /> Save Draft
          </button>
          <button onClick={() => handleSave('published')} disabled={loading} className="btn btn-primary">
            <FiCheck size={16} /> Publish
          </button>
        </div>
      </div>

      <div className="dash-grid" style={{ gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="cms-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <input type="text" placeholder="Blog Post Title" value={title} onChange={handleTitleChange} style={{ flex: 1, fontSize: 24, fontWeight: 700, background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none' }} />
              <button onClick={generateContent} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'linear-gradient(135deg, #018E9E, #026773)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>✨ AI Write</button>
            </div>
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Permalink: /blog/</span>
              <input type="text" value={slug} onChange={e => setSlug(e.target.value)} className="form-input" style={{ flex: 1, padding: '4px 8px', fontSize: 13, height: 'auto' }} />
            </div>
            <TipTapEditor content={content} onChange={setContent} />
          </div>

          <div className="cms-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="form-label">Author</label>
              <select className="form-input" value={authorId} onChange={e => setAuthorId(e.target.value)}>
                <option value="">Select Author...</option>
                {authorsList.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Categories</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {categoriesList.map(c => (
                  <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', border: '1px solid var(--border)' }}>
                    <input type="checkbox" checked={categoryIds.includes(c.id)} onChange={(e) => { if (e.target.checked) setCategoryIds(prev => [...prev, c.id]); else setCategoryIds(prev => prev.filter(id => id !== c.id)); }} />
                    {c.name}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Tags</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {tagsList.map(t => (
                  <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', border: '1px solid var(--border)' }}>
                    <input type="checkbox" checked={tagIds.includes(t.id)} onChange={(e) => { if (e.target.checked) setTagIds(prev => [...prev, t.id]); else setTagIds(prev => prev.filter(id => id !== t.id)); }} />
                    {t.name}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="cms-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} /> Mark as Featured Post
              </label>
            </div>
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={isSticky} onChange={e => setIsSticky(e.target.checked)} /> Stick to Top of Blog
              </label>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={allowComments} onChange={e => setAllowComments(e.target.checked)} /> Enable Comments
              </label>
            </div>
            <div>
              <label className="form-label">Read Time (minutes)</label>
              <input type="number" min="0" placeholder="Auto-calculated if 0" className="form-input" value={estimatedReadTime || ''} onChange={e => setEstimatedReadTime(parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label className="form-label">Schedule Post</label>
              <input type="datetime-local" className="form-input" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
            </div>
          </div>

          <div className="cms-card">
            <h4 style={{ margin: '0 0 12px 0', fontSize: 14 }}>Excerpt</h4>
            <textarea className="form-input" rows={3} placeholder="Write a short summary..." value={excerpt} onChange={e => setExcerpt(e.target.value)} />
          </div>

          <div className="cms-card">
            <h4 style={{ margin: '0 0 16px 0', fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              FAQ Section
              <button 
                type="button"
                onClick={() => setFaqs(prev => [...prev, { question: '', answer: '' }])}
                className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 12 }}>
                + Add FAQ
              </button>
            </h4>
            {faqs.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>No FAQs added. Add questions and answers to generate FAQ Schema.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {faqs.map((faq, index) => (
                  <div key={index} style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>FAQ #{index + 1}</span>
                      <button type="button" onClick={() => setFaqs(prev => prev.filter((_, i) => i !== index))} className="btn btn-ghost" style={{ padding: 4, color: 'var(--danger)' }}>&times; Remove</button>
                    </div>
                    <input type="text" className="form-input" placeholder="Question" value={faq.question} onChange={e => {
                      const nf = [...faqs]; nf[index].question = e.target.value; setFaqs(nf);
                    }} style={{ marginBottom: 8 }} />
                    <textarea className="form-input" placeholder="Answer" rows={2} value={faq.answer} onChange={e => {
                      const nf = [...faqs]; nf[index].answer = e.target.value; setFaqs(nf);
                    }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="cms-card">
            <h4 style={{ margin: '0 0 16px 0', fontSize: 14 }}>SEO Meta Data</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">SEO Title</label>
                <input type="text" className="form-input" value={seoTitle} onChange={e => setSeoTitle(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Meta Description</label>
                <textarea className="form-input" rows={2} value={seoDescription} onChange={e => setSeoDescription(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Focus Keyword</label>
                <input type="text" className="form-input" value={focusKeyword} onChange={e => setFocusKeyword(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Canonical URL</label>
                <input type="text" className="form-input" value={canonicalUrl} onChange={e => setCanonicalUrl(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="cms-card">
            <h4 style={{ margin: '0 0 16px 0', fontSize: 14 }}>Open Graph (Social Sharing)</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">OG Title (Optional)</label>
                <input type="text" className="form-input" placeholder="Fallback to SEO Title if empty" value={ogTitle} onChange={e => setOgTitle(e.target.value)} />
              </div>
              <div>
                <label className="form-label">OG Description (Optional)</label>
                <textarea className="form-input" rows={2} placeholder="Fallback to Meta Description if empty" value={ogDescription} onChange={e => setOgDescription(e.target.value)} />
              </div>
              <div>
                <label className="form-label">OG Image URL (Optional)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="text" className="form-input" placeholder="Fallback to Featured Image if empty" value={ogImage} onChange={e => setOgImage(e.target.value)} />
                  <button type="button" onClick={() => setMediaTarget('og')} className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>Browse</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <SeoScoreWidget title={seoTitle || title} description={seoDescription || excerpt} keyword={focusKeyword} content={content} onScoreChange={setSeoScore} />
          
          <div className="cms-card">
            <h4 style={{ margin: '0 0 12px 0', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}><FiImage /> Featured Image</h4>
            {featuredImage ? (
              <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
                <img src={featuredImage} alt="Featured" style={{ width: '100%', height: 'auto', display: 'block' }} />
                <button onClick={() => setFeaturedImage('')} style={{ position: 'absolute', top: 8, right: 8, background: 'var(--danger)', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Remove</button>
              </div>
            ) : (
              <button 
                onClick={() => setMediaTarget('featured')}
                className="btn-secondary"
                style={{ width: '100%', padding: '30px 10px', borderStyle: 'dashed', background: 'rgba(1,142,158,0.05)', color: 'var(--primary)' }}
              >
                + Select from Media Library
              </button>
            )}
            
            {featuredImage && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label className="form-label">Image Alt Text</label>
                  <input type="text" className="form-input" value={featuredImageAlt} onChange={e => setFeaturedImageAlt(e.target.value)} placeholder="Describe the image for SEO" />
                </div>
                <div>
                  <label className="form-label">Image Title Attribute</label>
                  <input type="text" className="form-input" value={featuredImageTitle} onChange={e => setFeaturedImageTitle(e.target.value)} placeholder="Hover text for the image" />
                </div>
                <div>
                  <label className="form-label">Image Caption</label>
                  <input type="text" className="form-input" value={featuredImageCaption} onChange={e => setFeaturedImageCaption(e.target.value)} placeholder="Text displayed below the image" />
                </div>
              </div>
            )}
          </div>
          
          <div style={{ marginTop: 24 }}>
            <AIAssistantPanel 
              content={content}
              focusKeyword={focusKeyword}
              onApplyMeta={(meta) => {
                setSeoTitle(meta.title);
                setSeoDescription(meta.description);
                toast.success('Meta tags applied successfully!');
              }}
              onApplyKeywords={(kws) => {
                navigator.clipboard.writeText(kws.join(', '));
                toast.success('Keywords copied to clipboard!');
              }}
            />
          </div>
        </div>
      </div>

      {showRevisions && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="cms-card" style={{ width: 600, maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Revision History</h3>
              <button onClick={() => setShowRevisions(false)} className="btn btn-ghost" style={{ padding: 4 }}>&times;</button>
            </div>
            {revisions.length === 0 ? (
              <p>No revisions found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {revisions.map(rev => (
                  <div key={rev.id} style={{ border: '1px solid var(--border)', padding: 12, borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{rev.title}</strong>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(rev.created_at).toLocaleString()}</div>
                      </div>
                      <button onClick={() => {
                        if(window.confirm('Restore this revision? Your current unsaved changes will be lost.')) {
                          setContent(rev.content);
                          setTitle(rev.title);
                          setShowRevisions(false);
                          toast.success('Revision restored. Click Save to apply.');
                        }
                      }} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }}>
                        Restore
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {mediaTarget && (
        <MediaSelector 
          onSelect={handleMediaSelect} 
          onClose={() => setMediaTarget(null)} 
        />
      )}
    </AdminLayout>
  );
}
