interface StatsCardProps {
  label: string;
  value: string | number;
  trend?: string;
  variant?: "default" | "success" | "warning" | "conflict";
}

const StatsCard = ({ label, value, trend, variant = "default" }: StatsCardProps) => {
  const variantStyles = {
    default: "border-border",
    success: "border-success/30 bg-success/5",
    warning: "border-warning/30 bg-warning/5",
    conflict: "border-conflict/30 bg-conflict/5",
  };

  return (
    <div className={`rounded-lg border ${variantStyles[variant]} bg-card p-4`}>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {trend && <span className="text-xs text-muted-foreground">{trend}</span>}
      </div>
    </div>
  );
};

export default StatsCard;
