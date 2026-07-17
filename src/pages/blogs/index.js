import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiCheck, FiX,
  FiFileText, FiChevronLeft, FiChevronRight, FiFilter,
  FiAlertTriangle, FiCheckCircle, FiEye, FiMoreVertical,
  FiArrowUp, FiArrowDown, FiRefreshCw, FiArchive,
  FiCornerLeftUp,
} from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import { supabase } from '../../lib/supabase';
import { triggerBuild } from '../../lib/triggerBuild';

/* ================================================================
   CONSTANTS
   ================================================================ */
const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'archived', label: 'Archived' },
];

/* ================================================================
   HELPERS
   ================================================================ */
function seoScoreClass(score) {
  if (score >= 70) return 'seo-score-good';
  if (score >= 40) return 'seo-score-ok';
  return 'seo-score-poor';
}

function StatusBadge({ status }) {
  return (
    <span className={`badge badge-${status}`}>
      {status === 'published' && <FiCheckCircle size={10} />}
      {status === 'draft'     && <FiEdit2 size={10} />}
      {status === 'scheduled' && <FiEye size={10} />}
      {status === 'archived'  && <FiArchive size={10} />}
      {status}
    </span>
  );
}

/* ================================================================
   SKELETON ROW
   ================================================================ */
function SkeletonRow() {
  return (
    <tr>
      <td style={{ width: 40 }}>
        <div className="skeleton" style={{ width: 16, height: 16, borderRadius: 4 }} />
      </td>
      {[240, 100, 110, 80, 50, 80, 80].map((w, i) => (
        <td key={i}>
          <div className="skeleton" style={{ width: w, height: 14, borderRadius: 6 }} />
        </td>
      ))}
    </tr>
  );
}

/* ================================================================
   DELETE CONFIRM DIALOG
   ================================================================ */
