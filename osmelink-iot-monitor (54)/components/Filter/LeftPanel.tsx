
import React, { useMemo } from 'react';
import { Search, Activity, Filter, Cpu, Smartphone, Hash, Gauge } from 'lucide-react';
import { Vehicle } from '../../types';

interface LeftPanelProps {
  vehicles: Vehicle[];
  onSearchChange: (query: string) => void;
  onVehicleSelect: (id: string) => void;
  selectedVehicleId: string | null;
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  vehicles,
  onSearchChange,
  onVehicleSelect,
  selectedVehicleId
}) => {
  const vehicleList = useMemo(() => {
    return vehicles.map(vehicle => {
      const isSelected = selectedVehicleId === vehicle.id;
      const primaryId = vehicle.displayDeviceId || vehicle.id;
      const hasFriendlyId = !!vehicle.displayDeviceId;
      const isNumericId = /^\d+$/.test(primaryId);

      return (
        <button
          key={vehicle.id}
          onClick={() => onVehicleSelect(vehicle.id)}
          className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-2 group ${
            isSelected
              ? 'bg-indigo-500/15 border-indigo-500/40 ring-1 ring-indigo-500/30 shadow-lg shadow-indigo-500/10'
              : 'bg-[#020617]/40 border-white/5 hover:border-white/10 hover:bg-[#020617]/60'
          }`}
        >
          <div className="flex justify-between items-start w-full">
            <div className="flex flex-col overflow-hidden">
              <div className="flex items-center gap-1.5">
                {isNumericId ? (
                   <Hash size={10} className={isSelected ? "text-indigo-400" : "text-slate-600"} />
                ) : (
                   <Smartphone size={10} className={isSelected ? "text-indigo-400" : "text-slate-600"} />
                )}
                <span className={`text-[11px] font-black font-mono tracking-tight transition-colors truncate ${isSelected ? 'text-indigo-400' : 'text-white'}`}>
                  {primaryId}
                </span>
              </div>
              {hasFriendlyId && (
                <div className="flex items-center gap-1 mt-1 opacity-30">
                  <Cpu size={8} className="text-slate-500" />
                  <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest truncate">
                    IMEI: {vehicle.id}
                  </span>
                </div>
              )}
            </div>
            <StatusBadge status={vehicle.status as string} />
          </div>
          
          <div className="flex justify-between items-center w-full text-[9px] text-slate-600 font-bold uppercase tracking-wider mt-1 pt-2 border-t border-white/[0.03]">
            <div className="flex items-center gap-1.5">
              <Gauge size={10} className="text-slate-700" />
              <span className={isSelected ? 'text-indigo-300' : 'text-slate-400'}>
                {(vehicle.metrics.totalKm || 0).toLocaleString()} KM
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-400">{vehicle.metrics.batteryLevel?.toFixed(0) || 0}%</span>
              <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-700 ${vehicle.metrics.batteryLevel < 20 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                  style={{ width: `${vehicle.metrics.batteryLevel || 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[8px] text-slate-700 font-black uppercase tracking-widest">
            <Activity size={8} />
            <span>Velocity: {vehicle.metrics.speed?.toFixed(0) || 0} KM/H</span>
          </div>
        </button>
      );
    });
  }, [vehicles, selectedVehicleId, onVehicleSelect]);

  return (
    <div className="flex flex-col h-full text-slate-200">
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-slate-500 text-[9px] font-black uppercase tracking-widest ml-1">Asset Locator</label>
          <div className="relative group">
            <input
              type="text"
              placeholder="Search 8-digit ID / 505... / IMEI"
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#020617]/50 border border-white/5 rounded-xl py-3.5 pl-4 pr-10 text-xs focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-800"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700" size={16} />
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 pb-6 space-y-4 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="flex flex-col">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fleet Index</h2>
            <span className="text-[9px] text-indigo-400 font-mono font-bold tracking-tight">
               {vehicles.length} Nodes Active
            </span>
          </div>
          <Filter size={12} className="text-slate-700 cursor-pointer hover:text-indigo-400" />
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
          {vehicles.length === 0 ? (
            <div className="p-12 text-center text-slate-700 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
              Buffering Master Stream...
            </div>
          ) : vehicleList}
        </div>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = status?.toLowerCase();
  const color = s === 'on' ? 'bg-emerald-500 shadow-emerald-500/20' : s === 'idle' ? 'bg-amber-500 shadow-amber-500/20' : 'bg-slate-700';
  return (
    <div className={`w-2 h-2 rounded-full ${color} shadow-lg shrink-0 mt-1 ${s === 'on' ? 'animate-pulse' : ''}`} />
  );
};

export default LeftPanel;
