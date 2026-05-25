import { useState, useMemo, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { useSchedules } from "@/contexts/ScheduleContext";
import { useClasses } from "@/contexts/ClassContext";
import { useSubjects } from "@/contexts/SubjectContext";
import { useTeachers } from "@/contexts/TeacherContext";
import { useClassrooms } from "@/contexts/ClassroomContext";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ScheduleEditDialog from "@/components/ScheduleEditDialog";
import TimetableGrid from "@/components/TimetableGrid";
import { useToast } from "@/hooks/use-toast";

import { DateRange } from "react-day-picker";
import {
  isWithinInterval, parseISO, startOfWeek, endOfWeek, addWeeks,
  format, differenceInDays, eachWeekOfInterval, addDays,
} from "date-fns";
import { CalendarIcon, LayoutGrid, GraduationCap, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClassProgressPopup } from "@/components/ClassProgressPopup";
import { Skeleton } from "@/components/ui/skeleton";
import { ScheduleMode, ExamType } from "@/types";
import { STANDARD_TIME_SLOTS, getSessionForTime } from "@/lib/timeSlots";
// Default to current week so the timetable always renders something on first paint
const getDefaultWeekRange = (): DateRange => {
  const now = new Date();
  return {
    from: startOfWeek(now, { weekStartsOn: 1 }),
    to: endOfWeek(now, { weekStartsOn: 1 }),
  };
};

type ViewMode = "overview" | "class-specific";
type SemesterFilter = "all" | "semester1" | "semester2";

interface SessionEntry {
  id: string;
  subject: string;
  teacher: string;
  room: string;
  startTime: string;
  endTime: string;
  lessonType?: "theory" | "practice";
}

interface EditDialogState {
  open: boolean;
  classCode: string;
  day: string;
  timeSlot: string;
  existingSession: SessionEntry | null;
  weekStart?: Date;
}

// `mode` controls how the preset is applied:
//  - "fromToday": offset N weeks from today's week (used by This Week / Next Week)
//  - "advance14": jump exactly +14 days from the CURRENT visible start (Next 2 Weeks)
//  - "month": full weeks covering the current calendar month
type WeekPreset =
  | { label: string; mode: "fromToday"; offset: number; weeks: number }
  | { label: string; mode: "advance14" }
  | { label: string; mode: "month" };

const WEEK_PRESETS: WeekPreset[] = [
  { label: "This Week", mode: "fromToday", offset: 0, weeks: 1 },
  { label: "Next Week", mode: "fromToday", offset: 1, weeks: 1 },
  { label: "Next 2 Weeks", mode: "advance14" },
  { label: "This Month", mode: "month" },
];

const Timetable = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("overview");

  const { schedules, loading: schedulesLoading, refreshSchedules, addSchedule, editSchedule, removeSchedule } = useSchedules();
  const { allSubjects: subjects } = useSubjects();
  const { allTeachers: teachers } = useTeachers();
  const { allClassrooms: classrooms } = useClassrooms();
  const { allClasses: classes } = useClasses();

  // Overview mode state — default to current week so grid renders immediately
  const [overviewDateRange, setOverviewDateRange] = useState<DateRange | undefined>(() => getDefaultWeekRange());
  const [filterTeacher, setFilterTeacher] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterClassroom, setFilterClassroom] = useState("all");

  // Class-specific mode state — also default to current week
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [classDateRange, setClassDateRange] = useState<DateRange | undefined>(() => getDefaultWeekRange());
  const [classSemester, setClassSemester] = useState<SemesterFilter>("all");

  const [editDialog, setEditDialog] = useState<EditDialogState>({
    open: false, classCode: "", day: "", timeSlot: "", existingSession: null,
  });

  // ClassProgressPopup state with refreshKey to force re-fetch after add/edit/delete
  const [progressPopup, setProgressPopup] = useState<{
    open: boolean;
    classId: string;
    classCode: string;
    refreshKey: number;
  }>({ open: false, classId: "", classCode: "", refreshKey: 0 });

  const { toast } = useToast();

  const currentDateRange = viewMode === "overview" ? overviewDateRange : classDateRange;
  const currentSetDateRange = viewMode === "overview" ? setOverviewDateRange : setClassDateRange;

  // Handler to open ClassProgressPopup when a class header is clicked
  const handleClassClick = (classCode: string) => {
    const classObj = classes.find(c => c.code === classCode);
    if (!classObj) return;
    setProgressPopup(prev => ({
      ...prev,
      open: true,
      classId: classObj.id,
      classCode,
    }));
  };

  // Reload schedules whenever filters or date range change.
  // IMPORTANT: We expand the API request range to full week boundaries (Mon→Sun) so
  // every visible week in the grid is fully populated, even when the user picks a
  // mid-week start (e.g. Wed → Wed should still load Mon Wk1 → Sun Wk2).
  useEffect(() => {
    if (!currentDateRange?.from || !currentDateRange?.to) return;

    const apiStart = startOfWeek(currentDateRange.from, { weekStartsOn: 1 });
    const apiEnd = endOfWeek(currentDateRange.to, { weekStartsOn: 1 });

    const params: any = {
      start_date: format(apiStart, 'yyyy-MM-dd'),
      end_date: format(apiEnd, 'yyyy-MM-dd'),
    };

    if (viewMode === 'overview') {
      if (filterTeacher !== 'all') params.teacherId = filterTeacher;
      if (filterSubject !== 'all') params.subjectId = filterSubject;
      if (filterClassroom !== 'all') params.classroomId = filterClassroom;
    } else {
      if (selectedClassId) params.classId = selectedClassId;
    }

    refreshSchedules(params);
    // Depend on primitives (timestamps) to avoid object-reference re-fetches
  }, [
    viewMode,
    currentDateRange?.from?.getTime(),
    currentDateRange?.to?.getTime(),
    filterTeacher,
    filterSubject,
    filterClassroom,
    selectedClassId,
    refreshSchedules,
  ]);

  // Date range info badge
  const dateRangeInfo = useMemo(() => {
    if (!currentDateRange?.from || !currentDateRange?.to) return null;
    const days = differenceInDays(currentDateRange.to, currentDateRange.from) + 1;
    // Count actual weeks the range spans (not just ceil days/7), accounting for week boundaries
    const expandedStart = startOfWeek(currentDateRange.from, { weekStartsOn: 1 });
    const expandedEnd = endOfWeek(currentDateRange.to, { weekStartsOn: 1 });
    const weeks = Math.round(differenceInDays(expandedEnd, expandedStart) / 7) + 1;
    return { days, weeks };
  }, [currentDateRange]);

  // Debounce rapid clicks (race-condition guard) — ignore presses within 300ms
  const lastPresetClickRef = useRef<number>(0);

  const handleWeekPreset = (preset: WeekPreset) => {
    const now = Date.now();
    if (now - lastPresetClickRef.current < 300) return;
    lastPresetClickRef.current = now;

    if (preset.mode === "month") {
      const anchor = new Date();
      const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
      currentSetDateRange({
        from: startOfWeek(monthStart, { weekStartsOn: 1 }),
        to: endOfWeek(monthEnd, { weekStartsOn: 1 }),
      });
      return;
    }

    if (preset.mode === "fromToday") {
      const anchor = new Date();
      currentSetDateRange({
        from: startOfWeek(addWeeks(anchor, preset.offset), { weekStartsOn: 1 }),
        to: endOfWeek(addWeeks(anchor, preset.offset + preset.weeks - 1), { weekStartsOn: 1 }),
      });
      return;
    }

    if (preset.mode === "advance14") {
      // Functional update so rapid clicks always read the latest state (no compounding bugs).
      // Advances exactly 14 days from the current visible week's Monday.
      const advance = (range: DateRange | undefined): DateRange => {
        const baseStart = range?.from
          ? startOfWeek(range.from, { weekStartsOn: 1 })
          : startOfWeek(new Date(), { weekStartsOn: 1 });
        const newStart = addDays(baseStart, 14);
        return { from: newStart, to: endOfWeek(newStart, { weekStartsOn: 1 }) };
      };

      if (viewMode === "overview") {
        setOverviewDateRange((prev) => advance(prev));
      } else {
        setClassDateRange((prev) => advance(prev));
      }
    }
  };

  const resetFilters = () => {
    if (viewMode === "overview") {
      setFilterTeacher("all");
      setFilterSubject("all");
      setFilterClassroom("all");
      setOverviewDateRange(getDefaultWeekRange());
    } else {
      setClassDateRange(getDefaultWeekRange());
      setClassSemester("all");
    }
  };

  // Calculate weeks in the current date range.
  // We expand to full Mon→Sun boundaries so every affected week is rendered in full,
  // even when the user picks a mid-week range (e.g. Wed → Wed renders 2 full weeks).
  const weeksInRange = useMemo(() => {
    if (!currentDateRange?.from || !currentDateRange?.to) return [];
    const expandedStart = startOfWeek(currentDateRange.from, { weekStartsOn: 1 });
    const expandedEnd = endOfWeek(currentDateRange.to, { weekStartsOn: 1 });
    const weekStarts = eachWeekOfInterval(
      { start: expandedStart, end: expandedEnd },
      { weekStartsOn: 1 }
    );
    return weekStarts.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      return {
        start: weekStart,
        end: weekEnd,
        label: `Week of ${format(weekStart, "MMM dd")} – ${format(weekEnd, "MMM dd, yyyy")}`,
      };
    });
  }, [currentDateRange?.from?.getTime(), currentDateRange?.to?.getTime()]);

  // Group schedules by week → class → day → slot
  const timetableByWeek = useMemo(() => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return weeksInRange.map(week => {
      const weekSchedules = schedules.filter(s => {
        const d = parseISO(s.date);
        return isWithinInterval(d, { start: week.start, end: week.end });
      });

      const classesToRender = viewMode === "class-specific" && selectedClassId
        ? classes.filter(c => String(c.id) === String(selectedClassId))
        : classes;

      const classData: Record<string, Record<string, Record<string, SessionEntry[]>>> = {};

      // Seed all relevant classes so the grid appears even when empty
      classesToRender.forEach(cls => {
        classData[cls.code] = {};
        dayNames.forEach(day => {
          classData[cls.code][day] = {};
        });
      });

      weekSchedules.forEach(schedule => {
        const cls = classesToRender.find(c => String(c.id) === String(schedule.classId));
        const subject = subjects.find(s => String(s.id) === String(schedule.subjectId));
        const teacher = teachers.find(t => String(t.id) === String(schedule.teacherId));
        const classroom = classrooms.find(c => String(c.id) === String(schedule.classroomId));

        if (!schedule.date || !schedule.startTime) return; // Safely skip broken data entirely
        const date = parseISO(schedule.date);
        const dayIdx = date.getDay();
        if (isNaN(dayIdx)) return; // Malformed ISO date safety check
        const day = dayNames[dayIdx];

        const session = getSessionForTime(schedule.startTime);
const slotDef = STANDARD_TIME_SLOTS.find(s => s.shift === session);
const sessionSlot = slotDef?.time ?? "18:00-21:00";
        
        if (!cls) return;

        if (!classData[cls.code]) {
          // Class came from nested data but isn't in classesToRender — seed it on the fly
          classData[cls.code] = {};
          dayNames.forEach(d => { classData[cls.code][d] = {}; });
        }
        if (!classData[cls.code][day][sessionSlot]) classData[cls.code][day][sessionSlot] = [];

        classData[cls.code][day][sessionSlot].push({
          id: schedule.id, // Set the schedule ID
          subject: schedule.subjectName || subject?.name || schedule.subjectCode || "N/A",

          teacher: teacher?.shortName || schedule.teacherShortName || "N/A",
          room: classroom?.code || schedule.roomCode || "N/A",
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          lessonType: schedule.lessonType,
        });
      });

      return { ...week, classData };
    });
  }, [weeksInRange, schedules, classes, subjects, teachers, classrooms, viewMode, selectedClassId]);

  // Class-specific stats
  const classStats = useMemo(() => {
    if (viewMode !== "class-specific" || !selectedClassId) return null;
    const total = schedules.length;
    const subjectDist: Record<string, number> = {};
    schedules.forEach(s => {
      const sub = subjects.find(x => String(x.id) === String(s.subjectId));
      const name = sub?.code || "Unknown";
      subjectDist[name] = (subjectDist[name] || 0) + 1;
    });
    return { total, subjectDist };
  }, [viewMode, selectedClassId, schedules, subjects]);

  const handleCellClick = (
    classCode: string,
    day: string,
    timeSlot: string,
    session: SessionEntry | null,
    weekStart?: Date
  ) => {
    setEditDialog({ open: true, classCode, day, timeSlot, existingSession: session, weekStart });
  };

  const handleSave = async (data: {
    subjectId: string;
    teacherId: string;
    classroomId: string;
    classId: string;
    startTime: string;
    endTime: string;
    lessonType: "theory" | "practice";
    mode: ScheduleMode;
    examType?: ExamType;
    examStartTime?: string;
    examDuration?: number;
    note?: string;
  }) => {
    try {
      const payload: any = {
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        classroomId: data.classroomId,
        classId: data.classId,
        startTime: data.startTime,
        endTime: data.endTime,
        lessonType: data.lessonType,
        scheduleMode: data.mode,
        isExam: data.mode !== "regular",
      };

      if (data.mode !== "regular") {
        payload.examType = data.examType;
        payload.examStartTime = data.examStartTime;
        payload.examDuration = data.examDuration;
        if (data.mode === "combined") {
          payload.note = data.note;
        }
      }

      if (editDialog.existingSession) {
        await editSchedule(editDialog.existingSession.id, payload);
        toast({ title: "Schedule Updated" });
      } else {
        let targetDate = new Date();
        if (editDialog.weekStart) {
          const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const targetDayIdx = dayNames.indexOf(editDialog.day);
          targetDate = new Date(editDialog.weekStart);
          while (targetDate.getDay() !== targetDayIdx) {
            targetDate = addDays(targetDate, 1);
          }
        } else if (currentDateRange?.from) {
          const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const targetDayIdx = dayNames.indexOf(editDialog.day);
          targetDate = new Date(currentDateRange.from);
          while (targetDate.getDay() !== targetDayIdx) {
            targetDate = addDays(targetDate, 1);
          }
        }

        await addSchedule({
          ...payload,
          date: format(targetDate, 'yyyy-MM-dd'),
          period: 1,
        });
        toast({ title: "Schedule Added" });
      }

      // Bump refreshKey so ClassProgressPopup re-fetches latest data
      setProgressPopup(prev => ({ ...prev, refreshKey: prev.refreshKey + 1 }));
      setEditDialog(prev => ({ ...prev, open: false }));
    } catch (err) {
      console.error('Error saving schedule:', err);
      toast({ title: "Error saving schedule", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!editDialog.existingSession) return;
    try {
      await removeSchedule(editDialog.existingSession.id);
      toast({ title: "Schedule Deleted" });
      setEditDialog(prev => ({ ...prev, open: false }));
      // Bump refreshKey so ClassProgressPopup re-fetches latest data
      setProgressPopup(prev => ({ ...prev, refreshKey: prev.refreshKey + 1 }));
    } catch (err) {
      toast({ title: "Error deleting schedule", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Weekly Timetable</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {viewMode === "overview" ? "Overview of all classes" : "Detailed view for a specific class"}
            </p>
          </div>

          {/* Mode Toggle */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-auto">
            <TabsList>
              <TabsTrigger value="overview" className="gap-1.5">
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="class-specific" className="gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Class View</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Filters */}
        <Card className="p-4 space-y-3">
          {/* Class-specific: class selector */}
          {viewMode === "class-specific" && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Select Class</label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="w-full sm:w-[300px] h-9">
                  <SelectValue placeholder="Choose a class..." />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={String(c.id)} value={String(c.id)}>{c.code} — {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Range Picker */}
          <div className="flex flex-wrap items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[260px] justify-start text-left font-normal h-9",
                    !currentDateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {currentDateRange?.from ? (
                    currentDateRange.to ? (
                      <>{format(currentDateRange.from, "dd/MM/yyyy")} - {format(currentDateRange.to, "dd/MM/yyyy")}</>
                    ) : format(currentDateRange.from, "dd/MM/yyyy")
                  ) : (
                    <span>Pick date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={currentDateRange?.from}
                  selected={currentDateRange}
                  onSelect={currentSetDateRange}
                  numberOfMonths={2}
                  weekStartsOn={1}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* Week Presets */}
            {WEEK_PRESETS.map(preset => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                className="h-9 text-xs"
                onClick={() => handleWeekPreset(preset)}
              >
                {preset.label}
              </Button>
            ))}

            {dateRangeInfo && (
              <Badge variant="secondary" className="text-xs">
                {dateRangeInfo.days} days ({dateRangeInfo.weeks} week{dateRangeInfo.weeks > 1 ? "s" : ""})
              </Badge>
            )}
          </div>

          {/* Class-specific: semester filter */}
          {viewMode === "class-specific" && (
            <div className="flex flex-wrap gap-2 items-center">
              <label className="text-xs font-medium text-muted-foreground">Semester:</label>
              <Select value={classSemester} onValueChange={(v) => setClassSemester(v as SemesterFilter)}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Full Year</SelectItem>
                  <SelectItem value="semester1">Semester 1</SelectItem>
                  <SelectItem value="semester2">Semester 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Overview: extra filters */}
          {viewMode === "overview" && (
            <div className="flex flex-wrap gap-2">
              <Select value={filterTeacher} onValueChange={setFilterTeacher}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="Teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teachers</SelectItem>
                  {teachers.filter(t => t.role === "teacher").map(t => (
                    <SelectItem key={String(t.id)} value={String(t.id)}>{t.shortName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(s => (
                    <SelectItem key={String(s.id)} value={String(s.id)}>{s.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterClassroom} onValueChange={setFilterClassroom}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="Classroom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rooms</SelectItem>
                  {classrooms.map(r => (
                    <SelectItem key={String(r.id)} value={String(r.id)}>{r.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1.5 h-8 text-xs">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </div>
        </Card>

        {/* Class-specific stats */}
        {viewMode === "class-specific" && classStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-3 text-center">
              <div className="text-2xl font-bold text-primary">{classStats.total}</div>
              <div className="text-xs text-muted-foreground">Total Periods</div>
            </Card>
            {Object.entries(classStats.subjectDist).slice(0, 3).map(([subj, count]) => (
              <Card key={subj} className="p-3 text-center">
                <div className="text-2xl font-bold text-foreground">{count}</div>
                <div className="text-xs text-muted-foreground">{subj}</div>
              </Card>
            ))}
          </div>
        )}

        {/* Timetable Grids — grouped by week */}
        {viewMode === "class-specific" && !selectedClassId ? (
          <Card className="p-6 sm:p-8 text-center">
            <p className="text-muted-foreground text-sm">
              Please select a class to view its timetable.
            </p>
          </Card>
        ) : !currentDateRange?.from || !currentDateRange?.to ? (
          <Card className="p-6 sm:p-8 text-center">
            <p className="text-muted-foreground text-sm">
              Please select a date range to view the timetable.
            </p>
          </Card>
        ) : schedulesLoading && schedules.length === 0 ? (
          // Loading skeleton — shown only on first/empty fetch to avoid flicker on filter changes
          <div className="space-y-4">
            {[0, 1].map(i => (
              <Card key={i} className="p-3 sm:p-6 space-y-3">
                <Skeleton className="h-6 w-48" />
                <div className="space-y-2">
                  {[...Array(6)].map((_, r) => (
                    <div key={r} className="flex gap-2">
                      <Skeleton className="h-12 w-[120px]" />
                      {[...Array(6)].map((__, c) => (
                        <Skeleton key={c} className="h-12 flex-1" />
                      ))}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          timetableByWeek.map((week, weekIdx) => {
            const classEntries = Object.entries(week.classData);
            if (classEntries.length === 0) return null;

            const showWeekLabel = weeksInRange.length > 1;

            return (
              <div key={weekIdx} className="space-y-4">
                {showWeekLabel && (
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <Badge variant="outline" className="text-sm font-medium px-3 py-1">
                      {week.label}
                    </Badge>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                )}
                {classEntries.map(([classCode, daysData]) => (
                  <TimetableGrid
                    key={`${weekIdx}-${classCode}`}
                    className={classCode}
                    weekLabel={showWeekLabel ? undefined : week.label}
                    weekStart={week.start}
                    daysData={daysData}
                    onCellClick={handleCellClick}
                    onClassClick={handleClassClick}
                  />
                ))}
              </div>
            );
          })
        )}
      </div>

      {/* Schedule Edit Dialog */}
      <ScheduleEditDialog
        open={editDialog.open}
        onOpenChange={(open) => setEditDialog(prev => ({ ...prev, open }))}
        classCode={editDialog.classCode}
        day={editDialog.day}
        timeSlot={editDialog.timeSlot}
        existingSession={editDialog.existingSession}
        onSave={handleSave}
        onDelete={editDialog.existingSession ? handleDelete : undefined}
      />

      {/* Class Progress Popup — rendered once outside the loop, refreshKey triggers re-fetch */}
      <ClassProgressPopup
        open={progressPopup.open}
        onOpenChange={(open) => setProgressPopup(prev => ({ ...prev, open }))}
        classId={progressPopup.classId}
        classCode={progressPopup.classCode}
        refreshKey={progressPopup.refreshKey}
      />
    </Layout>
  );
};

export default Timetable;
