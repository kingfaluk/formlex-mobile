/* Support ticket topics and statuses, as used by the FormLex API. */
export const CATEGORIES = ['document', 'billing', 'account', 'technical', 'other'] as const;
export type Category = (typeof CATEGORIES)[number];

/** Translation key for a ticket status (waiting_customer = support replied, waiting for the client). */
export function ticketStatusKey(status: string): 'help.open' | 'help.answered' | 'help.resolved' | 'help.closed' {
  if (status === 'waiting_customer') return 'help.answered';
  if (status === 'resolved') return 'help.resolved';
  if (status === 'closed') return 'help.closed';
  return 'help.open';
}
