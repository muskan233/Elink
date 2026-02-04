import React, { useState, useEffect } from 'react';
import { 
  Leaf, Navigation, Sparkles, Loader2, BrainCircuit, Activity, 
  Zap, Thermometer, X, FileText, ChevronRight, Hash, Gauge, 
  ShieldCheck, Battery, User, Truck, Wifi, Cpu, Timer, 
  Power, Milestone, Clock, RotateCw, MapPin, Calendar
} from 'lucide-react';
import { FleetStats, Vehicle, Customer } from '../../types';
import { getFleetInsight } from '../../services/geminiService';
// @ts-ignore
import { useNavigate } from 'react-router-dom';

interface RightPanelProps {
  stats: FleetStats;
  selectedVehicle?: Vehicle;
  customers?: Customer[];
  onClose: () => void;
}

const ParameterCard: React.FC<{ label: string; value: string; unit?: string; icon: React.ReactNode }> = ({ label, value, unit, icon }) => (
  <div className="flex flex-col p-3 border-r border-b border-white/[0.05] last:border-r-0 hover:bg-white/[0.02] transition-colors">
    <div className="flex items-center gap-3 mb-1">
      <div className="text-indigo-400 opacity-80">{icon}</div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-lg font-black text-indigo-400 font-mono tracking-tight">{value}</span>
        {unit && <span className="text-[8px] text-slate-500 font-bold uppercase">{unit}</span>}
      </div>
    </div>
    <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">{label}</span>
  </div>
);

const DetailItem = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <div className="flex flex-col py-2">
    <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-0.5">{label}</span>
    <span className={`text-[10px] font-black font-mono truncate ${color || 'text-slate-200'}`}>{value}</span>
  </div>
);

