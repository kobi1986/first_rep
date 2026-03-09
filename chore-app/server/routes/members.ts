import { Router, Request, Response } from 'express';
import db from '../db';
import { Member, CreateMemberBody } from '../../shared/types';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const members = db.prepare('SELECT * FROM members ORDER BY name').all() as Member[];
  res.json(members);
});

router.post('/', (req: Request, res: Response) => {
  const { name, color } = req.body as CreateMemberBody;
  if (!name?.trim()) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }
  const result = db
    .prepare('INSERT INTO members (name, color) VALUES (?, ?)')
    .run(name.trim(), color || '#4a90e2');
  const member = db
    .prepare('SELECT * FROM members WHERE id = ?')
    .get(result.lastInsertRowid) as Member;
  res.status(201).json(member);
});

router.delete('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM members WHERE id = ?').run(id);
  res.status(204).send();
});

export default router;
