import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Calendar, dateFnsLocalizer, SlotInfo, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { Member, Chore, OccurrenceEvent } from '@shared/types';
import { api } from '../api';
import ChoreEvent from './ChoreEvent';
import ChoreModal from './ChoreModal';
import OccurrencePopup from './OccurrencePopup';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { 'en-US': enUS },
});

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: OccurrenceEvent;
}

type ModalState =
  | { kind: 'add'; defaultDate?: string }
  | { kind: 'edit'; chore: Chore }
  | null;

interface Props {
  members: Member[];
}

export default function CalendarView({ members }: Props) {
  const [chores, setChores] = useState<Chore[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedOcc, setSelectedOcc] = useState<OccurrenceEvent | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('month');

  // Track current visible range for re-fetching
  const rangeRef = useRef<{ start: string; end: string } | null>(null);

  const fetchChores = useCallback(async () => {
    try {
      setChores(await api.chores.list());
    } catch (e) {
      console.error('Failed to load chores', e);
    }
  }, []);

  const fetchOccurrences = useCallback(async (start: string, end: string) => {
    rangeRef.current = { start, end };
    try {
      const occ = await api.occurrences.list(start, end);
      setEvents(
        occ.map(o => {
          const d = new Date(o.date + 'T00:00:00');
          return {
            title: o.chore_title,
            start: d,
            end: d,
            allDay: true,
            resource: o,
          };
        })
      );
    } catch (e) {
      console.error('Failed to load occurrences', e);
    }
  }, []);

  // Compute range for the current month view (includes surrounding weeks)
  const refreshCurrentRange = useCallback(() => {
    if (rangeRef.current) {
      fetchOccurrences(rangeRef.current.start, rangeRef.current.end);
    } else {
      // Default: current month + buffer
      const start = format(addDays(startOfMonth(currentDate), -6), 'yyyy-MM-dd');
      const end = format(addDays(endOfMonth(currentDate), 6), 'yyyy-MM-dd');
      fetchOccurrences(start, end);
    }
  }, [fetchOccurrences, currentDate]);

  useEffect(() => {
    fetchChores();
  }, [fetchChores]);

  const handleRangeChange = useCallback(
    (range: Date[] | { start: Date; end: Date }) => {
      let start: Date, end: Date;
      if (Array.isArray(range)) {
        start = range[0];
        end = range[range.length - 1];
      } else {
        start = range.start;
        end = range.end;
      }
      fetchOccurrences(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));
    },
    [fetchOccurrences]
  );

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedOcc(event.resource);
  }, []);

  const handleSelectSlot = useCallback((slot: SlotInfo) => {
    const dateStr = format(slot.start, 'yyyy-MM-dd');
    setModal({ kind: 'add', defaultDate: dateStr });
  }, []);

  const handleToggleDone = async (occ: OccurrenceEvent) => {
    await api.occurrences.upsert({ chore_id: occ.chore_id, date: occ.date, done: !occ.done });
    refreshCurrentRange();
  };

  const handleEditChore = (choreId: number) => {
    const chore = chores.find(c => c.id === choreId);
    if (chore) setModal({ kind: 'edit', chore });
  };

  const handleDeleteChore = async (choreId: number) => {
    await api.chores.delete(choreId);
    await fetchChores();
    refreshCurrentRange();
  };

  const handleModalSaved = async () => {
    setModal(null);
    await fetchChores();
    refreshCurrentRange();
  };

  const eventPropGetter = () => ({
    style: { padding: 0, background: 'transparent', border: 'none' },
  });

  return (
    <div className="calendar-view">
      <div className="calendar-toolbar">
        <button className="btn btn-primary" onClick={() => setModal({ kind: 'add' })}>
          + Add Chore
        </button>
      </div>

      <div className="calendar-wrapper">
        <Calendar<CalendarEvent>
          localizer={localizer}
          events={events}
          defaultView="month"
          view={currentView}
          onView={v => setCurrentView(v)}
          date={currentDate}
          onNavigate={d => setCurrentDate(d)}
          onRangeChange={handleRangeChange}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          eventPropGetter={eventPropGetter}
          components={{
            event: ({ event }) => <ChoreEvent occurrence={(event as CalendarEvent).resource} />,
          }}
          popup
        />
      </div>

      {selectedOcc && (
        <OccurrencePopup
          occurrence={selectedOcc}
          onClose={() => setSelectedOcc(null)}
          onToggleDone={handleToggleDone}
          onEditChore={handleEditChore}
          onDeleteChore={handleDeleteChore}
        />
      )}

      {modal?.kind === 'add' && (
        <ChoreModal
          members={members}
          defaultDate={modal.defaultDate}
          onClose={() => setModal(null)}
          onSaved={handleModalSaved}
        />
      )}

      {modal?.kind === 'edit' && (
        <ChoreModal
          members={members}
          chore={modal.chore}
          onClose={() => setModal(null)}
          onSaved={handleModalSaved}
        />
      )}
    </div>
  );
}
