import Constants, { ExecutionEnvironment } from 'expo-constants';
import { SegmentedControl as NativeSegmentedControl } from '@expo/ui/community/segmented-control';

import { useColors } from '@/constants/theme';
import {
  SegmentedControl as FallbackSegmentedControl,
  type SegmentedControlProps,
} from '@/components/ui/segmented-control.shared';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Native iOS UISegmentedControl on dev/standalone builds; fallback in Expo Go. */
export function SegmentedControl(props: SegmentedControlProps) {
  const c = useColors();

  if (isExpoGo) {
    return <FallbackSegmentedControl {...props} />;
  }

  const { options, selectedIndex, onChange, style } = props;

  return (
    <NativeSegmentedControl
      values={options}
      selectedIndex={selectedIndex}
      tintColor={c.accent}
      onValueChange={(value) => {
        const index = options.indexOf(value);
        if (index >= 0) onChange(index);
      }}
      style={style}
    />
  );
}

export type { SegmentedControlProps } from '@/components/ui/segmented-control.shared';
