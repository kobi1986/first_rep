import React from 'react';
import { OccurrenceEvent } from '@shared/types';
import { format } from 'date-fns';

interface Props {
  occurrence: OccurrenceEvent;
}

export default function ChoreEvent({ occurrence }: Props) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const isOverdue = !occurrence.done && occurrence.date < today;
  const color = occurrence.assignee_color ?? '#6b7280';

  return (
    <div
      className={`chore-event${occurrence.done ? ' done' : ''}${isOverdue ? ' overdue' : ''}`}
      style={{ backgroundColor: color }}
    >
      <span className="event-title">{occurrence.chore_title}</span>
      {occurrence.assignee_name && (
        <span className="event-assignee">{occurrence.assignee_name}</span>
      )}
    </div>
  );
}
