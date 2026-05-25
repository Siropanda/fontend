import { Loader2, GraduationCap, BookOpen, DoorOpen, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFetchAll } from "@/hooks/useFetchAll";
import type {
  ClassItem,
  SubjectItem,
  ClassroomItem,
  TeacherItem,
} from "@/types/api";

const DataOverview = () => {
  const { data: classes, loading: loadingClasses, error: errorClasses } =
    useFetchAll<ClassItem>("/scheduler/classes/");
  const { data: subjects, loading: loadingSubjects, error: errorSubjects } =
    useFetchAll<SubjectItem>("/scheduler/subjects/");
  const {
    data: classrooms,
    loading: loadingClassrooms,
    error: errorClassrooms,
  } = useFetchAll<ClassroomItem>("/scheduler/classrooms/");
  const { data: teachers, loading: loadingTeachers, error: errorTeachers } =
    useFetchAll<TeacherItem>("/scheduler/teachers/");

  const isLoading =
    loadingClasses || loadingSubjects || loadingClassrooms || loadingTeachers;

  const firstError =
    errorClasses || errorSubjects || errorClassrooms || errorTeachers;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        <span>Loading overview…</span>
      </div>
    );
  }

  if (firstError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
        Failed to load data: {firstError}
      </div>
    );
  }

  const cards = [
    { label: "Classes", count: classes.length, Icon: GraduationCap },
    { label: "Subjects", count: subjects.length, Icon: BookOpen },
    { label: "Classrooms", count: classrooms.length, Icon: DoorOpen },
    { label: "Teachers", count: teachers.length, Icon: Users },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, count, Icon }) => (
        <Card key={label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {label}
            </CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {count} {label}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DataOverview;
