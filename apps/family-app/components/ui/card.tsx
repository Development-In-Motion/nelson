import { View, StyleSheet, Platform, type StyleProp, type ViewStyle } from 'react-native';

import { Radii, Spacing, useColors } from '@/constants/theme';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Use the grouped background fill instead of a raised card surface. */
  inset?: boolean;
};

/** iOS grouped section surface — rounded, with a very subtle iOS shadow. */
export function Card({ children, style, inset = false }: CardProps) {
  const c = useColors();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: inset ? c.bg : c.card },
        !inset && styles.shadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.lg,
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  shadow: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
    default: {},
  }) as object,
});
