'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { adminNav } from '@/app/admin/dashboard/page';
import { userNav } from '@/app/dashboard/page';

/* ── 타입 ─────────────────────────────────────────── */
interface StepProgress {
  stepNo: number; stepName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'paused' | 'skipped';
  startedAt: string; completedAt: string;
  progressRate: number; workerName: string;
  note: string; defectCount: number;
}
interface WorkOrder {
  id: string; workOrderNo: string; processId: string; processName: string;
  productName: string; targetQty: number; completedQty: number; defectQty: number;
  priority: string; status: string; progressRate: number; currentStep: number;
  steps: StepProgress[];
  plannedStart: string; plannedEnd: string; actualStart: string; actualEnd: string;
  assignedTo: string; createdBy: string; notes: string; createdAt: string;
}
interface Process { id: string; processCode: string; name: string; category: string; status: string; steps: { stepNo: number; name: string; stdTime: number }[]; }

/* ── 상수 ──────────────────────────────────────────── */
const WO_STATUS = [
  { value: 'pending',     label: '대기',     cls: 'badge-gray' },
  { value: 'in_progress', label: '진행중',   cls: 'badge-blue' },
  { value: 'completed',   label: '완료',     cls: 'badge-green' },
  { value: 'paused',      label: '일시정지', cls: 'badge-amber' },
  { value: 'cancelled',   label: '취소',     cls: 'badge-red' },
];
const STEP_STATUS = [
  { value: 'pending',     label: '대기',   cls: 'badge-gray',   color: '#94a3b8' },
  { value: 'in_progress', label: '진행중', cls: 'badge-blue',   color: '#2563eb' },
  { value: 'completed',   label: '완료',   cls: 'badge-green',  color: '#15803d' },
  { value: 'paused',      label: '중단',   cls: 'badge-amber',  color: '#d97706' },
  { value: 'skipped',     label: '생략',   cls: 'badge-purple', color: '#7c3aed' },
];
const PRIORITY = [
  { value: 'urgent', label: '긴급', cls: 'badge-red' },
  { value: 'high',   label: '높음', cls: 'badge-orange' },
  { value: 'normal', label: '보통', cls: 'badge-blue' },
  { value: 'low',    label: '낮음', cls: 'badge-gray' },
];

const XIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

/* ── 진행바 컴포넌트 ──────────────────────────────── */
const ProgressBar = ({ value, color = '#2563eb', height = 8, showLabel = false }:
  { value: number; color?: string; height?: number; showLabel?: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{ flex: 1, background: '#e2e8f0', borderRadius: 99, height, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(value, 100)}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.3s ease' }} />
    </div>
    {showLabel && <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 34, textAlign: 'right' }}>{value}%</span>}
  </div>
);

