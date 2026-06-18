import { StyleSheet, View } from 'react-native';

import { SystemFontFamily, useColors } from '@/constants/theme';
import { AppText } from '@/components/ui/text';

type AvatarProps = {
  initials: string;
  size?: number;
  /** Filled accent (solid) vs neutral tinted fill. */
  tone?: 'accent' | 'neutral';
};

/** Circular iOS-style avatar with initials. */
export function Avatar({ initials, size = 56, tone = 'accent' }: AvatarProps) {
  const c = useColors();
  const isAccent = tone === 'accent';
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isAccent ? c.accent : c.fill,
        },
      ]}
    >
      <AppText
        style={{
          color: isAccent ? c.onAccent : c.label,
          fontFamily: SystemFontFamily,
          fontSize: size * 0.4,
          fontWeight: '600',
        }}
      >
        {initials}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
