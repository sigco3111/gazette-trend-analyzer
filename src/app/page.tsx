'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Area, AreaChart, Treemap,
} from 'recharts';
import type { AnalysisResult } from '@/lib/types';

interface ApiResponse {
  meta: { totalDocs: number; dateRange: [string, string] };
  analysis: AnalysisResult;
  fetchedDays: number;
  fetchedDocuments: number;
}

// ─── Color palette ────────────────────────────────────────
const COLORS = [
  '#1e40af', '#b45309', '#15803d', '#9f1239',
  '#6d28d9', '#0e7490', '#c2410c', '#4338ca',
];

// ─── Utility ──────────────────────────────────────────────
function formatNumber(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + '만';
  if (n >= 1000) return (n / 1000).toFixed(1) + '천';
  return n.toLocaleString();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function formatMonth(monthStr: string): string {
  const [y, m] = monthStr.split('-');
  return `${y.slice(2)}.${m}`;
}

// ─── Components ───────────────────────────────────────────

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white rounded-lg border border-stone-200 p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-stone-400 mb-2">{label}</div>
      <div className="text-2xl font-semibold font-mono-data" style={{ color: accent || 'var(--text-primary)' }}>{value}</div>
      {sub && <div className="text-sm text-stone-500 mt-1">{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-serif font-semibold text-stone-900">{title}</h2>
      {subtitle && <p className="text-sm text-stone-500 mt-1">{subtitle}</p>}
      <div className="w-12 h-0.5 bg-amber-700 mt-3" />
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
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[trend]}`}>
      {labels[trend]}
    </span>
  );
}

function DocumentRow({ doc }: { doc: { title: string; publisher: string; date: string } }) {
  return (
    <div className="group flex items-start gap-3 py-3 border-b border-stone-100 last:border-0 hover:bg-stone-50 px-3 -mx-3 rounded transition-colors">
      <div className="text-xs text-stone-400 font-mono-data whitespace-nowrap pt-0.5">{formatDate(doc.date)}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-stone-800 group-hover:text-amber-900 transition-colors line-clamp-1">{doc.title}</div>
        <div className="text-xs text-stone-400 mt-0.5">{doc.publisher}</div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-stone-200 rounded-lg" />
        ))}
      </div>
      <div className="h-80 bg-stone-200 rounded-lg" />
      <div className="grid md:grid-cols-2 gap-6">
        <div className="h-72 bg-stone-200 rounded-lg" />
        <div className="h-72 bg-stone-200 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-stone-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <div className="font-mono-data text-xs text-stone-500 mb-1">{label}</div>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-stone-700">{entry.name}: <strong className="font-mono-data">{entry.value.toLocaleString()}</strong>건</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────

export default function Home() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'keywords' | 'institutions'>('overview');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/analysis?days=60');
        if (!res.ok) throw new Error('서버 오류');
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        setData(json);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const a = data?.analysis;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ─── Header ─────────────────────────────────── */}
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded bg-amber-700 flex items-center justify-center">
                  <span className="text-white text-sm font-bold font-serif">관</span>
                </div>
                <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">관보 트렌드</h1>
              </div>
              <p className="text-sm text-stone-500">
                대한민국 관보 {data?.meta.totalDocs?.toLocaleString() || '128,403'}건 기반 정책 흐름 분석
              </p>
            </div>
            <div className="text-right text-xs text-stone-400 hidden sm:block">
              <div>데이터 출처</div>
              <a href="https://hosungseo.github.io/ai-readable-gazette-kr/" target="_blank" rel="noopener" className="text-amber-700 hover:underline">
                ai-readable-gazette-kr
              </a>
              <div className="mt-1">최근 {data?.fetchedDays || 60}일 분석 · {data?.fetchedDocuments?.toLocaleString() || '—'}건 수집</div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Navigation ─────────────────────────────── */}
      <nav className="border-b border-stone-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-1">
            {[
              { key: 'overview' as const, label: '개요' },
              { key: 'keywords' as const, label: '키워드' },
              { key: 'institutions' as const, label: '기관' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-amber-700 text-amber-900'
                    : 'border-transparent text-stone-500 hover:text-stone-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ─── Content ────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading && <SkeletonGrid />}
        {error && (
          <div className="text-center py-20">
            <div className="text-lg font-serif text-stone-700">데이터를 불러오지 못했습니다</div>
            <div className="text-sm text-stone-500 mt-2">{error}</div>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-stone-200 rounded text-sm hover:bg-stone-300 transition-colors">
              다시 시도
            </button>
          </div>
        )}

        {a && !loading && (
          <div className="space-y-10">
            {/* ─── Overview Tab ──────────────────────── */}
            {activeTab === 'overview' && (
              <>
                {/* Stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    label="분석 문서"
                    value={a.stats.totalDocuments.toLocaleString()}
                    sub={`최근 ${data?.fetchedDays}일`}
                  />
                  <StatCard
                    label="일평균 공시"
                    value={a.stats.avgPerDay.toLocaleString()}
                    sub="건/일"
                    accent="var(--accent)"
                  />
                  <StatCard
                    label="가장 활발한 분야"
                    value={a.stats.mostActiveCategory}
                    sub={`${a.categoryDistribution[0]?.count?.toLocaleString() || 0}건`}
                  />
                  <StatCard
                    label="최다 공시 기관"
                    value={a.stats.topInstitution.length > 12 ? a.stats.topInstitution.slice(0, 12) + '…' : a.stats.topInstitution}
                    sub={`${a.topInstitutions[0]?.count?.toLocaleString() || 0}건`}
                    accent="var(--blue)"
                  />
                </div>

                {/* Monthly trend chart */}
                <section>
                  <SectionHeader
                    title="월별 공시 추이"
                    subtitle="관보 발행 건수의 월별 변화"
                  />
                  <div className="bg-white rounded-lg border border-stone-200 p-6">
                    <ResponsiveContainer width="100%" height={320}>
                      <AreaChart data={a.monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#b45309" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#b45309" stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatMonth}
                          tick={{ fontSize: 12, fill: '#a8a29e' }}
                          axisLine={{ stroke: '#e7e5e4' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#a8a29e' }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v: number) => formatNumber(v)}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="#b45309"
                          strokeWidth={2}
                          fill="url(#colorCount)"
                          name="공시 건수"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* Two-column: Category dist + Category trends */}
                <div className="grid md:grid-cols-2 gap-6">
                  <section>
                    <SectionHeader
                      title="분야별 분포"
                      subtitle="기관 분류 기준 공시 비중"
                    />
                    <div className="bg-white rounded-lg border border-stone-200 p-6">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={a.categoryDistribution.slice(0, 7)}
                          layout="vertical"
                          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" horizontal={false} />
                          <XAxis
                            type="number"
                            tick={{ fontSize: 11, fill: '#a8a29e' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v: number) => formatNumber(v)}
                          />
                          <YAxis
                            type="category"
                            dataKey="category"
                            tick={{ fontSize: 12, fill: '#57534e' }}
                            axisLine={false}
                            tickLine={false}
                            width={60}
                          />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="count" radius={[0, 4, 4, 0]} name="건수">
                            {a.categoryDistribution.slice(0, 7).map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </section>

                  <section>
                    <SectionHeader
                      title="분야별 월별 추이"
                      subtitle="주요 분야의 시계열 변화"
                    />
                    <div className="bg-white rounded-lg border border-stone-200 p-6">
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                          <XAxis
                            dataKey="date"
                            tickFormatter={formatMonth}
                            tick={{ fontSize: 11, fill: '#a8a29e' }}
                            axisLine={{ stroke: '#e7e5e4' }}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: '#a8a29e' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v: number) => formatNumber(v)}
                          />
                          <Tooltip content={<ChartTooltip />} />
                          {a.categoryTrends.slice(0, 5).map((ct, i) => (
                            <Line
                              key={ct.category}
                              type="monotone"
                              data={ct.data}
                              dataKey="count"
                              name={ct.category}
                              stroke={COLORS[i]}
                              strokeWidth={1.5}
                              dot={false}
                              connectNulls
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                        {a.categoryTrends.slice(0, 5).map((ct, i) => (
                          <div key={ct.category} className="flex items-center gap-1.5 text-xs text-stone-500">
                            <div className="w-3 h-0.5 rounded" style={{ background: COLORS[i] }} />
                            {ct.category}
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>

                {/* Recent documents */}
                <section>
                  <SectionHeader
                    title="최근 공시"
                    subtitle={`최근 ${Math.min(20, a.recentDocuments.length)}건`}
                  />
                  <div className="bg-white rounded-lg border border-stone-200 divide-y divide-stone-100 px-4">
                    {a.recentDocuments.slice(0, 20).map((doc, i) => (
                      <DocumentRow key={`${doc.date}-${i}`} doc={doc} />
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* ─── Keywords Tab ──────────────────────── */}
            {activeTab === 'keywords' && (
              <>
                <section>
                  <SectionHeader
                    title="핵심 키워드 빈도"
                    subtitle="최근 관보에서 가장 많이 등장한 정책 키워드"
                  />
                  <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-stone-200 bg-stone-50">
                          <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-5 py-3">순위</th>
                          <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-5 py-3">키워드</th>
                          <th className="text-right text-xs font-medium text-stone-500 uppercase tracking-wider px-5 py-3">전체 빈도</th>
                          <th className="text-right text-xs font-medium text-stone-500 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">최근</th>
                          <th className="text-right text-xs font-medium text-stone-500 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">이전</th>
                          <th className="text-center text-xs font-medium text-stone-500 uppercase tracking-wider px-5 py-3">추세</th>
                        </tr>
                      </thead>
                      <tbody>
                        {a.keywordTrends.map((kw, i) => (
                          <tr key={kw.keyword} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                            <td className="px-5 py-3 text-sm font-mono-data text-stone-400">{i + 1}</td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-stone-800">{kw.keyword}</span>
                                <div className="hidden md:block w-24 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-amber-600 rounded-full"
                                    style={{ width: `${(kw.count / a.keywordTrends[0].count) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-right text-sm font-mono-data text-stone-700">{kw.count}</td>
                            <td className="px-5 py-3 text-right text-sm font-mono-data text-stone-600 hidden sm:table-cell">{kw.recentCount}</td>
                            <td className="px-5 py-3 text-right text-sm font-mono-data text-stone-400 hidden sm:table-cell">{kw.prevCount}</td>
                            <td className="px-5 py-3 text-center">
                              <TrendBadge trend={kw.trend} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Keyword bar chart */}
                <section>
                  <SectionHeader
                    title="키워드 빈도 분포"
                    subtitle="상위 20개 키워드"
                  />
                  <div className="bg-white rounded-lg border border-stone-200 p-6">
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={a.keywordTrends.slice(0, 20)}
                        layout="vertical"
                        margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" horizontal={false} />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 11, fill: '#a8a29e' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="keyword"
                          tick={{ fontSize: 12, fill: '#57534e' }}
                          axisLine={false}
                          tickLine={false}
                          width={80}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="count" radius={[0, 3, 3, 0]} name="빈도">
                          {a.keywordTrends.slice(0, 20).map((kw) => (
                            <Cell
                              key={kw.keyword}
                              fill={kw.trend === 'up' ? '#15803d' : kw.trend === 'down' ? '#b91c1c' : '#a8a29e'}
                              fillOpacity={0.75}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 mt-3 text-xs text-stone-500">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-green-700 opacity-75" /> 증가 추세
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-red-700 opacity-75" /> 감소 추세
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-stone-400 opacity-75" /> 유지
                      </div>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* ─── Institutions Tab ──────────────────── */}
            {activeTab === 'institutions' && (
              <>
                <section>
                  <SectionHeader
                    title="기관별 공시 순위"
                    subtitle="가장 많은 공시를 발행한 기관 TOP 20"
                  />
                  <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-stone-200 bg-stone-50">
                          <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-5 py-3">순위</th>
                          <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-5 py-3">기관명</th>
                          <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-5 py-3">분류</th>
                          <th className="text-right text-xs font-medium text-stone-500 uppercase tracking-wider px-5 py-3">공시 건수</th>
                          <th className="text-right text-xs font-medium text-stone-500 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">비중</th>
                        </tr>
                      </thead>
                      <tbody>
                        {a.topInstitutions.map((inst, i) => (
                          <tr key={inst.name} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                            <td className="px-5 py-3 text-sm font-mono-data text-stone-400">{i + 1}</td>
                            <td className="px-5 py-3 text-sm font-medium text-stone-800">{inst.name}</td>
                            <td className="px-5 py-3">
                              <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-600">
                                {inst.category}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-right text-sm font-mono-data text-stone-700">{inst.count.toLocaleString()}</td>
                            <td className="px-5 py-3 text-right hidden sm:table-cell">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-20 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-800 rounded-full"
                                    style={{ width: `${(inst.count / a.topInstitutions[0].count) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs font-mono-data text-stone-500">
                                  {((inst.count / a.stats.totalDocuments) * 100).toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Institution chart */}
                <section>
                  <SectionHeader
                    title="기관 분류별 비중"
                    subtitle="기관 유형별 공시 점유율"
                  />
                  <div className="bg-white rounded-lg border border-stone-200 p-6">
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart
                        data={a.categoryDistribution}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                        <XAxis
                          dataKey="category"
                          tick={{ fontSize: 12, fill: '#57534e' }}
                          axisLine={{ stroke: '#e7e5e4' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#a8a29e' }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v: number) => formatNumber(v)}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]} name="건수">
                          {a.categoryDistribution.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* Top 5 institutions trend */}
                <section>
                  <SectionHeader
                    title="주요 기관 공시 추이"
                    subtitle="가장 활발한 5개 기관의 월별 공시 변화"
                  />
                  <div className="bg-white rounded-lg border border-stone-200 p-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                        <defs>
                          {a.topInstitutions.slice(0, 5).map((_, i) => (
                            <linearGradient key={i} id={`grad-inst-${i}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={COLORS[i]} stopOpacity={0.15} />
                              <stop offset="95%" stopColor={COLORS[i]} stopOpacity={0.01} />
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatMonth}
                          tick={{ fontSize: 11, fill: '#a8a29e' }}
                          axisLine={{ stroke: '#e7e5e4' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#a8a29e' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        {(() => {
                          // Build per-institution monthly data
                          const monthlyInstMap: Record<string, Record<string, number>> = {};
                          a.recentDocuments.forEach(doc => {
                            const month = doc.date.substring(0, 7);
                            const topNames = a.topInstitutions.slice(0, 5).map(t => t.name);
                            if (!topNames.includes(doc.publisher)) return;
                            if (!monthlyInstMap[doc.publisher]) monthlyInstMap[doc.publisher] = {};
                            monthlyInstMap[doc.publisher][month] = (monthlyInstMap[doc.publisher][month] || 0) + 1;
                          });
                          
                          const allMonths = [...new Set(a.recentDocuments.map(d => d.date.substring(0, 7)))].sort();
                          const seriesData = allMonths.map(month => {
                            const point: any = { date: month };
                            a.topInstitutions.slice(0, 5).forEach(inst => {
                              point[inst.name] = monthlyInstMap[inst.name]?.[month] || 0;
                            });
                            return point;
                          });

                          return a.topInstitutions.slice(0, 5).map((inst, i) => (
                            <Area
                              key={inst.name}
                              type="monotone"
                              data={seriesData}
                              dataKey={inst.name}
                              stroke={COLORS[i]}
                              strokeWidth={1.5}
                              fill={`url(#grad-inst-${i})`}
                              dot={false}
                              connectNulls
                              name={inst.name}
                            />
                          ));
                        })()}
                      </AreaChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                      {a.topInstitutions.slice(0, 5).map((inst, i) => (
                        <div key={inst.name} className="flex items-center gap-1.5 text-xs text-stone-500">
                          <div className="w-3 h-0.5 rounded" style={{ background: COLORS[i] }} />
                          {inst.name.length > 15 ? inst.name.slice(0, 15) + '…' : inst.name}
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

      {/* ─── Footer ────────────────────────────────── */}
      <footer className="border-t border-stone-200 bg-white mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8 text-xs text-stone-400">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <p>관보 트렌드 — 대한민국 정책 흐름 분석</p>
              <p className="mt-1">데이터: 행정안전부 전자관보 → opendataloader OCR → 사전 보정 코퍼스 (CC0)</p>
            </div>
            <div className="text-right">
              <p>코퍼스 원본은 공식적으로 활용 시 반드시 원본 PDF를 함께 확인해야 합니다</p>
              <a href="https://gwanbo.go.kr" target="_blank" rel="noopener" className="text-amber-700 hover:underline mt-1 inline-block">
                전자관보 바로가기 →
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
