import React from "react";
import { TableHead } from "@/components/ui/table";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { SortDirection } from "@/hooks/useTableSort";
import { cn } from "@/lib/utils";

interface SortableTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortKey: string;
  currentSortKey: string;
  currentDirection: SortDirection;
  onSort: (key: string) => void;
  children: React.ReactNode;
}

const SortableTableHead = React.forwardRef<HTMLTableCellElement, SortableTableHeadProps>(
  ({ sortKey, currentSortKey, currentDirection, onSort, children, className, ...props }, ref) => {
    const isActive = currentSortKey === sortKey && currentDirection !== null;

    return (
      <TableHead
        ref={ref}
        className={cn("cursor-pointer select-none hover:bg-muted/50 transition-colors", className)}
        onClick={() => onSort(sortKey)}
        {...props}
      >
        <div className="flex items-center gap-1">
          <span>{children}</span>
          {isActive ? (
            currentDirection === "asc" ? (
              <ArrowUp className="h-3.5 w-3.5 text-primary shrink-0" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5 text-primary shrink-0" />
            )
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
          )}
        </div>
      </TableHead>
    );
  }
);

SortableTableHead.displayName = "SortableTableHead";

export default SortableTableHead;
