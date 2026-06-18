import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Body, Caption, Title } from '@/components/ui/text';
import { Radii, Spacing, useColors } from '@/constants/theme';

export type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  body: string;
  /** Small caption under the title. */
  caption?: string;
};

/**
 * Cross-platform fallback sheet (web + Expo Go): a centered modal card.
 * The `.ios`/`.android` siblings replace this with a real native bottom sheet.
 */
export function Sheet({ visible, onClose, title, body, caption }: SheetProps) {
  const c = useColors();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.card, { backgroundColor: c.cardElevated }]} onPress={() => {}}>
          <View style={styles.header}>
            <View style={styles.copy}>
              <Title>{title}</Title>
              {caption ? <Caption>{caption}</Caption> : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Затвори"
              onPress={onClose}
              style={[styles.close, { backgroundColor: c.fill }]}
            >
              <Ionicons name="close" size={18} color={c.label} />
            </Pressable>
          </View>
          <Body>{body}</Body>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    borderRadius: Radii.xl,
    gap: Spacing.lg,
    padding: Spacing.xl,
    width: '100%',
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  close: {
    alignItems: 'center',
    borderRadius: Radii.pill,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
});
