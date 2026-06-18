import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { Typography, type TypographyVariant } from '@/constants/theme';

export type AppTextProps = RNTextProps & {
  variant?: TypographyVariant;
};

/**
 * Single text primitive for the app. Every label/heading/body string renders
 * through this so the whole UI stays in one monospace voice.
 */
export function AppText({ variant = 'body', style, ...rest }: AppTextProps) {
  return <RNText {...rest} style={[Typography[variant], style]} />;
}

export const Heading = (props: AppTextProps) => <AppText variant="h1" {...props} />;
export const Title = (props: AppTextProps) => <AppText variant="h2" {...props} />;
export const Body = (props: AppTextProps) => <AppText variant="body" {...props} />;
export const Muted = (props: AppTextProps) => <AppText variant="muted" {...props} />;
export const Caption = (props: AppTextProps) => <AppText variant="caption" {...props} />;
export const Label = (props: AppTextProps) => <AppText variant="label" {...props} />;
