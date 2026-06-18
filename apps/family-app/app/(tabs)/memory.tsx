import { useCallback, useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ScreenShell } from "@/components/screen-shell";
import { Body, Caption, Heading, Label, Muted, Title } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Palette, Radii, Spacing } from "@/constants/theme";
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

      if (mode !== "refresh") {
        setIsLoading(true);
      }

      try {
        const record = await getCurrentUserMemory(user.phone);
        if (options?.signal?.aborted) {
          return;
        }

        setMemoryRecord(record);
        setErrorMessage(null);
      } catch (error) {
        if (options?.signal?.aborted) {
          return;
        }

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

  const screenTitle = memoryRecord?.name
    ? `Профил на ${memoryRecord.name}`
    : "Профил на паметта";
  const memoryNotes = memoryRecord?.memories ?? [];

  return (
    <ScreenShell refreshing={isRefreshing} onRefresh={handleRefresh}>
      <Heading>{screenTitle}</Heading>
      <Muted style={styles.subtitle}>Какво знае AI за вашия близък.</Muted>

      <View style={styles.statusBlock}>
        <Label>Свързан телефон</Label>
        <Body>{user?.phone ?? "Няма наличен"}</Body>
      </View>

      {isLoading ? (
        <Card style={styles.feedbackCard}>
          <Title>Зареждане на паметта</Title>
          <Caption>Извличане на бележките за памет.</Caption>
        </Card>
      ) : null}

      {!isLoading && errorMessage ? (
        <Card style={styles.feedbackCard}>
          <Title>Паметта не можа да бъде заредена</Title>
          <Caption>{errorMessage}</Caption>
          <Button label="Опитай отново" variant="secondary" onPress={() => void loadMemory()} />
        </Card>
      ) : null}

      {!isLoading && !errorMessage && !memoryRecord ? (
        <Card style={styles.feedbackCard}>
          <Title>Все още няма открита памет</Title>
          <Caption>Все още не открихме запис за памет за този телефонен номер.</Caption>
        </Card>
      ) : null}

      <Card style={styles.notesCard}>
        <View style={styles.notesHeader}>
          <View style={styles.notesHeaderCopy}>
            <Title>Бележки за памет</Title>
            <Caption>Запазени детайли, които Нелсън е запомнил за потребителя.</Caption>
          </View>
          <View style={styles.notesBadge}>
            <Ionicons name="albums-outline" size={15} color={Palette.ink} />
            <Caption style={styles.notesBadgeText}>{memoryNotes.length}</Caption>
          </View>
        </View>

        {memoryNotes.length > 0 ? (
          <>
            <View style={styles.summaryRow}>
              <Card inset style={styles.summaryCard}>
                <Label>Общо</Label>
                <Heading>{memoryNotes.length}</Heading>
              </Card>
              <Pressable
                onPress={() => setSelectedMemory(memoryNotes[0] ?? null)}
                style={({ pressed }) => [
                  styles.summaryCard,
                  styles.summaryCardInteractive,
                  pressed ? styles.summaryCardPressed : null,
                ]}
              >
                <Label>Последна</Label>
                <Body numberOfLines={2}>{memoryNotes[0]}</Body>
                <Caption style={styles.summaryHint}>Докоснете, за да прочетете цялата бележка</Caption>
              </Pressable>
            </View>

            <View style={styles.noteList}>
              {memoryNotes.map((item, index) => {
                const note = splitMemoryNote(item);

                return (
                  <Card
                    inset
                    key={`${memoryRecord?._id ?? "memory"}-note-${index + 1}`}
                    style={styles.noteCard}
                  >
                    <View style={styles.noteCardTop}>
                      <View style={styles.noteAccent} />
                      <Caption style={styles.noteIndex}>Бележка {index + 1}</Caption>
                    </View>
                    <Label>{note.label}</Label>
                    <Body style={styles.noteValue}>{note.value}</Body>
                  </Card>
                );
              })}
            </View>
          </>
        ) : (
          <Card inset style={styles.emptyState}>
            <Ionicons name="albums-outline" size={22} color={Palette.inkMuted} />
            <Title>Все още няма запазени бележки за памет</Title>
            <Caption style={styles.emptyStateText}>
              Запазените бележки ще се появят тук, след като асистентът научи нещо смислено.
            </Caption>
          </Card>
        )}
      </Card>

      <Modal
        visible={selectedMemory !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMemory(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedMemory(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <View style={styles.modalCopy}>
                <Title>Пълна бележка</Title>
                <Caption>Запазена памет</Caption>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Затвори"
                onPress={() => setSelectedMemory(null)}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={20} color={Palette.ink} />
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
  subtitle: {
    marginBottom: Spacing.xl,
    marginTop: Spacing.sm,
  },
  statusBlock: {
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  feedbackCard: {
    marginBottom: Spacing.lg,
  },
  notesCard: {
    marginBottom: Spacing.lg,
  },
  notesHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
  },
  notesHeaderCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  notesBadge: {
    alignItems: "center",
    borderColor: Palette.line,
    borderRadius: Radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.xs,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  notesBadgeText: {
    color: Palette.ink,
    fontWeight: "700",
  },
  summaryRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    gap: Spacing.sm,
    minHeight: 96,
  },
  summaryCardInteractive: {
    backgroundColor: Palette.surfaceAlt,
    borderColor: Palette.line,
    borderRadius: Radii.lg,
    borderWidth: 1,
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  summaryCardPressed: {
    opacity: 0.7,
  },
  summaryHint: {
    color: Palette.ink,
    fontWeight: "700",
    marginTop: Spacing.xs,
  },
  noteList: {
    gap: Spacing.md,
  },
  noteCard: {
    gap: Spacing.sm,
  },
  noteCardTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  noteAccent: {
    backgroundColor: Palette.ink,
    borderRadius: Radii.pill,
    height: 6,
    width: 36,
  },
  noteIndex: {
    fontWeight: "700",
  },
  noteValue: {
    fontWeight: "700",
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
    backgroundColor: Palette.surface,
    borderColor: Palette.line,
    borderRadius: Radii.lg,
    borderWidth: 1,
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
    height: 32,
    justifyContent: "center",
    width: 32,
  },
});
