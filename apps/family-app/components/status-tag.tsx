import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Radii, useColors } from '@/constants/theme';
import type { ActivityCategory, ApprovalStatus } from '@/types/ui-models';

type StatusTagProps = {
  label: string;
  tone: ActivityCategory | ApprovalStatus;
};

/** iOS tinted pill. Approval states carry a semantic colour; others are neutral. */
export function StatusTag({ label, tone }: StatusTagProps) {
  const c = useColors();

  const semantic: Partial<Record<StatusTagProps['tone'], { bg: string; fg: string }>> = {
    approved: { bg: c.successFill, fg: c.success },
    declined: { bg: c.dangerFill, fg: c.danger },
    pending: { bg: c.warnFill, fg: c.warn },
  };

  const colors = semantic[tone] ?? { bg: c.fill, fg: c.secondaryLabel };

  return (
    <View style={[styles.chip, { backgroundColor: colors.bg }]}>
      <AppText variant="caption" style={[styles.text, { color: colors.fg }]}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    borderRadius: Radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  text: {
    fontWeight: '600',
  },
});
