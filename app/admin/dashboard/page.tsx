'use client';

import { useEffect, useState } from 'react';
import SidebarLayout from '@/components/layout/SidebarLayout';

/* ── 공통 내비게이션 ─────────────────────────────────── */
export const adminNav = [
  {
    href: '/admin/dashboard', label: '대시보드', section: '메인',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    href: '/admin/users', label: '계정 관리', section: '관리',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  },
  {
    href: '/workorders', label: '작업지시', section: '공정관리',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  },
  {
    href: '/processes', label: '공정 관리', section: '공정관리',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
  },
  {
    href: '/equipment', label: '설비 관리', section: '공정관리',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" /></svg>,
  },
  {
    href: '/materials', label: '자재 관리', section: '공정관리',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  },
];

// Note: userNav is defined separately in /app/dashboard/page.tsx for user role

/* ── 상수 ──────────────────────────────────────────── */
const WO_STATUS: Record<string, { label: string; cls: string; color: string }> = {
  pending:     { label: '대기',   cls: 'badge-gray',   color: '#64748b' },
  in_progress: { label: '진행중', cls: 'badge-blue',   color: '#1d4ed8' },
  completed:   { label: '완료',   cls: 'badge-green',  color: '#15803d' },
  paused:      { label: '일시정지', cls: 'badge-amber', color: '#92400e' },
  cancelled:   { label: '취소',   cls: 'badge-red',    color: '#b91c1c' },
};

const PRIORITY: Record<string, { label: string; cls: string }> = {
  urgent: { label: '긴급', cls: 'badge-red' },
  high:   { label: '높음', cls: 'badge-orange' },
  normal: { label: '보통', cls: 'badge-blue' },
  low:    { label: '낮음', cls: 'badge-gray' },
};

const EQP_STATUS: Record<string, { label: string; cls: string }> = {
  running:     { label: '가동중',   cls: 'badge-green' },
  idle:        { label: '대기',     cls: 'badge-gray' },
  maintenance: { label: '정비중',   cls: 'badge-amber' },
  breakdown:   { label: '고장',     cls: 'badge-red' },
};