/* ── 메인 페이지 ──────────────────────────────────── */
export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');

  /* 모달 상태 */
  const [createModal, setCreateModal] = useState(false);
  const [progressModal, setProgressModal] = useState<WorkOrder | null>(null);
  const [viewModal, setViewModal] = useState<WorkOrder | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  /* 작업지시 생성 폼 */
  const blankForm = { processId: '', productName: '', targetQty: 1, priority: 'normal', plannedStart: '', plannedEnd: '', assignedTo: '', notes: '' };
  const [form, setForm] = useState(blankForm);

  /* 진행도 편집 임시 상태 */
  const [editSteps, setEditSteps] = useState<StepProgress[]>([]);
  const [editCompletedQty, setEditCompletedQty] = useState(0);
  const [editDefectQty, setEditDefectQty] = useState(0);

  const fetchData = async () => {
    try {
      const [me, wos, procs] = await Promise.all([
        fetch('/api/auth/me').then(r => r.json()),
        fetch('/api/workorders').then(r => r.json()),
        fetch('/api/processes').then(r => r.json()),
      ]);
      setUserRole(me.role);
      setWorkOrders(Array.isArray(wos) ? wos : []);
      setProcesses(Array.isArray(procs) ? procs : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  /* 작업지시 생성 */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try {
      const res = await fetch('/api/workorders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setCreateModal(false); setForm(blankForm);
      setSuccess('작업지시가 등록되었습니다.');
      fetchData(); setTimeout(() => setSuccess(''), 3000);
    } catch { setError('서버 오류가 발생했습니다.'); }
  };

  /* 진행도 모달 열기 */
  const openProgress = (wo: WorkOrder) => {
    setEditSteps(wo.steps.map(s => ({ ...s })));
    setEditCompletedQty(wo.completedQty);
    setEditDefectQty(wo.defectQty);
    setProgressModal(wo);
    setError('');
  };

  /* 단계 필드 변경 */
  const updateStep = (idx: number, field: keyof StepProgress, val: string | number) => {
    setEditSteps(prev => prev.map((s, i) => {
      if (i !== idx) return s;
      const updated = { ...s, [field]: val };
      // 상태 전환 시 타임스탬프 자동 세팅
      if (field === 'status') {
        if (val === 'in_progress' && !s.startedAt) updated.startedAt = new Date().toISOString();
        if (val === 'completed') {
          if (!s.startedAt) updated.startedAt = new Date().toISOString();
          updated.completedAt = new Date().toISOString();
          updated.progressRate = 100;
        }
        if (val === 'pending') { updated.progressRate = 0; }
      }
      return updated;
    }));
  };

  /* 진행도 저장 */
  const saveProgress = async () => {
    if (!progressModal) return;
    setError('');
    try {
      const res = await fetch(`/api/workorders/${progressModal.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps: editSteps, completedQty: editCompletedQty, defectQty: editDefectQty }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setProgressModal(null);
      setSuccess('진행도가 저장되었습니다.');
      fetchData(); setTimeout(() => setSuccess(''), 3000);
    } catch { setError('서버 오류가 발생했습니다.'); }
  };

  /* 삭제 */
  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/workorders/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setDeleteConfirm(null);
      setSuccess('작업지시가 삭제되었습니다.');
      fetchData(); setTimeout(() => setSuccess(''), 2500);
    }
  };

  /* 필터링 */
  const filtered = workOrders.filter(w =>
    (!searchTerm || w.workOrderNo.toLowerCase().includes(searchTerm.toLowerCase()) || w.productName.includes(searchTerm) || w.processName.includes(searchTerm)) &&
    (!filterStatus || w.status === filterStatus) &&
    (!filterPriority || w.priority === filterPriority)
  );

  const getStatus = (v: string) => WO_STATUS.find(s => s.value === v) ?? { label: v, cls: 'badge-gray' };
  const getPriority = (v: string) => PRIORITY.find(p => p.value === v) ?? { label: v, cls: 'badge-gray' };
  const getStepStatus = (v: string) => STEP_STATUS.find(s => s.value === v) ?? { label: v, cls: 'badge-gray', color: '#64748b' };
  const navItems = userRole === 'admin' ? adminNav : userNav;

  const progressColor = (r: number) => r >= 100 ? '#15803d' : r >= 60 ? '#2563eb' : r >= 30 ? '#d97706' : '#94a3b8';

  return (
    <SidebarLayout navItems={navItems} title="공정 관리" userRole={userRole}>
      <div className="page-header">
        <div className="page-header-left">
          <h2>작업지시 관리</h2>
          <p>공정별 작업지시를 등록하고 단계별 진행도를 입력합니다.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(blankForm); setError(''); setCreateModal(true); }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          작업지시 등록
        </button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      {/* 상태 요약 */}
      <div className="summary-strip">
        {WO_STATUS.map(s => (
          <div key={s.value}
            className={`summary-chip${filterStatus === s.value ? ' active' : ''}`}
            onClick={() => setFilterStatus(filterStatus === s.value ? '' : s.value)}>
            <span className="chip-num">{workOrders.filter(w => w.status === s.value).length}</span>
            <span className={`badge ${s.cls}`}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <div className="filter-bar">
        <div style={{ flex: 1, minWidth: 200 }}>
          <input className="form-input" placeholder="작업지시번호, 제품명, 공정명 검색..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <select className="form-input" style={{ width: 120 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">전체 상태</option>
          {WO_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select className="form-input" style={{ width: 110 }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="">전체 우선순위</option>
          {PRIORITY.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        {(searchTerm || filterStatus || filterPriority) && (
          <button className="btn btn-secondary" onClick={() => { setSearchTerm(''); setFilterStatus(''); setFilterPriority(''); }}>초기화</button>
        )}
      </div>

      {/* 테이블 */}
      <div className="table-wrap">
        {loading ? (
          <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>작업지시번호</th>
                  <th>제품명</th>
                  <th>공정</th>
                  <th>우선순위</th>
                  <th style={{ width: 60, textAlign: 'center' }}>목표</th>
                  <th style={{ width: 60, textAlign: 'center' }}>완료</th>
                  <th style={{ width: 190 }}>진행률</th>
                  <th>담당자</th>
                  <th>계획 시작</th>
                  <th>상태</th>
                  <th style={{ textAlign: 'right', paddingRight: 20 }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={11} className="table-empty">작업지시가 없습니다.</td></tr>
                ) : filtered.map(w => {
                  const st = getStatus(w.status);
                  const pr = getPriority(w.priority);
                  const pc = progressColor(w.progressRate);
                  return (
                    <tr key={w.id}>
                      <td><span className="text-mono" style={{ fontSize: 12, fontWeight: 700 }}>{w.workOrderNo}</span></td>
                      <td style={{ fontWeight: 600 }}>{w.productName}</td>
                      <td style={{ color: '#475569', fontSize: 13 }}>{w.processName}</td>
                      <td><span className={`badge ${pr.cls}`}>{pr.label}</span></td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{w.targetQty.toLocaleString()}</td>
                      <td style={{ textAlign: 'center', color: '#475569' }}>{w.completedQty.toLocaleString()}</td>
                      <td>
                        <ProgressBar value={w.progressRate} color={pc} height={6} showLabel />
                      </td>
                      <td style={{ color: '#475569', fontSize: 13 }}>{w.assignedTo || '-'}</td>
                      <td style={{ color: '#64748b', fontSize: 12 }}>
                        {w.plannedStart ? new Date(w.plannedStart).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', paddingRight: 4 }}>
                          <button className="btn-xs btn-xs-default" onClick={() => setViewModal(w)}>상세</button>
                          <button className="btn-xs btn-xs-indigo" onClick={() => openProgress(w)}>진행입력</button>
                          <button className="btn-xs btn-xs-red" onClick={() => setDeleteConfirm(w.id)}>삭제</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="table-footer">
              <span>총 {filtered.length}건</span>
              <span style={{ fontWeight: 600, color: '#1e293b' }}>
                진행중 {workOrders.filter(w => w.status === 'in_progress').length}건 · 완료 {workOrders.filter(w => w.status === 'completed').length}건
              </span>
            </div>
          </>
        )}
      </div>

      {/* ── 작업지시 생성 모달 ── */}
      {createModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setCreateModal(false); }}>
          <div className="modal modal-md">
            <div className="modal-header">
              <span className="modal-title">작업지시 등록</span>
              <button className="modal-close" onClick={() => setCreateModal(false)}><XIcon /></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error" style={{ marginBottom: 14 }}>{error}</div>}
              <form id="wo-form" onSubmit={handleCreate}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">공정 선택 *</label>
                    <select className="form-input" value={form.processId} required
                      onChange={e => setForm({ ...form, processId: e.target.value })}>
                      <option value="">공정을 선택하세요</option>
                      {processes.filter(p => p.status === 'active' || (p as any).status !== 'inactive').map(p => (
                        <option key={p.id} value={p.id}>[{p.processCode}] {p.name}</option>
                      ))}
                    </select>
                  </div>
                  {form.processId && (
                    <div style={{ gridColumn: 'span 2', padding: '10px 14px', background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
                      <div style={{ fontSize: 12, color: '#0e7490', fontWeight: 600, marginBottom: 4 }}>선택된 공정 단계</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {processes.find(p => p.id === form.processId)?.steps.map(s => (
                          <span key={s.stepNo} style={{ fontSize: 12, background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 99, fontWeight: 500 }}>
                            {s.stepNo}. {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">제품명 *</label>
                    <input className="form-input" value={form.productName} required placeholder="생산할 제품명"
                      onChange={e => setForm({ ...form, productName: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">목표 수량 *</label>
                    <input type="number" className="form-input" min={1} value={form.targetQty} required
                      onChange={e => setForm({ ...form, targetQty: Number(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">우선순위</label>
                    <select className="form-input" value={form.priority}
                      onChange={e => setForm({ ...form, priority: e.target.value })}>
                      {PRIORITY.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">계획 시작일시</label>
                    <input type="datetime-local" className="form-input" value={form.plannedStart}
                      onChange={e => setForm({ ...form, plannedStart: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">계획 완료일시</label>
                    <input type="datetime-local" className="form-input" value={form.plannedEnd}
                      onChange={e => setForm({ ...form, plannedEnd: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">담당자</label>
                    <input className="form-input" value={form.assignedTo} placeholder="담당자 이름"
                      onChange={e => setForm({ ...form, assignedTo: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">비고</label>
                    <textarea className="form-input" rows={2} value={form.notes} placeholder="특이사항 입력"
                      onChange={e => setForm({ ...form, notes: e.target.value })} />
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setCreateModal(false)}>취소</button>
              <button className="btn btn-primary" type="submit" form="wo-form">작업지시 등록</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 진행도 입력 모달 (핵심) ── */}
      {progressModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setProgressModal(null); }}>
          <div className="modal modal-lg" style={{ maxWidth: 760 }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">공정 진행도 입력</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, fontFamily: 'monospace' }}>
                  {progressModal.workOrderNo} · {progressModal.productName}
                </div>
              </div>
              <button className="modal-close" onClick={() => setProgressModal(null)}><XIcon /></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error" style={{ marginBottom: 14 }}>{error}</div>}

              {/* 수량 입력 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20, padding: '14px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase' }}>목표 수량</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#1e293b' }}>{progressModal.targetQty.toLocaleString()}</div>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#15803d', marginBottom: 4, display: 'block', textTransform: 'uppercase' }}>완료 수량</label>
                  <input type="number" className="form-input" min={0} max={progressModal.targetQty}
                    value={editCompletedQty} onChange={e => setEditCompletedQty(Number(e.target.value))}
                    style={{ fontWeight: 700, fontSize: 16, color: '#15803d' }} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#b91c1c', marginBottom: 4, display: 'block', textTransform: 'uppercase' }}>불량 수량</label>
                  <input type="number" className="form-input" min={0}
                    value={editDefectQty} onChange={e => setEditDefectQty(Number(e.target.value))}
                    style={{ fontWeight: 700, fontSize: 16, color: '#b91c1c' }} />
                </div>
              </div>

              {/* 전체 진행률 미리보기 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>전체 진행률</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#2563eb' }}>
                    {editSteps.length > 0 ? Math.round(editSteps.reduce((s, st) => s + st.progressRate, 0) / editSteps.length) : 0}%
                  </span>
                </div>
                <div style={{ background: '#e2e8f0', borderRadius: 99, height: 12, overflow: 'hidden' }}>
                  <div style={{
                    width: `${editSteps.length > 0 ? Math.round(editSteps.reduce((s, st) => s + st.progressRate, 0) / editSteps.length) : 0}%`,
                    height: '100%', background: 'linear-gradient(90deg, #3b82f6, #6366f1)', borderRadius: 99, transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>

              {/* 단계별 진행도 입력 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {editSteps.map((step, idx) => {
                  const ss = getStepStatus(step.status);
                  return (
                    <div key={step.stepNo} style={{
                      border: `1.5px solid ${step.status === 'in_progress' ? '#93c5fd' : '#e2e8f0'}`,
                      borderRadius: 10, padding: '14px 16px',
                      background: step.status === 'completed' ? '#f0fdf4' : step.status === 'in_progress' ? '#eff6ff' : '#ffffff',
                    }}>
                      {/* 단계 헤더 */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{
                            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 800,
                            background: step.status === 'completed' ? '#dcfce7' : step.status === 'in_progress' ? '#dbeafe' : '#f1f5f9',
                            color: step.status === 'completed' ? '#15803d' : step.status === 'in_progress' ? '#1d4ed8' : '#64748b',
                            flexShrink: 0,
                          }}>{step.stepNo}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{step.stepName}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className={`badge ${ss.cls}`}>{ss.label}</span>
                          <span style={{ fontSize: 14, fontWeight: 800, color: ss.color }}>{step.progressRate}%</span>
                        </div>
                      </div>

                      {/* 진행률 슬라이더 */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>진행률</span>
                        </div>
                        <input type="range" min={0} max={100} value={step.progressRate}
                          onChange={e => updateStep(idx, 'progressRate', Number(e.target.value))}
                          style={{ width: '100%', accentColor: ss.color, height: 4, cursor: 'pointer' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, fontSize: 10, color: '#94a3b8' }}>
                          <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                        </div>
                      </div>

                      {/* 상태 + 담당자 + 불량 */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 10 }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: 11 }}>상태</label>
                          <select className="form-input" style={{ fontSize: 13, padding: '6px 10px' }}
                            value={step.status} onChange={e => updateStep(idx, 'status', e.target.value)}>
                            {STEP_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: 11 }}>작업자</label>
                          <input className="form-input" style={{ fontSize: 13, padding: '6px 10px' }}
                            placeholder="작업자 이름" value={step.workerName}
                            onChange={e => updateStep(idx, 'workerName', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: 11 }}>불량</label>
                          <input type="number" className="form-input" style={{ fontSize: 13, padding: '6px 10px' }}
                            min={0} value={step.defectCount}
                            onChange={e => updateStep(idx, 'defectCount', Number(e.target.value))} />
                        </div>
                      </div>

                      {/* 메모 */}
                      <div className="form-group" style={{ marginTop: 10 }}>
                        <label className="form-label" style={{ fontSize: 11 }}>메모</label>
                        <input className="form-input" style={{ fontSize: 13, padding: '6px 10px' }}
                          placeholder="특이사항 입력" value={step.note}
                          onChange={e => updateStep(idx, 'note', e.target.value)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setProgressModal(null)}>취소</button>
              <button className="btn btn-primary" onClick={saveProgress}>진행도 저장</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 상세 보기 모달 ── */}
      {viewModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setViewModal(null); }}>
          <div className="modal modal-lg" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">{viewModal.productName}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, fontFamily: 'monospace' }}>{viewModal.workOrderNo}</div>
              </div>
              <button className="modal-close" onClick={() => setViewModal(null)}><XIcon /></button>
            </div>
            <div className="modal-body">
              <div className="detail-grid" style={{ marginBottom: 16 }}>
                {[
                  { label: '공정', value: viewModal.processName },
                  { label: '우선순위', value: <span className={`badge ${getPriority(viewModal.priority).cls}`}>{getPriority(viewModal.priority).label}</span> },
                  { label: '목표 수량', value: `${viewModal.targetQty.toLocaleString()}` },
                  { label: '완료 수량', value: <span style={{ fontWeight: 700, color: '#15803d' }}>{viewModal.completedQty.toLocaleString()}</span> },
                  { label: '불량 수량', value: <span style={{ fontWeight: 700, color: '#b91c1c' }}>{viewModal.defectQty}</span> },
                  { label: '담당자', value: viewModal.assignedTo || '-' },
                  { label: '계획 시작', value: viewModal.plannedStart ? new Date(viewModal.plannedStart).toLocaleString('ko-KR') : '-' },
                  { label: '계획 완료', value: viewModal.plannedEnd ? new Date(viewModal.plannedEnd).toLocaleString('ko-KR') : '-' },
                  { label: '실제 시작', value: viewModal.actualStart ? new Date(viewModal.actualStart).toLocaleString('ko-KR') : '-' },
                  { label: '상태', value: <span className={`badge ${getStatus(viewModal.status).cls}`}>{getStatus(viewModal.status).label}</span> },
                  { label: '비고', value: viewModal.notes || '-', full: true },
                ].map((f, i) => (
                  <div key={i} className={`detail-field${(f as any).full ? ' full' : ''}`}>
                    <div className="detail-field-label">{f.label}</div>
                    <div className="detail-field-value">{f.value}</div>
                  </div>
                ))}
              </div>

              {/* 전체 진행률 */}
              <div style={{ marginBottom: 16, padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>전체 진행률</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#2563eb' }}>{viewModal.progressRate}%</span>
                </div>
                <ProgressBar value={viewModal.progressRate} color="#2563eb" height={10} />
              </div>

              {/* 단계별 현황 */}
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>공정 단계별 현황</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {viewModal.steps.map(s => {
                  const ss = getStepStatus(s.status);
                  return (
                    <div key={s.stepNo} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <span style={{ width: 24, height: 24, borderRadius: '50%', background: s.status === 'completed' ? '#dcfce7' : s.status === 'in_progress' ? '#dbeafe' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: ss.color, flexShrink: 0 }}>{s.stepNo}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, minWidth: 100 }}>{s.stepName}</span>
                      <div style={{ flex: 1 }}><ProgressBar value={s.progressRate} color={ss.color} height={6} /></div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: ss.color, minWidth: 34 }}>{s.progressRate}%</span>
                      <span className={`badge ${ss.cls}`}>{ss.label}</span>
                      {s.workerName && <span style={{ fontSize: 11, color: '#94a3b8' }}>{s.workerName}</span>}
                      {s.defectCount > 0 && <span className="badge badge-red">{s.defectCount}불량</span>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewModal(null)}>닫기</button>
              <button className="btn btn-primary" onClick={() => { setViewModal(null); openProgress(viewModal); }}>진행도 입력</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 삭제 확인 모달 ── */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header">
              <span className="modal-title">작업지시 삭제</span>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}><XIcon /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7 }}>이 작업지시를 삭제하시겠습니까?<br /><strong style={{ color: '#b91c1c' }}>삭제 후 복구할 수 없습니다.</strong></p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>취소</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
