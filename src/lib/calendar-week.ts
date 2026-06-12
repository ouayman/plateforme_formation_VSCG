export function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function getWeekDays(weekStart: Date) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function toDateKey(date: Date | string) {
  return new Date(date).toDateString();
}

export function isToday(date: Date) {
  return date.toDateString() === new Date().toDateString();
}

export function isSameWeek(date: Date, weekStart: Date) {
  const start = startOfWeek(date);
  return start.getTime() === weekStart.getTime();
}

export function sessionInWeek(startDatetime: string, weekStart: Date) {
  return isSameWeek(new Date(startDatetime), weekStart);
}
