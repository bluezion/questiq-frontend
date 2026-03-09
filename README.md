# 🌱 질문샘 — AI 질문 역량 진단 플랫폼

> **질문이 샘솟는 AI 학습 플랫폼** | 학생의 질문 역량을 키우는 교육 앱

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 📊 **역량 진단** | Bloom, 마르자노 기준으로 질문 수준 진단 |
| 🌱 **질문 씨앗 모드** | 빈 질문에서 AI가 6단계로 이끌어주는 모드 |
| 🔍 **질문 분류** | AI가 실시간으로 질문을 분석·분류 |
| 🎯 **QFT 세션** | 질문 형성 기법(Question Formulation Technique) |
| 👩‍🏫 **교사 대시보드** | 학생 질문 역량 현황 모니터링 |

---

## 🚀 로컬 실행

```bash
# 의존성 설치
npm install --legacy-peer-deps

# 환경변수 설정
cp .env .env.local
# .env.local에서 REACT_APP_API_URL 수정

# 개발 서버 실행
npm start
```

---

## 🌐 배포

이 프로젝트는 **Railway + Dockerfile** 기반으로 배포됩니다.

### 환경변수 (Railway Variables 탭에서 설정)

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `REACT_APP_API_URL` | 백엔드 API URL | `https://questiq-backend-production.up.railway.app` |

---

## 🛠 기술 스택

- **Frontend**: React 18, TypeScript 4.9
- **Build**: react-app-rewired (CRA 기반)
- **HTTP**: Axios
- **Deploy**: Railway, Docker

---

## 📁 프로젝트 구조

```
src/
├── components/
│   ├── seedmode/          # 🌱 질문 씨앗 모드 (신규)
│   ├── diagnostic/        # 역량 진단
│   ├── teacher/           # 교사 대시보드
│   └── auth/              # 로그인
├── services/              # API 통신
├── hooks/                 # 커스텀 훅
├── types/                 # TypeScript 타입
└── App.tsx
```

---

*질문이 샘솟는 교실 🌱*
