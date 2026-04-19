import { GazetteDocument, AnalysisResult, KeywordFrequency, InstitutionStat } from './types';

const KEYWORD_CATEGORIES: Record<string, string[]> = {
  'AI & 디지털': ['인공지능', 'AI', '디지털', '데이터', '클라우드', '반도체', '소프트웨어', '정보통신', '로봇', '메타버스', '블록체인', '5G', '스마트', '알고리즘', '플랫폼'],
  '경제 & 금융': ['경제', '금융', '투자', '산업', '기업', '수출', '수입', '무역', '주식', '은행', '보험', '자본', '시장', '거래', '증권', '펀드', '벤처', '스타트업'],
  '환경 & 에너지': ['환경', '에너지', '탄소', '재생에너지', '기후', '탄소중립', '온실가스', '태양광', '풍력', '수소', '전력', '발전', '폐기물', '자원', '녹색'],
  '보건 & 복지': ['보건', '복지', '의료', '건강', '약', '치료', '환자', '병원', '요양', '장애인', '노인', '아동', '보육', '출산', '위생'],
  '교육 & 연구': ['교육', '학교', '대학', '연구', '학술', '과학', '기술', '연구개발', 'R&D', '장학', '교원', '학생', '교과', '교육과정'],
  '국방 & 안보': ['국방', '군', '안보', '무기', '방위', '군사', '전력', '작전', '병력', '해군', '공군', '육군', '훈련', '방산'],
  '인프라 & 건설': ['건설', '인프라', '교통', '도로', '철도', '공항', '항만', '주택', '건축', '토지', '도시', '교량', '터널', '공사'],
  '법제 & 규제': ['법', '규제', '개정', '제정', '폐지', '조례', '령', '규칙', '고시', '지침', '기준', '허가', '인가', '승인', '처벌', '과태료'],
};

export function analyzeTrend(documents: GazetteDocument[]): AnalysisResult {
  // Monthly trend
  const monthlyBuckets: Record<string, number> = {};
  documents.forEach(doc => {
    const month = doc.date.substring(0, 7);
    monthlyBuckets[month] = (monthlyBuckets[month] || 0) + 1;
  });
  
  const monthlyTrend = Object.entries(monthlyBuckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  // Category distribution from publisher patterns
  const categoryMap: Record<string, number> = {};
  documents.forEach(doc => {
    const cat = guessCategory(doc.publisher);
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });

  const categoryDistribution = Object.entries(categoryMap)
    .sort(([, a], [, b]) => b - a)
    .map(([category, count]) => ({ category, count }));

  // Category monthly trends
  const categoryMonthly: Record<string, Record<string, number>> = {};
  documents.forEach(doc => {
    const cat = guessCategory(doc.publisher);
    const month = doc.date.substring(0, 7);
    if (!categoryMonthly[cat]) categoryMonthly[cat] = {};
    categoryMonthly[cat][month] = (categoryMonthly[cat][month] || 0) + 1;
  });

  const categoryTrends = Object.entries(categoryMonthly)
    .map(([category, months]) => ({
      category,
      data: Object.entries(months)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count })),
    }))
    .sort((a, b) => {
      const aTotal = a.data.reduce((s, d) => s + d.count, 0);
      const bTotal = b.data.reduce((s, d) => s + d.count, 0);
      return bTotal - aTotal;
    })
    .slice(0, 8);

  // Top institutions
  const institutionMap: Record<string, { count: number; category: string }> = {};
  documents.forEach(doc => {
    if (!institutionMap[doc.publisher]) {
      institutionMap[doc.publisher] = { count: 0, category: guessCategory(doc.publisher) };
    }
    institutionMap[doc.publisher].count++;
  });

  const topInstitutions: InstitutionStat[] = Object.entries(institutionMap)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 20)
    .map(([name, { count, category }]) => ({ name, count, category }));

  // Keyword analysis
  const keywordCounts: Record<string, number> = {};
  const keywordRecent: Record<string, number> = {};
  const keywordPrev: Record<string, number> = {};

  const sortedDates = [...new Set(documents.map(d => d.date))].sort();
  const midPoint = Math.floor(sortedDates.length / 2);
  const recentDates = new Set(sortedDates.slice(midPoint));
  const prevDates = new Set(sortedDates.slice(0, midPoint));

  documents.forEach(doc => {
    const text = `${doc.title} ${doc.publisher}`.toLowerCase();
    for (const [group, keywords] of Object.entries(KEYWORD_CATEGORIES)) {
      for (const kw of keywords) {
        if (text.includes(kw.toLowerCase())) {
          keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
          if (recentDates.has(doc.date)) {
            keywordRecent[kw] = (keywordRecent[kw] || 0) + 1;
          }
          if (prevDates.has(doc.date)) {
            keywordPrev[kw] = (keywordPrev[kw] || 0) + 1;
          }
        }
      }
    }
  });

  const keywordTrends: KeywordFrequency[] = Object.entries(keywordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 30)
    .map(([keyword, count]) => {
      const recentCount = keywordRecent[keyword] || 0;
      const prevCount = keywordPrev[keyword] || 0;
      const ratio = prevCount > 0 ? recentCount / prevCount : recentCount > 0 ? 2 : 0;
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (ratio > 1.2) trend = 'up';
      else if (ratio < 0.8) trend = 'down';
      return { keyword, count, trend, recentCount, prevCount };
    });

  // Stats
  const totalDocuments = documents.length;
  const dateRange: [string, string] = [
    documents.reduce((min, d) => d.date < min ? d.date : min, documents[0]?.date || ''),
    documents.reduce((max, d) => d.date > max ? d.date : max, documents[0]?.date || ''),
  ];
  
  const uniqueDays = new Set(documents.map(d => d.date)).size;
  const avgPerDay = uniqueDays > 0 ? Math.round(totalDocuments / uniqueDays) : 0;
  
  const mostActiveCategory = categoryDistribution[0]?.category || '-';
  const topInstitution = topInstitutions[0]?.name || '-';

  const recentDocuments = documents
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 50);

  return {
    monthlyTrend,
    categoryDistribution,
    categoryTrends,
    topInstitutions,
    keywordTrends,
    recentDocuments,
    stats: {
      totalDocuments,
      dateRange,
      avgPerDay,
      mostActiveCategory,
      topInstitution,
    },
  };
}

function guessCategory(publisher: string): string {
  const p = publisher.toLowerCase();
  if (p.includes('법원') || p.includes('검찰') || p.includes('대법') || p.includes('법무')) return '사법';
  if (p.includes('교육') || p.includes('대학') || p.includes('학교') || p.includes('교육청')) return '교육';
  if (p.includes('시') || p.includes('군') || p.includes('구') || p.includes('도')) return '지자체';
  if (p.includes('국회') || p.includes('입법')) return '입법';
  if (p.includes('공사') || p.includes('공단') || p.includes('원') || p.includes('센터')) return '공공기관';
  return '중앙부처';
}

export { KEYWORD_CATEGORIES };
