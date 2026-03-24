'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '로그인에 실패했습니다.'); return; }
      router.push(data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } catch {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const FEATURES = [
    { title: '공정 흐름 관리', desc: '단계별 공정 정의 및 표준 시간 관리' },
    { title: '작업지시 진행도', desc: '단계별 진행률 실시간 입력 및 조회' },
    { title: '자재 재고 관리', desc: '공정 소요 자재 입출고 및 경보 관리' },
    { title: '설비 가동 현황', desc: '설비별 가동률 및 정비 상태 모니터링' },
  ];

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#0f172a',
    }}>
      {/* ── Left panel ── */}
      <div style={{
        flex: '0 0 400px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '56px 48px',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Brand */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{
            width: '44px', height: '44px',
            background: '#2563eb',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '20px',
          }}>
            <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h1 style={{
            fontSize: '22px', fontWeight: '800', color: '#f1f5f9',
            letterSpacing: '-0.03em', lineHeight: 1.3,
          }}>
            공정 흐름 SCM
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
            공정 흐름 통합 관리 플랫폼
          </p>
        </div>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: '#3b82f6', marginTop: '6px', flexShrink: 0,
              }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0', lineHeight: 1.4 }}>
                  {f.title}
                </div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
      }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>

          {/* Form card */}
          <div style={{
            background: '#1e293b',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            padding: '32px',
          }}>
            <h2 style={{
              fontSize: '18px', fontWeight: '700', color: '#f1f5f9',
              marginBottom: '4px',
            }}>
              로그인
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
              계정 정보를 입력하세요.
            </p>

            {error && (
              <div style={{
                padding: '10px 13px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '13px',
                marginBottom: '18px',
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{
                  display: 'block', fontSize: '11px', fontWeight: '600',
                  color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}>
                  아이디
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  placeholder="아이디 입력"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  required
                  style={{
                    width: '100%', padding: '9px 12px',
                    background: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', fontSize: '14px', color: '#f1f5f9',
                    outline: 'none', fontFamily: 'inherit',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block', fontSize: '11px', fontWeight: '600',
                  color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}>
                  비밀번호
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="비밀번호 입력"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  style={{
                    width: '100%', padding: '9px 12px',
                    background: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', fontSize: '14px', color: '#f1f5f9',
                    outline: 'none', fontFamily: 'inherit',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '6px',
                  padding: '10px',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  fontFamily: 'inherit',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!loading) (e.target as HTMLElement).style.background = '#1d4ed8'; }}
                onMouseLeave={e => { if (!loading) (e.target as HTMLElement).style.background = '#2563eb'; }}
              >
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </form>
          </div>

          {/* Test accounts */}
          <div style={{ marginTop: '16px' }}>
            <p style={{
              fontSize: '10px', color: '#334155', textAlign: 'center',
              marginBottom: '10px', textTransform: 'uppercase',
              letterSpacing: '0.08em', fontWeight: '700',
            }}>
              테스트 계정
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { role: '관리자', id: 'admin', pw: 'admin123', accent: '#2563eb', bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.2)' },
                { role: '일반 사용자', id: 'user1', pw: 'user1234', accent: '#059669', bg: 'rgba(5,150,105,0.08)', border: 'rgba(5,150,105,0.2)' },
              ].map(acc => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => setForm({ username: acc.id, password: acc.pw })}
                  style={{
                    padding: '10px 12px',
                    background: acc.bg,
                    border: `1px solid ${acc.border}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: '700', color: acc.accent }}>{acc.role}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                    {acc.id} / {acc.pw}
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
