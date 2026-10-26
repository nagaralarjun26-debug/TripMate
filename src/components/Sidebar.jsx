// src/components/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  MapPin,
  Calendar,
  CreditCard,
  Users,
  Compass,
  Settings,
  LogOut,
} from 'lucide-react';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/trips', label: 'My Trips', icon: MapPin },
  { to: '/trips/create', label: 'Create Trip', icon: Calendar },
  { to: '/destinations', label: 'Explore Destinations', icon: Compass },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ onLinkClick }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  // Handle logout: clear auth state/token and redirect to login page
  const handleLogout = () => {
    signOut();
    if (onLinkClick) {
      onLinkClick();
    }
    navigate('/login');
  };

  return (
    <nav className="h-full flex flex-col p-4 space-y-4">
      <h2 className="text-xl font-bold text-primary mb-4">TripMate</h2>
      <ul className="flex-1 space-y-2">
        {links.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex items-center p-2 rounded-md hover:bg-primary/10 transition-colors ${isActive ? 'bg-primary/20 text-primary' : 'text-gray-700'}`
              }
              onClick={onLinkClick}
            >
              <Icon className="mr-2" size={20} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="border-t pt-2">
        <button
          onClick={handleLogout}
          className="flex items-center w-full p-2 text-gray-700 hover:bg-primary/10 rounded-md transition-colors"
        >
          <LogOut className="mr-2" size={20} />
          Logout
        </button>
      </div>
    </nav>
  );
}
