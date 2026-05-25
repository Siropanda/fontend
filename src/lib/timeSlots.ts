// 3-session time system: Morning, Afternoon, Evening
export const STANDARD_TIME_SLOTS = [
  { id: 1, time: "07:00-11:30", label: "Morning", shift: "morning" as const, display: "7:00 AM - 11:30 AM" },
  { id: 2, time: "13:00-17:00", label: "Afternoon", shift: "afternoon" as const, display: "1:00 PM - 5:00 PM" },
  { id: 3, time: "18:00-21:00", label: "Evening", shift: "evening" as const, display: "6:00 PM - 9:00 PM" },
] as const;

export type TimeSlot = typeof STANDARD_TIME_SLOTS[number];
export type ShiftType = "morning" | "afternoon" | "evening";

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type DayType = typeof DAYS[number];

export const getShiftColor = (shift: ShiftType) => {
  switch (shift) {
    case "morning":
      return "bg-amber-50 dark:bg-amber-950/30";
    case "afternoon":
      return "bg-sky-50 dark:bg-sky-950/30";
    case "evening":
      return "bg-violet-50 dark:bg-violet-950/30";
    default:
      return "";
  }
};

export const getShiftBadgeColor = (shift: ShiftType) => {
  switch (shift) {
    case "morning":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200";
    case "afternoon":
      return "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200";
    case "evening":
      return "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200";
    default:
      return "";
  }
};

export const getSlotById = (id: number) => {
  return STANDARD_TIME_SLOTS.find(slot => slot.id === id);
};

export const getSlotsByShift = (shift: ShiftType) => {
  return STANDARD_TIME_SLOTS.filter(slot => slot.shift === shift);
};

// Map a time like "07:00"-"09:00" to a session
export const getSessionForTime = (startTime: string): ShiftType => {
  const hour = parseInt(startTime.split(":")[0], 10);
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
};

export const getSlotTimeRange = (shift: ShiftType): string => {
  const slot = STANDARD_TIME_SLOTS.find(s => s.shift === shift);
  return slot?.time || "";
};
