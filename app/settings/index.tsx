import { List } from 'react-native-paper';
import { Link } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';

export default function SettingsHomeScreen() {
  return (
    <ScreenContainer title="Settings" subtitle="Customize your ABRAZO experience.">
      <List.Section>
        <Link href="/settings/profile" asChild>
          <List.Item title="Profile" description="Personal details" />
        </Link>
        <Link href="/settings/devices" asChild>
          <List.Item title="Devices" description="Connected BLE sensors" />
        </Link>
        <Link href="/settings/notifications" asChild>
          <List.Item title="Notifications" description="Reminders & alerts" />
        </Link>
        <Link href="/settings/emergency" asChild>
          <List.Item title="Emergency" description="Caregivers & SOS" />
        </Link>
      </List.Section>
    </ScreenContainer>
  );
}

