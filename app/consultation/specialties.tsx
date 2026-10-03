import { useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Text, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { useSpecialties } from '@/hooks/useConsultations';

export default function SpecialtiesScreen() {
  const router = useRouter();
  const { specialties, isLoading, error } = useSpecialties();

  const handleSelectSpecialty = useCallback(
    (specialtyId: string) => {
      router.push({
        pathname: '/consultation/book',
        params: { specialtyId },
      });
    },
    [router],
  );

  if (isLoading) {
    return (
      <ScreenContainer title="Specialties" subtitle="Browse doctors by specialty.">
        <ActivityIndicator style={styles.loader} />
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer title="Specialties" subtitle="Browse doctors by specialty.">
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.errorText}>{error}</Text>
          </Card.Content>
        </Card>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title="Specialties" subtitle="Browse doctors by specialty.">
      <FlatList
        data={specialties}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.card} onPress={() => handleSelectSpecialty(item.id)}>
            <Card.Content>
              <Text style={styles.title}>{item.name}</Text>
              {item.description && <Text style={styles.description}>{item.description}</Text>}
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No specialties available</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#64748B',
  },
  loader: {
    paddingVertical: 24,
  },
  empty: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 14,
  },
});
