import {
  Member,
  Chore,
  OccurrenceEvent,
  CreateMemberBody,
  CreateChoreBody,
  UpsertOccurrenceBody,
} from '@shared/types';

const BASE = '/api';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  members: {
    list: () => request<Member[]>('GET', '/members'),
    create: (body: CreateMemberBody) => request<Member>('POST', '/members', body),
    delete: (id: number) => request<void>('DELETE', `/members/${id}`),
  },
  chores: {
    list: () => request<Chore[]>('GET', '/chores'),
    create: (body: CreateChoreBody) => request<Chore>('POST', '/chores', body),
    update: (id: number, body: CreateChoreBody) => request<Chore>('PUT', `/chores/${id}`, body),
    delete: (id: number) => request<void>('DELETE', `/chores/${id}`),
  },
  occurrences: {
    list: (start: string, end: string) =>
      request<OccurrenceEvent[]>('GET', `/occurrences?start=${start}&end=${end}`),
    upsert: (body: UpsertOccurrenceBody) => request<unknown>('POST', '/occurrences', body),
  },
};
