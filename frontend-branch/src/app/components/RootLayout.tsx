import { Outlet } from 'react-router';
import { SidebarProvider } from '../context/SidebarContext';

export function RootLayout() {
  return (
    <SidebarProvider>
      <Outlet />
    </SidebarProvider>
  );
}
