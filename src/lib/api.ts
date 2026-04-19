import { MetaData, GazetteDocument } from './types';

const BASE_URL = 'https://hosungseo.github.io/ai-readable-gazette-kr/data';

export async function fetchMeta(): Promise<MetaData> {
  const res = await fetch(`${BASE_URL}/meta.json`);
  if (!res.ok) throw new Error('Failed to fetch meta.json');
  return res.json();
}

export async function fetchDateGroup(date: string): Promise<GazetteDocument[]> {
  const res = await fetch(`${BASE_URL}/dates/${date}.json`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchDateRange(start: string, end: string): Promise<GazetteDocument[]> {
  const meta = await fetchMeta();
  const allDates = Object.keys(meta.heatmap).sort();
  const datesInRange = allDates.filter(d => d >= start && d <= end);
  
  // Limit to avoid timeout - max 60 days at a time
  const limitedDates = datesInRange.slice(-60);
  
  const promises = limitedDates.map(date => fetchDateGroup(date).catch(() => []));
  const results = await Promise.all(promises);
  
  return results.flat();
}

export async function fetchRecentDocuments(days: number = 30): Promise<GazetteDocument[]> {
  const meta = await fetchMeta();
  const allDates = Object.keys(meta.heatmap).sort();
  const recentDates = allDates.slice(-days);
  
  const promises = recentDates.map(date => fetchDateGroup(date).catch(() => []));
  const results = await Promise.all(promises);
  
  return results.flat();
}
