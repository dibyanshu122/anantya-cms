import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FiFileText, FiCheckCircle, FiEdit3, FiLayout, FiLink,
  FiAlertCircle, FiTrendingUp, FiTrendingDown, FiMinus,
  FiPlusCircle, FiGlobe, FiRefreshCw, FiMap, FiArrowRight,
  FiBarChart2, FiEye, FiClock, FiStar,
} from 'react-icons/fi';
import { format } from 'date-fns';
import AdminLayout from '../components/layout/AdminLayout';
import { supabase } from '../lib/supabase';

/* ================================================================
   HELPER: SEO score styling
   ================================================================ */
function seoScoreClass(score) {
  if (score >= 70) return 'seo-score-good';
  if (score >= 40) return 'seo-score-ok';
  return 'seo-score-poor';
}

/* ================================================================
   SKELETON COMPONENTS
   ================================================================ */
function StatSkeleton() {
  return (
    <div className="stat-card">
      <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 10 }} />
      <div className="skeleton" style={{ width: 70, height: 28, borderRadius: 6 }} />
      <div className="skeleton" style={{ width: 110, height: 14, borderRadius: 6 }} />
    </div>
  );
}

function RowSkeleton() {
  return (
    <tr>
      {[200, 100, 80, 80, 50, 50].map((w, i) => (
        <td key={i} style={{ padding: '14px' }}>
          <div className="skeleton" style={{ width: w, height: 14, borderRadius: 6 }} />
        </td>
      ))}
    </tr>
  );
}

/* ================================================================
   STAT CARD
   ================================================================ */
