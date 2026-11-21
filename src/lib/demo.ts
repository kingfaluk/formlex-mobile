/* Screenshot mode (EXPO_PUBLIC_DEMO=1): the app shows this sample data instead of calling the server.
   Used only to produce store screenshots; store builds never set EXPO_PUBLIC_DEMO. */
import type { Doc, Jurisdiction, Matter, Payment, Plan, Template, Ticket, TicketMessage, User } from './api';

export const IS_DEMO = process.env.EXPO_PUBLIC_DEMO === '1';

const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

export const demoUser: User = { id: 1, name: 'Amina Nakato', email: 'amina@nakatotraders.co.ug', phone: '+256772123456', business_name: 'Nakato Traders', role: 'client' };

const tenancyQuestions: Template['question_schema'] = [
  { key: 'landlord', type: 'text', label: 'Landlord', required: true },
  { key: 'tenant', type: 'text', label: 'Tenant', required: true },
  { key: 'property_address', type: 'textarea', label: 'Property address', required: true },
  { key: 'start_date', type: 'date', label: 'Start date', required: true },
  { key: 'term', type: 'text', label: 'Length of tenancy', required: true },
  { key: 'rent_amount', type: 'number', label: 'Rent amount in USD', required: true },
];
export const demoTemplates: Template[] = [
  { id: 1, slug: 'residential_tenancy', name: 'Residential Tenancy Agreement', category: 'property', version: '1.0', description: 'A tenancy agreement for a home or apartment.', question_schema: tenancyQuestions },
  { id: 2, slug: 'employment_contract', name: 'Employment Contract', category: 'employment', version: '1.0', description: 'A written contract of employment between an employer and employee.', question_schema: [] },
  { id: 3, slug: 'loan_agreement', name: 'Loan Agreement', category: 'finance', version: '1.0', description: 'Records a loan, its repayment terms, interest and security.', question_schema: [] },
  { id: 4, slug: 'nda', name: 'Non-disclosure Agreement', category: 'contract', version: '1.0', description: 'Protects confidential information shared between two parties.', question_schema: [] },
  { id: 5, slug: 'land_sale_agreement', name: 'Land and Property Sale Agreement', category: 'property', version: '1.0', description: 'Sale of land or buildings with title, payment and completion terms.', question_schema: [] },
  { id: 6, slug: 'letter_of_demand', name: 'Letter of Demand', category: 'disputes', version: '1.0', description: 'A formal demand for payment or action before legal proceedings.', question_schema: [] },
  { id: 7, slug: 'power_of_attorney', name: 'Power of Attorney', category: 'property', version: '1.0', description: 'Authorises another person to act on your behalf.', question_schema: [] },
  { id: 8, slug: 'custom_document', name: 'Custom document', category: 'custom', version: '1.0', description: null, question_schema: [] },
];
export const demoAnswers: Record<string, string> = {
  landlord: 'Joseph Mukasa', tenant: 'Amina Nakato', property_address: 'Plot 14, Ntinda Road, Kampala', start_date: '2026-12-01', term: '12 months', rent_amount: '450',
};
const plans: Plan[] = [{ id: 1, slug: 'document_generation', name: 'Document generation', amount_usd: '1.00' }];
const countries: Jurisdiction[] = [
  { code: 'UG', name: 'Uganda', languages: ['en', 'sw'] }, { code: 'KE', name: 'Kenya', languages: ['en', 'sw'] }, { code: 'TZ', name: 'Tanzania', languages: ['en', 'sw'] },
  { code: 'RW', name: 'Rwanda', languages: ['en', 'fr', 'rw'] }, { code: 'NG', name: 'Nigeria', languages: ['en'] }, { code: 'GB-EW', name: 'England and Wales', languages: ['en'] },
];
const matters: Matter[] = [
  { id: 31, title: 'Shop lease – Kampala Road', status: 'payment', created_at: daysAgo(0), documents_count: 0, generation_paid: false, legal_template: { name: 'Commercial Lease Agreement' } },
];
const content = `RESIDENTIAL TENANCY AGREEMENT

1. PARTIES
This Agreement is made between Joseph Mukasa ("the Landlord") and Amina Nakato ("the Tenant").

2. PREMISES
The Landlord lets to the Tenant the house at Plot 14, Ntinda Road, Kampala ("the Premises").

3. TERM
The tenancy begins on 1 December 2026 and continues for twelve (12) months.

4. RENT AND DEPOSIT
The Tenant shall pay rent of USD 450 per month, in advance, on or before the 5th day of each month. A deposit of USD 450 is payable on signing.

5. UTILITIES
The Tenant pays for electricity and water used at the Premises.`;
const docs: Doc[] = [
  { id: 21, title: 'House tenancy – Ntinda', status: 'approved', version: 1, created_at: daysAgo(3), updated_at: daysAgo(1), legal_template: { name: 'Residential Tenancy Agreement' }, content },
  { id: 22, title: 'Supplier NDA – Mbale Coffee', status: 'pending_review', version: 1, created_at: daysAgo(1), updated_at: daysAgo(1), legal_template: { name: 'Non-disclosure Agreement' } },
  { id: 23, title: 'Staff contract – J. Okello', status: 'approved', version: 2, created_at: daysAgo(12), updated_at: daysAgo(9), legal_template: { name: 'Employment Contract' } },
];
const payments: Payment[] = [
  { id: 44, service: 'document_generation', merchant_reference: 'FLX-20261121-7Q2KD', amount: '1.00', currency: 'USD', status: 'completed', created_at: daysAgo(1), invoice_number: 'INV-000044', service_plan: { name: 'Document generation' }, document: { id: 22, title: 'Supplier NDA – Mbale Coffee' } },
  { id: 41, service: 'document_generation', merchant_reference: 'FLX-20261118-B8M3T', amount: '1.00', currency: 'USD', status: 'completed', created_at: daysAgo(3), invoice_number: 'INV-000041', service_plan: { name: 'Document generation' }, document: { id: 21, title: 'House tenancy – Ntinda' } },
  { id: 36, service: 'document_generation', merchant_reference: 'FLX-20261109-K4P9W', amount: '1.00', currency: 'USD', status: 'completed', created_at: daysAgo(12), invoice_number: 'INV-000036', service_plan: { name: 'Document generation' }, document: { id: 23, title: 'Staff contract – J. Okello' } },
];
const tickets: Ticket[] = [
  { id: 7, reference: 'FLX-T00007', subject: 'Add a second tenant to my agreement', category: 'document', status: 'waiting_customer', last_activity_at: daysAgo(0), created_at: daysAgo(0) },
  { id: 5, reference: 'FLX-T00005', subject: 'Invoice for my company records', category: 'billing', status: 'resolved', last_activity_at: daysAgo(6), created_at: daysAgo(7) },
];
const messages: TicketMessage[] = [
  { id: 1, author: 'customer', author_name: 'Amina Nakato', body: 'Hello, my sister will share the house. Can you add her as a second tenant on the Ntinda tenancy agreement?', created_at: daysAgo(0.2) },
  { id: 2, author: 'staff', author_name: 'FormLex support', body: 'Hi Amina, yes. Please request changes on the document with her full name and ID number, and our team will update the agreement and release version 2 to you.', created_at: daysAgo(0.1) },
  { id: 3, author: 'customer', author_name: 'Amina Nakato', body: 'Thank you, I will do that now.', created_at: daysAgo(0.05) },
];

/** Answers the same paths as the API, from the sample data above. */
export function demoApi(path: string): unknown {
  const p = path.split('?')[0];
  if (p === '/me') return demoUser;
  if (p === '/auth/whatsapp/status') return { available: true };
  if (p === '/legal-templates') return demoTemplates;
  if (p === '/service-plans') return plans;
  if (p === '/drafting-jurisdictions') return { data: countries };
  if (p === '/matters') return { data: matters };
  if (p === '/documents') return { data: docs.map(({ content: _c, ...d }) => d) };
  if (/^\/documents\/\d+$/.test(p)) return docs.find(d => `/documents/${d.id}` === p) ?? docs[0];
  if (/\/revisions$/.test(p)) return [];
  if (p === '/payments') return { data: payments };
  if (p === '/support/tickets') return tickets;
  if (/^\/support\/tickets\/\d+$/.test(p)) return { ticket: tickets[0], messages };
  return {};
}
