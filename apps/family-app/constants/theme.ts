/**
 * Design system for the Nelson family app — native iOS look (Apple HIG).
 *
 * San-Francisco system font, grouped inset list surfaces, soft rounded corners,
 * subtle depth, and a graphite/monochrome accent (near-black in light, white in
 * dark). Colours are semantic and resolve per appearance via `useColors()`.
 */

import { Platform, type TextStyle } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

/** iOS semantic colour palette for one appearance. */
export type ColorPalette = {
  /** Grouped screen background. */
  bg: string;
  /** Card / grouped section surface. */
  card: string;
  /** Elevated surface (modals, nested tiles). */
  cardElevated: string;
  /** Filled control background (inputs, tiles, neutral chips). */
  fill: string;
  /** Primary text. */
  label: string;
  /** Secondary text. */
  secondaryLabel: string;
  /** Tertiary text (placeholders, hints). */
  tertiaryLabel: string;
  /** Hairline separators. */
  separator: string;
  /** Graphite accent (buttons, selected state). */
  accent: string;
  /** Text/icon on top of the accent. */
  onAccent: string;
  /** Tab bar background. */
  tabBar: string;
  /** Semantic tones + ~15% tinted backgrounds. */
  success: string;
  successFill: string;
  warn: string;
  warnFill: string;
  danger: string;
  dangerFill: string;
};

const light: ColorPalette = {
  bg: '#F2F2F7',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  fill: '#E9E9EB',
  label: '#000000',
  secondaryLabel: 'rgba(60,60,67,0.6)',
  tertiaryLabel: 'rgba(60,60,67,0.3)',
  separator: 'rgba(60,60,67,0.29)',
  accent: '#1C1C1E',
  onAccent: '#FFFFFF',
  tabBar: 'rgba(249,249,249,0.94)',
  success: '#34C759',
  successFill: 'rgba(52,199,89,0.15)',
  warn: '#FF9500',
  warnFill: 'rgba(255,149,0,0.15)',
  danger: '#FF3B30',
  dangerFill: 'rgba(255,59,48,0.15)',
};

const dark: ColorPalette = {
  bg: '#000000',
  card: '#1C1C1E',
  cardElevated: '#2C2C2E',
  fill: '#2C2C2E',
  label: '#FFFFFF',
  secondaryLabel: 'rgba(235,235,245,0.6)',
  tertiaryLabel: 'rgba(235,235,245,0.3)',
  separator: 'rgba(84,84,88,0.6)',
  accent: '#FFFFFF',
  onAccent: '#000000',
  tabBar: 'rgba(22,22,22,0.94)',
  success: '#30D158',
  successFill: 'rgba(48,209,88,0.18)',
  warn: '#FF9F0A',
  warnFill: 'rgba(255,159,10,0.18)',
  danger: '#FF453A',
  dangerFill: 'rgba(255,69,58,0.18)',
};

export const Schemes = { light, dark } as const;

/** Light palette alias for any non-hook (module-scope) usage. */
export const Palette = light;

/** Resolve the active palette from the device appearance. */
export function useColors(): ColorPalette {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}

/** Spacing scale (multiples of 4). */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Corner radii — iOS continuous-ish. */
export const Radii = {
  sm: 8,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

/** Minimum tap-target height — generous for elderly-adjacent users. */
export const MinTapTarget = 50;

/**
 * The system font family per platform. On native, leaving `fontFamily`
 * undefined uses the platform system font (San Francisco on iOS); on web we
 * provide the standard `system-ui` stack.
 */
export const SystemFontFamily = Platform.select({
  ios: undefined,
  android: undefined,
  default: undefined,
  web: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
}) as string | undefined;

const fam = SystemFontFamily ? { fontFamily: SystemFontFamily } : {};

/**
 * Named text styles following the iOS type scale. These carry size/weight only;
 * colour is applied by the `AppText` component from the active palette so the
 * same variant adapts to light/dark.
 */
export const Typography = {
  /** iOS Large Title. */
  display: { ...fam, fontSize: 34, lineHeight: 41, fontWeight: '700', letterSpacing: 0.37 },
  /** Title 1 — screen large titles. */
  h1: { ...fam, fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: 0.36 },
  /** Title 3 — section/card titles. */
  h2: { ...fam, fontSize: 20, lineHeight: 25, fontWeight: '600', letterSpacing: 0.38 },
  /** Headline — emphasised rows. */
  headline: { ...fam, fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.43 },
  /** Body. */
  body: { ...fam, fontSize: 17, lineHeight: 22, fontWeight: '400', letterSpacing: -0.43 },
  /** Emphasised body. */
  bodyStrong: { ...fam, fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.43 },
  /** Subhead — secondary copy. */
  muted: { ...fam, fontSize: 15, lineHeight: 20, fontWeight: '400', letterSpacing: -0.24 },
  /** Footnote — captions. */
  caption: { ...fam, fontSize: 13, lineHeight: 18, fontWeight: '400', letterSpacing: -0.08 },
  /** Footnote, uppercase — iOS grouped-list section headers. */
  label: { ...fam, fontSize: 13, lineHeight: 18, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof Typography;

/** Default text colour per variant: most are primary, a few are secondary. */
export const VariantTone: Record<TypographyVariant, 'label' | 'secondaryLabel'> = {
  display: 'label',
  h1: 'label',
  h2: 'label',
  headline: 'label',
  body: 'label',
  bodyStrong: 'label',
  muted: 'secondaryLabel',
  caption: 'secondaryLabel',
  label: 'secondaryLabel',
};

/**
 * Legacy navigation/theme colour map (kept for the Expo-template helpers
 * `useThemeColor`, ThemedText/ThemedView so they keep compiling). New UI
 * consumes `useColors()`/`Typography` directly.
 */
export const Colors = {
  light: {
    text: light.label,
    background: light.bg,
    tint: light.accent,
    icon: light.secondaryLabel,
    tabIconDefault: light.secondaryLabel,
    tabIconSelected: light.accent,
  },
  dark: {
    text: dark.label,
    background: dark.bg,
    tint: dark.accent,
    icon: dark.secondaryLabel,
    tabIconDefault: dark.secondaryLabel,
    tabIconSelected: dark.accent,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
