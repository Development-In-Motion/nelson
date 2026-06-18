import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { MinTapTarget, Radii, Spacing, SystemFontFamily, useColors } from '@/constants/theme';
import { Label } from '@/components/ui/text';

type InputProps = TextInputProps & {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

/** iOS filled text field: tinted fill, rounded, focus ring via the accent. */
export function Input({ label, containerStyle, style, onFocus, onBlur, ...rest }: InputProps) {
  const c = useColors();
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
        placeholderTextColor={c.tertiaryLabel}
        style={[
          styles.input,
          {
            backgroundColor: c.fill,
            color: c.label,
            borderColor: focused ? c.accent : 'transparent',
          },
          style,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  label: {
    marginLeft: Spacing.xs,
  },
  input: {
    borderRadius: Radii.md,
    borderWidth: 2,
    fontFamily: SystemFontFamily,
    fontSize: 17,
    minHeight: MinTapTarget,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
});
