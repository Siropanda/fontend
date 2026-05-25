import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Teacher } from "@/types";

const TIME_SLOTS = [
  "07:00-09:00",
  "09:00-11:00",
  "13:00-15:00",
  "15:00-17:00",
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getNextWeekDates = () => {
  const today = new Date();
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7) + 7);
  
  const dates: Record<string, string> = {};
  DAYS.forEach((day, index) => {
    const date = new Date(nextMonday);
    date.setDate(nextMonday.getDate() + index);
    dates[day] = date.toISOString().split('T')[0];
  });
  
  return dates;
};

interface TeacherAvailabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: Teacher | null;
}

const TeacherAvailabilityDialog = ({ open, onOpenChange, teacher }: TeacherAvailabilityDialogProps) => {
  const nextWeekDates = getNextWeekDates();
  
  const [availability, setAvailability] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    DAYS.forEach(day => {
      TIME_SLOTS.forEach(slot => {
        initial[`${day}-${slot}`] = true;
      });
    });
    return initial;
  });

  const toggleAvailability = (day: string, slot: string) => {
    const key = `${day}-${slot}`;
    setAvailability(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    console.log("Saving availability for teacher:", teacher?.id);
    console.log("Availability data:", availability);
    onOpenChange(false);
  };

  if (!teacher) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Availability - {teacher.fullName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Mark available time slots for next week's schedule planning
          </p>

          <div className="rounded-lg border border-border overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-bold text-foreground border-b border-border text-sm">
                    Time Slot
                  </th>
                  {DAYS.map(day => (
                    <th key={day} className="text-center p-3 font-bold text-foreground border-b border-border min-w-[100px]">
                      <div className="text-sm">{day}</div>
                      <div className="text-xs font-normal text-muted-foreground mt-1">
                        {nextWeekDates[day]}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map(slot => (
                  <tr key={slot} className="border-b border-border">
                    <td className="p-3 font-medium text-foreground text-sm">
                      {slot}
                    </td>
                    {DAYS.map(day => {
                      const key = `${day}-${slot}`;
                      const isAvailable = availability[key];
                      return (
                        <td key={day} className="text-center p-2">
                          <div 
                            className={`py-2 px-1 rounded cursor-pointer transition-colors ${
                              isAvailable 
                                ? 'bg-success/10 border border-success/20' 
                                : 'bg-destructive/10 border border-destructive/20'
                            }`}
                            onClick={() => toggleAvailability(day, slot)}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <Checkbox 
                                checked={isAvailable}
                                onCheckedChange={() => toggleAvailability(day, slot)}
                              />
                              <Label className="text-xs cursor-pointer hidden sm:inline">
                                {isAvailable ? 'Free' : 'Busy'}
                              </Label>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-success/10 border border-success/20"></div>
                <span className="text-muted-foreground">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-destructive/10 border border-destructive/20"></div>
                <span className="text-muted-foreground">Busy</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Availability
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeacherAvailabilityDialog;
