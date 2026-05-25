import { useState, useMemo, useEffect, useCallback } from "react";
import { z } from "zod";
import Layout from "@/components/Layout";
import { Teacher, TeacherType, AcademicDegree, Subject } from "@/types";
import {
  mockSubjects,
  ACADEMIC_DEGREES,
  formatTeacherName,
} from "@/lib/mockData";
import { useTeachers } from "@/contexts/TeacherContext";
import TeacherFilterToolbar, {
  TeacherFilterConfig,
} from "@/components/TeacherFilterToolbar";
import TeacherStatsCard from "@/components/TeacherStatsCard";
import WeeklyAvailabilityScheduler from "@/components/WeeklyAvailabilityScheduler";
import type { WeeklySlot } from "@/components/WeeklyAvailabilityScheduler";
import SubjectMultiSelect from "@/components/SubjectMultiSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Plus, Pencil, Trash2, BarChart3, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useTableSort } from "@/hooks/useTableSort";
import SortableTableHead from "@/components/SortableTableHead";
import TablePagination from "@/components/TablePagination";
import { subjectService } from "@/services/subject.service"; // ← Import service thật

// ===== Helper: Map snake_case (backend) → camelCase (frontend display) =====
const adaptSubjectForUI = (backendSubject: any): Subject => ({
  id: backendSubject.id,
  code: backendSubject.code,
  name: backendSubject.title || backendSubject.name || "", // title (backend) → name (frontend)
  credits: backendSubject.credits || 0,
  allowEvening: backendSubject.can_be_evening || false,
  totalSessions: backendSubject.total_slots || 0,
  theorySessions: backendSubject.lecture_slots || 0,
  practiceSessions: backendSubject.practice_slots || 0,
  type: backendSubject.type || "theory",
  requiredClassroomType: backendSubject.required_room_type || "theory",
});

// ===== Zod Validation Schema =====
const teacherFormSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required.")
    .regex(/^[a-zA-ZÀ-ỹ\s.]+$/, "Full name must not contain special characters."),
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Please enter a valid email address."),
  phone: z
    .string()
    .min(1, "Phone number is required.")
    .regex(/^\d{9,15}$/, "Phone number must contain only digits (9–15 digits)."),
  department: z
    .string()
    .min(1, "Department is required."),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required.")
    .refine((val) => {
      const dob = new Date(val);
      const now = new Date();
      const age = now.getFullYear() - dob.getFullYear();
      return !isNaN(dob.getTime()) && age >= 22;
    }, "Teacher must be at least 22 years old."),
  subjectIds: z
    .array(z.string())
    .min(1, "At least one subject must be selected."),
});

type TeacherFormErrors = Partial<Record<keyof z.infer<typeof teacherFormSchema>, string>>;

