import React, { useState, useMemo, useEffect, useCallback } from 'react';
// @ts-ignore
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { Vehicle, Customer } from '../types';
import { 
  Search, Edit3, ArrowLeft,
  Plus, Check, Save, Settings, Download, 
  Eye, EyeOff, AlertCircle, Loader2
} from 'lucide-react';

type AdminView = 'hub' | 'equipment-master' | 'equipment-edit' | 'customer-master' | 'customer-add' | 'customer-edit' | 'user-master' | 'user-add' | 'user-edit';

const Admin: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = (searchParams.get('view') as AdminView) || 'hub';
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const initialCustomerForm = {
    customerCode: '', customerName: '', phoneNo: '', whatsappNo: '', emailId: '', city: '', state: '', country: 'India',
    address: '', onboardDate: new Date().toISOString().split('T')[0], manufacturingYear: '2025', timezoneName: 'Asia/Calcutta',
    isUser: false, username: '', password: '', confirmPassword: ''
  };

  const initialUserForm = {
    username: '', emailId: '', password: '', confirmPassword: '', role: 'User', isActive: true, customerCode: '',
    assignedVehicles: ''
  };

  const [customerForm, setCustomerForm] = useState<any>(initialCustomerForm);
  const [userForm, setUserForm] = useState<any>(initialUserForm);
  const [equipmentForm, setEquipmentForm] = useState<any>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [vData, cData, uData] = await Promise.all([
        apiService.getAllVehicles(),
        apiService.getCustomers(),
        apiService.getUsers()
      ]);
      setVehicles(vData || []);
      setCustomers(cData || []);
      setUsers(uData || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (selectedItem) {
      if (currentView === 'equipment-edit') {
        const config = selectedItem.equipmentConfig || {};
        setEquipmentForm({
          equipmentCode: selectedItem.displayDeviceId || '',
          hardwareId: selectedItem.id || '',
          description: config.description || '',
          siteName: config.siteName || '',
          siteCode: config.siteCode || '',
          dealerCode: config.dealerName || '',
          customerName: config.customerName || customers.find(c => c.customerCode === config.customerCode)?.customerName || '',
          modelCode: config.modelCode || '',
          subCategoryName: config.subCategoryName || '',
          parentPositionName: config.hierarchyName || '',
          batterySerialNo: config.batterySerialNo || '',
          lat: config.latitude || '',
          lng: config.longitude || '',
          invoiceDate: config.invoiceDate || '',
          manufacturingYear: config.manufacturingYear || '2025',
          registrationNo: selectedItem.registrationNo || '',
          chassisNo: selectedItem.chassisNumber || '',
          batteryTypeName: config.batteryTypeName || '',
          bmsTypeName: config.bmsTypeName || '',
          immobilizationType: config.immobilizationType || '',
          active: config.active === 'true' || config.active === true,
          geoFence: config.geoFence === 'true' || config.geoFence === true,
          location: config.location || '',
        });
      } else if (currentView === 'customer-edit') {
        setCustomerForm({ ...initialCustomerForm, ...selectedItem });
      } else if (currentView === 'user-edit') {
        setUserForm({ 
          ...initialUserForm, 
          ...selectedItem,
          assignedVehicles: Array.isArray(selectedItem.assignedVehicles) ? selectedItem.assignedVehicles.join(', ') : (selectedItem.assignedVehicles || '')
        });
      }
    }
  }, [currentView, selectedItem, customers]);

  const navigateToView = (view: AdminView) => {
    setSearchParams({ view });
    setSearchQuery('');
    setFormError(null);
    setCurrentPage(1);
    if (view === 'customer-add') {
      setSelectedItem(null);
      const newCode = `OSM-CUST-${Math.floor(1000 + Math.random() * 9000)}`;
      setCustomerForm({ ...initialCustomerForm, customerCode: newCode });
    } else if (view === 'user-add') {
      setSelectedItem(null);
      setUserForm(initialUserForm);
    } else if (!view.includes('edit')) {
      setSelectedItem(null);
    }
  };

  const filteredVehicles = useMemo(() => vehicles.filter(v => 
    (v.displayDeviceId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.id || '').toLowerCase().includes(searchQuery.toLowerCase())
  ), [vehicles, searchQuery]);

  const filteredCustomers = useMemo(() => customers.filter(c => 
    (c.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.emailId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.customerCode || '').toLowerCase().includes(searchQuery.toLowerCase())
  ), [customers, searchQuery]);

  const filteredUsers = useMemo(() => users.filter(u => 
    (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.emailId || '').toLowerCase().includes(searchQuery.toLowerCase())
  ), [users, searchQuery]);

  const paginatedData = useMemo(() => {
    const data = currentView === 'equipment-master' ? filteredVehicles : 
                 currentView === 'customer-master' ? filteredCustomers : filteredUsers;
    return data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [currentView, filteredVehicles, filteredCustomers, filteredUsers, currentPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      if (currentView === 'equipment-edit') {
        const targetCustomer = customers.find(c => c.customerName === equipmentForm.customerName);
        const customerCodeToSave = targetCustomer ? targetCustomer.customerCode : '';
        const updatedConfig = {
          ...(selectedItem.equipmentConfig || {}),
          description: equipmentForm.description,
          siteName: equipmentForm.siteName,
          siteCode: equipmentForm.siteCode,
          dealerName: equipmentForm.dealerCode,
          customerCode: customerCodeToSave,
          customerName: equipmentForm.customerName,
          modelCode: equipmentForm.modelCode,
          subCategoryName: equipmentForm.subCategoryName,
          hierarchyName: equipmentForm.parentPositionName,
          batterySerialNo: equipmentForm.batterySerialNo,
          batteryTypeName: equipmentForm.batteryTypeName,
          bmsTypeName: equipmentForm.bmsTypeName,
          immobilizationType: equipmentForm.immobilizationType,
          latitude: parseFloat(equipmentForm.lat),
          longitude: parseFloat(equipmentForm.lng),
          invoiceDate: equipmentForm.invoiceDate,
          manufacturingYear: String(equipmentForm.manufacturingYear),
          active: equipmentForm.active,
          geoFence: equipmentForm.geoFence,
          location: equipmentForm.location,
        };
        const result = await apiService.updateVehicle(selectedItem.id, {
          ...selectedItem,
          displayDeviceId: equipmentForm.equipmentCode,
          registrationNo: equipmentForm.registrationNo,
          chassisNumber: equipmentForm.chassisNo,
          equipmentConfig: updatedConfig
        });
        if (result && result.success) setShowSuccessModal(true);
        else setFormError("Failed to update equipment.");
      } else if (currentView === 'customer-add' || currentView === 'customer-edit') {
         if (customerForm.isUser) {
            if (!customerForm.username || !customerForm.password) {
              setFormError("User credentials required when 'Is User' is selected.");
              setIsSubmitting(false); return;
            }
         }
         const result = await apiService.saveCustomer(customerForm);
         if (result && result.success) setShowSuccessModal(true);
         else setFormError("Failed to save customer data.");
      } else if (currentView === 'user-add' || currentView === 'user-edit') {
         const result = await apiService.saveUser(userForm);
         if (result && result.success) setShowSuccessModal(true);
         else setFormError("Failed to save user data.");
      }
    } catch (err) {
      setFormError("Network communication error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    const target = currentView.includes('equipment') ? 'equipment-master' : currentView.includes('customer') ? 'customer-master' : 'user-master';
    navigateToView(target as AdminView);
    loadData();
  };

  const handleEditClick = (item: any) => {
    setSelectedItem(item);
    if (currentView === 'equipment-master') navigateToView('equipment-edit');
    else if (currentView === 'customer-master') navigateToView('customer-edit');
    else if (currentView === 'user-master') navigateToView('user-edit');
  };

  if (currentView === 'hub') return (
    <div className="h-full w-full bg-[#1e293b] text-white p-8 overflow-y-auto custom-scrollbar font-sans">
      <div className="max-w-[1600px] mx-auto">
        <h2 className="text-sm font-bold mb-8 border-l-2 border-[#00a3ff] pl-3 uppercase">Administrator</h2>
        <div className="space-y-16">
          <Section label="System Config">
            <HubItem label="User Master" onClick={() => navigateToView('user-master')} />
            <HubItem label="User Access Master" />
            <HubItem label="Station Master" />
          </Section>
          <Section label="Company Config">
            <HubItem label="Hierarchy Master" />
            <HubItem label="Site Master" />
            <HubItem label="Product Category Master" />
            <HubItem label="Sub Category Master" />
            <HubItem label="Dealer/Fleet/OEM Master" />
            <HubItem label="Customer Master" onClick={() => navigateToView('customer-master')} />
            <HubItem label="Alerts" />
          </Section>
          <Section label="Equipment Config">
            <HubItem label="Model Master" />
            <HubItem label="Equipment Master" onClick={() => navigateToView('equipment-master')} />
            <HubItem label="Fota" />
            <HubItem label="Immobilization" />
          </Section>
        </div>
      </div>
    </div>
  );

  const isList = currentView === 'equipment-master' || currentView === 'customer-master' || currentView === 'user-master';
  if (isList) {
    const isAsset = currentView === 'equipment-master';
    const isCustomer = currentView === 'customer-master';
    const title = isAsset ? 'Equipment Master' : isCustomer ? 'Customer Master' : 'User Master';
    return (
      <div className="h-full w-full bg-[#1e293b] flex flex-col font-sans">
        <div className="p-4 px-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button onClick={() => navigateToView('hub')} className="text-[#f43f5e]"><ArrowLeft size={18}/></button>
             <h2 className="text-sm font-bold uppercase">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex bg-[#0f172a] rounded overflow-hidden border border-white/10">
               <input 
                type="text" placeholder="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent px-3 py-1.5 text-[11px] outline-none w-48 text-white placeholder:text-slate-600"
               />
               <button className="bg-white p-1 text-[#1e293b] px-2"><Search size={14}/></button>
             </div>
             <div className="flex gap-2">
                {!isAsset && <button onClick={() => navigateToView(isCustomer ? 'customer-add' : 'user-add')} className="bg-[#f43f5e] text-white text-[10px] font-bold px-4 py-2 rounded uppercase flex items-center gap-1.5 shadow-lg"><Plus size={14}/> Add New</button>}
                <button className="bg-slate-700 text-white text-[10px] font-bold px-4 py-2 rounded uppercase flex items-center gap-1.5"><Download size={14}/> Export</button>
             </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto custom-scrollbar p-6">
          <table className="w-full text-[11px] text-left border-collapse">
            <thead className="text-slate-500 uppercase font-black tracking-widest border-b border-white/5">
              <tr>
                {isAsset ? (
                  <>
                    <th className="pb-4">Equipment Code</th>
                    <th className="pb-4">Hardware Id</th>
                    <th className="pb-4">Description</th>
                    <th className="pb-4">Customer</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4 text-center">Actions</th>
                  </>
                ) : isCustomer ? (
                  <>
                    <th className="pb-4">Customer Code</th>
                    <th className="pb-4">Customer Name</th>
                    <th className="pb-4">Phone No</th>
                    <th className="pb-4">Email-ID</th>
                    <th className="pb-4 text-center">Actions</th>
                  </>
                ) : (
                  <>
                    <th className="pb-4">User Name</th>
                    <th className="pb-4">Email ID</th>
                    <th className="pb-4">Role</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4 text-center">Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="text-slate-200">
              {paginatedData.map((item: any, idx) => (
                <tr key={idx} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  {isAsset ? (
                    <>
                      <td className="py-4 font-bold text-[#00a3ff]">{item.displayDeviceId}</td>
                      <td className="py-4 font-mono text-slate-400">{item.id}</td>
                      <td className="py-4">{item.equipmentConfig?.description || '---'}</td>
                      <td className="py-4">{item.equipmentConfig?.customerName || customers.find(c => c.customerCode === item.equipmentConfig?.customerCode)?.customerName || '---'}</td>
                      <td className="py-4"><div className="flex items-center gap-1.5 text-emerald-500"><Check size={14}/> Active</div></td>
                    </>
                  ) : isCustomer ? (
                    <>
                      <td className="py-4 font-bold text-[#00a3ff]">{item.customerCode}</td>
                      <td className="py-4 font-bold">{item.customerName}</td>
                      <td className="py-4">{item.phoneNo}</td>
                      <td className="py-4">{item.emailId}</td>
                    </>
                  ) : (
                    <>
                      <td className="py-4 font-bold text-[#00a3ff]">{item.username}</td>
                      <td className="py-4">{item.emailId}</td>
                      <td className="py-4 uppercase">{item.role}</td>
                      <td className="py-4">{item.isActive ? 'Active' : 'Inactive'}</td>
                    </>
                  )}
                  <td className="py-4 text-center">
                    <button onClick={() => handleEditClick(item)} className="p-1.5 border border-white/10 rounded hover:bg-white/10 text-slate-400 hover:text-white">
                      <Edit3 size={14}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const isUserEdit = currentView.includes('user-');
  const isEquipmentEdit = currentView.includes('equipment-');
  return (
    <div className="h-full w-full bg-[#1e293b] flex flex-col font-sans">
       <div className="p-4 px-8 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-[#f43f5e] font-black uppercase tracking-widest">
            {isUserEdit ? 'Add/Edit User Master' : isEquipmentEdit ? 'Edit Equipment Master' : 'Add/Edit Customer Master'}
          </h2>
          <button onClick={() => navigateToView(isUserEdit ? 'user-master' : isEquipmentEdit ? 'equipment-master' : 'customer-master')} className="bg-slate-700 text-white text-[10px] font-bold px-5 py-2 rounded uppercase shadow-lg">View Master List</button>
       </div>
       <form onSubmit={handleSubmit} className="flex-1 overflow-auto custom-scrollbar p-10 flex flex-col items-center">
          <div className="w-full max-w-5xl">
             {formError && <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-3 text-rose-400 text-[11px] font-bold uppercase"><AlertCircle size={18} />{formError}</div>}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {isUserEdit ? (
                 <>
                   <Field label="User Name" value={userForm.username} onChange={(v: string) => setUserForm((p:any)=>({...p, username: v}))} />
                   <Field label="Email ID" value={userForm.emailId} onChange={(v: string) => setUserForm((p:any)=>({...p, emailId: v}))} />
                   <Field label="Role" type="select" options={['Admin', 'User', 'Customer']} value={userForm.role} onChange={(v: string) => setUserForm((p:any)=>({...p, role: v}))} />
                   {userForm.role === 'Customer' ? (
                     <Field label="Link to Customer" type="select" options={customers.map(c => c.customerName)} value={customers.find(c => c.customerCode === userForm.customerCode)?.customerName || ''} onChange={(v: string) => {
                       const code = customers.find(c => c.customerName === v)?.customerCode || '';
                       setUserForm((p:any)=>({...p, customerCode: code}));
                     }} />
                   ) : userForm.role === 'User' ? (
                     <Field label="Assigned Hardware IDs (Comma-separated)" type="textarea" className="col-span-2" value={userForm.assignedVehicles} onChange={(v: string) => setUserForm((p:any)=>({...p, assignedVehicles: v}))} />
                   ) : null}
                   <Field label="Password" type="password" value={userForm.password} onChange={(v: string) => setUserForm((p:any)=>({...p, password: v}))} />
                   <Field label="Confirm Password" type="password" value={userForm.confirmPassword} onChange={(v: string) => setUserForm((p:any)=>({...p, confirmPassword: v}))} />
                 </>
               ) : isEquipmentEdit ? (
                 <>
                   <Field label="Equipment Code" value={equipmentForm.equipmentCode} onChange={(v: string) => setEquipmentForm((p:any)=>({...p, equipmentCode: v}))} />
                   <Field label="Hardware ID" value={equipmentForm.hardwareId} disabled />
                   <Field label="Customer" type="select" options={customers.map(c => c.customerName)} value={equipmentForm.customerName} onChange={(v: string) => setEquipmentForm((p:any)=>({...p, customerName: v}))} />
                   <Field label="Description" value={equipmentForm.description} onChange={(v: string) => setEquipmentForm((p:any)=>({...p, description: v}))} />
                   <Field label="Site Name" value={equipmentForm.siteName} onChange={(v: string) => setEquipmentForm((p:any)=>({...p, siteName: v}))} />
                   <Field label="Site Code" value={equipmentForm.siteCode} onChange={(v: string) => setEquipmentForm((p:any)=>({...p, siteCode: v}))} />
                   <Field label="Dealer Code" value={equipmentForm.dealerCode} onChange={(v: string) => setEquipmentForm((p:any)=>({...p, dealerCode: v}))} />
                   <Field label="Sub Category" value={equipmentForm.subCategoryName} onChange={(v: string) => setEquipmentForm((p:any)=>({...p, subCategoryName: v}))} />
                   <Field label="Hierarchy" value={equipmentForm.parentPositionName} onChange={(v: string) => setEquipmentForm((p:any)=>({...p, parentPositionName: v}))} />
                   <Field label="Battery Serial" value={equipmentForm.batterySerialNo} onChange={(v: string) => setEquipmentForm((p:any)=>({...p, batterySerialNo: v}))} />
                   <Field label="Battery Type" value={equipmentForm.batteryTypeName} onChange={(v: string) => setEquipmentForm((p:any)=>({...p, batteryTypeName: v}))} />
                   <Field label="BMS Type" value={equipmentForm.bmsTypeName} onChange={(v: string) => setEquipmentForm((p:any)=>({...p, bmsTypeName: v}))} />
                   <Field label="Latitude" value={equipmentForm.lat} onChange={(v: string) => setEquipmentForm((p:any)=>({...p, lat: v}))} />
                   <Field label="Longitude" value={equipmentForm.lng} onChange={(v: string) => setEquipmentForm((p:any)=>({...p, lng: v}))} />
                   <Field label="Invoice Date" type="date" value={equipmentForm.invoiceDate} onChange={(v: string) => setEquipmentForm((p:any)=>({...p, invoiceDate: v}))} />
                   <Field label="Mfg Year" value={equipmentForm.manufacturingYear} onChange={(v: string) => setEquipmentForm((p:any)=>({...p, manufacturingYear: v}))} />
                   <Field label="Reg No" value={equipmentForm.registrationNo} onChange={(v: string) => setEquipmentForm((p:any)=>({...p, registrationNo: v}))} />
                   <Field label="Chassis No" value={equipmentForm.chassisNo} onChange={(v: string) => setEquipmentForm((p:any)=>({...p, chassisNo: v}))} />
                   <Field label="Immobilization Type" value={equipmentForm.immobilizationType} onChange={(v: string) => setEquipmentForm((p:any)=>({...p, immobilizationType: v}))} />
                   <Field label="Location" value={equipmentForm.location} onChange={(v: string) => setEquipmentForm((p:any)=>({...p, location: v}))} />
                   <div className="flex items-center gap-8 py-2">
                     <Field label="Active" type="checkbox" checked={equipmentForm.active} onChange={(v: boolean) => setEquipmentForm((p:any)=>({...p, active: v}))} />
                     <Field label="Geo-Fence" type="checkbox" checked={equipmentForm.geoFence} onChange={(v: boolean) => setEquipmentForm((p:any)=>({...p, geoFence: v}))} />
                   </div>
                 </>
               ) : (
                 <>
                   <Field label="Customer Code" value={customerForm.customerCode} onChange={(v: string) => setCustomerForm((p:any)=>({...p, customerCode: v}))} />
                   <Field label="Customer Name" value={customerForm.customerName} onChange={(v: string) => setCustomerForm((p:any)=>({...p, customerName: v}))} />
                   <Field label="Phone No" value={customerForm.phoneNo} onChange={(v: string) => setCustomerForm((p:any)=>({...p, phoneNo: v}))} />
                   <Field label="WhatsApp No" value={customerForm.whatsappNo} onChange={(v: string) => setCustomerForm((p:any)=>({...p, whatsappNo: v}))} />
                   <Field label="Email-ID" value={customerForm.emailId} onChange={(v: string) => setCustomerForm((p:any)=>({...p, emailId: v}))} />
                   <Field label="Onboard Date" type="date" value={customerForm.onboardDate} onChange={(v: string) => setCustomerForm((p:any)=>({...p, onboardDate: v}))} />
                   <Field label="City" value={customerForm.city} onChange={(v: string) => setCustomerForm((p:any)=>({...p, city: v}))} />
                   <Field label="State" value={customerForm.state} onChange={(v: string) => setCustomerForm((p:any)=>({...p, state: v}))} />
                   <Field label="Country" type="select" options={['India', 'USA']} value={customerForm.country} onChange={(v: string) => setCustomerForm((p:any)=>({...p, country: v}))} />
                   <Field label="Mfg Year" value={customerForm.manufacturingYear} onChange={(v: string) => setCustomerForm((p:any)=>({...p, manufacturingYear: v}))} />
                   <Field label="Timezone" type="select" options={['Asia/Calcutta', 'UTC']} value={customerForm.timezoneName} onChange={(v: string) => setCustomerForm((p:any)=>({...p, timezoneName: v}))} />
                   <Field label="Address" type="textarea" className="col-span-full" value={customerForm.address} onChange={(v: string) => setCustomerForm((p:any)=>({...p, address: v}))} />
                   <div className="col-span-full border-t border-white/5 pt-8 mt-4">
                     <Field label="Create Linked User Account?" type="checkbox" checked={customerForm.isUser} onChange={(v: boolean) => setCustomerForm((p:any)=>({...p, isUser: v}))} />
                   </div>
                   {customerForm.isUser && (
                     <>
                        <Field label="User Identity (Login)" value={customerForm.username} onChange={(v: string) => setCustomerForm((p:any)=>({...p, username: v}))} />
                        <Field label="Login Secret" type="password" value={customerForm.password} onChange={(v: string) => setCustomerForm((p:any)=>({...p, password: v}))} />
                        <Field label="Confirm Secret" type="password" value={customerForm.confirmPassword} onChange={(v: string) => setCustomerForm((p:any)=>({...p, confirmPassword: v}))} />
                     </>
                   )}
                 </>
               )}
             </div>
             <div className="mt-12 flex gap-4 border-t border-white/5 pt-10">
                <button type="submit" disabled={isSubmitting} className="bg-[#f43f5e] text-white text-[11px] font-black px-16 py-3.5 rounded uppercase shadow-xl active:scale-95 transition-all">{isSubmitting ? 'Syncing...' : 'Save Configuration'}</button>
                <button type="button" onClick={() => navigateToView(isUserEdit ? 'user-master' : isEquipmentEdit ? 'equipment-master' : 'customer-master')} className="bg-[#0f172a] text-white border border-white/10 text-[11px] font-bold px-12 py-3.5 rounded uppercase hover:bg-white/5 transition-colors">Cancel</button>
             </div>
          </div>
       </form>
       {showSuccessModal && <SuccessModal message="Master record synchronized successfully." onClose={closeSuccessModal} />}
    </div>
  );
};

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-10 opacity-70">{label}</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-12">{children}</div>
  </div>
);

const HubItem = ({ label, onClick }: { label: string; onClick?: () => void }) => (
  <div className="group cursor-pointer" onClick={onClick}>
    <div className="flex flex-col gap-4">
      <div className="text-white"><Settings size={44} strokeWidth={1.2} className="group-hover:rotate-90 transition-transform duration-700 text-slate-400 group-hover:text-[#00a3ff]" /></div>
      <div className="border-b-2 border-[#00a3ff]/30 group-hover:border-[#00a3ff] pb-1 w-full transition-all"><span className="text-[#00a3ff] font-black text-[14px] tracking-tight group-hover:text-white transition-colors uppercase">{label}</span></div>
    </div>
  </div>
);

const Field = ({ label, value, checked, onChange, type = 'text', options = [], disabled, className = '' }: any) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className={`flex flex-col gap-2 ${className} ${type === 'checkbox' ? 'flex-row items-center gap-4' : ''}`}>
      <label className={`text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] ${type === 'checkbox' ? 'order-2 mb-0' : 'mb-0'}`}>
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea value={value || ''} onChange={e => onChange?.(e.target.value)} disabled={disabled} className="bg-[#0f172a] border border-white/10 rounded-lg px-4 py-3 text-xs text-white h-24 outline-none focus:ring-1 focus:ring-[#00a3ff]/40 transition-all" />
      ) : type === 'select' ? (
        <select value={value || ''} onChange={e => onChange?.(e.target.value)} disabled={disabled} className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-4 py-3 text-xs text-white outline-none focus:ring-1 focus:ring-[#00a3ff]/40 appearance-none bg-no-repeat bg-[right_1rem_center] transition-all">
          <option value="">Select Option...</option>
          {options.map((o:any) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === 'checkbox' ? (
        <input type="checkbox" checked={checked} onChange={e => onChange?.(e.target.checked)} disabled={disabled} className="w-6 h-6 bg-[#0f172a] border border-white/10 rounded-md outline-none accent-[#f43f5e] cursor-pointer" />
      ) : (
        <div className="relative">
          <input type={isPassword ? (showPassword ? 'text' : 'password') : type} value={value || ''} onChange={e => onChange?.(e.target.value)} disabled={disabled} className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-4 py-3 text-xs text-white outline-none focus:ring-1 focus:ring-[#00a3ff]/40 transition-all placeholder:text-slate-800" />
          {isPassword && <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors">{showPassword ? <Eye size={16}/> : <EyeOff size={16}/>}</button>}
        </div>
      )}
    </div>
  );
};

const SuccessModal = ({ message, onClose }: { message: string, onClose: () => void }) => (
  <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center font-sans">
    <div className="bg-[#1e293b] rounded-3xl border border-white/10 p-12 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
       <div className="w-20 h-20 bg-emerald-500/10 rounded-full border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-8 shadow-inner"><Check size={40} className="text-emerald-500" strokeWidth={4} /></div>
       <h3 className="text-2xl font-black text-white mb-3 tracking-tighter uppercase">Success</h3>
       <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-10">{message}</p>
       <button onClick={onClose} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 active:scale-95 transition-all">Acknowledge</button>
    </div>
  </div>
);

export default Admin;