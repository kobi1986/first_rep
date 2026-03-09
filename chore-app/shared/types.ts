export interface Member {
  id: number;
  name: string;
  color: string;
}

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export type WeekDay = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

export interface Chore {
  id: number;
  title: string;
  description: string | null;
  assignee_id: number | null;
  assignee_name: string | null;
  assignee_color: string | null;
  recurrence_type: RecurrenceType;
  recurrence_days: WeekDay[] | null;
  recurrence_day_of_month: number | null;
  start_date: string;
  end_date: string | null;
}

export interface OccurrenceEvent {
  chore_id: number;
  chore_title: string;
  assignee_name: string | null;
  assignee_color: string | null;
  date: string;
  done: boolean;
  occurrence_id: number | null;
}

export interface CreateMemberBody {
  name: string;
  color: string;
}

export interface CreateChoreBody {
  title: string;
  description?: string | null;
  assignee_id?: number | null;
  recurrence_type: RecurrenceType;
  recurrence_days?: WeekDay[] | null;
  recurrence_day_of_month?: number | null;
  start_date: string;
  end_date?: string | null;
}

export interface UpsertOccurrenceBody {
  chore_id: number;
  date: string;
  done: boolean;
}
