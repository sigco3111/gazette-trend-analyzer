import { NextResponse } from 'next/server';
import { fetchMeta, fetchRecentDocuments } from '@/lib/api';
import { analyzeTrend } from '@/lib/analyzer';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '60');
  
  try {
    const [meta, documents] = await Promise.all([
      fetchMeta(),
      fetchRecentDocuments(days),
    ]);
    
    const analysis = analyzeTrend(documents);
    
    return NextResponse.json({
      meta: {
        totalDocs: meta.total_docs,
        dateRange: meta.date_range,
      },
      analysis,
      fetchedDays: days,
      fetchedDocuments: documents.length,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: '분석 데이터를 가져오는 데 실패했습니다.' },
      { status: 500 }
    );
  }
}
