'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Area, AreaChart, LineChart, Line,
} from 'recharts';
import type { AnalysisResult, GazetteDocument } from '@/lib/types';

/* ═══════════════════════════════════════════
   Types
   ═══════════════════════════════════════════ */

interface ApiResponse {
  meta: { totalDocs: number; dateRange: [string, string] };
  analysis: AnalysisResult;
  fetchedDays: number;
  fetchedDocuments: number;
}

/* ═══════════════════════════════════════════
   Design Tokens
   ═══════════════════════════════════════════ */

const PALETTE = [
  '#1A1A18', '#C2410C', '#15803D', '#7C3AED',
  '#0369A1', '#A16207', '#BE123C', '#4338CA',
];

/* ═══════════════════════════════════════════
   Formatters
   ═══════════════════════════════════════════ */

function fmtNum(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + '만';
  if (n >= 1000) return (n / 1000).toFixed(1) + '천';
  return n.toLocaleString();
}

function fmtDate(d: string): string {
  const [y, m, day] = d.split('-');
  return `${y.slice(2)}.${m}.${day}`;
}

function fmtMonth(m: string): string {
  const [y, mo] = m.split('-');
  return `${y.slice(2)}.${mo}`;
}

/* ═══════════════════════════════════════════
   Chart Tooltip
   ═══════════════════════════════════════════ */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="text-[10px] text-[var(--color-ink-muted)] mb-1">{label}</div>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: entry.color }} />
          <span className="text-[var(--color-ink-secondary)]">
            {entry.name}: <strong className="text-[var(--color-ink)]">{entry.value.toLocaleString()}</strong>
          </span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Trend Badge
   ═══════════════════════════════════════════ */

function TrendBadge({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  const cfg: Record<string, { cls: string; label: string }> = {
    up:     { cls: 'badge-positive', label: '▲ 증가' },
    down:   { cls: 'badge-negative', label: '▼ 감소' },
    stable: { cls: 'badge-neutral',  label: '━ 유지' },
  };
  const { cls, label } = cfg[trend];
  return <span className={`badge ${cls}`}>{label}</span>;
}

/* ═══════════════════════════════════════════
   Section Header
   ═══════════════════════════════════════════ */

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4 sm:mb-5">
        <h2 className="text-[var(--text-heading)] font-semibold text-[var(--color-ink)]">{title}</h2>
        {sub && <p className="text-[var(--text-caption)] text-[var(--color-ink-muted)] mt-1 leading-relaxed">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

/* ═══════════════════════════════════════════
   Document Row
   ═══════════════════════════════════════════ */

function DocRow({ doc }: { doc: GazetteDocument }) {
  return (
    <div className="flex gap-3 py-3 border-b border-[var(--color-border)] last:border-b-0">
      <time className="text-[var(--text-caption)] text-[var(--color-ink-muted)] font-mono whitespace-nowrap pt-px">
        {fmtDate(doc.date)}
      </time>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--color-ink)] leading-relaxed line-clamp-2 sm:line-clamp-1">{doc.title}</p>
        <p className="text-[var(--text-caption)] text-[var(--color-ink-muted)] mt-0.5">{doc.inst}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Skeleton
   ═══════════════════════════════════════════ */

function Skeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-24" />
        ))}
      </div>
      <div className="skeleton h-72" />
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        <div className="skeleton h-64" />
        <div className="skeleton h-64" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Top Institution Trend Chart
   ═══════════════════════════════════════════ */

