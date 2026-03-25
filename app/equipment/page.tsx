'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { adminNav } from '@/app/admin/dashboard/page';
import { userNav } from '@/app/dashboard/page';

interface Equipment {
  id: string;
  equipmentCode: string;
  name: string;
  category: string;
  location: string;
  status: 'running' | 'idle' | 'maintenance' | 'breakdown';
  utilizationRate: number;
  lastMaintenance: string;
  nextMaintenance: string;
  assignedProcess: string;
}

const CATEGORIES = ['CNC', '프레스', '용접기', '도장', '조립', '검사', '컨베이어', '기타'];

const EQP_STATUS = [
  { value: 'running',     label: '가동중',  cls: 'badge-green',  color: '#15803d' },
  { value: 'idle',        label: '대기',    cls: 'badge-gray',   color: '#64748b' },
  { value: 'maintenance', label: '정비중',  cls: 'badge-amber',  color: '#d97706' },
  { value: 'breakdown',   label: '고장',    cls: 'badge-red',    color: '#b91c1c' },
];

const XIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');

  const [createModal, setCreateModal] = useState(false);
  const [viewModal, setViewModal] = useState<Equipment | null>(null);
  const [editModal, setEditModal] = useState<Equipment | null>(null);
  const [statusModal, setStatusModal] = useState<Equipment | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const blankForm = { name: '', category: '', location: '', assignedProcess: '', nextMaintenance: '' };
  const [form, setForm] = useState(blankForm);
  const [editForm, setEditForm] = useState({ ...blankForm, utilizationRate: 0 });
  const [newStatus, setNewStatus] = useState('');
  const [newUtilRate, setNewUtilRate] = useState(0);

  const fetchData = async () => {
    try {
      const [me, eqps] = await Promise.all([
        fetch('/api/auth/me').then(r => r.json()),
        fetch('/api/equipment').then(r => r.json()),
      ]);
      setUserRole(me.role);
      setEquipment(Array.isArray(eqps) ? eqps : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try {
      const res = await fetch('/api/equipment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setCreateModal(false); setForm(blankForm);
      setSuccess('설비가 등록되었습니다.');
      fetchData(); setTimeout(() => setSuccess(''), 3000);
    } catch { setError('서버 오류가 발생했습니다.'); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!editModal) return;
    try {
      const res = await fetch(`/api/equipment/${editModal.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setEditModal(null);
      setSuccess('설비 정보가 수정되었습니다.');
      fetchData(); setTimeout(() => setSuccess(''), 3000);
    } catch { setError('서버 오류가 발생했습니다.'); }
  };

  const handleStatusChange = async () => {
    if (!statusModal || !newStatus) return;
    try {
      const res = await fetch(`/api/equipment/${statusModal.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          utilizationRate: newStatus === 'running' ? newUtilRate : newStatus === 'idle' ? 0 : 0,
          ...(newStatus === 'maintenance' ? { lastMaintenance: new Date().toISOString() } : {}),
        }),
      });
      if (res.ok) {
        setStatusModal(null);
        setSuccess('설비 상태가 변경되었습니다.');
        fetchData(); setTimeout(() => setSuccess(''), 2500);
      }
    } catch { setError('서버 오류가 발생했습니다.'); }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/equipment/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setDeleteConfirm(null);
      setSuccess('설비가 삭제되었습니다.');
      fetchData(); setTimeout(() => setSuccess(''), 2500);
    }
  };

  const filtered = equipment.filter(e =>
    (!searchTerm || e.equipmentCode.includes(searchTerm) || e.name.includes(searchTerm) || e.location.includes(searchTerm)) &&
    (!filterCategory || e.category === filterCategory) &&
    (!filterStatus || e.status === filterStatus)
  );

  const navItems = userRole === 'admin' ? adminNav : userNav;
  const getEqpStatus = (v: string) => EQP_STATUS.find(s => s.value === v) ?? { label: v, cls: 'badge-gray', color: '#64748b' };

  const utilizationColor = (r: number) => r >= 80 ? '#15803d' : r >= 50 ? '#2563eb' : r >= 20 ? '#d97706' : '#94a3b8';

  return (
    <SidebarLayout navItems={navItems} title="공정 관리" userRole={userRole}>
      <div className="page-header">
        <div className="page-header-left">
          <h2>설비 현황 관리</h2>
          <p>공정에 사용되는 설비 상태 및 가동률을 관리합니다.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => {
            const BOM = '\uFEFF';
            const headers = ['설비코드', '설비명', '분류', '위치', '상태', '가동률(%)', '담당공정', '최종정비일', '다음정비예정'];
            const statusLabelMap: Record<string,string> = { running:'가동중', idle:'대기', maintenance:'정비중', breakdown:'고장' };
            const rows = filtered.map(e => [
              e.equipmentCode, e.name, e.category, e.location||'', statusLabelMap[e.status]||e.status,
              e.utilizationRate, e.assignedProcess||'',
              e.lastMaintenance ? new Date(e.lastMaintenance).toLocaleDateString('ko-KR') : '',
              e.nextMaintenance ? new Date(e.nextMaintenance).toLocaleDateString('ko-KR') : '',
            ]);
            const csv = BOM + [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `설비목록_${new Date().toISOString().slice(0,10)}.csv`;
            a.click(); URL.revokeObjectURL(url);
          }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
            엑셀 내보내기
          </button>
          {userRole === 'admin' && (
            <button className="btn btn-primary" onClick={() => { setForm(blankForm); setError(''); setCreateModal(true); }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              설비 등록
            </button>
          )}
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      {/* 요약 */}
      <div className="summary-strip">
        {EQP_STATUS.map(s => (
          <div key={s.value} className={`summary-chip${filterStatus === s.value ? ' active' : ''}`}
            onClick={() => setFilterStatus(filterStatus === s.value ? '' : s.value)}>
            <span className="chip-num">{equipment.filter(e => e.status === s.value).length}</span>
            <span className={`badge ${s.cls}`}>{s.label}</span>
          </div>
        ))}
        <div className="summary-chip">
          <span className="chip-num">
            {equipment.length > 0
              ? Math.round(equipment.filter(e => e.status === 'running').reduce((s, e) => s + e.utilizationRate, 0) /
                  Math.max(equipment.filter(e => e.status === 'running').length, 1))
              : 0}%
          </span>
          <span className="badge badge-blue">평균 가동률</span>
        </div>
      </div>

      {/* 필터 */}
      <div className="filter-bar">
        <div style={{ flex: 1, minWidth: 200 }}>
          <input className="form-input" placeholder="설비코드, 설비명, 위치 검색..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <select className="form-input" style={{ width: 130 }} value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}>
          <option value="">전체 분류</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="form-input" style={{ width: 120 }} value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}>
          <option value="">전체 상태</option>
          {EQP_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {(searchTerm || filterCategory || filterStatus) && (
          <button className="btn btn-secondary" onClick={() => { setSearchTerm(''); setFilterCategory(''); setFilterStatus(''); }}>초기화</button>
        )}
      </div>

      {/* 설비 카드 그리드 */}
      {loading ? (
        <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
            {filtered.map(eqp => {
              const st = getEqpStatus(eqp.status);
              const uc = utilizationColor(eqp.utilizationRate);
              return (
                <div key={eqp.id} style={{
                  background: '#ffffff', borderRadius: 12, padding: '18px 20px',
                  border: `1.5px solid ${eqp.status === 'breakdown' ? '#fca5a5' : eqp.status === 'maintenance' ? '#fcd34d' : '#e2e8f0'}`,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  transition: 'box-shadow 0.2s',
                }}>
                  {/* 헤더 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', marginBottom: 2 }}>{eqp.name}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>{eqp.equipmentCode}</div>
                    </div>
                    <span className={`badge ${st.cls}`}>{st.label}</span>
                  </div>

                  {/* 가동률 */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>가동률</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: uc }}>{eqp.utilizationRate}%</span>
                    </div>
                    <div style={{ background: '#e2e8f0', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${eqp.utilizationRate}%`, height: '100%', background: uc, borderRadius: 99, transition: 'width 0.3s ease' }} />
                    </div>
                  </div>

                  {/* 정보 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>분류</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{eqp.category}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>위치</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{eqp.location || '-'}</div>
                    </div>
                    {eqp.nextMaintenance && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>다음 점검일</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#d97706' }}>
                          {new Date(eqp.nextMaintenance).toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 버튼 */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn-xs btn-xs-default" style={{ flex: 1 }} onClick={() => setViewModal(eqp)}>상세</button>
                    <button className="btn-xs btn-xs-indigo" style={{ flex: 1 }}
                      onClick={() => { setStatusModal(eqp); setNewStatus(eqp.status); setNewUtilRate(eqp.utilizationRate); }}>
                      상태 변경
                    </button>
                    {userRole === 'admin' && (
                      <button className="btn-xs btn-xs-red" onClick={() => setDeleteConfirm(eqp.id)}>삭제</button>
                    )}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                등록된 설비가 없습니다.
              </div>
            )}
          </div>
          {/* 검색 결과 표시 */}
          <div style={{ padding: '10px 4px', fontSize: 13, color: '#64748b', fontWeight: 500 }}>
            검색 결과 <strong style={{ color: '#1e293b' }}>{filtered.length}</strong>대 / 전체 {equipment.length}대
          </div>
        </>
      )}

      {/* ── 상세 모달 ── */}
      {viewModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setViewModal(null); }}>
          <div className="modal modal-md">
            <div className="modal-header">
              <div>
                <div className="modal-title">{viewModal.name}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, fontFamily: 'monospace' }}>{viewModal.equipmentCode}</div>
              </div>
              <button className="modal-close" onClick={() => setViewModal(null)}><XIcon /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                {[
                  { label: '분류', value: viewModal.category },
                  { label: '위치', value: viewModal.location || '-' },
                  { label: '현재 상태', value: getEqpStatus(viewModal.status).label },
                  { label: '가동률', value: `${viewModal.utilizationRate}%` },
                  { label: '담당 공정', value: viewModal.assignedProcess || '-' },
                  { label: '최종 정비일', value: viewModal.lastMaintenance ? new Date(viewModal.lastMaintenance).toLocaleDateString('ko-KR') : '-' },
                  { label: '다음 정비 예정', value: viewModal.nextMaintenance ? new Date(viewModal.nextMaintenance).toLocaleDateString('ko-KR') : '-' },
                ].map((r, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 3 }}>{r.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{r.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 12, color: '#475569', marginBottom: 6, fontWeight: 600 }}>가동률</div>
                <div style={{ background: '#e2e8f0', borderRadius: 99, height: 10, overflow: 'hidden' }}>
                  <div style={{
                    width: `${viewModal.utilizationRate}%`, height: '100%',
                    background: utilizationColor(viewModal.utilizationRate), borderRadius: 99,
                  }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: utilizationColor(viewModal.utilizationRate), marginTop: 6, textAlign: 'right' }}>
                  {viewModal.utilizationRate}%
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewModal(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 상태 변경 모달 ── */}
      {statusModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setStatusModal(null); }}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <div>
                <div className="modal-title">설비 상태 변경</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{statusModal.name}</div>
              </div>
              <button className="modal-close" onClick={() => setStatusModal(null)}><XIcon /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">상태 선택</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {EQP_STATUS.map(s => (
                    <button key={s.value} type="button"
                      onClick={() => setNewStatus(s.value)}
                      style={{
                        padding: '10px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                        border: `2px solid ${newStatus === s.value ? s.color : '#e2e8f0'}`,
                        background: newStatus === s.value ? `${s.color}15` : '#f8fafc',
                        color: newStatus === s.value ? s.color : '#64748b',
                        transition: 'all 0.15s',
                      }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              {newStatus === 'running' && (
                <div className="form-group">
                  <label className="form-label">가동률 (%)</label>
                  <input type="range" min={0} max={100} value={newUtilRate}
                    onChange={e => setNewUtilRate(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#2563eb' }} />
                  <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 16, color: '#2563eb' }}>{newUtilRate}%</div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setStatusModal(null)}>취소</button>
              <button className="btn btn-primary" onClick={handleStatusChange}>변경 저장</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 등록 모달 ── */}
      {createModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setCreateModal(false); }}>
          <div className="modal modal-md">
            <div className="modal-header">
              <span className="modal-title">설비 등록</span>
              <button className="modal-close" onClick={() => setCreateModal(false)}><XIcon /></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error" style={{ marginBottom: 14 }}>{error}</div>}
              <form id="eqp-form" onSubmit={handleCreate}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">설비명 *</label>
                    <input className="form-input" value={form.name} required placeholder="예: CNC 선반 #1"
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
                    <label className="form-label">위치</label>
                    <input className="form-input" value={form.location} placeholder="예: 1공장 A구역"
                      onChange={e => setForm({ ...form, location: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">담당 공정</label>
                    <input className="form-input" value={form.assignedProcess} placeholder="예: PROC-001"
                      onChange={e => setForm({ ...form, assignedProcess: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">다음 점검 예정일</label>
                    <input type="date" className="form-input" value={form.nextMaintenance}
                      onChange={e => setForm({ ...form, nextMaintenance: e.target.value })} />
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setCreateModal(false)}>취소</button>
              <button className="btn btn-primary" type="submit" form="eqp-form">설비 등록</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 삭제 확인 ── */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header">
              <span className="modal-title">설비 삭제</span>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}><XIcon /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#475569' }}>이 설비를 삭제하면 복구할 수 없습니다. 계속하시겠습니까?</p>
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
