// src/components/ApiStatusBanner.tsx
// ─────────────────────────────────────────────────────────
// API 서버 연결 상태 배너 컴포넌트
// 서버가 오프라인이면 경고 배너 표시
// ─────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { checkHealth } from '../services/questiqApi';

type ServerStatus = 'checking' | 'online' | 'offline';

const ApiStatusBanner: React.FC = () => {
  const [status, setStatus] = useState<ServerStatus>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const check = async () => {
    setStatus('checking');
    const isOnline = await checkHealth();
    setStatus(isOnline ? 'online' : 'offline');
    setLastChecked(new Date());
  };

  useEffect(() => {
    check();
    const interval = setInterval(check, 60_000); // 60초마다 체크
    return () => clearInterval(interval);
  }, []);

  if (status === 'online') return null; // 정상일 때 숨김

  const bannerStyle: React.CSSProperties = {
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '13px',
    fontFamily: "'Noto Sans KR', sans-serif",
    borderRadius: '10px',
    marginBottom: '16px',
    ...(status === 'checking'
      ? { background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }
      : { background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }),
  };

  return (
    <div style={bannerStyle}>
      <span>
        {status === 'checking' && '⏳ API 서버 연결 확인 중...'}
        {status === 'offline' && '⚠ API 서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인해주세요.'}
      </span>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {lastChecked && status === 'offline' && (
          <span style={{ fontSize: '11px', opacity: 0.7 }}>
            마지막 확인: {lastChecked.toLocaleTimeString('ko-KR')}
          </span>
        )}
        <button
          onClick={check}
          style={{
            padding: '4px 12px', background: 'transparent',
            border: `1px solid ${status === 'offline' ? '#fca5a5' : '#e2e8f0'}`,
            borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
            color: status === 'offline' ? '#dc2626' : '#64748b',
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          재시도
        </button>
      </div>
    </div>
  );
};

export default ApiStatusBanner;
