import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useColors } from '@/constants/theme';

/** iOS hairline separator. */
export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return <View style={[styles.divider, { backgroundColor: c.separator }, style]} />;
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});
