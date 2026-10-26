// src/components/Layout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useState } from 'react';
import { Menu } from 'lucide-react';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile hamburger */}
      <button
        className="p-2 md:hidden absolute top-4 left-4 z-20 text-primary"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle navigation"
      >
        <Menu size={24} />
      </button>
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-10 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <Sidebar onLinkClick={() => setSidebarOpen(false)} />
      </div>
      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6 md:ml-64 lg:ml-64">
        <Outlet />
      </main>
    </div>
  );
}
