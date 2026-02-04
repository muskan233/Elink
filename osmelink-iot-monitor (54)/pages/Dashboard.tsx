import React, { useState, useEffect, useMemo, useContext } from 'react';
import { apiService } from '../services/api';
import { Vehicle, VehicleStatus } from '../types';
import { AuthContext } from '../App';
import { 
  Truck, Signal, Zap, Gauge, Leaf, 
  ShieldAlert, Calendar, ChevronDown, 
  Power, Timer, CreditCard, RefreshCw, ShieldCheck
} from 'lucide-react';
// @ts-ignore
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const KPIStatCard = ({ label, value, icon: Icon, colorClass }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center gap-5">
    <div className={`p-4 rounded-xl ${colorClass} bg-opacity-10 text-opacity-100`}>
      <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">{label}</p>
      <h3 className="text-2xl font-bold text-slate-800 tracking-tight leading-none">{value}</h3>
    </div>
  </div>
);

const SelectableCard = ({ label, value, icon: Icon, active, color }: any) => (
  <div className={`p-5 rounded-2xl border transition-all flex flex-col gap-3 flex-1 ${
    active ? `bg-white border-${color}-500 ring-1 ring-${color}-500 shadow-lg` : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
  }`}>
    <div className={`p-2 w-fit rounded-lg ${active ? `bg-${color}-500 text-white` : `bg-slate-100 text-slate-400`}`}>
      <Icon size={18} />
    </div>
    <div>
      <span className="text-xl font-bold text-slate-800 block leading-tight">{value}</span>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
  </div>
);

const PerformanceCard = ({ label, value, unit, icon: Icon, colorClass }: any) => (
  <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between overflow-hidden relative group">
    <div className={`absolute top-0 right-0 w-32 h-32 ${colorClass} opacity-5 blur-3xl rounded-full transition-all group-hover:scale-125`}></div>
    <div className="relative z-10">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold text-slate-800 tracking-tighter">{value}</span>
        <span className="text-xs font-bold text-slate-400 uppercase">{unit}</span>
      </div>
    </div>
    <div className={`relative z-10 p-5 rounded-3xl ${colorClass} text-white shadow-xl`}>
      <Icon size={32} />
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [dateFilter, setDateFilter] = useState<'Today' | 'Custom'>('Today');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiService.getAllVehicles();
        let filtered = data || [];
        if (user?.role === 'Customer') {
          filtered = filtered.filter(v => v.equipmentConfig?.customerCode === user.customerCode);
        } else if (user?.role === 'User') {
          const assigned = user.assignedVehicles || [];
          filtered = filtered.filter(v => assigned.includes(v.id));
        }
        setVehicles(filtered);
      } catch (err) {
        console.error("Dashboard Sync Error:", err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const stats = useMemo(() => {
    return vehicles.reduce((acc, curr) => ({
      ...acc,
      online: acc.online + (curr.status === VehicleStatus.ONLINE ? 1 : 0),
      offline: acc.offline + (curr.status === VehicleStatus.OFFLINE ? 1 : 0),
      idle: acc.idle + (curr.status === VehicleStatus.IDLE ? 1 : 0),
      charging: acc.charging + (curr.status === VehicleStatus.CHARGING || curr.status === VehicleStatus.ON_CHARGE ? 1 : 0),
      immobilized: acc.immobilized + (curr.status === VehicleStatus.IMMOBILIZED ? 1 : 0),
      activeSub: acc.activeSub + (curr.equipmentConfig?.activeSubscription?.toLowerCase() === 'active' ? 1 : 0),
      totalKm: acc.totalKm + (curr.metrics.totalKm || 0),
      totalCo2: acc.totalCo2 + (curr.metrics.co2Saved || 0)
    }), { online: 0, offline: 0, idle: 0, charging: 0, immobilized: 0, activeSub: 0, totalKm: 0, totalCo2: 0 });
  }, [vehicles]);

  const pieData = [
    { name: 'Online', value: stats.online, color: '#10b981' },
    { name: 'Offline', value: stats.offline, color: '#64748b' },
    { name: 'Idle', value: stats.idle, color: '#f59e0b' },
  ];

  return (
    <div className="p-8 h-full overflow-y-auto custom-scrollbar bg-[#f8fafc] space-y-8 font-sans">
      {/* Date Filters Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Overview</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Real-time Node Distribution & Analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <button 
              onClick={() => setDateFilter(prev => prev === 'Today' ? 'Custom' : 'Today')}
              className="flex items-center gap-3 bg-white border border-slate-200 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 uppercase tracking-widest hover:border-indigo-500/50 transition-all shadow-sm"
            >
              <Calendar size={16} className="text-indigo-500" />
              <span>{dateFilter}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition-all shadow-lg shadow-indigo-100">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Row 1: Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPIStatCard label="Total Vehicles" value={vehicles.length} icon={Truck} colorClass="bg-indigo-600" />
        <KPIStatCard label="Vehicles On Charge" value={stats.charging} icon={Zap} colorClass="bg-sky-500" />
        <KPIStatCard label="Online Vehicles" value={stats.online} icon={Signal} colorClass="bg-emerald-600" />
        <KPIStatCard label="Offline Vehicles" value={stats.offline} icon={Power} colorClass="bg-slate-500" />
        <KPIStatCard label="Idle Vehicles" value={stats.idle} icon={Timer} colorClass="bg-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Row 2: Status Visualization */}
        <div className="lg:col-span-7 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest mb-8">Vehicle Distribution Status</h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-4 ml-8">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3: Subscription & Status Section */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest px-2">Compliance & Security</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
             <SelectableCard 
               label="Active Subscriptions" 
               value={stats.activeSub} 
               icon={CreditCard} 
               color="emerald" 
               active={false} 
             />
             <SelectableCard 
               label="Non-Active Subscriptions" 
               value={vehicles.length - stats.activeSub} 
               icon={ShieldAlert} 
               color="rose" 
               active={false} 
             />
             <SelectableCard 
               label="Immobilized Vehicles" 
               value={stats.immobilized} 
               icon={Power} 
               color="indigo" 
               active={false} 
             />
             <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex flex-col justify-center items-center text-center">
               <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Fleet Health Score</span>
               <span className="text-3xl font-bold text-indigo-700">98.2%</span>
             </div>
          </div>
        </div>
      </div>

      {/* Row 4: Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceCard 
          label="Total Distance Traveled" 
          value={stats.totalKm.toLocaleString()} 
          unit="Kilometers" 
          icon={Gauge} 
          colorClass="bg-indigo-600" 
        />
        <PerformanceCard 
          label="Total CO₂ Saved" 
          value={stats.totalCo2.toFixed(1)} 
          unit="KG Offset" 
          icon={Leaf} 
          colorClass="bg-emerald-600" 
        />
      </div>

      <div className="pt-8 border-t border-slate-200 text-center">
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.4em]">OsmeLink IoT Intelligence Platform • v2.9.6</p>
      </div>
    </div>
  );
};

export default Dashboard;