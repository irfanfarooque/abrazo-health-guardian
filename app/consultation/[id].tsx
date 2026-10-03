import { useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { PlaceholderCard } from '@/components/layout/PlaceholderCard';

export default function ConsultationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScreenContainer title="Consultation detail" subtitle={`Consultation ID: ${id}`}>
      <PlaceholderCard
        title="Details coming soon"
        description="This screen will show doctor information, notes, prescriptions, and follow-up actions."
      />
    </ScreenContainer>
  );
}

