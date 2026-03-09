import React, { useEffect, useState } from 'react';
import { Member } from '@shared/types';
import { api } from './api';
import CalendarView from './components/CalendarView';
import MembersPanel from './components/MembersPanel';

type Tab = 'calendar' | 'members';

export default function App() {
  const [tab, setTab] = useState<Tab>('calendar');
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
        <nav className="app-nav">
          <button
            className={`nav-btn ${tab === 'calendar' ? 'active' : ''}`}
            onClick={() => setTab('calendar')}
          >
            Calendar
          </button>
          <button
            className={`nav-btn ${tab === 'members' ? 'active' : ''}`}
            onClick={() => setTab('members')}
          >
            Team Members
          </button>
        </nav>
      </header>
      <main className="app-main">
        {tab === 'calendar' ? (
          <CalendarView members={members} />
        ) : (
          <MembersPanel members={members} onMembersChange={fetchMembers} />
        )}
      </main>
    </div>
  );
}
