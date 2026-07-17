import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FiGrid,
  FiFileText,
  FiSearch,
  FiCode,
  FiRepeat,
  FiMap,
  FiSettings,
  FiNavigation,
  FiBarChart2,
  FiImage,
  FiPieChart,
  FiLogOut,
  FiUser,
  FiUsers,
  FiChevronRight,
  FiBell,
  FiExternalLink,
  FiMoon,
  FiSun,
  FiMessageSquare,
  FiSidebar,
  FiFolder,
  FiTag,
} from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useAppContext } from '../../context/AppContext';

/* ------------------------------------------------------------------ */
/*  Nav definition                                                      */
/* ------------------------------------------------------------------ */
const NAV_SECTIONS = [
  {
    label: 'Content',
    items: [
      { label: 'Dashboard',     icon: FiGrid,       href: '/dashboard' },
      { label: 'Blog Posts',    icon: FiFileText,   href: '/blogs' },
      { label: 'Categories',    icon: FiFolder,     href: '/categories' },
      { label: 'Tags',          icon: FiTag,        href: '/tags' },
      { label: 'Comments',      icon: FiMessageSquare, href: '/comments' },
      { label: 'Media Library', icon: FiImage,      href: '/media' },
    ],
  },
  {
    label: 'SEO & Technical',
    items: [
      { label: 'SEO Pages',    icon: FiSearch,      href: '/seo' },
      { label: 'Schema',       icon: FiCode,        href: '/schema' },
      { label: 'Redirects',    icon: FiRepeat,      href: '/redirects' },
      { label: 'Sitemap',      icon: FiMap,         href: '/sitemap' },
      { label: 'Robots.txt',   icon: FiSettings,    href: '/robots' },
      { label: 'Breadcrumbs',  icon: FiNavigation,  href: '/breadcrumbs' },
    ],
  },
  {
    label: 'Insights & System',
    items: [
      { label: 'Analytics',     icon: FiBarChart2,    href: '/analytics' },
      { label: 'Reports',       icon: FiPieChart,     href: '/reports' },
      { label: 'Announcements', icon: FiMessageSquare, href: '/announcements' },
      { label: 'Authors',       icon: FiUser,         href: '/authors' },
      { label: 'Users & Roles', icon: FiUsers,        href: '/users' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  AdminLayout                                                         */
/* ------------------------------------------------------------------ */
export default function AdminLayout({ children, title = 'Dashboard' }) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [userInitial, setUserInitial] = useState('A');
  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const { isCollapsed, toggleCollapse, theme, toggleTheme } = useAppContext();

  /* Fetch current user & Auto-create Author profile */
  useEffect(() => {
    const fetchUserAndSyncAuthor = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        const email = session.user.email;
        setUserEmail(email);
        setUserInitial(email.charAt(0).toUpperCase());

        // Check if author profile exists, if not create it
        try {
          const { data: existingAuthor } = await supabase.from('authors').select('id').eq('email', email).single();
          if (!existingAuthor) {
            const name = email.split('@')[0];
            await supabase.from('authors').insert([{
              name: name,
              slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              email: email,
              is_active: true
            }]);
          }
        } catch (e) {
          console.error('Error syncing author:', e);
        }

        // Check if user exists in cms_users, if not create it as admin
        try {
          const { data: existingCmsUser } = await supabase.from('cms_users').select('id').eq('email', email).single();
          if (!existingCmsUser) {
            const name = email.split('@')[0];
            await supabase.from('cms_users').insert([{
              id: session.user.id, // Provide the auth user ID!
              full_name: name,
              email: email,
              role: 'admin',
              is_active: true
            }]);
          }
        } catch (e) {
          console.error('Error syncing cms user:', e);
        }
      }
    };
    fetchUserAndSyncAuthor();
  }, []);

  /* Close sidebar overlay on route change (mobile) */
  useEffect(() => {
    setSidebarOpen(false);
  }, [router.pathname]);

  /* Logout handler */
  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Signed out successfully');
      router.push('/login');
    } catch (err) {
      toast.error(err?.message || 'Failed to sign out');
      setLoggingOut(false);
    }
  };

  /* Active route detection */
  const isActive = (href) => {
    if (href === '/dashboard') {
      return router.pathname === '/dashboard';
    }
    return router.pathname === href || router.pathname.startsWith(href + '/');
  };

  return (
    <>
      <style>{`
        /* ── Mobile hamburger button ──────────────────────── */
        .hamburger {
          display: none;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background: transparent;
          border: 1px solid var(--border);
          color: var(--muted);
          cursor: pointer;
          font-size: 20px;
          transition: all var(--transition);
        }
        .hamburger:hover {
          background: rgba(255,255,255,0.06);
          color: var(--text);
        }
        @media (max-width: 768px) {
          .hamburger { display: flex; }
          .cms-sidebar-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(2px);
            z-index: 99;
          }
          .cms-sidebar { z-index: 100; }
        }

        /* ── Sidebar transition ───────────────────────────── */
        @media (max-width: 768px) {
          .cms-sidebar {
            transform: translateX(-100%);
            transition: transform 0.25s ease;
          }
          .cms-sidebar.open {
            transform: translateX(0);
          }
        }

        /* ── Header live dot ─────────────────────────────── */
        .header-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--success);
          box-shadow: 0 0 6px rgba(34, 197, 94, 0.6);
          animation: pulse-dot 2s ease-in-out infinite;
          flex-shrink: 0;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(0.85); }
        }

        /* ── Nav item active indicator bar ───────────────── */
        .nav-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 20%;
          bottom: 20%;
          width: 3px;
          background: var(--primary);
          border-radius: 0 3px 3px 0;
        }
        .nav-item { position: relative; }

        /* ── Sidebar nav scrollbar slim ──────────────────── */
        .sidebar-nav::-webkit-scrollbar { width: 3px; }
        .sidebar-nav::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

        /* ── Logout spinner ──────────────────────────────── */
        .logout-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(252,165,165,0.3);
          border-top-color: #FCA5A5;
          border-radius: 50%;
          animation: cms-spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        /* ── Header divider ──────────────────────────────── */
        .header-divider {
          width: 1px;
          height: 24px;
          background: var(--border);
          flex-shrink: 0;
        }

        /* ── External link btn ───────────────────────────── */
        .header-ext-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 13px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          background: transparent;
          color: var(--muted);
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          transition: all var(--transition);
          font-family: inherit;
          white-space: nowrap;
        }
        .header-ext-link:hover {
          background: rgba(255,255,255,0.06);
          border-color: var(--border-light);
          color: var(--text);
        }

        /* ── Collapsed Sidebar ───────────────────────────── */
        .cms-layout.collapsed {
          --sidebar-width: 80px;
        }
        .cms-layout.collapsed .sidebar-logo-text,
        .cms-layout.collapsed .sidebar-section-label,
        .cms-layout.collapsed .nav-label {
          display: none;
        }
        .cms-layout.collapsed .nav-chevron {
          display: none;
        }
        .cms-layout.collapsed .sidebar-logo {
          padding: 24px 0;
        }
        .cms-layout.collapsed .sidebar-user-info {
          display: none;
        }
        .cms-layout.collapsed .sidebar-logout-text {
          display: none;
        }
        .cms-layout.collapsed .sidebar-logout-btn {
          justify-content: center;
          padding: 10px;
        }
        .cms-layout.collapsed .nav-item {
          justify-content: center;
          padding: 12px 0;
        }
        .cms-layout.collapsed .nav-icon {
          margin-right: 0;
        }

        /* ── Header User Dropdown ────────────────────────── */
        .header-user-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 240px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          z-index: 1000;
        }
        .header-user-info {
          display: flex;
          flex-direction: column;
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: 12px;
          margin-bottom: 4px;
        }
        .header-user-email {
          font-weight: 600;
          color: var(--text);
          font-size: 14px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .header-user-role {
          font-size: 12px;
          color: var(--primary);
          margin-top: 2px;
        }
      `}</style>

      <div className={`cms-layout ${isCollapsed ? 'collapsed' : ''}`}>
        {/* ── Mobile overlay ───────────────────────────────── */}
        {sidebarOpen && (
          <div
            className="cms-sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/*  SIDEBAR                                          */}
        {/* ══════════════════════════════════════════════════ */}
        <aside className={`cms-sidebar${sidebarOpen ? ' open' : ''}`}>
          {/* Logo */}
          <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {!isCollapsed ? (
                <div className="sidebar-logo-inner" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <img src="/custom-logo.webp" alt="Anantya.ai Logo" style={{ display: 'block', objectFit: 'contain', flexShrink: 0, width: '175px', height: 'auto', marginRight: '5px' }} />
                  <div className="sidebar-logo-text">
                    <span className="sidebar-logo-badge">CMS</span>
                  </div>
                </div>
              ) : (
                <div className="sidebar-logo-inner">
                  <img src="/custom-logo.webp" alt="Anantya.ai Logo" style={{ objectFit: 'contain', flexShrink: 0, margin: 0, width: '60px', height: 'auto' }} />
                </div>
              )}
          </div>

          {/* Navigation */}
          <nav className="sidebar-nav" aria-label="Main navigation">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label}>
                <p className="sidebar-section-label">{section.label}</p>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`nav-item${active ? ' active' : ''}`}
                      aria-current={active ? 'page' : undefined}
                    >
                      <span className="nav-icon">
                        <Icon />
                      </span>
                      <span className="nav-label">{item.label}</span>
                      {active && (
                        <FiChevronRight
                          className="nav-chevron"
                          style={{ fontSize: 13, marginLeft: 'auto', opacity: 0.6 }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Footer: logout + toggle */}
          <div className="sidebar-footer" style={{ 
            display: 'flex', 
            flexDirection: isCollapsed ? 'column' : 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: isCollapsed ? '15px' : '0'
          }}>
            <button
              className="sidebar-logout-btn"
              onClick={handleLogout}
              disabled={loggingOut}
              aria-label="Sign out"
              style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
            >
              {loggingOut ? (
                <>
                  <span className="logout-spinner" />
                  {!isCollapsed && <span className="sidebar-logout-text" style={{ marginLeft: '8px' }}>Signing out…</span>}
                </>
              ) : (
                <>
                  <FiLogOut style={{ fontSize: 18 }} />
                  {!isCollapsed && <span className="sidebar-logout-text" style={{ marginLeft: '8px' }}>Sign Out</span>}
                </>
              )}
            </button>

            <button 
              onClick={toggleCollapse} 
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'var(--muted)', 
                cursor: 'pointer', 
                display: 'flex', 
                padding: '10px',
                marginLeft: isCollapsed ? '0' : '5px'
              }}
              title="Toggle Sidebar"
            >
              <FiSidebar size={20} />
            </button>
          </div>
        </aside>

        {/* ══════════════════════════════════════════════════ */}
        {/*  MAIN AREA                                        */}
        {/* ══════════════════════════════════════════════════ */}
        <div className="cms-main">
          {/* ── Header ─────────────────────────────────────── */}
          <header className="cms-header" role="banner">
            <div className="cms-header-left">
              {/* Mobile hamburger */}
              <button
                className="hamburger"
                onClick={() => setSidebarOpen((prev) => !prev)}
                aria-label="Toggle sidebar"
              >
                ☰
              </button>

              <div>
                <h1 className="cms-header-title">{title}</h1>
              </div>
            </div>

            <div className="cms-header-right">


              <a
                href="https://anantya.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="header-ext-link"
              >
                <FiExternalLink style={{ fontSize: 13 }} />
                View Site
              </a>

              <div className="header-divider" />

              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="header-ext-link"
                style={{ padding: '7px', border: 'none' }}
                title="Toggle Theme"
              >
                {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
              </button>

              <div className="header-divider" />

              {/* User avatar */}
              <div style={{ position: 'relative' }}>
                <div
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0,
                    border: '2px solid rgba(1,142,158,0.3)',
                    cursor: 'pointer',
                  }}
                  title={userEmail}
                >
                  {userInitial}
                </div>
                
                {userDropdownOpen && (
                  <>
                    <div 
                      style={{ position: 'fixed', inset: 0, zIndex: 999 }} 
                      onClick={() => setUserDropdownOpen(false)} 
                    />
                    <div className="header-user-dropdown">
                      <div className="header-user-info">
                        <div className="header-user-email" title={userEmail}>
                          {userEmail || 'Admin User'}
                        </div>
                        <div className="header-user-role">Administrator</div>
                      </div>
                      
                      <button
                        className="sidebar-logout-btn"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        aria-label="Sign out"
                        style={{ margin: 0, width: '100%', justifyContent: 'center' }}
                      >
                        {loggingOut ? (
                          <>
                            <span className="logout-spinner" />
                            Signing out…
                          </>
                        ) : (
                          <>
                            <FiLogOut style={{ fontSize: 15 }} />
                            Sign Out
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* ── Page Content ────────────────────────────────── */}
          <main className="cms-page-content" role="main">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
