import { ReactNode } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing, useColors } from '@/constants/theme';

type ScreenProps = {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Render children without a ScrollView (e.g. centred auth layout). */
  scroll?: boolean;
};

/** Standard grouped-background screen: safe area + scrollable padded body. */
export function Screen({
  children,
  contentContainerStyle,
  refreshing,
  onRefresh,
  scroll = true,
}: ScreenProps) {
  const c = useColors();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.bg }]} edges={['top']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing ?? false}
                onRefresh={onRefresh}
                tintColor={c.secondaryLabel}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.flex, contentContainerStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: Spacing.xxxl * 2,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
});
