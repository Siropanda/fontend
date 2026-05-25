import { Calendar, Users, BookOpen, DoorOpen, BarChart3, Download, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { UserRole } from "@/types";

interface NavigationProps {
  userRole: UserRole;
}

const Navigation = ({ userRole }: NavigationProps) => {
  const navItems = [
    { to: "/", label: "Dashboard", icon: BarChart3, roles: ['admin', 'teacher'] },
    { to: "/timetable", label: "Timetable", icon: Calendar, roles: ['admin', 'teacher'] },
    { to: "/teachers", label: "Teachers", icon: Users, roles: ['admin', 'teacher'] },
    { to: "/subjects", label: "Subjects", icon: BookOpen, roles: ['admin'] },
    { to: "/classes", label: "Classes", icon: Users, roles: ['admin'] },
    { to: "/classrooms", label: "Classrooms", icon: DoorOpen, roles: ['admin'] },
    { to: "/export", label: "Export", icon: Download, roles: ['admin'] },
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-6">
        <div className="flex items-center gap-6 py-3">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                activeClassName="text-primary border-b-2 border-primary"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}

          <div className="flex-1" />

          <NavLink
            to="/logout"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 rounded-md"
            activeClassName=""
          >
            <LogOut className="h-4 w-4" />
            Logout
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
