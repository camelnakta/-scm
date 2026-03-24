'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { adminNav } from '@/app/admin/dashboard/page';
import { userNav } from '@/app/dashboard/page';

interface ProcessStep {
  stepNo: number;
  name: string;
  description: string;
  stdTime: number;
  equipmentId: string;
  equipmentName: string;
}

interface Process {
  id: string;
  processCode: string;
  name: string;
  category: string;
  description: string;
  steps: ProcessStep[];
  status: 'active' | 'inactive';
  createdAt: string;
  createdBy: string;
}

interface Equipment {
  id: string;
  equipmentCode: string;
  name: string;
  status: string;
}

const CATEGORIES = ['가공', '조립', '검사', '도장', '포장', '용접', '성형', '기타'];

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

export default function ProcessesPage() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');

  const [createModal, setCreateModal] = useState(false);
  const [viewModal, setViewModal] = useState<Process | null>(null);
  const [editModal, setEditModal] = useState<Process | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const blankStep = (): ProcessStep => ({ stepNo: 1, name: '', description: '', stdTime: 30, equipmentId: '', equipmentName: '' });
  const blankForm = { name: '', category: '', description: '', steps: [blankStep()] };
  const [form, setForm] = useState(blankForm);
  const [formSteps, setFormSteps] = useState<ProcessStep[]>([blankStep()]);

  const fetchData = async () => {
    try {
      const [me, procs, eqps] = await Promise.all([
        fetch('/api/auth/me').then(r => r.json()),
        fetch('/api/processes').then(r => r.json()),
        fetch('/api/equipment').then(r => r.json()),
      ]);
      setUserRole(me.role);
      setProcesses(Array.isArray(procs) ? procs : []);
      setEquipment(Array.isArray(eqps) ? eqps : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const addStep = (steps: ProcessStep[], setSteps: (s: ProcessStep[]) => void) => {
    const next = steps.length + 1;
    setSteps([...steps, { stepNo: next, name: '', description: '', stdTime: 30, equipmentId: '', equipmentName: '' }]);
  };

  const removeStep = (idx: number, steps: ProcessStep[], setSteps: (s: ProcessStep[]) => void) => {
    if (steps.length <= 1) return;
    const updated = steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stepNo: i + 1 }));
    setSteps(updated);
  };

  const updateStep = (idx: number, field: keyof ProcessStep, val: string | number, steps: ProcessStep[], setSteps: (s: ProcessStep[]) => void) => {
    const updated = steps.map((s, i) => {
      if (i !== idx) return s;
      const u = { ...s, [field]: val };
      if (field === 'equipmentId') {
        const eqp = equipment.find(e => e.id === val);
        u.equipmentName = eqp ? eqp.name : '';
      }
      return u;
    });
    setSteps(updated);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    const validSteps = formSteps.filter(s => s.name.trim());
    if (validSteps.length === 0) { setError('최소 1개의 단계를 입력하세요.'); return; }
    try {
      const res = await fetch('/api/processes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, steps: validSteps }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setCreateModal(false);
      setForm(blankForm);
      setFormSteps([blankStep()]);
      setSuccess('공정이 등록되었습니다.');
      fetchData(); setTimeout(() => setSuccess(''), 3000);
    } catch { setError('서버 오류가 발생했습니다.'); }
  };

  const handleToggleStatus = async (proc: Process) => {
    const res = await fetch(`/api/processes/${proc.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: proc.status === 'active' ? 'inactive' : 'active' }),
    });
    if (res.ok) { setSuccess('상태가 변경되었습니다.'); fetchData(); setTimeout(() => setSuccess(''), 2500); }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/processes/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setDeleteConfirm(null);
      setSuccess('공정이 삭제되었습니다.');
      fetchData(); setTimeout(() => setSuccess(''), 2500);
    }
  };

  const filtered = processes.filter(p =>
    (!searchTerm || p.processCode.includes(searchTerm) || p.name.includes(searchTerm) || p.category.includes(searchTerm)) &&
    (!filterCategory || p.category === filterCategory) &&
    (!filterStatus || p.status === filterStatus)
  );

  const navItems = userRole === 'admin' ? adminNav : userNav;

  const StepsEditor = ({ steps, setSteps }: { steps: ProcessStep[]; setSteps: (s: ProcessStep[]) => void }) => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <label className="form-label" style={{ marginBottom: 0 }}>공정 단계</label>
        <button type="button" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }}
          onClick={() => addStep(steps, setSteps)}>
          <PlusIcon /> 단계 추가
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {steps.map((step, idx) => (
          <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px', background: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', background: '#dbeafe', padding: '2px 8px', borderRadius: 99 }}>
                Step {step.stepNo}
              </span>
              {steps.length > 1 && (
                <button type="button" onClick={() => removeStep(idx, steps, setSteps)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}>
                  <XIcon />
                </button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: 11 }}>단계명 *</label>
                <input className="form-input" value={step.name} placeholder="예: CNC 선반 가공"
                  onChange={e => updateStep(idx, 'name', e.target.value, steps, setSteps)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: 11 }}>표준 시간 (분)</label>
                <input type="number" className="form-input" min={1} value={step.stdTime}
                  onChange={e => updateStep(idx, 'stdTime', Number(e.target.value), steps, setSteps)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
                <label className="form-label" style={{ fontSize: 11 }}>설명</label>
                <input className="form-input" value={step.description} placeholder="단계 설명"
                  onChange={e => updateStep(idx, 'description', e.target.value, steps, setSteps)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
                <label className="form-label" style={{ fontSize: 11 }}>사용 설비</label>
                <select className="form-input" value={step.equipmentId}
                  onChange={e => updateStep(idx, 'equipmentId', e.target.value, steps, setSteps)}>
                  <option value="">설비 없음</option>
                  {equipment.map(eqp => (
                    <option key={eqp.id} value={eqp.id}>[{eqp.equipmentCode}] {eqp.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <SidebarLayout navItems={navItems} title="공정 관리" userRole={userRole}>
      <div className="page-header">
        <div className="page-header-left">
          <h2>공정 정의 관리</h2>
          <p>생산 공정을 정의하고 단계별 흐름을 설정합니다.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(blankForm); setFormSteps([blankStep()]); setError(''); setCreateModal(true); }}>
          <PlusIcon /> 공정 등록
        </button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      {/* 요약 */}
      <div className="summary-strip">
        <div className="summary-chip">
          <span className="chip-num">{processes.length}</span>
          <span className="badge badge-blue">전체</span>
        </div>
        <div className="summary-chip">
          <span className="chip-num">{processes.filter(p => p.status === 'active').length}</span>
          <span className="badge badge-green">활성</span>
        </div>
        {CATEGORIES.filter(c => processes.some(p => p.category === c)).map(cat => (
          <div key={cat} className={`summary-chip${filterCategory === cat ? ' active' : ''}`}
            onClick={() => setFilterCategory(filterCategory === cat ? '' : cat)}>
            <span className="chip-num">{processes.filter(p => p.category === cat).length}</span>
            <span className="badge badge-indigo">{cat}</span>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <div className="filter-bar">
        <div style={{ flex: 1, minWidth: 200 }}>
          <input className="form-input" placeholder="공정코드, 공정명, 분류 검색..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <select className="form-input" style={{ width: 120 }} value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}>
          <option value="">전체 분류</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="form-input" style={{ width: 110 }} value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}>
          <option value="">전체 상태</option>
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
        </select>
        {(searchTerm || filterCategory || filterStatus) && (
          <button className="btn btn-secondary" onClick={() => { setSearchTerm(''); setFilterCategory(''); setFilterStatus(''); }}>초기화</button>
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
                  <th>공정코드</th>
                  <th>공정명</th>
                  <th>분류</th>
                  <th style={{ textAlign: 'center' }}>단계 수</th>
                  <th style={{ textAlign: 'center' }}>표준 시간</th>
                  <th>설명</th>
                  <th>등록자</th>
                  <th>상태</th>
                  <th style={{ textAlign: 'right', paddingRight: 20 }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="table-empty">등록된 공정이 없습니다.</td></tr>
                ) : filtered.map(p => (
                  <tr key={p.id}>
                    <td><span className="text-mono" style={{ fontSize: 12, fontWeight: 700 }}>{p.processCode}</span></td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td><span className="badge badge-indigo">{p.category}</span></td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{p.steps.length}</td>
                    <td style={{ textAlign: 'center', color: '#475569', fontSize: 13 }}>
                      {p.steps.reduce((s, st) => s + st.stdTime, 0)}분
                    </td>
                    <td style={{ color: '#64748b', fontSize: 13, maxWidth: 200 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {p.description || '-'}
                      </span>
                    </td>
                    <td style={{ color: '#475569', fontSize: 13 }}>{p.createdBy}</td>
                    <td>
                      <span className={`badge ${p.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                        {p.status === 'active' ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', paddingRight: 4 }}>
                        <button className="btn-xs btn-xs-default" onClick={() => setViewModal(p)}>상세</button>
                        {userRole === 'admin' && (
                          <>
                            <button className="btn-xs btn-xs-indigo" onClick={() => handleToggleStatus(p)}>
                              {p.status === 'active' ? '비활성화' : '활성화'}
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
            <div className="table-footer">
              <span>총 {filtered.length}건</span>
              <span style={{ fontWeight: 600, color: '#1e293b' }}>
                활성 {processes.filter(p => p.status === 'active').length}개
              </span>
            </div>
          </>
        )}
      </div>

      {/* ── 공정 상세 모달 ── */}
      {viewModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setViewModal(null); }}>
          <div className="modal modal-lg" style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">공정 상세</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, fontFamily: 'monospace' }}>
                  {viewModal.processCode} · {viewModal.category}
                </div>
              </div>
              <button className="modal-close" onClick={() => setViewModal(null)}><XIcon /></button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>{viewModal.name}</div>
                {viewModal.description && (
                  <div style={{ fontSize: 14, color: '#64748b' }}>{viewModal.description}</div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, padding: '4px 12px', background: '#f0f9ff', color: '#0369a1', borderRadius: 99, border: '1px solid #bae6fd' }}>
                  총 {viewModal.steps.length}단계
                </span>
                <span style={{ fontSize: 13, padding: '4px 12px', background: '#f0fdf4', color: '#15803d', borderRadius: 99, border: '1px solid #bbf7d0' }}>
                  표준 시간 {viewModal.steps.reduce((s, st) => s + st.stdTime, 0)}분
                </span>
                <span className={`badge ${viewModal.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                  {viewModal.status === 'active' ? '활성' : '비활성'}
                </span>
              </div>

              {/* 단계 흐름 시각화 */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>공정 흐름</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {viewModal.steps.map((step, idx) => (
                    <div key={step.stepNo} style={{ display: 'flex', gap: 0 }}>
                      {/* 연결선 + 번호 */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40, flexShrink: 0 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', background: '#dbeafe',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 800, color: '#1d4ed8', flexShrink: 0,
                        }}>{step.stepNo}</div>
                        {idx < viewModal.steps.length - 1 && (
                          <div style={{ width: 2, flex: 1, background: '#e2e8f0', minHeight: 16 }} />
                        )}
                      </div>
                      {/* 내용 */}
                      <div style={{
                        flex: 1, marginLeft: 12, paddingBottom: idx < viewModal.steps.length - 1 ? 16 : 0,
                        paddingTop: 4,
                      }}>
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>{step.name}</div>
                        {step.description && (
                          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{step.description}</div>
                        )}
                        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                          <span style={{ fontSize: 11, color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: 99 }}>
                            ⏱ {step.stdTime}분
                          </span>
                          {step.equipmentName && (
                            <span style={{ fontSize: 11, color: '#7c3aed', background: '#ede9fe', padding: '2px 8px', borderRadius: 99 }}>
                              🔧 {step.equipmentName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                등록자: {viewModal.createdBy} · {new Date(viewModal.createdAt).toLocaleDateString('ko-KR')}
              </span>
              <button className="btn btn-secondary" onClick={() => setViewModal(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 공정 등록 모달 ── */}
      {createModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setCreateModal(false); }}>
          <div className="modal modal-lg" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <span className="modal-title">공정 등록</span>
              <button className="modal-close" onClick={() => setCreateModal(false)}><XIcon /></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error" style={{ marginBottom: 14 }}>{error}</div>}
              <form id="proc-form" onSubmit={handleCreate}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">공정명 *</label>
                    <input className="form-input" value={form.name} required placeholder="예: 샤프트 가공 공정"
                      onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">분류 *</label>
                    <select className="form-input" value={form.category} required
                      onChange={e => setForm({ ...form, category: e.target.value })}>
                      <option value="">분류 선택</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ opacity: 0 }}>-</label>
                    <div style={{ padding: '8px 0', fontSize: 13, color: '#94a3b8' }}>
                      공정 코드는 자동 생성됩니다
                    </div>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">설명</label>
                    <textarea className="form-input" rows={2} value={form.description}
                      placeholder="공정에 대한 설명을 입력하세요"
                      onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <StepsEditor steps={formSteps} setSteps={setFormSteps} />
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setCreateModal(false)}>취소</button>
              <button className="btn btn-primary" type="submit" form="proc-form">공정 등록</button>
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
