const SLOT_MINUTES = 15;

export function roundToQuarterHour(date: Date) {
  const d = new Date(date);
  const minutes = d.getMinutes();
  const rounded = Math.round(minutes / SLOT_MINUTES) * SLOT_MINUTES;
  d.setMinutes(rounded, 0, 0);
  return d;
}

export function floorToQuarterHour(date: Date) {
  const d = new Date(date);
  const minutes = d.getMinutes();
  d.setMinutes(Math.floor(minutes / SLOT_MINUTES) * SLOT_MINUTES, 0, 0);
  return d;
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

export function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function buildDaySlots(day: Date, startHour = 7, endHour = 21) {
  const slots: Date[] = [];
  const base = startOfDay(day);
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += SLOT_MINUTES) {
      const slot = new Date(base);
      slot.setHours(h, m, 0, 0);
      slots.push(slot);
    }
  }
  return slots;
}

export function slotCountBetween(start: Date, end: Date) {
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / (SLOT_MINUTES * 60_000)));
}

function padTimePart(n: number) {
  return String(n).padStart(2, "0");
}

export function quarterHourTimeOptions(startHour = 0, endHour = 24) {
  const options: { value: string; label: string }[] = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += SLOT_MINUTES) {
      const value = `${padTimePart(h)}:${padTimePart(m)}`;
      options.push({
        value,
        label: `${padTimePart(h)}:${padTimePart(m)}`,
      });
    }
  }
  return options;
}

export { SLOT_MINUTES };
