import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { ScreenShell } from "@/components/screen-shell";
import { Body, Caption, Heading, Label, Muted, Title } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { Avatar } from "@/components/ui/avatar";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StatusTag } from "@/components/status-tag";
import { Spacing, useColors } from "@/constants/theme";
import { useAuth } from "@/context/auth-context";
import { useThemePreference, type ThemePreference } from "@/context/theme-preference";
import { buildElderProfile } from "@/lib/dashboard-data";
import { getCurrentUserMemory } from "@/lib/memory-api";
import type { UserMemoryRecord } from "@/types/memory";

const THEME_LABELS = ["Системна", "Светла", "Тъмна"];
const THEME_VALUES: ThemePreference[] = ["system", "light", "dark"];

const familyAccountProfile = {
  name: "Член на семейството",
  permissionLevel: "Локален достъп до приложението",
};

export default function ProfileScreen() {
  const c = useColors();
  const { signOut, user } = useAuth();
  const { preference, setPreference } = useThemePreference();
  const themeIndex = Math.max(0, THEME_VALUES.indexOf(preference));
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

      if (!options?.refresh) setIsLoading(true);
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
      <Heading style={styles.title}>Профил</Heading>
      <Muted style={styles.subtitle}>Семеен достъп, контекст за грижа и настройки.</Muted>

      <Label style={styles.sectionHeader}>Профил на близкия</Label>
      <Card style={styles.section}>
        <View style={styles.profileHeader}>
          <Avatar initials={elderProfile.initials} size={56} tone="neutral" />
          <View style={styles.profileCopy}>
            <Title>{elderProfile.name}</Title>
            <Caption>{elderProfile.phone}</Caption>
          </View>
        </View>

        {isLoading ? <Caption>Зареждане на профилните данни.</Caption> : null}
        {!isLoading && errorMessage ? <Caption>{errorMessage}</Caption> : null}
        {!isLoading && !errorMessage && !memoryRecord ? (
          <Caption>Все още няма запис за профил за този телефонен номер.</Caption>
        ) : null}

        <View style={styles.chipRow}>
          <StatusTag
            label={memoryRecord?.subscription ? "Абониран" : "Не е абониран"}
            tone={memoryRecord?.subscription ? "approved" : "declined"}
          />
        </View>

        {memoryRecord ? (
          <>
            <Divider />
            <View style={styles.row}>
              <Body>Бележки за памет</Body>
              <Body style={styles.rowValue}>{memoryRecord.memories.length}</Body>
            </View>
            <Divider />
            <View style={styles.row}>
              <Body>Последно обновяване</Body>
              <Body style={[styles.rowValue, { color: c.secondaryLabel }]} numberOfLines={1}>
                {elderProfile.lastUpdatedLabel}
              </Body>
            </View>
          </>
        ) : null}
      </Card>

      <Label style={styles.sectionHeader}>Вашият акаунт</Label>
      <Card style={styles.section}>
        <View style={styles.profileHeader}>
          <Avatar
            initials={(user?.name ?? familyAccountProfile.name).slice(0, 2).toUpperCase()}
            size={52}
            tone="neutral"
          />
          <View style={styles.profileCopy}>
            <Title>{user?.name ?? familyAccountProfile.name}</Title>
            <Caption>Вход само през приложението</Caption>
          </View>
        </View>

        <Divider />
        <View style={styles.row}>
          <Body>Ниво на достъп</Body>
          <Body style={[styles.rowValue, { color: c.secondaryLabel }]} numberOfLines={1}>
            {familyAccountProfile.permissionLevel}
          </Body>
        </View>
      </Card>

      <Label style={styles.sectionHeader}>Изглед</Label>
      <Card style={styles.section}>
        <SegmentedControl
          options={THEME_LABELS}
          selectedIndex={themeIndex}
          onChange={(i) => setPreference(THEME_VALUES[i])}
        />
      </Card>

      <Button label="Изход" variant="secondary" destructive onPress={handleSignOut} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    gap: 0,
  },
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
    marginTop: Spacing.sm,
  },
  profileHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
  },
  profileCopy: {
    flex: 1,
    gap: 2,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
  },
  rowValue: {
    flexShrink: 1,
    fontWeight: "600",
    textAlign: "right",
  },
});
