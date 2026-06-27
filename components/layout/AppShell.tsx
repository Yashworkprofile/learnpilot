"use client";

import { useEffect, type ReactNode } from "react";
import { SidebarProvider } from "@/hooks/useSidebar";
import { CourseProvider } from "@/hooks/useCourse";
import { AuthProvider } from "@/hooks/useAuth";
import { AppModeProvider, useAppMode } from "@/context/AppModeContext";
import { DemoProgressProvider } from "@/context/DemoProgressContext";
import { setApiMode } from "@/lib/api";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

function ApiModeSync() {
  const { mode } = useAppMode();
  setApiMode(mode);
  useEffect(() => { setApiMode(mode); }, [mode]);
  return null;
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <CourseProvider>
        <ApiModeSync />
        {/* Mobile: full-screen column. Desktop: side-by-side with sidebar. */}
        <div className="relative z-10 flex h-screen lg:p-3 lg:gap-3 overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 gap-3 p-3 lg:p-0">
            <Header />
            <main className="flex-1 overflow-y-auto rounded-2xl">
              <div className="p-1 max-w-[1400px] mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
      </CourseProvider>
    </SidebarProvider>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AppModeProvider>
        <DemoProgressProvider>
          <Shell>{children}</Shell>
        </DemoProgressProvider>
      </AppModeProvider>
    </AuthProvider>
  );
}