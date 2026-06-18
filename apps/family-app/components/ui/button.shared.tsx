import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { MinTapTarget, Radii, Spacing, SystemFontFamily, useColors } from '@/constants/theme';
import { AppText } from '@/components/ui/text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  destructive?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/**
 * Cross-platform fallback button (web + Expo Go). Uses real platform feedback:
 * Android ripple and iOS haptics. The `.ios`/`.android` siblings replace this
 * with genuine SwiftUI / Jetpack Compose buttons in a native dev build.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  destructive = false,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const c = useColors();
  const isDisabled = disabled || loading;
  const isPrimary = variant === 'primary';
  const tone = destructive ? c.danger : c.accent;

  const containerColor =
    variant === 'primary'
      ? tone
      : variant === 'secondary'
        ? destructive
          ? c.dangerFill
          : c.accentSoft
        : 'transparent';

  const textColor = isPrimary ? c.onAccent : tone;

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      void Haptics.selectionAsync().catch(() => {});
    }
    onPress?.();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={handlePress}
      android_ripple={{ color: isPrimary ? 'rgba(255,255,255,0.25)' : c.accentSoft }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: containerColor },
        pressed && !isDisabled && Platform.OS === 'ios' ? styles.pressed : null,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator size="small" color={textColor} style={styles.spinner} />
        ) : null}
        <AppText style={[styles.label, { color: textColor }]}>{label}</AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: Radii.lg,
    justifyContent: 'center',
    minHeight: MinTapTarget,
    overflow: 'hidden',
    paddingHorizontal: Spacing.xl,
  },
  pressed: {
    opacity: 0.55,
  },
  disabled: {
    opacity: 0.4,
  },
  inner: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  spinner: {
    marginRight: Spacing.xs,
  },
  label: {
    fontFamily: SystemFontFamily,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.43,
  },
});
