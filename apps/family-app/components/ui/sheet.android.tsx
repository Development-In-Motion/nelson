import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Column, Host, ModalBottomSheet, Text as ComposeText } from '@expo/ui/jetpack-compose';

import { useColors } from '@/constants/theme';
import { Sheet as FallbackSheet, type SheetProps } from '@/components/ui/sheet.shared';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Native Jetpack Compose bottom sheet on Android dev/standalone builds; fallback in Expo Go. */
export function Sheet(props: SheetProps) {
  const c = useColors();

  if (isExpoGo) {
    return <FallbackSheet {...props} />;
  }

  const { visible, onClose, title, body } = props;
  if (!visible) {
    return null;
  }

  return (
    <Host style={{ position: 'absolute', width: 0, height: 0 }}>
      <ModalBottomSheet onDismissRequest={onClose} containerColor={c.cardElevated}>
        <Column>
          <ComposeText color={c.label} style={{ fontSize: 20, fontWeight: '600' }}>
            {title}
          </ComposeText>
          <ComposeText color={c.secondaryLabel} style={{ fontSize: 16 }}>
            {body}
          </ComposeText>
        </Column>
      </ModalBottomSheet>
    </Host>
  );
}

export type { SheetProps } from '@/components/ui/sheet.shared';
