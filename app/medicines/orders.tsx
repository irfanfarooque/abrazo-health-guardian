import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { PlaceholderCard } from '@/components/layout/PlaceholderCard';

export default function MedicineOrdersScreen() {
  return (
    <ScreenContainer title="Orders" subtitle="Track pharmacy orders and fulfillment.">
      <PlaceholderCard
        title="No orders placed"
        description="Future releases will integrate with pharmacy APIs for quick re-orders."
      />
    </ScreenContainer>
  );
}

