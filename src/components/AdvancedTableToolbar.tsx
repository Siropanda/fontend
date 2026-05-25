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
import { Slider } from "@/components/ui/slider";
import { Search, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterConfig {
  capacity?: { min: number; max: number };
  department?: string;
  status?: string;
}

interface AdvancedTableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  departments?: string[];
  statuses?: string[];
  maxCapacity?: number;
  filters?: FilterConfig;
  onFiltersChange?: (filters: FilterConfig) => void;
  className?: string;
}

const AdvancedTableToolbar = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search records...",
  departments = [],
  statuses = [],
  maxCapacity = 100,
  filters = {},
  onFiltersChange,
  className,
}: AdvancedTableToolbarProps) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterConfig>(filters);

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== "" && v !== "all"
  ).length;

  const handleFilterChange = (key: keyof FilterConfig, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: FilterConfig = {};
    setLocalFilters(clearedFilters);
    onFiltersChange?.(clearedFilters);
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

              {/* Capacity Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Capacity Range</label>
                <div className="pt-2 px-1">
                  <Slider
                    defaultValue={[0, maxCapacity]}
                    value={[
                      localFilters.capacity?.min ?? 0,
                      localFilters.capacity?.max ?? maxCapacity,
                    ]}
                    max={maxCapacity}
                    step={5}
                    onValueChange={([min, max]) =>
                      handleFilterChange("capacity", { min, max })
                    }
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{localFilters.capacity?.min ?? 0}</span>
                  <span>{localFilters.capacity?.max ?? maxCapacity}</span>
                </div>
              </div>

              {/* Department Filter */}
              {departments.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <Select
                    value={localFilters.department || "all"}
                    onValueChange={(value) =>
                      handleFilterChange("department", value === "all" ? undefined : value)
                    }
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

              {/* Status Filter */}
              {statuses.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={localFilters.status || "all"}
                    onValueChange={(value) =>
                      handleFilterChange("status", value === "all" ? undefined : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Active Filter Badges - Mobile */}
        {activeFilterCount > 0 && (
          <div className="hidden sm:flex items-center gap-1">
            {localFilters.department && (
              <Badge variant="outline" className="gap-1">
                {localFilters.department}
                <button
                  onClick={() => handleFilterChange("department", undefined)}
                  className="h-3 w-3 rounded-full hover:bg-muted"
                >
                  <X className="h-2 w-2" />
                </button>
              </Badge>
            )}
            {localFilters.status && (
              <Badge variant="outline" className="gap-1">
                {localFilters.status}
                <button
                  onClick={() => handleFilterChange("status", undefined)}
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

export default AdvancedTableToolbar;
