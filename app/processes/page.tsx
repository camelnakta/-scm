'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { adminNav } from '@/app/admin/dashboard/page';
import { userNav } from '@/app/dashboard/page';

/* ── 타입 ──────────────────────────────────────────────────── */
interface ProcessStep {
  stepNo: number;        // #10, #20 … 자유 입력 가능
  name: string;          // 공정 단계명
  company: string;       // 담당 업체
  description: string;
  stdTime: number;
  equipmentId: string;
  equipmentName: string;
}

interface Process {
  id: string;
  processCode: string;
  pn: string;            // 업체 P/N (품번)
  matCode: string;       // 자재코드
  name: string;          // 품명
  category: string;
  customer: string;      // 고객사
  project: string;       // 사업명
  description: string;
  steps: ProcessStep[];
  status: 'active' | 'inactive';
  createdAt: string;
  createdBy: string;
}

const CATEGORIES = ['가공', '도금/도장', '구매', '조립', '검사', '포장', '용접', '기타'];

const XIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const PlusIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

/* ── 메인 ──────────────────────────────────────────────────── */
export default function ProcessesPage() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');

  const [viewModal, setViewModal] = useState<Process | null>(null);
  const [editModal, setEditModal] = useState<Process | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // 품번 / 품명 분리 검색
  const [searchPN, setSearchPN] = useState('');       // 품번(P/N)
  const [searchName, setSearchName] = useState('');   // 품명
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProject, setFilterProject] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 페이지네이션
  const PAGE_SIZE = 50;
  const [page, setPage] = useState(1);

  // 신규 공정 폼
  const blankStep = (): ProcessStep => ({
    stepNo: 10, name: '', company: '', description: '', stdTime: 0, equipmentId: '', equipmentName: '',
  });
  const blankForm = { pn: '', matCode: '', name: '', category: '', customer: '', project: '', description: '' };
  const [form, setForm] = useState(blankForm);
  const [formSteps, setFormSteps] = useState<ProcessStep[]>([blankStep()]);

  // 수정 폼
  const [editForm, setEditForm] = useState(blankForm);
  const [editSteps, setEditSteps] = useState<ProcessStep[]>([]);

  /* ── 데이터 로드 ── */
  const fetchData = async () => {
    try {
      const [me, procs] = await Promise.all([
        fetch('/api/auth/me').then(r => r.json()),
        fetch('/api/processes').then(r => r.json()),
      ]);
      setUserRole(me.role);
      setProcesses(Array.isArray(procs) ? procs : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  /* ── 단계 편집 헬퍼 ── */
  const addStep = (steps: ProcessStep[], setSteps: (s: ProcessStep[]) => void) => {
    // 마지막 stepNo + 10으로 자동 증가
    const sorted = [...steps].sort((a, b) => a.stepNo - b.stepNo);
    const maxNo = sorted.length > 0 ? sorted[sorted.length - 1].stepNo : 0;
    setSteps([...steps, { ...blankStep(), stepNo: maxNo + 10 }]);
  };
  // 특정 위치 뒤에 단계 삽입 (중간 삽입) — stepNo 사이 값 자동 계산
  const insertStepAfter = (afterIdx: number, steps: ProcessStep[], setSteps: (s: ProcessStep[]) => void) => {
    const sorted = [...steps].sort((a, b) => a.stepNo - b.stepNo);
    const cur = sorted[afterIdx].stepNo;
    const next = afterIdx + 1 < sorted.length ? sorted[afterIdx + 1].stepNo : cur + 20;
    // 사이 공간이 1 이하면 뒤 단계들을 +10씩 밀어냄
    let newNo: number;
    if (next - cur <= 1) {
      newNo = cur + 5;
      // 뒤 단계 전부 +10
      const shifted = sorted.map((s, i) => i > afterIdx ? { ...s, stepNo: s.stepNo + 10 } : s);
      const inserted = [...shifted.slice(0, afterIdx + 1), { ...blankStep(), stepNo: newNo }, ...shifted.slice(afterIdx + 1)];
      setSteps(inserted.sort((a, b) => a.stepNo - b.stepNo));
    } else {
      newNo = Math.floor((cur + next) / 2);
      const inserted = [...sorted.slice(0, afterIdx + 1), { ...blankStep(), stepNo: newNo }, ...sorted.slice(afterIdx + 1)];
      setSteps(inserted);
    }
  };
  const removeStep = (idx: number, steps: ProcessStep[], setSteps: (s: ProcessStep[]) => void) => {
    setSteps(steps.filter((_, i) => i !== idx));
  };
  // stepNo 변경 후 자동 정렬
  const updateStep = (idx: number, field: keyof ProcessStep, val: string | number, steps: ProcessStep[], setSteps: (s: ProcessStep[]) => void) => {
    const next = steps.map((s, i) => i === idx ? { ...s, [field]: val } : s);
    if (field === 'stepNo') setSteps([...next].sort((a, b) => a.stepNo - b.stepNo));
    else setSteps(next);
  };
  // 전체 단계번호 10 단위로 재정렬 (정리 버튼용)
  const renumberSteps = (steps: ProcessStep[], setSteps: (s: ProcessStep[]) => void) => {
    const sorted = [...steps].sort((a, b) => a.stepNo - b.stepNo);
    setSteps(sorted.map((s, i) => ({ ...s, stepNo: (i + 1) * 10 })));
  };

  /* ── CRUD ── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    const sorted = [...formSteps].sort((a, b) => a.stepNo - b.stepNo);
    try {
      const res = await fetch('/api/processes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, steps: sorted }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '등록 실패'); return; }
      setCreateModal(false); setForm(blankForm); setFormSteps([blankStep()]);
      setSuccess('공정이 등록되었습니다.'); fetchData(); setTimeout(() => setSuccess(''), 3000);
    } catch { setError('서버 오류가 발생했습니다.'); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!editModal) return;
    const sorted = [...editSteps].sort((a, b) => a.stepNo - b.stepNo);
    try {
      const res = await fetch(`/api/processes/${editModal.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, steps: sorted }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '수정 실패'); return; }
      setEditModal(null);
      setSuccess('공정이 수정되었습니다.'); fetchData(); setTimeout(() => setSuccess(''), 3000);
    } catch { setError('서버 오류가 발생했습니다.'); }
  };

  const handleToggleStatus = async (p: Process) => {
    const newStatus = p.status === 'active' ? 'inactive' : 'active';
    await fetch(`/api/processes/${p.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/processes/${id}`, { method: 'DELETE' });
    if (res.ok) { setDeleteConfirm(null); setSuccess('공정이 삭제되었습니다.'); fetchData(); setTimeout(() => setSuccess(''), 2500); }
  };

  /* ── 필터링 ── */
  // 품번 우선 검색: pn, matCode 포함
  const filtered = processes.filter(p =>
    (!searchPN || p.pn.toLowerCase().includes(searchPN.toLowerCase()) || p.matCode.toLowerCase().includes(searchPN.toLowerCase())) &&
    (!searchName || p.name.toLowerCase().includes(searchName.toLowerCase()) || p.processCode.toLowerCase().includes(searchName.toLowerCase())) &&
    (!filterCategory || p.category === filterCategory) &&
    (!filterStatus || p.status === filterStatus) &&
    (!filterProject || p.project === filterProject)
  );

  // 페이지네이션
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  // 필터 바뀌면 1페이지로
  useEffect(() => { setPage(1); }, [searchPN, searchName, filterCategory, filterStatus, filterProject]);

  // 프로젝트 목록
  const projects = Array.from(new Set(processes.map(p => p.project).filter(Boolean))).sort();

  const navItems = userRole === 'admin' ? adminNav : userNav;

  /* ── 공정 단계 에디터 컴포넌트 ── */
  const StepsEditor = ({ steps, setSteps }: { steps: ProcessStep[]; setSteps: (s: ProcessStep[]) => void }) => {
    const sorted = [...steps].sort((a, b) => a.stepNo - b.stepNo);
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label className="form-label" style={{ marginBottom: 0 }}>
            공정 단계
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400, marginLeft: 8 }}>
              ↕ 사이에 삽입 가능 · 번호 직접 수정 · 삭제 가능
            </span>
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }}
              onClick={() => renumberSteps(steps, setSteps)}
              title="모든 단계번호를 10, 20, 30…으로 재정렬">
              번호 정리
            </button>
            <button type="button" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }}
              onClick={() => addStep(steps, setSteps)}>
              <PlusIcon /> 끝에 추가
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {sorted.map((step, idx) => (
            <div key={`${step.stepNo}-${idx}`}>
              {/* 단계 카드 */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', background: '#f8fafc', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                {/* 단계번호 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 54 }}>
                  <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>STEP#</span>
                  <input
                    type="number"
                    className="form-input"
                    value={step.stepNo}
                    min={1}
                    style={{ width: 54, textAlign: 'center', fontWeight: 800, fontSize: 14, color: '#2563eb', padding: '4px 0' }}
                    onChange={e => updateStep(idx, 'stepNo', Number(e.target.value), sorted, setSteps)}
                  />
                </div>
                {/* 공정명 */}
                <div style={{ flex: '0 0 140px' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, marginBottom: 2 }}>공정명 *</div>
                  <input className="form-input" value={step.name} placeholder="예: 가공, 도금(Ch), 검사"
                    style={{ fontSize: 13 }}
                    onChange={e => updateStep(idx, 'name', e.target.value, sorted, setSteps)} />
                </div>
                {/* 업체 */}
                <div style={{ flex: '0 0 120px' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, marginBottom: 2 }}>담당업체</div>
                  <input className="form-input" value={step.company} placeholder="예: DK테크, P품질"
                    style={{ fontSize: 13 }}
                    onChange={e => updateStep(idx, 'company', e.target.value, sorted, setSteps)} />
                </div>
                {/* 표준시간 */}
                <div style={{ flex: '0 0 70px' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, marginBottom: 2 }}>표준시간(분)</div>
                  <input type="number" className="form-input" value={step.stdTime} min={0}
                    style={{ fontSize: 13 }}
                    onChange={e => updateStep(idx, 'stdTime', Number(e.target.value), sorted, setSteps)} />
                </div>
                {/* 비고 */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, marginBottom: 2 }}>비고</div>
                  <input className="form-input" value={step.description} placeholder="선택 입력"
                    style={{ fontSize: 13 }}
                    onChange={e => updateStep(idx, 'description', e.target.value, sorted, setSteps)} />
                </div>
                {/* 삭제 */}
                <button type="button" onClick={() => removeStep(idx, sorted, setSteps)}
                  title="이 단계 삭제"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', marginTop: 18, flexShrink: 0 }}>
                  <XIcon />
                </button>
              </div>
              {/* 사이 삽입 버튼 (마지막 단계 제외) */}
              {idx < sorted.length - 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', margin: '2px 0' }}>
                  <button
                    type="button"
                    onClick={() => insertStepAfter(idx, sorted, setSteps)}
                    title={`#${step.stepNo} 과 #${sorted[idx + 1].stepNo} 사이에 새 단계 삽입`}
                    style={{
                      fontSize: 11, color: '#2563eb', background: '#eff6ff', border: '1px dashed #93c5fd',
                      borderRadius: 12, padding: '2px 14px', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', gap: 4, transition: 'all 0.15s',
                    }}
                  >
                    <PlusIcon />
                    <span>#{step.stepNo}↔#{sorted[idx + 1].stepNo} 사이에 삽입</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ── 공통 폼 필드 ── */
  const BaseForm = ({ f, setF }: { f: typeof blankForm; setF: (v: typeof blankForm) => void }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <div className="form-group">
        <label className="form-label">업체 P/N (품번) *</label>
        <input className="form-input" value={f.pn} required placeholder="예: 40003476"
          style={{ fontWeight: 700, color: '#1d4ed8' }}
          onChange={e => setF({ ...f, pn: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">자재코드</label>
        <input className="form-input" value={f.matCode} placeholder="예: SC40006510"
          onChange={e => setF({ ...f, matCode: e.target.value })} />
      </div>
      <div className="form-group" style={{ gridColumn: 'span 2' }}>
        <label className="form-label">품명 *</label>
        <input className="form-input" value={f.name} required placeholder="예: 기판 고정핀"
          onChange={e => setF({ ...f, name: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">고객사</label>
        <input className="form-input" value={f.customer} placeholder="예: 한화시스템"
          onChange={e => setF({ ...f, customer: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">사업명</label>
        <input className="form-input" value={f.project} placeholder="예: ANVIS"
          onChange={e => setF({ ...f, project: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">분류</label>
        <select className="form-input" value={f.category}
          onChange={e => setF({ ...f, category: e.target.value })}>
          <option value="">분류 선택</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">비고</label>
        <input className="form-input" value={f.description} placeholder="선택 입력"
          onChange={e => setF({ ...f, description: e.target.value })} />
      </div>
    </div>
  );

  /* ── 엑셀 내보내기 ── */
  const exportExcel = () => {
    const BOM = '\uFEFF';
    const headers = ['품번(P/N)', '자재코드', '품명', '고객사', '사업명', '분류', '공정코드',
      '#10', '#20', '#30', '#40', '#50', '#60', '#70', '#80', '#90', '#100', '#110', '상태'];
    const rows = filtered.map(p => {
      const stepMap: Record<number, string> = {};
      p.steps.forEach(s => { stepMap[s.stepNo] = s.name + (s.company ? `_${s.company}` : ''); });
      return [
        p.pn, p.matCode, p.name, p.customer, p.project, p.category, p.processCode,
        stepMap[10] || '', stepMap[20] || '', stepMap[30] || '', stepMap[40] || '',
        stepMap[50] || '', stepMap[60] || '', stepMap[70] || '', stepMap[80] || '',
        stepMap[90] || '', stepMap[100] || '', stepMap[110] || '',
        p.status === 'active' ? '활성' : '비활성',
      ];
    });
    const csv = BOM + [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `공정목록_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  /* ── 렌더 ── */
  return (
    <SidebarLayout navItems={navItems} title="공정 관리" userRole={userRole}>
      {/* 페이지 헤더 */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>공정 관리</h2>
          <p>품번(P/N)으로 공정을 검색하고 단계별 흐름을 관리합니다.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={exportExcel}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            엑셀 내보내기
          </button>
          {userRole === 'admin' && (
            <button className="btn btn-primary"
              onClick={() => { setForm(blankForm); setFormSteps([blankStep()]); setError(''); setCreateModal(true); }}>
              <PlusIcon /> 공정 등록
            </button>
          )}
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      {/* 요약 칩 */}
      <div className="summary-strip" style={{ flexWrap: 'wrap' }}>
        <div className="summary-chip">
          <span className="chip-num">{processes.length}</span>
          <span className="badge badge-blue">전체</span>
        </div>
        <div className="summary-chip" onClick={() => setFilterStatus(filterStatus === 'active' ? '' : 'active')}
          style={{ cursor: 'pointer' }}>
          <span className="chip-num">{processes.filter(p => p.status === 'active').length}</span>
          <span className="badge badge-green">활성</span>
        </div>
        <div className="summary-chip" onClick={() => setFilterStatus(filterStatus === 'inactive' ? '' : 'inactive')}
          style={{ cursor: 'pointer' }}>
          <span className="chip-num">{processes.filter(p => p.status === 'inactive').length}</span>
          <span className="badge badge-gray">비활성(추후추가)</span>
        </div>
        <div className="summary-chip">
          <span className="chip-num">{processes.filter(p => p.steps.length === 0).length}</span>
          <span className="badge badge-amber">단계 미입력</span>
        </div>
      </div>

      {/* 검색 필터 바 */}
      <div className="filter-bar" style={{ flexWrap: 'wrap', gap: 10 }}>
        {/* 품번 검색 (파란 강조) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: '0 0 190px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.04em' }}>
            🔑 품번 (P/N · 자재코드)
          </div>
          <input className="form-input" placeholder="예: 40003476, SC40006510"
            value={searchPN} onChange={e => setSearchPN(e.target.value)}
            style={{ borderColor: searchPN ? '#2563eb' : undefined, borderWidth: searchPN ? 2 : undefined }} />
        </div>
        {/* 품명 검색 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '0.04em' }}>품명</div>
          <input className="form-input" placeholder="품명으로 검색"
            value={searchName} onChange={e => setSearchName(e.target.value)} />
        </div>
        {/* 사업명 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: '0 0 130px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '0.04em' }}>사업명</div>
          <select className="form-input" value={filterProject} onChange={e => setFilterProject(e.target.value)}>
            <option value="">전체</option>
            {projects.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        {/* 분류 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: '0 0 110px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '0.04em' }}>분류</div>
          <select className="form-input" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="">전체</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {/* 상태 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: '0 0 100px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '0.04em' }}>상태</div>
          <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">전체</option>
            <option value="active">활성</option>
            <option value="inactive">비활성</option>
          </select>
        </div>
        {(searchPN || searchName || filterCategory || filterStatus || filterProject) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, justifyContent: 'flex-end' }}>
            <div style={{ fontSize: 11, opacity: 0 }}>.</div>
            <button className="btn btn-secondary"
              onClick={() => { setSearchPN(''); setSearchName(''); setFilterCategory(''); setFilterStatus(''); setFilterProject(''); }}>
              초기화
            </button>
          </div>
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
                  <th style={{ width: 110 }}>품번 (P/N)</th>
                  <th style={{ width: 130 }}>자재코드</th>
                  <th>품명</th>
                  <th style={{ width: 80 }}>고객사</th>
                  <th style={{ width: 80 }}>사업명</th>
                  <th style={{ width: 70 }}>분류</th>
                  <th>공정 흐름 (#10 → …)</th>
                  <th style={{ width: 70, textAlign: 'center' }}>단계수</th>
                  <th style={{ width: 70 }}>상태</th>
                  <th style={{ textAlign: 'right', paddingRight: 20, width: 120 }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={10} className="table-empty">
                    {loading ? '로딩 중...' : '검색 결과가 없습니다.'}
                  </td></tr>
                ) : paginated.map(p => (
                  <tr key={p.id} style={p.status === 'inactive' ? { background: '#fafafa', color: '#94a3b8' } : {}}>
                    {/* 품번 */}
                    <td>
                      <span style={{
                        fontFamily: 'monospace', fontSize: 12, fontWeight: 800,
                        color: p.status === 'active' ? '#1d4ed8' : '#94a3b8',
                        background: p.status === 'active' ? '#eff6ff' : '#f1f5f9',
                        padding: '2px 6px', borderRadius: 4, display: 'inline-block'
                      }}>
                        {p.pn || '-'}
                      </span>
                    </td>
                    {/* 자재코드 */}
                    <td style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{p.matCode || '-'}</td>
                    {/* 품명 */}
                    <td style={{ fontWeight: 600, maxWidth: 180 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {p.name || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>미입력</span>}
                      </span>
                    </td>
                    {/* 고객사 */}
                    <td style={{ fontSize: 12, color: '#475569' }}>{p.customer || '-'}</td>
                    {/* 사업명 */}
                    <td><span className="badge badge-indigo" style={{ fontSize: 11 }}>{p.project || '-'}</span></td>
                    {/* 분류 */}
                    <td><span className="badge badge-blue" style={{ fontSize: 11 }}>{p.category || '-'}</span></td>
                    {/* 공정 흐름 - #10 순서 표시 */}
                    <td>
                      {p.steps.length === 0 ? (
                        <span style={{ fontSize: 12, color: '#cbd5e1', fontStyle: 'italic' }}>공정 미입력</span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                          {[...p.steps].sort((a, b) => a.stepNo - b.stepNo).map((s, i) => (
                            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <span style={{
                                fontSize: 11, background: '#f0f9ff', border: '1px solid #bae6fd',
                                color: '#0369a1', padding: '1px 5px', borderRadius: 4, whiteSpace: 'nowrap',
                                fontWeight: 600,
                              }}>
                                <span style={{ color: '#94a3b8', fontSize: 10 }}>#{s.stepNo} </span>
                                {s.name}
                                {s.company && <span style={{ color: '#64748b', fontWeight: 400 }}> / {s.company}</span>}
                              </span>
                              {i < p.steps.length - 1 && (
                                <svg width="10" height="10" fill="none" stroke="#cbd5e1" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    {/* 단계수 */}
                    <td style={{ textAlign: 'center', fontWeight: 700, color: p.steps.length === 0 ? '#cbd5e1' : '#1e293b' }}>
                      {p.steps.length}
                    </td>
                    {/* 상태 */}
                    <td>
                      <span className={`badge ${p.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                        {p.status === 'active' ? '활성' : '비활성'}
                      </span>
                    </td>
                    {/* 관리 */}
                    <td>
                      <div style={{ display: 'flex', gap: 3, justifyContent: 'flex-end', paddingRight: 4 }}>
                        <button className="btn-xs btn-xs-default" onClick={() => setViewModal(p)}>상세</button>
                        {userRole === 'admin' && (
                          <>
                            <button className="btn-xs btn-xs-indigo" onClick={() => {
                              setEditModal(p);
                              setEditForm({ pn: p.pn, matCode: p.matCode, name: p.name, category: p.category, customer: p.customer, project: p.project, description: p.description });
                              setEditSteps(p.steps.length > 0 ? [...p.steps].sort((a, b) => a.stepNo - b.stepNo) : [blankStep()]);
                              setError('');
                            }}>수정</button>
                            <button className="btn-xs btn-xs-default" onClick={() => handleToggleStatus(p)}>
                              {p.status === 'active' ? '비활성' : '활성'}
                            </button>
                            <button className="btn-xs btn-xs-red" onClick={() => setDeleteConfirm(p.id)}>삭제</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 페이지네이션 + 집계 */}
            <div className="table-footer">
              <span>
                검색 결과 <strong>{filtered.length}</strong>건 / 전체 {processes.length}건
                {filtered.length > PAGE_SIZE && (
                  <span style={{ color: '#64748b', marginLeft: 8 }}>
                    (페이지 {page} / {totalPages})
                  </span>
                )}
              </span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {totalPages > 1 && (
                  <>
                    <button className="btn btn-secondary" style={{ padding: '3px 10px', fontSize: 12 }}
                      disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                      ← 이전
                    </button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      const p = page <= 4 ? i + 1 : page > totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
                      return p >= 1 && p <= totalPages ? (
                        <button key={p} onClick={() => setPage(p)}
                          style={{
                            padding: '3px 8px', fontSize: 12, borderRadius: 4, border: 'none',
                            background: page === p ? '#2563eb' : '#f1f5f9',
                            color: page === p ? '#fff' : '#475569', cursor: 'pointer', fontWeight: page === p ? 700 : 400,
                          }}>{p}</button>
                      ) : null;
                    })}
                    <button className="btn btn-secondary" style={{ padding: '3px 10px', fontSize: 12 }}
                      disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                      다음 →
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── 상세 모달 ── */}
      {viewModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setViewModal(null); }}>
          <div className="modal" style={{ maxWidth: 700, width: '95vw' }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">{viewModal.name || '(품명 없음)'}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 800, color: '#1d4ed8', background: '#eff6ff', padding: '1px 8px', borderRadius: 4 }}>
                    P/N: {viewModal.pn || '-'}
                  </span>
                  {viewModal.matCode && <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{viewModal.matCode}</span>}
                  <span className="badge badge-indigo">{viewModal.project || '-'}</span>
                  <span className={`badge ${viewModal.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                    {viewModal.status === 'active' ? '활성' : '비활성'}
                  </span>
                </div>
              </div>
              <button className="modal-close" onClick={() => setViewModal(null)}><XIcon /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[
                  { label: '고객사', value: viewModal.customer || '-' },
                  { label: '사업명', value: viewModal.project || '-' },
                  { label: '분류', value: viewModal.category || '-' },
                  { label: '공정코드', value: viewModal.processCode },
                  { label: '단계 수', value: `${viewModal.steps.length}단계` },
                  { label: '비고', value: viewModal.description || '-' },
                ].map((r, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>{r.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{r.value}</div>
                  </div>
                ))}
              </div>

              {/* 공정 단계 */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>공정 흐름</div>
                {viewModal.steps.length === 0 ? (
                  <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 13, padding: '12px 0' }}>
                    공정 단계가 없습니다. (추후 입력 예정)
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[...viewModal.steps].sort((a, b) => a.stepNo - b.stepNo).map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#2563eb', background: '#dbeafe', padding: '2px 10px', borderRadius: 99, minWidth: 48, textAlign: 'center' }}>
                          #{s.stepNo}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>{s.name}</span>
                        {s.company && (
                          <span style={{ fontSize: 12, color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4 }}>
                            {s.company}
                          </span>
                        )}
                        {s.stdTime > 0 && (
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>{s.stdTime}분</span>
                        )}
                        {s.description && (
                          <span style={{ fontSize: 12, color: '#64748b' }}>{s.description}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              {userRole === 'admin' && (
                <button className="btn btn-primary" onClick={() => {
                  setViewModal(null);
                  setEditModal(viewModal);
                  setEditForm({ pn: viewModal.pn, matCode: viewModal.matCode, name: viewModal.name, category: viewModal.category, customer: viewModal.customer, project: viewModal.project, description: viewModal.description });
                  setEditSteps(viewModal.steps.length > 0 ? [...viewModal.steps].sort((a, b) => a.stepNo - b.stepNo) : [blankStep()]);
                  setError('');
                }}>수정하기</button>
              )}
              <button className="btn btn-secondary" onClick={() => setViewModal(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 등록 모달 ── */}
      {createModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setCreateModal(false); }}>
          <div className="modal" style={{ maxWidth: 720, width: '95vw' }}>
            <div className="modal-header">
              <span className="modal-title">공정 등록</span>
              <button className="modal-close" onClick={() => setCreateModal(false)}><XIcon /></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
              <form id="proc-create" onSubmit={handleCreate}>
                <BaseForm f={form} setF={setForm} />
                <div style={{ marginTop: 16 }}>
                  <StepsEditor steps={formSteps} setSteps={setFormSteps} />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setCreateModal(false)}>취소</button>
              <button className="btn btn-primary" type="submit" form="proc-create">등록</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 수정 모달 ── */}
      {editModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setEditModal(null); }}>
          <div className="modal" style={{ maxWidth: 720, width: '95vw' }}>
            <div className="modal-header">
              <div>
                <span className="modal-title">공정 수정</span>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  P/N: {editModal.pn} — {editModal.name}
                </div>
              </div>
              <button className="modal-close" onClick={() => setEditModal(null)}><XIcon /></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
              <form id="proc-edit" onSubmit={handleEdit}>
                <BaseForm f={editForm} setF={setEditForm} />
                <div style={{ marginTop: 16 }}>
                  <StepsEditor steps={editSteps} setSteps={setEditSteps} />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditModal(null)}>취소</button>
              <button className="btn btn-primary" type="submit" form="proc-edit">저장</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 삭제 확인 ── */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header">
              <span className="modal-title">공정 삭제</span>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}><XIcon /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#475569' }}>이 공정을 삭제하면 복구할 수 없습니다. 계속하시겠습니까?</p>
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
