import React from 'react';
import { Power, PowerOff, Timer, Activity, WifiOff, ShieldAlert } from 'lucide-react';
import { FleetStats } from '../../types';

interface BottomBarProps {
  stats: FleetStats;
}

const BottomBar: React.FC<BottomBarProps> = ({ stats }) => {
  return (
    <div className="flex items-center gap-1 p-1 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50">
      <StatusPill 
        icon={<Activity size={16} />} 
        label="Total" 
        count={stats.totalCount} 
        active 
        color="text-indigo-400" 
      />
      <div className="w-px h-8 bg-white/5 mx-1"></div>
      <StatusPill 
        icon={<Power size={16} />} 
        label="Live" 
        count={stats.onlineCount} 
        color="text-emerald-400" 
      />
      <StatusPill 
        icon={<Timer size={16} />} 
        label="Idle" 
        count={stats.idleCount} 
        color="text-amber-400" 
      />
      <StatusPill 
        icon={<PowerOff size={16} />} 
        label="Off" 
        count={stats.offlineCount} 
        color="text-slate-500" 
      />
      <StatusPill 
        icon={<WifiOff size={16} />} 
        label="Lost" 
        count={stats.nonCommunicatingCount} 
        color="text-rose-400" 
      />
      <div className="w-px h-8 bg-white/5 mx-1"></div>
      <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-xl transition-all group">
        <ShieldAlert size={16} className="text-rose-500 group-hover:animate-pulse" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Incident Center</span>
      </button>
    </div>
  );
};

const StatusPill: React.FC<{ icon: React.ReactNode; label: string; count: number; active?: boolean; color: string }> = ({ icon, label, count, active, color }) => (
  <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 cursor-pointer ${
    active ? 'bg-indigo-500/10 border border-indigo-500/30' : 'hover:bg-white/5'
  }`}>
    <div className={`${active ? 'text-indigo-400' : color}`}>
      {icon}
    </div>
    <div className="flex flex-col">
      <span className={`text-[9px] font-black uppercase tracking-[0.1em] ${active ? 'text-white' : 'text-slate-500'}`}>
        {label}
      </span>
      <span className={`text-[10px] font-mono font-bold ${active ? 'text-indigo-300' : 'text-slate-400'}`}>
        {count.toString().padStart(3, '0')}
      </span>
    </div>
  </div>
);

export default BottomBar;