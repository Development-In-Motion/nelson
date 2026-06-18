import { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

import { Screen } from '@/components/ui/screen';

type ScreenShellProps = {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  refreshing?: boolean;
  onRefresh?: () => void;
};

/** Back-compat wrapper around the brand `Screen`. */
export function ScreenShell({ children, contentContainerStyle, refreshing, onRefresh }: ScreenShellProps) {
  return (
    <Screen
      contentContainerStyle={contentContainerStyle}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {children}
    </Screen>
  );
}
