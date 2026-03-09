import { Router, Request, Response } from 'express';
import db from '../db';
import { generateDates } from '../recurrence';
import { Chore, OccurrenceEvent, UpsertOccurrenceBody } from '../../shared/types';

const router = Router();

interface OccurrenceRow {
  id: number;
  chore_id: number;
  date: string;
  done: number;
}

interface ChoreRow extends Omit<Chore, 'recurrence_days'> {
  recurrence_days: string | null;
}

router.get('/', (req: Request, res: Response) => {
  const { start, end } = req.query as { start?: string; end?: string };
  if (!start || !end) {
    res.status(400).json({ error: 'start and end query params required' });
    return;
  }

  const rows = db
    .prepare(
      `SELECT c.*, m.name as assignee_name, m.color as assignee_color
       FROM chores c
       LEFT JOIN members m ON c.assignee_id = m.id`
    )
    .all() as unknown as ChoreRow[];

  const chores: Chore[] = rows.map(r => ({
    ...r,
    recurrence_days: r.recurrence_days ? JSON.parse(r.recurrence_days) : null,
  }));

  const occRecords = db
    .prepare('SELECT * FROM occurrences WHERE date >= ? AND date <= ?')
    .all(start, end) as unknown as OccurrenceRow[];

  const occMap = new Map<string, { id: number; done: boolean }>();
  for (const o of occRecords) {
    occMap.set(`${o.chore_id}:${o.date}`, { id: o.id, done: o.done === 1 });
  }

  const events: OccurrenceEvent[] = [];
  for (const chore of chores) {
    const dates = generateDates(chore, start, end);
    for (const date of dates) {
      const key = `${chore.id}:${date}`;
      const record = occMap.get(key);
      events.push({
        chore_id: chore.id,
        chore_title: chore.title,
        assignee_name: chore.assignee_name,
        assignee_color: chore.assignee_color,
        date,
        done: record?.done ?? false,
        occurrence_id: record?.id ?? null,
      });
    }
  }

  res.json(events);
});

router.post('/', (req: Request, res: Response) => {
  const { chore_id, date, done } = req.body as UpsertOccurrenceBody;
  db.prepare(
    `INSERT INTO occurrences (chore_id, date, done) VALUES (?, ?, ?)
     ON CONFLICT(chore_id, date) DO UPDATE SET done = excluded.done`
  ).run(chore_id, date, done ? 1 : 0);

  const occurrence = db
    .prepare('SELECT * FROM occurrences WHERE chore_id = ? AND date = ?')
    .get(chore_id, date) as unknown as OccurrenceRow;
  res.json({ ...occurrence, done: occurrence.done === 1 });
});

export default router;
