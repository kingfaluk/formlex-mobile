/* Calls to the FormLex API with the signed-in client's token. */
import { Directory, File, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import * as Sharing from 'expo-sharing';

import { API_URL } from './config';
import { IS_DEMO, demoApi } from './demo';

const TOKEN_KEY = 'formlex_token';
let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export async function loadToken() {
  token = await SecureStore.getItemAsync(TOKEN_KEY);
  return token;
}
export async function saveToken(value: string | null) {
  token = value;
  if (value) await SecureStore.setItemAsync(TOKEN_KEY, value);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}
/** Called when the server says the session is no longer valid (signs the user out). */
export function setUnauthorizedHandler(fn: (() => void) | null) { onUnauthorized = fn; }

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function api<T = any>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  if (IS_DEMO) return demoApi(path) as T;
  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      method: options.method ?? 'GET',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError('offline', 0);
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.();
    const first = data?.errors ? (Object.values(data.errors)[0] as string[] | undefined)?.[0] : undefined;
    throw new ApiError(first || data?.message || 'error', res.status);
  }
  return data as T;
}

/** Downloads an authenticated file (PDF, Word, invoice) and opens the share sheet so it can be saved or sent. */
export async function downloadAndShare(path: string, filename: string, mimeType: string) {
  if (IS_DEMO) return '';
  const res = await fetch(API_URL + path, { headers: { Authorization: `Bearer ${token}`, Accept: mimeType } });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(data?.message || 'error', res.status);
  }
  const dir = new Directory(Paths.cache, 'downloads');
  if (!dir.exists) dir.create({ intermediates: true });
  const file = new File(dir, filename.replace(/[^\w.\- ]+/g, '_'));
  if (file.exists) file.delete();
  file.create();
  file.write(new Uint8Array(await res.arrayBuffer()));
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: filename });
  return file.uri;
}

// ---- Types returned by the API (fields the app uses) ----
export type User = { id: number; name: string; email: string | null; phone: string | null; business_name: string | null; role: string };
export type Question = { key: string; label: string; type: 'text' | 'textarea' | 'date' | 'number' | 'email'; required?: boolean };
export type Template = { id: number; name: string; slug: string; category: string; version: string; description: string | null; question_schema: Question[] };
export type Plan = { id: number; slug: string; name: string; amount_usd: string };
export type Jurisdiction = { code: string; name: string; requires_region?: boolean; region_label?: string | null; region_group?: string; languages?: string[] };
export type Matter = { id: number; title: string; status: string; created_at: string; documents_count: number; generation_paid: boolean; legal_template?: { name: string } | null };
export type Doc = { id: number; title: string; status: string; version: number; created_at: string; updated_at: string; content?: string | null; legal_template?: { name: string } | null };
export type Payment = { id: number; service: string; merchant_reference: string; amount: string; currency: string; status: string; created_at: string; invoice_number: string | null;
  service_plan?: { name: string } | null; matter?: { id: number; title: string; status: string } | null; document?: { id: number; title: string } | null };
export type Ticket = { id: number; reference: string; subject: string; category: string; status: string; last_activity_at: string; created_at: string };
export type TicketMessage = { id: number; author: 'customer' | 'staff' | 'system'; author_name: string | null; body: string; created_at: string };
export type Paged<T> = { data: T[] };
