import { Stack } from 'expo-router';

import { useI18n } from '@/lib/i18n';
import { colors } from '@/lib/theme';

/** Signed-in area: the tabs, plus document and ticket screens opened from them. */
export default function AppLayout() {
  const { t } = useI18n();
  return (
    <Stack screenOptions={{ headerTintColor: colors.brand, headerStyle: { backgroundColor: colors.bg }, headerShadowVisible: false, contentStyle: { backgroundColor: colors.bg }, headerBackTitle: t('common.back') }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="document/[id]" options={{ title: '' }} />
      <Stack.Screen name="ticket/[id]" options={{ title: '' }} />
    </Stack>
  );
}
