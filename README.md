# 🏛️ 관보 트렌드 분석기

> 대한민국 관보 공시 데이터를 시각화하여 정책 흐름을 분석하는 대시보드

[![Deploy](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sigco3111/gazette-trend-analyzer)

**라이브 데모:** [gazette-trend-analyzer.vercel.app](https://gazette-trend-analyzer.vercel.app)

---

## 📋 개요

행정안전부 전자관보의 공시 데이터를 수집하여 월별 추이, 분야별 분포, 핵심 키워드, 기관별 순위 등을 인터랙티브 차트로 제공합니다. 원본 데이터는 [ai-readable-gazette-kr](https://hosungseo.github.io/ai-readable-gazette-kr/) (opendataloader OCR 기반, CC0)를 활용합니다.

### 주요 기능

| 탭 | 내용 |
|---|---|
| **개요** | 통계 요약, 월별 공시 추이(에어리어 차트), 분야별 분포(수평 바), 분야별 월별 추이(라인 차트), 최근 공시 목록 |
| **키워드** | 정책 키워드 빈도 TOP 30 (추세 배지 포함), 키워드 빈도 분포 바 차트 |
| **기관** | 기관별 공시 순위 TOP 20 (분류, 건수, 비중), 기관 분류별 비중, 주요 기관 공시 추이 |

### 분석 로직

- **월별 추이**: 전체 코퍼스의 `meta.json` 히트맵 데이터 사용 (2020년~현재)
- **분야별 분포**: 기관 분류(`cat`) 기준 전체 공시 건수 집계
- **키워드 분석**: 최근 N일 공시 문서의 제목+기관명에서 8개 카테고리 120+ 키워드 매칭, 전/후반기 비교로 추세(증가/감소/유지) 판정
- **기관 순위**: 전체 코퍼스 기준 상위 20개 기관

---

## 🛠 기술 스택

| 항목 | 기술 |
|---|---|
| **프레임워크** | Next.js 16 (App Router) |
| **언어** | TypeScript 5 |
| **스타일링** | Tailwind CSS v4 |
| **차트** | Recharts 3 (AreaChart, BarChart, LineChart) |
| **배포** | Vercel |
| **데이터소스** | [ai-readable-gazette-kr](https://hosungseo.github.io/ai-readable-gazette-kr/) static JSON |

---

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── globals.css          # Tailwind 임포트, CSS 변수, 커스텀 스크롤바
│   ├── layout.tsx           # 루트 레이아웃 (Noto Sans KR 폰트)
│   ├── page.tsx             # 메인 대시보드 (전체 UI)
│   └── api/analysis/
│       └── route.ts         # 분석 API (GET /api/analysis?days=60)
└── lib/
    ├── types.ts             # TypeScript 인터페이스 정의
    ├── api.ts               # 외부 데이터 페칭 (meta.json + 날짜별 JSON)
    └── analyzer.ts          # 트렌드 분석 로직 (키워드, 카테고리, 통계)
```

---

## 🚀 로컬 개발

### 사전 요구사항

- Node.js 18+
- npm / yarn / pnpm / bun

### 설치 및 실행

```bash
# 클론
git clone https://github.com/sigco3111/gazette-trend-analyzer.git
cd gazette-trend-analyzer

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인합니다.

### 빌드

```bash
npm run build
npm start
```

---

## 📡 API

### `GET /api/analysis`

최근 N일간의 관보 데이터를 분석하여 반환합니다.

**쿼리 파라미터:**

| 파라미터 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `days` | number | `60` | 분석할 최근 일수 |

**응답 예시:**

```json
{
  "meta": {
    "totalDocs": 128403,
    "dateRange": ["2020-01-02", "2026-04-19"]
  },
  "analysis": {
    "stats": {
      "totalDocuments": 5408,
      "avgPerDay": 90,
      "mostActiveCategory": "중앙부처",
      "topInstitution": "국토교통부"
    },
    "monthlyTrend": [{ "date": "2020-01", "count": 3200 }, ...],
    "categoryDistribution": [{ "category": "중앙부처", "count": 108862 }, ...],
    "categoryTrends": [{ "category": "중앙부처", "data": [...] }, ...],
    "topInstitutions": [{ "name": "국토교통부", "count": 15405, "category": "중앙부처" }, ...],
    "keywordTrends": [{ "keyword": "환경", "count": 42, "trend": "up", "recentCount": 28, "prevCount": 14 }, ...],
    "recentDocuments": [{ "n": "1", "inst": "국토교통부", "title": "...", "date": "2026-04-19" }, ...]
  },
  "fetchedDays": 60,
  "fetchedDocuments": 5408
}
```

**캐시:** `s-maxage=600` (10분), `stale-while-revalidate=1200` (20분)

---

## 📊 데이터 소스

데이터는 [ai-readable-gazette-kr](https://hosungseo.github.io/ai-readable-gazette-kr/)의 정적 JSON 파일에서 가져옵니다.

```
https://hosungseo.github.io/ai-readable-gazette-kr/data/
├── meta.json                    # 전체 메타데이터 (히트맵, 기관 목록, 날짜 목록)
└── dates/
    ├── 2020-01-02.json          # 날짜별 공시 문서 배열
    ├── 2020-01-03.json
    └── ...
```

**데이터 파이프라인:**

```
행정안전부 전자관보 → opendataloader OCR → 사전 보정 코퍼스 (CC0) → 이 프로젝트
```

> ⚠️ 공식 활용 시 반드시 [원본 PDF](https://gwanbo.go.kr)를 함께 확인해야 합니다.

---

## 🎨 디자인 철학

- **에디토리얼 스타일**: AI 느낌을 배제하고 저널/문서 스타일의 깔끔한 디자인
- **Stone 색상 팔레트**: `stone-50` ~ `stone-900` 기반, 액센트 컬러로 `amber-800`
- **반응형**: 모바일(`sm:`) / 태블릿(`md:`) / 데스크톱(`lg:`) 브레이크포인트 지원
- **한국어 최적화**: Noto Sans KR, Apple SD Gothic Neo 폰트 체인

---

## 📝 라이선스

MIT
