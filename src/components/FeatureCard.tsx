import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick?: () => void;
}

const FeatureCard = ({ icon: Icon, title, description, onClick }: FeatureCardProps) => {
  return (
    <Card className="group overflow-hidden border border-border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/30">
      <div className="flex flex-col gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
        <Button
          variant="ghost"
          className="mt-2 w-fit px-0 text-primary hover:text-primary hover:bg-transparent group-hover:gap-2"
          onClick={onClick}
        >
          Open Module
          <ArrowRight className="ml-1 h-4 w-4 transition-all group-hover:translate-x-1" />
        </Button>
      </div>
    </Card>
  );
};

export default FeatureCard;
