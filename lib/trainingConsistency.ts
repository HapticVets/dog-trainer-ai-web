export type TrainingConsistencySession = {
  date?: string | null;
  createdAt?: string | null;
  duration?: string | number | null;
};

export type TrainingConsistencyStatus =
  | "Excellent"
  | "Good"
  | "Needs Improvement"
  | "No Recent Training";

export type TrainingConsistencySummary = {
  currentWeekSessions: number;
  lastWeekSessions: number;
  averageWeeklySessions: number;
  averageDurationMinutes: number | null;
  lastSessionDate: string | null;
  daysSinceLastSession: number | null;
  status: TrainingConsistencyStatus;
  message: string;
  trend: "Increasing" | "Steady" | "Lower than last week" | "No recent comparison";
  needsCheckIn: boolean;
};

const RECOMMENDED_WEEKLY_SESSIONS = 5;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const getSessionDate = (session: TrainingConsistencySession) => {
  const value = session.date || session.createdAt;
  if (!value) return null;

  // Session dates are stored as YYYY-MM-DD; parse them locally to avoid UTC date shifts.
  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day), 12);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getDurationMinutes = (duration: TrainingConsistencySession["duration"]) => {
  if (typeof duration === "number") return Number.isFinite(duration) ? duration : null;
  if (typeof duration !== "string") return null;

  const value = Number.parseFloat(duration);
  return Number.isFinite(value) ? value : null;
};

const startOfWeek = (date: Date) => {
  const start = new Date(date);
  const day = start.getDay();
  start.setDate(start.getDate() - ((day + 6) % 7));
  start.setHours(0, 0, 0, 0);
  return start;
};

const getStatus = (sessions: number): Pick<TrainingConsistencySummary, "status" | "message"> => {
  if (sessions >= RECOMMENDED_WEEKLY_SESSIONS) {
    return {
      status: "Excellent",
      message: "Excellent consistency this week. Your dog benefits from repeated successful practice.",
    };
  }

  if (sessions >= 3) {
    return {
      status: "Good",
      message: "You are building a consistent routine. Keep practicing to maintain progress.",
    };
  }

  if (sessions >= 1) {
    return {
      status: "Needs Improvement",
      message: "More frequent practice will help your dog learn faster. Aim for several short sessions each week.",
    };
  }

  return {
    status: "No Recent Training",
    message: "It has been a little while since your last recorded session. Even short training sessions help build lasting habits.",
  };
};

export const getTrainingConsistency = (
  sessions: readonly TrainingConsistencySession[],
  now = new Date(),
): TrainingConsistencySummary => {
  const datedSessions = sessions
    .map((session) => ({ session, date: getSessionDate(session) }))
    .filter((entry): entry is { session: TrainingConsistencySession; date: Date } => entry.date !== null)
    .sort((first, second) => second.date.getTime() - first.date.getTime());
  const weekStart = startOfWeek(now);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const previousWeekStart = new Date(weekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  const currentWeekSessions = datedSessions.filter(
    ({ date }) => date >= weekStart && date <= todayEnd,
  ).length;
  const lastWeekSessions = datedSessions.filter(
    ({ date }) => date >= previousWeekStart && date < weekStart,
  ).length;
  const earliestSession = datedSessions.at(-1)?.date;
  const weeksTracked = earliestSession
    ? Math.max(1, Math.floor((weekStart.getTime() - startOfWeek(earliestSession).getTime()) / (7 * MILLISECONDS_PER_DAY)) + 1)
    : 1;
  const durations = sessions
    .map((session) => getDurationMinutes(session.duration))
    .filter((duration): duration is number => duration !== null);
  const lastSessionDate = datedSessions[0]?.date ?? null;
  const daysSinceLastSession = lastSessionDate
    ? Math.max(0, Math.floor((now.getTime() - lastSessionDate.getTime()) / MILLISECONDS_PER_DAY))
    : null;
  const { status, message } = getStatus(currentWeekSessions);
  const trend =
    currentWeekSessions === 0 && lastWeekSessions === 0
      ? "No recent comparison"
      : currentWeekSessions > lastWeekSessions
      ? "Increasing"
      : currentWeekSessions < lastWeekSessions
      ? "Lower than last week"
      : "Steady";

  return {
    currentWeekSessions,
    lastWeekSessions,
    averageWeeklySessions: Number((datedSessions.length / weeksTracked).toFixed(1)),
    averageDurationMinutes: durations.length
      ? Number((durations.reduce((total, duration) => total + duration, 0) / durations.length).toFixed(1))
      : null,
    lastSessionDate: lastSessionDate?.toISOString() ?? null,
    daysSinceLastSession,
    status,
    message,
    trend,
    needsCheckIn: daysSinceLastSession !== null && daysSinceLastSession > 7,
  };
};

export const buildTrainingConsistencyContext = (
  sessions: readonly TrainingConsistencySession[],
): string => {
  const consistency = getTrainingConsistency(sessions);
  const lastSession = consistency.lastSessionDate
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
        new Date(consistency.lastSessionDate),
      )
    : "No recorded session";

  return `TRAINING CONSISTENCY
Current status: ${consistency.status}
Sessions this week: ${consistency.currentWeekSessions}
Sessions last week: ${consistency.lastWeekSessions}
Average sessions per week: ${consistency.averageWeeklySessions}
Average session duration: ${consistency.averageDurationMinutes ? `${consistency.averageDurationMinutes} minutes` : "Not available"}
Last recorded session: ${lastSession}
Current trend: ${consistency.trend}
${consistency.needsCheckIn ? "The last recorded session was more than 7 days ago. Briefly ask whether training continued without logging or whether the handler wants to pick up from the last recorded session before giving new progression advice. Do not block the conversation." : ""}`;
};
