
import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';
import { 
  Search, UserPlus, Edit3, Save, 
  MapPin, Loader2, Eye, EyeOff, 
  ChevronLeft, CheckSquare, Square, Briefcase
} from 'lucide-react';

const DealerManagement: React.FC = () => {
  const [dealers, setDealers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'list' | 'form'>('list');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    dealerName: '',
    dealerContactPerson: '',
    dealerContactNumber: '',
    dealerCode: '',
    address: '',
    email: '',
    state: '',
    city: '',
    isUser: false,
    username: '',
    password: '',
    confirmPassword: ''
  });

  const loadDealers = async () => {
    setLoading(true);
    try {
      const data = await apiService.getDealers();
      setDealers(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDealers();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setFormData({
      dealerName: '', dealerContactPerson: '', dealerContactNumber: '', dealerCode: '',
      address: '', email: '', state: '', city: '', isUser: false, 
      username: '', password: '', confirmPassword: ''
    });
    setView('form');
  };

  const handleEditClick = (dealer: any) => {
    setEditingId(dealer.id);
    setFormData({ ...dealer, confirmPassword: dealer.password });
    setView('form');
  };

  const handleDiscard = () => {
    setView('list');
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.isUser && formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiService.saveDealer({ ...formData, id: editingId });
      if (result && result.success) {
        setView('list');
        await loadDealers();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    return dealers.filter(d => 
      (d.dealerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.dealerCode || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [dealers, searchQuery]);

  return (
    <div className="p-8 h-full flex flex-col space-y-6 bg-slate-50 font-sans overflow-y-auto custom-scrollbar">
      {view === 'list' ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dealer / Fleet / OEM Management</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Authorized partner network records</p>
            </div>
            <button 
              onClick={openAddForm}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95"
            >
              <UserPlus size={16} />
              Add New Dealer
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by Name or Code..."
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
                    <th className="px-8 py-4">Dealer Name</th>
                    <th className="px-8 py-4">Dealer Code</th>
                    <th className="px-8 py-4">Location</th>
                    <th className="px-8 py-4">Contact Person</th>
                    <th className="px-8 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={32} /></td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={5} className="py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No records found</td></tr>
                  ) : (
                    filtered.map((dealer) => (
                      <tr key={dealer.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-4 font-bold text-slate-800">{dealer.dealerName}</td>
                        <td className="px-8 py-4 font-mono text-slate-500 text-xs">{dealer.dealerCode}</td>
                        <td className="px-8 py-4 text-slate-500 text-xs">{dealer.city}, {dealer.state}</td>
                        <td className="px-8 py-4 text-slate-600 text-xs font-medium">{dealer.dealerContactPerson}</td>
                        <td className="px-8 py-4 text-center">
                          <button onClick={() => handleEditClick(dealer)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit3 size={18} /></button>
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
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{editingId ? 'Edit Dealer Details' : 'Add New Dealer'}</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Configure partner details and access</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden max-w-5xl">
            <form onSubmit={handleSave}>
              <div className="p-10 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  <InputField label="Dealer Name" value={formData.dealerName} onChange={v => setFormData({...formData, dealerName: v})} required />
                  <InputField label="Dealer Contact Person" value={formData.dealerContactPerson} onChange={v => setFormData({...formData, dealerContactPerson: v})} required />
                  <InputField label="Dealer Contact Number" value={formData.dealerContactNumber} onChange={v => setFormData({...formData, dealerContactNumber: v})} required />
                  <InputField label="Dealer Code" value={formData.dealerCode} onChange={v => setFormData({...formData, dealerCode: v})} required />
                  <InputField label="Email" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} required />
                  <InputField label="Address" value={formData.address} onChange={v => setFormData({...formData, address: v})} required />
                  <InputField label="City" value={formData.city} onChange={v => setFormData({...formData, city: v})} required />
                  <InputField label="State" value={formData.state} onChange={v => setFormData({...formData, state: v})} required />
                </div>

                <div className="pt-10 border-t border-slate-100 space-y-8">
                  <button type="button" onClick={() => setFormData({...formData, isUser: !formData.isUser})} className="flex items-center gap-3 focus:outline-none">
                    {formData.isUser ? <CheckSquare className="text-indigo-600" size={20} /> : <Square className="text-slate-300" size={20} />}
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Is User Account</span>
                  </button>
                  {formData.isUser && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 animate-in slide-in-from-top-4">
                      <InputField label="Dealer Username" value={formData.username} onChange={v => setFormData({...formData, username: v})} required />
                      <div className="relative">
                        <InputField label="Password" type={showPassword ? "text" : "password"} value={formData.password} onChange={v => setFormData({...formData, password: v})} required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-8 p-2 text-slate-400 hover:text-indigo-600">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                      </div>
                      <InputField label="Confirm Password" type="password" value={formData.confirmPassword} onChange={v => setFormData({...formData, confirmPassword: v})} required />
                    </div>
                  )}
                </div>
              </div>
              <div className="px-10 py-6 bg-slate-50 border-t border-slate-200 flex items-center gap-4">
                <button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 disabled:opacity-70">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}Save
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

const InputField = ({ label, value, onChange, type = 'text', required = false }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{label} {required && <span className="text-rose-500">*</span>}</label>
    <input type={type} required={required} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-50 border-b-2 border-slate-200 py-2.5 px-1 text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500 transition-all" />
  </div>
);

export default DealerManagement;
