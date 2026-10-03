import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

type Props = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  rightAction?: ReactNode;
};

export function ScreenContainer({ title, subtitle, children, rightAction }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View>
          <Text variant="headlineMedium">{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {rightAction}
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  subtitle: {
    color: '#64748B',
  },
  content: {
    paddingBottom: 32,
  },
});

