import { View, StyleSheet } from 'react-native';
import { Button, List } from 'react-native-paper';
import { Link } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';

export default function ProfileTab() {
  return (
    <ScreenContainer title="Profile" subtitle="Quick links to your settings and personal info.">
      <View style={styles.section}>
        <List.Section>
          <Link href="/settings/profile" asChild>
            <List.Item title="Personal details" description="Name, DOB, contact, demographics" />
          </Link>
          <Link href="/settings/devices" asChild>
            <List.Item title="Connected devices" description="Pair or remove BLE sensors" />
          </Link>
          <Link href="/settings/notifications" asChild>
            <List.Item title="Notifications" description="Reminders, alerts, and push prefs" />
          </Link>
          <Link href="/settings/emergency" asChild>
            <List.Item title="Emergency info" description="Caregivers, SOS workflows" />
          </Link>
        </List.Section>
      </View>
      <Button mode="outlined" onPress={() => {}}>
        Log out
      </Button>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
});