const RightPanel: React.FC<RightPanelProps> = ({ stats, selectedVehicle, customers = [], onClose }) => {
  const navigate = useNavigate();
  const [insight, setInsight] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const ownerDisplayName = selectedVehicle
    ? (selectedVehicle.equipmentConfig?.customerName ||
       (customers.find(c => c.customerCode === selectedVehicle.equipmentConfig?.customerCode)?.customerName) ||
       selectedVehicle.ownerName ||
       selectedVehicle.equipmentConfig?.customerCode ||
       '---')
    : '---';

  const generateInsight = async () => {
    if (stats.totalCount === 0) return;
    setIsGenerating(true);
    try {
      const result = await getFleetInsight(stats);
      setInsight(result);
    } catch (err) {
      setInsight("Fleet intelligence scan failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (stats.totalCount > 0 && !insight) {
      generateInsight();
    }
  }, [stats.totalCount]);

  return (
    <div className="h-full flex flex-col p-4 gap-6 bg-[#0f172a] overflow-y-auto custom-scrollbar border-l border-white/5">
      
      {/* Sharp Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex flex-col">
          <h2 className="text-slate-500 font-black text-[9px] uppercase tracking-[0.25em] mb-1">
              {selectedVehicle ? 'NODE TELEMETRY' : 'FLEET OVERVIEW'}
          </h2>
          {selectedVehicle ? (
            <span className="text-white font-black text-lg tracking-tighter flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              {selectedVehicle.displayDeviceId || selectedVehicle.id}
            </span>
          ) : (
            <span className="text-white font-black text-lg tracking-tighter">
              Operational Hub
            </span>
          )}
        </div>
        
        {selectedVehicle && (
          <button 
            onClick={onClose}
            className="p-2 bg-white/5 hover:bg-rose-500/20 rounded-none transition-all text-slate-400 hover:text-rose-500 border border-white/10 shadow-sm"
          >
            <X size={18} />
          </button>
        )}
      </div>
      
      {selectedVehicle ? (
        <div className="space-y-6 flex-1 flex flex-col animate-in fade-in duration-300">
           
           {/* Section 1: Asset Details (Image 3 Style) */}
           <section className="bg-slate-900/40 border border-white/10 rounded-none p-5">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="text-indigo-400" size={14} />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Details</h3>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                 <DetailItem label="Owner Name" value={ownerDisplayName} color="text-indigo-400" />
                 <DetailItem label="Manufacturing Year" value={selectedVehicle.equipmentConfig?.manufacturingYear ? String(selectedVehicle.equipmentConfig.manufacturingYear) : '2025'} color="text-indigo-400" />
                 
                 <DetailItem label="Registration No" value={selectedVehicle.registrationNo || '---'} color="text-indigo-400" />
                 <DetailItem label="Chassis No" value={selectedVehicle.chassisNumber || '---'} color="text-indigo-400" />
                 <DetailItem label="Last Updated" value={new Date(selectedVehicle.lastUpdate).toLocaleString('en-GB')} color="text-indigo-400" />
              </div>
           </section>

           {/* Section 2: Live Parameters (Image 1 & 2 Style) */}
           <section className="bg-slate-900/40 border border-white/10 rounded-none">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Live Parameters</h3>
                <Activity size={14} className="text-indigo-400 animate-pulse" />
              </div>
              <div className="grid grid-cols-2">
                <ParameterCard icon={<Battery size={16}/>} label="State Of Charge" value={selectedVehicle.metrics.batteryLevel?.toFixed(1) || '0'} unit="%" />
                <ParameterCard icon={<Milestone size={16}/>} label="Distance To Empty" value={String(selectedVehicle.metrics.dte || '41')} unit="km" />
                
                <ParameterCard icon={<Clock size={16}/>} label="Time To Charge" value={selectedVehicle.metrics.timeToCharge || '00:00'} unit="hh:mm" />
                <ParameterCard icon={<Gauge size={16}/>} label="Speed" value={selectedVehicle.metrics.speed?.toFixed(1) || '0'} unit="km/hr" />
                
                <ParameterCard icon={<RotateCw size={16}/>} label="Vehicle Mode" value={selectedVehicle.metrics.vehicleModeRequest || 'FORWARD'} />
                <ParameterCard icon={<Navigation size={16}/>} label="Trips (24h)" value="2" />
                
                <ParameterCard icon={<Navigation size={16}/>} label="Last Trip Dist" value="71.8" unit="kms" />
                <ParameterCard icon={<Timer size={16}/>} label="Trip Time (24h)" value="3:12" />
                
                <ParameterCard icon={<Zap size={16}/>} label="Battery Voltage" value={`${(selectedVehicle.metrics.voltage || 50.52).toFixed(2)}`} unit="v" />
                <ParameterCard icon={<Zap size={16}/>} label="Battery kWh" value="2.81" unit="kWh" />
                
                <ParameterCard icon={<Thermometer size={16}/>} label="Battery Temp" value={`${(selectedVehicle.metrics.temp || 22).toFixed(0)}`} unit="°C" />
                <ParameterCard icon={<Activity size={16}/>} label="Motor Temp" value={`${(selectedVehicle.metrics.motorTemp || 59).toFixed(0)}`} unit="°C" />
                
                <ParameterCard icon={<Cpu size={16}/>} label="Controller Temp" value="35" unit="°C" />
                <ParameterCard icon={<ShieldCheck size={16}/>} label="State Of Health" value={`${selectedVehicle.analytics?.healthSoh || 0}`} unit="%" />
                
                <ParameterCard icon={<RotateCw size={16}/>} label="Regeneration" value="0" />
                <div className="p-3 border-b border-white/[0.05]"></div>
              </div>
           </section>

           {/* Primary Call to Action */}
           <div className="mt-auto pt-4">
              <button 
                onClick={() => navigate(`/report/${selectedVehicle.id}`)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-none flex items-center justify-between group shadow-xl transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <FileText size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Access Master Archive</span>
                </div>
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
        </div>
      ) : (
        /* Fleet Intelligence Hub */
        <div className="space-y-6 animate-in fade-in duration-500">
          
          {/* AI Insights Card */}
          <section className="bg-slate-900 border border-white/10 rounded-none p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 text-indigo-400">
                <BrainCircuit size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">AI Strategic Insight</span>
              </div>
              <button 
                onClick={generateInsight}
                disabled={isGenerating || stats.totalCount === 0}
                className="p-1.5 hover:bg-white/5 rounded-none transition-all"
              >
                {isGenerating ? <Loader2 size={16} className="animate-spin text-indigo-400" /> : <Sparkles size={16} className="text-slate-500 hover:text-indigo-400" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed italic border-l-2 border-indigo-500/40 pl-4 py-1">
              {isGenerating ? "Analyzing fleet dynamics..." : insight || "Select a network node to initiate telemetry diagnostics..."}
            </p>
          </section>

          {/* Environmental Impact Card */}
          <section className="bg-slate-900 border border-white/10 rounded-none p-6">
              <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                      <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-2">Fleet Environmental Credit</span>
                      <div className="flex items-baseline gap-2">
                          <span className="text-white text-3xl font-black font-mono tracking-tighter">{stats.totalCo2Saved.toFixed(0)}</span>
                          <span className="text-slate-500 text-[10px] font-black uppercase">KG CO2</span>
                      </div>
                  </div>
                  <div className="p-4 bg-emerald-500/10 rounded-none border border-emerald-500/20 text-emerald-500">
                      <Leaf size={24} />
                  </div>
              </div>
          </section>
          
          {/* Total Distance Card */}
          <section className="bg-slate-900 border border-white/10 rounded-none p-6">
              <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                      <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-2">Total Fleet Utilization</span>
                      <div className="flex items-baseline gap-2">
                          <span className="text-white text-3xl font-black font-mono tracking-tighter">{stats.totalKm.toLocaleString()}</span>
                          <span className="text-slate-500 text-[10px] font-black uppercase">KM</span>
                      </div>
                  </div>
                  <div className="p-4 bg-indigo-500/10 rounded-none border border-indigo-500/20 text-indigo-400">
                      <Navigation size={24} />
                  </div>
              </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default RightPanel;
