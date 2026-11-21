import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { useI18n } from '@/lib/i18n';
import { colors } from '@/lib/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
function TabIcon({ name, color, size }: { name: IconName; color: ColorValue; size: number }) {
  return <Ionicons name={name} color={String(color ?? '')} size={size} />;
}
const icon = (name: IconName) => function Icon({ color, size }: { color: ColorValue; size: number }) { return <TabIcon name={name} color={color} size={size} />; };

export default function TabsLayout() {
  const { t } = useI18n();
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.brand, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: '#fff', borderTopColor: colors.line } }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.documents'), tabBarIcon: icon('documents-outline') }} />
      <Tabs.Screen name="new" options={{ title: t('tabs.new'), tabBarIcon: icon('add-circle-outline') }} />
      <Tabs.Screen name="payments" options={{ title: t('tabs.payments'), tabBarIcon: icon('card-outline') }} />
      <Tabs.Screen name="help" options={{ title: t('tabs.help'), tabBarIcon: icon('chatbubbles-outline') }} />
      <Tabs.Screen name="account" options={{ title: t('tabs.account'), tabBarIcon: icon('person-circle-outline') }} />
    </Tabs>
  );
}
