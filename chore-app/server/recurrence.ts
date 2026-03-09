import { eachDayOfInterval, parseISO, format, getDay, getDate } from 'date-fns';
import { Chore } from '../shared/types';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function generateDates(chore: Chore, rangeStart: string, rangeEnd: string): string[] {
  const choreStart = parseISO(chore.start_date);
  const choreEnd = chore.end_date ? parseISO(chore.end_date) : null;
  const rStart = parseISO(rangeStart);
  const rEnd = parseISO(rangeEnd);

  const effectiveStart = choreStart > rStart ? choreStart : rStart;
  const effectiveEnd = choreEnd && choreEnd < rEnd ? choreEnd : rEnd;

  if (effectiveStart > effectiveEnd) return [];

  if (chore.recurrence_type === 'none') {
    if (choreStart >= rStart && choreStart <= rEnd) {
      return [format(choreStart, 'yyyy-MM-dd')];
    }
    return [];
  }

  const days = eachDayOfInterval({ start: effectiveStart, end: effectiveEnd });

  if (chore.recurrence_type === 'daily') {
    return days.map(d => format(d, 'yyyy-MM-dd'));
  }

  if (chore.recurrence_type === 'weekly') {
    const recDays = chore.recurrence_days ?? [];
    return days
      .filter(d => recDays.includes(DAY_NAMES[getDay(d)]))
      .map(d => format(d, 'yyyy-MM-dd'));
  }

  if (chore.recurrence_type === 'monthly') {
    const dayOfMonth = chore.recurrence_day_of_month ?? 1;
    return days
      .filter(d => getDate(d) === dayOfMonth)
      .map(d => format(d, 'yyyy-MM-dd'));
  }

  return [];
}