function DeleteDialog({ blog, onConfirm, onCancel, loading }) {
  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-box" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', flexShrink: 0 }}>
            <FiAlertTriangle size={20} />
          </div>
          <div className="dialog-title">Delete Blog Post?</div>
        </div>
        <p className="dialog-desc">
          You are about to permanently delete{' '}
          <strong style={{ color: 'var(--text-primary)' }}>&ldquo;{blog?.title}&rdquo;</strong>.
          This action cannot be undone.
        </p>
        <div className="dialog-actions">
          <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   BULK DELETE CONFIRM DIALOG
   ================================================================ */
function BulkDeleteDialog({ count, onConfirm, onCancel, loading }) {
  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-box" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', flexShrink: 0 }}>
            <FiTrash2 size={20} />
          </div>
          <div className="dialog-title">Delete {count} Post{count > 1 ? 's' : ''}?</div>
        </div>
        <p className="dialog-desc">
          You are about to permanently delete{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{count} selected post{count > 1 ? 's' : ''}</strong>.
          This action cannot be undone.
        </p>
        <div className="dialog-actions">
          <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting…' : `Delete ${count}`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   EMPTY STATE
   ================================================================ */
function EmptyState({ filtered }) {
  return (
    <tr>
      <td colSpan={9}>
        <div className="empty-state" style={{ padding: '60px 20px' }}>
          <FiFileText size={48} />
          {filtered ? (
            <>
              <h3>No posts match your filters</h3>
              <p>Try adjusting your search query or filter selections to find what you&apos;re looking for.</p>
            </>
          ) : (
            <>
              <h3>No blog posts yet</h3>
              <p>Create your first blog post to get started with your content strategy.</p>
              <Link href="/blogs/new" className="btn btn-primary">
                <FiPlus size={14} /> Create First Post
              </Link>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ================================================================
   ROW ACTIONS DROPDOWN
   ================================================================ */
function RowActions({ blog, setDeleteTarget }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const menuRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    
    function handleScroll() {
      if (open) setOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScroll, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  const toggleMenu = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right
      });
    }
    setOpen(!open);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button ref={btnRef} className="btn btn-ghost btn-sm btn-icon" onClick={toggleMenu} title="Actions">
        <FiMoreVertical size={16} />
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div ref={menuRef} style={{
          position: 'fixed', right: coords.right, top: coords.top, 
          background: 'var(--card)', 
          border: '1px solid var(--border)', 
          borderRadius: '8px', 
          padding: '6px', 
          boxShadow: '0 4px 15px rgba(0,0,0,0.15)', 
          zIndex: 9999,
          display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '130px'
        }}>
          <Link href={`/blogs/${blog.id}`} className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', border: 'none', background: 'transparent', width: '100%', textAlign: 'left', cursor: 'pointer', borderRadius: '6px', textDecoration: 'none', color: 'var(--text-primary)', fontSize: '13px' }} onClick={() => setOpen(false)}>
            <FiEdit2 size={14} /> Edit
          </Link>
          <a href={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blog/${blog.slug}`} target="_blank" rel="noopener noreferrer" className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', border: 'none', background: 'transparent', width: '100%', textAlign: 'left', cursor: 'pointer', borderRadius: '6px', textDecoration: 'none', color: 'var(--text-primary)', fontSize: '13px' }} onClick={() => setOpen(false)}>
            <FiEye size={14} /> Preview
          </a>
          <button className="dropdown-item" onClick={() => { setOpen(false); setDeleteTarget(blog); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', border: 'none', background: 'transparent', width: '100%', textAlign: 'left', cursor: 'pointer', borderRadius: '6px', color: 'var(--danger)', fontSize: '13px' }}>
            <FiTrash2 size={14} /> Delete
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

/* ================================================================
   MAIN BLOGS PAGE
   ================================================================ */
export default function BlogsIndex() {
  const router = useRouter();

  // Data
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortCol, setSortCol] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  // Pagination
  const [page, setPage] = useState(1);

  // Selection
  const [selected, setSelected] = useState(new Set());
  const [allChecked, setAllChecked] = useState(false);

  // Delete dialogs
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // Debounce timer
  const searchTimer = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  /* ---- Debounce search ---- */
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  /* ---- Reset page on filter change ---- */
  useEffect(() => { setPage(1); }, [statusFilter, categoryFilter]);

  /* ---- Fetch categories for filter dropdown ---- */
  useEffect(() => {
    supabase
      .from('categories')
      .select('id, name')
      .order('name')
      .then(({ data }) => setCategories(data || []));
  }, []);

  /* ---- Main fetch ---- */
  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    setAllChecked(false);

    try {
      const from = (page - 1) * PAGE_SIZE;
      const to   = from + PAGE_SIZE - 1;

      let query = supabase
        .from('blogs')
        .select(`
          id, title, slug, status, seo_score, published_at, created_at,
          author, categories
        `, { count: 'exact' })
        .order(sortCol, { ascending: sortDir === 'asc' })
        .range(from, to);

      if (debouncedSearch.trim()) {
        query = query.ilike('title', `%${debouncedSearch.trim()}%`);
      }
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      if (categoryFilter) {
        // filter by category via blog_categories join
        const { data: blogIds } = await supabase
          .from('blog_categories')
          .select('blog_id')
          .eq('category_id', categoryFilter);
        const ids = (blogIds || []).map(b => b.blog_id);
        if (ids.length === 0) {
          setBlogs([]);
          setTotalCount(0);
          setLoading(false);
          return;
        }
        query = query.in('id', ids);
      }

      const { data, count, error } = await query;

      if (error) throw error;

      setBlogs(data || []);
      setTotalCount(count || 0);
    } catch (e) {
      console.error('fetchBlogs error', e);
      toast.error('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, categoryFilter, sortCol, sortDir]);

  useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

  /* ---- Sorting ---- */
  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
    setPage(1);
  };

  /* ---- Selection ---- */
  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allChecked) {
      setSelected(new Set());
      setAllChecked(false);
    } else {
      setSelected(new Set(blogs.map(b => b.id)));
      setAllChecked(true);
    }
  };

  useEffect(() => {
    if (blogs.length > 0 && selected.size === blogs.length) {
      setAllChecked(true);
    } else {
      setAllChecked(false);
    }
  }, [selected, blogs]);

  /* ---- Delete single ---- */
  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      const { error } = await supabase.from('blogs').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      toast.success('Blog post deleted');
      setDeleteTarget(null);
      fetchBlogs();
      triggerBuild();
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete post');
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ---- Bulk delete ---- */
  const handleBulkDelete = async () => {
    setBulkDeleteLoading(true);
    try {
      const ids = Array.from(selected);
      const { error } = await supabase.from('blogs').delete().in('id', ids);
      if (error) throw error;
      toast.success(`${ids.length} post${ids.length > 1 ? 's' : ''} deleted`);
      setBulkDeleteOpen(false);
      setSelected(new Set());
      fetchBlogs();
      triggerBuild();
    } catch (e) {
      console.error(e);
      toast.error('Bulk delete failed');
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  /* ---- Bulk publish ---- */
  const handleBulkPublish = async () => {
    const ids = Array.from(selected);
    try {
      const { error } = await supabase
        .from('blogs')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .in('id', ids);
      if (error) throw error;
      toast.success(`${ids.length} post${ids.length > 1 ? 's' : ''} published`);
      setSelected(new Set());
      fetchBlogs();
      triggerBuild();
    } catch (e) {
      toast.error('Bulk publish failed');
    }
  };

  /* ---- Bulk move to draft ---- */
  const handleBulkDraft = async () => {
    const ids = Array.from(selected);
    try {
      const { error } = await supabase
        .from('blogs')
        .update({ status: 'draft' })
        .in('id', ids);
      if (error) throw error;
      toast.success(`Moved ${ids.length} post${ids.length > 1 ? 's' : ''} to draft`);
      setSelected(new Set());
      fetchBlogs();
      triggerBuild();
    } catch (e) {
      toast.error('Operation failed');
    }
  };

  /* ---- Pagination ---- */
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const pageNumbers = (() => {
    const pages = [];
    const start = Math.max(1, page - 2);
    const end   = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  })();

  /* ---- Sort indicator ---- */
  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span style={{ opacity: 0.25, marginLeft: 4, display: 'inline-flex' }}><FiArrowUp size={11} /></span>;
    return (
      <span style={{ color: 'var(--primary)', marginLeft: 4, display: 'inline-flex' }}>
        {sortDir === 'asc' ? <FiArrowUp size={11} /> : <FiArrowDown size={11} />}
      </span>
    );
  };

  const isFiltered = !!(debouncedSearch || statusFilter || categoryFilter);

  /* ---- Category name from join ---- */
  const getBlogCategory = (blog) => {
    return blog.categories || '—';
  };

  return (
    <AdminLayout title="Blog Posts">

      {/* ===== TOP BAR ===== */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Blog Posts</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
            Manage your content — {totalCount.toLocaleString()} total post{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={fetchBlogs} title="Refresh">
            <FiRefreshCw size={14} />
          </button>
          <Link href="/blogs/new" className="btn btn-primary">
            <FiPlus size={15} />
            New Post
          </Link>
        </div>
      </div>

      {/* ===== FILTERS ===== */}
      <div className="cms-card" style={{ marginBottom: 16, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 200, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <FiSearch size={16} style={{ position: 'absolute', left: 12, color: 'var(--muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Search by title…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => { setSearch(''); }}
                style={{ position: 'absolute', right: 10, background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', cursor: 'pointer' }}
              >
                <FiX size={14} />
              </button>
            )}
          </div>

          {/* Status filter */}
          <select
            className="form-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ width: 'auto', minWidth: 140 }}
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Category filter */}
          <select
            className="form-select"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            style={{ width: 'auto', minWidth: 160 }}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Clear filters */}
          {isFiltered && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setSearch(''); setStatusFilter(''); setCategoryFilter(''); }}
            >
              <FiX size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ===== BULK ACTION BAR ===== */}
      {selected.size > 0 && (
        <div className="bulk-bar">
          <span className="bulk-bar-count">{selected.size} selected</span>
          <button className="btn btn-success btn-sm" onClick={handleBulkPublish}>
            <FiCheckCircle size={13} /> Publish
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleBulkDraft}>
            <FiCornerLeftUp size={13} /> Draft
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => setBulkDeleteOpen(true)}>
            <FiTrash2 size={13} /> Delete
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setSelected(new Set()); setAllChecked(false); }}
            style={{ marginLeft: 'auto' }}
          >
            <FiX size={13} /> Deselect all
          </button>
        </div>
      )}

      {/* ===== TABLE CARD ===== */}
      <div className="cms-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="cms-table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table className="cms-table">
            <thead>
              <tr>
                {/* Checkbox */}
                <th style={{ width: 40, padding: '12px 14px' }}>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    style={{ width: 16, height: 16, accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                </th>

                {/* Title */}
                <th
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('title')}
                >
                  Title <SortIcon col="title" />
                </th>

                <th>Author</th>
                <th>Category</th>

                {/* Status */}
                <th
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('status')}
                >
                  Status <SortIcon col="status" />
                </th>

                {/* SEO Score */}
                <th style={{ textAlign: 'center' }}>SEO</th>

                {/* Published At */}
                <th
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('published_at')}
                >
                  Published <SortIcon col="published_at" />
                </th>

                {/* Created At */}
                <th
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('created_at')}
                >
                  Created <SortIcon col="created_at" />
                </th>

                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading
                ? Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonRow key={i} />)
                : blogs.length === 0
                  ? <EmptyState filtered={isFiltered} />
                  : blogs.map((blog) => {
                      const isSelected = selected.has(blog.id);
                      return (
                        <tr
                          key={blog.id}
                          style={isSelected ? { background: 'var(--primary-light)' } : {}}
                        >
                          {/* Checkbox */}
                          <td style={{ width: 40 }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(blog.id)}
                              style={{ width: 16, height: 16, accentColor: 'var(--primary)', cursor: 'pointer' }}
                            />
                          </td>

                          {/* Title */}
                          <td>
                            <div style={{ maxWidth: 280 }}>
                              <div
                                style={{
                                  fontWeight: 600,
                                  color: 'var(--text-primary)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  marginBottom: 2,
                                  fontSize: 13.5,
                                }}
                                title={blog.title}
                              >
                                {blog.title}
                              </div>
                              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                /blog/{blog.slug}
                              </div>
                            </div>
                          </td>

                          {/* Author */}
                          <td>
                              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                                {blog.author || '—'}
                              </span>
                          </td>

                          {/* Category */}
                          <td>
                            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                              {getBlogCategory(blog)}
                            </span>
                          </td>

                          {/* Status */}
                          <td>
                            <StatusBadge status={blog.status} />
                          </td>

                          {/* SEO Score */}
                          <td style={{ textAlign: 'center' }}>
                            <span className={`seo-score ${seoScoreClass(blog.seo_score || 0)}`}>
                              {blog.seo_score || 0}
                            </span>
                          </td>

                          {/* Published */}
                          <td>
                            {blog.published_at
                              ? <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                                  {format(new Date(blog.published_at), 'MMM d, yyyy')}
                                </span>
                              : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                          </td>

                          {/* Created */}
                          <td>
                            <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                              {format(new Date(blog.created_at), 'MMM d, yyyy')}
                            </span>
                          </td>

                          {/* Actions */}
                          <td>
                            <RowActions blog={blog} setDeleteTarget={setDeleteTarget} />
                          </td>
                        </tr>
                      );
                    })
              }
            </tbody>
          </table>
        </div>

        {/* ===== PAGINATION ===== */}
        {!loading && totalCount > PAGE_SIZE && (
          <div className="pagination">
            <div className="pagination-info">
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, totalCount)}–
              {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount.toLocaleString()} posts
            </div>
            <div className="pagination-buttons">
              <button
                className="page-btn"
                onClick={() => setPage(1)}
                disabled={page === 1}
                title="First page"
              >
                «
              </button>
              <button
                className="page-btn"
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                title="Previous page"
              >
                <FiChevronLeft size={14} />
              </button>

              {pageNumbers.map(n => (
                <button
                  key={n}
                  className={`page-btn ${n === page ? 'active' : ''}`}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}

              <button
                className="page-btn"
                onClick={() => setPage(p => p + 1)}
                disabled={page === totalPages}
                title="Next page"
              >
                <FiChevronRight size={14} />
              </button>
              <button
                className="page-btn"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                title="Last page"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===== DELETE DIALOGS ===== */}
      {deleteTarget && (
        <DeleteDialog
          blog={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}

      {bulkDeleteOpen && (
        <BulkDeleteDialog
          count={selected.size}
          onConfirm={handleBulkDelete}
          onCancel={() => setBulkDeleteOpen(false)}
          loading={bulkDeleteLoading}
        />
      )}

      <style jsx>{`
        /* Row dropdown */
        .row-dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 4px);
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          min-width: 150px;
          z-index: 50;
          box-shadow: var(--shadow);
          overflow: hidden;
        }
        .row-dropdown-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 14px;
          font-size: 13px;
          color: var(--text-secondary);
          transition: var(--transition);
          cursor: pointer;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
          text-decoration: none;
        }
        .row-dropdown-item:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
        .row-dropdown-item.danger { color: var(--danger); }
        .row-dropdown-item.danger:hover { background: rgba(239,68,68,0.1); }
        .row-dropdown-divider {
          height: 1px;
          background: var(--border);
          margin: 4px 0;
        }
      `}</style>
    </AdminLayout>
  );
}
