import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import CodeBlockExtension from '@tiptap/extension-code-block';
import { supabase } from '../../lib/supabase';
import { analyzeSeo, calculateReadTime, generateSlug } from '../../lib/seoAnalyzer';
import toast from 'react-hot-toast';
import {
  FiSave, FiEye, FiSend, FiClock, FiChevronDown, FiChevronUp,
  FiPlus, FiTrash2, FiImage, FiBold, FiItalic, FiUnderline,
  FiList, FiCode, FiLink, FiAlignLeft, FiAlignCenter, FiAlignRight,
  FiX, FiArrowLeft, FiRefreshCw
} from 'react-icons/fi';
import styles from '../../styles/BlogEditor.module.css';

// Toolbar Button Component
function ToolbarBtn({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`${styles.toolbarBtn} ${active ? styles.toolbarBtnActive : ''}`}
    >
      {children}
    </button>
  );
}

// SEO Score Circle
function SeoScoreCircle({ score }) {
  const color = score >= 80 ? '#22C55E' : score >= 60 ? '#F59E0B' : '#EF4444';
  const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D';
  return (
    <div className={styles.scoreCircle} style={{ '--score-color': color }}>
      <span className={styles.scoreNumber}>{score}</span>
      <span className={styles.scoreGrade}>{grade}</span>
    </div>
  );
}

