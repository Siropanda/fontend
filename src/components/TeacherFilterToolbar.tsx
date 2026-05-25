import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Subject, AcademicDegree } from "@/types";
import { ACADEMIC_DEGREES } from "@/lib/mockData";

export interface TeacherFilterConfig {
  subjectId?: string;
  status?: "active" | "inactive" | "all";
  preferredShift?: "morning" | "afternoon" | "evening" | "all";
  department?: string;
  academicDegree?: AcademicDegree;
}

interface TeacherFilterToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  subjects: Subject[];
  departments: string[];
  filters: TeacherFilterConfig;
  onFiltersChange: (filters: TeacherFilterConfig) => void;
  className?: string;
}

const TeacherFilterToolbar = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search teachers...",
  subjects,
  departments,
  filters,
  onFiltersChange,
  className,
}: TeacherFilterToolbarProps) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.subjectId && filters.subjectId !== "all") count++;
    if (filters.status && filters.status !== "all") count++;
    if (filters.preferredShift && filters.preferredShift !== "all") count++;
    if (filters.department && filters.department !== "all") count++;
    if (filters.academicDegree) count++;
    return count;
  }, [filters]);

  const handleFilterChange = (key: keyof TeacherFilterConfig, value: string) => {
    const newFilters = { ...filters, [key]: value === "all" ? undefined : value };
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const clearSearch = () => {
    onSearchChange("");
  };

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      {/* Search Bar */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9 pr-9 bg-background"
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
            onClick={clearSearch}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Filter Button & Popover */}
      <div className="flex items-center gap-2">
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filters</h4>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                    Clear all
                  </Button>
                )}
              </div>

              {/* Subject/Skills Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject / Skills</label>
                <Select
                  value={filters.subjectId || "all"}
                  onValueChange={(value) => handleFilterChange("subjectId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All subjects</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.code} - {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) => handleFilterChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Preferred Shift Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Preferred Shift</label>
                <Select
                  value={filters.preferredShift || "all"}
                  onValueChange={(value) => handleFilterChange("preferredShift", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All shifts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All shifts</SelectItem>
                    <SelectItem value="morning">Morning (07:00-12:00)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (13:00-17:00)</SelectItem>
                    <SelectItem value="evening">Evening (17:00-22:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Department Filter */}
              {departments.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <Select
                    value={filters.department || "all"}
                    onValueChange={(value) => handleFilterChange("department", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All departments</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Academic Degree Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Academic Degree</label>
                <Select
                  value={filters.academicDegree || "all"}
                  onValueChange={(value) => handleFilterChange("academicDegree", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All degrees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All degrees</SelectItem>
                    {ACADEMIC_DEGREES.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label} ({d.labelVi})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Active Filter Badges */}
        {activeFilterCount > 0 && (
          <div className="hidden sm:flex items-center gap-1 flex-wrap">
            {filters.subjectId && (
              <Badge variant="outline" className="gap-1">
                {subjects.find(s => s.id === filters.subjectId)?.code || filters.subjectId}
                <button
                  onClick={() => handleFilterChange("subjectId", "all")}
                  className="h-3 w-3 rounded-full hover:bg-muted"
                >
                  <X className="h-2 w-2" />
                </button>
              </Badge>
            )}
            {filters.status && filters.status !== "all" && (
              <Badge variant="outline" className="gap-1">
                {filters.status}
                <button
                  onClick={() => handleFilterChange("status", "all")}
                  className="h-3 w-3 rounded-full hover:bg-muted"
                >
                  <X className="h-2 w-2" />
                </button>
              </Badge>
            )}
            {filters.preferredShift && filters.preferredShift !== "all" && (
              <Badge variant="outline" className="gap-1">
                {filters.preferredShift}
                <button
                  onClick={() => handleFilterChange("preferredShift", "all")}
                  className="h-3 w-3 rounded-full hover:bg-muted"
                >
                  <X className="h-2 w-2" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherFilterToolbar;
