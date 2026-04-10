import { Bell, Search, Calendar, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';

export function TopBar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 w-full">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search appointments, services..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--gov-primary)] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {user?.role === 'client' && (
          <Button
            onClick={() => navigate('/book-appointment')}
            className="bg-[var(--gov-primary)] hover:bg-[var(--gov-primary)]/90"
          >
            <Calendar size={18} className="mr-2" />
            <span className="hidden md:inline">Book New Appointment</span>
          </Button>
        )}
        
        <Link 
          to="/notifications" 
          className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </Link>

        <Link 
          to="/profile" 
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <User size={20} className="text-gray-600" />
        </Link>
      </div>
    </div>
  );
}