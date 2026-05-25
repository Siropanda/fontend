import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RoleProvider } from "@/contexts/RoleContext";
import { ClassroomProvider } from "@/contexts/ClassroomContext";
import { ClassProvider } from "@/contexts/ClassContext";
import { SubjectProvider } from "@/contexts/SubjectContext";
import { TeacherProvider } from "@/contexts/TeacherContext";
import { ScheduleProvider } from "@/contexts/ScheduleContext";
import Index from "./pages/Index";
import Teachers from "./pages/Teachers";
import Subjects from "./pages/Subjects";
import Classrooms from "./pages/Classrooms";
import Classes from "./pages/Classes";
import Timetable from "./pages/Timetable";
import Export from "./pages/Export";
import NotFound from "./pages/NotFound";
import { ToastProvider } from '@/contexts/ToastContext';
const queryClient = new QueryClient();

import { Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Login from "@/pages/Login";
import Logout from "@/pages/Logout";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <RoleProvider>
            <ToastProvider>
              <TeacherProvider>
                <SubjectProvider>
                  <ClassProvider>
                    <ClassroomProvider>
                      <ScheduleProvider>
                        <Toaster />
                        <Sonner />
                        <Routes>
                          <Route path="/login" element={<Login />} />
                          <Route path="/logout" element={<Logout />} />
                          <Route
                            path="/"
                            element={
                              <ProtectedRoute>
                                <Index />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/teachers"
                            element={
                              <ProtectedRoute>
                                <Teachers />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/subjects"
                            element={
                              <ProtectedRoute>
                                <Subjects />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/classrooms"
                            element={
                              <ProtectedRoute>
                                <Classrooms />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/classes"
                            element={
                              <ProtectedRoute>
                                <Classes />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/timetable"
                            element={
                              <ProtectedRoute>
                                <Timetable />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/export"
                            element={
                              <ProtectedRoute>
                                <Export />
                              </ProtectedRoute>
                            }
                          />
                          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </ScheduleProvider>
                    </ClassroomProvider>
                  </ClassProvider>
                </SubjectProvider>
              </TeacherProvider>
            </ToastProvider>
          </RoleProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
