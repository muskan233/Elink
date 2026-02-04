
import React, { useContext } from 'react';
// @ts-ignore
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, LogOut, User } from 'lucide-react';
import { AuthContext } from '../../App';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useContext(AuthContext);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-[100] sticky top-0 shadow-sm font-sans">
      <div className="flex items-center gap-4">
        {onToggleSidebar && (
          <button 
            onClick={onToggleSidebar}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            aria-label="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 pl-6 border-l border-slate-100 group">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">{user?.username || 'admin'}</span>
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">{user?.role || 'ADMIN'}</span>
          </div>
          
          <div className="relative">
            <button className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 group-hover:border-indigo-200 transition-all overflow-hidden shadow-sm">
              <User size={20} className="text-slate-400 group-hover:text-indigo-600" />
            </button>
          </div>

          <button 
            onClick={logout}
            title="Sign Out"
            className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
