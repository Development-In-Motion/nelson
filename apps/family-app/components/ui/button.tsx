import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { MinTapTarget, MonoFontFamily, Palette, Radii, Spacing } from '@/constants/theme';
import { AppText } from '@/components/ui/text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/**
 * Monochrome native button. Primary = solid black on white, secondary = hairline
 * outline, ghost = text only. No Material ripple/elevation — flat by design.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={isPrimary ? Palette.onInk : Palette.ink}
            style={styles.spinner}
          />
        ) : null}
        <AppText
          style={[
            styles.label,
            isPrimary ? styles.labelPrimary : styles.labelDark,
            isDisabled && styles.labelDisabled,
          ]}
        >
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: Radii.md,
    justifyContent: 'center',
    minHeight: MinTapTarget,
    paddingHorizontal: Spacing.xl,
  },
  primary: {
    backgroundColor: Palette.ink,
  },
  secondary: {
    backgroundColor: Palette.surface,
    borderColor: Palette.ink,
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.7,
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
    fontFamily: MonoFontFamily,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  labelPrimary: {
    color: Palette.onInk,
  },
  labelDark: {
    color: Palette.ink,
  },
  labelDisabled: {
    // opacity handled on container; keep colour stable
  },
});
