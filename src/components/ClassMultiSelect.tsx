import { useState, useMemo } from "react";
import { Class } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, X, ChevronDown, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClassMultiSelectProps {
  classes: Class[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  departmentFilter?: string;
  yearFilter?: string[];
}

const ClassMultiSelect = ({
  classes,
  selectedIds,
  onChange,
  placeholder = "Search and select classes...",
  departmentFilter,
  yearFilter,
}: ClassMultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredClasses = useMemo(() => {
    let filtered = classes;
    
    if (departmentFilter && departmentFilter !== "all") {
      filtered = filtered.filter(c => c.major === departmentFilter);
    }
    
    if (yearFilter && yearFilter.length > 0) {
      filtered = filtered.filter(c => yearFilter.includes(c.schoolYear));
    }
    
    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        c =>
          c.code.toLowerCase().includes(query) ||
          c.name.toLowerCase().includes(query) ||
          c.major.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [classes, search, departmentFilter, yearFilter]);

  const selectedClasses = useMemo(
    () => classes.filter(c => selectedIds.includes(c.id)),
    [classes, selectedIds]
  );

  const toggleClass = (classId: string) => {
    if (selectedIds.includes(classId)) {
      onChange(selectedIds.filter(id => id !== classId));
    } else {
      onChange([...selectedIds, classId]);
    }
  };

  const removeClass = (classId: string) => {
    onChange(selectedIds.filter(id => id !== classId));
  };

  const selectAll = () => {
    const allFilteredIds = filteredClasses.map(c => c.id);
    const newSelected = [...new Set([...selectedIds, ...allFilteredIds])];
    onChange(newSelected);
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-10 font-normal"
          >
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {selectedIds.length > 0
                  ? `${selectedIds.length} class(es) selected`
                  : placeholder}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search classes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="p-2 border-b border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {filteredClasses.length} classes available
            </span>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={selectAll} className="h-7 text-xs">
                Select All
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs">
                Clear
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[250px]">
            <div className="p-2 space-y-1">
              {filteredClasses.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No classes found
                </div>
              ) : (
                filteredClasses.map((classItem) => {
                  const isSelected = selectedIds.includes(classItem.id);
                  return (
                    <div
                      key={classItem.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                        isSelected
                          ? "bg-primary/10"
                          : "hover:bg-muted"
                      )}
                      onClick={() => toggleClass(classItem.id)}
                    >
                      <Checkbox checked={isSelected} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{classItem.code}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {classItem.name} • {classItem.major}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {classItem.studentCount} students
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Selected Classes as Badges */}
      {selectedClasses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedClasses.map((classItem) => (
            <Badge
              key={classItem.id}
              variant="secondary"
              className="gap-1 pl-2 pr-1 py-1"
            >
              <span className="font-medium">{classItem.code}</span>
              <button
                onClick={() => removeClass(classItem.id)}
                className="ml-1 h-4 w-4 rounded-full hover:bg-muted-foreground/20 inline-flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassMultiSelect;
