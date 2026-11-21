/* Small set of FormLex UI building blocks used by every screen. */
import React from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useI18n } from '@/lib/i18n';
import { colors, radius, space } from '@/lib/theme';

export function Screen({ children, refreshing, onRefresh, scroll = true, edges = ['top'] }: {
  children: React.ReactNode; refreshing?: boolean; onRefresh?: () => void; scroll?: boolean; edges?: ('top' | 'bottom')[];
}) {
  return (
    <SafeAreaView style={s.screen} edges={edges}>
      {scroll ? (
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.brand} /> : undefined}>
          {children}
        </ScrollView>
      ) : <View style={[s.content, { flex: 1 }]}>{children}</View>}
    </SafeAreaView>
  );
}

export function Title({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return <View style={{ gap: space(1), marginBottom: space(2) }}><Text style={s.title}>{children}</Text>{sub ? <Text style={s.muted}>{sub}</Text> : null}</View>;
}
export function Heading({ children }: { children: React.ReactNode }) { return <Text style={s.heading}>{children}</Text>; }
export function Body({ children, muted, style }: { children: React.ReactNode; muted?: boolean; style?: object }) { return <Text style={[muted ? s.muted : s.body, style]}>{children}</Text>; }

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void }) {
  if (onPress) return <Pressable onPress={onPress} style={({ pressed }) => [s.card, style, pressed && { opacity: 0.85 }]}>{children}</Pressable>;
  return <View style={[s.card, style]}>{children}</View>;
}

export function Button({ title, onPress, variant = 'primary', disabled, busy, small }: {
  title: string; onPress: () => void; variant?: 'primary' | 'outline' | 'text' | 'danger'; disabled?: boolean; busy?: boolean; small?: boolean;
}) {
  const st = variant === 'primary' ? s.btnPrimary : variant === 'outline' ? s.btnOutline : variant === 'danger' ? s.btnDanger : s.btnText;
  const tc = variant === 'primary' || variant === 'danger' ? '#fff' : colors.brand;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled || busy}
      style={({ pressed }) => [s.btn, small && s.btnSmall, st, (disabled || busy) && { opacity: 0.5 }, pressed && { opacity: 0.8 }]}>
      {busy ? <ActivityIndicator color={tc} /> : <Text style={[s.btnLabel, small && { fontSize: 14 }, { color: tc }]}>{title}</Text>}
    </Pressable>
  );
}

export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ gap: space(1.5) }}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <TextInput placeholderTextColor="#9aa5a0" {...props} style={[s.input, props.multiline && { minHeight: 110, textAlignVertical: 'top' }, props.style]} />
      {hint ? <Text style={s.small}>{hint}</Text> : null}
    </View>
  );
}

export function Notice({ text, tone = 'info' }: { text?: string | null; tone?: 'info' | 'error' | 'ok' }) {
  if (!text) return null;
  const bg = tone === 'error' ? colors.dangerSoft : tone === 'ok' ? colors.okSoft : colors.brandSoft;
  const fg = tone === 'error' ? colors.danger : tone === 'ok' ? colors.ok : colors.ink;
  return <View style={[s.notice, { backgroundColor: bg }]} accessibilityRole="alert"><Text style={{ color: fg, fontSize: 14, lineHeight: 20 }}>{text}</Text></View>;
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'ok' | 'warn' | 'danger' }) {
  const map = { neutral: [colors.brandSoft, colors.brand], ok: [colors.okSoft, colors.ok], warn: [colors.warnSoft, colors.warn], danger: [colors.dangerSoft, colors.danger] } as const;
  return <View style={[s.badge, { backgroundColor: map[tone][0] }]}><Text style={[s.badgeText, { color: map[tone][1] }]}>{label}</Text></View>;
}

export function Empty({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return <Card style={{ alignItems: 'center', gap: space(2), paddingVertical: space(8) }}><Text style={s.heading}>{title}</Text>{text ? <Text style={[s.muted, { textAlign: 'center' }]}>{text}</Text> : null}{action}</Card>;
}

export function Loading() {
  return <View style={{ padding: space(10), alignItems: 'center' }}><ActivityIndicator color={colors.brand} size="large" /></View>;
}

/** Turns an API error into a readable, translated message. */
export function useErrorText() {
  const { t } = useI18n();
  return (e: any) => (e?.message === 'offline' ? t('common.offline') : !e?.message || e.message === 'error' ? t('common.error') : String(e.message));
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <View style={s.segment}>
      {options.map(o => (
        <Pressable key={o.value} onPress={() => onChange(o.value)} style={[s.segmentItem, value === o.value && s.segmentOn]} accessibilityRole="tab" accessibilityState={{ selected: value === o.value }}>
          <Text style={[s.segmentText, value === o.value && { color: colors.ink }]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space(4), gap: space(3), paddingBottom: space(10) },
  title: { fontSize: 28, fontWeight: '700', color: colors.ink, textAlign: 'left' },
  heading: { fontSize: 18, fontWeight: '700', color: colors.ink, textAlign: 'left' },
  body: { fontSize: 16, lineHeight: 23, color: colors.ink, textAlign: 'left' },
  muted: { fontSize: 15, lineHeight: 21, color: colors.muted, textAlign: 'left' },
  small: { fontSize: 13, lineHeight: 18, color: colors.muted, textAlign: 'left' },
  label: { fontSize: 14, fontWeight: '600', color: colors.ink, textAlign: 'left' },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: space(4), gap: space(2) },
  btn: { minHeight: 50, borderRadius: radius.pill, paddingHorizontal: space(5), alignItems: 'center', justifyContent: 'center' },
  btnSmall: { minHeight: 38, paddingHorizontal: space(4) },
  btnPrimary: { backgroundColor: colors.brand },
  btnOutline: { borderWidth: 1, borderColor: colors.brand, backgroundColor: '#fff' },
  btnDanger: { backgroundColor: colors.danger },
  btnText: { backgroundColor: 'transparent', minHeight: 40 },
  btnLabel: { fontSize: 16, fontWeight: '700' },
  input: { minHeight: 50, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingHorizontal: space(3), paddingVertical: space(3), fontSize: 16, color: colors.ink, backgroundColor: '#fff', textAlign: 'left' },
  notice: { borderRadius: radius.md, padding: space(3) },
  badge: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: space(2.5), paddingVertical: space(1) },
  badgeText: { fontSize: 12, fontWeight: '700' },
  segment: { flexDirection: 'row', backgroundColor: '#efece3', borderRadius: radius.pill, padding: 4 },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: space(2.5), borderRadius: radius.pill },
  segmentOn: { backgroundColor: '#fff' },
  segmentText: { fontWeight: '600', color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
});
