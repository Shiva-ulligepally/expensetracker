import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Upload, BarChart3 } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Upload Bill', path: '/upload', icon: Upload },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  ];

  return (
    <nav className="glass-panel mx-4 mt-4 px-6 py-4 flex items-center justify-between sticky top-4 z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-tr from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
          <span className="text-white font-bold text-xl">ET</span>
        </div>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Expense Tracker
        </h1>
      </div>
      
      <div className="hidden md:flex gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                isActive 
                  ? 'bg-white/10 text-white shadow-inner' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-primary-400' : ''} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
      
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-dark-700 border border-dark-600 overflow-hidden">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full object-cover" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
