import { cn } from "@/lib/utils";
import { AvailableSlot } from "@/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PERIODS = Array.from({ length: 10 }, (_, i) => i + 1);

const PERIOD_TIMES: Record<number, string> = {
  1: "07:00-08:00",
  2: "08:00-09:00",
  3: "09:00-10:00",
  4: "10:00-11:00",
  5: "11:00-12:00",
  6: "13:00-14:00",
  7: "14:00-15:00",
  8: "15:00-16:00",
  9: "17:00-18:00", // Evening
  10: "19:00-20:00", // Evening
};

interface TimeGridSelectorProps {
  value: AvailableSlot[];
  onChange: (slots: AvailableSlot[]) => void;
  disabled?: boolean;
}

const TimeGridSelector = ({ value, onChange, disabled }: TimeGridSelectorProps) => {
  const isSelected = (day: string, period: number) => {
    return value.some(slot => slot.day === day && slot.period === period);
  };

  const toggleSlot = (day: string, period: number) => {
    if (disabled) return;
    
    const exists = isSelected(day, period);
    if (exists) {
      onChange(value.filter(slot => !(slot.day === day && slot.period === period)));
    } else {
      onChange([...value, { day, period }]);
    }
  };

  const selectAll = () => {
    if (disabled) return;
    const allSlots: AvailableSlot[] = [];
    DAYS.forEach(day => {
      PERIODS.forEach(period => {
        allSlots.push({ day, period });
      });
    });
    onChange(allSlots);
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  const toggleDay = (day: string) => {
    if (disabled) return;
    const daySlots = value.filter(slot => slot.day === day);
    if (daySlots.length === PERIODS.length) {
      // All selected, deselect all for this day
      onChange(value.filter(slot => slot.day !== day));
    } else {
      // Select all for this day
      const otherSlots = value.filter(slot => slot.day !== day);
      const newDaySlots = PERIODS.map(period => ({ day, period }));
      onChange([...otherSlots, ...newDaySlots]);
    }
  };

  const togglePeriod = (period: number) => {
    if (disabled) return;
    const periodSlots = value.filter(slot => slot.period === period);
    if (periodSlots.length === DAYS.length) {
      // All selected, deselect all for this period
      onChange(value.filter(slot => slot.period !== period));
    } else {
      // Select all for this period
      const otherSlots = value.filter(slot => slot.period !== period);
      const newPeriodSlots = DAYS.map(day => ({ day, period }));
      onChange([...otherSlots, ...newPeriodSlots]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-foreground">
          Availability Grid ({value.length} slots selected)
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            disabled={disabled}
            className="text-xs text-primary hover:underline disabled:opacity-50"
          >
            Select All
          </button>
          <span className="text-muted-foreground">|</span>
          <button
            type="button"
            onClick={clearAll}
            disabled={disabled}
            className="text-xs text-destructive hover:underline disabled:opacity-50"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-left font-semibold text-foreground border-b border-r border-border w-20">
                  Period
                </th>
                {DAYS.map(day => (
                  <th 
                    key={day} 
                    className="p-2 text-center font-semibold text-foreground border-b border-border cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => toggleDay(day)}
                    title={`Click to toggle all ${day} slots`}
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map(period => {
                const isEvening = period >= 9;
                return (
                  <tr 
                    key={period} 
                    className={cn(
                      "border-b border-border last:border-b-0",
                      isEvening && "bg-muted/20"
                    )}
                  >
                    <td 
                      className="p-2 font-medium text-foreground border-r border-border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => togglePeriod(period)}
                      title={`Click to toggle all Period ${period} slots`}
                    >
                      <div className="flex flex-col">
                        <span>P{period}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {PERIOD_TIMES[period]}
                        </span>
                      </div>
                    </td>
                    {DAYS.map(day => {
                      const selected = isSelected(day, period);
                      return (
                        <td key={day} className="p-1 text-center">
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => toggleSlot(day, period)}
                            className={cn(
                              "w-full h-8 rounded transition-all",
                              selected
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-muted/40 text-muted-foreground hover:bg-muted",
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

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-primary"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-muted/40 border border-border"></div>
          <span>Unavailable</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-muted/20 border border-border"></div>
          <span>Evening Slots (P9-P10)</span>
        </div>
      </div>
    </div>
  );
};

export default TimeGridSelector;
