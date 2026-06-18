import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Palette, Radii } from '@/constants/theme';
import type { ActivityCategory, ApprovalStatus } from '@/types/ui-models';

type StatusTagProps = {
  label: string;
  tone: ActivityCategory | ApprovalStatus;
};

type ToneStyle = { backgroundColor: string; textColor: string; borderColor: string };

// Monochrome by default; only approval states carry a desaturated semantic hue.
const toneColors: Record<StatusTagProps['tone'], ToneStyle> = {
  calendar: { backgroundColor: Palette.surfaceAlt, textColor: Palette.ink, borderColor: Palette.line },
  call: { backgroundColor: Palette.surfaceAlt, textColor: Palette.ink, borderColor: Palette.line },
  search: { backgroundColor: Palette.surfaceAlt, textColor: Palette.ink, borderColor: Palette.line },
  purchase: { backgroundColor: Palette.surfaceAlt, textColor: Palette.ink, borderColor: Palette.line },
  pending: { backgroundColor: Palette.warnBg, textColor: Palette.warn, borderColor: Palette.warnBg },
  approved: { backgroundColor: Palette.successBg, textColor: Palette.success, borderColor: Palette.successBg },
  declined: { backgroundColor: Palette.dangerBg, textColor: Palette.danger, borderColor: Palette.dangerBg },
};

export function StatusTag({ label, tone }: StatusTagProps) {
  const colors = toneColors[tone];

  return (
    <View
      style={[styles.chip, { backgroundColor: colors.backgroundColor, borderColor: colors.borderColor }]}
    >
      <AppText variant="caption" style={[styles.text, { color: colors.textColor }]}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    borderRadius: Radii.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
