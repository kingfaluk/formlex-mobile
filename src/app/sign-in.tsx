import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';

import { Body, Button, Card, Field, Notice, Screen, Segmented, s, useErrorText } from '@/components/ui';
import { api, type User } from '@/lib/api';
import { SITE_URL } from '@/lib/config';
import { LANGS, useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { colors, space } from '@/lib/theme';

const CODES = [['256', 'UG'], ['254', 'KE'], ['255', 'TZ'], ['250', 'RW'], ['211', 'SS'], ['234', 'NG'], ['233', 'GH'], ['27', 'ZA'], ['971', 'AE'], ['44', 'GB'], ['1', 'US']] as const;
type Auth = { token: string; user: User };

export default function SignIn() {
  const { t, lang, setLang } = useI18n();
  const [method, setMethod] = useState<'whatsapp' | 'email'>('whatsapp');
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen edges={['top', 'bottom']}>
        <View style={{ alignItems: 'center', gap: space(2), marginTop: space(6), marginBottom: space(2) }}>
          <Image source={require('@/assets/images/icon.png')} style={{ width: 64, height: 64, borderRadius: 14 }} />
          <Text style={[s.title, { textAlign: 'center' }]}>{t('signin.title')}</Text>
          <Body muted style={{ textAlign: 'center' }}>{t('app.tagline')}</Body>
        </View>
        <Segmented value={method} onChange={setMethod} options={[{ value: 'whatsapp', label: t('signin.whatsapp') }, { value: 'email', label: t('signin.email') }]} />
        <Card>{method === 'whatsapp' ? <WhatsAppSignIn /> : <EmailSignIn />}</Card>
        <Text style={[s.small, { textAlign: 'center' }]}>
          {t('signin.agree')}{' '}
          <Text style={{ color: colors.brand, fontWeight: '600' }} onPress={() => WebBrowser.openBrowserAsync(`${SITE_URL}/terms?lang=${lang}`)}>{t('signin.terms')}</Text>
          {' · '}
          <Text style={{ color: colors.brand, fontWeight: '600' }} onPress={() => WebBrowser.openBrowserAsync(`${SITE_URL}/privacy?lang=${lang}`)}>{t('signin.privacy')}</Text>
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space(2) }}>
          {LANGS.map(l => (
            <Pressable key={l.code} onPress={() => setLang(l.code)} style={{ paddingHorizontal: space(2), paddingVertical: space(1) }}>
              <Text style={{ color: l.code === lang ? colors.brand : colors.muted, fontWeight: l.code === lang ? '700' : '500' }}>{l.label}</Text>
            </Pressable>
          ))}
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

