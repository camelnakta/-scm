'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { adminNav } from '@/app/admin/dashboard/page';
import { userNav } from '@/app/dashboard/page';

interface Material {
  id: string;
  materialCode: string;
  name: string;
  category: string;
  unit: string;
  stockQty: number;
  minQty: number;
  unitCost: number;
  supplierId: string;
  supplierName: string;
  location: string;
  status: 'normal' | 'low' | 'out';
  lastUpdated: string;
}

const CATEGORIES = ['금속', '도료', '체결류', '전장', '고무/플라스틱', '기타'];
const UNITS = ['EA', 'kg', 'm', 'L', 'Box', 'Set', 'Roll'];

const XIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');

  const [createModal, setCreateModal] = useState(false);
  const [viewModal, setViewModal] = useState<Material | null>(null);
  const [editModal, setEditModal] = useState<Material | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [adjustModal, setAdjustModal] = useState<Material | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustNote, setAdjustNote] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const blankForm = { name: '', category: '', unit: 'EA', stockQty: 0, minQty: 0, unitCost: 0, supplierName: '', location: '' };
  const [form, setForm] = useState(blankForm);
  const [editForm, setEditForm] = useState(blankForm);

  const fetchData = async () => {
    try {
      const [me, mats] = await Promise.all([
        fetch('/api/auth/me').then(r => r.json()),
        fetch('/api/materials').then(r => r.json()),
      ]);
      setUserRole(me.role);
      setMaterials(Array.isArray(mats) ? mats : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try {
      const res = await fetch('/api/materials', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setCreateModal(false); setForm(blankForm);
      setSuccess('자재가 등록되었습니다.');
      fetchData(); setTimeout(() => setSuccess(''), 3000);
    } catch { setError('서버 오류가 발생했습니다.'); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!editModal) return;
    try {
      const res = await fetch(`/api/materials/${editModal.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setEditModal(null);
      setSuccess('자재 정보가 수정되었습니다.');
      fetchData(); setTimeout(() => setSuccess(''), 3000);
    } catch { setError('서버 오류가 발생했습니다.'); }
  };

  const handleAdjust = async () => {
    if (!adjustModal) return; setError('');
    try {
      const newQty = Math.max(0, adjustModal.stockQty + adjustQty);
      const res = await fetch(`/api/materials/${adjustModal.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQty: newQty }),
      });
      if (!res.ok) { setError('수량 조정 실패'); return; }
      setAdjustModal(null); setAdjustQty(0); setAdjustNote('');
      setSuccess(`재고 수량이 조정되었습니다. (${adjustQty >= 0 ? '+' : ''}${adjustQty})`);
      fetchData(); setTimeout(() => setSuccess(''), 3000);
    } catch { setError('서버 오류가 발생했습니다.'); }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/materials/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setDeleteConfirm(null);
      setSuccess('자재가 삭제되었습니다.');
      fetchData(); setTimeout(() => setSuccess(''), 2500);
    }
  };

  const filtered = materials.filter(m =>
    (!searchTerm || m.materialCode.includes(searchTerm) || m.name.includes(searchTerm) || m.supplierName.includes(searchTerm)) &&
    (!filterCategory || m.category === filterCategory) &&
    (!filterStatus || m.status === filterStatus)
  );

  const navItems = userRole === 'admin' ? adminNav : userNav;

  const statusCls: Record<string, string> = { normal: 'badge-green', low: 'badge-amber', out: 'badge-red' };
  const statusLabel: Record<string, string> = { normal: '정상', low: '부족', out: '소진' };

  const FormBody = ({ f, setF, isEdit = false }: {
    f: typeof blankForm;
    setF: (v: typeof blankForm) => void;
    isEdit?: boolean;
  }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <div className="form-group" style={{ gridColumn: 'span 2' }}>
        <label className="form-label">자재명 *</label>
        <input className="form-input" value={f.name} required placeholder="예: S45C 환봉 Φ50"
          onChange={e => setF({ ...f, name: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">분류 *</label>
        <select className="form-input" value={f.category} required
          onChange={e => setF({ ...f, category: e.target.value })}>
          <option value="">분류 선택</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">단위</label>
        <select className="form-input" value={f.unit}
          onChange={e => setF({ ...f, unit: e.target.value })}>
          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">현재 재고</label>
        <input type="number" className="form-input" min={0} value={f.stockQty}
          onChange={e => setF({ ...f, stockQty: Number(e.target.value) })} />
      </div>
      <div className="form-group">
        <label className="form-label">최소 재고 (경보 기준)</label>
        <input type="number" className="form-input" min={0} value={f.minQty}
          onChange={e => setF({ ...f, minQty: Number(e.target.value) })} />
      </div>
      <div className="form-group">
        <label className="form-label">단가 (원)</label>
        <input type="number" className="form-input" min={0} value={f.unitCost}
          onChange={e => setF({ ...f, unitCost: Number(e.target.value) })} />
      </div>
      <div className="form-group">
        <label className="form-label">창고 위치</label>
        <input className="form-input" value={f.location} placeholder="예: A-01"
          onChange={e => setF({ ...f, location: e.target.value })} />
      </div>
      <div className="form-group" style={{ gridColumn: 'span 2' }}>
        <label className="form-label">공급업체</label>
        <input className="form-input" value={f.supplierName} placeholder="공급업체명"
          onChange={e => setF({ ...f, supplierName: e.target.value })} />
      </div>
    </div>
  );

  return (
    <SidebarLayout navItems={navItems} title="공정 관리" userRole={userRole}>
      <div className="page-header">
        <div className="page-header-left">
          <h2>자재 관리</h2>
          <p>공정에 사용되는 자재 재고를 관리합니다.</p>
        </div>
        {userRole === 'admin' && (
          <button className="btn btn-primary" onClick={() => { setForm(blankForm); setError(''); setCreateModal(true); }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            자재 등록
          </button>
        )}
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      {/* 요약 */}
      <div className="summary-strip">
        {[
          { key: '', label: '전체', cls: 'badge-blue', count: materials.length },
          { key: 'normal', label: '정상', cls: 'badge-green', count: materials.filter(m => m.status === 'normal').length },
          { key: 'low', label: '부족', cls: 'badge-amber', count: materials.filter(m => m.status === 'low').length },
          { key: 'out', label: '소진', cls: 'badge-red', count: materials.filter(m => m.status === 'out').length },
        ].map(s => (
          <div key={s.key} className={`summary-chip${filterStatus === s.key && s.key ? ' active' : ''}`}
            onClick={() => setFilterStatus(filterStatus === s.key ? '' : s.key)}>
            <span className="chip-num">{s.count}</span>
            <span className={`badge ${s.cls}`}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <div className="filter-bar">
        <div style={{ flex: 1, minWidth: 200 }}>
          <input className="form-input" placeholder="자재코드, 자재명, 공급업체 검색..."
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
          <option value="normal">정상</option>
          <option value="low">부족</option>
          <option value="out">소진</option>
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
                  <th>자재코드</th>
                  <th>자재명</th>
                  <th>분류</th>
                  <th style={{ textAlign: 'center' }}>재고</th>
                  <th style={{ textAlign: 'center' }}>최소재고</th>
                  <th style={{ textAlign: 'right' }}>단가</th>
                  <th>위치</th>
                  <th>공급업체</th>
                  <th>상태</th>
                  <th style={{ textAlign: 'right', paddingRight: 20 }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={10} className="table-empty">등록된 자재가 없습니다.</td></tr>
                ) : filtered.map(m => (
                  <tr key={m.id} style={m.status === 'out' ? { background: '#fff5f5' } : m.status === 'low' ? { background: '#fffbeb' } : {}}>
                    <td><span className="text-mono" style={{ fontSize: 12, fontWeight: 700 }}>{m.materialCode}</span></td>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td><span className="badge badge-indigo">{m.category}</span></td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: m.status === 'out' ? '#b91c1c' : m.status === 'low' ? '#d97706' : '#1e293b' }}>
                      {m.stockQty.toLocaleString()} {m.unit}
                    </td>
                    <td style={{ textAlign: 'center', color: '#475569', fontSize: 13 }}>
                      {m.minQty.toLocaleString()} {m.unit}
                    </td>
                    <td style={{ textAlign: 'right', color: '#475569', fontSize: 13 }}>
                      {m.unitCost.toLocaleString()}원
                    </td>
                    <td style={{ color: '#64748b', fontSize: 13 }}>{m.location || '-'}</td>
                    <td style={{ color: '#64748b', fontSize: 13 }}>{m.supplierName || '-'}</td>
                    <td>
                      <span className={`badge ${statusCls[m.status]}`}>{statusLabel[m.status]}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', paddingRight: 4 }}>
                        <button className="btn-xs btn-xs-default" onClick={() => setViewModal(m)}>상세</button>
                        <button className="btn-xs btn-xs-indigo" onClick={() => { setAdjustModal(m); setAdjustQty(0); setAdjustNote(''); }}>
                          수량조정
                        </button>
                        {userRole === 'admin' && (
                          <>
                            <button className="btn-xs btn-xs-default" onClick={() => { setEditModal(m); setEditForm({ name: m.name, category: m.category, unit: m.unit, stockQty: m.stockQty, minQty: m.minQty, unitCost: m.unitCost, supplierName: m.supplierName, location: m.location }); }}>수정</button>
                            <button className="btn-xs btn-xs-red" onClick={() => setDeleteConfirm(m.id)}>삭제</button>
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
                재고 부족 {materials.filter(m => m.status !== 'normal').length}건
              </span>
            </div>
          </>
        )}
      </div>

      {/* ── 상세 모달 ── */}
      {viewModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setViewModal(null); }}>
          <div className="modal modal-md">
            <div className="modal-header">
              <div>
                <div className="modal-title">자재 상세</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, fontFamily: 'monospace' }}>{viewModal.materialCode}</div>
              </div>
              <button className="modal-close" onClick={() => setViewModal(null)}><XIcon /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: '자재명', value: viewModal.name },
                  { label: '분류', value: viewModal.category },
                  { label: '단위', value: viewModal.unit },
                  { label: '현재 재고', value: `${viewModal.stockQty.toLocaleString()} ${viewModal.unit}` },
                  { label: '최소 재고', value: `${viewModal.minQty.toLocaleString()} ${viewModal.unit}` },
                  { label: '단가', value: `${viewModal.unitCost.toLocaleString()}원` },
                  { label: '재고 가치', value: `${(viewModal.stockQty * viewModal.unitCost).toLocaleString()}원` },
                  { label: '보관 위치', value: viewModal.location || '-' },
                  { label: '공급업체', value: viewModal.supplierName || '-' },
                  { label: '상태', value: statusLabel[viewModal.status] },
                  { label: '최종 업데이트', value: new Date(viewModal.lastUpdated).toLocaleDateString('ko-KR') },
                ].map((r, i) => (
                  <div key={i} style={i >= 8 ? { gridColumn: 'span 1' } : {}}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 3 }}>{r.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{r.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#475569' }}>재고 충족률</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: viewModal.minQty === 0 ? '#15803d' : viewModal.stockQty >= viewModal.minQty ? '#15803d' : '#b91c1c' }}>
                    {viewModal.minQty > 0 ? Math.round((viewModal.stockQty / viewModal.minQty) * 100) : 100}%
                  </span>
                </div>
                <div style={{ background: '#e2e8f0', borderRadius: 99, height: 6, overflow: 'hidden', marginTop: 6 }}>
                  <div style={{
                    width: `${viewModal.minQty > 0 ? Math.min(Math.round((viewModal.stockQty / viewModal.minQty) * 100), 100) : 100}%`,
                    height: '100%',
                    background: viewModal.status === 'out' ? '#dc2626' : viewModal.status === 'low' ? '#d97706' : '#16a34a',
                    borderRadius: 99,
                  }} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewModal(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 수량 조정 모달 ── */}
      {adjustModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setAdjustModal(null); }}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <div>
                <div className="modal-title">재고 수량 조정</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{adjustModal.name}</div>
              </div>
              <button className="modal-close" onClick={() => setAdjustModal(null)}><XIcon /></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 8, marginBottom: 16, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>현재 재고</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b' }}>
                  {adjustModal.stockQty.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 500 }}>{adjustModal.unit}</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">조정 수량 (입고: 양수, 출고: 음수)</label>
                <input type="number" className="form-input" value={adjustQty}
                  onChange={e => setAdjustQty(Number(e.target.value))}
                  style={{ fontSize: 16, fontWeight: 700, textAlign: 'center' }} />
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  조정 후: <strong>{Math.max(0, adjustModal.stockQty + adjustQty).toLocaleString()} {adjustModal.unit}</strong>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">비고</label>
                <input className="form-input" value={adjustNote} placeholder="사유 입력 (선택)"
                  onChange={e => setAdjustNote(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAdjustModal(null)}>취소</button>
              <button className="btn btn-primary" onClick={handleAdjust}>수량 조정</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 등록 모달 ── */}
      {createModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setCreateModal(false); }}>
          <div className="modal modal-md">
            <div className="modal-header">
              <span className="modal-title">자재 등록</span>
              <button className="modal-close" onClick={() => setCreateModal(false)}><XIcon /></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error" style={{ marginBottom: 14 }}>{error}</div>}
              <form id="mat-form" onSubmit={handleCreate}>
                <FormBody f={form} setF={setForm} />
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setCreateModal(false)}>취소</button>
              <button className="btn btn-primary" type="submit" form="mat-form">자재 등록</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 수정 모달 ── */}
      {editModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setEditModal(null); }}>
          <div className="modal modal-md">
            <div className="modal-header">
              <div>
                <span className="modal-title">자재 수정</span>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, fontFamily: 'monospace' }}>{editModal.materialCode}</div>
              </div>
              <button className="modal-close" onClick={() => setEditModal(null)}><XIcon /></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error" style={{ marginBottom: 14 }}>{error}</div>}
              <form id="mat-edit-form" onSubmit={handleEdit}>
                <FormBody f={editForm} setF={setEditForm} isEdit />
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditModal(null)}>취소</button>
              <button className="btn btn-primary" type="submit" form="mat-edit-form">저장</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 삭제 확인 ── */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header">
              <span className="modal-title">자재 삭제</span>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}><XIcon /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#475569' }}>이 자재를 삭제하면 복구할 수 없습니다. 계속하시겠습니까?</p>
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
