/**
 * TypeScript models for the Productivity Report API.
 * Field names match the API spec; update here if the backend shape differs.
 */

/** Shape returned by GET /api/Productivity/reports (list item) */
export type ProductivityReportSummary = {
  id: string;
  title: string;
  periodType: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  productivityScore: number;
};

/** Shape returned by GET /api/Productivity/reports/{id} (full detail) */
export type ProductivityReport = {
  id: string;
  title: string;
  periodType: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;

  productivityScore: number;
  taskCompletionRate: number;
  tasksCompleted: number;
  eventsCompleted: number;
  focusTimeHours: number;
  breakTimeHours: number;
  weeklyPerformance?: string;

  aiSummary?: string;
  overallEvaluation?: string;
  strengths?: string[];
  weaknesses?: string[];
  suggestions?: string[];
};

/** One data point from GET /api/Productivity/reports/trend */
export type ProductivityTrendPoint = {
  week: string;
  score: number;
  completionRate: number;
};

/** Full response from GET /api/Productivity/reports/trend */
export type ProductivityTrendResponse = {
  data: ProductivityTrendPoint[];
  weeks: number;
  periodType: string;
};

/** Response from GET /api/Productivity/reports */
export type ProductivityReportsListResponse = {
  data: ProductivityReportSummary[];
  total: number;
  page: number;
  limit: number;
};

/** Response from POST /api/Productivity/generate-weekly */
export type GenerateWeeklyReportResponse = {
  success: boolean;
  message?: string;
  report?: ProductivityReportSummary;
};
