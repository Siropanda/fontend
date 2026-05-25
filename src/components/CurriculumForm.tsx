import { useState, useCallback } from "react";
import { Subject } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Plus, Trash2, GripVertical, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CurriculumSubject {
  id: string;
  subjectId: string;
  subjectName: string;
  credits: number;
  isDesired: boolean;
  order: number;
}

interface Semester {
  id: string;
  name: string;
  subjects: CurriculumSubject[];
}

interface CurriculumFormProps {
  availableSubjects: Subject[];
  semesters: Semester[];
  onChange: (semesters: Semester[]) => void;
}

const CurriculumForm = ({
  availableSubjects,
  semesters,
  onChange,
}: CurriculumFormProps) => {
  const [draggedItem, setDraggedItem] = useState<{ semesterId: string; subjectId: string } | null>(null);
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({});

  const addSemester = () => {
    const newSemester: Semester = {
      id: Date.now().toString(),
      name: `Semester ${semesters.length + 1}`,
      subjects: [],
    };
    onChange([...semesters, newSemester]);
  };

  const removeSemester = (semesterId: string) => {
    onChange(semesters.filter(s => s.id !== semesterId));
  };

  const addSubjectToSemester = (semesterId: string, subject: Subject) => {
    onChange(
      semesters.map(semester => {
        if (semester.id === semesterId) {
          const alreadyExists = semester.subjects.some(s => s.subjectId === subject.id);
          if (alreadyExists) return semester;
          
          const newSubject: CurriculumSubject = {
            id: Date.now().toString(),
            subjectId: subject.id,
            subjectName: subject.name,
            credits: subject.credits,
            isDesired: false,
            order: semester.subjects.length,
          };
          return {
            ...semester,
            subjects: [...semester.subjects, newSubject],
          };
        }
        return semester;
      })
    );
    setOpenPopovers(prev => ({ ...prev, [semesterId]: false }));
  };

  const removeSubjectFromSemester = (semesterId: string, curriculumSubjectId: string) => {
    onChange(
      semesters.map(semester => {
        if (semester.id === semesterId) {
          return {
            ...semester,
            subjects: semester.subjects.filter(s => s.id !== curriculumSubjectId),
          };
        }
        return semester;
      })
    );
  };

  const toggleDesired = (semesterId: string, curriculumSubjectId: string) => {
    onChange(
      semesters.map(semester => {
        if (semester.id === semesterId) {
          return {
            ...semester,
            subjects: semester.subjects.map(s =>
              s.id === curriculumSubjectId ? { ...s, isDesired: !s.isDesired } : s
            ),
          };
        }
        return semester;
      })
    );
  };

  const updateCredits = (semesterId: string, curriculumSubjectId: string, credits: number) => {
    onChange(
      semesters.map(semester => {
        if (semester.id === semesterId) {
          return {
            ...semester,
            subjects: semester.subjects.map(s =>
              s.id === curriculumSubjectId ? { ...s, credits } : s
            ),
          };
        }
        return semester;
      })
    );
  };

  // Drag and drop handlers
  const handleDragStart = (semesterId: string, curriculumSubjectId: string) => {
    setDraggedItem({ semesterId, subjectId: curriculumSubjectId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = useCallback(
    (targetSemesterId: string, targetIndex: number) => {
      if (!draggedItem) return;

      const { semesterId: sourceSemesterId, subjectId: sourceSubjectId } = draggedItem;

      onChange(
        semesters.map(semester => {
          if (semester.id === sourceSemesterId && semester.id === targetSemesterId) {
            // Reordering within same semester
            const subjects = [...semester.subjects];
            const sourceIndex = subjects.findIndex(s => s.id === sourceSubjectId);
            if (sourceIndex === -1) return semester;

            const [removed] = subjects.splice(sourceIndex, 1);
            subjects.splice(targetIndex, 0, removed);

            return {
              ...semester,
              subjects: subjects.map((s, i) => ({ ...s, order: i })),
            };
          }
          return semester;
        })
      );

      setDraggedItem(null);
    },
    [draggedItem, semesters, onChange]
  );

  const getUsedSubjectIds = (excludeSemesterId?: string) => {
    return semesters
      .filter(s => s.id !== excludeSemesterId)
      .flatMap(s => s.subjects.map(sub => sub.subjectId));
  };

  const getAvailableSubjectsForSemester = (semesterId: string) => {
    const usedIds = new Set(
      semesters
        .find(s => s.id === semesterId)
        ?.subjects.map(s => s.subjectId) || []
    );
    return availableSubjects.filter(s => !usedIds.has(s.id));
  };

  const getTotalCredits = (semester: Semester) => {
    return semester.subjects.reduce((sum, s) => sum + s.credits, 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Curriculum Structure</h3>
          <p className="text-sm text-muted-foreground">
            Organize subjects by semester with drag-and-drop reordering
          </p>
        </div>
        <Button onClick={addSemester} variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Semester
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={semesters.map(s => s.id)} className="space-y-3">
        {semesters.map((semester) => (
          <AccordionItem
            key={semester.id}
            value={semester.id}
            className="border rounded-lg overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <span className="font-semibold">{semester.name}</span>
                <span className="text-sm text-muted-foreground">
                  {semester.subjects.length} subjects • {getTotalCredits(semester)} credits
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3">
                {/* Subject List */}
                <div className="space-y-2">
                  {semester.subjects.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                      No subjects added yet. Click "Add Subject" to begin.
                    </div>
                  ) : (
                    semester.subjects.map((currSubject, index) => (
                      <div
                        key={currSubject.id}
                        draggable
                        onDragStart={() => handleDragStart(semester.id, currSubject.id)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(semester.id, index)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-all",
                          currSubject.isDesired
                            ? "bg-success/5 border-success/30"
                            : "bg-card border-border",
                          draggedItem?.subjectId === currSubject.id && "opacity-50"
                        )}
                      >
                        <div className="cursor-grab active:cursor-grabbing">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{currSubject.subjectName}</p>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Credits Input */}
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">Credits:</Label>
                            <Input
                              type="number"
                              min="0"
                              value={currSubject.credits}
                              onChange={(e) =>
                                updateCredits(semester.id, currSubject.id, Number(e.target.value))
                              }
                              className="w-16 h-8 text-center"
                            />
                          </div>

                          {/* Desired Checkbox */}
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`desired-${currSubject.id}`}
                              checked={currSubject.isDesired}
                              onCheckedChange={() => toggleDesired(semester.id, currSubject.id)}
                            />
                            <Label
                              htmlFor={`desired-${currSubject.id}`}
                              className="text-xs cursor-pointer"
                            >
                              Desired
                            </Label>
                          </div>

                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSubjectFromSemester(semester.id, currSubject.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Subject & Remove Semester Actions */}
                <div className="flex items-center justify-between pt-2">
                  <Popover
                    open={openPopovers[semester.id]}
                    onOpenChange={(open) =>
                      setOpenPopovers(prev => ({ ...prev, [semester.id]: open }))
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Subject
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search subjects..." />
                        <CommandList>
                          <CommandEmpty>No subjects found.</CommandEmpty>
                          <CommandGroup>
                            {getAvailableSubjectsForSemester(semester.id).map((subject) => (
                              <CommandItem
                                key={subject.id}
                                onSelect={() => addSubjectToSemester(semester.id, subject)}
                                className="cursor-pointer"
                              >
                                <div className="flex-1">
                                  <p className="font-medium">{subject.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {subject.code} • {subject.credits} credits
                                  </p>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSemester(semester.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Semester
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {semesters.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No semesters configured yet.</p>
          <Button onClick={addSemester} className="gap-2">
            <Plus className="h-4 w-4" />
            Add First Semester
          </Button>
        </Card>
      )}
    </div>
  );
};

export default CurriculumForm;
