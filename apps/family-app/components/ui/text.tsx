import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { Typography, VariantTone, useColors, type TypographyVariant } from '@/constants/theme';

export type AppTextProps = RNTextProps & {
  variant?: TypographyVariant;
};

/**
 * Single text primitive. Applies the iOS type scale plus the active palette
 * colour for the variant, so each variant adapts to light/dark automatically.
 */
export function AppText({ variant = 'body', style, ...rest }: AppTextProps) {
  const c = useColors();
  const color = c[VariantTone[variant]];
  return <RNText {...rest} style={[Typography[variant], { color }, style]} />;
}

export const Heading = (props: AppTextProps) => <AppText variant="h1" {...props} />;
export const Title = (props: AppTextProps) => <AppText variant="h2" {...props} />;
export const Body = (props: AppTextProps) => <AppText variant="body" {...props} />;
export const Muted = (props: AppTextProps) => <AppText variant="muted" {...props} />;
export const Caption = (props: AppTextProps) => <AppText variant="caption" {...props} />;
export const Label = (props: AppTextProps) => <AppText variant="label" {...props} />;
