import { ReactNode } from "react";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import RoleSwitcher from "@/components/RoleSwitcher";
import { useRole } from "@/contexts/RoleContext";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { userRole, setUserRole } = useRole();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation userRole={userRole} />
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-6 flex justify-end">
          <RoleSwitcher currentRole={userRole} onRoleChange={setUserRole} />
        </div>
        {children}
      </main>
    </div>
  );
};

export default Layout;