const Teachers = () => {
  const {
    teachers: teachersRaw,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    pageSize,
    setPage,
    setPageSize,
    addTeacher,
    updateTeacher: updateTeacherCtx,
    removeTeacher,
    refreshTeachers,
  } = useTeachers();
  const teachers = teachersRaw ?? [];

  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<TeacherFormErrors>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<TeacherFilterConfig>({});
  const [statsTeacher, setStatsTeacher] = useState<Teacher | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  // ← NEW: State cho subjects thật từ backend
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  const { toast } = useToast();

  const departments = useMemo(() => {
    const deptSet = new Set<string>();
    teachers.forEach((t) => deptSet.add(t.department));
    return Array.from(deptSet);
  }, [teachers]);

  const validAcademicDegrees = useMemo(() => {
    return ACADEMIC_DEGREES.filter((d) => d.value && d.value.trim() !== "");
  }, []);

  // ← NEW: Fetch subjects thật từ backend khi mount
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        setSubjectsLoading(true);
        const response = await subjectService.getSubjects({ page: 1 });
        // Handle cả pagination {results: []} và direct array []
        const subjectsData =
          Array.isArray(response) ? response : (response as any).results || [];
        const mapped = subjectsData.map(adaptSubjectForUI).filter(Boolean);
        setAvailableSubjects(mapped);
      } catch (err) {
        console.error("Failed to load subjects:", err);
        toast({
          title: "Failed to load subjects",
          description: "Using mock data as fallback",
          variant: "destructive",
        });
        // Fallback về mock nếu API lỗi
        setAvailableSubjects(mockSubjects);
      } finally {
        setSubjectsLoading(false);
      }
    };
    loadSubjects();
  }, [toast]);

  const filteredTeachers = useMemo(() => {
    let result = teachers;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.fullName.toLowerCase().includes(query) ||
          t.shortName.toLowerCase().includes(query) ||
          t.email.toLowerCase().includes(query) ||
          t.department.toLowerCase().includes(query),
      );
    }
    if (filters.subjectId)
      result = result.filter((t) => t.subjectIds?.includes(filters.subjectId!));
    if (filters.department)
      result = result.filter((t) => t.department === filters.department);
    if (filters.status && filters.status !== "all") {
      result = result.filter((t) =>
        filters.status === "active" ? t.role === "teacher" : t.role === "admin",
      );
    }
    if (filters.academicDegree)
      result = result.filter(
        (t) => t.academicDegree === filters.academicDegree,
      );
    return result;
  }, [teachers, searchQuery, filters]);

  const {
    sortedData: sortedTeachers,
    sortConfig,
    handleSort,
  } = useTableSort(filteredTeachers);

  const resetFormState = () => {
    setFormWeeklySlots([]);
    setFormSubjectIds([]);
    setFormTeacherType("full-time");
    setFormDegree("");
    setFormRole("teacher");
    setFormErrors({});
  };

  const handleOpenDialog = (teacher: Teacher | null) => {
    setEditingTeacher(teacher);
    if (teacher) {
      setFormWeeklySlots((teacher.availableSlots || []).map(s => ({
        day: s.day,
        period: s.period,
        weekOffset: (s as any).weekOffset ?? 0,
        date: (s as any).date ?? '',
      })));
      setFormSubjectIds(teacher.subjectIds || []);
      setFormTeacherType(teacher.teacherType || "full-time");
      const isValidDegree =
        teacher.academicDegree &&
        validAcademicDegrees.some((d) => d.value === teacher.academicDegree);
      setFormDegree(isValidDegree ? teacher.academicDegree! : "");
      setFormRole(teacher.role || "teacher");
    } else {
      resetFormState();
    }
    setIsDialogOpen(true);
  };

  // Form state
  const [formWeeklySlots, setFormWeeklySlots] = useState<WeeklySlot[]>([]);
  const [formSubjectIds, setFormSubjectIds] = useState<string[]>([]);
  const [formTeacherType, setFormTeacherType] =
    useState<TeacherType>("full-time");
  const [formDegree, setFormDegree] = useState<AcademicDegree | "">("");
  const [formRole, setFormRole] = useState<"teacher" | "admin">("teacher");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const rawData = {
      fullName: (formData.get("fullName") as string) || "",
      email: (formData.get("email") as string) || "",
      phone: (formData.get("phone") as string) || "",
      department: (formData.get("department") as string) || "",
      dateOfBirth: (formData.get("dateOfBirth") as string) || "",
      subjectIds: formSubjectIds,
    };

    const result = teacherFormSchema.safeParse(rawData);
    if (!result.success) {
      const fieldErrors: TeacherFormErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof TeacherFormErrors;
        if (!fieldErrors[field]) fieldErrors[field] = err.message;
      });
      setFormErrors(fieldErrors);
      return;
    }
    setFormErrors({});
    setSubmitting(true);

    const availableSlots = formWeeklySlots.map((slot) => ({
      day: slot.day,
      period: slot.period,
    }));

    const teacherData = {
      fullName: rawData.fullName,
      shortName: (formData.get("shortName") as string) || undefined,
      email: rawData.email,
      phone: rawData.phone,
      idCardNumber: (formData.get("idCardNumber") as string) || undefined,
      dateOfBirth: rawData.dateOfBirth,
      department: rawData.department,
      role: formRole,
      teacherType: formTeacherType,
      academicDegree:
        formDegree && validAcademicDegrees.some((d) => d.value === formDegree)
          ? formDegree
          : undefined,
      availableSlots,
      subjectIds: formSubjectIds,
    };

    try {
      if (editingTeacher) {
        await updateTeacherCtx(editingTeacher.id, teacherData);
        toast({ title: "✅ Teacher updated successfully" });
      } else {
        await addTeacher(teacherData as Omit<Teacher, "id">);
        toast({ title: "✅ Teacher added successfully" });
      }
      setIsDialogOpen(false);
      setEditingTeacher(null);
      resetFormState();
    } catch (err: any) {
      console.error("Submission Error Details:", err.response?.data);
      toast({
        title: "Failed to save teacher",
        description:
          err.response?.data?.message ||
          "Please check the console for details.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTeacher) return;
    setSubmitting(true);
    try {
      await removeTeacher(deletingTeacher.id);
      toast({ title: "Teacher deactivated successfully" });
    } catch {
      toast({ title: "Failed to deactivate teacher", variant: "destructive" });
    } finally {
      setSubmitting(false);
      setDeletingTeacher(null);
    }
  };

  const handleOpenStats = (teacher: Teacher) => {
    setStatsTeacher(teacher);
    setIsStatsOpen(true);
  };

  // ← NEW: Helper lấy subject từ availableSubjects (đã map)
  const getSubjectById = useCallback(
    (subjectId: string) => {
      return availableSubjects.find((s) => s.id === subjectId);
    },
    [availableSubjects],
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Teacher Management
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage faculty members, subjects, and availability
            </p>
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingTeacher(null);
                resetFormState();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog(null)} className="gap-2">
                <Plus className="h-4 w-4" /> Add Teacher
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[95vh]"   aria-describedby={undefined}>
              <DialogHeader>
                <DialogTitle>
                  {editingTeacher ? "Edit Teacher" : "Add New Teacher"}
                </DialogTitle>
                   <DialogDescription className="sr-only">  // ← sr-only: chỉ cho screen reader
      {editingTeacher 
        ? "Update teacher information and availability" 
        : "Create a new teacher profile with subjects and schedule"}
    </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[calc(95vh-120px)] pr-4">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name <span className="text-destructive">*</span></Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          defaultValue={editingTeacher?.fullName}
                          placeholder="John Smith"
                          className={formErrors.fullName ? "border-destructive focus-visible:ring-destructive" : ""}
                          onChange={() => formErrors.fullName && setFormErrors(prev => ({ ...prev, fullName: undefined }))}
                        />
                        {formErrors.fullName && <p className="text-sm text-destructive">{formErrors.fullName}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shortName">Short Name (Display)</Label>
                        <Input
                          id="shortName"
                          name="shortName"
                          defaultValue={editingTeacher?.shortName}
                          placeholder="J. Smith"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          defaultValue={editingTeacher?.email}
                          placeholder="john.smith@university.edu"
                          className={formErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                          onChange={() => formErrors.email && setFormErrors(prev => ({ ...prev, email: undefined }))}
                        />
                        {formErrors.email && <p className="text-sm text-destructive">{formErrors.email}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          defaultValue={editingTeacher?.phone}
                          placeholder="0901234567"
                          className={formErrors.phone ? "border-destructive focus-visible:ring-destructive" : ""}
                          onChange={() => formErrors.phone && setFormErrors(prev => ({ ...prev, phone: undefined }))}
                        />
                        {formErrors.phone && <p className="text-sm text-destructive">{formErrors.phone}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="idCardNumber">
                          ID Card Number (CCCD)
                        </Label>
                        <Input
                          id="idCardNumber"
                          name="idCardNumber"
                          defaultValue={editingTeacher?.idCardNumber}
                          placeholder="012345678901"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth <span className="text-destructive">*</span></Label>
                        <Input
                          id="dateOfBirth"
                          name="dateOfBirth"
                          type="date"
                          defaultValue={editingTeacher?.dateOfBirth}
                          className={formErrors.dateOfBirth ? "border-destructive focus-visible:ring-destructive" : ""}
                          onChange={() => formErrors.dateOfBirth && setFormErrors(prev => ({ ...prev, dateOfBirth: undefined }))}
                        />
                        {formErrors.dateOfBirth && <p className="text-sm text-destructive">{formErrors.dateOfBirth}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="department">Department <span className="text-destructive">*</span></Label>
                        <Input
                          id="department"
                          name="department"
                          defaultValue={editingTeacher?.department}
                          placeholder="Computer Science"
                          className={formErrors.department ? "border-destructive focus-visible:ring-destructive" : ""}
                          onChange={() => formErrors.department && setFormErrors(prev => ({ ...prev, department: undefined }))}
                        />
                        {formErrors.department && <p className="text-sm text-destructive">{formErrors.department}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Academic Degree</Label>
                        <Select
                          value={formDegree}
                          onValueChange={(v) =>
                            setFormDegree(v as AcademicDegree)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select degree" />
                          </SelectTrigger>
                          <SelectContent>
                            {validAcademicDegrees.map((d) => (
                              <SelectItem key={d.value} value={d.value}>
                                {d.label} ({d.labelVi})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                          value={formRole}
                          onValueChange={(v) =>
                            setFormRole(v as "teacher" | "admin")
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="teacher">Teacher</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Teacher Type</Label>
                        <Select
                          value={formTeacherType}
                          onValueChange={(v) =>
                            setFormTeacherType(v as TeacherType)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full-time">
                              Giáo viên chính quy (Full-time)
                            </SelectItem>
                            <SelectItem value="visiting">
                              Giáo viên thỉnh giảng (Visiting)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Subject Assignment - ← UPDATED: Dùng availableSubjects thật */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                      Subject Assignment
                    </h3>
                    <div className="space-y-2">
                      <Label>Subjects This Teacher Can Teach <span className="text-destructive">*</span></Label>
                      {subjectsLoading ? (
                        <div className="p-4 border rounded-md text-sm text-muted-foreground flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading subjects...
                        </div>
                      ) : (
                        <SubjectMultiSelect
                          subjects={availableSubjects}
                          value={formSubjectIds}
                          onChange={(ids) => {
                            setFormSubjectIds(ids);
                            if (formErrors.subjectIds) setFormErrors(prev => ({ ...prev, subjectIds: undefined }));
                          }}
                        />
                      )}
                      {formErrors.subjectIds && <p className="text-sm text-destructive">{formErrors.subjectIds}</p>}
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                      Schedule Planning
                    </h3>
                    <WeeklyAvailabilityScheduler
                      value={formWeeklySlots}
                      onChange={setFormWeeklySlots}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {editingTeacher ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>

        <TeacherFilterToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search teachers..."
          subjects={availableSubjects} // ← UPDATED: Dùng subjects thật
          departments={departments}
          filters={filters}
          onFiltersChange={setFilters}
        />

        <div className="rounded-lg border border-border bg-card">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-24 ml-auto" />
                </div>
              ))}
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No teachers found.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => handleOpenDialog(null)}
              >
                <Plus className="h-4 w-4 mr-2" /> Add your first teacher
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead
                      sortKey="fullName"
                      currentSortKey={sortConfig.key}
                      currentDirection={sortConfig.direction}
                      onSort={handleSort}
                    >
                      Name
                    </SortableTableHead>
                    <SortableTableHead
                      sortKey="academicDegree"
                      currentSortKey={sortConfig.key}
                      currentDirection={sortConfig.direction}
                      onSort={handleSort}
                    >
                      Degree
                    </SortableTableHead>
                    <SortableTableHead
                      sortKey="teacherType"
                      currentSortKey={sortConfig.key}
                      currentDirection={sortConfig.direction}
                      onSort={handleSort}
                    >
                      Type
                    </SortableTableHead>
                    <SortableTableHead
                      sortKey="email"
                      currentSortKey={sortConfig.key}
                      currentDirection={sortConfig.direction}
                      onSort={handleSort}
                    >
                      Email
                    </SortableTableHead>
                    <SortableTableHead
                      sortKey="department"
                      currentSortKey={sortConfig.key}
                      currentDirection={sortConfig.direction}
                      onSort={handleSort}
                    >
                      Department
                    </SortableTableHead>
                    <TableHead>Subjects</TableHead>
                    <SortableTableHead
                      sortKey="role"
                      currentSortKey={sortConfig.key}
                      currentDirection={sortConfig.direction}
                      onSort={handleSort}
                    >
                      Role
                    </SortableTableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTeachers.map((teacher) => (
                    <TableRow
                      key={teacher.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="font-medium">
                        {formatTeacherName(
                          teacher.fullName,
                          teacher.academicDegree,
                        )}
                      </TableCell>
                      <TableCell>
                        {teacher.academicDegree ? (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                            {validAcademicDegrees.find(
                              (d) => d.value === teacher.academicDegree,
                            )?.labelVi || teacher.academicDegree}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            teacher.teacherType === "full-time"
                              ? "bg-primary/10 text-primary"
                              : "bg-accent text-accent-foreground"
                          }`}
                        >
                          {teacher.teacherType === "full-time"
                            ? "Chính quy"
                            : "Thỉnh giảng"}
                        </span>
                      </TableCell>
                      <TableCell>{teacher.email}</TableCell>
                      <TableCell>{teacher.department}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {teacher.subjectIds?.slice(0, 2).map((subjectId) => {
                            // ← UPDATED: Tìm trong availableSubjects thật thay vì mock
                            const subject = getSubjectById(subjectId);
                            return subject ? (
                              <span
                                key={subjectId}
                                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary"
                              >
                                {subject.code}
                              </span>
                            ) : null;
                          })}
                          {(teacher.subjectIds?.length || 0) > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{teacher.subjectIds!.length - 2} more
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            teacher.role === "admin"
                              ? "bg-primary/10 text-primary"
                              : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          {teacher.role.charAt(0).toUpperCase() +
                            teacher.role.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenStats(teacher)}
                            title="View Stats"
                          >
                            <BarChart3 className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(teacher)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingTeacher(teacher)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deletingTeacher}
          onOpenChange={(open) => !open && setDeletingTeacher(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deactivate Teacher</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to deactivate{" "}
                <strong>{deletingTeacher?.fullName}</strong>? The teacher will
                be marked as inactive.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={submitting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={submitting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Sheet open={isStatsOpen} onOpenChange={setIsStatsOpen}>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{statsTeacher?.fullName} - Profile</SheetTitle>
            </SheetHeader>
            {statsTeacher && (
              <div className="mt-6">
                {/* ← UPDATED: Truyền availableSubjects thật vào StatsCard */}
                <TeacherStatsCard
                  teacher={statsTeacher}
                  subjects={availableSubjects}
                />
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </Layout>
  );
};

export default Teachers;