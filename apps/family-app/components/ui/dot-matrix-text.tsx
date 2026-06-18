import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Palette } from '@/constants/theme';

/**
 * Renders text as an LED dot-matrix, mirroring the "Nelson." wordmark on
 * callnelson.xyz. Each glyph is a 5×7 bitmap; only "on" cells are drawn as dots.
 *
 * The glyph set is intentionally limited to what the wordmark needs (plus a few
 * extras). Unknown characters render as blank cells.
 */

const GLYPH_WIDTH = 5;
const GLYPH_HEIGHT = 7;

// 1 = lit dot. Rows are top → bottom. Lowercase letters use the lower rows so
// their x-height sits below the taller uppercase cap, as real type does.
const FONT: Record<string, string[]> = {
  N: ['10001', '11001', '11001', '10101', '10011', '10011', '10001'],
  n: ['00000', '00000', '10110', '11001', '10001', '10001', '10001'],
  e: ['00000', '00000', '01110', '10001', '11111', '10000', '01110'],
  l: ['01100', '00100', '00100', '00100', '00100', '00100', '01110'],
  s: ['00000', '00000', '01111', '10000', '01110', '00001', '11110'],
  o: ['00000', '00000', '01110', '10001', '10001', '10001', '01110'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};

type DotMatrixTextProps = {
  text: string;
  /** Diameter of each lit dot, in px. */
  dotSize?: number;
  /** Gap between dots, in px. */
  gap?: number;
  /** Extra spacing between glyphs, in dot-cells (default 1). */
  letterSpacing?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export function DotMatrixText({
  text,
  dotSize = 7,
  gap = 3,
  letterSpacing = 1,
  color = Palette.ink,
  style,
}: DotMatrixTextProps) {
  const cell = dotSize + gap;
  const dotStyle = {
    width: dotSize,
    height: dotSize,
    borderRadius: dotSize / 2,
    backgroundColor: color,
  };

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={text}
      style={[styles.row, style]}
    >
      {[...text].map((char, charIndex) => {
        const glyph = FONT[char] ?? FONT[' '];
        return (
          <View
            key={`${char}-${charIndex}`}
            style={{ marginRight: letterSpacing * cell }}
          >
            {glyph.map((rowBits, rowIndex) => (
              <View key={rowIndex} style={styles.glyphRow}>
                {[...rowBits].map((bit, colIndex) => (
                  <View
                    key={colIndex}
                    style={{ width: cell, height: cell, alignItems: 'center', justifyContent: 'center' }}
                  >
                    {bit === '1' ? <View style={dotStyle} /> : null}
                  </View>
                ))}
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

export const DotMatrixGlyphSize = { width: GLYPH_WIDTH, height: GLYPH_HEIGHT };

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  glyphRow: {
    flexDirection: 'row',
  },
});
