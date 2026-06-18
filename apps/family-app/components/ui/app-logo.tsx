import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Spacing, SystemFontFamily, useColors } from '@/constants/theme';
import { AppText } from '@/components/ui/text';

type AppLogoProps = {
  /** Show the "Nelson" wordmark under the icon. */
  showWordmark?: boolean;
  size?: number;
};

/** Minimal app mark: a hairline rounded square with an accent phone glyph. */
export function AppLogo({ showWordmark = true, size = 68 }: AppLogoProps) {
  const c = useColors();
  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.icon,
          {
            width: size,
            height: size,
            borderRadius: size * 0.28,
            backgroundColor: c.card,
            borderColor: c.separator,
          },
        ]}
      >
        <Ionicons name="call" size={size * 0.42} color={c.accent} />
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
    borderWidth: StyleSheet.hairlineWidth,
  },
  wordmark: {
    fontFamily: SystemFontFamily,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0.36,
  },
});
