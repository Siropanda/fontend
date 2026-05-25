// src/components/ClassProgressPopup.tsx

import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getClassProgress, SubjectProgress } from "@/services/progressService";
import { BookOpen, FlaskConical, AlertCircle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  classCode: string;
  refreshKey?: number; 
}

// Progress bar với màu động theo %
const ProgressBar = ({ value, color }: { value: number; color: string }) => (
  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
    <div
      className={`h-2 rounded-full transition-all duration-500 ${color}`}
      style={{ width: `${Math.min(value, 100)}%` }}
    />
  </div>
);

const getProgressColor = (pct: number) => {
  if (pct >= 100) return "bg-green-500";
  if (pct >= 60)  return "bg-blue-500";
  if (pct >= 30)  return "bg-yellow-500";
  return "bg-red-400";
};

const getProgressBadge = (pct: number) => {
  if (pct >= 100) return { label: "Hoàn thành", variant: "default" as const, cls: "bg-green-100 text-green-700" };
  if (pct >= 60)  return { label: "Đang học", variant: "secondary" as const, cls: "bg-blue-100 text-blue-700" };
  if (pct > 0)    return { label: "Mới bắt đầu", variant: "outline" as const, cls: "bg-yellow-100 text-yellow-700" };
  return { label: "Chưa bắt đầu", variant: "outline" as const, cls: "bg-gray-100 text-gray-500" };
};

const SubjectProgressCard = ({ item }: { item: SubjectProgress }) => {
  const badge = getProgressBadge(item.overallProgress);

  return (
    <div className="border rounded-lg p-4 space-y-3 hover:bg-muted/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-semibold text-sm text-foreground">{item.subjectCode}</span>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.subjectName}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {/* Overall progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Tổng tiến độ</span>
          <span className="font-medium text-foreground">{item.overallProgress}%</span>
        </div>
        <ProgressBar value={item.overallProgress} color={getProgressColor(item.overallProgress)} />
      </div>

      {/* LT + TH breakdown */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* Lý thuyết */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BookOpen className="h-3 w-3" />
            <span>Lý thuyết</span>
          </div>
          <ProgressBar value={item.ltProgress} color={getProgressColor(item.ltProgress)} />
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {item.ltCompleted}/{item.ltRequired} tiết
            </span>
            <span className="font-medium">{item.ltProgress}%</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Đã lên lịch: <span className="text-foreground font-medium">{item.ltScheduled}</span>
          </div>
        </div>

        {/* Thực hành */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <FlaskConical className="h-3 w-3" />
            <span>Thực hành</span>
          </div>
          <ProgressBar value={item.thProgress} color={getProgressColor(item.thProgress)} />
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {item.thCompleted}/{item.thRequired} tiết
            </span>
            <span className="font-medium">{item.thProgress}%</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Đã lên lịch: <span className="text-foreground font-medium">{item.thScheduled}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ClassProgressPopup = ({ open, onOpenChange, classId, classCode, refreshKey }: Props) => {
  const [data, setData] = useState<SubjectProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !classId) return;
    setLoading(true);
    setError(null);
    getClassProgress(classId)
      .then(setData)
      .catch(() => setError('Không thể tải dữ liệu tiến độ'))
      .finally(() => setLoading(false));
  }, [open, classId, refreshKey]);

  // Tổng quan toàn lớp
  const summary = data.length > 0 ? {
    total: data.length,
    completed: data.filter(d => d.overallProgress >= 100).length,
    avgProgress: Math.round(data.reduce((s, d) => s + d.overallProgress, 0) / data.length),
  } : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Tiến độ học tập
            <Badge variant="outline" className="font-mono">{classCode}</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Summary bar */}
        {summary && !loading && (
          <div className="grid grid-cols-3 gap-3 pb-2 border-b">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{summary.total}</div>
              <div className="text-xs text-muted-foreground">Môn học</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.completed}</div>
              <div className="text-xs text-muted-foreground">Hoàn thành</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.avgProgress}%</div>
              <div className="text-xs text-muted-foreground">Trung bình</div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading && (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-lg" />
            ))
          )}

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm p-4">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {!loading && !error && data.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">
              Lớp này chưa có môn học nào trong chương trình.
            </p>
          )}

          {!loading && data.map(item => (
            <SubjectProgressCard key={item.subjectId} item={item} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};