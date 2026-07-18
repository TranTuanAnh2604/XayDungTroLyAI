import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { generateWeeklyReport, getProductivityTrend } from '../services/productivity';
import type { ProductivityReport, ProductivityTrendPoint } from '../types/productivity';

// Module-level cache để stale-while-revalidate, tránh nháy skeleton khi quay lại tab
let cachedReport: ProductivityReport | null = null;
let cachedTrend: ProductivityTrendPoint[] = [];

export function useProductivityDashboard() {
  const [latestReport, setLatestReport] = useState<ProductivityReport | null>(cachedReport);
  const [trend, setTrend] = useState<ProductivityTrendPoint[]>(cachedTrend);
  const [isLoading, setIsLoading] = useState(cachedReport === null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const load = useCallback(async (force = false) => {
    if (isMounted.current && (!cachedReport || force)) setIsLoading(true);
    if (isMounted.current) setError(null);

    try {
      const [report, trendData] = await Promise.all([
        generateWeeklyReport(),
        getProductivityTrend(8),
      ]);

      cachedReport = report;
      cachedTrend = trendData;

      if (isMounted.current) {
        setLatestReport(report);
        setTrend(trendData);
      }
    } catch (err: any) {
      console.error('useProductivityDashboard: load error', err);
      if (isMounted.current && !cachedReport) {
        setError('Không thể tải báo cáo năng suất.');
      }
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      isMounted.current = true;
      load();
      return () => { isMounted.current = false; };
    }, [load])
  );

  const refresh = useCallback(() => load(true), [load]);

  const generateReport = useCallback(async () => {
    setIsGenerating(true);
    try {
      await load(true);
    } finally {
      setIsGenerating(false);
    }
  }, [load]);

  return { latestReport, trend, isLoading, isGenerating, error, refresh, generateReport };
}