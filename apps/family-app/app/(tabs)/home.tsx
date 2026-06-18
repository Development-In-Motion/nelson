import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { HomeMonthCalendar } from "@/components/home-month-calendar";
import { ScreenShell } from "@/components/screen-shell";
import { StatusTag } from "@/components/status-tag";
import { AppText, Body, Caption, Heading, Label, Title } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { Palette, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/auth-context";
import {
  buildCalendarActivities,
  buildElderProfile,
  buildUpcomingReminder,
} from "@/lib/dashboard-data";
import {
  getCurrentUserMemory,
  getUserTotalCallMinutes,
  listRecentCalls,
  type RecentCallItem,
} from "@/lib/memory-api";
import { listReminders } from "@/lib/reminders-api";
import type { UserMemoryRecord } from "@/types/memory";
import type { ReminderRecord } from "@/types/reminder";

const GREETING_LABEL = "Здравей";
const LAST_UPDATED_LABEL = "Последно обновяване";
const AI_ACTIVE_LABEL = "AI активно";
const AI_INACTIVE_LABEL = "AI неактивно";
const PHONE_LABEL = "Свързан телефон";
const LOADING_LABEL = "Зареждане на таблото с данни в реално време.";
const NEXT_LABEL = "Следващо";
const RECENT_CALLS_LABEL = "Скорошни разговори";
const NO_RECENT_CALLS_LABEL = "Няма скорошни разговори";
const TOTAL_AI_TIME_LABEL = "Общо време с AI";
const DURATION_UNAVAILABLE_LABEL = "Продължителността не е достъпна";
const UPCOMING_REMINDER_LABEL = "Предстоящо напомняне";
const NO_UPCOMING_REMINDERS_LABEL = "Все още няма предстоящи напомняния.";

function formatCallDuration(durationSec: number | null) {
  if (typeof durationSec !== "number") {
    return DURATION_UNAVAILABLE_LABEL;
  }

  return `${Math.max(1, Math.round(durationSec / 60))} мин`;
}

function formatCallStartedAt(startedAt: string) {
  const parsedDate = new Date(startedAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return startedAt;
  }

  return new Intl.DateTimeFormat("bg-BG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedDate);
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [memoryRecord, setMemoryRecord] = useState<UserMemoryRecord | null>(null);
  const [reminders, setReminders] = useState<ReminderRecord[]>([]);
  const [recentCalls, setRecentCalls] = useState<RecentCallItem[]>([]);
  const [totalCallMinutes, setTotalCallMinutes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDashboard = useCallback(
    async (options?: { signal?: { aborted: boolean }; refresh?: boolean }) => {
      if (!user?.phone) {
        setMemoryRecord(null);
        setReminders([]);
        setRecentCalls([]);
        setTotalCallMinutes(0);
        setErrorMessage("Влезте с телефонен номер, за да заредите данните в реално време.");
        setIsLoading(false);
        return;
      }

      if (!options?.refresh) {
        setIsLoading(true);
      }
      setErrorMessage(null);

      try {
        const [memoryResult, remindersResult, callMinutesResult, recentCallsResult] =
          await Promise.allSettled([
            getCurrentUserMemory(user.phone),
            listReminders(user.phone),
            getUserTotalCallMinutes(user.phone),
            listRecentCalls(user.phone, 4),
          ]);

        if (options?.signal?.aborted) {
          return;
        }

        const nextErrors: string[] = [];

        if (memoryResult.status === "fulfilled") {
          setMemoryRecord(memoryResult.value);
        } else {
          setMemoryRecord(null);
          nextErrors.push("Паметта не можа да бъде заредена.");
        }

        if (remindersResult.status === "fulfilled") {
          setReminders(remindersResult.value);
        } else {
          setReminders([]);
          nextErrors.push("Напомнянията не можаха да бъдат заредени.");
        }

        if (callMinutesResult.status === "fulfilled") {
          setTotalCallMinutes(callMinutesResult.value);
        } else {
          setTotalCallMinutes(0);
          nextErrors.push("Минутите разговори не можаха да бъдат заредени.");
        }

        if (recentCallsResult.status === "fulfilled") {
          setRecentCalls(recentCallsResult.value);
        } else {
          setRecentCalls([]);
          nextErrors.push("Скорошните разговори не можаха да бъдат заредени.");
        }

        setErrorMessage(nextErrors.length > 0 ? nextErrors.join(" ") : null);
      } catch (error) {
        if (options?.signal?.aborted) {
          return;
        }

        setMemoryRecord(null);
        setReminders([]);
        setRecentCalls([]);
        setTotalCallMinutes(0);
        setErrorMessage(
          error instanceof Error ? error.message : "Данните не можаха да бъдат заредени.",
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
    void loadDashboard({ signal: request });

    return () => {
      request.aborted = true;
    };
  }, [loadDashboard]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    void loadDashboard({ refresh: true });
  }, [loadDashboard]);

  const elderProfile = useMemo(
    () => buildElderProfile(memoryRecord, user?.phone ?? null),
    [memoryRecord, user?.phone],
  );
  const calendarMonthActivities = useMemo(
    () => buildCalendarActivities(reminders),
    [reminders],
  );
  const upcomingReminder = useMemo(() => buildUpcomingReminder(reminders), [reminders]);
  const formattedRecentCalls = useMemo(
    () =>
      recentCalls.map((call) => ({
        ...call,
        durationLabel: formatCallDuration(call.durationSec),
        timeLabel: formatCallStartedAt(call.startedAt),
      })),
    [recentCalls],
  );

  return (
    <ScreenShell refreshing={isRefreshing} onRefresh={handleRefresh}>
      <Heading style={styles.title}>
        {GREETING_LABEL}, {user?.name}
      </Heading>

      <Card style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.avatar}>
            <AppText style={styles.avatarLabel}>{elderProfile.initials}</AppText>
          </View>
          <View style={styles.heroText}>
            <Title>{elderProfile.name}</Title>
            <Caption>
              {LAST_UPDATED_LABEL}: {elderProfile.lastUpdatedLabel}
            </Caption>
          </View>
        </View>

        <StatusTag
          label={elderProfile.aiActive ? AI_ACTIVE_LABEL : AI_INACTIVE_LABEL}
          tone={elderProfile.aiActive ? "approved" : "declined"}
        />

        <View style={styles.heroStatsRow}>
          <View style={styles.heroStatCard}>
            <Label>{TOTAL_AI_TIME_LABEL}</Label>
            <Title style={styles.heroStatValue}>{totalCallMinutes} мин</Title>
          </View>
          <View style={styles.heroStatCard}>
            <Label>{PHONE_LABEL}</Label>
            <Body style={styles.heroStatValue}>{elderProfile.phone}</Body>
          </View>
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <Title>{RECENT_CALLS_LABEL}</Title>
        {formattedRecentCalls.length > 0 ? (
          <View style={styles.callsList}>
            {formattedRecentCalls.map((call, index) => (
              <View key={call.id}>
                {index > 0 ? <Divider style={styles.callDivider} /> : null}
                <View style={styles.callRow}>
                  <Body style={styles.callTime}>{call.timeLabel}</Body>
                  <Caption>{call.durationLabel}</Caption>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Caption>{NO_RECENT_CALLS_LABEL}</Caption>
        )}
      </Card>

      {isLoading ? (
        <Card style={styles.sectionCard}>
          <Caption>{LOADING_LABEL}</Caption>
        </Card>
      ) : null}

      {!isLoading && errorMessage ? (
        <Card style={styles.sectionCard}>
          <Caption>{errorMessage}</Caption>
        </Card>
      ) : null}

      <Label style={styles.sectionHeader}>{NEXT_LABEL}</Label>

      <Card style={styles.sectionCard}>
        {upcomingReminder ? (
          <View style={styles.nextUpBlock}>
            <StatusTag label={UPCOMING_REMINDER_LABEL} tone="calendar" />
            <Title>{upcomingReminder.title}</Title>
            <Body style={styles.nextUpDetail}>{upcomingReminder.detail}</Body>
            <Caption>{upcomingReminder.description}</Caption>
          </View>
        ) : (
          <Caption>{NO_UPCOMING_REMINDERS_LABEL}</Caption>
        )}
      </Card>

      <HomeMonthCalendar reminders={calendarMonthActivities} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: Spacing.xl,
  },
  heroCard: {
    marginBottom: Spacing.lg,
  },
  heroTopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.lg,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: Palette.ink,
    borderRadius: 14,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  avatarLabel: {
    color: Palette.onInk,
    fontWeight: "700",
  },
  heroText: {
    flex: 1,
    gap: 2,
  },
  heroStatsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  heroStatCard: {
    backgroundColor: Palette.surfaceAlt,
    borderColor: Palette.line,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    gap: Spacing.sm,
    justifyContent: "center",
    minHeight: 74,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  heroStatValue: {
    fontWeight: "700",
  },
  sectionCard: {
    marginBottom: Spacing.lg,
  },
  callsList: {
    gap: 0,
  },
  callDivider: {
    marginVertical: Spacing.md,
  },
  callRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  callTime: {
    fontWeight: "700",
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  nextUpBlock: {
    gap: Spacing.sm,
  },
  nextUpDetail: {
    fontWeight: "700",
  },
});
