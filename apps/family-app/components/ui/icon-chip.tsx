import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Radii, useColors } from '@/constants/theme';

type IconChipProps = {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  /** Tinted accent chip (default) or neutral fill chip. */
  tone?: 'accent' | 'neutral';
};

/** Rounded, softly-tinted square holding an icon — an iOS list-row affordance. */
export function IconChip({ name, size = 36, tone = 'accent' }: IconChipProps) {
  const c = useColors();
  const isAccent = tone === 'accent';
  return (
    <View
      style={[
        styles.chip,
        {
          width: size,
          height: size,
          borderRadius: size * 0.3,
          backgroundColor: isAccent ? c.accentSoft : c.fill,
        },
      ]}
    >
      <Ionicons name={name} size={size * 0.5} color={isAccent ? c.accent : c.secondaryLabel} />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.md,
  },
});
