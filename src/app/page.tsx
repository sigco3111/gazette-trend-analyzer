'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Area, AreaChart, LineChart, Line,
} from 'recharts';
import type { AnalysisResult, GazetteDocument } from '@/lib/types';

interface ApiResponse {
  meta: { totalDocs: number; dateRange: [string, string] };
  analysis: AnalysisResult;
  fetchedDays: number;
  fetchedDocuments: number;
}

const COLORS = [
  '#1e40af', '#b45309', '#15803d', '#9f1239',
  '#6d28d9', '#0e7490', '#c2410c', '#4338ca',
];

function formatNumber(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + '만';
  if (n >= 1000) return (n / 1000).toFixed(1) + '천';
  return n.toLocaleString();
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${y.slice(2)}.${m}.${d}`;
}

function formatMonth(monthStr: string): string {
  const [y, m] = monthStr.split('-');
  return `${y.slice(2)}.${m}`;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-stone-200 rounded-lg shadow-lg px-3 py-2 text-sm max-w-[220px]">
      <div className="text-xs text-stone-400 mb-1">{label}</div>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
          <span className="text-stone-600 text-xs">{entry.name}: <strong>{entry.value.toLocaleString()}</strong></span>
        </div>
      ))}
    </div>
  );
}

function TrendBadge({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  const styles = {
    up: 'bg-green-50 text-green-700',
    down: 'bg-red-50 text-red-700',
    stable: 'bg-stone-100 text-stone-600',
  };
  const labels = { up: '↑ 증가', down: '↓ 감소', stable: '— 유지' };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap ${styles[trend]}`}>
      {labels[trend]}
    </span>
  );
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5 sm:mb-6">
      <h2 className="text-base sm:text-lg font-semibold text-stone-900 leading-relaxed">{title}</h2>
      {sub && <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">{sub}</p>}
    </div>
  );
}

