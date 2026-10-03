import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

type Props = {
  title: string;
  description?: string;
  icon?: ReactNode;
};

export function PlaceholderCard({ title, description, icon }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.icon}>{icon}</View>
      <Text variant="titleMedium">{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  icon: {
    alignSelf: 'flex-start',
  },
  description: {
    color: '#64748B',
  },
});

