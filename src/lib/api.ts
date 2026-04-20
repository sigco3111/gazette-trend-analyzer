import { MetaData, GazetteDocument, DateGroupResponse } from './types';

const BASE_URL = 'https://hosungseo.github.io/ai-readable-gazette-kr/data';

export async function fetchMeta(): Promise<MetaData> {
  const res = await fetch(BASE_URL + '/meta.json', { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error('Failed to fetch meta.json');
  return res.json();
}

export async function fetchDateGroup(date: string): Promise<GazetteDocument[]> {
  const res = await fetch(`${BASE_URL}/dates/${date}.json`);
  if (!res.ok) return [];
  const data: DateGroupResponse = await res.json();
  // Attach date to each document
  return data.docs.map(doc => ({ ...doc, date: data.date }));
}

export async function fetchRecentDocuments(days: number = 60): Promise<GazetteDocument[]> {
  const meta = await fetchMeta();
  const allDates = meta.dates.map(d => d.date);
  const recentDates = allDates.slice(-Math.min(days, allDates.length));

  const results = await Promise.allSettled(
    recentDates.map(date => fetchDateGroup(date))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<GazetteDocument[]> => r.status === 'fulfilled')
    .map(r => r.value)
    .flat();
}
