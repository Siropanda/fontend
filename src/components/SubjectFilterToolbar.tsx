import { useState } from "react";
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
import { Search, Filter, X, SlidersHorizontal } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export interface SubjectFilterConfig {
  minCredits?: number;
  maxCredits?: number;
  allowEvening?: boolean | null;
  sessionType?: "all" | "theory" | "practice" | "mixed";
}

interface SubjectFilterToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters: SubjectFilterConfig;
  onFiltersChange: (filters: SubjectFilterConfig) => void;
}

const SubjectFilterToolbar = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search by name, code, or category...",
  filters,
  onFiltersChange,
}: SubjectFilterToolbarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== null && v !== "all"
  ).length;

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search Input - Full width on mobile */}
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 w-full"
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => onSearchChange("")}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-shrink-0">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Filter Subjects</h4>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-8 text-xs text-muted-foreground"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              {/* Credits Range */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">
                  Credits: {filters.minCredits || 1} - {filters.maxCredits || 10}
                </Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={filters.minCredits || 1}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        minCredits: Number(e.target.value),
                      })
                    }
                    className="w-16 h-8 text-xs"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={filters.maxCredits || 10}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        maxCredits: Number(e.target.value),
                      })
                    }
                    className="w-16 h-8 text-xs"
                  />
                </div>
              </div>

              {/* Session Type */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Session Type</Label>
                <Select
                  value={filters.sessionType || "all"}
                  onValueChange={(value) =>
                    onFiltersChange({
                      ...filters,
                      sessionType: value as SubjectFilterConfig["sessionType"],
                    })
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="theory">Theory Only</SelectItem>
                    <SelectItem value="practice">Practice Only</SelectItem>
                    <SelectItem value="mixed">Mixed (Theory + Practice)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Evening Toggle */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium">Evening Allowed</Label>
                  <p className="text-[10px] text-muted-foreground">
                    Filter by evening class availability
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={
                      filters.allowEvening === true
                        ? "yes"
                        : filters.allowEvening === false
                        ? "no"
                        : "all"
                    }
                    onValueChange={(value) =>
                      onFiltersChange({
                        ...filters,
                        allowEvening:
                          value === "all" ? null : value === "yes",
                      })
                    }
                  >
                    <SelectTrigger className="w-20 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="icon" onClick={clearFilters}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default SubjectFilterToolbar;
