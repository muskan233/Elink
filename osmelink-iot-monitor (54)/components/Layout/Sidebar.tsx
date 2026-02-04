
import React, { useState, useContext } from 'react';
// @ts-ignore
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Activity, Database, Bell, Map, 
  Settings, UserCircle, Users, Truck, ChevronDown, ChevronRight,
  Briefcase
} from 'lucide-react';
import { AuthContext } from '../../App';

interface SidebarProps {
  isCollapsed: boolean;
}

interface NavItemProps {
  icon: any;
  label: string;
  path?: string;
  active?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  isCollapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, path, active, onClick, children, isCollapsed }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = !!children;

  return (
    <div className="mb-1">
      <button
        onClick={() => {
          if (hasChildren) setIsOpen(!isOpen);
          else onClick?.();
        }}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group ${
          active && !hasChildren
            ? 'bg-indigo-50 text-indigo-700 font-bold'
            : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon size={20} className={`${active && !hasChildren ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} />
          {!isCollapsed && <span className={`text-sm tracking-tight ${active && !hasChildren ? 'font-bold' : 'font-medium'}`}>{label}</span>}
        </div>
        {!isCollapsed && hasChildren && (
          <div className="text-slate-400">
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        )}
      </button>
      {!isCollapsed && hasChildren && isOpen && (
        <div className="ml-9 mt-1 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  return (
    <aside className={`bg-white border-r border-slate-200 flex flex-col sidebar-transition ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Sidebar Header / Logo Area */}
      <div className={`h-16 flex items-center border-b border-slate-100 ${isCollapsed ? 'justify-center' : 'px-6'}`}>
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 flex-shrink-0">
            <span className="font-bold text-lg">O</span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col -gap-1 overflow-hidden">
              <h1 className="text-slate-800 font-bold text-xl tracking-tighter leading-none">
                Osme<span className="text-indigo-600">Link</span>
              </h1>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 leading-none mt-1 whitespace-nowrap">
                IoT Intelligence
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
        <div className="space-y-6">
          {/* Monitoring Section */}
          <div>
            {!isCollapsed && <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Monitoring</p>}
            <NavItem 
              icon={LayoutDashboard} 
              label="Dashboard" 
              active={location.pathname === '/dashboard'}
              onClick={() => navigate('/dashboard')}
              isCollapsed={isCollapsed}
            />
            <NavItem 
              icon={Activity} 
              label="Analytics" 
              active={location.pathname === '/trends'}
              onClick={() => navigate('/trends')}
              isCollapsed={isCollapsed}
            />
            <NavItem 
              icon={Database} 
              label="Raw Data" 
              active={location.pathname === '/raw-data'}
              onClick={() => navigate('/raw-data')}
              isCollapsed={isCollapsed}
            />
            <NavItem 
              icon={Bell} 
              label="Alerts" 
              active={location.pathname === '/alerts'}
              isCollapsed={isCollapsed}
            />
            <NavItem 
              icon={Map} 
              label="Live Tracking" 
              active={location.pathname === '/live-tracking'}
              onClick={() => navigate('/live-tracking')}
              isCollapsed={isCollapsed}
            />
          </div>

          {/* Core Configuration Section - Flattened without dropdown */}
          <div>
            {!isCollapsed && <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Core Configuration</p>}
            <NavItem 
              icon={UserCircle} 
              label="User" 
              active={location.pathname === '/management/users'}
              onClick={() => navigate('/management/users')}
              isCollapsed={isCollapsed}
            />
            <NavItem 
              icon={Briefcase} 
              label="Dealer / Fleet / OEM" 
              active={location.pathname === '/management/dealers'}
              onClick={() => navigate('/management/dealers')}
              isCollapsed={isCollapsed}
            />
            <NavItem 
              icon={Truck} 
              label="Vehicle Onboarding" 
              active={location.pathname === '/management/onboarding'}
              onClick={() => navigate('/management/onboarding')}
              isCollapsed={isCollapsed}
            />
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100">
        <div className={`flex items-center gap-3 p-2 bg-slate-50 rounded-2xl ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            {user?.username?.charAt(0).toUpperCase() || 'A'}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-slate-800 truncate">{user?.username || 'Fleet Admin'}</span>
              <span className="text-[10px] text-slate-500 font-medium">{user?.role || 'Administrator'}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
