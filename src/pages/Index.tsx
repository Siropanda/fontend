import Layout from "@/components/Layout";
import StatsCard from "@/components/StatsCard";
import { mockSchedules, mockSubjects, mockTeachers } from "@/lib/mockData";
import { useRole } from "@/contexts/RoleContext";

const Index = () => {
  const { userRole } = useRole();

  // Calculate real stats from mock data
  const totalSubjects = mockSubjects.length;
  const totalTeachers = mockTeachers.filter((t) => t.role === "teacher").length;
  const totalScheduled = mockSchedules.length;

  // Calculate progress summary
  const progressData = mockSchedules.map((schedule) => {
    const subject = mockSubjects.find((s) => s.id === schedule.subjectId);
    return {
      completed: schedule.completedSlots,
      total: subject?.totalSessions || 0,
    };
  });

  const totalSlotsCompleted = progressData.reduce((sum, p) => sum + p.completed, 0);
  const totalSlotsRequired = progressData.reduce((sum, p) => sum + p.total, 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard Overview</h2>
          <p className="text-muted-foreground">Track scheduling progress and system metrics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard label="Total Subjects" value={totalSubjects} />
          <StatsCard label="Faculty Members" value={totalTeachers} />
          <StatsCard label="Scheduled Sessions" value={totalScheduled} variant="success" />
          <StatsCard
            label="Progress"
            value={`${totalSlotsCompleted}/${totalSlotsRequired}`}
            trend="slots completed"
            variant="default"
          />
        </div>

        {/* Subject Progress Overview */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Subject Progress</h3>
          <div className="space-y-4">
            {mockSchedules.map((schedule) => {
              const subject = mockSubjects.find((s) => s.id === schedule.subjectId);
              const teacher = mockTeachers.find((t) => t.id === schedule.teacherId);
              const progressPercent = subject
                ? (schedule.completedSlots / subject.totalSessions) * 100
                : 0;

              return (
                <div key={schedule.id} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-sm font-medium text-foreground">
                          {subject?.code} - {subject?.name}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">({teacher?.shortName})</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {schedule.completedSlots}/{subject?.totalSessions} slots
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Role-based Information */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-3">
            {userRole === "admin" ? "Admin Quick Access" : "My Schedule"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {userRole === "admin"
              ? "Use the navigation menu to manage teachers, subjects, classrooms, classes, and schedules. Click the Schedule tab to create new sessions with automatic conflict detection."
              : "View your assigned subjects and update lesson progress. You can edit lesson titles and mark completed slots in the Schedule section."}
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
