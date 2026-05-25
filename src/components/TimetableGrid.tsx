import { useMemo } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import {
  HoverCard, HoverCardContent, HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Plus, BookOpen, User, Phone, Building2, MapPin, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { STANDARD_TIME_SLOTS, DAYS, getShiftColor } from "@/lib/timeSlots";
import { formatTeacherName } from "@/lib/mockData";
import { useSubjects } from "@/contexts/SubjectContext";
import { useTeachers } from "@/contexts/TeacherContext";
import { useClassrooms } from "@/contexts/ClassroomContext";
import TimetableSessionCard from "./TimetableSessionCard";

interface SessionData {
  subject: string;
  teacher: string;
  room: string;
  startTime: string;
  endTime: string;
  lessonType?: "theory" | "practice";
}

interface TimetableGridProps {
  className: string;
  weekLabel?: string;
  weekStart?: Date;
  daysData: Record<string, Record<string, SessionData[]>>;
  onCellClick: (
    classCode: string,
    day: string,
    timeSlot: string,
    session: { subject: string; teacher: string; room: string; lessonType?: "theory" | "practice" } | null,
    weekStart?: Date
  ) => void;
  onClassClick?: (classCode: string) => void;
}

const TimetableGrid = ({ className, weekLabel, weekStart, daysData, onCellClick, onClassClick }: TimetableGridProps) => {
  const { allSubjects: subjects } = useSubjects();
  const { allTeachers: teachers } = useTeachers();
  const { allClassrooms: classrooms } = useClassrooms();
  const dayDates = useMemo(() => {
    const today = weekStart || new Date();
    const currentDayOfWeek = today.getDay();
    const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    return DAYS.map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    });
  }, [weekStart]);

  // Resolve full details for tooltip
  const getTooltipData = (session: SessionData) => {
    const subject = subjects.find(s => s.code === session.subject);
    const teacher = teachers.find(t => t.shortName === session.teacher);
    const classroom = classrooms.find(c => c.code === session.room);
    return { subject, teacher, classroom };
  };

  return (
    <Card className="p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-1">
        <button
          onClick={() => onClassClick?.(className)}
          className="font-semibold text-lg sm:text-xl text-foreground hover:text-primary hover:underline transition-colors cursor-pointer text-left"
        >
          {className}
        </button>
        {weekLabel && (
          <span className="text-xs sm:text-sm text-muted-foreground font-medium bg-muted px-2.5 py-1 rounded-md">
            📅 {weekLabel}
          </span>
        )}
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
          <Table className="min-w-[700px] table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold sticky left-0 bg-background z-10 w-[120px] text-xs sm:text-sm text-center px-4 py-3">
                  Session
                </TableHead>
                {DAYS.map((day, i) => (
                  <TableHead key={day} className="font-bold text-center min-w-[90px] text-xs sm:text-sm">
                    <div className="flex flex-col">
                      <span>{day}</span>
                      <span className="text-[10px] font-normal text-muted-foreground">{dayDates[i]}</span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {STANDARD_TIME_SLOTS.map((slot) => (
                <TableRow key={slot.id} className={cn(getShiftColor(slot.shift), "border-b-2 border-b-border/50")}>
                  <TableCell className={cn("font-medium whitespace-nowrap sticky left-0 z-10 px-4 py-3", getShiftColor(slot.shift))}>
                    <div className="flex flex-col gap-0.5 items-center text-center">
                      <span className="font-semibold text-sm sm:text-base">{slot.label}</span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">{slot.display}</span>
                    </div>
                  </TableCell>
                  {DAYS.map((day) => {
                    const sessions = daysData[day]?.[slot.time] || [];
                    return (
                      <TableCell
                        key={day}
                        className="text-center align-top p-1.5 sm:p-2 cursor-pointer hover:bg-muted/50 transition-colors min-h-[80px] break-words whitespace-normal"
                        onClick={() => onCellClick(className, day, slot.time, sessions[0] || null, weekStart)}
                      >
                        {sessions.length > 0 ? (
                          <div className="space-y-1.5">
                            {sessions.map((session, idx) => {
                              const tooltip = getTooltipData(session);
                              return (
                                <HoverCard key={idx} openDelay={200} closeDelay={0}>
                                  <HoverCardTrigger asChild>
                                    <div onClick={(e) => e.stopPropagation()}>
                                      <TimetableSessionCard
                                        subject={session.subject}
                                        teacher={session.teacher}
                                        room={session.room}
                                        startTime={session.startTime}
                                        endTime={session.endTime}
                                        lessonType={session.lessonType}
                                      />
                                    </div>
                                  </HoverCardTrigger>
                                  <HoverCardContent
                                    className="w-72 bg-popover/95 backdrop-blur-sm border-border shadow-lg"
                                    side="top"
                                    align="center"
                                  >
                                    <div className="space-y-2.5">
                                      <div className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 text-primary" />
                                        <div>
                                          <p className="text-sm font-semibold">{tooltip.subject?.name || session.subject}</p>
                                          <p className="text-xs text-muted-foreground">{tooltip.subject?.code}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-primary" />
                                        <span className="text-sm">
                                          {tooltip.teacher ? formatTeacherName(tooltip.teacher.fullName, tooltip.teacher.academicDegree) : session.teacher}
                                        </span>
                                      </div>
                                      {tooltip.teacher?.phone && (
                                        <div className="flex items-center gap-2">
                                          <Phone className="h-4 w-4 text-primary" />
                                          <a href={`tel:${tooltip.teacher.phone}`} className="text-sm text-primary hover:underline">
                                            {tooltip.teacher.phone}
                                          </a>
                                        </div>
                                      )}
                                      <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-primary" />
                                        <span className="text-sm">{tooltip.classroom?.name || session.room} ({session.room})</span>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-primary" />
                                        <span className="text-sm">{session.startTime} - {session.endTime} ({slot.label})</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-primary" />
                                        <span className="text-sm">
                                          {session.lessonType === "practice"
                                            ? "Practical Class (Thực hành)"
                                            : "Theory Class (Lý thuyết)"}
                                        </span>
                                      </div>
                                    </div>
                                  </HoverCardContent>
                                </HoverCard>
                              );
                            })}
                          </div>
                        ) : (
                          <HoverCard openDelay={200} closeDelay={0}>
                            <HoverCardTrigger asChild>
                              <div className="flex items-center justify-center h-16 sm:h-20 text-muted-foreground hover:text-primary transition-colors">
                                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-48 text-center" side="top">
                              <p className="text-sm text-muted-foreground">No class scheduled</p>
                              <p className="text-xs text-muted-foreground mt-1">Click to add</p>
                            </HoverCardContent>
                          </HoverCard>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3 text-[10px] sm:text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-50 dark:bg-amber-950/30 border border-border" />
          <span>Morning (7:00-11:30)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-sky-50 dark:bg-sky-950/30 border border-border" />
          <span>Afternoon (1:00-5:00)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-violet-50 dark:bg-violet-950/30 border border-border" />
          <span>Evening (6:00-9:00)</span>
        </div>
      </div>
    </Card>
  );
};

export default TimetableGrid;