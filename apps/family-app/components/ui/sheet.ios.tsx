import Constants, { ExecutionEnvironment } from 'expo-constants';
import { BottomSheet, Host, Text as SwiftUIText, VStack } from '@expo/ui/swift-ui';
import { bold, padding } from '@expo/ui/swift-ui/modifiers';

import { Sheet as FallbackSheet, type SheetProps } from '@/components/ui/sheet.shared';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Native SwiftUI bottom sheet on iOS dev/standalone builds; fallback in Expo Go. */
export function Sheet(props: SheetProps) {
  if (isExpoGo) {
    return <FallbackSheet {...props} />;
  }

  const { visible, onClose, title, body } = props;

  return (
    <Host style={{ position: 'absolute', width: 0, height: 0 }}>
      <BottomSheet
        isPresented={visible}
        onIsPresentedChange={(presented) => {
          if (!presented) onClose();
        }}
        fitToContents
      >
        <VStack spacing={12} alignment="leading" modifiers={[padding({ all: 24 })]}>
          <SwiftUIText modifiers={[bold()]}>{title}</SwiftUIText>
          <SwiftUIText>{body}</SwiftUIText>
        </VStack>
      </BottomSheet>
    </Host>
  );
}

export type { SheetProps } from '@/components/ui/sheet.shared';
