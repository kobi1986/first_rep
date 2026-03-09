import React, { useState } from 'react';
import { Member } from '@shared/types';
import { api } from '../api';

interface Props {
  members: Member[];
  onMembersChange: () => void;
}

const PALETTE = [
  '#4a90e2', '#e74c3c', '#2ecc71', '#f39c12',
  '#9b59b6', '#1abc9c', '#e67e22', '#e91e63',
];

export default function MembersPanel({ members, onMembersChange }: Props) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PALETTE[0]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setAdding(true);
    setError(null);
    try {
      await api.members.create({ name: name.trim(), color });
      setName('');
      setColor(PALETTE[0]);
      onMembersChange();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (member: Member) => {
    if (!confirm(`Remove ${member.name} from the team? Their chores will become unassigned.`)) return;
    try {
      await api.members.delete(member.id);
      onMembersChange();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="members-panel">
      <h2>Team Members</h2>

      {members.length === 0 ? (
        <p className="empty-state">No team members yet. Add one below.</p>
      ) : (
        <ul className="members-list">
          {members.map(m => (
            <li key={m.id} className="member-item">
              <span className="member-color" style={{ backgroundColor: m.color }} />
              <span className="member-name">{m.name}</span>
              <button
                className="btn btn-ghost"
                style={{ padding: '4px 12px', fontSize: 13 }}
                onClick={() => handleDelete(m)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="add-member-form">
        <h3>Add Team Member</h3>
        <form onSubmit={handleAdd}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Alice"
            />
          </div>
          <div className="form-group">
            <label>Color</label>
            <div className="color-swatches">
              {PALETTE.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch${color === c ? ' selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          {error && <p style={{ color: '#d93025', fontSize: 13, margin: '4px 0 8px' }}>{error}</p>}
          <div style={{ marginTop: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={adding}>
              {adding ? 'Adding…' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
