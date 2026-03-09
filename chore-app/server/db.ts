import { DatabaseSync } from 'node:sqlite';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'chores.db');

const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT    NOT NULL,
    color TEXT    NOT NULL DEFAULT '#4a90e2'
  );

  CREATE TABLE IF NOT EXISTS chores (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    title                   TEXT    NOT NULL,
    description             TEXT,
    assignee_id             INTEGER REFERENCES members(id) ON DELETE SET NULL,
    recurrence_type         TEXT    NOT NULL DEFAULT 'none',
    recurrence_days         TEXT,
    recurrence_day_of_month INTEGER,
    start_date              TEXT    NOT NULL,
    end_date                TEXT
  );

  CREATE TABLE IF NOT EXISTS occurrences (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    chore_id  INTEGER NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
    date      TEXT    NOT NULL,
    done      INTEGER NOT NULL DEFAULT 0,
    UNIQUE(chore_id, date)
  );
`);

export default db;
