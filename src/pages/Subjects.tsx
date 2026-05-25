import { useState, useMemo, useEffect } from "react";
import Layout from "@/components/Layout";
import { Subject, SubjectTeacherAssignment, TeacherPriority } from "@/types";
import { mockTeachers } from "@/lib/mockData";
import { useSubjects } from "@/contexts/SubjectContext";
import SubjectFilterToolbar, { SubjectFilterConfig } from "@/components/SubjectFilterToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, X, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useTableSort } from "@/hooks/useTableSort";
import SortableTableHead from "@/components/SortableTableHead";
import TablePagination from "@/components/TablePagination";

const Subjects = () => {
  const { subjects: subjectsRaw, loading, error, addSubject, editSubject, removeSubject, refreshSubjects, currentPage, totalPages, totalCount, setPage } = useSubjects();
  const subjects = subjectsRaw ?? [];
  const [isSaving, setIsSaving] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SubjectFilterConfig>({});
  const [pageSize, setPageSize] = useState(10);
  const { toast } = useToast();

  // Form state for controlled inputs
  const [theorySessions, setTheorySessions] = useState(0);
  const [practiceSessions, setPracticeSessions] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [allowEvening, setAllowEvening] = useState(false);
  const [assignedTeachers, setAssignedTeachers] = useState<SubjectTeacherAssignment[]>([]);

  // Auto-calculate total sessions
  useEffect(() => {
    setTotalSessions(theorySessions + practiceSessions);
  }, [theorySessions, practiceSessions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshSubjects({
        search: searchQuery || undefined,
        min_credits: filters.minCredits || undefined,
        max_credits: filters.maxCredits || undefined,
        allow_evening: filters.allowEvening !== undefined ? filters.allowEvening : undefined,
        session_type: filters.sessionType !== "all" ? filters.sessionType : undefined,
      });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filters]);

  const { sortedData: sortedSubjects, sortConfig, handleSort } = useTableSort(subjects);

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const resetFormState = () => {
    setTheorySessions(0);
    setPracticeSessions(0);
    setTotalSessions(0);
    setAllowEvening(false);
    setAssignedTeachers([]);
  };

  const handleOpenDialog = (subject: Subject | null) => {
    setEditingSubject(subject);
    if (subject) {
      setTheorySessions(subject.theorySessions);
      setPracticeSessions(subject.practiceSessions);
      setTotalSessions(subject.totalSessions);
      setAllowEvening(subject.allowEvening);
      setAssignedTeachers(subject.assignedTeachers || []);
    } else {
      resetFormState();
    }
    setIsDialogOpen(true);
  };

  const handleAddTeacher = (teacherId: string) => {
    if (!assignedTeachers.find(t => t.teacherId === teacherId)) {
      setAssignedTeachers([...assignedTeachers, { teacherId, priority: 'medium' }]);
    }
  };

  const handleRemoveTeacher = (teacherId: string) => {
    setAssignedTeachers(assignedTeachers.filter(t => t.teacherId !== teacherId));
  };

  const handlePriorityChange = (teacherId: string, priority: TeacherPriority) => {
    setAssignedTeachers(assignedTeachers.map(t =>
      t.teacherId === teacherId ? { ...t, priority } : t
    ));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const subjectData = {
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      credits: Number(formData.get('credits')),
      totalSessions: totalSessions,
      theorySessions: theorySessions,
      practiceSessions: practiceSessions,
      allowEvening: allowEvening,
      assignedTeachers: assignedTeachers,
    };

    setIsSaving(true);
    try {
      if (editingSubject) {
        await editSubject(editingSubject.id, subjectData);
        toast({ title: "Subject updated successfully" });
      } else {
        await addSubject(subjectData);
        toast({ title: "Subject added successfully" });
      }
      setIsDialogOpen(false);
      setEditingSubject(null);
      resetFormState();
    } catch (err: any) {
      toast({
        title: editingSubject ? "Failed to update subject" : "Failed to add subject",
        description: err.response?.data?.detail || err.message || "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!subjectToDelete) return;
    try {
      await removeSubject(subjectToDelete);
      toast({ title: "Subject deleted successfully" });
    } catch (err: any) {
      toast({
        title: "Failed to delete subject",
        description: err.response?.data?.detail || "An error occurred",
        variant: "destructive"
      });
    } finally {
      setSubjectToDelete(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Subject Management</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Manage subject master data</p>
          </div>

          {/* Advanced Filter Toolbar */}
          <SubjectFilterToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search by name or code..."
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>

        <div className="flex items-center justify-end">
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingSubject(null);
              resetFormState();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog(null)} className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Subject</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">Basic Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Subject Code <span className="text-destructive">*</span></Label>
                      <Input
                        id="code"
                        name="code"
                        defaultValue={editingSubject?.code}
                        required
                        placeholder="CS101"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="credits">Credits <span className="text-destructive">*</span></Label>
                      <Input
                        id="credits"
                        name="credits"
                        type="number"
                        min="0"
                        defaultValue={editingSubject?.credits}
                        required
                        placeholder="3"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Subject Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingSubject?.name}
                      required
                      placeholder="Introduction to Programming"
                    />
                  </div>
                </div>

                {/* Session Counts */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">Session Configuration</h3>
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="theorySessions" className="text-xs sm:text-sm">Theory</Label>
                      <Input
                        id="theorySessions"
                        type="number"
                        min="0"
                        value={theorySessions}
                        onChange={(e) => setTheorySessions(Number(e.target.value))}
                        placeholder="10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="practiceSessions" className="text-xs sm:text-sm">Practice</Label>
                      <Input
                        id="practiceSessions"
                        type="number"
                        min="0"
                        value={practiceSessions}
                        onChange={(e) => setPracticeSessions(Number(e.target.value))}
                        placeholder="5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalSessions" className="text-xs sm:text-sm">Total</Label>
                      <Input
                        id="totalSessions"
                        type="number"
                        value={totalSessions}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </div>

                {/* Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">Settings</h3>
                  <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-border">
                    <div className="space-y-0.5">
                      <Label htmlFor="allowEvening" className="text-sm sm:text-base">Allow Evening Classes</Label>
                      <p className="text-[10px] sm:text-sm text-muted-foreground">
                        Can be scheduled in evening (17h-21h)
                      </p>
                    </div>
                    <Switch
                      id="allowEvening"
                      checked={allowEvening}
                      onCheckedChange={setAllowEvening}
                    />
                  </div>
                </div>

                {/* Teacher Assignment with Priority */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                    Teacher Assignment (for Scheduling Algorithm)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Select teachers who can teach this subject and set their priority level for the scheduling algorithm.
                  </p>

                  {/* Add Teacher */}
                  <div className="flex items-center gap-2">
                    <Select onValueChange={handleAddTeacher}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Add a teacher..." />
                      </SelectTrigger>
                      <SelectContent>
                        {mockTeachers
                          .filter(t => !assignedTeachers.find(at => at.teacherId === t.id))
                          .map(teacher => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.fullName} ({teacher.shortName})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="icon" disabled>
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Assigned Teachers List */}
                  {assignedTeachers.length > 0 && (
                    <div className="space-y-2">
                      {assignedTeachers.map(assignment => {
                        const teacher = mockTeachers.find(t => t.id === assignment.teacherId);
                        if (!teacher) return null;

                        return (
                          <div
                            key={assignment.teacherId}
                            className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                          >
                            <div className="flex items-center gap-3">
                              <div>
                                <p className="font-medium text-sm">{teacher.fullName}</p>
                                <p className="text-xs text-muted-foreground">{teacher.shortName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Select
                                value={assignment.priority}
                                onValueChange={(v) => handlePriorityChange(assignment.teacherId, v as TeacherPriority)}
                              >
                                <SelectTrigger className="w-28 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="high">
                                    <Badge variant="default" className="bg-destructive text-destructive-foreground">High</Badge>
                                  </SelectItem>
                                  <SelectItem value="medium">
                                    <Badge variant="default" className="bg-warning text-warning-foreground">Medium</Badge>
                                  </SelectItem>
                                  <SelectItem value="low">
                                    <Badge variant="secondary">Low</Badge>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleRemoveTeacher(assignment.teacherId)}
                              >
                                <X className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {assignedTeachers.length === 0 && (
                    <div className="text-center py-4 text-sm text-muted-foreground border border-dashed rounded-lg">
                      No teachers assigned yet. Add teachers above.
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingSubject ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <SortableTableHead sortKey="code" currentSortKey={sortConfig.key} currentDirection={sortConfig.direction} onSort={handleSort} className="text-xs sm:text-sm">Code</SortableTableHead>
                  <SortableTableHead sortKey="name" currentSortKey={sortConfig.key} currentDirection={sortConfig.direction} onSort={handleSort} className="text-xs sm:text-sm">Name</SortableTableHead>
                  <SortableTableHead sortKey="credits" currentSortKey={sortConfig.key} currentDirection={sortConfig.direction} onSort={handleSort} className="text-xs sm:text-sm">Credits</SortableTableHead>
                  <SortableTableHead sortKey="totalSessions" currentSortKey={sortConfig.key} currentDirection={sortConfig.direction} onSort={handleSort} className="text-xs sm:text-sm hidden sm:table-cell">Sessions</SortableTableHead>
                  <TableHead className="text-xs sm:text-sm hidden md:table-cell">Theory/Practice</TableHead>
                  <SortableTableHead sortKey="allowEvening" currentSortKey={sortConfig.key} currentDirection={sortConfig.direction} onSort={handleSort} className="text-xs sm:text-sm">Evening</SortableTableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSubjects.map((subject) => (
                  <TableRow key={subject.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium text-xs sm:text-sm">{subject.code}</TableCell>
                    <TableCell className="text-xs sm:text-sm max-w-[150px] truncate">{subject.name}</TableCell>
                    <TableCell className="text-xs sm:text-sm">{subject.credits}</TableCell>
                    <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{subject.totalSessions}</TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                      {subject.theorySessions}T / {subject.practiceSessions}P
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium ${subject.allowEvening
                        ? 'bg-success/10 text-success'
                        : 'bg-muted text-muted-foreground'
                        }`}>
                        {subject.allowEvening ? 'Yes' : 'No'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(subject)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSubjectToDelete(subject.id)}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            Showing page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1 || loading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!subjectToDelete} onOpenChange={() => setSubjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the subject
              and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Subjects;