function TopInstitutionTrendChart({
  documents,
  topInstitutions,
}: {
  documents: GazetteDocument[];
  topInstitutions: { name: string }[];
}) {
  const topNames = new Set(topInstitutions.map(t => t.name));
  const monthlyMap: Record<string, Record<string, number>> = {};

  documents.forEach(doc => {
    if (!topNames.has(doc.inst)) return;
    const month = doc.date.substring(0, 7);
    if (!monthlyMap[doc.inst]) monthlyMap[doc.inst] = {};
    monthlyMap[doc.inst][month] = (monthlyMap[doc.inst][month] || 0) + 1;
  });

  const allMonths = [...new Set(documents.map(d => d.date.substring(0, 7)))].sort();
  const seriesData = allMonths.map(month => {
    const point: Record<string, string | number> = { date: month };
    topInstitutions.forEach(inst => {
      point[inst.name] = monthlyMap[inst.name]?.[month] || 0;
    });
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={seriesData} margin={{ top: 10, right: 5, left: -10, bottom: 5 }}>
        <defs>
          {topInstitutions.map((_, i) => (
            <linearGradient key={i} id={`instGrad${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={PALETTE[i]} stopOpacity={0.08} />
              <stop offset="95%" stopColor={PALETTE[i]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="date" tickFormatter={fmtMonth} tick={{ fontSize: 10, fill: 'var(--color-ink-muted)' }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: 'var(--color-ink-muted)' }} axisLine={false} tickLine={false} width={45} />
        <Tooltip content={<ChartTooltip />} />
        {topInstitutions.map((inst, i) => (
          <Area key={inst.name} type="monotone" data={seriesData} dataKey={inst.name}
            stroke={PALETTE[i]} strokeWidth={1.5} fill={`url(#instGrad${i})`} dot={false} connectNulls name={inst.name} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ═══════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════ */

export default function Home() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'overview' | 'keywords' | 'institutions'>('overview');

  useEffect(() => {
    fetch('/api/analysis?days=60')
      .then(res => { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
      .then(json => { if (json.error) throw new Error(json.error); setData(json); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const a = data?.analysis;
  const tabs = [['overview', '개요'], ['keywords', '키워드'], ['institutions', '기관']] as const;

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-ink)]">

      {/* ──── Header ──── */}
      <header className="bg-[var(--color-surface-raised)] border-b border-[var(--color-border)]">
        <div className="container-main py-4 sm:py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'var(--color-accent)' }}
                >
                  <span className="text-white text-sm font-bold" style={{ fontFamily: 'var(--font-serif)' }}>關</span>
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-bold tracking-tight">관보 트렌드</h1>
                  <p className="text-[var(--text-caption)] text-[var(--color-ink-muted)] leading-relaxed hidden sm:block">
                    {data?.meta.totalDocs?.toLocaleString() ?? '128,403'}건 기반 정책 흐름 분석
                    {data && (
                      <span className="ml-1">
                        · 최근 {data.fetchedDays}일 · {data.fetchedDocuments.toLocaleString()}건
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <p className="text-[var(--text-caption)] text-[var(--color-ink-muted)] leading-relaxed sm:hidden mt-1 pl-[2.75rem]">
                {data?.meta.totalDocs?.toLocaleString() ?? '128,403'}건
              </p>
            </div>
            <a
              href="https://hosungseo.github.io/ai-readable-gazette-kr/"
              target="_blank"
              rel="noopener"
              className="text-[var(--text-caption)] text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] transition-colors hidden sm:block whitespace-nowrap"
            >
              데이터 출처 →
            </a>
          </div>
        </div>
      </header>

      {/* ──── Tab Navigation ──── */}
      <nav className="bg-[var(--color-surface-raised)] border-b border-[var(--color-border)] sticky top-0 z-10">
        <div className="container-main">
          <div className="flex gap-0.5 overflow-x-auto scrollbar-none -mb-px">
            {tabs.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`tab-item ${tab === key ? 'active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ──── Main Content ──── */}
      <main className="container-main py-8 sm:py-12">
        {loading && <Skeleton />}

        {error && (
          <div className="text-center py-20">
            <p className="text-[var(--color-ink-secondary)]">데이터를 불러오지 못했습니다</p>
            <p className="text-sm text-[var(--color-ink-muted)] mt-1">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 text-sm bg-[var(--color-surface-sunken)] rounded-lg hover:bg-[var(--color-border)] transition-colors"
            >
              다시 시도
            </button>
          </div>
        )}

        {a && !loading && (
          <div className="space-y-12 sm:space-y-16">

            {/* ══════ OVERVIEW ══════ */}
            {tab === 'overview' && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="stat-card">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-ink-muted)] mb-2">분석 문서</p>
                    <p className="text-xl sm:text-2xl font-bold font-mono tracking-tight">{a.stats.totalDocuments.toLocaleString()}</p>
                    <p className="text-[var(--text-caption)] text-[var(--color-ink-muted)] mt-1">최근 {data?.fetchedDays}일</p>
                  </div>
                  <div className="stat-card">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-ink-muted)] mb-2">일평균 공시</p>
                    <p className="text-xl sm:text-2xl font-bold font-mono tracking-tight" style={{ color: 'var(--color-accent)' }}>
                      {a.stats.avgPerDay.toLocaleString()}
                    </p>
                    <p className="text-[var(--text-caption)] text-[var(--color-ink-muted)] mt-1">건/일</p>
                  </div>
                  <div className="stat-card">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-ink-muted)] mb-2">가장 활발한 분야</p>
                    <p className="text-xl sm:text-2xl font-bold tracking-tight truncate">{a.stats.mostActiveCategory}</p>
                    <p className="text-[var(--text-caption)] text-[var(--color-ink-muted)] mt-1">{a.categoryDistribution[0]?.count?.toLocaleString()}건</p>
                  </div>
                  <div className="stat-card">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-ink-muted)] mb-2">최다 공시 기관</p>
                    <p className="text-xl sm:text-2xl font-bold tracking-tight truncate">{a.stats.topInstitution}</p>
                    <p className="text-[var(--text-caption)] text-[var(--color-ink-muted)] mt-1">{a.topInstitutions[0]?.count?.toLocaleString()}건</p>
                  </div>
                </div>

                {/* Monthly Trend */}
                <Section title="월별 공시 추이" sub="2020년 ~ 2026년 전체 관보 발행 추이">
                  <div className="card">
                    <div className="card-body">
                      <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={a.monthlyTrend} margin={{ top: 10, right: 5, left: -10, bottom: 5 }}>
                          <defs>
                            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.1} />
                              <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                          <XAxis dataKey="date" tickFormatter={fmtMonth} tick={{ fontSize: 10, fill: 'var(--color-ink-muted)' }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={false} interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize: 10, fill: 'var(--color-ink-muted)' }} axisLine={false} tickLine={false} tickFormatter={fmtNum} width={45} />
                          <Tooltip content={<ChartTooltip />} />
                          <Area type="monotone" dataKey="count" stroke="var(--color-accent)" strokeWidth={2} fill="url(#areaGrad)" name="공시 건수" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </Section>

                {/* Two Column */}
                <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
                  <Section title="분야별 분포" sub="기관 분류 기준 전체 공시 비중">
                    <div className="card">
                      <div className="card-body">
                        <ResponsiveContainer width="100%" height={270}>
                          <BarChart data={a.categoryDistribution} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--color-ink-muted)' }} axisLine={false} tickLine={false} tickFormatter={fmtNum} />
                            <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: 'var(--color-ink-secondary)' }} axisLine={false} tickLine={false} width={50} />
                            <Tooltip content={<ChartTooltip />} />
                            <Bar dataKey="count" radius={[0, 4, 4, 0]} name="건수">
                              {a.categoryDistribution.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </Section>

                  <Section title="분야별 월별 추이" sub={`최근 ${data?.fetchedDays}일 기준`}>
                    <div className="card">
                      <div className="card-body">
                        <ResponsiveContainer width="100%" height={270}>
                          <LineChart margin={{ top: 10, right: 5, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                            <XAxis dataKey="date" tickFormatter={fmtMonth} tick={{ fontSize: 10, fill: 'var(--color-ink-muted)' }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: 'var(--color-ink-muted)' }} axisLine={false} tickLine={false} tickFormatter={fmtNum} width={45} />
                            <Tooltip content={<ChartTooltip />} />
                            {a.categoryTrends.slice(0, 5).map((ct, i) => (
                              <Line key={ct.category} type="monotone" data={ct.data} dataKey="count" name={ct.category}
                                stroke={PALETTE[i]} strokeWidth={1.5} dot={false} connectNulls />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap gap-x-4 sm:gap-x-5 gap-y-1.5 mt-3 px-1">
                          {a.categoryTrends.slice(0, 5).map((ct, i) => (
                            <div key={ct.category} className="flex items-center gap-1.5 text-[var(--text-caption)] text-[var(--color-ink-muted)]">
                              <div className="w-3 h-[2px] rounded-full shrink-0" style={{ background: PALETTE[i] }} />
                              {ct.category}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Section>
                </div>

                {/* Recent Documents */}
                <Section title="최근 공시" sub={`최근 ${Math.min(20, a.recentDocuments.length)}건`}>
                  <div className="card">
                    <div className="card-body">
                      {a.recentDocuments.slice(0, 20).map((doc, i) => (
                        <DocRow key={`${doc.date}-${doc.n || i}`} doc={doc} />
                      ))}
                    </div>
                  </div>
                </Section>
              </>
            )}

            {/* ══════ KEYWORDS ══════ */}
            {tab === 'keywords' && (
              <>
                <Section title="핵심 키워드 빈도" sub={`최근 ${data?.fetchedDays}일 관보에서 가장 많이 등장한 정책 키워드 TOP 30`}>
                  <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="data-table min-w-[460px]">
                        <thead>
                          <tr>
                            <th className="w-10">#</th>
                            <th>키워드</th>
                            <th className="w-16 text-right">빈도</th>
                            <th className="w-14 text-right hidden sm:table-cell">최근</th>
                            <th className="w-14 text-right hidden sm:table-cell">이전</th>
                            <th className="w-[68px] text-center">추세</th>
                          </tr>
                        </thead>
                        <tbody>
                          {a.keywordTrends.map((kw, i) => (
                            <tr key={kw.keyword}>
                              <td className="font-mono text-[var(--color-ink-muted)]">{i + 1}</td>
                              <td>
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <span className="font-medium text-[var(--color-ink)]">{kw.keyword}</span>
                                  <div className="hidden md:block flex-1 max-w-[100px] h-1 bg-[var(--color-surface-sunken)] rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${(kw.count / a.keywordTrends[0].count) * 100}%`, background: 'var(--color-accent)', opacity: 0.5 }} />
                                  </div>
                                </div>
                              </td>
                              <td className="font-mono text-[var(--color-ink-secondary)]">{kw.count}</td>
                              <td className="font-mono text-[var(--color-ink-secondary)] hidden sm:table-cell">{kw.recentCount}</td>
                              <td className="font-mono text-[var(--color-ink-muted)] hidden sm:table-cell">{kw.prevCount}</td>
                              <td className="text-center"><TrendBadge trend={kw.trend} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Section>

                <Section title="키워드 빈도 분포" sub="상위 20개 · 색상 = 추세">
                  <div className="card">
                    <div className="card-body">
                      <ResponsiveContainer width="100%" height={380}>
                        <BarChart data={a.keywordTrends.slice(0, 20)} layout="vertical" margin={{ top: 0, right: 10, left: 5, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--color-ink-muted)' }} axisLine={false} tickLine={false} />
                          <YAxis type="category" dataKey="keyword" tick={{ fontSize: 11, fill: 'var(--color-ink-secondary)' }} axisLine={false} tickLine={false} width={70} />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="count" radius={[0, 3, 3, 0]} name="빈도">
                            {a.keywordTrends.slice(0, 20).map(kw => (
                              <Cell
                                key={kw.keyword}
                                fill={kw.trend === 'up' ? 'var(--color-positive)' : kw.trend === 'down' ? 'var(--color-negative)' : 'var(--color-ink-muted)'}
                                fillOpacity={0.65}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="flex gap-5 sm:gap-6 mt-4 text-[var(--text-caption)] text-[var(--color-ink-muted)]">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: 'var(--color-positive)', opacity: 0.65 }} /> 증가</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: 'var(--color-negative)', opacity: 0.65 }} /> 감소</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: 'var(--color-ink-muted)', opacity: 0.65 }} /> 유지</span>
                      </div>
                    </div>
                  </div>
                </Section>
              </>
            )}

            {/* ══════ INSTITUTIONS ══════ */}
            {tab === 'institutions' && (
              <>
                <Section title="기관별 공시 순위" sub="전체 코퍼스 기준 TOP 20">
                  <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="data-table min-w-[500px]">
                        <thead>
                          <tr>
                            <th className="w-10">#</th>
                            <th>기관명</th>
                            <th className="w-20">분류</th>
                            <th className="w-20 text-right">공시 건수</th>
                            <th className="w-16 text-right hidden sm:table-cell">비중</th>
                          </tr>
                        </thead>
                        <tbody>
                          {a.topInstitutions.map((inst, i) => (
                            <tr key={inst.name}>
                              <td className="font-mono text-[var(--color-ink-muted)]">{i + 1}</td>
                              <td className="font-medium text-[var(--color-ink)]">{inst.name}</td>
                              <td><span className="badge badge-tag">{inst.category}</span></td>
                              <td className="font-mono text-[var(--color-ink-secondary)]">{inst.count.toLocaleString()}</td>
                              <td className="font-mono text-[var(--color-ink-muted)] hidden sm:table-cell">
                                {((inst.count / data!.meta.totalDocs) * 100).toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Section>

                <Section title="기관 분류별 비중" sub="전체 128,403건 기준">
                  <div className="card">
                    <div className="card-body">
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={a.categoryDistribution} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                          <XAxis dataKey="category" tick={{ fontSize: 11, fill: 'var(--color-ink-secondary)' }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: 'var(--color-ink-muted)' }} axisLine={false} tickLine={false} tickFormatter={fmtNum} width={45} />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]} name="건수">
                            {a.categoryDistribution.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </Section>

                <Section title="주요 기관 공시 추이" sub={`최근 ${data?.fetchedDays}일 기준 TOP 5 기관`}>
                  <div className="card">
                    <div className="card-body">
                      <TopInstitutionTrendChart documents={a.recentDocuments} topInstitutions={a.topInstitutions.slice(0, 5)} />
                      <div className="flex flex-wrap gap-x-4 sm:gap-x-5 gap-y-1.5 mt-3 px-1">
                        {a.topInstitutions.slice(0, 5).map((inst, i) => (
                          <div key={inst.name} className="flex items-center gap-1.5 text-[var(--text-caption)] text-[var(--color-ink-muted)]">
                            <div className="w-3 h-[2px] rounded-full shrink-0" style={{ background: PALETTE[i] }} />
                            {inst.name.length > 14 ? inst.name.slice(0, 14) + '…' : inst.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Section>
              </>
            )}
          </div>
        )}
      </main>

      {/* ──── Footer ──── */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface-raised)] mt-10 sm:mt-14">
        <div className="container-main py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between gap-3 text-[var(--text-caption)] text-[var(--color-ink-muted)]">
            <div className="space-y-0.5">
              <p>데이터: 행정안전부 전자관보 → opendataloader OCR → 사전 보정 코퍼스 (CC0)</p>
              <p>
                공식 활용 시 반드시{' '}
                <a href="https://gwanbo.go.kr" target="_blank" rel="noopener" className="hover:underline" style={{ color: 'var(--color-accent)' }}>
                  원본 PDF
                </a>
                를 함께 확인해야 합니다
              </p>
            </div>
            <a href="https://github.com/sigco3111/gazette-trend-analyzer" target="_blank" rel="noopener" className="hover:underline sm:text-right whitespace-nowrap">
              GitHub →
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
