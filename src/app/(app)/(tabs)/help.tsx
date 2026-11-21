import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Badge, Body, Button, Card, Empty, Field, Loading, Notice, Screen, Title, s, useErrorText } from '@/components/ui';
import { api, type Ticket } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { CATEGORIES, ticketStatusKey, type Category } from '@/lib/support';
import { colors, radius, space } from '@/lib/theme';


export default function Help() {
  const { t } = useI18n();
  const errorText = useErrorText();
  const [items, setItems] = useState<Ticket[] | null>(null);
  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState({ subject: '', category: 'document' as Category, body: '' });
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { const d = await api<Ticket[] | { data: Ticket[] }>('/support/tickets'); setItems(Array.isArray(d) ? d : d.data); setError(''); }
    catch (e) { setError(errorText(e)); setItems(x => x ?? []); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function send() {
    setBusy(true); setError('');
    try {
      const tk = await api<Ticket>('/support/tickets', { method: 'POST', body: { subject: form.subject.trim(), category: form.category, body: form.body.trim() } });
      setForm({ subject: '', category: 'document', body: '' }); setComposing(false);
      router.push({ pathname: '/ticket/[id]', params: { id: String(tk.id) } });
    } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  }

  return (
    <Screen refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}>
      <View style={[s.row, { justifyContent: 'space-between' }]}>
        <Title>{t('help.title')}</Title>
        {!composing && <Button small title={t('help.new')} onPress={() => setComposing(true)} />}
      </View>
      <Notice text={error} tone="error" />
      {composing && (
        <Card>
          <Field label={t('help.subject')} value={form.subject} onChangeText={v => setForm(f => ({ ...f, subject: v }))} maxLength={180} />
          <Text style={s.label}>{t('help.category')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space(2) }}>
            {CATEGORIES.map(c => (
              <Pressable key={c} onPress={() => setForm(f => ({ ...f, category: c }))} accessibilityRole="radio" accessibilityState={{ selected: form.category === c }}
                style={{ paddingHorizontal: space(3), paddingVertical: space(2), borderRadius: radius.pill, borderWidth: 1, borderColor: form.category === c ? colors.brand : colors.line, backgroundColor: form.category === c ? colors.brandSoft : '#fff' }}>
                <Text style={{ color: form.category === c ? colors.brand : colors.ink, fontWeight: '600' }}>{t(`help.cat.${c}`)}</Text>
              </Pressable>
            ))}
          </View>
          <Field label={t('help.message')} value={form.body} onChangeText={v => setForm(f => ({ ...f, body: v }))} multiline hint={t('help.messageHint')} maxLength={5000} />
          <View style={[s.row, { justifyContent: 'flex-end' }]}>
            <Button variant="text" small title={t('common.cancel')} onPress={() => setComposing(false)} />
            <Button small title={t('help.send')} onPress={send} busy={busy} disabled={form.subject.trim().length < 4 || form.body.trim().length < 10} />
          </View>
        </Card>
      )}
      {items === null ? <Loading /> : <>
        {items.map(tk => (
          <Card key={tk.id} onPress={() => router.push({ pathname: '/ticket/[id]', params: { id: String(tk.id) } })}>
            <View style={[s.row, { justifyContent: 'space-between' }]}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={s.heading}>{tk.subject}</Text>
                <Body muted>{tk.reference + ' · ' + new Date(tk.last_activity_at || tk.created_at).toLocaleDateString()}</Body>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </View>
            <Badge label={t(ticketStatusKey(tk.status))} tone={tk.status === 'waiting_customer' ? 'ok' : tk.status === 'open' ? 'warn' : 'neutral'} />
          </Card>
        ))}
        {!items.length && !composing && <Empty title={t('help.empty')} text={t('help.emptyText')} action={<Button title={t('help.new')} onPress={() => setComposing(true)} />} />}
      </>}
    </Screen>
  );
}
