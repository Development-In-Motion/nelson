import Constants, { ExecutionEnvironment } from 'expo-constants';
import {
  Button as ComposeButton,
  FilledTonalButton,
  Host,
  TextButton,
  Text as ComposeText,
} from '@expo/ui/jetpack-compose';

import { useColors } from '@/constants/theme';
import { Button as FallbackButton, type ButtonProps } from '@/components/ui/button.shared';

// `@expo/ui` requires the native module, which is absent in Expo Go.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Native Jetpack Compose button on Android dev/standalone builds; fallback in Expo Go. */
export function Button(props: ButtonProps) {
  const c = useColors();

  if (isExpoGo) {
    return <FallbackButton {...props} />;
  }

  const { label, onPress, variant = 'primary', loading = false, disabled = false, destructive = false, style } = props;
  const isOff = disabled || loading;
  const onClick = () => {
    if (!isOff) onPress?.();
  };
  const text = loading ? '…' : label;

  const content = (
    <ComposeText
      color={variant === 'primary' ? c.onAccent : destructive ? c.danger : c.accent}
      style={{ fontSize: 16, fontWeight: '600' }}
    >
      {text}
    </ComposeText>
  );

  return (
    <Host matchContents style={style}>
      {variant === 'ghost' ? (
        <TextButton onClick={onClick} enabled={!isOff}>
          {content}
        </TextButton>
      ) : variant === 'secondary' ? (
        <FilledTonalButton onClick={onClick} enabled={!isOff}>
          {content}
        </FilledTonalButton>
      ) : (
        <ComposeButton
          onClick={onClick}
          enabled={!isOff}
          colors={{
            containerColor: destructive ? c.danger : c.accent,
            contentColor: c.onAccent,
          }}
        >
          {content}
        </ComposeButton>
      )}
    </Host>
  );
}

export type { ButtonProps, ButtonVariant } from '@/components/ui/button.shared';
