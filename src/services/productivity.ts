import { apiGet, apiPost } from './api';
import type {
  ProductivityReport,
  ProductivityReportDetail,
  ProductivityReportsListResult,
  ProductivityTrendPoint,
} from '../types/productivity';

const BASE = '/api/Productivity';

/** POST /api/Productivity/generate-weekly — BE tự cache theo metrics, gọi lại không tốn AI token nếu số liệu không đổi */
export async function generateWeeklyReport(): Promise<ProductivityReport> {
  return apiPost<ProductivityReport>(`${BASE}/generate-weekly`, {});
}

/** GET /api/Productivity/reports */
export async function getReportsList(
  page = 1,
  limit = 10,
  periodType = 'weekly',
): Promise<ProductivityReportsListResult> {
  return apiGet<ProductivityReportsListResult>(
    `${BASE}/reports?page=${page}&limit=${limit}&periodType=${periodType}`,
  );
}

/** GET /api/Productivity/reports/{id} */
export async function getReportDetail(id: string): Promise<ProductivityReportDetail> {
  return apiGet<ProductivityReportDetail>(`${BASE}/reports/${id}`);
}

/** GET /api/Productivity/reports/trend */
export async function getProductivityTrend(
  weeks = 8,
  periodType = 'weekly',
): Promise<ProductivityTrendPoint[]> {
  return apiGet<ProductivityTrendPoint[]>(
    `${BASE}/reports/trend?weeks=${weeks}&periodType=${periodType}`,
  );
}