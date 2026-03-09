import React, { useEffect, useState } from 'react';
import { Member } from '@shared/types';
import { api } from './api';
import CalendarView from './components/CalendarView';
import MembersPanel from './components/MembersPanel';

export default function App() {
  const [members, setMembers] = useState<Member[]>([]);

  const fetchMembers = async () => {
    try {
      setMembers(await api.members.list());
    } catch (e) {
      console.error('Failed to load members', e);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Office Chores</h1>
      </header>
      <div className="app-body">
        <div className="calendar-col">
          <CalendarView members={members} />
        </div>
        <aside className="members-col">
          <MembersPanel members={members} onMembersChange={fetchMembers} />
        </aside>
      </div>
    </div>
  );
}
