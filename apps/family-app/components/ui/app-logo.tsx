import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Spacing, SystemFontFamily, useColors } from '@/constants/theme';
import { AppText } from '@/components/ui/text';

type AppLogoProps = {
  /** Show the "Nelson" wordmark under the icon. */
  showWordmark?: boolean;
  size?: number;
};

/** Rounded-square app icon (phone glyph) + optional "Nelson" wordmark. */
export function AppLogo({ showWordmark = true, size = 72 }: AppLogoProps) {
  const c = useColors();
  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.icon,
          {
            width: size,
            height: size,
            borderRadius: size * 0.26,
            backgroundColor: c.accent,
          },
        ]}
      >
        <Ionicons name="call" size={size * 0.46} color={c.onAccent} />
      </View>
      {showWordmark ? (
        <AppText style={[styles.wordmark, { color: c.label }]}>Nelson</AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontFamily: SystemFontFamily,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 0.37,
  },
});
