import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockClasses, mockSubjects, mockTeachers } from "@/lib/mockData";
import { DateRange } from "react-day-picker";
import { addWeeks, startOfWeek, endOfWeek, format } from "date-fns";

interface TimetableAdvancedFiltersProps {
  selectedClass: string;
  setSelectedClass: (value: string) => void;
  selectedMajor: string;
  setSelectedMajor: (value: string) => void;
  selectedYear: string;
  setSelectedYear: (value: string) => void;
  selectedSubject: string;
  setSelectedSubject: (value: string) => void;
  selectedTeacher: string;
  setSelectedTeacher: (value: string) => void;
  teacherSearch: string;
  setTeacherSearch: (value: string) => void;
  selectedWeek: string;
  setSelectedWeek: (value: string) => void;
  selectedShift: string;
  setSelectedShift: (value: string) => void;
  dateRange: DateRange | undefined;
  setDateRange: (value: DateRange | undefined) => void;
}

const TimetableAdvancedFilters = ({
  selectedClass,
  setSelectedClass,
  selectedMajor,
  setSelectedMajor,
  selectedYear,
  setSelectedYear,
  selectedSubject,
  setSelectedSubject,
  selectedTeacher,
  setSelectedTeacher,
  teacherSearch,
  setTeacherSearch,
  selectedWeek,
  setSelectedWeek,
  selectedShift,
  setSelectedShift,
  dateRange,
  setDateRange,
}: TimetableAdvancedFiltersProps) => {
  // Extract unique majors from class codes
  const majors = [...new Set(mockClasses.map(c => c.major || c.code.split('-')[0]))];
  const years = ["2024", "2025", "2026"];

  // Week options with 3-week range
  const weekOptions = useMemo(() => {
    const today = new Date();
    return [
      {
        id: "0",
        label: "This Week",
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: endOfWeek(today, { weekStartsOn: 1 }),
      },
      {
        id: "1",
        label: "Next Week",
        start: startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 }),
        end: endOfWeek(addWeeks(today, 1), { weekStartsOn: 1 }),
      },
      {
        id: "2",
        label: "Week +2",
        start: startOfWeek(addWeeks(today, 2), { weekStartsOn: 1 }),
        end: endOfWeek(addWeeks(today, 2), { weekStartsOn: 1 }),
      },
    ];
  }, []);

  // Filter teachers based on search
  const filteredTeachers = useMemo(() => {
    const teachers = mockTeachers.filter(t => t.role === 'teacher');
    if (!teacherSearch.trim()) return teachers;
    
    const query = teacherSearch.toLowerCase();
    return teachers.filter(
      t => t.fullName.toLowerCase().includes(query) ||
           t.shortName.toLowerCase().includes(query)
    );
  }, [teacherSearch]);

  const handleWeekChange = (weekId: string) => {
    setSelectedWeek(weekId);
    const week = weekOptions.find(w => w.id === weekId);
    if (week) {
      setDateRange({ from: week.start, to: week.end });
    }
  };

  const clearFilters = () => {
    setSelectedClass("all");
    setSelectedMajor("all");
    setSelectedYear("all");
    setSelectedSubject("all");
    setSelectedTeacher("all");
    setTeacherSearch("");
    setSelectedWeek("0");
    setSelectedShift("all");
    handleWeekChange("0");
  };

  const activeFilterCount = [
    selectedClass !== "all",
    selectedMajor !== "all",
    selectedYear !== "all",
    selectedSubject !== "all",
    selectedTeacher !== "all",
    selectedShift !== "all",
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Week Picker Tabs */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          <span>Week:</span>
        </div>
        <Tabs value={selectedWeek} onValueChange={handleWeekChange}>
          <TabsList>
            {weekOptions.map((week) => (
              <TabsTrigger key={week.id} value={week.id} className="gap-2">
                {week.label}
                <span className="hidden sm:inline text-xs text-muted-foreground">
                  ({format(week.start, "dd/MM")} - {format(week.end, "dd/MM")})
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Main Filters Row */}
      <div className="flex flex-wrap gap-3">
        {/* Teacher Name Search */}
        <div className="relative w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={teacherSearch}
            onChange={(e) => setTeacherSearch(e.target.value)}
            placeholder="Search teacher..."
            className="pl-9 pr-8"
          />
          {teacherSearch && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
              onClick={() => setTeacherSearch("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Shift Filter */}
        <Select value={selectedShift} onValueChange={setSelectedShift}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Shift" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Shifts</SelectItem>
            <SelectItem value="morning">Morning (07:00-12:00)</SelectItem>
            <SelectItem value="afternoon">Afternoon (13:00-17:00)</SelectItem>
            <SelectItem value="evening">Evening (17:00-22:00)</SelectItem>
          </SelectContent>
        </Select>

        {/* Class Filter */}
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {mockClasses.map(classData => (
              <SelectItem key={classData.id} value={classData.id}>
                {classData.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Major Filter */}
        <Select value={selectedMajor} onValueChange={setSelectedMajor}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Major" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Majors</SelectItem>
            {majors.map(major => (
              <SelectItem key={major} value={major}>
                {major}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Year Filter */}
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {years.map(year => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Subject Filter */}
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {mockSubjects.map(subject => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Teacher Filter (from search results) */}
        <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Teacher" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teachers</SelectItem>
            {filteredTeachers.map(teacher => (
              <SelectItem key={teacher.id} value={teacher.id}>
                {teacher.shortName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
            <X className="h-4 w-4" />
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedClass !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Class: {mockClasses.find(c => c.id === selectedClass)?.code}
              <button onClick={() => setSelectedClass("all")} className="ml-1 hover:bg-muted rounded-full">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedMajor !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Major: {selectedMajor}
              <button onClick={() => setSelectedMajor("all")} className="ml-1 hover:bg-muted rounded-full">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedShift !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Shift: {selectedShift}
              <button onClick={() => setSelectedShift("all")} className="ml-1 hover:bg-muted rounded-full">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedTeacher !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Teacher: {mockTeachers.find(t => t.id === selectedTeacher)?.shortName}
              <button onClick={() => setSelectedTeacher("all")} className="ml-1 hover:bg-muted rounded-full">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default TimetableAdvancedFilters;
