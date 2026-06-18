import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText, Body, Caption, Title } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Radii, Spacing, useColors } from '@/constants/theme';
import type { CalendarActivity } from '@/types/ui-models';

const weekdayLabels = ['П', 'В', 'С', 'Ч', 'П', 'С', 'Н'];

function formatDateKey(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfMonthDate(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function endOfMonthDate(value: Date) {
  return new Date(value.getFullYear(), value.getMonth() + 1, 0);
}

function shiftMonth(value: Date, offset: number) {
  return new Date(value.getFullYear(), value.getMonth() + offset, 1);
}

function startOfWeekMonday(value: Date) {
  const next = new Date(value);
  const dayOfWeek = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() - dayOfWeek);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfWeekMonday(value: Date) {
  const next = startOfWeekMonday(value);
  next.setDate(next.getDate() + 6);
  return next;
}

function eachDayBetween(start: Date, end: Date) {
  const days: Date[] = [];
  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function isSameMonthDate(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function isTodayDate(value: Date, today: Date) {
  return formatDateKey(value) === formatDateKey(today);
}

function formatMonthLabel(value: Date) {
  return new Intl.DateTimeFormat('bg-BG', { month: 'long', year: 'numeric' }).format(value);
}

function formatSelectedDateLabel(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat('bg-BG', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date(year, month - 1, day));
}

type HomeMonthCalendarProps = {
  reminders: CalendarActivity[];
};

export function HomeMonthCalendar({ reminders }: HomeMonthCalendarProps) {
  const c = useColors();
  const upcomingReminderColor = c.accent;
  const previousReminderColor = c.tertiaryLabel;

  const today = new Date();
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonthDate(today));

  const remindersByDate = useMemo(
    () =>
      reminders.reduce<Record<string, CalendarActivity[]>>((acc, item) => {
        if (!acc[item.date]) acc[item.date] = [];
        acc[item.date].push(item);
        return acc;
      }, {}),
    [reminders],
  );

  const monthDays = useMemo(() => {
    const monthStart = startOfMonthDate(visibleMonth);
    const monthEnd = endOfMonthDate(visibleMonth);
    return eachDayBetween(startOfWeekMonday(monthStart), endOfWeekMonday(monthEnd));
  }, [visibleMonth]);

  const defaultSelectedDate = useMemo(() => {
    const inMonth = reminders
      .filter((item) => {
        const [year, month] = item.date.split('-').map(Number);
        return year === visibleMonth.getFullYear() && month - 1 === visibleMonth.getMonth();
      })
      .map((item) => item.date)
      .sort()[0];
    return inMonth ?? null;
  }, [reminders, visibleMonth]);

  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    const todayKey = formatDateKey(today);
    return reminders.some((item) => item.date === todayKey) ? todayKey : null;
  });

  const resolvedSelectedDate =
    selectedDate &&
    remindersByDate[selectedDate]?.some((item) => {
      const [year, month] = item.date.split('-').map(Number);
      return year === visibleMonth.getFullYear() && month - 1 === visibleMonth.getMonth();
    })
      ? selectedDate
      : defaultSelectedDate;

  const selectedReminders = resolvedSelectedDate ? remindersByDate[resolvedSelectedDate] ?? [] : [];

  const handleChangeMonth = (offset: number) => {
    setVisibleMonth((current) => shiftMonth(current, offset));
  };

  return (
    <Card style={styles.calendarCard}>
      <View style={styles.calendarHeading}>
        <Title>Календар с напомняния</Title>
        <Caption>Докоснете отбелязан ден за подробности.</Caption>
      </View>

      <View style={styles.monthSwitcher}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Предишен месец"
          style={[styles.monthButton, { backgroundColor: c.fill }]}
          onPress={() => handleChangeMonth(-1)}
        >
          <Ionicons name="chevron-back" size={18} color={c.label} />
        </Pressable>
        <Body style={styles.monthLabel}>{formatMonthLabel(visibleMonth)}</Body>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Следващ месец"
          style={[styles.monthButton, { backgroundColor: c.fill }]}
          onPress={() => handleChangeMonth(1)}
        >
          <Ionicons name="chevron-forward" size={18} color={c.label} />
        </Pressable>
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: upcomingReminderColor }]} />
          <Caption>Предстоящи</Caption>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: previousReminderColor }]} />
          <Caption>Предишни</Caption>
        </View>
      </View>

      <View style={styles.weekdayRow}>
        {weekdayLabels.map((label, index) => (
          <Caption key={`${label}-${index}`} style={styles.weekdayLabel}>
            {label}
          </Caption>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {monthDays.map((day) => {
          const dayKey = formatDateKey(day);
          const dayReminders = remindersByDate[dayKey] ?? [];
          const hasReminders = dayReminders.length > 0;
          const isSelected = resolvedSelectedDate ? dayKey === resolvedSelectedDate : false;
          const hasFutureReminders = dayReminders.some((item) => item.isFuture);
          const dayDotColor = hasFutureReminders ? upcomingReminderColor : previousReminderColor;

          return (
            <Pressable
              key={dayKey}
              disabled={!hasReminders}
              onPress={() => setSelectedDate(dayKey)}
              style={[
                styles.dayCell,
                { backgroundColor: c.fill },
                isSelected ? { backgroundColor: c.accent } : null,
                isTodayDate(day, today) && !isSelected ? { borderColor: c.accent, borderWidth: 1 } : null,
                !isSameMonthDate(day, visibleMonth) ? styles.dayCellMuted : null,
              ]}>
              <AppText
                variant="caption"
                style={[
                  { color: c.tertiaryLabel, fontWeight: '600' },
                  hasReminders ? { color: c.label } : null,
                  isSelected ? { color: c.onAccent } : null,
                ]}>
                {day.getDate()}
              </AppText>
              <View style={styles.dotRow}>
                {hasReminders ? (
                  <View
                    style={[
                      styles.dayDot,
                      { backgroundColor: isSelected ? c.onAccent : dayDotColor },
                    ]}
                  />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {selectedReminders.length > 0 ? (
        <Card inset style={styles.activityDrawer}>
          <Body style={styles.activityDrawerTitle}>
            {resolvedSelectedDate ? formatSelectedDateLabel(resolvedSelectedDate) : ''}
          </Body>
          {selectedReminders.map((item) => (
            <View key={item.id} style={styles.activityDrawerRow}>
              <View
                style={[
                  styles.activityDrawerDot,
                  { backgroundColor: item.isFuture ? upcomingReminderColor : previousReminderColor },
                ]}
              />
              <View style={styles.activityDrawerCopy}>
                <Body style={styles.activityDrawerItemTitle}>{item.title}</Body>
                {item.description ? <Caption>{item.description}</Caption> : null}
                <Caption>
                  {item.detail}
                  {item.isFuture ? ' · предстоящо' : item.isPast ? ' · предишно' : ''}
                </Caption>
              </View>
            </View>
          ))}
        </Card>
      ) : (
        <Card inset>
          <Body style={styles.activityDrawerTitle}>Този месец няма напомняния</Body>
          <Caption>Опитайте друг месец за по-стари или предстоящи напомняния.</Caption>
        </Card>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  calendarCard: {
    marginTop: Spacing.sm,
  },
  calendarHeading: {
    gap: Spacing.xs,
  },
  monthSwitcher: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthButton: {
    alignItems: 'center',
    borderRadius: Radii.sm,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  monthLabel: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  legendDot: {
    borderRadius: 99,
    height: 8,
    width: 8,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  weekdayLabel: {
    textAlign: 'center',
    width: `${100 / 7}%`,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  dayCell: {
    alignItems: 'center',
    borderRadius: Radii.sm,
    minHeight: 52,
    paddingBottom: 8,
    paddingTop: 7,
    width: '13%',
  },
  dayCellMuted: {
    opacity: 0.35,
  },
  dotRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    justifyContent: 'center',
    marginTop: 6,
    minHeight: 8,
  },
  dayDot: {
    borderRadius: 99,
    height: 6,
    width: 6,
  },
  activityDrawer: {
    gap: Spacing.md,
  },
  activityDrawerTitle: {
    fontWeight: '600',
  },
  activityDrawerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.md,
  },
  activityDrawerDot: {
    borderRadius: 99,
    height: 10,
    marginTop: 6,
    width: 10,
  },
  activityDrawerCopy: {
    flex: 1,
    gap: 2,
  },
  activityDrawerItemTitle: {
    fontWeight: '600',
  },
});
