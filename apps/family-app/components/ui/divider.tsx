import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Palette } from '@/constants/theme';

/** One-pixel hairline divider. */
export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
  divider: {
    backgroundColor: Palette.line,
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});
