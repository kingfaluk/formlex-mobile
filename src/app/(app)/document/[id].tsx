import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

import { Badge, Body, Button, Card, Field, Loading, Notice, Screen, Title, s, useErrorText } from '@/components/ui';
import { api, downloadAndShare, type Doc, type Paged } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { space } from '@/lib/theme';

type Revision = { id: number; status: string; message: string; created_at: string };

export default function DocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const errorText = useErrorText();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [busy, setBusy] = useState<'pdf' | 'docx' | 'rev' | null>(null);
  const [note, setNote] = useState('');
  const [notice, setNotice] = useState<{ text: string; tone: 'error' | 'ok' } | null>(null);

  const load = useCallback(async () => {
    try {
      // The list has every document; the full text is only available once approved.
      const list = await api<Paged<Doc>>('/documents');
      const meta = list.data.find(d => String(d.id) === id) ?? null;
      if (meta?.status === 'approved') setDoc(await api<Doc>(`/documents/${id}`)); else setDoc(meta);
      setRevisions(await api<Revision[]>(`/workspace/documents/${id}/revisions`).catch(() => []));
    } catch (e) { setNotice({ text: errorText(e), tone: 'error' }); }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function download(format: 'pdf' | 'docx') {
    if (!doc) return;
    setBusy(format); setNotice(null);
    try {
      const mime = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      await downloadAndShare(`/workspace/documents/${doc.id}/export?format=${format}`, `${doc.title}-v${doc.version}.${format}`, mime);
    } catch (e) { setNotice({ text: errorText(e), tone: 'error' }); } finally { setBusy(null); }
  }
  async function requestRevision() {
    setBusy('rev'); setNotice(null);
    try {
      await api(`/workspace/documents/${id}/revisions`, { method: 'POST', body: { message: note.trim() } });
      setNote(''); setNotice({ text: t('doc.revisionSent'), tone: 'ok' }); await load();
    } catch (e) { setNotice({ text: errorText(e), tone: 'error' }); } finally { setBusy(null); }
  }

  if (!doc) return <Screen edges={[]}>{notice ? <Notice text={notice.text} tone={notice.tone} /> : <Loading />}</Screen>;
  const approved = doc.status === 'approved';
  const canRevise = ['approved', 'changes_requested'].includes(doc.status) && !revisions.some(r => r.status === 'pending');
  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: doc.title }} />
      <Title sub={t('docs.version', { n: doc.version })}>{doc.title}</Title>
      <Badge label={approved ? t('docs.approved') : doc.status === 'changes_requested' ? t('docs.changes') : t('docs.inReview')} tone={approved ? 'ok' : 'warn'} />
      {notice && <Notice text={notice.text} tone={notice.tone} />}
      {approved ? <>
        <View style={{ gap: space(2) }}>
          <Button title={busy === 'pdf' ? t('doc.preparing') : t('doc.downloadPdf')} onPress={() => download('pdf')} busy={busy === 'pdf'} disabled={!!busy} />
          <Button variant="outline" title={busy === 'docx' ? t('doc.preparing') : t('doc.downloadWord')} onPress={() => download('docx')} busy={busy === 'docx'} disabled={!!busy} />
        </View>
        {doc.content ? <Card><Text style={[s.body, { fontSize: 15 }]} selectable>{doc.content}</Text></Card> : null}
      </> : <Card><Body>{t('doc.locked')}</Body></Card>}
      {canRevise && (
        <Card>
          <Text style={s.heading}>{t('doc.revision')}</Text>
          <Field label="" value={note} onChangeText={setNote} multiline hint={t('doc.revisionHint')} />
          <Button variant="outline" title={t('doc.revisionSend')} onPress={requestRevision} busy={busy === 'rev'} disabled={note.trim().length < 10 || !!busy} />
        </Card>
      )}
    </Screen>
  );
}
