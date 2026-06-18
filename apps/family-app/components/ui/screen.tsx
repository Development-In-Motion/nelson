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

import { Palette, Spacing } from '@/constants/theme';

type ScreenProps = {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Render children without a ScrollView (e.g. centred auth layout). */
  scroll?: boolean;
};

/**
 * Standard white-canvas screen: safe area + scrollable, generously padded body.
 */
export function Screen({
  children,
  contentContainerStyle,
  refreshing,
  onRefresh,
  scroll = true,
}: ScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing ?? false}
                onRefresh={onRefresh}
                tintColor={Palette.ink}
                colors={[Palette.ink]}
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
    backgroundColor: Palette.bg,
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    backgroundColor: Palette.bg,
    flexGrow: 1,
    paddingBottom: Spacing.xxxl * 2,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
});
