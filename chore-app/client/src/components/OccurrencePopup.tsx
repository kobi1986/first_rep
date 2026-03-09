import React from 'react';
import { OccurrenceEvent, Chore } from '@shared/types';
import { format, parseISO } from 'date-fns';

interface Props {
  occurrence: OccurrenceEvent;
  onClose: () => void;
  onToggleDone: (occ: OccurrenceEvent) => Promise<void>;
  onEditChore: (choreId: number) => void;
  onDeleteChore: (choreId: number) => Promise<void>;
}

export default function OccurrencePopup({
  occurrence,
  onClose,
  onToggleDone,
  onEditChore,
  onDeleteChore,
}: Props) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleToggle = async () => {
    await onToggleDone(occurrence);
    onClose();
  };

  const handleDelete = async () => {
    if (!confirm(`Delete chore "${occurrence.chore_title}"? This will remove all its occurrences.`)) return;
    await onDeleteChore(occurrence.chore_id);
    onClose();
  };

  const handleEdit = () => {
    onEditChore(occurrence.chore_id);
    onClose();
  };

  const displayDate = format(parseISO(occurrence.date), 'EEEE, MMMM d, yyyy');

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal modal-sm occ-popup">
        <h2>{occurrence.chore_title}</h2>
        <div className="occ-popup-meta">
          <div className="occ-meta-row">
            <span className="label">Date</span>
            <span>{displayDate}</span>
          </div>
          <div className="occ-meta-row">
            <span className="label">Assigned to</span>
            {occurrence.assignee_name ? (
              <>
                <span
                  className="color-dot"
                  style={{ backgroundColor: occurrence.assignee_color ?? '#ccc' }}
                />
                <span>{occurrence.assignee_name}</span>
              </>
            ) : (
              <span style={{ color: '#9aa0a6' }}>Unassigned</span>
            )}
          </div>
          <div className="occ-meta-row">
            <span className="label">Status</span>
            <span className={`done-badge ${occurrence.done ? 'done' : 'pending'}`}>
              {occurrence.done ? 'Done' : 'Pending'}
            </span>
          </div>
        </div>

        <div className="occ-popup-actions">
          <button className="btn btn-primary" onClick={handleToggle}>
            {occurrence.done ? 'Mark as Pending' : 'Mark as Done'}
          </button>
          <button className="btn btn-ghost" onClick={handleEdit}>
            Edit Chore
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            Delete Chore
          </button>
        </div>
      </div>
    </div>
  );
}
