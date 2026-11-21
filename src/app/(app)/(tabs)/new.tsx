import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, Button, Card, Field, Heading, Loading, Notice, Screen, Title, s, useErrorText } from '@/components/ui';
import { api, type Jurisdiction, type Matter, type Plan, type Question, type Template } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { confirmAndSubmit, documentPlan, money, openCheckout } from '@/lib/payment';
import { colors, space } from '@/lib/theme';

const PER_PAGE = 3;
const LANGUAGE_NAMES: Record<string, string> = { en: 'English', fr: 'Français', ar: 'العربية', es: 'Español', pt: 'Português', sw: 'Kiswahili', rw: 'Kinyarwanda', am: 'አማርኛ', so: 'Soomaali', ha: 'Hausa', yo: 'Yorùbá', zu: 'isiZulu', af: 'Afrikaans' };

export default function NewDocument() {
  const { t } = useI18n();
  const errorText = useErrorText();
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [countries, setCountries] = useState<Jurisdiction[]>([]);
  const [plan, setPlan] = useState<Plan>();
  const [tpl, setTpl] = useState<Template | null>(null);
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [country, setCountry] = useState('UG');
  const [region, setRegion] = useState('');
  const [docLang, setDocLang] = useState('en');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [phase, setPhase] = useState<'form' | 'paying' | 'waiting'>('form');
  const [matterId, setMatterId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ text: string; tone: 'info' | 'error' | 'ok' } | null>(null);
  const [query, setQuery] = useState('');
  const [picker, setPicker] = useState<'country' | 'lang' | null>(null);

  useFocusEffect(useCallback(() => {
    if (templates) return;
    Promise.all([api<Template[]>('/legal-templates'), api<{ data: Jurisdiction[] }>('/drafting-jurisdictions'), documentPlan()])
      .then(([tp, j, p]) => { setTemplates(tp); setCountries(j.data); setPlan(p); })
      .catch(e => { setNotice({ text: errorText(e), tone: 'error' }); setTemplates([]); });
  }, [templates])); // eslint-disable-line react-hooks/exhaustive-deps

  const sorted = useMemo(() => (templates ?? []).filter(x => x.slug !== 'custom_document').sort((a, b) => a.name.localeCompare(b.name)), [templates]);
  const custom = templates?.find(x => x.slug === 'custom_document');
  const jur = countries.find(c => c.code === country);
  const questions: Question[] = tpl?.question_schema ?? [];
  const pages = Math.max(1, Math.ceil(questions.length / PER_PAGE));
  const last = pages + 1; // 0 = details, 1..pages = questions, last = review
  const pageQs = questions.slice((step - 1) * PER_PAGE, step * PER_PAGE);
  const langs = Array.from(new Set([...(jur?.languages ?? ['en']), 'en']));

  function reset() {
    setTpl(null); setStep(0); setTitle(''); setAnswers({}); setConsent(false); setRegion(''); setPhase('form'); setMatterId(null); setNotice(null);
  }
  function choose(x: Template) { setTpl(x); setStep(0); setAnswers({}); setConsent(false); setNotice(null); }
  function next() {
    setNotice(null);
    if (step === 0 && (!title.trim() || (jur?.requires_region && !region.trim()))) return setNotice({ text: t('new.required'), tone: 'error' });
    if (step >= 1 && step <= pages && pageQs.some(q => q.required && !String(answers[q.key] ?? '').trim())) return setNotice({ text: t('new.required'), tone: 'error' });
    setStep(x => x + 1);
  }

  async function paySubmit() {
    if (!tpl || !plan) return;
    setPhase('paying'); setNotice(null);
    try {
      let id = matterId;
      if (!id) {
        const m = await api<Matter>('/matters', { method: 'POST', body: { title: title.trim(), legal_template_id: tpl.id, intake_data: answers, jurisdiction_code: country, governing_region: jur?.requires_region ? region.trim() : null, document_language: docLang } });
        id = m.id; setMatterId(id);
      }
      await openCheckout(id, plan);
      await waitForPayment(id);
    } catch (e) { setNotice({ text: errorText(e), tone: 'error' }); setPhase('form'); }
  }
  async function waitForPayment(id: number) {
    setPhase('waiting');
    const r = await confirmAndSubmit(id).catch(() => 'not_confirmed' as const);
    if (r === 'submitted') { reset(); router.navigate('/'); return; }
    setNotice({ text: t('new.notConfirmed'), tone: 'info' });
  }

  if (templates === null) return <Screen><Title>{t('new.title')}</Title><Loading /></Screen>;

  // Waiting for the payment to be confirmed.
  if (phase === 'waiting') return (
    <Screen>
      <Title sub={t('new.waitingText')}>{t('new.waiting')}</Title>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : <Loading />}
      {notice && <>
        <Button title={t('new.checkAgain')} onPress={() => { setNotice(null); void waitForPayment(matterId!); }} />
        <Button variant="outline" title={t('docs.title')} onPress={() => { reset(); router.navigate('/'); }} />
      </>}
    </Screen>
  );

  // Step: choose a document.
  if (!tpl) {
    const q = query.trim().toLowerCase();
    const list = q ? sorted.filter(x => (x.name + ' ' + x.category + ' ' + (x.description ?? '')).toLowerCase().includes(q)) : sorted;
    return (
      <Screen>
        <Title>{t('new.choose')}</Title>
        {notice && <Notice text={notice.text} tone={notice.tone} />}
        {custom && (
          <Card onPress={() => choose(custom)} style={{ borderStyle: 'dashed', borderColor: colors.brand, backgroundColor: colors.brandSoft }}>
            <View style={s.row}><Ionicons name="create-outline" size={22} color={colors.brand} /><Text style={[s.heading, { flex: 1, fontSize: 16 }]}>{t('new.custom')}</Text></View>
          </Card>
        )}
        <TextInput value={query} onChangeText={setQuery} placeholder={t('new.search')} placeholderTextColor="#9aa5a0" style={s.input} accessibilityLabel={t('new.search')} />
        {list.map(x => (
          <Card key={x.id} onPress={() => choose(x)}>
            <Text style={s.heading}>{x.name}</Text>
            {x.description ? <Body muted>{x.description}</Body> : null}
          </Card>
        ))}
      </Screen>
    );
  }

  const isCustom = tpl.slug === 'custom_document';
  return (
    <Screen>
      <View style={[s.row, { justifyContent: 'space-between' }]}>
        <Button variant="text" small title={'‹ ' + t('new.choose')} onPress={reset} />
        <Text style={s.small}>{step + 1} / {last + 1}</Text>
      </View>
      <Title sub={isCustom ? undefined : tpl.description ?? undefined}>{isCustom ? t('new.customTitle') : tpl.name}</Title>
      {notice && <Notice text={notice.text} tone={notice.tone} />}

      {step === 0 && <Card>
        <Heading>{t('new.details')}</Heading>
        <Field label={t('new.name')} value={title} onChangeText={setTitle} placeholder={t('new.namePh')} maxLength={180} />
        <Text style={s.label}>{t('new.country')}</Text>
        <Pressable onPress={() => setPicker('country')} style={[s.input, { justifyContent: 'center' }]} accessibilityRole="button">
          <Text style={{ fontSize: 16, color: colors.ink }}>{jur?.name ?? country}</Text>
        </Pressable>
        {jur?.requires_region && <Field label={jur.region_label || t('new.region')} value={region} onChangeText={setRegion} maxLength={120} />}
        {langs.length > 1 && <>
          <Text style={s.label}>{t('new.language')}</Text>
          <Pressable onPress={() => setPicker('lang')} style={[s.input, { justifyContent: 'center' }]} accessibilityRole="button">
            <Text style={{ fontSize: 16, color: colors.ink }}>{LANGUAGE_NAMES[docLang] ?? docLang}</Text>
          </Pressable>
        </>}
      </Card>}

      {step >= 1 && step <= pages && <Card>
        <Heading>{t('new.questions', { a: step, b: pages })}</Heading>
        {pageQs.map(q => (
          <Field key={q.key} label={q.label + (q.required ? ' *' : '')} value={answers[q.key] ?? ''} onChangeText={v => setAnswers(a => ({ ...a, [q.key]: v }))}
            multiline={q.type === 'textarea'} keyboardType={q.type === 'number' ? 'decimal-pad' : q.type === 'email' ? 'email-address' : 'default'}
            autoCapitalize={q.type === 'email' ? 'none' : 'sentences'} placeholder={q.type === 'date' ? 'YYYY-MM-DD' : undefined} maxLength={10000} />
        ))}
      </Card>}

      {step === last && <>
        <Card>
          <Heading>{t('new.review')}</Heading>
          <Row label={t('new.name')} value={title} />
          <Row label={t('new.country')} value={(jur?.requires_region && region ? region + ', ' : '') + (jur?.name ?? country)} />
          <Row label={t('new.language')} value={LANGUAGE_NAMES[docLang] ?? docLang} />
          {questions.map(q => <Row key={q.key} label={q.label} value={answers[q.key] || t('new.notProvided')} />)}
        </Card>
        <Pressable onPress={() => setConsent(c => !c)} style={[s.row, { alignItems: 'flex-start' }]} accessibilityRole="checkbox" accessibilityState={{ checked: consent }}>
          <Ionicons name={consent ? 'checkbox' : 'square-outline'} size={24} color={colors.brand} />
          <Text style={[s.body, { flex: 1, fontSize: 15 }]}>{t('new.confirm')}</Text>
        </Pressable>
        <Card style={{ backgroundColor: colors.brandSoft, borderColor: colors.brandSoft }}>
          <Text style={s.heading}>{t('new.price', { price: money(plan?.amount_usd) })}</Text>
          <Body muted>{t('new.payNote')}</Body>
        </Card>
      </>}

      <View style={[s.row, { justifyContent: 'space-between' }]}>
        {step > 0 ? <Button variant="outline" title={t('common.back')} onPress={() => { setNotice(null); setStep(x => x - 1); }} /> : <View />}
        {step < last
          ? <Button title={t('common.next')} onPress={next} />
          : <Button title={phase === 'paying' ? t('new.opening') : t('new.paySubmit')} onPress={paySubmit} busy={phase === 'paying'} disabled={!consent || !plan} />}
      </View>

      <Picker visible={picker === 'country'} title={t('new.country')} onClose={() => setPicker(null)}
        items={countries.map(c => ({ value: c.code, label: c.name }))} selected={country}
        onSelect={v => { setCountry(v); setRegion(''); setDocLang('en'); setPicker(null); }} />
      <Picker visible={picker === 'lang'} title={t('new.language')} onClose={() => setPicker(null)}
        items={langs.map(l => ({ value: l, label: LANGUAGE_NAMES[l] ?? l }))} selected={docLang} onSelect={v => { setDocLang(v); setPicker(null); }} />
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <View style={{ gap: 2, paddingVertical: space(1.5), borderBottomWidth: 1, borderBottomColor: colors.line }}><Text style={s.small}>{label}</Text><Text style={s.body}>{value}</Text></View>;
}

function Picker({ visible, title, items, selected, onSelect, onClose }: {
  visible: boolean; title: string; items: { value: string; label: string }[]; selected: string; onSelect: (v: string) => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const shown = q ? items.filter(i => i.label.toLowerCase().includes(q.toLowerCase())) : items;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={[s.row, { justifyContent: 'space-between', padding: space(4) }]}>
          <Text style={s.heading}>{title}</Text>
          <Button variant="text" small title={t('common.close')} onPress={onClose} />
        </View>
        {items.length > 8 && <TextInput value={q} onChangeText={setQ} placeholder={t('new.search')} placeholderTextColor="#9aa5a0" style={[s.input, { marginHorizontal: space(4), marginBottom: space(2) }]} />}
        <FlatList data={shown} keyExtractor={i => i.value} keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable onPress={() => onSelect(item.value)} style={{ paddingHorizontal: space(4), paddingVertical: space(3.5), borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: item.value === selected ? colors.brandSoft : 'transparent' }}>
              <Text style={s.body}>{item.label}</Text>
              {item.value === selected && <Ionicons name="checkmark" size={20} color={colors.brand} />}
            </Pressable>
          )} />
      </SafeAreaView>
    </Modal>
  );
}

