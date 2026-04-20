import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarPlus, 
  Clock, 
  Calendar, 
  Bell, 
  User, 
  Users, 
  FileText, 
  LogOut,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { useEffect } from 'react';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  roles: string[];
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard',         path: '/dashboard',  roles: ['client', 'staff', 'manager', 'admin'] },
  { icon: CalendarPlus,   label: 'Book Appointment',   path: '/book',       roles: ['client'] },
  { icon: Clock,          label: 'My Appointments',    path: '/appointments', roles: ['client'] },
  { icon: Calendar,       label: 'Calendar',           path: '/calendar',   roles: ['client', 'staff', 'manager', 'admin'] },
  { icon: FileText,       label: 'Process Requests',   path: '/process',    roles: ['staff', 'manager', 'admin'] },
  { icon: Briefcase,      label: 'Service Management', path: '/services',   roles: ['manager', 'admin'] },
  { icon: Users,          label: 'Staff Management',   path: '/staff',      roles: ['admin'] },
  { icon: Bell,           label: 'Notifications',      path: '/notifications', roles: ['client', 'staff', 'manager', 'admin'] },
  { icon: User,           label: 'Profile',            path: '/profile',    roles: ['client', 'staff', 'manager', 'admin'] },
];

const SidebarContent = ({
  filteredMenuItems,
  getDashboardPath,
  location,
  closeSidebar,
  isMobile,
  user,
  handleLogout,
}: {
  filteredMenuItems: MenuItem[];
  getDashboardPath: () => string;
  location: ReturnType<typeof useLocation>;
  closeSidebar: () => void;
  isMobile: boolean;
  user: { name?: string; role?: string } | null;
  handleLogout: () => void;
}) => (
  <div className="h-full bg-[var(--gov-secondary)] text-white flex flex-col w-64">
    {/* Header */}
    <div className="border-b border-white/10 flex items-center gap-3 p-4 h-16 flex-shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-white whitespace-nowrap leading-tight">
          Government Portal
        </h1>
        <p className="text-xs text-white/70 whitespace-nowrap">Appointment System</p>
      </div>
    </div>

    {/* Navigation */}
    <nav className="flex-1 overflow-y-auto py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {filteredMenuItems.map((item) => {
        const Icon = item.icon;
        const itemPath = item.path === '/dashboard' ? getDashboardPath() : item.path;
        const isActive =
          location.pathname === itemPath ||
          (item.path === '/dashboard' &&
            (location.pathname === '/dashboard' || location.pathname === '/staff-dashboard'));

        return (
          <Link
            key={item.path}
            to={itemPath}
            onClick={isMobile ? closeSidebar : undefined}
            className={`flex items-center gap-3 px-6 py-3 transition-colors ${
              isActive
                ? 'bg-[var(--gov-primary)] text-white'
                : 'text-white/90 hover:bg-white/10'
            }`}
          >
            <Icon size={20} className="flex-shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>

    {/* User Profile & Logout */}
    <div className="border-t border-white/10 p-4 flex-shrink-0">
      <div className="flex items-center gap-3 px-2 py-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-[var(--gov-primary)] flex items-center justify-center flex-shrink-0">
          <User size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white truncate">{user?.name}</p>
          <p className="text-xs text-white/60 capitalize">{user?.role}</p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-2 py-2 text-white/90 hover:bg-white/10 rounded-lg w-full transition-colors"
      >
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </div>
  </div>
);

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isOpen, closeSidebar } = useSidebar();

  useEffect(() => {
    if (user && location.pathname === '/dashboard') {
      if (user.role === 'staff' || user.role === 'manager' || user.role === 'admin') {
        navigate('/staff-dashboard', { replace: true });
      }
    }
    if (user && location.pathname === '/staff-dashboard' && user.role === 'client') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  const filteredMenuItems = menuItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/dashboard';
    return user.role === 'client' ? '/dashboard' : '/staff-dashboard';
  };

  const sharedProps = { filteredMenuItems, getDashboardPath, location, closeSidebar, user, handleLogout };

  return (
    <>
      {/* ── DESKTOP: permanent sidebar, always visible ── */}
      <aside className="hidden lg:flex h-screen w-64 flex-shrink-0 sticky top-0">
        <SidebarContent {...sharedProps} isMobile={false} />
      </aside>

      {/* ── MOBILE: overlay drawer ── */}
      {/* Backdrop */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeSidebar}
        aria-hidden="true"
      />
      {/* Drawer */}
      <div
        className={`lg:hidden fixed left-0 top-0 h-full z-50 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent {...sharedProps} isMobile={true} />
      </div>
    </>
  );
}
