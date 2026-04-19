export interface GazetteDocument {
  id: string;
  title: string;
  publisher: string;
  date: string;
  category?: string;
}

export interface DateGroupData {
  date: string;
  documents: GazetteDocument[];
}

export interface MetaData {
  total_docs: number;
  date_range: [string, string];
  categories: Record<string, { count: number; institutions: string[] }>;
  heatmap: Record<string, number>;
}

export interface TrendDataPoint {
  date: string;
  count: number;
}

export interface CategoryTrend {
  category: string;
  data: TrendDataPoint[];
}

export interface KeywordFrequency {
  keyword: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  recentCount: number;
  prevCount: number;
}

export interface InstitutionStat {
  name: string;
  count: number;
  category: string;
}

export interface AnalysisResult {
  monthlyTrend: TrendDataPoint[];
  categoryDistribution: { category: string; count: number }[];
  categoryTrends: CategoryTrend[];
  topInstitutions: InstitutionStat[];
  keywordTrends: KeywordFrequency[];
  recentDocuments: GazetteDocument[];
  stats: {
    totalDocuments: number;
    dateRange: [string, string];
    avgPerDay: number;
    mostActiveCategory: string;
    topInstitution: string;
  };
}
