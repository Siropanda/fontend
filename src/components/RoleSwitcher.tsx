import { UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Shield, User } from "lucide-react";

interface RoleSwitcherProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const RoleSwitcher = ({ currentRole, onRoleChange }: RoleSwitcherProps) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Demo Mode:</span>
      <Button
        variant={currentRole === 'admin' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onRoleChange('admin')}
        className="gap-2"
      >
        <Shield className="h-4 w-4" />
        Admin
      </Button>
      <Button
        variant={currentRole === 'teacher' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onRoleChange('teacher')}
        className="gap-2"
      >
        <User className="h-4 w-4" />
        Teacher
      </Button>
    </div>
  );
};

export default RoleSwitcher;
