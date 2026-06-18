import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Body, Caption, Title } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { Radii, Spacing, useColors } from '@/constants/theme';

type MemoryRow = {
  id: string;
  label: string;
  detail: string;
};

type MemorySectionCardProps = {
  title: string;
  iconName: keyof typeof Ionicons.glyphMap;
  rows: MemoryRow[];
  emptyMessage?: string;
};

export function MemorySectionCard({
  title,
  iconName,
  rows,
  emptyMessage = 'Все още няма записи.',
}: MemorySectionCardProps) {
  const c = useColors();
  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Title>{title}</Title>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Редактирай"
          onPress={() => Alert.alert('Редактирането предстои')}
          style={styles.editButton}
        >
          <Ionicons name="create-outline" size={20} color={c.accent} />
        </Pressable>
      </View>

      {rows.length === 0 ? <Caption>{emptyMessage}</Caption> : null}

      {rows.map((row, index) => (
        <View key={row.id}>
          {index > 0 ? <Divider /> : null}
          <View style={styles.row}>
            <View style={[styles.iconBadge, { backgroundColor: c.fill }]}>
              <Ionicons name={iconName} size={16} color={c.label} />
            </View>
            <View style={styles.rowText}>
              <Body style={styles.primary}>{row.label}</Body>
              <Caption>{row.detail}</Caption>
            </View>
          </View>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.lg,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.md,
  },
  iconBadge: {
    alignItems: 'center',
    borderRadius: Radii.sm,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  primary: {
    fontWeight: '600',
  },
});
