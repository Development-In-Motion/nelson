import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Palette, Radii, Spacing } from '@/constants/theme';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Use a faint inset fill instead of a plain surface. */
  inset?: boolean;
};

/** Flat, hairline-bordered container — no shadow/elevation (off-brand). */
export function Card({ children, style, inset = false }: CardProps) {
  return <View style={[styles.card, inset && styles.inset, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.surface,
    borderColor: Palette.line,
    borderRadius: Radii.lg,
    borderWidth: 1,
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  inset: {
    backgroundColor: Palette.surfaceAlt,
  },
});
