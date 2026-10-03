import { useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { PlaceholderCard } from '@/components/layout/PlaceholderCard';

export default function MedicineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScreenContainer title="Medicine detail" subtitle={`Medicine ID: ${id}`}>
      <PlaceholderCard
        title="Detail view coming"
        description="Dosage, schedule, reminder history, and refill info will live here."
      />
    </ScreenContainer>
  );
}

