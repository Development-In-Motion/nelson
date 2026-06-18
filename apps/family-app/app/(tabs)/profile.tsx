import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { ScreenShell } from "@/components/screen-shell";
import { AppText, Caption, Heading, Label, Muted, Title } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusTag } from "@/components/status-tag";
import { Palette, Radii, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/auth-context";
import { buildElderProfile } from "@/lib/dashboard-data";
import { getCurrentUserMemory } from "@/lib/memory-api";
import type { UserMemoryRecord } from "@/types/memory";

const familyAccountProfile = {
  name: "Член на семейството",
  permissionLevel: "Локален достъп до приложението",
};

export default function ProfileScreen() {
  const { signOut, user } = useAuth();
  const [memoryRecord, setMemoryRecord] = useState<UserMemoryRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProfile = useCallback(
    async (options?: { signal?: { aborted: boolean }; refresh?: boolean }) => {
      if (!user?.phone) {
        setMemoryRecord(null);
        setErrorMessage("Влезте с телефонен номер, за да заредите профила в реално време.");
        setIsLoading(false);
        return;
      }

      if (!options?.refresh) {
        setIsLoading(true);
      }
      setErrorMessage(null);

      try {
        const record = await getCurrentUserMemory(user.phone);

        if (!options?.signal?.aborted) {
          setMemoryRecord(record);
          setErrorMessage(null);
        }
      } catch (error) {
        if (!options?.signal?.aborted) {
          setMemoryRecord(null);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Профилът в реално време не може да бъде зареден в момента.",
          );
        }
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
    void loadProfile({ signal: request });

    return () => {
      request.aborted = true;
    };
  }, [loadProfile]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    void loadProfile({ refresh: true });
  }, [loadProfile]);

  const elderProfile = useMemo(
    () => buildElderProfile(memoryRecord, user?.phone ?? null),
    [memoryRecord, user?.phone],
  );

  const handleSignOut = () => {
    signOut();
    router.replace("/auth");
  };

  return (
    <ScreenShell contentContainerStyle={styles.contentContainer} refreshing={isRefreshing} onRefresh={handleRefresh}>
      <Heading>Профил</Heading>
      <Muted style={styles.subtitle}>Семеен достъп, контекст за грижа и настройки за известия.</Muted>

      <Card style={styles.card}>
        <Title>Профил на близкия</Title>

        <View style={styles.profileHeader}>
          <View style={styles.primaryAvatar}>
            <AppText style={styles.avatarLabel}>{elderProfile.initials}</AppText>
          </View>
          <View style={styles.profileCopy}>
            <Title>{elderProfile.name}</Title>
            <Caption>{elderProfile.phone}</Caption>
          </View>
        </View>

        {isLoading ? (
          <Card inset>
            <Caption>Зареждане на профилните данни в реално време.</Caption>
          </Card>
        ) : null}

        {!isLoading && errorMessage ? (
          <Card inset>
            <Caption>{errorMessage}</Caption>
          </Card>
        ) : null}

        {!isLoading && !errorMessage && !memoryRecord ? (
          <Card inset>
            <Caption>Все още няма запис за профил в реално време за този телефонен номер.</Caption>
          </Card>
        ) : null}

        <View style={styles.chipRow}>
          <StatusTag
            label={memoryRecord?.subscription ? "Абониран" : "Не е абониран"}
            tone={memoryRecord?.subscription ? "approved" : "declined"}
          />
          <StatusTag
            label={
              memoryRecord
                ? `${memoryRecord.memories.length} бележки за памет`
                : "Все още няма бележки"
            }
            tone="calendar"
          />
        </View>

        {memoryRecord ? (
          <View style={styles.statsRow}>
            <Card inset style={styles.statItem}>
              <Label>Бележки за памет</Label>
              <Title>{memoryRecord.memories.length}</Title>
            </Card>
            <Card inset style={styles.statItem}>
              <Label>Последно обновяване</Label>
              <Title>{elderProfile.lastUpdatedLabel}</Title>
            </Card>
          </View>
        ) : null}
      </Card>

      <Card style={styles.card}>
        <Title>Вашият акаунт</Title>

        <View style={styles.profileHeader}>
          <View style={styles.secondaryAvatar}>
            <AppText style={styles.secondaryAvatarLabel}>
              {(user?.name ?? familyAccountProfile.name).slice(0, 2).toUpperCase()}
            </AppText>
          </View>
          <View style={styles.profileCopy}>
            <Title>{user?.name ?? familyAccountProfile.name}</Title>
            <Caption>Вход само през приложението</Caption>
          </View>
        </View>

        <View style={styles.footerBlock}>
          <Label>Ниво на достъп</Label>
          <StatusTag label={familyAccountProfile.permissionLevel} tone="calendar" />
        </View>

        <Button label="Изход" variant="secondary" onPress={handleSignOut} />
      </Card>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    gap: Spacing.lg,
  },
  subtitle: {
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  card: {
    gap: Spacing.lg,
  },
  profileHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.lg,
  },
  profileCopy: {
    flex: 1,
    gap: 2,
  },
  primaryAvatar: {
    alignItems: "center",
    backgroundColor: Palette.ink,
    borderRadius: Radii.lg,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  secondaryAvatar: {
    alignItems: "center",
    backgroundColor: Palette.surfaceAlt,
    borderColor: Palette.ink,
    borderRadius: Radii.lg,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  avatarLabel: {
    color: Palette.onInk,
    fontWeight: "700",
    fontSize: 20,
  },
  secondaryAvatarLabel: {
    color: Palette.ink,
    fontWeight: "700",
    fontSize: 18,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  statItem: {
    flex: 1,
    gap: Spacing.sm,
  },
  footerBlock: {
    gap: Spacing.sm,
  },
});
