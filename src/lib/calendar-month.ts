import { addDays } from "@/lib/calendar-week";

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export function getMonthGrid(month: Date) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const startOffset = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1;
  const gridStart = addDays(monthStart, -startOffset);

  const days: { date: Date; inMonth: boolean }[] = [];
  let cursor = gridStart;

  while (days.length < 42) {
    days.push({
      date: new Date(cursor),
      inMonth: cursor >= monthStart && cursor <= monthEnd,
    });
    cursor = addDays(cursor, 1);
    if (days.length >= 35 && cursor > monthEnd && cursor.getDay() === 1) break;
  }

  return days;
}

export const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function formatMonthYear(date: Date) {
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}
