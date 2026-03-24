'use client';

import { useEffect, useState } from 'react';
import SidebarLayout from '@/components/layout/SidebarLayout';

export const userNav = [
  {
    href: '/dashboard', label: '대시보드', section: '메인',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    href: '/workorders', label: '작업지시', section: '공정관리',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  },
  {
    href: '/processes', label: '공정 정의', section: '공정관리',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
  },
  {
    href: '/materials', label: '자재 관리', section: '공정관리',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  },
  {
    href: '/equipment', label: '설비 현황', section: '공정관리',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" /></svg>,
  },
];

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

const MAT_STATUS: Record<string, { label: string; cls: string }> = {
  normal: { label: '정상', cls: 'badge-green' },
  low:    { label: '부족', cls: 'badge-amber' },
  out:    { label: '소진', cls: 'badge-red' },
};

const ProgressBar = ({ value, color = '#2563eb' }: { value: number; color?: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{ flex: 1, background: '#e2e8f0', borderRadius: 99, height: 6, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(value, 100)}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.3s ease' }} />
    </div>
    <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 34, textAlign: 'right' }}>{value}%</span>
  </div>
);

export default function DashboardPage() {
  const [myName, setMyName] = useState('');
  const [stats, setStats] = useState({
    myWO: 0, inProgressWO: 0, completedWO: 0,
    totalMaterials: 0, lowMaterials: 0, outMaterials: 0,
    runningEqp: 0, maintenanceEqp: 0, totalEqp: 0,
    avgProgress: 0,
  });
  const [myWorkOrders, setMyWorkOrders] = useState<{
    id: string; workOrderNo: string; productName: string; processName: string;
    status: string; priority: string; progressRate: number; assignedTo: string;
    plannedEnd: string;
  }[]>([]);
  const [matAlerts, setMatAlerts] = useState<{
    id: string; materialCode: string; name: string; stockQty: number; minQty: number; unit: string; status: string;
  }[]>([]);
  const [eqpAlerts, setEqpAlerts] = useState<{
    id: string; equipmentCode: string; name: string; status: string; utilizationRate: number;
  }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [me, wos, mats, eqps] = await Promise.all([
          fetch('/api/auth/me').then(r => r.json()),
          fetch('/api/workorders').then(r => r.json()),
          fetch('/api/materials').then(r => r.json()),
          fetch('/api/equipment').then(r => r.json()),
        ]);
        setMyName(me.name);

        const allWOs = Array.isArray(wos) ? wos : [];
        const myWOs = allWOs.filter((w: { assignedTo: string }) => w.assignedTo === me.name || w.assignedTo === me.username);
        const inProg = allWOs.filter((w: { status: string }) => w.status === 'in_progress');
        const done = allWOs.filter((w: { status: string }) => w.status === 'completed');
        const avgP = inProg.length > 0 ? Math.round(inProg.reduce((s: number, w: { progressRate: number }) => s + w.progressRate, 0) / inProg.length) : 0;

        const allMats = Array.isArray(mats) ? mats : [];
        const lowMats = allMats.filter((m: { status: string }) => m.status === 'low');
        const outMats = allMats.filter((m: { status: string }) => m.status === 'out');

        const allEqps = Array.isArray(eqps) ? eqps : [];
        const runningEqps = allEqps.filter((e: { status: string }) => e.status === 'running');
        const maintEqps = allEqps.filter((e: { status: string }) => e.status === 'maintenance' || e.status === 'breakdown');

        setStats({
          myWO: myWOs.length || allWOs.length,
          inProgressWO: inProg.length,
          completedWO: done.length,
          totalMaterials: allMats.length,
          lowMaterials: lowMats.length,
          outMaterials: outMats.length,
          runningEqp: runningEqps.length,
          maintenanceEqp: maintEqps.length,
          totalEqp: allEqps.length,
          avgProgress: avgP,
        });

        setMyWorkOrders((myWOs.length ? myWOs : allWOs).filter((w: { status: string }) => w.status !== 'cancelled').slice(0, 6));
        setMatAlerts([...outMats, ...lowMats].slice(0, 5));
        setEqpAlerts(allEqps.filter((e: { status: string }) => e.status === 'maintenance' || e.status === 'breakdown' || e.status === 'idle').slice(0, 5));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const progressColor = (r: number) => r >= 100 ? '#15803d' : r >= 60 ? '#2563eb' : r >= 30 ? '#d97706' : '#94a3b8';

  return (
    <SidebarLayout navItems={userNav} title="공정 SCM" userRole="user">
      {loading ? (
        <div className="loading-screen" style={{ minHeight: '300px' }}>
          <div className="spinner" /><span>데이터를 불러오는 중...</span>
        </div>
      ) : (
        <>
          <div className="page-header">
            <div className="page-header-left">
              <h2>공정 흐름 대시보드</h2>
              <p>안녕하세요, <strong>{myName}</strong>님. 공정 진행 현황을 확인하세요.</p>
            </div>
            <a href="/workorders" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              진행도 입력
            </a>
          </div>

          {/* Stat cards */}
          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              {
                label: '진행중 작업',
                value: stats.inProgressWO,
                sub: `전체 ${stats.myWO}건`,
                color: '#1d4ed8', bg: '#dbeafe',
                icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
              },
              {
                label: '평균 진행률',
                value: `${stats.avgProgress}%`,
                sub: `완료 ${stats.completedWO}건`,
                color: '#15803d', bg: '#dcfce7',
                icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
              },
              {
                label: '자재 부족/소진',
                value: stats.lowMaterials + stats.outMaterials,
                sub: `전체 ${stats.totalMaterials}종`,
                color: stats.outMaterials > 0 ? '#b91c1c' : '#d97706', bg: stats.outMaterials > 0 ? '#fee2e2' : '#fef3c7',
                icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
              },
              {
                label: '설비 가동 중',
                value: stats.runningEqp,
                sub: `점검/고장 ${stats.maintenanceEqp}대`,
                color: '#7c3aed', bg: '#ede9fe',
                icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" /></svg>,
              },
            ].map((c, i) => (
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

          {/* 3-column card row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '18px', alignItems: 'start' }}>

            {/* Work Orders */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">작업지시 현황</span>
                <a href="/workorders" className="card-link">전체 보기 →</a>
              </div>
              <div>
                {myWorkOrders.length === 0
                  ? <p style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: '14px' }}>작업지시가 없습니다.</p>
                  : myWorkOrders.map(w => {
                    const st = WO_STATUS[w.status] || { label: w.status, cls: 'badge-gray', color: '#64748b' };
                    const pr = PRIORITY[w.priority] || { label: w.priority, cls: 'badge-gray' };
                    const pc = progressColor(w.progressRate);
                    return (
                      <div key={w.id} className="list-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                            <span className="text-mono" style={{ fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{w.workOrderNo}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.productName}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                            <span className={`badge ${pr.cls}`}>{pr.label}</span>
                            <span className={`badge ${st.cls}`}>{st.label}</span>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{w.processName}</div>
                          <ProgressBar value={w.progressRate} color={pc} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Material Alerts */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">자재 부족 알림</span>
                <a href="/materials" className="card-link">전체 보기 →</a>
              </div>
              <div>
                {matAlerts.length === 0
                  ? <p style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: '14px' }}>이상 없음</p>
                  : matAlerts.map(m => {
                    const ms = MAT_STATUS[m.status] || { label: m.status, cls: 'badge-gray' };
                    return (
                      <div key={m.id} className="list-row">
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="list-row-primary truncate">{m.name}</div>
                          <div className="list-row-secondary">
                            재고 <strong style={{ color: m.status === 'out' ? '#b91c1c' : '#92400e' }}>{m.stockQty}</strong>{m.unit} / 최소 {m.minQty}{m.unit}
                          </div>
                        </div>
                        <span className={`badge ${ms.cls}`} style={{ flexShrink: 0, marginLeft: 8 }}>{ms.label}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Equipment Status */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">설비 점검 현황</span>
                <a href="/equipment" className="card-link">전체 보기 →</a>
              </div>
              <div>
                {eqpAlerts.length === 0
                  ? <p style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: '14px' }}>전체 가동 중</p>
                  : eqpAlerts.map(e => {
                    const statusMap: Record<string, { label: string; cls: string }> = {
                      running:     { label: '가동중',  cls: 'badge-green' },
                      idle:        { label: '대기',    cls: 'badge-gray' },
                      maintenance: { label: '정비중',  cls: 'badge-amber' },
                      breakdown:   { label: '고장',    cls: 'badge-red' },
                    };
                    const es = statusMap[e.status] || { label: e.status, cls: 'badge-gray' };
                    return (
                      <div key={e.id} className="list-row">
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="list-row-primary truncate">{e.name}</div>
                          <div className="list-row-secondary">{e.equipmentCode} · 가동률 {e.utilizationRate}%</div>
                        </div>
                        <span className={`badge ${es.cls}`} style={{ flexShrink: 0, marginLeft: 8 }}>{es.label}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </>
      )}
    </SidebarLayout>
  );
}
