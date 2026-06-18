import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Radii, Spacing, useColors } from '@/constants/theme';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Use the grouped background fill instead of a raised card surface. */
  inset?: boolean;
};

/** Flat iOS grouped surface — generous radius, no shadow (minimal). */
export function Card({ children, style, inset = false }: CardProps) {
  const c = useColors();
  return (
    <View style={[styles.card, { backgroundColor: inset ? c.bg : c.card }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.xl,
    gap: Spacing.md,
    padding: Spacing.lg,
  },
});
