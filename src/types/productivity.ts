export type ReportMetrics = {
  tasksCompleted: number;
  tasksPending: number;
  todosCompleted: number;
  todosPending: number;
  emailsThisWeek: number;
  avgEmailImportance: number;
  emailDeadlinesThisWeek: number;
  unreadEmailsNow: number;
  meetingsThisWeek: number;
  meetingHoursThisWeek: number;
  newConflictsThisWeek: number;
  unresolvedConflictsNow: number;
};

export type ChartDataPoint = { label: string; value: number };

/** data của POST /api/Productivity/generate-weekly (đã unwrap qua apiPost) */
export type ProductivityReport = {
  reportId: string;
  taskRate: string;   // "72.0%"
  todoRate: string;
  metrics: ReportMetrics;
  chartData: ChartDataPoint[];
  aiSkipped: boolean;
  ai_Evaluation: string;
};

/** Item trong GET /api/Productivity/reports */
export type ProductivityReportSummary = {
  id: string;
  periodType: string;
  periodStart: string;
  periodEnd: string;
  completionRate: number;
  taskCompletionRate: number;
  todoCompletionRate: number;
  generatedAt: string;
};

/** data của GET /api/Productivity/reports */
export type ProductivityReportsListResult = {
  total: number;
  page: number;
  limit: number;
  reports: ProductivityReportSummary[];
};

/** data của GET /api/Productivity/reports/{id} */
export type ProductivityReportDetail = ProductivityReportSummary & {
  ai_Evaluation: string;
  metrics: ReportMetrics | null;
  chartData: ChartDataPoint[];
};

/** Một điểm trong GET /api/Productivity/reports/trend — BE trả mảng thẳng */
export type ProductivityTrendPoint = {
  label: string;       // "14/07"
  periodStart: string;
  periodEnd: string;
  taskPercent: number;
  todoPercent: number;
};