import { cn } from "@/lib/utils";

interface TimetableSessionCardProps {
  subject: string;
  teacher: string;
  room: string;
  startTime: string;
  endTime: string;
  lessonType?: "theory" | "practice";
  className?: string;
}

const TimetableSessionCard = ({
  subject,
  teacher,
  room,
  startTime,
  endTime,
  lessonType,
  className,
}: TimetableSessionCardProps) => {
  const lessonBadge = lessonType
    ? lessonType === "theory"
      ? { label: "T", title: "Theory (Lý thuyết)", cls: "bg-primary text-primary-foreground" }
      : { label: "P", title: "Practical (Thực hành)", cls: "bg-accent text-accent-foreground" }
    : null;

  return (
    <div
      className={cn(
        "relative rounded p-1.5 sm:p-2 text-xs border bg-primary/10 border-primary/20 hover:bg-primary/20 transition-colors text-center break-words whitespace-normal",
        className
      )}
    >
      {lessonBadge && (
        <span
          title={lessonBadge.title}
          className={cn(
            "absolute top-0.5 right-0.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded text-[9px] font-bold leading-none",
            lessonBadge.cls
          )}
        >
          {lessonBadge.label}
        </span>
      )}
      <div className="font-semibold text-foreground text-[10px] sm:text-xs line-clamp-2" title={subject}>
        {subject}
      </div>
      <div className="text-[9px] sm:text-[10px] text-primary font-medium mt-0.5">
        {startTime} - {endTime}
      </div>
      <div className="text-[9px] sm:text-[10px] text-muted-foreground line-clamp-2" title={teacher}>
        {teacher}
      </div>
      <div className="text-[9px] sm:text-[10px] text-muted-foreground truncate" title={room}>
        {room}
      </div>
    </div>
  );
};

export default TimetableSessionCard;
