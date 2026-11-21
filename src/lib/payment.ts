/* Pay-first flow shared by the New and Documents tabs:
   open Pesapal checkout in the in-app browser, wait for the server to confirm payment,
   then submit the document for drafting and review. */
import * as WebBrowser from 'expo-web-browser';

import { api, type Matter, type Paged, type Plan } from './api';
import { PAYMENT_RETURN_URL } from './config';

export async function documentPlan(): Promise<Plan | undefined> {
  const plans = await api<Plan[]>('/service-plans');
  return plans.find(p => p.slug === 'document_generation');
}

export function money(amount?: string | number | null, currency = 'USD') {
  if (amount === undefined || amount === null) return '';
  return `${currency} ${Number(amount).toFixed(2).replace(/\.00$/, '')}`;
}

/** Opens checkout for a matter. Resolves when the browser closes (or returns to the app). */
export async function openCheckout(matterId: number, plan: Plan) {
  const d = await api<{ redirect_url: string }>('/payments/checkout', { method: 'POST', body: { matter_id: matterId, service_plan_id: plan.id, client: 'app' } });
  await WebBrowser.openAuthSessionAsync(d.redirect_url, PAYMENT_RETURN_URL);
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Polls until the payment is confirmed, then submits the matter. Returns 'submitted' | 'not_confirmed'. */
export async function confirmAndSubmit(matterId: number, attempts = 12): Promise<'submitted' | 'not_confirmed'> {
  for (let i = 0; i < attempts; i++) {
    const list = await api<Paged<Matter>>('/matters');
    const m = list.data.find(x => x.id === matterId);
    if (m && m.documents_count > 0) return 'submitted';
    if (m?.generation_paid) {
      await api(`/matters/${matterId}/generate`, { method: 'POST', body: {} });
      return 'submitted';
    }
    await sleep(5000);
  }
  return 'not_confirmed';
}
