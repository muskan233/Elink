import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';
import { Customer } from '../types';
import { 
  Search, UserPlus, Edit3, X, Save, 
  User, MapPin, Loader2, Eye, EyeOff, 
  ChevronLeft, CheckSquare, Square
} from 'lucide-react';

const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'list' | 'form'>('list');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    customerName: '',
    phoneNo: '',
    emailId: '',
    address: '',
    city: '',
    state: '',
    isUser: false,
    username: '',
    password: '',
    confirmPassword: ''
  });

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await apiService.getCustomers();
      setCustomers(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const openAddForm = () => {
    // Logic: If user searches and an exact match exists, we could auto-edit, 
    // but standard behavior is to check against existing list.
    const existing = customers.find(c => c.customerName.toLowerCase() === searchQuery.toLowerCase() && searchQuery !== '');
    
    if (existing) {
      handleEditClick(existing);
    } else {
      setEditingId(null);
      setFormData({
        customerName: '', phoneNo: '', emailId: '', address: '', 
        city: '', state: '', isUser: false, 
        username: '', password: '', confirmPassword: ''
      });
      setView('form');
    }
  };

  const handleEditClick = (customer: Customer) => {
    setEditingId(customer.id);
    setFormData({
      customerName: customer.customerName,
      phoneNo: customer.phoneNo,
      emailId: customer.emailId,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      isUser: customer.isUser,
      username: customer.username || '',
      password: customer.password || '',
      confirmPassword: customer.password || ''
    });
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
      const payload = {
        ...formData,
        id: editingId || '',
        customerCode: editingId ? undefined : `OSM-${Math.floor(1000 + Math.random() * 9000)}`,
        onboardDate: new Date().toISOString().split('T')[0],
        country: 'India',
        timezoneName: 'Asia/Calcutta'
      };

      const result = await apiService.saveCustomer(payload as any);

      if (result && result.success) {
        setView('list');
        await loadCustomers();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    return customers.filter(c => 
      c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phoneNo.includes(searchQuery) ||
      c.city.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [customers, searchQuery]);

  return (
    <div className="p-8 h-full flex flex-col space-y-6 bg-slate-50 font-sans overflow-y-auto custom-scrollbar">
      {view === 'list' ? (
        <>
          {/* List View Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">User Management</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Directory of registered customers and system access</p>
            </div>
            <button 
              onClick={openAddForm}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95"
            >
              <UserPlus size={16} />
              Add New User
            </button>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search User..."
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
                    <th className="px-8 py-4">Customer Name</th>
                    <th className="px-8 py-4">Contact Number</th>
                    <th className="px-8 py-4">Location</th>
                    <th className="px-8 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-20 text-center">
                        <Loader2 className="animate-spin text-indigo-600 mx-auto" size={32} />
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                        No records found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((customer) => (
                      <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-4">
                          <span className="text-sm font-bold text-slate-800">{customer.customerName}</span>
                        </td>
                        <td className="px-8 py-4">
                          <span className="text-xs font-bold text-slate-600">{customer.phoneNo}</span>
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <MapPin size={12} className="text-slate-400" />
                            {customer.city}, {customer.state}
                          </div>
                        </td>
                        <td className="px-8 py-4 text-center">
                          <button 
                            onClick={() => handleEditClick(customer)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            <Edit3 size={18} />
                          </button>
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
        /* Form View Header */
        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={handleDiscard}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                {editingId ? 'Edit User Details' : 'Add New User'}
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Configure profile and access credentials</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden max-w-5xl">
            <form onSubmit={handleSave}>
              <div className="p-10 space-y-10">
                {/* Image 2 Layout Implementation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  <InputField 
                    label="Customer Name" 
                    value={formData.customerName} 
                    onChange={v => setFormData({...formData, customerName: v})} 
                    required 
                  />
                  <InputField 
                    label="Contact Number" 
                    value={formData.phoneNo} 
                    onChange={v => setFormData({...formData, phoneNo: v})} 
                    required 
                  />
                  <InputField 
                    label="Email" 
                    type="email"
                    value={formData.emailId} 
                    onChange={v => setFormData({...formData, emailId: v})} 
                    required 
                  />
                  <InputField 
                    label="Address" 
                    value={formData.address} 
                    onChange={v => setFormData({...formData, address: v})} 
                    required 
                  />
                  <InputField 
                    label="City" 
                    value={formData.city} 
                    onChange={v => setFormData({...formData, city: v})} 
                    required
                  />
                  <InputField 
                    label="State" 
                    value={formData.state} 
                    onChange={v => setFormData({...formData, state: v})} 
                    required
                  />
                </div>

                {/* User Account Section (Image 2 - is user checkbox) */}
                <div className="pt-10 border-t border-slate-100 space-y-8">
                  <div className="flex items-center">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, isUser: !formData.isUser})}
                      className="flex items-center gap-3 group focus:outline-none"
                    >
                      {formData.isUser ? (
                        <CheckSquare className="text-indigo-600" size={20} />
                      ) : (
                        <Square className="text-slate-300 group-hover:text-slate-400" size={20} />
                      )}
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Is User Account</span>
                    </button>
                  </div>

                  {formData.isUser && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 animate-in slide-in-from-top-4 duration-300">
                      <InputField 
                        label="Username" 
                        value={formData.username} 
                        onChange={v => setFormData({...formData, username: v})} 
                        required 
                      />
                      <div className="relative">
                        <InputField 
                          label="Password" 
                          type={showPassword ? "text" : "password"} 
                          value={formData.password} 
                          onChange={v => setFormData({...formData, password: v})} 
                          required 
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)} 
                          className="absolute right-0 top-8 p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <InputField 
                        label="Confirm Password" 
                        type="password" 
                        value={formData.confirmPassword} 
                        onChange={v => setFormData({...formData, confirmPassword: v})} 
                        required 
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Form Footer Actions (Image 2) */}
              <div className="px-10 py-6 bg-slate-50 border-t border-slate-200 flex items-center gap-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all flex items-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save
                </button>
                <button 
                  type="button" 
                  onClick={handleDiscard}
                  className="px-10 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest hover:bg-white hover:text-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-200"
                >
                  Discard
                </button>
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
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <input 
      type={type} 
      required={required} 
      value={value} 
      onChange={e => onChange(e.target.value)}
      className="w-full bg-slate-50 border-b-2 border-slate-200 py-2.5 px-1 text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300"
    />
  </div>
);

export default CustomerManagement;
