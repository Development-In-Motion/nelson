import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { MinTapTarget, Radii, Spacing, SystemFontFamily, useColors } from '@/constants/theme';
import { AppText } from '@/components/ui/text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = {
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
 * iOS-style button. `primary` = filled graphite accent, `secondary` = neutral
 * tinted fill, `ghost` = plain accent text. Flat — no Material elevation/ripple.
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

  const containerColor =
    variant === 'primary'
      ? destructive
        ? c.danger
        : c.accent
      : variant === 'secondary'
        ? c.fill
        : 'transparent';

  const textColor = isPrimary
    ? c.onAccent
    : destructive
      ? c.danger
      : c.accent;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: containerColor },
        pressed && !isDisabled && styles.pressed,
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
    paddingHorizontal: Spacing.xl,
  },
  pressed: {
    opacity: 0.6,
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
