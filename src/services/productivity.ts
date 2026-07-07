import { apiGet, apiPost } from './api';
import type {
  GenerateWeeklyReportResponse,
  ProductivityReport,
  ProductivityReportsListResponse,
  ProductivityTrendResponse,
} from '../types/productivity';

const BASE = '/api/Productivity';

/**
 * POST /api/Productivity/generate-weekly
 * Call only when no report exists or the user explicitly requests regeneration.
 */
export async function generateWeeklyReport(): Promise<GenerateWeeklyReportResponse> {
  return apiPost<GenerateWeeklyReportResponse>(`${BASE}/generate-weekly`, {});
}

/**
 * GET /api/Productivity/reports
 * Returns paginated list. The newest report is item [0].
 */
export async function getReportsList(
  page = 1,
  limit = 10,
  periodType = 'weekly',
): Promise<ProductivityReportsListResponse> {
  return apiGet<ProductivityReportsListResponse>(
    `${BASE}/reports?page=${page}&limit=${limit}&periodType=${periodType}`,
  );
}

/**
 * GET /api/Productivity/reports/{id}
 * Full report detail. Only call when the user opens a detail view.
 */
export async function getReportDetail(id: string): Promise<ProductivityReport> {
  return apiGet<ProductivityReport>(`${BASE}/reports/${id}`);
}

/**
 * GET /api/Productivity/reports/trend
 * Historical productivity trend data for the chart.
 */
export async function getProductivityTrend(
  weeks = 8,
  periodType = 'weekly',
): Promise<ProductivityTrendResponse> {
  return apiGet<ProductivityTrendResponse>(
    `${BASE}/reports/trend?weeks=${weeks}&periodType=${periodType}`,
  );
}