/* ── 컴포넌트 ───────────────────────────────────────── */
export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalWO: 0, inProgressWO: 0, completedWO: 0, pendingWO: 0,
    totalProcesses: 0,
    totalEquipment: 0, runningEqp: 0, maintenanceEqp: 0,
    totalMaterials: 0, lowMaterials: 0,
    avgProgress: 0,
  });
  const [recentWO, setRecentWO] = useState<{
    id: string; workOrderNo: string; productName: string; processName: string;
    status: string; priority: string; progressRate: number; assignedTo: string;
  }[]>([]);
  const [alerts, setAlerts] = useState<{
    type: 'material' | 'equipment' | 'overdue';
    message: string; sub: string; level: 'warn' | 'error';
  }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [wos, procs, eqps, mats] = await Promise.all([
          fetch('/api/workorders').then(r => r.json()),
          fetch('/api/processes').then(r => r.json()),
          fetch('/api/equipment').then(r => r.json()),
          fetch('/api/materials').then(r => r.json()),
        ]);

        const inProg = wos.filter((w: {status:string}) => w.status === 'in_progress');
        const avgProgress = inProg.length
          ? Math.round(inProg.reduce((s: number, w: {progressRate:number}) => s + w.progressRate, 0) / inProg.length)
          : 0;

        setStats({
          totalWO: wos.length,
          inProgressWO: inProg.length,
          completedWO: wos.filter((w: {status:string}) => w.status === 'completed').length,
          pendingWO: wos.filter((w: {status:string}) => w.status === 'pending').length,
          totalProcesses: procs.length,
          totalEquipment: eqps.length,
          runningEqp: eqps.filter((e: {status:string}) => e.status === 'running').length,
          maintenanceEqp: eqps.filter((e: {status:string}) => ['maintenance','breakdown'].includes(e.status)).length,
          totalMaterials: mats.length,
          lowMaterials: mats.filter((m: {status:string}) => ['low','out'].includes(m.status)).length,
          avgProgress,
        });

        // 최근 작업지시 (진행중 우선)
        const sorted = [...wos].sort((a: {status:string}, b: {status:string}) => {
          const order: Record<string,number> = { in_progress: 0, pending: 1, paused: 2, completed: 3, cancelled: 4 };
          return (order[a.status] ?? 9) - (order[b.status] ?? 9);
        });
        setRecentWO(sorted.slice(0, 6));

        // 알림 생성
        const al: typeof alerts = [];
        mats.filter((m: {status:string; name:string}) => m.status === 'out').forEach((m: {name:string}) =>
          al.push({ type: 'material', message: `${m.name} 자재 소진`, sub: '즉시 발주 필요', level: 'error' })
        );
        mats.filter((m: {status:string; name:string}) => m.status === 'low').forEach((m: {name:string}) =>
          al.push({ type: 'material', message: `${m.name} 재고 부족`, sub: '안전재고 이하', level: 'warn' })
        );
        eqps.filter((e: {status:string; name:string}) => e.status === 'breakdown').forEach((e: {name:string}) =>
          al.push({ type: 'equipment', message: `${e.name} 고장`, sub: '즉시 점검 필요', level: 'error' })
        );
        eqps.filter((e: {status:string; name:string}) => e.status === 'maintenance').forEach((e: {name:string}) =>
          al.push({ type: 'equipment', message: `${e.name} 정비 중`, sub: '가동 불가 상태', level: 'warn' })
        );
        setAlerts(al.slice(0, 8));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  /* 진행률 게이지 바 */
  const ProgressBar = ({ value, color = '#2563eb', height = 8 }: { value: number; color?: string; height?: number }) => (
    <div style={{ background: '#e2e8f0', borderRadius: 99, height, overflow: 'hidden', width: '100%' }}>
      <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.4s ease' }} />
    </div>
  );

  const statCards = [
    {
      label: '작업지시', value: stats.totalWO,
      sub: `진행중 ${stats.inProgressWO}건`,
      color: '#1d4ed8', bg: '#dbeafe',
      icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
    },
    {
      label: '평균 진행률', value: `${stats.avgProgress}%`,
      sub: `완료 ${stats.completedWO}건 / 대기 ${stats.pendingWO}건`,
      color: '#7c3aed', bg: '#ede9fe',
      icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    },
    {
      label: '설비 현황', value: `${stats.runningEqp}/${stats.totalEquipment}`,
      sub: `정비·고장 ${stats.maintenanceEqp}대`,
      color: '#047857', bg: '#d1fae5',
      icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" /></svg>,
    },
    {
      label: '자재 현황', value: stats.totalMaterials,
      sub: `부족·소진 ${stats.lowMaterials}종`,
      color: stats.lowMaterials > 0 ? '#b45309' : '#047857',
      bg: stats.lowMaterials > 0 ? '#fef3c7' : '#d1fae5',
      icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
    },
    {
      label: '등록 공정', value: stats.totalProcesses,
      sub: '공정 정의 수',
      color: '#0e7490', bg: '#cffafe',
      icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
    },
  ];

  return (
    <SidebarLayout navItems={adminNav} title="공정 관리" userRole="admin">
      {loading ? (
        <div className="loading-screen" style={{ minHeight: '300px' }}><div className="spinner" /><span>데이터를 불러오는 중...</span></div>
      ) : (
        <>
          <div className="page-header">
            <div className="page-header-left">
              <h2>공정 현황 대시보드</h2>
              <p>공정 흐름 및 작업지시 진행 상태를 실시간으로 확인합니다.</p>
            </div>
            <a href="/workorders" className="btn btn-primary">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              작업지시 등록
            </a>
          </div>

          {/* Stat cards */}
          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
            {statCards.map((c, i) => (
              <div key={i} className="stat-card">
                <div className="stat-icon" style={{ background: c.bg }}>
                  <span style={{ color: c.color }}>{c.icon}</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="stat-label">{c.label}</div>
                  <div className="stat-value" style={{ color: c.color }}>{c.value}</div>
                  <div className="stat-sub">{c.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Main content */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '18px', alignItems: 'start' }}>

            {/* 작업지시 현황 테이블 */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">작업지시 현황</span>
                <a href="/workorders" className="card-link">전체 보기 →</a>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>작업지시번호</th>
                      <th>제품명</th>
                      <th>공정</th>
                      <th>우선순위</th>
                      <th>담당자</th>
                      <th style={{ width: 160 }}>진행률</th>
                      <th>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentWO.length === 0 ? (
                      <tr><td colSpan={7} className="table-empty">작업지시가 없습니다.</td></tr>
                    ) : recentWO.map(w => {
                      const st = WO_STATUS[w.status] ?? { label: w.status, cls: 'badge-gray', color: '#64748b' };
                      const pr = PRIORITY[w.priority] ?? { label: w.priority, cls: 'badge-gray' };
                      return (
                        <tr key={w.id}>
                          <td><span className="text-mono" style={{ fontSize: 12, fontWeight: 700 }}>{w.workOrderNo}</span></td>
                          <td style={{ fontWeight: 600 }}>{w.productName}</td>
                          <td style={{ color: '#475569', fontSize: 13 }}>{w.processName}</td>
                          <td><span className={`badge ${pr.cls}`}>{pr.label}</span></td>
                          <td style={{ color: '#475569', fontSize: 13 }}>{w.assignedTo || '-'}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1 }}>
                                <ProgressBar value={w.progressRate} color={st.color} height={6} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: st.color, minWidth: 32, textAlign: 'right' }}>
                                {w.progressRate}%
                              </span>
                            </div>
                          </td>
                          <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 알림 패널 */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">⚠ 주의 알림</span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{alerts.length}건</span>
              </div>
              <div>
                {alerts.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 14 }}>
                    이상 없음 ✓
                  </p>
                ) : alerts.map((al, i) => (
                  <div key={i} className="list-row" style={{
                    borderLeft: `3px solid ${al.level === 'error' ? '#dc2626' : '#d97706'}`,
                  }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="list-row-primary truncate">{al.message}</div>
                      <div className="list-row-secondary">{al.sub}</div>
                    </div>
                    <span className={`badge ${al.level === 'error' ? 'badge-red' : 'badge-amber'}`}
                      style={{ flexShrink: 0, marginLeft: 8 }}>
                      {al.level === 'error' ? '긴급' : '주의'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </>
      )}
    </SidebarLayout>
  );
}
