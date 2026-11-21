import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { Badge, Button, Field, Loading, Notice, Screen, s, useErrorText } from '@/components/ui';
import { api, type Ticket, type TicketMessage } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { ticketStatusKey } from '@/lib/support';
import { colors, radius, space } from '@/lib/theme';

export default function TicketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const errorText = useErrorText();
  const [data, setData] = useState<{ ticket: Ticket; messages: TicketMessage[] } | null>(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { setData(await api(`/support/tickets/${id}`)); } catch (e) { setError(errorText(e)); }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function send() {
    setBusy(true); setError('');
    try { await api(`/support/tickets/${id}/messages`, { method: 'POST', body: { body: reply.trim() } }); setReply(''); await load(); }
    catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  }
  async function close() {
    setBusy(true); setError('');
    try { await api(`/support/tickets/${id}/close`, { method: 'POST' }); await load(); }
    catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  }

  if (!data) return <Screen edges={[]}>{error ? <Notice text={error} tone="error" /> : <Loading />}</Screen>;
  const { ticket, messages } = data;
  const closed = ticket.status === 'closed';
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Screen edges={[]} onRefresh={load}>
        <Stack.Screen options={{ title: ticket.reference }} />
        <Text style={s.title}>{ticket.subject}</Text>
        <Badge label={t(ticketStatusKey(ticket.status))} tone={closed ? 'neutral' : 'warn'} />
        {messages.filter(m => m.author !== 'system').map(m => {
          const mine = m.author === 'customer';
          return (
            <View key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '88%', gap: 4 }}>
              <Text style={[s.small, { textAlign: mine ? 'right' : 'left' }]}>{(mine ? t('help.you') : t('help.support')) + ' · ' + new Date(m.created_at).toLocaleString()}</Text>
              <View style={{ backgroundColor: mine ? colors.brand : '#fff', borderRadius: radius.lg, padding: space(3), borderWidth: mine ? 0 : 1, borderColor: colors.line }}>
                <Text style={{ color: mine ? '#fff' : colors.ink, fontSize: 15, lineHeight: 21 }} selectable>{m.body}</Text>
              </View>
            </View>
          );
        })}
        <Notice text={error} tone="error" />
        {!closed && <>
          <Field label="" value={reply} onChangeText={setReply} multiline placeholder={t('help.reply')} maxLength={5000} />
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            <Button variant="text" small title={t('help.close')} onPress={close} disabled={busy} />
            <Button small title={t('help.send')} onPress={send} busy={busy} disabled={!reply.trim()} />
          </View>
        </>}
      </Screen>
    </KeyboardAvoidingView>
  );
}
