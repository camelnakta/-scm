'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { adminNav } from '@/app/admin/dashboard/page';

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  department: string;
  status: 'active' | 'inactive';
  createdAt: string;
  createdBy: string;
}

const DEPARTMENTS = ['시스템관리', '물류팀', '구매팀', '영업팀', '운영팀', '재무팀', '경영지원팀'];

const XIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const defaultForm = {
    username: '', password: '', name: '', email: '',
    role: 'user' as 'admin' | 'user',
    department: '물류팀',
    status: 'active' as 'active' | 'inactive',
  };
  const [form, setForm] = useState(defaultForm);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) setUsers(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => { setEditUser(null); setForm(defaultForm); setError(''); setShowModal(true); };
  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({
      username: u.username, password: '', name: u.name,
      email: u.email, role: u.role, department: u.department, status: u.status,
    });
    setError(''); setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try {
      if (editUser) {
        const body: Record<string, string> = {
          username: form.username, name: form.name,
          email: form.email, role: form.role,
          department: form.department, status: form.status,
        };
        if (form.password) body.password = form.password;
        const res = await fetch(`/api/users/${editUser.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); return; }
      } else {
        if (!form.password) { setError('비밀번호를 입력해주세요.'); return; }
        const res = await fetch('/api/users', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); return; }
      }
      setShowModal(false);
      setSuccess(editUser ? '사용자 정보가 수정되었습니다.' : '새 계정이 생성되었습니다.');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('서버 오류가 발생했습니다.'); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setDeleteConfirm(null);
      setSuccess('사용자가 삭제되었습니다.');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('서버 오류가 발생했습니다.'); }
  };

  const handleToggle = async (u: User) => {
    const res = await fetch(`/api/users/${u.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: u.status === 'active' ? 'inactive' : 'active' }),
    });
    if (res.ok) {
      fetchUsers();
      setSuccess(`계정이 ${u.status === 'active' ? '비활성화' : '활성화'}되었습니다.`);
      setTimeout(() => setSuccess(''), 2500);
    }
  };

  const filtered = users.filter(u => {
    const s = searchTerm.toLowerCase();
    return (
      (!s || u.username.toLowerCase().includes(s) || u.name.includes(searchTerm) ||
       u.email.toLowerCase().includes(s) || u.department.includes(searchTerm)) &&
      (!filterRole || u.role === filterRole) &&
      (!filterStatus || u.status === filterStatus)
    );
  });

  const summaryItems = [
    { label: '전체', value: users.length, color: '#475569', bg: '#f1f5f9' },
    { label: '관리자', value: users.filter(u => u.role === 'admin').length, color: '#1d4ed8', bg: '#dbeafe' },
    { label: '일반 사용자', value: users.filter(u => u.role === 'user').length, color: '#047857', bg: '#d1fae5' },
    { label: '비활성', value: users.filter(u => u.status === 'inactive').length, color: '#b91c1c', bg: '#fee2e2' },
  ];

  return (
    <SidebarLayout navItems={adminNav} title="관리자" userRole="admin">
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>계정 관리</h2>
          <p>사용자 계정을 생성하고 권한을 관리합니다.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          새 계정 생성
        </button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && !showModal && <div className="alert alert-error">{error}</div>}

      {/* Summary */}
      <div className="summary-strip">
        {summaryItems.map((s, i) => (
          <div key={i} style={{
            padding: '8px 14px', background: s.bg, borderRadius: '8px',
            display: 'flex', alignItems: 'center', gap: '7px',
          }}>
            <span style={{ fontSize: '18px', fontWeight: 700, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: '12px', color: s.color, fontWeight: 500 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div style={{ flex: 1, minWidth: '180px' }}>
          <input
            className="form-input"
            placeholder="아이디, 이름, 이메일, 부서 검색..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="form-input" style={{ width: '120px' }}
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
        >
          <option value="">전체 권한</option>
          <option value="admin">관리자</option>
          <option value="user">일반 사용자</option>
        </select>
        <select
          className="form-input" style={{ width: '110px' }}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">전체 상태</option>
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
        </select>
        {(searchTerm || filterRole || filterStatus) && (
          <button className="btn btn-secondary" onClick={() => { setSearchTerm(''); setFilterRole(''); setFilterStatus(''); }}>
            초기화
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-wrap">
        {loading ? (
          <div className="loading-screen" style={{ minHeight: '200px' }}>
            <div className="spinner" /><span>불러오는 중...</span>
          </div>
        ) : (
          <>
            <table className="data-table" style={{ tableLayout: 'auto' }}>
              <thead>
                <tr>
                  <th style={{ width: '110px' }}>아이디</th>
                  <th style={{ width: '90px' }}>이름</th>
                  <th>이메일</th>
                  <th style={{ width: '90px' }}>부서</th>
                  <th style={{ width: '90px' }}>권한</th>
                  <th style={{ width: '70px' }}>상태</th>
                  <th style={{ width: '80px' }}>생성자</th>
                  <th style={{ width: '90px' }}>생성일</th>
                  <th style={{ width: '90px', textAlign: 'right', paddingRight: '16px' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="table-empty">검색 결과가 없습니다.</td>
                  </tr>
                ) : filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '12px' }}>
                        {u.username}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td style={{ color: '#64748b' }}>{u.email}</td>
                    <td style={{ color: '#475569' }}>{u.department}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-blue' : 'badge-gray'}`}>
                        {u.role === 'admin' ? '관리자' : '일반'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggle(u)}
                        className={`badge ${u.status === 'active' ? 'badge-green' : 'badge-red'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                      >
                        {u.status === 'active' ? '활성' : '비활성'}
                      </button>
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: '12px' }}>{u.createdBy}</td>
                    <td style={{ color: '#94a3b8', fontSize: '12px' }}>
                      {new Date(u.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end', paddingRight: '4px' }}>
                        <button className="btn-xs btn-xs-blue" onClick={() => openEdit(u)}>수정</button>
                        <button className="btn-xs btn-xs-red" onClick={() => setDeleteConfirm(u.id)}>삭제</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="table-footer">
              <span>총 {filtered.length}명 / 전체 {users.length}명</span>
            </div>
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal modal-md">
            <div className="modal-header">
              <span className="modal-title">{editUser ? '계정 수정' : '새 계정 생성'}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}><XIcon /></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error" style={{ marginBottom: '14px' }}>{error}</div>}
              <form id="user-form" onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '13px' }}>
                  <div className="form-group">
                    <label className="form-label">아이디 *</label>
                    <input
                      className="form-input" value={form.username} required
                      placeholder="로그인 아이디" autoComplete="off"
                      onChange={e => setForm({ ...form, username: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      {editUser ? '새 비밀번호 (변경 시만 입력)' : '비밀번호 *'}
                    </label>
                    <input
                      type="password" className="form-input" value={form.password}
                      placeholder="최소 6자" required={!editUser} autoComplete="new-password"
                      onChange={e => setForm({ ...form, password: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">이름 *</label>
                    <input
                      className="form-input" value={form.name} required placeholder="실명"
                      onChange={e => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">이메일 *</label>
                    <input
                      type="email" className="form-input" value={form.email} required placeholder="이메일 주소"
                      onChange={e => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">권한 *</label>
                    <select
                      className="form-input" value={form.role}
                      onChange={e => setForm({ ...form, role: e.target.value as 'admin' | 'user' })}
                    >
                      <option value="user">일반 사용자</option>
                      <option value="admin">관리자</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">부서 *</label>
                    <select
                      className="form-input" value={form.department}
                      onChange={e => setForm({ ...form, department: e.target.value })}
                    >
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  {editUser && (
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">계정 상태</label>
                      <select
                        className="form-input" value={form.status}
                        onChange={e => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
                      >
                        <option value="active">활성</option>
                        <option value="inactive">비활성</option>
                      </select>
                    </div>
                  )}
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" type="button" onClick={() => setShowModal(false)}>취소</button>
              <button className="btn btn-primary" type="submit" form="user-form">
                {editUser ? '수정 저장' : '계정 생성'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header">
              <span className="modal-title">계정 삭제</span>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}><XIcon /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
                이 계정을 삭제하시겠습니까?<br />
                <strong style={{ color: '#b91c1c' }}>삭제 후 복구할 수 없습니다.</strong>
              </p>
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
