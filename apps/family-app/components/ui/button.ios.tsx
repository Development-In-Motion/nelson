import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Button as SwiftUIButton, Host } from '@expo/ui/swift-ui';
import { buttonStyle, controlSize, disabled as disabledModifier, tint } from '@expo/ui/swift-ui/modifiers';

import { useColors } from '@/constants/theme';
import { Button as FallbackButton, type ButtonProps } from '@/components/ui/button.shared';

// `@expo/ui` requires the native module, which is absent in Expo Go.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Native SwiftUI button on iOS dev/standalone builds; fallback in Expo Go. */
export function Button(props: ButtonProps) {
  const c = useColors();

  if (isExpoGo) {
    return <FallbackButton {...props} />;
  }

  const { label, onPress, variant = 'primary', loading = false, disabled = false, destructive = false, style } = props;
  const styleName = variant === 'primary' ? 'borderedProminent' : variant === 'secondary' ? 'bordered' : 'plain';
  const tintColor = destructive ? c.danger : c.accent;
  const isOff = disabled || loading;

  return (
    <Host matchContents style={style}>
      <SwiftUIButton
        label={loading ? '…' : label}
        role={destructive ? 'destructive' : 'default'}
        onPress={() => {
          if (!isOff) onPress?.();
        }}
        modifiers={[
          buttonStyle(styleName),
          controlSize('large'),
          tint(tintColor),
          disabledModifier(isOff),
        ]}
      />
    </Host>
  );
}

export type { ButtonProps, ButtonVariant } from '@/components/ui/button.shared';
