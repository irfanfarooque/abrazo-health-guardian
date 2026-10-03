import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { Link } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { PlaceholderCard } from '@/components/layout/PlaceholderCard';

export default function ConsultationsTab() {
  return (
    <ScreenContainer title="Consultations" subtitle="Manage upcoming visits and requests.">
      <View style={styles.list}>
        <PlaceholderCard
          title="No consultations yet"
          description="Book your first consultation by choosing a specialty or doctor."
        />
      </View>
      <Link href="/consultation/book" asChild>
        <Button mode="contained">Book a consultation</Button>
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

