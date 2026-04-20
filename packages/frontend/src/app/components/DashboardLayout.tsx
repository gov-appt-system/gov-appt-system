import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--gov-bg)] flex">
      {/* Desktop: permanent sidebar sits in the flex row and pushes content */}
      {/* Mobile: sidebar renders as a fixed overlay, takes no space in flow */}
      <Sidebar />

      {/* Main content — takes remaining width on desktop, full width on mobile */}
      <div className="flex-1 min-w-0">
        <TopBar />
        <main className="p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
