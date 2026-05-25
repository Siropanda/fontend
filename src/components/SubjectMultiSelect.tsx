import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Subject } from "@/types";

interface SubjectMultiSelectProps {
  subjects: Subject[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

const SubjectMultiSelect = ({ subjects, value, onChange, disabled }: SubjectMultiSelectProps) => {
  const [open, setOpen] = useState(false);

  const toggleSubject = (subjectId: string) => {
    if (value.includes(subjectId)) {
      onChange(value.filter(id => id !== subjectId));
    } else {
      onChange([...value, subjectId]);
    }
  };

  const removeSubject = (subjectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter(id => id !== subjectId));
  };

  const selectedSubjects = subjects.filter(s => value.includes(s.id));

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between h-auto min-h-10"
          >
            <span className="text-muted-foreground">
              {value.length === 0 
                ? "Select subjects..." 
                : `${value.length} subject(s) selected`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 z-50 bg-popover" align="start">
          <Command>
            <CommandInput placeholder="Search subjects..." />
            <CommandList>
              <CommandEmpty>No subject found.</CommandEmpty>
              <CommandGroup>
                {subjects.map((subject) => (
                  <CommandItem
                    key={subject.id}
                    value={`${subject.code} ${subject.name}`}
                    onSelect={() => toggleSubject(subject.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(subject.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{subject.code}</span>
                      <span className="text-xs text-muted-foreground">{subject.name}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedSubjects.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedSubjects.map(subject => (
            <Badge 
              key={subject.id} 
              variant="secondary"
              className="gap-1 pr-1"
            >
              {subject.code}
              <button
                type="button"
                onClick={(e) => removeSubject(subject.id, e)}
                className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
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

export default SubjectMultiSelect;