function StatCard({ icon: Icon, iconBg, iconColor, number, label, trend, trendLabel, loading }) {
  const [isHovered, setIsHovered] = useState(false);
  const trendClass = trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral';
  
  return (
    <div 
      className="stat-card" 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', padding: 20 }}
    >
      <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={24} color={iconColor} />
        </div>
        {trend !== null && !loading && (
          <div className={`stat-trend ${trendClass}`} style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
            {trend > 0 ? <FiTrendingUp size={13} /> : trend < 0 ? <FiTrendingDown size={13} /> : <FiMinus size={13} />}
            <span>{trendLabel}</span>
          </div>
        )}
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
          <div className="skeleton" style={{ width: 60, height: 28, borderRadius: 6 }} />
          <div className="skeleton" style={{ width: 120, height: 13, borderRadius: 6 }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
          <div className="stat-number" style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {number.toLocaleString()}
          </div>
          <div className="stat-label" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {label}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   DASHBOARD PAGE
   ================================================================ */
export default function Dashboard() {
  const router = useRouter();

  const [stats, setStats] = useState({
    totalBlogs: 0,
    published: 0,
    drafts: 0,
    pagesManaged: 0,
    totalRedirects: 0,
    seoIssues: 0,
  });

  const [recentBlogs, setRecentBlogs] = useState([]);
  const [seoIssuesList, setSeoIssuesList] = useState([]);
  const [missingSeoPaths, setMissingSeoPaths] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [generateLoading, setGenerateLoading] = useState(false);

  /* ---- Fetch stats ---- */
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const [blogsRes, publishedRes, draftsRes, pagesRes, redirectsRes, issuesRes] = await Promise.all([
        supabase.from('blogs').select('id', { count: 'exact', head: true }),
        supabase.from('blogs').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('blogs').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
        supabase.from('seo_pages').select('id', { count: 'exact', head: true }),
        supabase.from('redirects').select('id', { count: 'exact', head: true }),
        supabase.from('seo_issues').select('id', { count: 'exact', head: true }).eq('is_resolved', false),
      ]);

      setStats({
        totalBlogs:    blogsRes.count     || 0,
        published:     publishedRes.count || 0,
        drafts:        draftsRes.count    || 0,
        pagesManaged:  pagesRes.count     || 0,
        totalRedirects:redirectsRes.count || 0,
        seoIssues:     issuesRes.count    || 0,
      });
    } catch (e) {
      console.error('fetchStats error', e);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  /* ---- Fetch recent blogs ---- */
  const fetchRecentBlogs = useCallback(async () => {
    setLoadingBlogs(true);
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select(`
          id, title, slug, status, seo_score, published_at, created_at,
          authors ( name )
        `)
        .order('created_at', { ascending: false })
        .limit(8);

      if (!error) setRecentBlogs(data || []);
    } catch (e) {
      console.error('fetchRecentBlogs error', e);
    } finally {
      setLoadingBlogs(false);
    }
  }, []);

  /* ---- Fetch SEO issues ---- */
  const fetchSeoIssues = useCallback(async () => {
    setLoadingIssues(true);
    try {
      const [issuesRes, pagesRes] = await Promise.all([
        supabase
          .from('seo_issues')
          .select('id, issue_type, severity, page_path, description, detected_at')
          .eq('is_resolved', false)
          .order('detected_at', { ascending: false })
          .limit(6),
        supabase
          .from('seo_pages')
          .select('page_name, page_path, seo_title, seo_description')
          .or('seo_title.is.null,seo_description.is.null')
          .limit(4),
      ]);

      setSeoIssuesList(issuesRes.data || []);
      setMissingSeoPaths(pagesRes.data || []);
    } catch (e) {
      console.error('fetchSeoIssues error', e);
    } finally {
      setLoadingIssues(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchRecentBlogs();
    fetchSeoIssues();
  }, [fetchStats, fetchRecentBlogs, fetchSeoIssues]);

  /* ---- Generate sitemap (stub) ---- */
  const handleGenerateSitemap = async () => {
    setGenerateLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    setGenerateLoading(false);
    alert('Sitemap generation triggered! (Connect your sitemap API endpoint)');
  };

  /* ---- Severity dot color ---- */
  const severityColor = (sev) => {
    if (sev === 'error')   return 'var(--danger)';
    if (sev === 'warning') return 'var(--warning)';
    return 'var(--info)';
  };

  const STAT_CARDS = [
    {
      icon: FiFileText, iconBg: 'rgba(1,142,158,0.15)', iconColor: '#018E9E',
      number: stats.totalBlogs, label: 'Total Blog Posts', trend: 1, trendLabel: 'this month',
    },
    {
      icon: FiCheckCircle, iconBg: 'rgba(16,185,129,0.15)', iconColor: '#10B981',
      number: stats.published, label: 'Published Posts', trend: 1, trendLabel: 'live',
    },
    {
      icon: FiEdit3, iconBg: 'rgba(245,158,11,0.15)', iconColor: '#F59E0B',
      number: stats.drafts, label: 'Draft Posts', trend: 0, trendLabel: 'pending',
    },
    {
      icon: FiLayout, iconBg: 'rgba(139,92,246,0.15)', iconColor: '#8B5CF6',
      number: stats.pagesManaged, label: 'Pages Managed', trend: 0, trendLabel: 'configured',
    },
    {
      icon: FiLink, iconBg: 'rgba(59,130,246,0.15)', iconColor: '#3B82F6',
      number: stats.totalRedirects, label: 'Active Redirects', trend: 0, trendLabel: 'rules',
    },
    {
      icon: FiAlertCircle, iconBg: 'rgba(239,68,68,0.15)', iconColor: '#EF4444',
      number: stats.seoIssues, label: 'SEO Issues', trend: -1, trendLabel: 'need fix',
    },
  ];

  return (
    <AdminLayout title="Dashboard">
      {/* ===== WELCOME BANNER ===== */}
      <div className="welcome-banner">
        <div className="welcome-text">
          <h2>Welcome back! 👋</h2>
          <p>Here&apos;s your SEO &amp; content overview for today — {format(new Date(), 'MMMM d, yyyy')}.</p>
        </div>
        <div className="welcome-actions">
          <Link href="/blogs/new" className="btn btn-primary">
            <FiPlusCircle size={15} />
            New Blog Post
          </Link>
          <button className="btn btn-ghost" onClick={fetchStats}>
            <FiRefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* ===== STAT CARDS ===== */}
      <div className="stats-grid">
        {STAT_CARDS.map((card, i) =>
          loadingStats
            ? <StatSkeleton key={i} />
            : <StatCard key={i} {...card} loading={false} />
        )}
      </div>

      {/* ===== MAIN CONTENT GRID ===== */}
      <div className="dash-grid">

        {/* ---- LEFT COLUMN ---- */}
        <div className="dash-col-main">

          {/* Recent blogs table */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title">
                <FiFileText style={{ marginRight: 8, color: 'var(--primary)' }} />
                Recent Blog Posts
              </span>
              <Link href="/blogs" className="btn btn-ghost btn-sm" style={{ gap: 5 }}>
                View all <FiArrowRight size={13} />
              </Link>
            </div>

            {loadingBlogs ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th><th>Author</th><th>Status</th>
                      <th>Published</th><th>SEO</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>{Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)}</tbody>
                </table>
              </div>
            ) : recentBlogs.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 20px' }}>
                <FiFileText size={36} />
                <h3>No blog posts yet</h3>
                <p>Create your first blog post to get started.</p>
                <Link href="/blogs/new" className="btn btn-primary btn-sm">
                  <FiPlusCircle size={13} /> New Post
                </Link>
              </div>
            ) : (
              <div className="recent-blogs-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentBlogs.map((blog) => (
                  <Link 
                    key={blog.id} 
                    href={`/blogs/${blog.id}`}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '16px', 
                      border: '1px solid var(--border)', 
                      borderRadius: '8px', 
                      textDecoration: 'none',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-muted)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '15px', marginBottom: '4px' }}>
                        {blog.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        /blog/{blog.slug}
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {blog.published_at ? format(new Date(blog.published_at), 'MMM d, yyyy') : 'Draft'}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* SEO Issues */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <FiAlertCircle style={{ marginRight: 8, color: 'var(--danger)' }} />
                SEO Issues
                {stats.seoIssues > 0 && (
                  <span className="badge badge-error" style={{ marginLeft: 8 }}>
                    {stats.seoIssues} open
                  </span>
                )}
              </span>
              <Link href="/seo" className="btn btn-ghost btn-sm" style={{ gap: 5 }}>
                Manage <FiArrowRight size={13} />
              </Link>
            </div>

            {loadingIssues ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8 }} />
                ))}
              </div>
            ) : (
              <>
                {/* Pages missing SEO title/desc */}
                {missingSeoPaths.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                      Missing SEO Metadata
                    </div>
                    {missingSeoPaths.map((page) => (
                      <div key={page.page_path} className="issue-item">
                        <div className="issue-dot" style={{ background: page.seo_title ? 'var(--warning)' : 'var(--danger)' }} />
                        <div style={{ flex: 1 }}>
                          <div className="issue-text">
                            <strong>{page.page_name}</strong> — missing {!page.seo_title ? 'SEO title' : 'SEO description'}
                          </div>
                          <div className="issue-path">{page.page_path}</div>
                        </div>
                        <Link href={`/seo?page=${encodeURIComponent(page.page_path)}`} className="btn btn-ghost btn-sm">
                          Fix
                        </Link>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tracked SEO issues */}
                {seoIssuesList.length > 0 ? (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                      Tracked Issues
                    </div>
                    {seoIssuesList.map((issue) => (
                      <div key={issue.id} className="issue-item">
                        <div className="issue-dot" style={{ background: severityColor(issue.severity) }} />
                        <div style={{ flex: 1 }}>
                          <div className="issue-text">{issue.description || issue.issue_type.replace(/_/g, ' ')}</div>
                          {issue.page_path && <div className="issue-path">{issue.page_path}</div>}
                        </div>
                        <span className={`badge badge-${issue.severity}`}>{issue.severity}</span>
                      </div>
                    ))}
                  </div>
                ) : missingSeoPaths.length === 0 ? (
                  <div className="empty-state" style={{ padding: '24px 20px', gap: 8 }}>
                    <FiCheckCircle size={28} style={{ color: 'var(--success)', opacity: 1 }} />
                    <h3 style={{ color: 'var(--success)' }}>All clear!</h3>
                    <p>No SEO issues detected right now.</p>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>

        {/* ---- RIGHT COLUMN ---- */}
        <div className="dash-col-aside">

          {/* Quick Actions */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header" style={{ marginBottom: 14 }}>
              <span className="card-title">Quick Actions</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link href="/blogs/new" className="quick-action">
                <div className="quick-action-icon" style={{ background: 'rgba(1,142,158,0.15)', color: 'var(--primary)' }}>
                  <FiPlusCircle size={17} />
                </div>
                <span>New Blog Post</span>
                <FiArrowRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
              </Link>

              <Link href="/redirects/new" className="quick-action">
                <div className="quick-action-icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}>
                  <FiLink size={17} />
                </div>
                <span>Add Redirect</span>
                <FiArrowRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
              </Link>

              <Link href="/robots" className="quick-action">
                <div className="quick-action-icon" style={{ background: 'rgba(139,92,246,0.15)', color: '#8B5CF6' }}>
                  <FiGlobe size={17} />
                </div>
                <span>Edit Robots.txt</span>
                <FiArrowRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
              </Link>

              <button className="quick-action" onClick={handleGenerateSitemap} disabled={generateLoading}>
                <div className="quick-action-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                  {generateLoading
                    ? <FiRefreshCw size={17} className="spin" />
                    : <FiMap size={17} />}
                </div>
                <span>{generateLoading ? 'Generating…' : 'Generate Sitemap'}</span>
                {!generateLoading && <FiArrowRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
              </button>
            </div>
          </div>

          {/* Content overview donut-like summary */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header" style={{ marginBottom: 14 }}>
              <span className="card-title">Content Health</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <HealthBar
                label="Published"
                value={stats.published}
                total={Math.max(stats.totalBlogs, 1)}
                color="var(--success)"
              />
              <HealthBar
                label="Drafts"
                value={stats.drafts}
                total={Math.max(stats.totalBlogs, 1)}
                color="var(--warning)"
              />
              <HealthBar
                label="SEO Optimised"
                value={Math.max(0, stats.published - stats.seoIssues)}
                total={Math.max(stats.published, 1)}
                color="var(--primary)"
              />
            </div>
          </div>

          {/* Activity */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 14 }}>
              <span className="card-title">
                <FiClock style={{ marginRight: 8, color: 'var(--primary)' }} />
                Recent Activity
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {loadingBlogs
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 40, borderRadius: 8 }} />
                  ))
                : recentBlogs.slice(0, 5).map((blog) => (
                    <div key={blog.id} className="activity-item">
                      <div className="activity-dot" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="activity-title">{blog.title}</div>
                        <div className="activity-meta">
                          {blog.status} · {format(new Date(blog.created_at), 'MMM d')}
                        </div>
                      </div>
                    </div>
                  ))}
              {!loadingBlogs && recentBlogs.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No recent activity.</p>
              )}
            </div>
          </div>

        </div>
      </div>

      <style jsx>{`
        /* Welcome banner */
        .welcome-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg, rgba(1,142,158,0.12), rgba(1,142,158,0.04));
          border: 1px solid rgba(1,142,158,0.25);
          border-radius: var(--radius-lg);
          padding: 20px 24px;
          margin-bottom: 24px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .welcome-text h2 {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .welcome-text p {
          font-size: 13.5px;
          color: var(--text-muted);
        }
        .welcome-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        /* Stats grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        /* Dashboard two-column grid */
        .dash-grid {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 1100px) {
          .dash-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Activity */
        .activity-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .activity-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--primary);
          flex-shrink: 0;
          margin-top: 5px;
        }
        .activity-title {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .activity-meta {
          font-size: 11.5px;
          color: var(--text-muted);
          text-transform: capitalize;
        }

        /* Spin animation for generate sitemap */
        :global(.spin) {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Stat Cards */
        .stat-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
        }
        .stat-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }
        .stat-number {
          font-size: 28px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
        }
        .stat-label {
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 4px;
        }
        .stat-trend {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 12px;
        }
        .stat-trend.up { background: rgba(16, 185, 129, 0.15); color: #10B981; }
        .stat-trend.down { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
        .stat-trend.neutral { background: rgba(148, 163, 184, 0.15); color: var(--text-secondary); }

        /* Quick Actions */
        .quick-action {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: var(--bg-base);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          text-decoration: none;
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 500;
          transition: all var(--transition);
          width: 100%;
          cursor: pointer;
        }
        .quick-action:hover {
          background: var(--bg-secondary);
          border-color: var(--border-light);
          transform: translateY(-1px);
        }
        .quick-action-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
      `}</style>
    </AdminLayout>
  );
}

/* ================================================================
   HEALTH BAR
   ================================================================ */
function HealthBar({ label, value, total, color }) {
  const pct = Math.round((value / total) * 100);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color }}>
          {value} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({pct}%)</span>
        </span>
      </div>
      <div style={{ background: 'var(--bg-base)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            borderRadius: 99,
            transition: 'width 0.8s ease',
          }}
        />
      </div>
    </div>
  );
}
