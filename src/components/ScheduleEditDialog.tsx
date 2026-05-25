import { useState, useEffect, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useSubjects } from "@/contexts/SubjectContext";
import { useTeachers } from "@/contexts/TeacherContext";
import { useClassrooms } from "@/contexts/ClassroomContext";
import { useClasses } from "@/contexts/ClassContext";
import { formatTeacherName } from "@/lib/mockData";
import { ScheduleMode, ExamType, LessonType } from "@/types";
import { AlertCircle, Phone, MapPin, Building2, AlertTriangle, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScheduleEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classCode: string;
  day: string;
  timeSlot: string;
  existingSession?: { 
    id: string; 
    subject: string; 
    teacher: string; 
    room: string;
    lessonType?: LessonType;
  } | null;
  onSave: (data: { 
    subjectId: string; 
    teacherId: string; 
    classroomId: string; 
    classId: string;
    startTime: string; 
    endTime: string;
    lessonType: LessonType;
    mode: ScheduleMode;
    examType?: ExamType;
    examStartTime?: string;
    examDuration?: number;
    note?: string;
  }) => void;
  onDelete?: () => void;
}

const ScheduleEditDialog = ({
  open, onOpenChange, classCode, day, timeSlot, existingSession, onSave, onDelete,
}: ScheduleEditDialogProps) => {
  const { allSubjects: subjects, fetchAllSubjects } = useSubjects();
  const { allTeachers: teachers, fetchAllTeachers } = useTeachers();
  const { allClassrooms: classrooms, fetchAllClassrooms } = useClassrooms();
  const { allClasses: classes, fetchAllClasses } = useClasses();

  const [mode, setMode] = useState<ScheduleMode>("regular");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [classId, setClassId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [lessonType, setLessonType] = useState<LessonType>("theory");

  // Exam fields
  const [examType, setExamType] = useState<ExamType>("theory");
  const [examStartTime, setExamStartTime] = useState("");
  const [examDuration, setExamDuration] = useState("60");
  const [includeExam, setIncludeExam] = useState(false);
  const [note, setNote] = useState("");

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-display fields
  const selectedTeacher = useMemo(() => teachers.find(t => String(t.id) === String(teacherId)), [teachers, teacherId]);
  const selectedClassroom = useMemo(() => classrooms.find(c => String(c.id) === String(classroomId)), [classrooms, classroomId]);
  const selectedClass = useMemo(() => classes.find(c => String(c.id) === String(classId)), [classes, classId]);

  // Removed automatic fetchAll calls on open to optimize performance.
  // Context providers handle initial fetch on app mount.
  // Users can use the manual refresh button if they need fresh data.
  useEffect(() => {
    // No-op for automatic fetching. 
    // Data is assumed to be available from Context Providers.
  }, [open]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchAllSubjects(),
        fetchAllTeachers(),
        fetchAllClassrooms(),
        fetchAllClasses()
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (timeSlot) {
      const [start, end] = timeSlot.split("-");
      setStartTime(start || "");
      setEndTime(end || "");
    }
  }, [timeSlot]);

  useEffect(() => {
    if (existingSession) {
      const subject = subjects.find(s => s.code === existingSession.subject);
      const teacher = teachers.find(t => t.shortName === existingSession.teacher);
      const classroom = classrooms.find(c => c.code === existingSession.room);
      const classObj = classes.find(c => c.code === classCode);
      
      setSubjectId(subject ? String(subject.id) : "");
      setTeacherId(teacher ? String(teacher.id) : "");
      setClassroomId(classroom ? String(classroom.id) : "");
      setClassId(classObj ? String(classObj.id) : "");
      setLessonType(existingSession.lessonType || "theory");
    } else {
      const classObj = classes.find(c => c.code === classCode);
      setSubjectId(""); 
      setTeacherId(""); 
      setClassroomId("");
      setClassId(classObj ? String(classObj.id) : "");
      setLessonType("theory");
    }
  }, [existingSession, open, subjects, teachers, classrooms, classes, classCode]);

  const timeValidation = useMemo(() => {
    if (!startTime || !endTime) return { isValid: false, message: "" };
    const [sH, sM] = startTime.split(":").map(Number);
    const [eH, eM] = endTime.split(":").map(Number);
    if (eH * 60 + eM <= sH * 60 + sM) return { isValid: false, message: "End time must be later than start time" };
    return { isValid: true, message: "" };
  }, [startTime, endTime]);

  const handleSave = () => {
    if (subjectId && teacherId && classroomId && classId && timeValidation.isValid) {
      onSave({ 
        subjectId, 
        teacherId, 
        classroomId, 
        classId,
        startTime, 
        endTime,
        lessonType,
        mode,
        examType,
        examStartTime: mode !== "regular" ? examStartTime : undefined,
        examDuration: mode !== "regular" ? parseInt(examDuration) : undefined,
        note: mode === "combined" ? note : undefined
      });
      onOpenChange(false);
    }
  };

  const handleDelete = () => {
    if (onDelete) { onDelete(); onOpenChange(false); }
  };

  const isEditing = !!existingSession;
  const canSave = subjectId && teacherId && classroomId && classId && startTime && endTime && timeValidation.isValid;

  // Auto-display: Teacher phone
  const TeacherPhoneDisplay = () => {
    if (!selectedTeacher) return null;
    return (
      <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border border-border">
        <Phone className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Phone:</span>
        {selectedTeacher.phone ? (
          <a href={`tel:${selectedTeacher.phone}`} className="text-sm font-medium text-primary hover:underline">
            {selectedTeacher.phone}
          </a>
        ) : (
          <span className="text-sm text-muted-foreground italic">No phone number available</span>
        )}
      </div>
    );
  };

  // Auto-display: Classroom additional info
  const ClassroomInfoDisplay = () => {
    if (!selectedClassroom) return null;
    return (
      <div className="flex flex-col gap-1.5 p-2 rounded-md border bg-muted/50 border-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Type:</span>
            <span className="text-sm font-medium capitalize">{selectedClassroom.type.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">Capacity:</span>
            <span className="text-sm font-medium">{selectedClassroom.capacity}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{isEditing ? "Edit Schedule" : "Add Schedule"}</DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleManualRefresh} 
            disabled={isRefreshing}
            className="h-8 w-8 text-muted-foreground"
          >
            <RefreshCcw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
        </DialogHeader>

        {/* Mode Tabs */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as ScheduleMode)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="regular">Regular Class</TabsTrigger>
            <TabsTrigger value="exam">Exam Only</TabsTrigger>
            <TabsTrigger value="combined">Class + Exam</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4 py-2">
          {/* Class & Day info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Class <span className="text-destructive">*</span></Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={String(c.id)} value={String(c.id)}>{c.code} - {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Day</Label>
              <Input value={day} disabled className="bg-muted" />
            </div>
          </div>

          {/* Time & Lesson Type */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Start Time <span className="text-destructive">*</span></Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Time <span className="text-destructive">*</span></Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Type <span className="text-destructive">*</span></Label>
              <Select value={lessonType} onValueChange={(v) => setLessonType(v as LessonType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="theory">Theory</SelectItem>
                  <SelectItem value="practice">Practice</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {!timeValidation.isValid && timeValidation.message && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" /> <span>{timeValidation.message}</span>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label>Subject <span className="text-destructive">*</span></Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
              <SelectContent>
                {subjects.map(s => (
                  <SelectItem key={String(s.id)} value={String(s.id)}>{s.code} - {s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Teacher + auto phone */}
          <div className="space-y-2">
            <Label>Teacher <span className="text-destructive">*</span></Label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
              <SelectContent>
                {teachers.filter(t => t.role === "teacher").map(t => (
                  <SelectItem key={String(t.id)} value={String(t.id)}>
                    {formatTeacherName(t.fullName, t.academicDegree)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <TeacherPhoneDisplay />
          </div>

          {/* Classroom + auto info */}
          <div className="space-y-2">
            <Label>Room <span className="text-destructive">*</span></Label>
            <Select value={classroomId} onValueChange={setClassroomId}>
              <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
              <SelectContent>
                {classrooms.map(c => (
                  <SelectItem key={String(c.id)} value={String(c.id)}>
                    {c.code} - {c.name} ({c.capacity} seats)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ClassroomInfoDisplay />
          </div>

          {/* Exam fields - for exam and combined modes */}
          {mode === "exam" && (
            <div className="space-y-3 p-3 rounded-lg border-2 border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/20">
              <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-300">Exam Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Exam Start Time</Label>
                  <Input type="time" value={examStartTime} onChange={(e) => setExamStartTime(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input type="number" min="15" value={examDuration} onChange={(e) => setExamDuration(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Exam Type</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="examType" checked={examType === "theory"} onChange={() => setExamType("theory")} className="accent-primary" />
                    Theory Exam (Lý thuyết)
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="examType" checked={examType === "practice"} onChange={() => setExamType("practice")} className="accent-primary" />
                    Practical Exam (Thực hành)
                  </label>
                </div>
              </div>
            </div>
          )}

          {mode === "combined" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox checked={includeExam} onCheckedChange={(c) => setIncludeExam(!!c)} id="includeExam" />
                <Label htmlFor="includeExam" className="cursor-pointer">Include Exam in this slot</Label>
              </div>
              {includeExam && (
                <div className="space-y-3 p-3 rounded-lg border-2 border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/20">
                  <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-300">Exam Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Exam Start Time</Label>
                      <Input type="time" value={examStartTime} onChange={(e) => setExamStartTime(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration (minutes)</Label>
                      <Input type="number" min="15" value={examDuration} onChange={(e) => setExamDuration(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Exam Type</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="radio" name="examTypeCombined" checked={examType === "theory"} onChange={() => setExamType("theory")} className="accent-primary" />
                        Theory Exam
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="radio" name="examTypeCombined" checked={examType === "practice"} onChange={() => setExamType("practice")} className="accent-primary" />
                        Practical Exam
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Note</Label>
                    <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g., First 45 mins: lecture, Last 60 mins: exam" rows={2} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {isEditing && onDelete && (
            <Button variant="destructive" onClick={handleDelete} className="mr-auto">Delete</Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {isEditing ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleEditDialog;
