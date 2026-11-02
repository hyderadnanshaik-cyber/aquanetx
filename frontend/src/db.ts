// Dexie (IndexedDB) database for offline-first storage
import Dexie, { type Table } from 'dexie';

export interface CitizenReport {
  id?: number;
  serverId?: string;
  userId: string;
  category: 'flooding' | 'waterlogging' | 'drainage' | 'shortage' | 'contamination' | 'infrastructure' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  lat?: number;
  lng?: number;
  address?: string;
  photoDataUrl?: string;
  status: 'pending_local' | 'pending_sync' | 'received' | 'under_review' | 'resolved';
  createdAt: number;
  syncedAt?: number;
}

export interface EmergencyContact {
  id?: number;
  userId: string;
  name: string;
  phone: string;
  relation?: string;
}

export interface EmergencyMessage {
  id?: number;
  userId: string;
  contactName: string;
  contactPhone: string;
  message: string;
  lat?: number;
  lng?: number;
  status: 'queued' | 'sent' | 'failed';
  createdAt: number;
  sentAt?: number;
}

export interface CachedData {
  id?: number;
  key: string;
  data: unknown;
  fetchedAt: number;
  expiresAt: number;
}

export interface ChatMessage {
  id?: number;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

export interface UserPreference {
  id?: number;
  userId: string;
  key: string;
  value: unknown;
}

class AquaNetDatabase extends Dexie {
  citizenReports!: Table<CitizenReport>;
  emergencyContacts!: Table<EmergencyContact>;
  emergencyMessages!: Table<EmergencyMessage>;
  cachedData!: Table<CachedData>;
  chatMessages!: Table<ChatMessage>;
  userPreferences!: Table<UserPreference>;

  constructor() {
    super('AquaNetX');
    this.version(1).stores({
      citizenReports: '++id, serverId, userId, status, createdAt',
      emergencyContacts: '++id, userId',
      emergencyMessages: '++id, userId, status, createdAt',
      cachedData: '++id, key, expiresAt',
      chatMessages: '++id, sessionId, createdAt',
      userPreferences: '++id, userId, key',
    });
  }
}

export const db = new AquaNetDatabase();

// Helper: get cached data if not expired
export async function getCached<T>(key: string): Promise<T | null> {
  const row = await db.cachedData.where('key').equals(key).first();
  if (!row) return null;
  if (Date.now() > row.expiresAt) {
    await db.cachedData.delete(row.id!);
    return null;
  }
  return row.data as T;
}

// Helper: set cached data
export async function setCached(key: string, data: unknown, ttlMs: number): Promise<void> {
  const existing = await db.cachedData.where('key').equals(key).first();
  const entry = { key, data, fetchedAt: Date.now(), expiresAt: Date.now() + ttlMs };
  if (existing) {
    await db.cachedData.update(existing.id!, entry);
  } else {
    await db.cachedData.add(entry);
  }
}
