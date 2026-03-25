'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  section?: string;
}

interface SidebarLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  title: string;
  userRole?: 'admin' | 'user'; // optional: kept for backward compat but no longer used for redirect
}

export default function SidebarLayout({ children, navItems, title }: SidebarLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; username: string; role: string; department: string } | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) { router.push('/login'); return null; }
        return res.json();
      })
      .then(data => {
        if (data) {
          // Only redirect to login if not authenticated.
          // Role-based nav is handled by each page passing the correct navItems.
          setUser(data);
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#f0f4f8',
      }}>
        <div className="loading-screen">
          <div className="spinner" />
          <span>로딩 중...</span>
        </div>
      </div>
    );
  }

  const currentLabel = navItems.find(i => i.href === pathname)?.label || '';

  // Group by section
  type SectionGroup = { label?: string; items: NavItem[] };
  const sections: SectionGroup[] = [];
  let current: SectionGroup | null = null;
  for (const item of navItems) {
    const sectionLabel: string | undefined = current ? current.label : undefined;
    if (item.section !== sectionLabel) {
      current = { label: item.section, items: [] };
      sections.push(current);
    }
    current!.items.push(item);
  }

  return (
    <div className="layout-root">
      {/* ── Sidebar ── */}
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          {!collapsed && (
            <div className="sidebar-logo-text">
              <div className="title">공정 SCM</div>
              <div className="sub">{title}</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {sections.map((section, si) => (
            <div key={si}>
              {section.label && !collapsed && (
                <div
                  className="sidebar-section-label"
                  style={{ marginTop: si > 0 ? '8px' : '0' }}
                >
                  {section.label}
                </div>
              )}
              {section.items.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link${pathname === item.href ? ' active' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="sidebar-bottom">
          {!collapsed && (
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">{user.name[0]}</div>
              <div className="sidebar-user-info">
                <div className="name">{user.name}</div>
                <div className="dept">{user.department}</div>
              </div>
            </div>
          )}
          <button className="sidebar-logout" onClick={handleLogout} title="로그아웃">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && <span>로그아웃</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-area">
        {/* Topbar */}
        <header className="topbar">
          <button className="topbar-toggle" onClick={() => setCollapsed(!collapsed)} title="메뉴 접기/펼치기">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="topbar-breadcrumb">
            <span className="topbar-breadcrumb-root">SCM</span>
            <svg width="14" height="14" fill="none" stroke="#cbd5e1" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="topbar-page-title">{currentLabel}</span>
          </div>

          <div className="topbar-right">
            <span
              className="topbar-role-badge"
              style={
                user.role === 'admin'
                  ? { background: '#dbeafe', color: '#1d4ed8' }
                  : { background: '#dcfce7', color: '#15803d' }
              }
            >
              {user.role === 'admin' ? '관리자' : '사용자'}
            </span>
            <div className="topbar-user-chip">
              <div className="topbar-avatar">{user.name[0]}</div>
              <span className="topbar-user-name">{user.name}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
