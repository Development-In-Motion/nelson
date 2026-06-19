import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Radii, useColors } from '@/constants/theme';
import { AppText } from '@/components/ui/text';

export type SegmentedControlProps = {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Cross-platform fallback segmented control (web + Expo Go): an iOS-style pill
 * track with a sliding thumb. The `.ios`/`.android` siblings use the real
 * native segmented control.
 */
export function SegmentedControl({ options, selectedIndex, onChange, style }: SegmentedControlProps) {
  const c = useColors();
  return (
    <View style={[styles.track, { backgroundColor: c.fill }, style]}>
      {options.map((opt, i) => {
        const active = i === selectedIndex;
        return (
          <Pressable
            key={opt}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (Platform.OS !== 'web') void Haptics.selectionAsync().catch(() => {});
              onChange(i);
            }}
            style={[styles.segment, active && { backgroundColor: c.cardElevated }]}
          >
            <AppText
              variant="caption"
              style={[styles.label, { color: active ? c.label : c.secondaryLabel, fontWeight: active ? '600' : '400' }]}
            >
              {opt}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: Radii.md,
    flexDirection: 'row',
    padding: 2,
  },
  segment: {
    alignItems: 'center',
    borderRadius: Radii.sm,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
  },
});
