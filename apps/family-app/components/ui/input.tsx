import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { MinTapTarget, MonoFontFamily, Palette, Radii, Spacing } from '@/constants/theme';
import { Label } from '@/components/ui/text';

type InputProps = TextInputProps & {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * Native monospace text field with a hairline outline that strengthens on focus.
 */
export function Input({ label, containerStyle, style, onFocus, onBlur, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Label style={styles.label}>{label}</Label> : null}
      <TextInput
        {...rest}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        placeholderTextColor={Palette.inkFaint}
        style={[styles.input, focused && styles.inputFocused, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  label: {
    color: Palette.inkMuted,
  },
  input: {
    backgroundColor: Palette.surfaceAlt,
    borderColor: Palette.line,
    borderRadius: Radii.md,
    borderWidth: 1,
    color: Palette.ink,
    fontFamily: MonoFontFamily,
    fontSize: 17,
    minHeight: MinTapTarget,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  inputFocused: {
    borderColor: Palette.lineStrong,
    borderWidth: 2,
  },
});
