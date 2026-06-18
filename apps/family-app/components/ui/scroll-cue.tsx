import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Palette } from '@/constants/theme';
import { AppText } from '@/components/ui/text';

/** The minimal "↓" scroll affordance used on the callnelson.xyz hero. */
export function ScrollCue({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.wrap, style]} accessibilityElementsHidden importantForAccessibility="no">
      <AppText style={styles.arrow}>↓</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    color: Palette.inkMuted,
    fontSize: 22,
    lineHeight: 26,
  },
});
