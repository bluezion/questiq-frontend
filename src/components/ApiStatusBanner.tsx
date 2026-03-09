// src/components/ApiStatusBanner.tsx
// ─────────────────────────────────────────────────────────
// API 서버 연결 상태 배너 컴포넌트
// - REACT_APP_API_URL 미설정 시: 설정 안내 메시지 표시
// - 서버가 오프라인이면 경고 배너 표시
// ─────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { checkHealth, getApiBaseUrl } from '../services/questiqApi';

type ServerStatus = 'checking' | 'online' | 'offline' | 'misconfigured';

const ApiStatusBanner: React.FC = () => {
  const [status, setStatus] = useState<ServerStatus>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [apiUrl, setApiUrl] = useState<string>('');

  const check = async () => {
    const url = getApiBaseUrl();
    setApiUrl(url);

    // URL이 localhost인데 프로덕션 환경이면 → 잘못된 설정
    const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');
    const isProd = process.env.NODE_ENV === 'production';

    if (isLocalhost && isProd) {
      setStatus('misconfigured');
      setLastChecked(new Date());
      return;
    }

    setStatus('checking');
    const isOnline = await checkHealth();
    setStatus(isOnline ? 'online' : 'offline');
    setLastChecked(new Date());
  };

  useEffect(() => {
    check();
    const interval = setInterval(check, 60_000); // 60초마다 체크
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'online') return null; // 정상일 때 숨김

  const isChecking = status === 'checking';
  const isMisconfig = status === 'misconfigured';
  const isOffline = status === 'offline';

  const bannerStyle: React.CSSProperties = {
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
    fontSize: '13px',
    fontFamily: "'Noto Sans KR', sans-serif",
    borderRadius: '10px',
    marginBottom: '16px',
    lineHeight: 1.6,
    ...(isChecking
      ? { background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }
      : isMisconfig
      ? { background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }
      : { background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }),
  };

  const btnColor = isMisconfig ? '#d97706' : isOffline ? '#dc2626' : '#64748b';
  const btnBorder = isMisconfig ? '#fde68a' : isOffline ? '#fca5a5' : '#e2e8f0';

  return (
    <div style={bannerStyle}>
      <div style={{ flex: 1 }}>
        {isChecking && <span>⏳ API 서버 연결 확인 중...</span>}

        {isMisconfig && (
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              ⚙️ Railway 환경변수 설정이 필요합니다
            </div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              <strong>REACT_APP_API_URL</strong> 이 설정되지 않아 백엔드에 연결할 수 없습니다.<br />
              Railway 대시보드 → 프론트엔드 서비스 → <strong>Variables 탭</strong>에서 아래 변수를 추가하고 재배포하세요:<br />
              <code style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: 4, marginTop: 4, display: 'inline-block', fontFamily: 'monospace', fontSize: 12 }}>
                REACT_APP_API_URL = https://백엔드-서비스.up.railway.app
              </code>
            </div>
          </div>
        )}

        {isOffline && (
          <div>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>
              ⚠ API 서버에 연결할 수 없습니다
            </div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              백엔드 서버({apiUrl})가 응답하지 않습니다. 백엔드 서비스가 실행 중인지 확인해주세요.
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
        {lastChecked && !isChecking && (
          <span style={{ fontSize: '11px', opacity: 0.6, whiteSpace: 'nowrap' }}>
            {lastChecked.toLocaleTimeString('ko-KR')}
          </span>
        )}
        {!isMisconfig && (
          <button
            onClick={check}
            style={{
              padding: '4px 12px', background: 'transparent',
              border: `1px solid ${btnBorder}`,
              borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
              color: btnColor,
              fontFamily: "'Noto Sans KR', sans-serif",
              whiteSpace: 'nowrap',
            }}
          >
            재시도
          </button>
        )}
      </div>
    </div>
  );
};

export default ApiStatusBanner;
