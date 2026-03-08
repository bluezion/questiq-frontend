// src/components/auth/LoginPage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 교사 로그인 / 회원가입 페이지
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const { login, register, error, clearError } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);

  // 폼 상태
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [school, setSchool]     = useState('');
  const [subject, setSubject]   = useState('');
  const [localErr, setLocalErr] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalErr('');
    clearError();
    if (!email || !password) { setLocalErr('이메일과 비밀번호를 입력해주세요.'); return; }
    if (mode === 'register' && !name) { setLocalErr('이름을 입력해주세요.'); return; }
    if (mode === 'register' && password.length < 8) {
      setLocalErr('비밀번호는 8자 이상이어야 합니다.'); return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({ email, password, name, school, subject });
      }
    } catch { /* error is already set in context */ }
    finally { setLoading(false); }
  };

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login');
    setLocalErr('');
    clearError();
  };

  const displayError = localErr || error;

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        {/* 로고 */}
        <div style={styles.logoRow}>
          <span style={styles.logoIcon}>🎯</span>
          <span style={styles.logoText}>QuestIQ</span>
        </div>
        <p style={styles.subtitle}>질문 역량 진단 플랫폼 · 교사용</p>

        {/* 탭 */}
        <div style={styles.tabRow}>
          {(['login', 'register'] as Mode[]).map(m => (
            <button
              key={m}
              style={{ ...styles.tab, ...(mode === m ? styles.tabActive : {}) }}
              onClick={() => { setMode(m); setLocalErr(''); clearError(); }}
            >
              {m === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        {/* 에러 */}
        {displayError && (
          <div style={styles.errorBox}>⚠️ {displayError}</div>
        )}

        {/* 폼 */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === 'register' && (
            <>
              <label style={styles.label}>이름 *</label>
              <input style={styles.input} type="text" placeholder="홍길동" value={name}
                onChange={e => setName(e.target.value)} required autoComplete="name" />
            </>
          )}

          <label style={styles.label}>이메일 *</label>
          <input style={styles.input} type="email" placeholder="teacher@school.edu" value={email}
            onChange={e => setEmail(e.target.value)} required autoComplete="email" />

          <label style={styles.label}>비밀번호 *</label>
          <input style={styles.input} type="password"
            placeholder={mode === 'register' ? '8자 이상' : '비밀번호'}
            value={password} onChange={e => setPassword(e.target.value)}
            required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />

          {mode === 'register' && (
            <>
              <label style={styles.label}>학교 (선택)</label>
              <input style={styles.input} type="text" placeholder="○○중학교" value={school}
                onChange={e => setSchool(e.target.value)} />

              <label style={styles.label}>담당 과목 (선택)</label>
              <input style={styles.input} type="text" placeholder="예: 국어, 과학" value={subject}
                onChange={e => setSubject(e.target.value)} />
            </>
          )}

          <button type="submit" style={{ ...styles.submitBtn, ...(loading ? styles.btnDisabled : {}) }}
            disabled={loading}>
            {loading ? '처리 중...' : (mode === 'login' ? '로그인' : '회원가입')}
          </button>
        </form>

        {/* 전환 링크 */}
        <p style={styles.switchText}>
          {mode === 'login' ? '계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
          <button style={styles.switchBtn} onClick={switchMode}>
            {mode === 'login' ? '회원가입' : '로그인'}
          </button>
        </p>

        {/* 데모 안내 */}
        <div style={styles.demoBox}>
          <span style={{ fontSize: 13, color: '#6b7280' }}>
            🧪 <strong>데모 모드</strong>: 백엔드 없이도 대시보드를 체험할 수 있습니다.
            로그인 없이 <em>교사 대시보드</em> 탭을 직접 클릭해 보세요.
          </span>
        </div>
      </div>
    </div>
  );
}

// ── 스타일 ────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  overlay: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: 20,
  },
  card: {
    background: '#fff',
    borderRadius: 20,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 440,
    boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 },
  logoIcon: { fontSize: 32 },
  logoText: { fontSize: 28, fontWeight: 800, color: '#1e1b4b' },
  subtitle: { color: '#6b7280', fontSize: 14, margin: '0 0 24px' },
  tabRow: { display: 'flex', gap: 8, marginBottom: 20 },
  tab: {
    flex: 1, padding: '10px 0', borderRadius: 10, border: '2px solid #e5e7eb',
    background: '#f9fafb', color: '#6b7280', fontWeight: 600, fontSize: 14,
    cursor: 'pointer', transition: 'all .2s',
  },
  tabActive: {
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff', border: '2px solid transparent',
  },
  errorBox: {
    background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
    borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 14,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151', marginTop: 6 },
  input: {
    padding: '10px 14px', borderRadius: 10, border: '2px solid #e5e7eb',
    fontSize: 14, outline: 'none', transition: 'border .2s',
  },
  submitBtn: {
    marginTop: 16, padding: '13px 0', borderRadius: 12,
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff', fontWeight: 700, fontSize: 15, border: 'none',
    cursor: 'pointer', letterSpacing: '0.3px',
  },
  btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  switchText: { textAlign: 'center', marginTop: 16, fontSize: 13, color: '#6b7280' },
  switchBtn: {
    background: 'none', border: 'none', color: '#667eea',
    fontWeight: 700, cursor: 'pointer', fontSize: 13,
  },
  demoBox: {
    marginTop: 20, background: '#f0f9ff', borderRadius: 10,
    padding: '10px 14px', textAlign: 'center',
  },
};
