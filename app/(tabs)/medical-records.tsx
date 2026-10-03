import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { Link } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { PlaceholderCard } from '@/components/layout/PlaceholderCard';

export default function MedicalRecordsTab() {
  return (
    <ScreenContainer title="Medical records" subtitle="Securely store lab results, prescriptions, and reports.">
      <View style={styles.list}>
        <PlaceholderCard
          title="No records uploaded"
          description="Upload PDFs, images, or notes to keep everything in one place."
        />
      </View>
      <Link href="/medical-records/upload" asChild>
        <Button mode="contained">Upload a record</Button>
      </Link>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 16,
    marginBottom: 24,
  },
});

