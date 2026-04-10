import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '../context/SidebarContext';

export function RootLayout() {
  return (
    <SidebarProvider>
      <Outlet />
    </SidebarProvider>
  );
}
