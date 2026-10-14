export type AnalyticsBucket = "DAY" | "WEEK" | "MONTH";

export interface AnalyticsFilters {
  from: string;
  to: string;
  bucket: AnalyticsBucket;
  classId?: string;
}

export interface AnalyticsTrendPoint {
  period: string;
  completedSessions: number;
  attendanceRequired: number;
  attendanceSatisfied: number;
  attendancePercent: number | null;
  publishedGrades: number;
  averageScore: number | null;
  confirmedRevenue: number;
}

export interface AnalyticsClassMetric {
  classId: string;
  className: string;
  capacity: number;
  reservedSeats: number;
  utilizationPercent: number;
  completedSessions: number;
  attendanceRequired: number;
  attendanceSatisfied: number;
  attendancePercent: number | null;
  publishedGrades: number;
  averageScore: number | null;
  assignments: number;
  unpublishedSubmissions: number;
}

export interface OperationsAnalytics {
  role: "MANAGER" | "TEACHER";
  generatedAt: string;
  range: { from: string; to: string; bucket: AnalyticsBucket };
  summary: {
    classes: number;
    activeStudents: number;
    reservedSeats: number;
    completedSessions: number;
    attendancePercent: number | null;
    assignments: number;
    unpublishedSubmissions: number;
    publishedGrades: number;
    averageScore: number | null;
    pendingLeaves?: number;
    bookedMakeups?: number;
    confirmedRevenue?: number;
  };
  classes: AnalyticsClassMetric[];
  trend: AnalyticsTrendPoint[];
}
