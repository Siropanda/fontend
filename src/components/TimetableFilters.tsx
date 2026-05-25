import { useState } from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Filter, CalendarIcon } from "lucide-react";
import { mockClasses, mockSubjects, mockTeachers } from "@/lib/mockData";
import { addWeeks, startOfWeek, addDays, format } from "date-fns";
import { STANDARD_TIME_SLOTS, getShiftBadgeColor, ShiftType } from "@/lib/timeSlots";
import { DateRange } from "react-day-picker";
import ClassMultiSelect from "./ClassMultiSelect";
import { cn } from "@/lib/utils";

interface TimetableFiltersProps {
  selectedClass: string;
  setSelectedClass: (value: string) => void;
  selectedTeacher: string;
  setSelectedTeacher: (value: string) => void;
  selectedSubject: string;
  setSelectedSubject: (value: string) => void;
  selectedWeek?: number;
  setSelectedWeek?: (value: number) => void;
  selectedShift?: ShiftType | "all";
  setSelectedShift?: (value: ShiftType | "all") => void;
  // Enhanced multi-select & date range
  multiSelectClassIds?: string[];
  setMultiSelectClassIds?: (ids: string[]) => void;
  dateRange?: DateRange;
  setDateRange?: (range: DateRange | undefined) => void;
  isSemesterView?: boolean;
}

const getWeekLabel = (weekOffset: number) => {
  const today = new Date();
  const weekStart = startOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);
  return `${format(weekStart, "dd/MM")} - ${format(weekEnd, "dd/MM")}`;
};

const TimetableFilters = ({
  selectedClass,
  setSelectedClass,
  selectedTeacher,
  setSelectedTeacher,
  selectedSubject,
  setSelectedSubject,
  selectedWeek = 0,
  setSelectedWeek,
  selectedShift = "all",
  setSelectedShift,
  multiSelectClassIds,
  setMultiSelectClassIds,
  dateRange,
  setDateRange,
  isSemesterView,
}: TimetableFiltersProps) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const clearFilters = () => {
    setSelectedClass("all");
    setSelectedSubject("all");
    setSelectedTeacher("all");
    setSelectedWeek?.(0);
    setSelectedShift?.("all");
    setMultiSelectClassIds?.([]);
  };

  const hasActiveFilters =
    (multiSelectClassIds && multiSelectClassIds.length > 0) ||
    selectedSubject !== "all" ||
    selectedTeacher !== "all" ||
    selectedShift !== "all";

  const activeFilterCount = [
    multiSelectClassIds && multiSelectClassIds.length > 0,
    selectedSubject !== "all",
    selectedTeacher !== "all",
    selectedShift !== "all",
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Multi-select class filter */}
      {setMultiSelectClassIds && multiSelectClassIds !== undefined && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Filter by Class (multi-select → semester view)
          </label>
          <ClassMultiSelect
            classes={mockClasses}
            selectedIds={multiSelectClassIds}
            onChange={setMultiSelectClassIds}
            placeholder="Select classes to view semester schedule..."
          />
        </div>
      )}

      {/* Date Range Picker */}
      {setDateRange && !isSemesterView && (
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[280px] justify-start text-left font-normal h-9",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yyyy")
                  )
                ) : (
                  <span>Pick date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Week Picker */}
      {setSelectedWeek && !isSemesterView && (
        <Tabs value={selectedWeek.toString()} onValueChange={(v) => setSelectedWeek(parseInt(v))} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {[0, 1, 2].map((w) => (
              <TabsTrigger key={w} value={w.toString()} className="text-xs sm:text-sm">
                <span className="hidden sm:inline">{w === 0 ? "This Week" : w === 1 ? "Next Week" : "Week +2"}</span>
                <span className="sm:hidden">W{w + 1}</span>
                <span className="ml-1 text-[10px] text-muted-foreground hidden md:inline">
                  ({getWeekLabel(w)})
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {isSemesterView && (
        <Badge variant="outline" className="text-xs">
          📅 Semester View — Showing all weeks for selected class(es)
        </Badge>
      )}

      {/* Filters Row */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <div className="hidden sm:flex gap-3 flex-wrap">
          {/* Subject Filter */}
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {mockSubjects.map(subject => (
                <SelectItem key={subject.id} value={subject.id}>{subject.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Teacher Filter */}
          <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Teacher" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teachers</SelectItem>
              {mockTeachers.filter(t => t.role === "teacher").map(teacher => (
                <SelectItem key={teacher.id} value={teacher.id}>{teacher.shortName}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Shift Filter */}
          {setSelectedShift && (
            <Select value={selectedShift} onValueChange={(v) => setSelectedShift(v as ShiftType | "all")}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Shift" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shifts</SelectItem>
                <SelectItem value="morning">
                  <span className={`px-2 py-0.5 rounded text-xs ${getShiftBadgeColor("morning")}`}>Morning</span>
                </SelectItem>
                <SelectItem value="afternoon">
                  <span className={`px-2 py-0.5 rounded text-xs ${getShiftBadgeColor("afternoon")}`}>Afternoon</span>
                </SelectItem>
                <SelectItem value="evening">
                  <span className={`px-2 py-0.5 rounded text-xs ${getShiftBadgeColor("evening")}`}>Evening</span>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Mobile Filter Button */}
        <div className="sm:hidden flex gap-2 w-full">
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex-1 justify-between h-9">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                </div>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">{activeFilterCount}</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="start">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Filter Timetable</h4>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Subject</label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="All Subjects" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {mockSubjects.map(s => <SelectItem key={s.id} value={s.id}>{s.code}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Teacher</label>
                  <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="All Teachers" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teachers</SelectItem>
                      {mockTeachers.filter(t => t.role === "teacher").map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.shortName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full text-destructive">
                    Clear All Filters
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 h-9 hidden sm:flex">
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};

export default TimetableFilters;
