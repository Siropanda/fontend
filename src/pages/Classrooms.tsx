import { useState, useMemo, useEffect } from "react";
import Layout from "@/components/Layout";
import { Classroom, RoomType } from "@/types";
import { useClassrooms } from "@/contexts/ClassroomContext";
import AdvancedTableToolbar from "@/components/AdvancedTableToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTableSort } from "@/hooks/useTableSort";
import SortableTableHead from "@/components/SortableTableHead";
import TablePagination from "@/components/TablePagination";

interface FilterConfig {
  capacity?: { min: number; max: number };
  department?: string;
  status?: string;
}

const Classrooms = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterConfig>({});
  const [isSaving, setIsSaving] = useState(false);
  const [classToDelete, setClassToDelete] = useState<string | null>(null);
  const { classrooms: apiClassrooms, loading, error, addClassroom, updateClassroom, removeClassroom, currentPage, totalPages, totalCount, pageSize, setPage, setPageSize } = useClassrooms();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const { toast } = useToast();

  // Sync API data to local state for now (so existing Add/Edit logic still works on the frontend view)
  useEffect(() => {
    if (apiClassrooms.length > 0) {
      setClassrooms(apiClassrooms);
    }
  }, [apiClassrooms]);

  const roomTypes = useMemo(() => {
    const typeSet = new Set<string>();
    classrooms.forEach(c => typeSet.add(c.type));
    return Array.from(typeSet);
  }, [classrooms]);

  const maxCapacity = useMemo(() => {
    return Math.max(...classrooms.map(c => c.capacity), 100);
  }, [classrooms]);

  const filteredClassrooms = useMemo(() => {
    let result = classrooms;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.code.toLowerCase().includes(query) ||
          c.name.toLowerCase().includes(query) ||
          c.type.toLowerCase().includes(query)
      );
    }
    if (filters.department) {
      result = result.filter(c => c.type === filters.department);
    }
    if (filters.capacity) {
      result = result.filter(
        c => c.capacity >= filters.capacity!.min && c.capacity <= filters.capacity!.max
      );
    }
    return result;
  }, [classrooms, searchQuery, filters]);

  const { sortedData: sortedClassrooms, sortConfig, handleSort } = useTableSort(filteredClassrooms);

  const handleOpenDialog = (classroom: Classroom | null) => {
    setEditingClassroom(classroom);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const classroomData = {
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      capacity: Number(formData.get("capacity")),
      type: formData.get("type") as RoomType,
    };

    setIsSaving(true);
    try {
      if (editingClassroom) {
        await updateClassroom(editingClassroom.id, classroomData);
        toast({ title: "Classroom updated successfully" });
      } else {
        await addClassroom(classroomData);
        toast({ title: "Classroom added successfully" });
      }
      setIsDialogOpen(false);
      setEditingClassroom(null);
    } catch (err: any) {
      toast({
        title: editingClassroom ? "Failed to update classroom" : "Failed to add classroom",
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
      await removeClassroom(classToDelete);
      toast({ title: "Classroom deleted successfully" });
    } catch (err: any) {
      toast({
        title: "Failed to delete classroom",
        description: err.response?.data?.detail || "An error occurred",
        variant: "destructive"
      });
    } finally {
      setClassToDelete(null);
    }
  };

  const getTypeColor = (type: RoomType) => {
    switch (type) {
      case "theory":
      case "lecture_hall":
        return "bg-primary/10 text-primary";
      case "lab":
      case "clinical":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "exam":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading classrooms...</div>;
  }

  if (error) {
    // We can just toast the error and show what we have (e.g. empty or mock if fallback happened in context)
  }

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Classroom Management</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Manage classroom and facility data</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog(null)} className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Classroom</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingClassroom ? "Edit Classroom" : "Add New Classroom"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Room ID <span className="text-destructive">*</span></Label>
                    <Input id="code" name="code" defaultValue={editingClassroom?.code} required placeholder="A101" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity <span className="text-destructive">*</span></Label>
                    <Input id="capacity" name="capacity" type="number" min="1" defaultValue={editingClassroom?.capacity} required placeholder="30" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Room Name <span className="text-destructive">*</span></Label>
                  <Input id="name" name="name" defaultValue={editingClassroom?.name} required placeholder="Lecture Hall A" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Room Type <span className="text-destructive">*</span></Label>
                  <Select name="type" defaultValue={editingClassroom?.type || "theory"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="theory">Lý thuyết</SelectItem>
                      <SelectItem value="lab">Thực hành tổng quát</SelectItem>
                      <SelectItem value="clinical">Thực hành lâm sàng</SelectItem>
                      <SelectItem value="lecture_hall">Giảng đường</SelectItem>
                      <SelectItem value="exam">Phòng thi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Cancel</Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : (editingClassroom ? "Update" : "Create")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <AdvancedTableToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search classrooms..."
          departments={roomTypes}
          maxCapacity={maxCapacity}
          filters={filters}
          onFiltersChange={setFilters}
        />

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <SortableTableHead sortKey="code" currentSortKey={sortConfig.key} currentDirection={sortConfig.direction} onSort={handleSort} className="text-xs sm:text-sm">ID</SortableTableHead>
                  <SortableTableHead sortKey="name" currentSortKey={sortConfig.key} currentDirection={sortConfig.direction} onSort={handleSort} className="text-xs sm:text-sm">Name</SortableTableHead>
                  <SortableTableHead sortKey="type" currentSortKey={sortConfig.key} currentDirection={sortConfig.direction} onSort={handleSort} className="text-xs sm:text-sm">Type</SortableTableHead>
                  <SortableTableHead sortKey="capacity" currentSortKey={sortConfig.key} currentDirection={sortConfig.direction} onSort={handleSort} className="text-xs sm:text-sm">Capacity</SortableTableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedClassrooms.map((classroom) => (
                  <TableRow key={classroom.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium text-xs sm:text-sm">{classroom.code}</TableCell>
                    <TableCell className="text-xs sm:text-sm">{classroom.name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium ${getTypeColor(classroom.type)}`}>
                        {classroom.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">{classroom.capacity} <span className="hidden sm:inline">students</span></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(classroom)} className="h-8 w-8 p-0">
                          <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setClassToDelete(classroom.id)} className="h-8 w-8 p-0">
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
          onPageSizeChange={setPageSize}
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

      <AlertDialog open={!!classToDelete} onOpenChange={(open) => !open && setClassToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will mark the classroom as inactive and remove it from view.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Classrooms;
