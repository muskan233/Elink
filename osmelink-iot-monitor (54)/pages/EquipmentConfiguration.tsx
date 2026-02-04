
import React, { useState, useEffect } from 'react';
// @ts-ignore - fix for react-router-dom member export errors in environment
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Vehicle } from '../types';
import { 
  ArrowLeft, Cpu, ShieldCheck, AlertCircle, 
  Truck, Settings, FileText, Info, Calendar, MapPin, User, Building, Hash
} from 'lucide-react';

const MetaPill = ({ icon, label, value, highlight }: { icon: any; label: string; value: string; highlight?: boolean }) => (
    <div className={`flex items-center gap-2 border px-3 py-1.5 rounded-lg shadow-inner transition-all ${
      highlight 
        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-indigo-500/10' 
        : 'bg-[#020617] border-white/10 text-slate-300'
    }`}>
        <span className={highlight ? 'text-indigo-400' : 'text-slate-600'}>{icon}</span>
        <span className={`text-[8px] font-black uppercase tracking-widest ${highlight ? 'text-indigo-400/70' : 'text-slate-500'}`}>{label}:</span>
        <span className="text-[10px] font-black font-mono truncate max-w-[200px]">{value}</span>
    </div>
);

const SpecLine = ({ label, value, icon }: { label: string; value?: string; icon?: React.ReactNode }) => (
  <div className="flex justify-between items-center py-3 border-b border-white/[0.03] last:border-none group">
    <div className="flex items-center gap-2">
      <span className="text-slate-700 group-hover:text-indigo-400 transition-colors">{icon}</span>
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-[10px] font-black font-mono text-slate-200">{value || 'N/A'}</span>
  </div>
);

const EquipmentConfiguration: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setLoading(true);
      apiService.getVehicleDetails(id).then(data => {
        setVehicle(data);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) return (
    <div className="h-screen bg-[#020617] flex flex-col items-center justify-center text-slate-500 gap-4">
      <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse text-indigo-400">Syncing Identity...</span>
    </div>
  );

  if (!vehicle) return (
    <div className="h-screen bg-[#020617] flex flex-col items-center justify-center text-slate-500 gap-4">
      <AlertCircle size={48} className="text-rose-500 mb-2" />
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Node Not Found</span>
      <button onClick={() => navigate('/dashboard')} className="mt-6 px-8 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl">Back to Live Map</button>
    </div>
  );

  const config = vehicle.equipmentConfig;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-sans overflow-hidden">
      <header className="bg-slate-900/50 border-b border-white/5 px-8 py-6 flex items-center justify-between backdrop-blur-xl z-50">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/dashboard')} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-white/5 text-slate-400 hover:text-white group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight uppercase italic flex items-center gap-3">
              <Settings size={22} className="text-indigo-400" />
              Identity Profile
            </h1>
            <div className="flex gap-4 items-center mt-1">
               <MetaPill icon={<Truck size={10}/>} label="Asset" value={config?.equipmentCode || vehicle.displayDeviceId || 'N/A'} highlight />
               <MetaPill icon={<Cpu size={10}/>} label="Node" value={id || 'N/A'} />
               <MetaPill icon={<Info size={10}/>} label="Status" value={config?.vehicleStatus || 'Mobilized'} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/report/${id}`)} className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 shadow-xl">
                <FileText size={16} className="text-indigo-400" /> System Report
            </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-slate-950/20">
        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Identity & Technical Specs */}
          <div className="col-span-12 lg:col-span-6 space-y-8">
            <div className="bg-slate-900/40 rounded-[3rem] border border-white/5 p-10 shadow-inner">
              <div className="flex items-center gap-3 mb-8">
                <ShieldCheck className="text-indigo-400" size={18} />
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Master Identity</h3>
              </div>
              <div className="space-y-1">
                 <SpecLine label="Chassis Number" value={vehicle.chassisNumber} icon={<Hash size={12}/>} />
                 <SpecLine label="Registration No" value={vehicle.registrationNo} icon={<FileText size={12}/>} />
                 <SpecLine label="Model Description" value={config?.description} icon={<Info size={12}/>} />
                 <SpecLine label="Sub Category" value={config?.subCategoryName} icon={<Truck size={12}/>} />
                 {/* Fixed: Converted manufacturingYear to string to resolve type assignment error */}
                 <SpecLine label="Manufacturing Year" value={config?.manufacturingYear ? String(config.manufacturingYear) : ''} icon={<Calendar size={12}/>} />
                 <SpecLine label="Invoice Date" value={config?.invoiceDate} icon={<Calendar size={12}/>} />
                 <SpecLine label="Model Code" value={config?.modelCode} icon={<Cpu size={12}/>} />
              </div>
            </div>
          </div>

          {/* Organizational Metadata */}
          <div className="col-span-12 lg:col-span-6 space-y-8">
            <div className="bg-slate-900/40 rounded-[3rem] border border-white/5 p-10 shadow-inner">
              <div className="flex items-center gap-3 mb-8">
                <Building className="text-indigo-400" size={18} />
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Deployment Context</h3>
              </div>
              <div className="space-y-1">
                 <SpecLine label="Dealer Name" value={config?.dealerName} icon={<User size={12}/>} />
                 <SpecLine label="Customer Code" value={config?.customerCode} icon={<User size={12}/>} />
                 <SpecLine label="Site Name" value={config?.siteName} icon={<MapPin size={12}/>} />
                 <SpecLine label="Site Code" value={config?.siteCode} icon={<Hash size={12}/>} />
                 <SpecLine label="Hierarchy" value={config?.hierarchyName} icon={<Building size={12}/>} />
                 <SpecLine label="Location" value={config?.location} icon={<MapPin size={12}/>} />
                 <SpecLine label="Subscription Active" value={config?.activeSubscription} icon={<ShieldCheck size={12}/>} />
              </div>
            </div>

            {/* Battery Profile */}
            <div className="bg-slate-900/40 rounded-[2.5rem] border border-white/5 p-8 shadow-inner">
               <div className="flex items-center gap-3 mb-6">
                <Cpu className="text-indigo-400" size={18} />
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Core Components</h3>
              </div>
              <div className="space-y-1">
                 <SpecLine label="Battery Serial No" value={config?.batterySerialNo} />
                 <SpecLine label="Battery Type" value={config?.batteryTypeName || 'Standard LI-ION'} />
                 <SpecLine label="BMS Protocol" value={config?.bmsTypeName || 'Smart BMS V3'} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EquipmentConfiguration;