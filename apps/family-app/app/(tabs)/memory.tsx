import { useCallback, useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ScreenShell } from "@/components/screen-shell";
import { Body, Caption, Heading, Label, Muted, Title } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { Radii, Spacing, useColors } from "@/constants/theme";
import { useAuth } from "@/context/auth-context";
import { getCurrentUserMemory } from "@/lib/memory-api";
import type { UserMemoryRecord } from "@/types/memory";

function splitMemoryNote(note: string) {
  const trimmed = note.trim();
  const separatorIndex = trimmed.indexOf(":");
  if (separatorIndex <= 0) {
    return { label: "Памет", value: trimmed };
  }
  return {
    label: trimmed.slice(0, separatorIndex).trim(),
    value: trimmed.slice(separatorIndex + 1).trim(),
  };
}

export default function MemoryScreen() {
  const c = useColors();
  const { user } = useAuth();
  const [memoryRecord, setMemoryRecord] = useState<UserMemoryRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<string | null>(null);

  const loadMemory = useCallback(
    async (
      mode: "initial" | "refresh" = "initial",
      options?: { signal?: { aborted: boolean } },
    ) => {
      if (!user?.phone) {
        setMemoryRecord(null);
        setErrorMessage("Влезте с телефонен номер, за да заредите данните за паметта.");
        setIsLoading(false);
        return;
      }

      if (mode !== "refresh") setIsLoading(true);

      try {
        const record = await getCurrentUserMemory(user.phone);
        if (options?.signal?.aborted) return;
        setMemoryRecord(record);
        setErrorMessage(null);
      } catch (error) {
        if (options?.signal?.aborted) return;
        setMemoryRecord(null);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Данните за паметта не могат да бъдат заредени в момента.",
        );
      } finally {
        if (!options?.signal?.aborted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [user?.phone],
  );

  useEffect(() => {
    const request = { aborted: false };
    void loadMemory("initial", { signal: request });
    return () => {
      request.aborted = true;
    };
  }, [loadMemory]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    void loadMemory("refresh");
  }, [loadMemory]);

  const screenTitle = memoryRecord?.name ? `Памет на ${memoryRecord.name}` : "Памет";
  const memoryNotes = memoryRecord?.memories ?? [];

  return (
    <ScreenShell refreshing={isRefreshing} onRefresh={handleRefresh}>
      <Heading style={styles.title}>{screenTitle}</Heading>
      <Muted style={styles.subtitle}>Какво знае AI за вашия близък.</Muted>

      <Label style={styles.sectionHeader}>Свързан телефон</Label>
      <Card style={styles.section}>
        <Body>{user?.phone ?? "Няма наличен"}</Body>
      </Card>

      {isLoading ? (
        <Card style={styles.section}>
          <Title>Зареждане на паметта</Title>
          <Caption>Извличане на бележките за памет.</Caption>
        </Card>
      ) : null}

      {!isLoading && errorMessage ? (
        <Card style={styles.section}>
          <Title>Паметта не можа да бъде заредена</Title>
          <Caption>{errorMessage}</Caption>
          <Button label="Опитай отново" variant="secondary" onPress={() => void loadMemory()} />
        </Card>
      ) : null}

      {!isLoading && !errorMessage && !memoryRecord ? (
        <Card style={styles.section}>
          <Title>Все още няма открита памет</Title>
          <Caption>Все още не открихме запис за памет за този телефонен номер.</Caption>
        </Card>
      ) : null}

      <View style={styles.notesHeaderRow}>
        <Label style={styles.sectionHeaderInline}>Бележки за памет</Label>
        <View style={[styles.badge, { backgroundColor: c.fill }]}>
          <Ionicons name="albums-outline" size={14} color={c.secondaryLabel} />
          <Caption style={styles.badgeText}>{memoryNotes.length}</Caption>
        </View>
      </View>

      {memoryNotes.length > 0 ? (
        <Card style={styles.section}>
          {memoryNotes.map((item, index) => {
            const note = splitMemoryNote(item);
            return (
              <View key={`${memoryRecord?._id ?? "memory"}-note-${index + 1}`}>
                {index > 0 ? <Divider /> : null}
                <Pressable
                  onPress={() => setSelectedMemory(item)}
                  style={({ pressed }) => [styles.noteRow, pressed ? { opacity: 0.6 } : null]}
                >
                  <View style={styles.noteText}>
                    <Label style={styles.noteLabel}>{note.label}</Label>
                    <Body style={styles.noteValue} numberOfLines={2}>
                      {note.value}
                    </Body>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={c.tertiaryLabel} />
                </Pressable>
              </View>
            );
          })}
        </Card>
      ) : (
        <Card style={[styles.section, styles.emptyState]}>
          <Ionicons name="albums-outline" size={24} color={c.tertiaryLabel} />
          <Title>Все още няма запазени бележки</Title>
          <Caption style={styles.emptyStateText}>
            Запазените бележки ще се появят тук, след като асистентът научи нещо смислено.
          </Caption>
        </Card>
      )}

      <Modal
        visible={selectedMemory !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMemory(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedMemory(null)}>
          <Pressable style={[styles.modalCard, { backgroundColor: c.cardElevated }]} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <View style={styles.modalCopy}>
                <Title>Пълна бележка</Title>
                <Caption>Запазена памет</Caption>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Затвори"
                onPress={() => setSelectedMemory(null)}
                style={[styles.modalClose, { backgroundColor: c.fill }]}
              >
                <Ionicons name="close" size={18} color={c.label} />
              </Pressable>
            </View>
            <Body>{selectedMemory ?? ""}</Body>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: Spacing.sm,
  },
  subtitle: {
    marginBottom: Spacing.lg,
    marginTop: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.md,
  },
  sectionHeaderInline: {
    marginLeft: Spacing.md,
  },
  notesHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  badge: {
    alignItems: "center",
    borderRadius: Radii.pill,
    flexDirection: "row",
    gap: Spacing.xs,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontWeight: "600",
  },
  noteRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  noteText: {
    flex: 1,
    gap: 2,
  },
  noteLabel: {
    marginLeft: 0,
  },
  noteValue: {
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  emptyStateText: {
    textAlign: "center",
  },
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    flex: 1,
    justifyContent: "center",
    padding: Spacing.xl,
  },
  modalCard: {
    borderRadius: Radii.xl,
    gap: Spacing.lg,
    padding: Spacing.xl,
    width: "100%",
  },
  modalHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCopy: {
    flex: 1,
    gap: 2,
  },
  modalClose: {
    alignItems: "center",
    borderRadius: Radii.pill,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
});
