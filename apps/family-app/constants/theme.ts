/**
 * Design system for the Nelson family app.
 *
 * The visual language mirrors the product site callnelson.xyz: a pure-white
 * background, monochrome (near-black) ink, monospace typography and a minimal,
 * lots-of-whitespace layout. No color accents, no gradients, no heavy shadows —
 * structure is expressed with hairline borders and generous spacing.
 */

import { Platform, type TextStyle } from 'react-native';

/** Monochrome brand palette sampled from callnelson.xyz. */
export const Palette = {
  /** App background — pure white. */
  bg: '#FFFFFF',
  /** Card / sheet surface (delineated by a hairline, not a fill). */
  surface: '#FFFFFF',
  /** Subtly raised surface for inputs / inset rows. */
  surfaceAlt: '#FAFAFA',
  /** Primary ink — headings, logo, icons, solid buttons. */
  ink: '#111111',
  /** Slightly softened ink for strong body text. */
  inkSoft: '#333333',
  /** Muted ink — secondary text, taglines. */
  inkMuted: '#666666',
  /** Faint ink — disabled / placeholder. */
  inkFaint: '#9A9A9A',
  /** Hairline borders / dividers. */
  line: '#E5E5E5',
  /** Strong border (focus, selected). */
  lineStrong: '#111111',
  /** Text/icon that sits on top of ink (e.g. on a black button). */
  onInk: '#FFFFFF',

  // Desaturated semantic tones — used only where status must read at a glance.
  success: '#1F7A3D',
  successBg: '#EFF6F1',
  warn: '#8A6A1F',
  warnBg: '#FaF5EA',
  danger: '#A12626',
  dangerBg: '#F8EFEF',
} as const;

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

/** Corner radii — intentionally small/square to match the terminal aesthetic. */
export const Radii = {
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
} as const;

/** The monospace family per platform — the defining typographic trait. */
export const MonoFontFamily = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
  web: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
}) as string;

/**
 * Named monospace text styles. Every piece of UI copy uses one of these so the
 * whole app reads in a single typewriter voice.
 */
export const Typography = {
  /** Large hero/marketing text. */
  display: {
    fontFamily: MonoFontFamily,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -1,
    color: Palette.ink,
  },
  /** Screen titles. */
  h1: {
    fontFamily: MonoFontFamily,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: Palette.ink,
  },
  /** Section / card titles. */
  h2: {
    fontFamily: MonoFontFamily,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: Palette.ink,
  },
  /** Default body copy. */
  body: {
    fontFamily: MonoFontFamily,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    color: Palette.inkSoft,
  },
  /** Emphasised body. */
  bodyStrong: {
    fontFamily: MonoFontFamily,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: Palette.ink,
  },
  /** Secondary / muted copy. */
  muted: {
    fontFamily: MonoFontFamily,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    color: Palette.inkMuted,
  },
  /** Small print. */
  caption: {
    fontFamily: MonoFontFamily,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: Palette.inkMuted,
  },
  /** Uppercase eyebrow labels. */
  label: {
    fontFamily: MonoFontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Palette.inkMuted,
  },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof Typography;

/** Minimum tap-target height — generous for elderly-adjacent users. */
export const MinTapTarget = 52;

/**
 * Legacy navigation/theme colour map. Kept (recoloured to the light brand) so
 * the Expo-template helpers (`useThemeColor`, ThemedText/ThemedView) keep
 * compiling. New UI should consume `Palette`/`Typography` directly.
 */
const tintColorLight = Palette.ink;
const tintColorDark = Palette.ink;

export const Colors = {
  light: {
    text: Palette.ink,
    background: Palette.bg,
    tint: tintColorLight,
    icon: Palette.inkMuted,
    tabIconDefault: Palette.inkMuted,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: Palette.ink,
    background: Palette.bg,
    tint: tintColorDark,
    icon: Palette.inkMuted,
    tabIconDefault: Palette.inkMuted,
    tabIconSelected: tintColorDark,
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
