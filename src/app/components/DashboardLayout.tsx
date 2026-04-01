import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useSidebar } from '../context/SidebarContext';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-[var(--gov-bg)] flex">
      {/* Fixed sidebar */}
      <Sidebar />

      {/* Spacer that mirrors the fixed sidebar width — keeps content from going under it */}
      <div
        className={`flex-shrink-0 transition-all duration-300 ${
          isOpen ? 'w-64' : 'w-20'
        }`}
      />

      {/* Main content — min-w-0 prevents flex child from exceeding remaining space */}
      <div className="flex-1 min-w-0">
        <TopBar />
        <main className="p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}