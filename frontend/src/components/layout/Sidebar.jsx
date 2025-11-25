import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Globe, ShieldAlert, Bell, Users, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../utils/constants';

export function Sidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/websites', label: 'Websites', icon: Globe },
    { to: '/findings', label: 'Findings', icon: ShieldAlert },
    { to: '/notifications', label: 'Notifications', icon: Bell },
  ];

  if (isAdmin) {
    links.push({ to: '/admin/users', label: 'User Management', icon: Users });
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center justify-center border-b border-slate-200 px-6">
        <span className="text-xl font-bold text-blue-600">SaaS Scanner</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <link.icon className="h-5 w-5" />
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600">
          <Settings className="h-5 w-5" />
          <span>v1.0.0</span>
        </div>
      </div>
    </div>
  );
}