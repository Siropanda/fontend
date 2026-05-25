import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { addWeeks, startOfWeek, addDays, format } from "date-fns";
import { STANDARD_TIME_SLOTS, DAYS, getShiftColor } from "@/lib/timeSlots";

export interface WeeklySlot {
  weekOffset: number;
  day: string;
  period: number;
  date: string;
}

interface WeeklyAvailabilitySchedulerProps {
  value: WeeklySlot[];
  onChange: (slots: WeeklySlot[]) => void;
  disabled?: boolean;
}

const getWeekDates = (weekOffset: number) => {
  const today = new Date();
  const weekStart = startOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 1 });
  
  return DAYS.map((day, index) => {
    const date = addDays(weekStart, index);
    return {
      day,
      date: format(date, "yyyy-MM-dd"),
      display: format(date, "dd/MM"),
    };
  });
};

const WeeklyAvailabilityScheduler = ({
  value,
  onChange,
  disabled,
}: WeeklyAvailabilitySchedulerProps) => {
  const [activeWeek, setActiveWeek] = useState<string>("0");
  
  const weeks = useMemo(() => [
    { offset: 0, label: "This Week", dates: getWeekDates(0) },
    { offset: 1, label: "Next Week", dates: getWeekDates(1) },
    { offset: 2, label: "Week +2", dates: getWeekDates(2) },
  ], []);

  const currentWeekOffset = parseInt(activeWeek);
  const currentWeekDates = weeks[currentWeekOffset].dates;

  const isSelected = (weekOffset: number, day: string, period: number) => {
    return value.some(
      (slot) =>
        slot.weekOffset === weekOffset &&
        slot.day === day &&
        slot.period === period
    );
  };

  const toggleSlot = (weekOffset: number, day: string, period: number, date: string) => {
    if (disabled) return;

    const exists = isSelected(weekOffset, day, period);
    if (exists) {
      onChange(
        value.filter(
          (slot) =>
            !(slot.weekOffset === weekOffset && slot.day === day && slot.period === period)
        )
      );
    } else {
      onChange([...value, { weekOffset, day, period, date }]);
    }
  };

  const selectAllWeek = (weekOffset: number) => {
    if (disabled) return;
    const weekDates = weeks[weekOffset].dates;
    const newSlots: WeeklySlot[] = [];
    
    weekDates.forEach(({ day, date }) => {
      STANDARD_TIME_SLOTS.forEach((slot) => {
        if (!isSelected(weekOffset, day, slot.id)) {
          newSlots.push({ weekOffset, day, period: slot.id, date });
        }
      });
    });
    
    onChange([...value, ...newSlots]);
  };

  const clearWeek = (weekOffset: number) => {
    if (disabled) return;
    onChange(value.filter((slot) => slot.weekOffset !== weekOffset));
  };

  const toggleDay = (weekOffset: number, day: string, date: string) => {
    if (disabled) return;
    const daySlots = value.filter(
      (slot) => slot.weekOffset === weekOffset && slot.day === day
    );
    
    if (daySlots.length === STANDARD_TIME_SLOTS.length) {
      onChange(
        value.filter(
          (slot) => !(slot.weekOffset === weekOffset && slot.day === day)
        )
      );
    } else {
      const otherSlots = value.filter(
        (slot) => !(slot.weekOffset === weekOffset && slot.day === day)
      );
      const newDaySlots = STANDARD_TIME_SLOTS.map((slot) => ({
        weekOffset,
        day,
        period: slot.id,
        date,
      }));
      onChange([...otherSlots, ...newDaySlots]);
    }
  };

  const togglePeriod = (weekOffset: number, period: number) => {
    if (disabled) return;
    const weekDates = weeks[weekOffset].dates;
    const periodSlots = value.filter(
      (slot) => slot.weekOffset === weekOffset && slot.period === period
    );
    
    if (periodSlots.length === DAYS.length) {
      onChange(
        value.filter(
          (slot) => !(slot.weekOffset === weekOffset && slot.period === period)
        )
      );
    } else {
      const otherSlots = value.filter(
        (slot) => !(slot.weekOffset === weekOffset && slot.period === period)
      );
      const newPeriodSlots = weekDates.map(({ day, date }) => ({
        weekOffset,
        day,
        period,
        date,
      }));
      onChange([...otherSlots, ...newPeriodSlots]);
    }
  };

  const getWeekSlotCount = (weekOffset: number) => {
    return value.filter((slot) => slot.weekOffset === weekOffset).length;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            Mark available time slots for next week's schedule planning
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            Select your available time slots across a 3-week window (6 slots per day)
          </p>
        </div>
        <Badge variant="secondary" className="text-xs whitespace-nowrap">
          {value.length} slots selected
        </Badge>
      </div>

      <Tabs value={activeWeek} onValueChange={setActiveWeek} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {weeks.map((week) => (
            <TabsTrigger
              key={week.offset}
              value={week.offset.toString()}
              className="gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">{week.label}</span>
              <span className="sm:hidden">W{week.offset + 1}</span>
              <Badge
                variant={getWeekSlotCount(week.offset) > 0 ? "default" : "secondary"}
                className="h-5 px-1.5 text-xs"
              >
                {getWeekSlotCount(week.offset)}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {weeks.map((week) => (
          <TabsContent key={week.offset} value={week.offset.toString()} className="mt-4">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground">
                  {format(new Date(week.dates[0].date), "MMM dd")} -{" "}
                  {format(new Date(week.dates[6].date), "MMM dd, yyyy")}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => selectAllWeek(week.offset)}
                    disabled={disabled}
                    className="h-7 text-xs"
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => clearWeek(week.offset)}
                    disabled={disabled}
                    className="h-7 text-xs text-destructive hover:text-destructive"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-2 text-left font-semibold text-foreground border-b border-r border-border w-20 sm:w-24 sticky left-0 bg-muted/50 z-10">
                          Time
                        </th>
                        {currentWeekDates.map(({ day, display, date }) => (
                          <th
                            key={day}
                            className="p-1.5 sm:p-2 text-center font-semibold text-foreground border-b border-border cursor-pointer hover:bg-muted/80 transition-colors min-w-[50px] sm:min-w-[70px]"
                            onClick={() => toggleDay(week.offset, day, date)}
                            title={`Click to toggle all ${day} slots`}
                          >
                            <div className="flex flex-col">
                              <span className="text-xs sm:text-sm">{day}</span>
                              <span className="text-[9px] sm:text-[10px] font-normal text-muted-foreground">
                                {display}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {STANDARD_TIME_SLOTS.map((slot, index) => {
                        const isFirstOfShift =
                          index === 0 ||
                          STANDARD_TIME_SLOTS[index - 1].shift !== slot.shift;
                        
                        return (
                          <tr
                            key={slot.id}
                            className={cn(
                              "border-b border-border last:border-b-0",
                              getShiftColor(slot.shift),
                              isFirstOfShift && "border-t-2 border-t-border"
                            )}
                          >
                            <td
                              className={cn(
                                "p-1.5 sm:p-2 font-medium text-foreground border-r border-border cursor-pointer hover:bg-muted/50 transition-colors sticky left-0 z-10",
                                getShiftColor(slot.shift)
                              )}
                              onClick={() => togglePeriod(week.offset, slot.id)}
                              title={`Click to toggle all ${slot.label} slots`}
                            >
                              <div className="flex flex-col">
                                <span className="font-semibold text-xs sm:text-sm">{slot.label}</span>
                                <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                                  {slot.display}
                                </span>
                              </div>
                            </td>
                            {currentWeekDates.map(({ day, date }) => {
                              const selected = isSelected(week.offset, day, slot.id);
                              return (
                                <td key={day} className="p-0.5 sm:p-1 text-center">
                                  <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={() =>
                                      toggleSlot(week.offset, day, slot.id, date)
                                    }
                                    className={cn(
                                      "w-full h-6 sm:h-7 rounded transition-all text-[9px] sm:text-[10px] font-medium",
                                      selected
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "bg-background border border-border text-muted-foreground hover:bg-muted",
                                      disabled && "cursor-not-allowed opacity-50"
                                    )}
                                  >
                                    {selected ? "✓" : ""}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Legend - Responsive */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-primary"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-background border border-border"></div>
                  <span>Unavailable</span>
                </div>
                <span className="text-border hidden sm:inline">|</span>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-amber-50 dark:bg-amber-950/30 border border-border"></div>
                  <span>Morning</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-sky-50 dark:bg-sky-950/30 border border-border"></div>
                  <span>Afternoon</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-violet-50 dark:bg-violet-950/30 border border-border"></div>
                  <span>Evening</span>
                </div>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default WeeklyAvailabilityScheduler;