function DocumentItem({ doc }: { doc: GazetteDocument }) {
  return (
    <div className="flex gap-2 sm:gap-3 py-3.5 border-b border-stone-100 last:border-b-0">
      <span className="text-[11px] text-stone-400 font-mono whitespace-nowrap pt-0.5">{formatDate(doc.date)}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-stone-800 leading-relaxed line-clamp-2 sm:line-clamp-1">{doc.title}</div>
        <div className="text-[11px] text-stone-400 mt-1">{doc.inst}</div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-stone-200 rounded-lg" />)}
      </div>
      <div className="h-72 bg-stone-200 rounded-lg" />
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        <div className="h-64 bg-stone-200 rounded-lg" />
        <div className="h-64 bg-stone-200 rounded-lg" />
      </div>
    </div>
  );
}

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

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900">

      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="container-main py-5 sm:py-6">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-7 h-7 rounded bg-amber-800 flex items-center justify-center text-white text-xs font-bold shrink-0">관</div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate">관보 트렌드</h1>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-500">
                대한민국 관보 {data?.meta.totalDocs?.toLocaleString() ?? '128,403'}건 기반 정책 흐름 분석
                {data && <span className="text-stone-400"> · 최근 {data.fetchedDays}일 · {data.fetchedDocuments.toLocaleString()}건</span>}
              </p>
            </div>
            <a href="https://hosungseo.github.io/ai-readable-gazette-kr/" target="_blank" rel="noopener"
               className="text-[11px] text-stone-400 hover:text-amber-800 transition-colors hidden sm:block whitespace-nowrap">
              데이터 출처 ↗
            </a>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="container-main">
          <div className="flex gap-1 overflow-x-auto -mb-px scrollbar-none">
            {([
              ['overview', '개요'],
              ['keywords', '키워드'],
              ['institutions', '기관'],
            ] as const).map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`py-3 px-4 sm:px-5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${tab === key ? 'border-amber-800 text-amber-900' : 'border-transparent text-stone-500 hover:text-stone-700'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container-main py-10 sm:py-14">
        {loading && <Skeleton />}

        {error && (
          <div className="text-center py-20">
            <p className="text-stone-600">데이터를 불러오지 못했습니다</p>
            <p className="text-sm text-stone-400 mt-1">{error}</p>
            <button onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 text-sm bg-stone-200 rounded hover:bg-stone-300 transition-colors">다시 시도</button>
          </div>
        )}

        {a && !loading && (
          <div className="space-y-12 sm:space-y-16">

            {/* ═══ OVERVIEW ═══ */}
            {tab === 'overview' && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                  <div className="bg-white rounded-lg border border-stone-200 p-4 sm:p-5">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-stone-400 mb-1.5">분석 문서</div>
                    <div className="text-lg sm:text-xl font-semibold font-mono">{a.stats.totalDocuments.toLocaleString()}</div>
                    <div className="text-[11px] text-stone-400 mt-1">최근 {data?.fetchedDays}일</div>
                  </div>
                  <div className="bg-white rounded-lg border border-stone-200 p-4 sm:p-5">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-stone-400 mb-1.5">일평균 공시</div>
                    <div className="text-lg sm:text-xl font-semibold font-mono text-amber-800">{a.stats.avgPerDay.toLocaleString()}</div>
                    <div className="text-[11px] text-stone-400 mt-1">건/일</div>
                  </div>
                  <div className="bg-white rounded-lg border border-stone-200 p-4 sm:p-5">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-stone-400 mb-1.5">가장 활발한 분야</div>
                    <div className="text-lg sm:text-xl font-semibold truncate">{a.stats.mostActiveCategory}</div>
                    <div className="text-[11px] text-stone-400 mt-1">{a.categoryDistribution[0]?.count?.toLocaleString()}건</div>
                  </div>
                  <div className="bg-white rounded-lg border border-stone-200 p-4 sm:p-5">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-stone-400 mb-1.5">최다 공시 기관</div>
                    <div className="text-lg sm:text-xl font-semibold text-blue-900 truncate">{a.stats.topInstitution}</div>
                    <div className="text-[11px] text-stone-400 mt-1">{a.topInstitutions[0]?.count?.toLocaleString()}건</div>
                  </div>
                </div>

                {/* Monthly Trend */}
                <section>
                  <SectionTitle title="월별 공시 추이" sub="2020년 ~ 2026년 전체 관보 발행 추이" />
                  <div className="bg-white rounded-lg border border-stone-200 p-4 sm:p-6">
                    <div className="min-w-0">
                      <ResponsiveContainer width="100%" height={280} className="min-w-0">
                        <AreaChart data={a.monthlyTrend} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#b45309" stopOpacity={0.12} />
                              <stop offset="95%" stopColor="#b45309" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                          <XAxis dataKey="date" tickFormatter={formatMonth} tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={{ stroke: '#e7e5e4' }} tickLine={false} interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} tickFormatter={formatNumber} width={45} />
                          <Tooltip content={<ChartTooltip />} />
                          <Area type="monotone" dataKey="count" stroke="#b45309" strokeWidth={2} fill="url(#areaGrad)" name="공시 건수" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </section>

                {/* Two column */}
                <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
                  <section>
                    <SectionTitle title="분야별 분포" sub="기관 분류 기준 전체 공시 비중" />
                    <div className="bg-white rounded-lg border border-stone-200 p-4 sm:p-6">
                      <ResponsiveContainer width="100%" height={270}>
                        <BarChart data={a.categoryDistribution} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} tickFormatter={formatNumber} />
                          <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: '#57534e' }} axisLine={false} tickLine={false} width={50} />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="count" radius={[0, 4, 4, 0]} name="건수">
                            {a.categoryDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </section>

                  <section>
                    <SectionTitle title="분야별 월별 추이" sub={`최근 ${data?.fetchedDays}일 기준`} />
                    <div className="bg-white rounded-lg border border-stone-200 p-4 sm:p-6">
                      <ResponsiveContainer width="100%" height={270}>
                        <LineChart margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                          <XAxis dataKey="date" tickFormatter={formatMonth} tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={{ stroke: '#e7e5e4' }} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} tickFormatter={formatNumber} width={45} />
                          <Tooltip content={<ChartTooltip />} />
                          {a.categoryTrends.slice(0, 5).map((ct, i) => (
                            <Line key={ct.category} type="monotone" data={ct.data} dataKey="count" name={ct.category}
                              stroke={COLORS[i]} strokeWidth={1.5} dot={false} connectNulls />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap gap-x-4 sm:gap-x-5 gap-y-1.5 mt-3">
                        {a.categoryTrends.slice(0, 5).map((ct, i) => (
                          <div key={ct.category} className="flex items-center gap-1.5 text-[11px] text-stone-500">
                            <div className="w-3 h-0.5 rounded shrink-0" style={{ background: COLORS[i] }} /> {ct.category}
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>

                {/* Recent docs */}
                <section>
                  <SectionTitle title="최근 공시" sub={`최근 ${Math.min(20, a.recentDocuments.length)}건`} />
                  <div className="bg-white rounded-lg border border-stone-200 px-4 sm:px-5">
                    {a.recentDocuments.slice(0, 20).map((doc, i) => (
                      <DocumentItem key={`${doc.date}-${doc.n || i}`} doc={doc} />
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* ═══ KEYWORDS ═══ */}
            {tab === 'keywords' && (
              <>
                <section>
                  <SectionTitle title="핵심 키워드 빈도" sub={`최근 ${data?.fetchedDays}일 관보에서 가장 많이 등장한 정책 키워드 TOP 30`} />
                  <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
                    <div className="overflow-x-auto -mx-0">
                      <table className="w-full text-sm min-w-[480px]">
                        <thead>
                          <tr className="border-b border-stone-200 bg-stone-50/50">
                            <th className="text-left text-[10px] font-medium text-stone-400 uppercase tracking-wider px-4 sm:px-5 py-3 w-10">#</th>
                            <th className="text-left text-[10px] font-medium text-stone-400 uppercase tracking-wider px-4 sm:px-5 py-3">키워드</th>
                            <th className="text-right text-[10px] font-medium text-stone-400 uppercase tracking-wider px-4 sm:px-5 py-3 w-16">빈도</th>
                            <th className="text-right text-[10px] font-medium text-stone-400 uppercase tracking-wider px-4 sm:px-5 py-3 w-14 hidden sm:table-cell">최근</th>
                            <th className="text-right text-[10px] font-medium text-stone-400 uppercase tracking-wider px-4 sm:px-5 py-3 w-14 hidden sm:table-cell">이전</th>
                            <th className="text-center text-[10px] font-medium text-stone-400 uppercase tracking-wider px-4 sm:px-5 py-3 w-[72px]">추세</th>
                          </tr>
                        </thead>
                        <tbody>
                          {a.keywordTrends.map((kw, i) => (
                            <tr key={kw.keyword} className="border-b border-stone-50 hover:bg-stone-50/50">
                              <td className="px-4 sm:px-5 py-3 font-mono text-stone-400 text-xs">{i + 1}</td>
                              <td className="px-4 sm:px-5 py-3">
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <span className="font-medium text-stone-800 text-sm leading-relaxed">{kw.keyword}</span>
                                  <div className="hidden md:block flex-1 max-w-[120px] h-1 bg-stone-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-700/60 rounded-full" style={{ width: `${(kw.count / a.keywordTrends[0].count) * 100}%` }} />
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 sm:px-5 py-3 text-right font-mono text-stone-600 text-sm">{kw.count}</td>
                              <td className="px-4 sm:px-5 py-3 text-right font-mono text-stone-500 text-sm hidden sm:table-cell">{kw.recentCount}</td>
                              <td className="px-4 sm:px-5 py-3 text-right font-mono text-stone-400 text-sm hidden sm:table-cell">{kw.prevCount}</td>
                              <td className="px-4 sm:px-5 py-3 text-center"><TrendBadge trend={kw.trend} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                <section>
                  <SectionTitle title="키워드 빈도 분포" sub="상위 20개 · 색상 = 추세" />
                  <div className="bg-white rounded-lg border border-stone-200 p-4 sm:p-6">
                    <ResponsiveContainer width="100%" height={380}>
                      <BarChart data={a.keywordTrends.slice(0, 20)} layout="vertical" margin={{ top: 0, right: 10, left: 5, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="keyword" tick={{ fontSize: 11, fill: '#57534e' }} axisLine={false} tickLine={false} width={70} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="count" radius={[0, 3, 3, 0]} name="빈도">
                          {a.keywordTrends.slice(0, 20).map(kw => (
                            <Cell key={kw.keyword} fill={kw.trend === 'up' ? '#15803d' : kw.trend === 'down' ? '#b91c1c' : '#a8a29e'} fillOpacity={0.7} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="flex gap-5 sm:gap-6 mt-4 text-[11px] text-stone-500">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-700/70" /> 증가</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-700/70" /> 감소</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-stone-400/70" /> 유지</span>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* ═══ INSTITUTIONS ═══ */}
            {tab === 'institutions' && (
              <>
                <section>
                  <SectionTitle title="기관별 공시 순위" sub="전체 코퍼스 기준 TOP 20" />
                  <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-[500px]">
                        <thead>
                          <tr className="border-b border-stone-200 bg-stone-50/50">
                            <th className="text-left text-[10px] font-medium text-stone-400 uppercase tracking-wider px-4 sm:px-5 py-3 w-10">#</th>
                            <th className="text-left text-[10px] font-medium text-stone-400 uppercase tracking-wider px-4 sm:px-5 py-3">기관명</th>
                            <th className="text-left text-[10px] font-medium text-stone-400 uppercase tracking-wider px-4 sm:px-5 py-3 w-20">분류</th>
                            <th className="text-right text-[10px] font-medium text-stone-400 uppercase tracking-wider px-4 sm:px-5 py-3 w-20">공시 건수</th>
                            <th className="text-right text-[10px] font-medium text-stone-400 uppercase tracking-wider px-4 sm:px-5 py-3 w-16 hidden sm:table-cell">비중</th>
                          </tr>
                        </thead>
                        <tbody>
                          {a.topInstitutions.map((inst, i) => (
                            <tr key={inst.name} className="border-b border-stone-50 hover:bg-stone-50/50">
                              <td className="px-4 sm:px-5 py-3 font-mono text-stone-400 text-xs">{i + 1}</td>
                              <td className="px-4 sm:px-5 py-3 font-medium text-stone-800 text-sm leading-relaxed">{inst.name}</td>
                              <td className="px-4 sm:px-5 py-3">
                                <span className="inline-block px-2 sm:px-2.5 py-0.5 rounded text-[11px] bg-stone-100 text-stone-600 whitespace-nowrap">{inst.category}</span>
                              </td>
                              <td className="px-4 sm:px-5 py-3 text-right font-mono text-stone-600 text-sm">{inst.count.toLocaleString()}</td>
                              <td className="px-4 sm:px-5 py-3 text-right hidden sm:table-cell">
                                <span className="font-mono text-stone-400 text-xs">{((inst.count / data!.meta.totalDocs) * 100).toFixed(1)}%</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                <section>
                  <SectionTitle title="기관 분류별 비중" sub="전체 128,403건 기준" />
                  <div className="bg-white rounded-lg border border-stone-200 p-4 sm:p-6">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={a.categoryDistribution} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                        <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#57534e' }} axisLine={{ stroke: '#e7e5e4' }} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} tickFormatter={formatNumber} width={45} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]} name="건수">
                          {a.categoryDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* Top 5 institutions trend */}
                <section>
                  <SectionTitle title="주요 기관 공시 추이" sub={`최근 ${data?.fetchedDays}일 기준 TOP 5 기관`} />
                  <div className="bg-white rounded-lg border border-stone-200 p-4 sm:p-6">
                    <TopInstitutionTrendChart documents={a.recentDocuments} topInstitutions={a.topInstitutions.slice(0, 5)} />
                    <div className="flex flex-wrap gap-x-4 sm:gap-x-5 gap-y-1.5 mt-3">
                      {a.topInstitutions.slice(0, 5).map((inst, i) => (
                        <div key={inst.name} className="flex items-center gap-1.5 text-[11px] text-stone-500">
                          <div className="w-3 h-0.5 rounded shrink-0" style={{ background: COLORS[i] }} />
                          {inst.name.length > 14 ? inst.name.slice(0, 14) + '…' : inst.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white mt-12 sm:mt-16">
        <div className="container-main py-6 sm:py-8 text-[11px] sm:text-xs text-stone-400">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div>
              <p>데이터: 행정안전부 전자관보 → opendataloader OCR → 사전 보정 코퍼스 (CC0)</p>
              <p className="mt-0.5">공식 활용 시 반드시 <a href="https://gwanbo.go.kr" target="_blank" rel="noopener" className="text-amber-800 hover:underline">원본 PDF</a>를 함께 확인해야 합니다</p>
            </div>
            <div className="sm:text-right">
              <a href="https://github.com/sigco3111/gazette-trend-analyzer" target="_blank" rel="noopener" className="hover:underline">GitHub ↗</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function TopInstitutionTrendChart({ documents, topInstitutions }: { documents: GazetteDocument[]; topInstitutions: { name: string }[] }) {
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
      <AreaChart data={seriesData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
        <defs>
          {topInstitutions.map((_, i) => (
            <linearGradient key={i} id={`instGrad${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS[i]} stopOpacity={0.12} />
              <stop offset="95%" stopColor={COLORS[i]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
        <XAxis dataKey="date" tickFormatter={formatMonth} tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={{ stroke: '#e7e5e4' }} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} width={45} />
        <Tooltip content={<ChartTooltip />} />
        {topInstitutions.map((inst, i) => (
          <Area key={inst.name} type="monotone" data={seriesData} dataKey={inst.name}
            stroke={COLORS[i]} strokeWidth={1.5} fill={`url(#instGrad${i})`} dot={false} connectNulls name={inst.name} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
