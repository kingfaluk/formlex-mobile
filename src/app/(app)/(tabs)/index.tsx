import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

import { Badge, Body, Button, Card, Empty, Heading, Loading, Notice, Screen, Title, s, useErrorText } from '@/components/ui';
import { api, type Doc, type Matter, type Paged, type Plan } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { confirmAndSubmit, documentPlan, money, openCheckout } from '@/lib/payment';
import { colors, space } from '@/lib/theme';

export default function Documents() {
  const { t } = useI18n();
  const errorText = useErrorText();
  const [orders, setOrders] = useState<Matter[] | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [plan, setPlan] = useState<Plan>();
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ text: string; tone: 'info' | 'error' | 'ok' } | null>(null);

  const load = useCallback(async () => {
    try {
      const [m, d, p] = await Promise.all([api<Paged<Matter>>('/matters'), api<Paged<Doc>>('/documents'), documentPlan()]);
      setOrders(m.data.filter(x => !x.documents_count)); setDocs(d.data); setPlan(p);
    } catch (e) { setNotice({ text: errorText(e), tone: 'error' }); setOrders(o => o ?? []); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function pay(m: Matter) {
    if (!plan) return;
    setBusy(m.id); setNotice(null);
    try {
      await openCheckout(m.id, plan);
      setNotice({ text: t('new.waiting'), tone: 'info' });
      const r = await confirmAndSubmit(m.id);
      setNotice(r === 'submitted' ? { text: t('new.submitted'), tone: 'ok' } : { text: t('new.notConfirmed'), tone: 'info' });
    } catch (e) { setNotice({ text: errorText(e), tone: 'error' }); } finally { setBusy(null); void load(); }
  }
  async function submit(m: Matter) {
    setBusy(m.id); setNotice(null);
    try { await api(`/matters/${m.id}/generate`, { method: 'POST', body: {} }); setNotice({ text: t('new.submitted'), tone: 'ok' }); }
    catch (e) { setNotice({ text: errorText(e), tone: 'error' }); } finally { setBusy(null); void load(); }
  }
  const date = (v: string) => new Date(v).toLocaleDateString();

  return (
    <Screen refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}>
      <Title>{t('docs.title')}</Title>
      {notice && <Notice text={notice.text} tone={notice.tone} />}
      {orders === null ? <Loading /> : <>
        {orders.length > 0 && <View style={{ gap: space(2) }}>
          <Heading>{t('docs.inProgress')}</Heading>
          {orders.map(m => (
            <Card key={m.id}>
              <Text style={s.heading}>{m.title}</Text>
              <Body muted>{(m.legal_template?.name ?? '') + ' · ' + t('docs.started', { date: date(m.created_at) })}</Body>
              <View style={[s.row, { justifyContent: 'space-between', marginTop: space(1) }]}>
                <Badge label={m.generation_paid ? t('docs.paid') : t('docs.waitingPayment')} tone={m.generation_paid ? 'ok' : 'warn'} />
                {m.generation_paid
                  ? <Button small title={busy === m.id ? t('docs.submitting') : t('docs.submit')} onPress={() => submit(m)} busy={busy === m.id} />
                  : <Button small title={t('docs.pay', { price: money(plan?.amount_usd) })} onPress={() => pay(m)} busy={busy === m.id} disabled={!plan} />}
              </View>
            </Card>
          ))}
        </View>}
        <View style={{ gap: space(2) }}>
          {(orders.length > 0 || docs.length > 0) && <Heading>{t('docs.ready')}</Heading>}
          {docs.map(d => {
            const tone = d.status === 'approved' ? 'ok' : d.status === 'changes_requested' ? 'danger' : 'warn';
            const label = d.status === 'approved' ? t('docs.approved') : d.status === 'changes_requested' ? t('docs.changes') : t('docs.inReview');
            return (
              <Card key={d.id} onPress={() => router.push({ pathname: '/document/[id]', params: { id: String(d.id) } })}>
                <View style={[s.row, { justifyContent: 'space-between' }]}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={s.heading}>{d.title}</Text>
                    <Body muted>{(d.legal_template?.name ? d.legal_template.name + ' · ' : '') + t('docs.version', { n: d.version })}</Body>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.muted} />
                </View>
                <Badge label={label} tone={tone} />
              </Card>
            );
          })}
          {!orders.length && !docs.length && <Empty title={t('docs.empty')} text={t('docs.emptyText')} action={<Button title={t('docs.start')} onPress={() => router.navigate('/new')} />} />}
        </View>
      </>}
    </Screen>
  );
}
