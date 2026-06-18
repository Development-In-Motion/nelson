import type { CalendarActivity } from '@/types/ui-models';
import type { UserMemoryRecord } from '@/types/memory';
import type { ReminderRecord } from '@/types/reminder';

export type HomeSummaryActivity = {
  id: string;
  title: string;
  description: string;
};

export type HomeSnapshotStat = {
  id: string;
  label: string;
  value: string;
};

export type HomeUpcomingReminder = {
  id: string;
  title: string;
  detail: string;
  description: string;
};

export type LiveElderProfile = {
  initials: string;
  name: string;
  phone: string;
  lastUpdatedLabel: string;
  aiActive: boolean;
};

function formatDateKey(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTimeLabel(value: Date) {
  return new Intl.DateTimeFormat('bg-BG', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(value);
}

function isValidDate(value: Date) {
  return !Number.isNaN(value.getTime());
}

type ParsedReminderDate = {
  date: Date;
  isClockOnly: boolean;
  parseStrategy: 'datetime' | 'time-only' | 'fallback';
};

function parseTimeParts(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] ?? '0');

  if (hours > 23 || minutes > 59 || seconds > 59) {
    return null;
  }

  return { hours, minutes, seconds };
}

function parseReminderDate(reminder: ReminderRecord): ParsedReminderDate {
  const parsedDateTime = new Date(reminder.endTime);
  if (isValidDate(parsedDateTime)) {
    return {
      date: parsedDateTime,
      isClockOnly: false,
      parseStrategy: 'datetime',
    };
  }

  const timeParts = parseTimeParts(reminder.endTime);
  if (timeParts) {
    const baseDate = new Date();
    baseDate.setHours(timeParts.hours, timeParts.minutes, timeParts.seconds, 0);

    return {
      date: baseDate,
      isClockOnly: true,
      parseStrategy: 'time-only',
    };
  }

  return {
    date: new Date(),
    isClockOnly: false,
    parseStrategy: 'fallback',
  };
}

function getNextReminderOccurrence(reminder: ReminderRecord) {
  const parsed = parseReminderDate(reminder);
  if (parsed.parseStrategy !== 'time-only') {
    return parsed;
  }

  const nextOccurrence = new Date(parsed.date);
  if (nextOccurrence.getTime() < Date.now()) {
    nextOccurrence.setDate(nextOccurrence.getDate() + 1);
  }

  return {
    ...parsed,
    date: nextOccurrence,
  };
}

function getReminderTimelineInfo(reminder: ReminderRecord) {
  const parsedReminder = getNextReminderOccurrence(reminder);
  const isValid = parsedReminder.parseStrategy !== 'fallback';
  const now = Date.now();
  const isFuture = isValid ? parsedReminder.date.getTime() >= now : false;

  return {
    isFuture,
    isPast: isValid ? !isFuture : false,
    isValid,
    parsedReminder,
  };
}

function formatRelativeLabel(value: string) {
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) {
    return 'Неизвестно';
  }

  const diffMs = Date.now() - time;
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `преди ${diffMinutes} ${diffMinutes === 1 ? 'минута' : 'минути'}`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `преди ${diffHours} ${diffHours === 1 ? 'час' : 'часа'}`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `преди ${diffDays} ${diffDays === 1 ? 'ден' : 'дни'}`;
}

function formatCalendarLabel(value: Date) {
  return new Intl.DateTimeFormat('bg-BG', {
    month: 'short',
    day: 'numeric',
  }).format(value);
}

function formatReminderDetail(value: Date) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const dateKey = formatDateKey(value);

  if (dateKey === formatDateKey(today)) {
    return `Днес в ${formatTimeLabel(value)}`;
  }

  if (dateKey === formatDateKey(tomorrow)) {
    return `Утре в ${formatTimeLabel(value)}`;
  }

  return `${formatCalendarLabel(value)} в ${formatTimeLabel(value)}`;
}

function toInitials(name?: string) {
  if (!name) {
    return 'ЧС';
  }

  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || 'ЧС';
}

export function buildElderProfile(memoryRecord: UserMemoryRecord | null, phone: string | null): LiveElderProfile {
  return {
    aiActive: true,
    initials: toInitials(memoryRecord?.name),
    lastUpdatedLabel: memoryRecord?.updatedAt ? formatRelativeLabel(memoryRecord.updatedAt) : 'Все още няма обновления',
    name: memoryRecord?.name ?? 'Член на семейството',
    phone: memoryRecord?.phone ?? phone ?? 'Няма свързан телефон',
  };
}

export function buildCalendarActivities(reminders: ReminderRecord[]): CalendarActivity[] {
  return reminders
    .map((reminder) => {
      const { isFuture, isPast, isValid, parsedReminder } = getReminderTimelineInfo(reminder);
      const endTime = parsedReminder.date;

      return {
        description: reminder.description?.trim() || undefined,
        id: reminder._id,
        date: isValid ? formatDateKey(endTime) : formatDateKey(new Date()),
        detail: isValid ? formatTimeLabel(endTime) : 'Часът не е наличен',
        isFuture,
        isPast,
        title: reminder.title,
        type: 'booking',
      } satisfies CalendarActivity;
    })
    .sort((left, right) => `${left.date} ${left.detail}`.localeCompare(`${right.date} ${right.detail}`));
}

export function buildDailySnapshot(
  memoryRecord: UserMemoryRecord | null,
  reminders: ReminderRecord[],
): HomeSnapshotStat[] {
  const todayKey = formatDateKey(new Date());
  const remindersToday = reminders.filter((item) => {
    const parsedReminder = parseReminderDate(item);
    return parsedReminder.parseStrategy !== 'fallback'
      ? formatDateKey(parsedReminder.date) === todayKey
      : false;
  }).length;

  return [
    {
      id: 'today-reminders',
      label: 'REMINDERS TODAY',
      value: `${remindersToday}`,
    },
    {
      id: 'memory-notes',
      label: 'MEMORY NOTES',
      value: `${memoryRecord?.memories.length ?? 0}`,
    },
    {
      id: 'profile-status',
      label: 'PROFILE',
      value: memoryRecord ? 'Linked' : 'Pending',
    },
  ];
}

export function buildUpcomingReminder(reminders: ReminderRecord[]): HomeUpcomingReminder | null {
  const nextReminder = [...reminders]
    .map((item) => ({ item, timeline: getReminderTimelineInfo(item) }))
    .filter(({ timeline }) => timeline.isValid && timeline.isFuture)
    .sort((left, right) => left.timeline.parsedReminder.date.getTime() - right.timeline.parsedReminder.date.getTime())[0];

  if (!nextReminder) {
    return null;
  }

  return {
    description: nextReminder.item.description?.trim() || 'No extra details added for this reminder.',
    detail: formatReminderDetail(nextReminder.timeline.parsedReminder.date),
    id: nextReminder.item._id,
    title: nextReminder.item.title,
  };
}

export function buildRecentActivity(reminders: ReminderRecord[]): HomeSummaryActivity[] {
  return [...reminders]
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 2)
    .map((reminder) => {
      const parsedReminder = parseReminderDate(reminder);
      const endTime = parsedReminder.date;
      const fallbackDescription = parsedReminder.parseStrategy !== 'fallback'
        ? `Насрочено за ${new Intl.DateTimeFormat('bg-BG', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }).format(endTime)}`
        : 'Часът не е наличен';

      return {
        description: reminder.description?.trim() || fallbackDescription,
        id: reminder._id,
        title: reminder.title,
      };
    });
}
