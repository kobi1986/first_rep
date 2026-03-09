import { Router, Request, Response } from 'express';
import db from '../db';
import { Chore, CreateChoreBody } from '../../shared/types';

const router = Router();

const CHORE_SELECT = `
  SELECT c.*, m.name as assignee_name, m.color as assignee_color
  FROM chores c
  LEFT JOIN members m ON c.assignee_id = m.id
`;

function parseChoreRow(row: Record<string, unknown>): Chore {
  return {
    ...(row as Omit<Chore, 'recurrence_days'>),
    recurrence_days: row.recurrence_days
      ? JSON.parse(row.recurrence_days as string)
      : null,
  };
}

router.get('/', (_req: Request, res: Response) => {
  const rows = db.prepare(`${CHORE_SELECT} ORDER BY c.title`).all() as Record<string, unknown>[];
  res.json(rows.map(parseChoreRow));
});

router.post('/', (req: Request, res: Response) => {
  const body = req.body as CreateChoreBody;
  const {
    title,
    description,
    assignee_id,
    recurrence_type,
    recurrence_days,
    recurrence_day_of_month,
    start_date,
    end_date,
  } = body;

  if (!title?.trim()) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }
  if (!start_date) {
    res.status(400).json({ error: 'Start date is required' });
    return;
  }

  const result = db
    .prepare(
      `INSERT INTO chores
        (title, description, assignee_id, recurrence_type, recurrence_days, recurrence_day_of_month, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      title.trim(),
      description ?? null,
      assignee_id ?? null,
      recurrence_type || 'none',
      recurrence_days ? JSON.stringify(recurrence_days) : null,
      recurrence_day_of_month ?? null,
      start_date,
      end_date ?? null
    );

  const row = db
    .prepare(`${CHORE_SELECT} WHERE c.id = ?`)
    .get(result.lastInsertRowid) as Record<string, unknown>;
  res.status(201).json(parseChoreRow(row));
});

router.put('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const body = req.body as CreateChoreBody;
  const {
    title,
    description,
    assignee_id,
    recurrence_type,
    recurrence_days,
    recurrence_day_of_month,
    start_date,
    end_date,
  } = body;

  db.prepare(
    `UPDATE chores
     SET title=?, description=?, assignee_id=?, recurrence_type=?,
         recurrence_days=?, recurrence_day_of_month=?, start_date=?, end_date=?
     WHERE id=?`
  ).run(
    title?.trim(),
    description ?? null,
    assignee_id ?? null,
    recurrence_type || 'none',
    recurrence_days ? JSON.stringify(recurrence_days) : null,
    recurrence_day_of_month ?? null,
    start_date,
    end_date ?? null,
    id
  );

  const row = db
    .prepare(`${CHORE_SELECT} WHERE c.id = ?`)
    .get(id) as Record<string, unknown>;
  res.json(parseChoreRow(row));
});

router.delete('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM chores WHERE id = ?').run(id);
  res.status(204).send();
});

export default router;
