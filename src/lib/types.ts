export interface GazetteDocument {
  n: string;
  inst: string;
  title: string;
  date: string;
  file?: string;
  raw?: string;
  blob?: string;
}

export interface MetaData {
  version: string;
  total_docs: number;
  date_range: [string, string];
  date_count: number;
  institution_count: number;
  dates: { date: string; count: number }[];
  institutions: { name: string; count: number; cat: string }[];
  heatmap: { ym: string; count: number }[];
  category_order: string[];
  raw_base: string;
  blob_base: string;
  repo_url: string;
}

export interface DateGroupResponse {
  date: string;
  docs: GazetteDocument[];
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
