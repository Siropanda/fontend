import { Teacher, Subject } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Clock, 
  BookOpen, 
  TrendingUp, 
  Sun, 
  Calendar,
  Coffee
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TeacherPreferences {
  preferMorning: boolean;
  maxConsecutiveSlots: number;
  preferredDayOff: string | null;
}

interface TeacherStatsCardProps {
  teacher: Teacher;
  subjects: Subject[];
  preferences?: TeacherPreferences;
  onPreferencesChange?: (preferences: TeacherPreferences) => void;
  className?: string;
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const TeacherStatsCard = ({
  teacher,
  subjects,
  preferences = { preferMorning: false, maxConsecutiveSlots: 4, preferredDayOff: null },
  onPreferencesChange,
  className,
}: TeacherStatsCardProps) => {
  const teacherSubjects = subjects.filter(s => teacher.subjectIds?.includes(s.id));
  
  // Calculate stats
  const totalSlots = teacher.availableSlots?.length || 0;
  const totalHours = totalSlots * 0.75; // Assuming ~45 min per slot
  const morningSlots = teacher.availableSlots?.filter(s => s.period <= 4).length || 0;
  const afternoonSlots = teacher.availableSlots?.filter(s => s.period > 4 && s.period <= 8).length || 0;
  const eveningSlots = teacher.availableSlots?.filter(s => s.period > 8).length || 0;

  const handlePreferenceChange = (key: keyof TeacherPreferences, value: any) => {
    onPreferencesChange?.({
      ...preferences,
      [key]: value,
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalHours.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Teaching Hours</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <BookOpen className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{teacherSubjects.length}</p>
              <p className="text-xs text-muted-foreground">Active Subjects</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <TrendingUp className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalSlots}</p>
              <p className="text-xs text-muted-foreground">Available Slots</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent">
              <Calendar className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {morningSlots}/{afternoonSlots}/{eveningSlots}
              </p>
              <p className="text-xs text-muted-foreground">AM / PM / Eve</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Active Subjects */}
      <Card className="p-4">
        <h4 className="text-sm font-semibold mb-3">Active Subjects</h4>
        <div className="flex flex-wrap gap-2">
          {teacherSubjects.length > 0 ? (
            teacherSubjects.map((subject) => (
              <Badge key={subject.id} variant="secondary" className="gap-1">
                <span className="font-medium">{subject.code}</span>
                <span className="text-muted-foreground">•</span>
                <span>{subject.credits} credits</span>
              </Badge>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No subjects assigned</p>
          )}
        </div>
      </Card>

      {/* Soft Constraints / Preferences */}
      <Card className="p-4">
        <h4 className="text-sm font-semibold mb-4">Scheduling Preferences (Soft Constraints)</h4>
        <div className="space-y-4">
          {/* Prefer Morning */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <Sun className="h-4 w-4 text-warning" />
              <div>
                <Label className="font-medium">Prefer Morning Shifts</Label>
                <p className="text-xs text-muted-foreground">Prioritize slots before 12:00 PM</p>
              </div>
            </div>
            <Switch
              checked={preferences.preferMorning}
              onCheckedChange={(checked) => handlePreferenceChange("preferMorning", checked)}
            />
          </div>

          {/* Max Consecutive Slots */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <Coffee className="h-4 w-4 text-primary" />
              <div>
                <Label className="font-medium">Max Consecutive Slots</Label>
                <p className="text-xs text-muted-foreground">Limit continuous teaching periods</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {[2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => handlePreferenceChange("maxConsecutiveSlots", num)}
                  className={cn(
                    "h-8 w-8 rounded-md text-sm font-medium transition-colors",
                    preferences.maxConsecutiveSlots === num
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted-foreground/10"
                  )}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Day Off */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-success" />
              <div>
                <Label className="font-medium">Preferred Day Off</Label>
                <p className="text-xs text-muted-foreground">Select a preferred rest day</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {DAYS_OF_WEEK.slice(0, 5).map((day) => (
                <button
                  key={day}
                  onClick={() =>
                    handlePreferenceChange(
                      "preferredDayOff",
                      preferences.preferredDayOff === day ? null : day
                    )
                  }
                  className={cn(
                    "px-2 py-1 rounded text-xs font-medium transition-colors",
                    preferences.preferredDayOff === day
                      ? "bg-success text-success-foreground"
                      : "bg-muted hover:bg-muted-foreground/10"
                  )}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TeacherStatsCard;
