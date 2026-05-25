import { useState, useMemo, useEffect } from "react";
import Layout from "@/components/Layout";
import { Class, ClassType } from "@/types";
import { mockClasses, mockSubjects } from "@/lib/mockData";
import AdvancedTableToolbar from "@/components/AdvancedTableToolbar";
import CurriculumForm from "@/components/CurriculumForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useClasses } from "@/contexts/ClassContext";
import { useTableSort } from "@/hooks/useTableSort";
import SortableTableHead from "@/components/SortableTableHead";
import TablePagination from "@/components/TablePagination";

interface FilterConfig {
  capacity?: { min: number; max: number };
  department?: string;
  status?: string;
}

interface Semester {
  id: string;
  name: string;
  subjects: {
    id: string;
    subjectId: string;
    subjectName: string;
    credits: number;
    isDesired: boolean;
    order: number;
  }[];
}

const Classes = () => {
  const { classes: classesRaw, loading, error, addClass, editClass, removeClass, refreshClasses, currentPage, totalPages, totalCount, setPage } = useClasses();
  const classes = classesRaw ?? [];
  const [isSaving, setIsSaving] = useState(false);
  const [classToDelete, setClassToDelete] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterConfig>({});
  const [isExportTKB, setIsExportTKB] = useState(true);
  const [classType, setClassType] = useState<ClassType>("regular");
  const [curriculumClass, setCurriculumClass] = useState<Class | null>(null);
  const [isCurriculumOpen, setIsCurriculumOpen] = useState(false);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [pageSize, setPageSize] = useState(10);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshClasses({
        search: searchQuery || undefined,
        major: filters.department || undefined,
        capacity_min: filters.capacity?.min,
        capacity_max: filters.capacity?.max,
      });
    }, 300); // debounce search
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filters]);

  const majors = useMemo(() => {
    const majorSet = new Set<string>();
    classes.forEach(c => {
      if (c.major && c.major.trim() !== "") {
        majorSet.add(c.major);
      }
    });
    return Array.from(majorSet);
  }, [classes]);

  const maxStudentCount = useMemo(() => {
    if (!classes || classes.length === 0) return 100;
    const max = Math.max(...classes.map(c => c.studentCount || 0));
    return Math.max(max, 100);
  }, [classes]);

  const { sortedData: sortedClasses, sortConfig, handleSort } = useTableSort(classes);

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };
  const handleOpenDialog = (classData: Class | null) => {
    setEditingClass(classData);
    setIsExportTKB(classData?.isExportTKB ?? true);
    setClassType(classData?.classType ?? "regular");
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const classData = {
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      major: formData.get("major") as string,
      schoolYear: formData.get("schoolYear") as string,
      studentCount: Number(formData.get("studentCount")),
      classType: classType,
      note: (formData.get("note") as string) || undefined,
      isExportTKB: isExportTKB,
    };

    setIsSaving(true);
    try {
      if (editingClass) {
        await editClass(editingClass.id, classData);
        toast({ title: "Class updated successfully" });
      } else {
        await addClass(classData);
        toast({ title: "Class added successfully" });
      }
      setIsDialogOpen(false);
      setEditingClass(null);
    } catch (err: any) {
      toast({
        title: editingClass ? "Failed to update class" : "Failed to add class",
        description: err.response?.data?.detail || err.message || "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!classToDelete) return;
    try {
      await removeClass(classToDelete);
      toast({ title: "Class deleted successfully" });
    } catch (err: any) {
      toast({
        title: "Failed to delete class",
        description: err.response?.data?.detail || "An error occurred",
        variant: "destructive"
      });
    } finally {
      setClassToDelete(null);
    }
  };

  const handleOpenCurriculum = (classData: Class) => {
    setCurriculumClass(classData);
    // Initialize with empty semesters or load from storage
    setSemesters([
      { id: "1", name: "Semester 1", subjects: [] },
      { id: "2", name: "Semester 2", subjects: [] },
    ]);
    setIsCurriculumOpen(true);
  };

  const handleSaveCurriculum = () => {
    console.log("Saving curriculum for", curriculumClass?.code, semesters);
    toast({ title: "Curriculum saved successfully" });
    setIsCurriculumOpen(false);
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              Class (Student Group) Management
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage student groups, class sections, and curriculum
            </p>
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingClass(null);
                setIsExportTKB(true);
                setClassType("regular");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog(null)} className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Class</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingClass ? "Edit Class" : "Add New Class"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">
                        Class ID <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="code"
                        name="code"
                        defaultValue={editingClass?.code}
                        required
                        placeholder="CS-A"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="schoolYear">
                        School Year <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="schoolYear"
                        name="schoolYear"
                        defaultValue={editingClass?.schoolYear}
                        required
                        placeholder="2024-2025"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Class Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingClass?.name}
                      required
                      placeholder="Computer Science - Section A"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="major">
                        Major <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="major"
                        name="major"
                        defaultValue={editingClass?.major}
                        required
                        placeholder="Computer Science"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="classType">
                        Class Type <span className="text-destructive">*</span>
                      </Label>
                      <Select value={classType} onValueChange={(v) => setClassType(v as ClassType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="regular">Chính quy (Regular)</SelectItem>
                          <SelectItem value="transfer">Liên thông (Transfer)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studentCount">
                      Number of Students <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="studentCount"
                      name="studentCount"
                      type="number"
                      min="1"
                      defaultValue={editingClass?.studentCount}
                      required
                      placeholder="35"
                    />
                    <p className="text-xs text-muted-foreground">
                      Critical for room capacity validation
                    </p>
                  </div>
                </div>

                {/* Configuration */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                    Configuration
                  </h3>
                  <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-border">
                    <div className="space-y-0.5">
                      <Label htmlFor="isExportTKB" className="text-sm sm:text-base">
                        Export Timetable (TKB)
                      </Label>
                      <p className="text-[10px] sm:text-sm text-muted-foreground">
                        Include this class in timetable export files
                      </p>
                    </div>
                    <Switch
                      id="isExportTKB"
                      checked={isExportTKB}
                      onCheckedChange={setIsExportTKB}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note">Notes</Label>
                    <Textarea
                      id="note"
                      name="note"
                      defaultValue={editingClass?.note}
                      placeholder="Optional notes about the class"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">{editingClass ? "Update" : "Create"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Advanced Toolbar */}
        <AdvancedTableToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search classes..."
          departments={majors}
          maxCapacity={maxStudentCount}
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <SortableTableHead sortKey="code" currentSortKey={sortConfig.key} currentDirection={sortConfig.direction} onSort={handleSort} className="text-xs sm:text-sm">Class ID</SortableTableHead>
                  <SortableTableHead sortKey="name" currentSortKey={sortConfig.key} currentDirection={sortConfig.direction} onSort={handleSort} className="text-xs sm:text-sm">Class Name</SortableTableHead>
                  <SortableTableHead sortKey="classType" currentSortKey={sortConfig.key} currentDirection={sortConfig.direction} onSort={handleSort} className="text-xs sm:text-sm">Type</SortableTableHead>
                  <SortableTableHead sortKey="major" currentSortKey={sortConfig.key} currentDirection={sortConfig.direction} onSort={handleSort} className="text-xs sm:text-sm hidden md:table-cell">Major</SortableTableHead>
                  <SortableTableHead sortKey="schoolYear" currentSortKey={sortConfig.key} currentDirection={sortConfig.direction} onSort={handleSort} className="text-xs sm:text-sm hidden lg:table-cell">Year</SortableTableHead>
                  <SortableTableHead sortKey="studentCount" currentSortKey={sortConfig.key} currentDirection={sortConfig.direction} onSort={handleSort} className="text-xs sm:text-sm">Students</SortableTableHead>
                  <SortableTableHead sortKey="isExportTKB" currentSortKey={sortConfig.key} currentDirection={sortConfig.direction} onSort={handleSort} className="text-xs sm:text-sm hidden sm:table-cell">Export TKB</SortableTableHead>
                  <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Notes</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedClasses.map((classData) => (
                  <TableRow key={classData.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium text-xs sm:text-sm">{classData.code}</TableCell>
                    <TableCell className="text-xs sm:text-sm max-w-[120px] truncate">{classData.name}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium ${classData.classType === "regular"
                          ? "bg-primary/10 text-primary"
                          : "bg-accent text-accent-foreground"
                          }`}
                      >
                        {classData.classType === "regular" ? "Chính quy" : "Liên thông"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm hidden md:table-cell">{classData.major}</TableCell>
                    <TableCell className="text-xs sm:text-sm hidden lg:table-cell">{classData.schoolYear}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-primary text-xs sm:text-sm">
                        {classData.studentCount}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span
                        className={`inline-flex items-center rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium ${classData.isExportTKB
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                          }`}
                      >
                        {classData.isExportTKB ? "Yes" : "No"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[100px] truncate hidden lg:table-cell">
                      {classData.note || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenCurriculum(classData)}
                          title="Configure Curriculum"
                          className="h-8 w-8 p-0"
                        >
                          <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(classData)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setClassToDelete(classData.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      {/* Curriculum Side Panel */}
      <Sheet open={isCurriculumOpen} onOpenChange={setIsCurriculumOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
          <SheetHeader>
            <SheetTitle>Curriculum - {curriculumClass?.code}</SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 mt-6 pr-4">
            <CurriculumForm
              availableSubjects={mockSubjects}
              semesters={semesters}
              onChange={setSemesters}
            />
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setIsCurriculumOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCurriculum}>Save Curriculum</Button>
          </div>
        </SheetContent>
      </Sheet>
    </Layout>
  );
};

export default Classes;
