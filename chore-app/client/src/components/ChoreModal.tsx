import React, { useState } from 'react';
import { Member, Chore, CreateChoreBody, RecurrenceType, WeekDay } from '@shared/types';
import { api } from '../api';

const WEEK_DAYS: WeekDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface FormState {
  title: string;
  description: string;
  assignee_id: string;
  recurrence_type: RecurrenceType;
  recurrence_days: WeekDay[];
  recurrence_day_of_month: string;
  start_date: string;
  end_date: string;
}

function choreToForm(chore: Chore): FormState {
  return {
    title: chore.title,
    description: chore.description ?? '',
    assignee_id: chore.assignee_id?.toString() ?? '',
    recurrence_type: chore.recurrence_type,
    recurrence_days: chore.recurrence_days ?? [],
    recurrence_day_of_month: chore.recurrence_day_of_month?.toString() ?? '1',
    start_date: chore.start_date,
    end_date: chore.end_date ?? '',
  };
}

function emptyForm(defaultDate?: string): FormState {
  return {
    title: '',
    description: '',
    assignee_id: '',
    recurrence_type: 'none',
    recurrence_days: [],
    recurrence_day_of_month: '1',
    start_date: defaultDate ?? '',
    end_date: '',
  };
}

interface Props {
  members: Member[];
  chore?: Chore;
  defaultDate?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function ChoreModal({ members, chore, defaultDate, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(
    chore ? choreToForm(chore) : emptyForm(defaultDate)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof FormState, value: FormState[keyof FormState]) =>
    setForm(f => ({ ...f, [key]: value }));

  const toggleDay = (day: WeekDay) => {
    setForm(f => ({
      ...f,
      recurrence_days: f.recurrence_days.includes(day)
        ? f.recurrence_days.filter(d => d !== day)
        : [...f.recurrence_days, day],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.start_date) { setError('Start date is required'); return; }
    if (form.recurrence_type === 'weekly' && form.recurrence_days.length === 0) {
      setError('Select at least one day for weekly recurrence');
      return;
    }

    const body: CreateChoreBody = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      assignee_id: form.assignee_id ? Number(form.assignee_id) : null,
      recurrence_type: form.recurrence_type,
      recurrence_days: form.recurrence_type === 'weekly' ? form.recurrence_days : null,
      recurrence_day_of_month:
        form.recurrence_type === 'monthly' ? Number(form.recurrence_day_of_month) : null,
      start_date: form.start_date,
      end_date: form.end_date || null,
    };

    setSaving(true);
    setError(null);
    try {
      if (chore) {
        await api.chores.update(chore.id, body);
      } else {
        await api.chores.create(body);
      }
      onSaved();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal">
        <h2>{chore ? 'Edit Chore' : 'Add Chore'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Clean kitchen"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Optional details"
            />
          </div>

          <div className="form-group">
            <label>Assigned to</label>
            <select value={form.assignee_id} onChange={e => set('assignee_id', e.target.value)}>
              <option value="">Unassigned</option>
              {members.map(m => (
                <option key={m.id} value={m.id.toString()}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Recurrence</label>
            <select
              value={form.recurrence_type}
              onChange={e => set('recurrence_type', e.target.value as RecurrenceType)}
            >
              <option value="none">One-time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {form.recurrence_type === 'weekly' && (
            <div className="form-group">
              <label>Days of the week</label>
              <div className="day-picker">
                {WEEK_DAYS.map(day => (
                  <label key={day} className="day-chip">
                    <input
                      type="checkbox"
                      checked={form.recurrence_days.includes(day)}
                      onChange={() => toggleDay(day)}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>
          )}

          {form.recurrence_type === 'monthly' && (
            <div className="form-group">
              <label>Day of month (1–31)</label>
              <input
                type="number"
                min={1}
                max={31}
                value={form.recurrence_day_of_month}
                onChange={e => set('recurrence_day_of_month', e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label>Start date *</label>
            <input
              type="date"
              value={form.start_date}
              onChange={e => set('start_date', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>End date (optional)</label>
            <input
              type="date"
              value={form.end_date}
              min={form.start_date}
              onChange={e => set('end_date', e.target.value)}
            />
          </div>

          {error && <p style={{ color: '#d93025', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : chore ? 'Save Changes' : 'Add Chore'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
