export type Mode = 'ssrs' | 'db';

export interface Resource {
  id: string;
  name: string;
}

export interface CanonicalWorkItem {
  resourceId: string;
  resourceName: string;
  workDate: string;
  workloadHours?: number;
  workloadUnits?: number;
}

export interface WorkloadRequest {
  mode: Mode;
  resourceIds: string[];
  startDate: string;
  endDate: string;
}

export interface WeeklyPoint {
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  total: number;
  byResource: Record<string, number>;
}

export interface WorkloadSummary {
  total: number;
  averageWeekly: number;
  peakWeek: {
    weekLabel: string;
    value: number;
  };
  lowWeek: {
    weekLabel: string;
    value: number;
  };
}

export interface WorkloadResponse {
  weeks: WeeklyPoint[];
  summary: WorkloadSummary;
}