export default function BlogEditor({ blogId }) {
  const router = useRouter();
  const isNew = !blogId;

  // Form state
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [activeTab, setActiveTab] = useState('content'); // content, seo, schema
  const [seoExpanded, setSeoExpanded] = useState({
    basic: true, og: false, twitter: false, advanced: false
  });

  // Blog data
  const [blog, setBlog] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    author_id: '',
    status: 'draft',
    published_at: null,
    scheduled_at: null,
    featured_image_url: '',
    featured_image_alt: '',
    featured_image_title: '',
    featured_image_caption: '',
    is_featured: false,
    is_sticky: false,
    estimated_read_time: 0,
    seo_title: '',
    seo_description: '',
    focus_keyword: '',
    canonical_url: '',
    custom_slug: '',
    robots_index: true,
    robots_follow: true,
    og_title: '',
    og_description: '',
    og_image_url: '',
    twitter_card_image: '',
    breadcrumb_title: '',
    schema_type: 'BlogPosting',
  });

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [seoAnalysis, setSeoAnalysis] = useState(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState('');

  // TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Image.configure({ allowBase64: true }),
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Start writing your blog post here...' }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      CodeBlockExtension,
    ],
    content: blog.content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setBlog(prev => ({
        ...prev,
        content: html,
        estimated_read_time: calculateReadTime(html),
      }));
    },
  });

  // Load data
  useEffect(() => {
    loadMeta();
    if (blogId) loadBlog();
  }, [blogId]);

  // Auto-analyze SEO
  useEffect(() => {
    const result = analyzeSeo({
      title: blog.title,
      content: blog.content,
      seoTitle: blog.seo_title,
      seoDescription: blog.seo_description,
      focusKeyword: blog.focus_keyword,
      featuredImageUrl: blog.featured_image_url,
      featuredImageAlt: blog.featured_image_alt,
      excerpt: blog.excerpt,
      faqs,
    });
    setSeoAnalysis(result);
    setBlog(prev => ({ ...prev, seo_score: result.score }));
  }, [blog.title, blog.content, blog.seo_title, blog.seo_description, blog.focus_keyword, blog.featured_image_url, blog.featured_image_alt, blog.excerpt, faqs]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugManuallyEdited && blog.title) {
      setBlog(prev => ({ ...prev, slug: generateSlug(blog.title) }));
    }
  }, [blog.title]);

  async function loadMeta() {
    const [{ data: authorsData }, { data: catsData }, { data: tagsData }] = await Promise.all([
      supabase.from('authors').select('*').eq('is_active', true),
      supabase.from('categories').select('*').order('name'),
      supabase.from('tags').select('*').order('name'),
    ]);
    setAuthors(authorsData || []);
    setCategories(catsData || []);
    setTags(tagsData || []);
  }

  async function loadBlog() {
    setLoading(true);
    const { data, error } = await supabase
      .from('blogs')
      .select('*, blog_categories(category_id), blog_tags(tag_id), blog_faqs(*)')
      .eq('id', blogId)
      .single();

    if (error || !data) {
      toast.error('Blog not found');
      router.push('/blogs');
      return;
    }

    setBlog(data);
    setSelectedCategories(data.blog_categories?.map(bc => bc.category_id) || []);
    setSelectedTags(data.blog_tags?.map(bt => bt.tag_id) || []);
    setFaqs(data.blog_faqs?.sort((a, b) => a.sort_order - b.sort_order) || []);
    if (editor && data.content) {
      editor.commands.setContent(data.content);
    }
    setLoading(false);
  }

  const handleChange = (field, value) => {
    setBlog(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (status = null) => {
    setSaving(true);
    const saveStatus = status || blog.status;
    const payload = {
      ...blog,
      status: saveStatus,
      published_at: saveStatus === 'published' ? (blog.published_at || new Date().toISOString()) : blog.published_at,
      scheduled_at: saveStatus === 'scheduled' ? scheduleDateTime : null,
      updated_at: new Date().toISOString(),
    };

    try {
      let blogId_saved;
      if (isNew) {
        const { data, error } = await supabase.from('blogs').insert([payload]).select().single();
        if (error) throw error;
        blogId_saved = data.id;
      } else {
        const { error } = await supabase.from('blogs').update(payload).eq('id', blogId);
        if (error) throw error;
        blogId_saved = blogId;
      }

      // Save categories
      await supabase.from('blog_categories').delete().eq('blog_id', blogId_saved);
      if (selectedCategories.length > 0) {
        await supabase.from('blog_categories').insert(
          selectedCategories.map(cat_id => ({ blog_id: blogId_saved, category_id: cat_id }))
        );
      }

      // Save tags
      await supabase.from('blog_tags').delete().eq('blog_id', blogId_saved);
      if (selectedTags.length > 0) {
        await supabase.from('blog_tags').insert(
          selectedTags.map(tag_id => ({ blog_id: blogId_saved, tag_id }))
        );
      }

      // Save FAQs
      await supabase.from('blog_faqs').delete().eq('blog_id', blogId_saved);
      if (faqs.length > 0) {
        await supabase.from('blog_faqs').insert(
          faqs.map((faq, i) => ({ ...faq, blog_id: blogId_saved, sort_order: i, id: undefined }))
        );
      }

      toast.success(saveStatus === 'published' ? 'Blog published!' : `Blog saved as ${saveStatus}`);
      if (isNew) router.push(`/blogs/${blogId_saved}`);
    } catch (err) {
      toast.error('Error saving: ' + err.message);
    }
    setSaving(false);
  };

  const toggleCategory = (catId) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const addTag = async () => {
    if (!tagInput.trim()) return;
    const slug = generateSlug(tagInput);
    let { data } = await supabase.from('tags').select('id').eq('slug', slug).single();
    if (!data) {
      const { data: newTag } = await supabase.from('tags').insert([{ name: tagInput.trim(), slug }]).select().single();
      data = newTag;
      setTags(prev => [...prev, data]);
    }
    if (data && !selectedTags.includes(data.id)) {
      setSelectedTags(prev => [...prev, data.id]);
    }
    setTagInput('');
  };

  const addFaq = () => setFaqs(prev => [...prev, { question: '', answer: '', sort_order: prev.length }]);
  const removeFaq = (i) => setFaqs(prev => prev.filter((_, idx) => idx !== i));
  const updateFaq = (i, field, value) => setFaqs(prev => prev.map((faq, idx) => idx === i ? { ...faq, [field]: value } : faq));

  if (loading) return (
    <div className={styles.loadingWrap}>
      <div className={styles.spinner}></div>
      <span>Loading blog editor...</span>
    </div>
  );

  return (
    <>
      <Head><title>{isNew ? 'New Blog Post' : `Edit: ${blog.title}`} | Anantya CMS</title></Head>

      <div className={styles.editorLayout}>
        {/* Top Bar */}
        <div className={styles.editorTopBar}>
          <div className={styles.topBarLeft}>
            <Link href="/blogs" className={styles.backBtn}><FiArrowLeft /> All Posts</Link>
            <input
              className={styles.titleInput}
              placeholder="Enter blog title here..."
              value={blog.title}
              onChange={e => handleChange('title', e.target.value)}
            />
          </div>
          <div className={styles.topBarRight}>
            {seoAnalysis && <SeoScoreCircle score={seoAnalysis.score} />}
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => handleSave('draft')} disabled={saving}>
              <FiSave /> {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => handleSave('published')} disabled={saving}>
              <FiSend /> Publish
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={styles.editorTabs}>
          {['content', 'seo', 'settings'].map(tab => (
            <button key={tab} className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.editorBody}>
          {/* CONTENT TAB */}
          {activeTab === 'content' && (
            <div className={styles.contentTab}>
              <div className={styles.editorMain}>
                {/* TipTap Toolbar */}
                <div className={styles.toolbar}>
                  <ToolbarBtn onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} title="Bold">
                    <FiBold />
                  </ToolbarBtn>
                  <ToolbarBtn onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} title="Italic">
                    <FiItalic />
                  </ToolbarBtn>
                  <ToolbarBtn onClick={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive('underline')} title="Underline">
                    <FiUnderline />
                  </ToolbarBtn>
                  <div className={styles.toolbarDivider} />
                  {[1, 2, 3, 4].map(level => (
                    <ToolbarBtn key={level} onClick={() => editor?.chain().focus().toggleHeading({ level }).run()}
                      active={editor?.isActive('heading', { level })} title={`H${level}`}>
                      H{level}
                    </ToolbarBtn>
                  ))}
                  <div className={styles.toolbarDivider} />
                  <ToolbarBtn onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} title="Bullet List">
                    <FiList />
                  </ToolbarBtn>
                  <ToolbarBtn onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} title="Numbered List">
                    #
                  </ToolbarBtn>
                  <ToolbarBtn onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')} title="Blockquote">
                    "
                  </ToolbarBtn>
                  <ToolbarBtn onClick={() => editor?.chain().focus().toggleCodeBlock().run()} active={editor?.isActive('codeBlock')} title="Code Block">
                    <FiCode />
                  </ToolbarBtn>
                  <div className={styles.toolbarDivider} />
                  <ToolbarBtn onClick={() => {
                    const url = prompt('URL:');
                    if (url) editor?.chain().focus().setLink({ href: url }).run();
                  }} active={editor?.isActive('link')} title="Link">
                    <FiLink />
                  </ToolbarBtn>
                  <ToolbarBtn onClick={() => {
                    const url = prompt('Image URL:');
                    if (url) editor?.chain().focus().setImage({ src: url }).run();
                  }} title="Image">
                    <FiImage />
                  </ToolbarBtn>
                  <div className={styles.toolbarDivider} />
                  <ToolbarBtn onClick={() => editor?.chain().focus().setTextAlign('left').run()} active={editor?.isActive({ textAlign: 'left' })} title="Align Left">
                    <FiAlignLeft />
                  </ToolbarBtn>
                  <ToolbarBtn onClick={() => editor?.chain().focus().setTextAlign('center').run()} active={editor?.isActive({ textAlign: 'center' })} title="Align Center">
                    <FiAlignCenter />
                  </ToolbarBtn>
                  <ToolbarBtn onClick={() => editor?.chain().focus().setTextAlign('right').run()} active={editor?.isActive({ textAlign: 'right' })} title="Align Right">
                    <FiAlignRight />
                  </ToolbarBtn>
                </div>

                {/* Editor Content */}
                <div className={styles.tiptapWrap}>
                  <EditorContent editor={editor} className={styles.tiptapEditor} />
                </div>

                {/* Word Count */}
                <div className={styles.editorFooter}>
                  <span>{editor?.storage.characterCount?.words() || 0} words</span>
                  <span>~{blog.estimated_read_time} min read</span>
                </div>
              </div>

              {/* Right Sidebar */}
              <div className={styles.editorSidebar}>
                {/* Publish Box */}
                <div className={styles.sideCard}>
                  <h4>Publish</h4>
                  <div className={styles.statusRow}>
                    <span className={`${styles.badge} ${styles[`badge_${blog.status}`]}`}>{blog.status}</span>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Status</label>
                    <select value={blog.status} onChange={e => handleChange('status', e.target.value)} className={styles.select}>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </div>
                  {blog.status === 'scheduled' && (
                    <div className={styles.formGroup}>
                      <label>Schedule Date & Time</label>
                      <input type="datetime-local" value={scheduleDateTime}
                        onChange={e => setScheduleDateTime(e.target.value)} className={styles.input} />
                    </div>
                  )}
                  <div className={styles.toggleRow}>
                    <label>Featured Post</label>
                    <input type="checkbox" checked={blog.is_featured} onChange={e => handleChange('is_featured', e.target.checked)} />
                  </div>
                  <div className={styles.toggleRow}>
                    <label>Sticky Post</label>
                    <input type="checkbox" checked={blog.is_sticky} onChange={e => handleChange('is_sticky', e.target.checked)} />
                  </div>
                  <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnFull}`} onClick={() => handleSave()} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>

                {/* Featured Image */}
                <div className={styles.sideCard}>
                  <h4>Featured Image</h4>
                  {blog.featured_image_url ? (
                    <div className={styles.featuredImgPreview}>
                      <img src={blog.featured_image_url} alt={blog.featured_image_alt} />
                      <button className={styles.removeImg} onClick={() => handleChange('featured_image_url', '')}>
                        <FiX />
                      </button>
                    </div>
                  ) : (
                    <div className={styles.imgPlaceholder}>
                      <FiImage />
                      <span>No image set</span>
                    </div>
                  )}
                  <div className={styles.formGroup}>
                    <label>Image URL</label>
                    <input className={styles.input} value={blog.featured_image_url}
                      onChange={e => handleChange('featured_image_url', e.target.value)}
                      placeholder="https://ik.imagekit.io/..." />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Alt Text *</label>
                    <input className={styles.input} value={blog.featured_image_alt}
                      onChange={e => handleChange('featured_image_alt', e.target.value)}
                      placeholder="Describe the image..." />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Caption</label>
                    <input className={styles.input} value={blog.featured_image_caption}
                      onChange={e => handleChange('featured_image_caption', e.target.value)} />
                  </div>
                </div>

                {/* Categories */}
                <div className={styles.sideCard}>
                  <h4>Categories</h4>
                  <div className={styles.categoryList}>
                    {categories.map(cat => (
                      <label key={cat.id} className={styles.checkLabel}>
                        <input type="checkbox" checked={selectedCategories.includes(cat.id)}
                          onChange={() => toggleCategory(cat.id)} />
                        {cat.name}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className={styles.sideCard}>
                  <h4>Tags</h4>
                  <div className={styles.tagWrap}>
                    {selectedTags.map(tagId => {
                      const tag = tags.find(t => t.id === tagId);
                      return tag ? (
                        <span key={tagId} className={styles.tag}>
                          {tag.name}
                          <button onClick={() => setSelectedTags(prev => prev.filter(id => id !== tagId))}><FiX /></button>
                        </span>
                      ) : null;
                    })}
                  </div>
                  <div className={styles.tagInputRow}>
                    <input className={styles.input} value={tagInput} onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addTag()}
                      placeholder="Add tag + Enter" />
                    <button className={`${styles.btn} ${styles.btnGhost}`} onClick={addTag}><FiPlus /></button>
                  </div>
                </div>

                {/* Author */}
                <div className={styles.sideCard}>
                  <h4>Author</h4>
                  <select className={styles.select} value={blog.author_id}
                    onChange={e => handleChange('author_id', e.target.value)}>
                    <option value="">Select author</option>
                    {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>

                {/* Excerpt */}
                <div className={styles.sideCard}>
                  <h4>Excerpt</h4>
                  <textarea className={styles.textarea} rows={4} value={blog.excerpt}
                    onChange={e => handleChange('excerpt', e.target.value)}
                    placeholder="Short blog summary..." maxLength={300} />
                  <small>{blog.excerpt?.length || 0}/300</small>
                </div>

                {/* URL Slug */}
                <div className={styles.sideCard}>
                  <h4>URL Slug</h4>
                  <div className={styles.slugPreview}>anantya.ai/blog/</div>
                  <input className={styles.input} value={blog.slug}
                    onChange={e => { setSlugManuallyEdited(true); handleChange('slug', e.target.value); }}
                    placeholder="url-slug" />
                </div>

                {/* FAQ Section */}
                <div className={styles.sideCard}>
                  <div className={styles.cardHeader}>
                    <h4>FAQ Section</h4>
                    <button className={`${styles.btn} ${styles.btnGhost}`} onClick={addFaq}><FiPlus /></button>
                  </div>
                  {faqs.map((faq, i) => (
                    <div key={i} className={styles.faqItem}>
                      <div className={styles.faqHeader}>
                        <span>FAQ {i + 1}</span>
                        <button onClick={() => removeFaq(i)}><FiTrash2 /></button>
                      </div>
                      <input className={styles.input} value={faq.question}
                        onChange={e => updateFaq(i, 'question', e.target.value)} placeholder="Question" />
                      <textarea className={styles.textarea} rows={3} value={faq.answer}
                        onChange={e => updateFaq(i, 'answer', e.target.value)} placeholder="Answer" />
                    </div>
                  ))}
                  {faqs.length === 0 && <small style={{ color: 'var(--muted)' }}>No FAQs added yet</small>}
                </div>
              </div>
            </div>
          )}

          {/* SEO TAB */}
          {activeTab === 'seo' && (
            <div className={styles.seoTab}>
              <div className={styles.seoMain}>
                {/* SEO Score Overview */}
                {seoAnalysis && (
                  <div className={styles.seoOverview}>
                    <div className={styles.seoScoreLarge} style={{ borderColor: seoAnalysis.color }}>
                      <span style={{ color: seoAnalysis.color }}>{seoAnalysis.score}</span>
                      <small>/ 100</small>
                    </div>
                    <div className={styles.seoChecks}>
                      {seoAnalysis.checks.map((check, i) => (
                        <div key={i} className={`${styles.checkItem} ${check.pass ? styles.checkPass : styles.checkFail}`}>
                          <span>{check.pass ? '✅' : '❌'}</span>
                          <span>{check.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SEO Fields */}
                <div className={styles.seoSection}>
                  <h3>Basic SEO</h3>
                  <div className={styles.formGroup}>
                    <label>SEO Title <span className={styles.charCount}>{blog.seo_title?.length || 0}/60</span></label>
                    <input className={`${styles.input} ${blog.seo_title?.length > 60 ? styles.inputError : ''}`}
                      value={blog.seo_title} onChange={e => handleChange('seo_title', e.target.value)}
                      placeholder="SEO optimized title..." maxLength={70} />
                    <div className={styles.charBar}>
                      <div className={styles.charBarFill} style={{
                        width: `${Math.min((blog.seo_title?.length || 0) / 60 * 100, 100)}%`,
                        background: blog.seo_title?.length >= 50 && blog.seo_title?.length <= 60 ? '#22C55E' : '#F59E0B'
                      }} />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Meta Description <span className={styles.charCount}>{blog.seo_description?.length || 0}/160</span></label>
                    <textarea className={styles.textarea} rows={3}
                      value={blog.seo_description} onChange={e => handleChange('seo_description', e.target.value)}
                      placeholder="Compelling meta description..." maxLength={170} />
                    <div className={styles.charBar}>
                      <div className={styles.charBarFill} style={{
                        width: `${Math.min((blog.seo_description?.length || 0) / 160 * 100, 100)}%`,
                        background: blog.seo_description?.length >= 150 && blog.seo_description?.length <= 160 ? '#22C55E' : '#F59E0B'
                      }} />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Focus Keyword</label>
                    <input className={styles.input} value={blog.focus_keyword}
                      onChange={e => handleChange('focus_keyword', e.target.value)}
                      placeholder="Primary keyword to rank for..." />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Canonical URL</label>
                    <input className={styles.input} value={blog.canonical_url}
                      onChange={e => handleChange('canonical_url', e.target.value)}
                      placeholder="https://anantya.ai/blog/..." />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Breadcrumb Title</label>
                    <input className={styles.input} value={blog.breadcrumb_title}
                      onChange={e => handleChange('breadcrumb_title', e.target.value)} />
                  </div>

                  <div className={styles.inlineGroup}>
                    <div className={styles.formGroup}>
                      <label>Index</label>
                      <select className={styles.select} value={blog.robots_index ? 'index' : 'noindex'}
                        onChange={e => handleChange('robots_index', e.target.value === 'index')}>
                        <option value="index">Index</option>
                        <option value="noindex">No Index</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Follow</label>
                      <select className={styles.select} value={blog.robots_follow ? 'follow' : 'nofollow'}
                        onChange={e => handleChange('robots_follow', e.target.value === 'follow')}>
                        <option value="follow">Follow</option>
                        <option value="nofollow">No Follow</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Open Graph */}
                <div className={styles.seoSection}>
                  <h3>Open Graph (Social Media)</h3>
                  <div className={styles.formGroup}>
                    <label>OG Title</label>
                    <input className={styles.input} value={blog.og_title}
                      onChange={e => handleChange('og_title', e.target.value)}
                      placeholder="Facebook / LinkedIn share title..." />
                  </div>
                  <div className={styles.formGroup}>
                    <label>OG Description</label>
                    <textarea className={styles.textarea} rows={2} value={blog.og_description}
                      onChange={e => handleChange('og_description', e.target.value)} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>OG Image URL</label>
                    <input className={styles.input} value={blog.og_image_url}
                      onChange={e => handleChange('og_image_url', e.target.value)}
                      placeholder="1200x630px recommended" />
                  </div>
                  {blog.og_image_url && (
                    <div className={styles.ogPreview}>
                      <img src={blog.og_image_url} alt="OG Preview" />
                      <div className={styles.ogPreviewMeta}>
                        <span className={styles.ogDomain}>anantya.ai</span>
                        <p className={styles.ogTitle}>{blog.og_title || blog.seo_title || blog.title}</p>
                        <p className={styles.ogDesc}>{blog.og_description || blog.seo_description}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Twitter Card */}
                <div className={styles.seoSection}>
                  <h3>Twitter Card</h3>
                  <div className={styles.formGroup}>
                    <label>Twitter Card Image URL</label>
                    <input className={styles.input} value={blog.twitter_card_image}
                      onChange={e => handleChange('twitter_card_image', e.target.value)}
                      placeholder="1200x628px recommended" />
                  </div>
                </div>

                {/* Schema Type */}
                <div className={styles.seoSection}>
                  <h3>Schema Type</h3>
                  <select className={styles.select} value={blog.schema_type}
                    onChange={e => handleChange('schema_type', e.target.value)}>
                    {['BlogPosting', 'Article', 'WebPage', 'FAQ', 'Product', 'Service', 'Custom'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className={styles.settingsTab}>
              <div className={styles.seoSection}>
                <h3>Blog Settings</h3>
                <div className={styles.formGroup}>
                  <label>Published Date</label>
                  <input type="datetime-local" className={styles.input}
                    value={blog.published_at ? blog.published_at.slice(0, 16) : ''}
                    onChange={e => handleChange('published_at', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Estimated Read Time (minutes)</label>
                  <input type="number" className={styles.input} value={blog.estimated_read_time}
                    onChange={e => handleChange('estimated_read_time', parseInt(e.target.value))} min="1" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Page wrappers
export function NewBlogPage() {
  return <BlogEditor />;
}

export function EditBlogPage() {
  const router = useRouter();
  const { id } = router.query;
  if (!id) return null;
  return <BlogEditor blogId={id} />;
}
