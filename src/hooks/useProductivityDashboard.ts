import { useCallback, useRef, useState, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
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

  const load = useCallback(async (force = false) => {
    if (!cachedReport || force) setIsLoading(true);
    setError(null);

    try {
      const [report, trendData] = await Promise.all([
        generateWeeklyReport(),
        getProductivityTrend(8),
      ]);

      cachedReport = report;
      cachedTrend = trendData;

      setLatestReport(report);
      setTrend(trendData);
    } catch (err: any) {
      console.error('useProductivityDashboard: load error', err);
      if (!cachedReport) {
        setError('Không thể tải báo cáo năng suất.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!cachedReport) {
      load();
    }
  }, [load]);

  useEffect(() => {
    const taskSub = DeviceEventEmitter.addListener('tasks_changed', () => {
      load(true);
    });
    const eventSub = DeviceEventEmitter.addListener('events_changed', () => {
      load(true);
    });
    return () => {
      taskSub.remove();
      eventSub.remove();
    };
  }, [load]);

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