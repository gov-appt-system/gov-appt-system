import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarPlus, 
  Clock, 
  Calendar, 
  Bell, 
  User, 
  Settings, 
  Users, 
  FileText, 
  LogOut,
  Briefcase,
  Menu
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
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['client', 'staff', 'manager', 'admin'] },
  { icon: CalendarPlus, label: 'Book Appointment', path: '/book', roles: ['client'] },
  { icon: Clock, label: 'My Appointments', path: '/appointments', roles: ['client'] },
  { icon: Calendar, label: 'Calendar', path: '/calendar', roles: ['client', 'staff', 'manager', 'admin'] },
  { icon: FileText, label: 'Process Requests', path: '/process', roles: ['staff', 'manager', 'admin'] },
  { icon: Briefcase, label: 'Service Management', path: '/services', roles: ['manager', 'admin'] },
  { icon: Users, label: 'Staff Management', path: '/staff', roles: ['admin'] },
  { icon: Bell, label: 'Notifications', path: '/notifications', roles: ['client', 'staff', 'manager', 'admin'] },
  { icon: User, label: 'Profile', path: '/profile', roles: ['client', 'staff', 'manager', 'admin'] },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isOpen, closeSidebar, toggleSidebar } = useSidebar();

  useEffect(() => {
    // Redirect to appropriate dashboard based on user role
    if (user && location.pathname === '/dashboard') {
      if (user.role === 'staff' || user.role === 'manager' || user.role === 'admin') {
        navigate('/staff-dashboard', { replace: true });
      }
    }
    // Also redirect staff/manager/admin if they land on /staff-dashboard but should see client view
    if (user && location.pathname === '/staff-dashboard' && user.role === 'client') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  const filteredMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/dashboard';
    if (user.role === 'client') return '/dashboard';
    return '/staff-dashboard';
  };

  return (
    <>
      {/* Sidebar - Always visible */}
      <div
        className={`h-screen bg-[var(--gov-secondary)] text-white flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 overflow-hidden ${
          isOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Header with Hamburger - Button always on leftmost */}
        <div className="border-b border-white/10 flex items-center gap-3 p-4">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-white/10 rounded transition-colors flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>
          {isOpen && (
            <div className="overflow-hidden">
              <h1 className="text-xl text-white whitespace-nowrap">Government Portal</h1>
              <p className="text-sm text-white/70 mt-1 whitespace-nowrap">Appointment System</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const itemPath = item.path === '/dashboard' ? getDashboardPath() : item.path;
            const isActive = location.pathname === itemPath || 
              (item.path === '/dashboard' && (location.pathname === '/dashboard' || location.pathname === '/staff-dashboard'));
            
            return (
              <Link
                key={item.path}
                to={itemPath}
                className={`flex items-center gap-3 transition-colors relative group ${
                  isOpen ? 'px-6 py-3' : 'px-4 py-3 justify-center'
                } ${
                  isActive 
                    ? 'bg-[var(--gov-primary)] text-white' 
                    : 'text-white/90 hover:bg-white/10'
                }`}
                title={!isOpen ? item.label : undefined}
              >
                <Icon size={20} className="flex-shrink-0" />
                {isOpen && <span>{item.label}</span>}
                
                {/* Tooltip for collapsed state */}
                {!isOpen && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className={`border-t border-white/10 transition-all duration-300 ${
          isOpen ? 'p-4' : 'p-2'
        }`}>
          {isOpen ? (
            <>
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
            </>
          ) : (
            <>
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 rounded-full bg-[var(--gov-primary)] flex items-center justify-center">
                  <User size={20} />
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex justify-center w-full px-2 py-2 text-white/90 hover:bg-white/10 rounded-lg transition-colors group relative"
                title="Logout"
              >
                <LogOut size={20} />
                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                  Logout
                </div>
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}