function WhatsAppSignIn() {
  const { t } = useI18n();
  const { signIn } = useSession();
  const errorText = useErrorText();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [cc, setCc] = useState<string>('256');
  const [number, setNumber] = useState('');
  const [challenge, setChallenge] = useState<{ id: string; phone: string } | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => { api<{ available: boolean }>('/auth/whatsapp/status').then(d => setAvailable(d.available)).catch(() => setAvailable(false)); }, []);
  useEffect(() => { if (!wait) return; const id = setTimeout(() => setWait(n => Math.max(0, n - 1)), 1000); return () => clearTimeout(id); }, [wait]);

  const phone = number.trim().startsWith('+') ? '+' + number.replace(/\D/g, '') : '+' + cc + number.replace(/\D/g, '').replace(/^0+/, '');
  const valid = /^\+[1-9][0-9]{7,14}$/.test(phone);

  async function send() {
    setBusy(true); setError('');
    try {
      const d = await api<{ challenge_id: string; resend_after?: number }>('/auth/whatsapp/request', { method: 'POST', body: { phone } });
      setChallenge({ id: d.challenge_id, phone }); setCode(''); setWait(d.resend_after ?? 60);
    } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  }
  async function verify() {
    setBusy(true); setError('');
    try {
      const d = await api<Auth>('/auth/whatsapp/verify', { method: 'POST', body: { challenge_id: challenge!.id, code } });
      await signIn(d.token, d.user);
    } catch (e) { setError(errorText(e)); setBusy(false); }
  }

  if (!challenge) return (
    <View style={{ gap: space(3) }}>
      <Text style={s.label}>{t('signin.phone')}</Text>
      <View style={[s.row, { gap: space(2) }]}>
        <Pressable onPress={() => { const i = CODES.findIndex(c => c[0] === cc); setCc(CODES[(i + 1) % CODES.length][0]); }}
          style={[s.input, { justifyContent: 'center', minWidth: 92 }]} accessibilityLabel="Country code" accessibilityHint="Tap to change">
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink }}>{CODES.find(c => c[0] === cc)?.[1]} +{cc}</Text>
        </Pressable>
        <View style={{ flex: 1 }}><Field label="" value={number} onChangeText={setNumber} keyboardType="phone-pad" autoComplete="tel" placeholder="772 123 456" style={{ writingDirection: 'ltr' }} /></View>
      </View>
      <Body muted>{available === false ? t('signin.unavailable') : t('signin.phoneHint')}</Body>
      <Notice text={error} tone="error" />
      <Button title={busy ? t('signin.sending') : t('signin.sendCode')} onPress={send} disabled={!valid || available !== true || wait > 0} busy={busy} />
    </View>
  );
  return (
    <View style={{ gap: space(3) }}>
      <Body muted>{t('signin.codeSent', { phone: challenge.phone })}</Body>
      <Field label={t('signin.code')} value={code} onChangeText={v => setCode(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" maxLength={6} autoFocus
        style={{ fontSize: 24, letterSpacing: 8, textAlign: 'center' }} />
      <Notice text={error} tone="error" />
      <Button title={busy ? t('signin.verifying') : t('signin.verify')} onPress={verify} disabled={code.length !== 6} busy={busy} />
      <View style={[s.row, { justifyContent: 'space-between' }]}>
        <Button variant="text" small title={wait > 0 ? t('signin.resendIn', { n: wait }) : t('signin.resend')} onPress={send} disabled={busy || wait > 0} />
        <Button variant="text" small title={t('signin.changeNumber')} onPress={() => { setChallenge(null); setCode(''); setError(''); }} />
      </View>
    </View>
  );
}

function EmailSignIn() {
  const { t, lang } = useI18n();
  const { signIn } = useSession();
  const errorText = useErrorText();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [f, setF] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof typeof f) => (v: string) => setF(x => ({ ...x, [k]: v }));

  async function submit() {
    setBusy(true); setError('');
    try {
      const d = mode === 'login'
        ? await api<Auth>('/auth/login', { method: 'POST', body: { email: f.email.trim(), password: f.password, zone: 'portal' } })
        : await api<Auth>('/auth/register', { method: 'POST', body: { name: f.name.trim(), email: f.email.trim(), password: f.password, password_confirmation: f.password_confirmation } });
      await signIn(d.token, d.user);
    } catch (e) { setError(errorText(e)); setBusy(false); }
  }
  const ok = f.email.includes('@') && f.password.length >= 8 && (mode === 'login' || (f.name.trim().length > 1 && f.password === f.password_confirmation));
  return (
    <View style={{ gap: space(3) }}>
      {mode === 'register' && <Field label={t('signin.name')} value={f.name} onChangeText={set('name')} autoComplete="name" textContentType="name" />}
      <Field label={t('signin.emailLabel')} value={f.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
      <Field label={t('signin.password')} value={f.password} onChangeText={set('password')} secureTextEntry autoComplete={mode === 'login' ? 'current-password' : 'new-password'} textContentType={mode === 'login' ? 'password' : 'newPassword'} />
      {mode === 'register' && <Field label={t('signin.confirm')} value={f.password_confirmation} onChangeText={set('password_confirmation')} secureTextEntry autoComplete="new-password" />}
      <Notice text={error} tone="error" />
      <Button title={mode === 'login' ? t('signin.submit') : t('signin.createSubmit')} onPress={submit} disabled={!ok} busy={busy} />
      <Button variant="text" small title={mode === 'login' ? t('signin.create') : t('signin.haveAccount')} onPress={() => { setMode(m => (m === 'login' ? 'register' : 'login')); setError(''); }} />
      {mode === 'login' && <Button variant="text" small title={t('signin.forgot')} onPress={() => WebBrowser.openBrowserAsync(`${SITE_URL}/portal/forgot-password?lang=${lang}`)} />}
    </View>
  );
}
