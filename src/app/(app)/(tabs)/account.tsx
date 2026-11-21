import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { Body, Button, Card, Field, Heading, Notice, Screen, Title, useErrorText } from '@/components/ui';
import { api, type User } from '@/lib/api';
import { SITE_URL } from '@/lib/config';
import { LANGS, useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { colors, radius, space } from '@/lib/theme';

export default function Account() {
  const { t, lang, setLang } = useI18n();
  const { user, setUser, signOut } = useSession();
  const errorText = useErrorText();
  const [form, setForm] = useState({ name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '', business_name: user?.business_name ?? '' });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: 'error' | 'ok' | 'info' } | null>(null);
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    setBusy(true); setNotice(null);
    try {
      const u = await api<User>('/me', { method: 'PUT', body: { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || null, business_name: form.business_name.trim() || null } });
      setUser(u); setNotice({ text: t('account.saved'), tone: 'ok' });
    } catch (e) { setNotice({ text: errorText(e), tone: 'error' }); } finally { setBusy(false); }
  }
  async function changeLang(code: (typeof LANGS)[number]['code']) {
    if (await setLang(code)) Alert.alert(t('account.language'), t('account.rtl'));
  }
  const open = (path: string) => WebBrowser.openBrowserAsync(`${SITE_URL}${path}${path.includes('?') ? '&' : '?'}lang=${lang}`);

  return (
    <Screen>
      <Title sub={user?.email ?? user?.phone ?? undefined}>{t('account.title')}</Title>
      {!user?.email && <Notice text={t('account.needsEmail')} tone="info" />}
      <Card>
        <Heading>{t('account.profile')}</Heading>
        <Field label={t('account.name')} value={form.name} onChangeText={set('name')} autoComplete="name" />
        <Field label={t('account.email')} value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <Field label={t('account.phone')} value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" autoComplete="tel" />
        <Field label={t('account.org')} value={form.business_name} onChangeText={set('business_name')} />
        {notice && <Notice text={notice.text} tone={notice.tone} />}
        <Button title={t('common.save')} onPress={save} busy={busy} disabled={!form.name.trim() || !form.email.includes('@')} />
      </Card>
      <Card>
        <Heading>{t('account.language')}</Heading>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space(2) }}>
          {LANGS.map(l => (
            <Pressable key={l.code} onPress={() => changeLang(l.code)} accessibilityRole="radio" accessibilityState={{ selected: lang === l.code }}
              style={{ paddingHorizontal: space(3.5), paddingVertical: space(2), borderRadius: radius.pill, borderWidth: 1, borderColor: lang === l.code ? colors.brand : colors.line, backgroundColor: lang === l.code ? colors.brandSoft : '#fff' }}>
              <Text style={{ fontWeight: '600', color: lang === l.code ? colors.brand : colors.ink }}>{l.label}</Text>
            </Pressable>
          ))}
        </View>
      </Card>
      <Card>
        <Heading>{t('account.legal')}</Heading>
        <Button variant="text" small title={t('signin.terms')} onPress={() => open('/terms')} />
        <Button variant="text" small title={t('signin.privacy')} onPress={() => open('/privacy')} />
        <Button variant="text" small title={t('account.website')} onPress={() => open('/')} />
      </Card>
      <Button variant="outline" title={t('account.signOut')} onPress={signOut} />
      <Body muted style={{ textAlign: 'center' }}>FormLex · Kodata Ltd</Body>
    </Screen>
  );
}
