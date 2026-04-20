import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--gov-bg)]">
      <Sidebar />

      {/*
        lg:pl-64 — pushes content right by exactly the sidebar width on desktop.
        The sidebar is fixed so it's out of document flow; this padding compensates.
        On mobile the sidebar is an overlay so no padding needed.
      */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
