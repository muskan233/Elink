
import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';
import { Vehicle, Customer } from '../types';
import { 
  Search, Edit3, Save, Loader2, ChevronLeft, 
  HardDrive, CheckSquare, Square, CheckCircle2, XCircle
} from 'lucide-react';

const VehicleOnboarding: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dealers, setDealers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'list' | 'form'>('list');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerCode: '',
    dealerName: '',
    fleets: '',
    hardwareId: '',
    displayDeviceId: '',
    chassisNumber: '',
    registrationNo: '',
    invoiceDate: '',
    active: true
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [vData, cData, dData] = await Promise.all([
        apiService.getAllVehicles(),
        apiService.getCustomers(),
        apiService.getDealers()
      ]);
      setVehicles(vData || []);
      setCustomers(cData || []);
      setDealers(dData || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleEditClick = (vehicle: Vehicle) => {
    setEditingId(vehicle.id);
    const config = (vehicle.equipmentConfig || {}) as any;
    setFormData({
      customerCode: config.customerCode || '',
      dealerName: config.dealerName || '',
      fleets: config.siteCode || '',
      hardwareId: vehicle.id || '',
      displayDeviceId: vehicle.displayDeviceId || '',
      chassisNumber: vehicle.chassisNumber || '',
      registrationNo: vehicle.registrationNo || '',
      invoiceDate: config.invoiceDate || '',
      active: String(config.active) === 'true' || config.active === true
    });
    setView('form');
  };

  const handleDiscard = () => {
    setView('list');
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const targetCustomer = customers.find(c => c.customerCode === formData.customerCode);
      const updates = {
        displayDeviceId: formData.displayDeviceId,
        chassisNumber: formData.chassisNumber,
        registrationNo: formData.registrationNo,
        equipmentConfig: {
          hardwareId: formData.hardwareId,
          customerCode: formData.customerCode,
          customerName: targetCustomer?.customerName || '',
          dealerName: formData.dealerName,
          invoiceDate: formData.invoiceDate,
          active: formData.active,
          equipmentCode: formData.displayDeviceId,
          vehicleChassisNo: formData.chassisNumber,
          vehicleRegNo: formData.registrationNo,
          siteCode: formData.fleets
        } as any
      };
      const res = await apiService.updateVehicle(formData.hardwareId, updates);
      if (res && res.success) {
        setView('list');
        await loadData();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    return vehicles.filter(v => 
      (v.displayDeviceId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [vehicles, searchQuery]);

  return (
    <div className="p-8 h-full flex flex-col space-y-6 bg-slate-50 font-sans overflow-y-auto custom-scrollbar">
      {view === 'list' ? (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Vehicle Onboarding</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Configure asset hardware and customer links</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search Hardware or Node..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <th className="px-8 py-4">Equipment Node</th>
                    <th className="px-8 py-4">HWID (IMEI)</th>
                    <th className="px-8 py-4">Registration</th>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={32} /></td></tr>
                  ) : (
                    filtered.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-4 font-bold text-slate-800">{v.displayDeviceId || 'MASTER-NODE'}</td>
                        <td className="px-8 py-4 font-mono text-slate-500 text-xs">{v.id}</td>
                        <td className="px-8 py-4 text-slate-500 text-xs font-bold uppercase">{v.registrationNo || 'Unregistered'}</td>
                        <td className="px-8 py-4">
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit text-[9px] font-black uppercase ${v.equipmentConfig?.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                            {v.equipmentConfig?.active ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                            {v.equipmentConfig?.active ? 'Active' : 'Standby'}
                          </div>
                        </td>
                        <td className="px-8 py-4 text-center">
                          <button onClick={() => handleEditClick(v)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit3 size={18} /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={handleDiscard} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 shadow-sm"><ChevronLeft size={20} /></button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Edit Vehicle Profile</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Telemetry hardware and deployment linkage</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden max-w-5xl">
            <form onSubmit={handleSave}>
              <div className="p-10 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Customer *</label>
                    <select required value={formData.customerCode} onChange={e => setFormData({...formData, customerCode: e.target.value})} className="w-full bg-slate-50 border-b-2 border-slate-200 py-2.5 px-1 text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500 transition-all appearance-none">
                      <option value="">Select Customer...</option>
                      {customers.map(c => <option key={c.id} value={c.customerCode}>{c.customerName}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Dealer *</label>
                    <select required value={formData.dealerName} onChange={e => setFormData({...formData, dealerName: e.target.value})} className="w-full bg-slate-50 border-b-2 border-slate-200 py-2.5 px-1 text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500 transition-all appearance-none">
                      <option value="">Select Dealer...</option>
                      {dealers.map(d => <option key={d.id} value={d.dealerName}>{d.dealerName}</option>)}
                      <option value="OSM_MAIN">Omega Seiki, MAIN</option>
                    </select>
                  </div>
                  <InputField label="Fleet / Financier" value={formData.fleets} onChange={v => setFormData({...formData, fleets: v})} />
                  <InputField label="Hardware ID (IMEI)" value={formData.hardwareId} disabled />
                  <InputField label="Device ID (Equipment Code)" value={formData.displayDeviceId} onChange={v => setFormData({...formData, displayDeviceId: v})} required />
                  <InputField label="Chassis No (VIN)" value={formData.chassisNumber} onChange={v => setFormData({...formData, chassisNumber: v})} required />
                  <InputField label="Registration Number" value={formData.registrationNo} onChange={v => setFormData({...formData, registrationNo: v})} required />
                  <InputField label="Invoice Date" type="date" value={formData.invoiceDate} onChange={v => setFormData({...formData, invoiceDate: v})} required />
                </div>
                <div className="pt-10 border-t border-slate-100">
                  <button type="button" onClick={() => setFormData({...formData, active: !formData.active})} className="flex items-center gap-3 focus:outline-none">
                    {formData.active ? <CheckSquare className="text-indigo-600" size={20} /> : <Square className="text-slate-300" size={20} />}
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Asset is Active</span>
                  </button>
                </div>
              </div>
              <div className="px-10 py-6 bg-slate-50 border-t border-slate-200 flex items-center gap-4">
                <button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 disabled:opacity-70">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}Save Updates
                </button>
                <button type="button" onClick={handleDiscard} className="px-10 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest hover:bg-white rounded-xl border border-transparent hover:border-slate-200">Discard</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const InputField = ({ label, value, onChange, type = 'text', required = false, disabled = false }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{label} {required && <span className="text-rose-500">*</span>}</label>
    <input type={type} disabled={disabled} required={required} value={value} onChange={e => onChange?.(e.target.value)} className={`w-full border-b-2 border-slate-200 py-2.5 px-1 text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500 transition-all ${disabled ? 'bg-slate-100 text-slate-400 border-none' : 'bg-slate-50'}`} />
  </div>
);

export default VehicleOnboarding;
