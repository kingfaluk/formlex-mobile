import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

import { Badge, Body, Button, Card, Empty, Loading, Notice, Screen, Title, s, useErrorText } from '@/components/ui';
import { api, downloadAndShare, type Paged, type Payment } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { money } from '@/lib/payment';
import { space } from '@/lib/theme';

export default function Payments() {
  const { t } = useI18n();
  const errorText = useErrorText();
  const [items, setItems] = useState<Payment[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { setItems((await api<Paged<Payment>>('/payments')).data); setError(''); }
    catch (e) { setError(errorText(e)); setItems(x => x ?? []); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function invoice(p: Payment) {
    setBusy(p.id); setError('');
    try { await downloadAndShare(`/payments/${p.id}/invoice`, `${p.invoice_number ?? 'invoice'}.pdf`, 'application/pdf'); }
    catch (e) { setError(errorText(e)); } finally { setBusy(null); }
  }

  const paid = (items ?? []).filter(p => p.status === 'completed');
  const total = paid.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const tone = (st: string) => (st === 'completed' ? 'ok' : st === 'pending' ? 'warn' : 'danger') as 'ok' | 'warn' | 'danger';
  const statusKey = (st: string) => (['pending', 'completed', 'failed', 'verification_failed', 'reversed'].includes(st) ? `status.${st}` : 'status.pending') as Parameters<typeof t>[0];

  return (
    <Screen refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}>
      <Title>{t('pay.title')}</Title>
      <Notice text={error} tone="error" />
      {items === null ? <Loading /> : <>
        <View style={[s.row, { gap: space(3) }]}>
          <Card style={{ flex: 1 }}><Text style={s.title}>{paid.length}</Text><Body muted>{t('pay.completed')}</Body></Card>
          <Card style={{ flex: 1 }}><Text style={s.title}>{money(total)}</Text><Body muted>{t('pay.total')}</Body></Card>
        </View>
        {items.map(p => (
          <Card key={p.id}>
            <View style={[s.row, { justifyContent: 'space-between', alignItems: 'flex-start' }]}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={s.heading}>{p.service_plan?.name ?? p.service}</Text>
                <Body muted>{[p.document?.title ?? p.matter?.title, new Date(p.created_at).toLocaleDateString(), p.merchant_reference].filter(Boolean).join(' · ')}</Body>
              </View>
              <Text style={[s.heading, { fontSize: 16 }]}>{money(p.amount, p.currency)}</Text>
            </View>
            <View style={[s.row, { justifyContent: 'space-between' }]}>
              <Badge label={t(statusKey(p.status))} tone={tone(p.status)} />
              {p.status === 'completed'
                ? <Button small variant="outline" title={t('pay.invoice') + (p.invoice_number ? ' ' + p.invoice_number : '')} onPress={() => invoice(p)} busy={busy === p.id} />
                : p.status === 'pending' ? <Text style={s.small}>{t('pay.awaiting')}</Text> : null}
            </View>
          </Card>
        ))}
        {!items.length && <Empty title={t('pay.empty')} text={t('pay.emptyText')} />}
      </>}
    </Screen>
  );
}
