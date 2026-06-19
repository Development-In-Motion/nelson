import Constants, { ExecutionEnvironment } from 'expo-constants';
import {
  Host,
  SegmentedButton,
  SingleChoiceSegmentedButtonRow,
  Text as ComposeText,
} from '@expo/ui/jetpack-compose';

import { useColors } from '@/constants/theme';
import {
  SegmentedControl as FallbackSegmentedControl,
  type SegmentedControlProps,
} from '@/components/ui/segmented-control.shared';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Native Material 3 segmented button row on Android dev/standalone builds; fallback in Expo Go. */
export function SegmentedControl(props: SegmentedControlProps) {
  const c = useColors();

  if (isExpoGo) {
    return <FallbackSegmentedControl {...props} />;
  }

  const { options, selectedIndex, onChange, style } = props;

  return (
    <Host matchContents={{ vertical: true }} style={[{ width: '100%' }, style]}>
      <SingleChoiceSegmentedButtonRow>
        {options.map((opt, i) => (
          <SegmentedButton key={opt} selected={i === selectedIndex} onClick={() => onChange(i)}>
            <ComposeText color={c.label} style={{ fontSize: 14 }}>
              {opt}
            </ComposeText>
          </SegmentedButton>
        ))}
      </SingleChoiceSegmentedButtonRow>
    </Host>
  );
}

export type { SegmentedControlProps } from '@/components/ui/segmented-control.shared';
