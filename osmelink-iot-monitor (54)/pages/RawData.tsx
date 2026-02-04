
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
// @ts-ignore
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { Vehicle } from '../types';
import axios from 'axios';
import { 
  Download, Loader2, ChevronDown, 
  Activity, FileSpreadsheet, RefreshCw, Calendar,
  ChevronsUpDown, CheckCircle2
} from 'lucide-react';
// @ts-ignore
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush, Legend } from 'recharts';
import DateTimePicker from '../components/UI/DateTimePicker';

/**
 * Full set of parameters for the Graph as per Image 2
 */
const GRAPH_PARAMS = [
  { id: 'BatteryVoltage', label: 'Battery V (V)', color: '#6366f1' },
  { id: 'Speed', label: 'Vehicle Speed (km/h)', color: '#06b6d4' },
  { id: 'Odometer', label: 'Odometer (kms)', color: '#f43f5e' },
  { id: 'StateofCharge', label: 'SoC (%)', color: '#3b82f6' },
  { id: 'BattCurrent', label: 'Battery current (A)', color: '#1e3a8a' },
  { id: 'MaxCellVoltage', label: 'Max. Cell V (V)', color: '#064e3b' },
  { id: 'MinCellVoltage', label: 'Min. Cell V (V)', color: '#10b981' },
  { id: 'kWh', label: 'Available Energy', color: '#4c1d95' },
  { id: 'BattCurrent1', label: 'Battery Current 1', color: '#f59e0b' },
  { id: 'BattTemp', label: 'Battery Temperature', color: '#a78bfa' },
  { id: 'ControllerTemperature', label: 'Controller Temperature', color: '#ec4899' },
  { id: 'DistancetoEmpty1', label: 'DTE1', color: '#8b5cf6' },
  { id: 'MotorTem', label: 'Motor Temperature', color: '#d946ef' },
  { id: 'SPEEDOVRGND', label: 'Speed Over Ground', color: '#475569' },
];

/**
 * Full 57-parameter set for the Report Table
 */
const REPORT_COLUMNS = [
  "ENTRYDATE", "DeviceDate", "HWID", "ModelNumber", "Latitude", "Longitude", 
  "StateofCharge", "TimetoCharge", "DistancetoEmpty1", "KeyOnSignal", 
  "BattFaultlight", "BattTemp", "BatteryFault", "BattHighTemp", "HighCutOffTemp", 
  "BattLowTemp", "BattLowCutoffTemp", "BattCutoffOverVoltage", "BattOverVoltage", 
  "BattLowVoltage", "BattCutoffLowVoltage", "OutputVoltageFailure", "BattInternalFailure", 
  "PositiveBusbarHighTemp", "NegativeBusbarHighTemp", "PositiveBusbarOverTemp", 
  "NegativeBusbarOverTemp", "LowSOCDuringKeyON", "LowSOCDuringDrive", "TCUCommFailure", 
  "DriveCurrentLimit", "BattCurrent", "RegenCurrentLimit", "Vehiclemoderequest", 
  "MinCellVoltage", "MaxCellVoltage", "BattCurrent1", "AmpHour", "KWattHour", 
  "kWh", "BatteryVoltage", "Odometer", "MCUTem", "MotorTem", "Speed", 
  "DriveMode", "RegenFlag", "Battery_swapping_successful", "Battery_State", 
  "InputSuppy", "RSSI", "MachineStatus", "Sudden_acceleration", "Sudden_breaking", 
  "HarshDriving", "isCharging", "Immobilization_status", "ControllerTemperature"
];

const RawData: React.FC = () => {
  const [searchParams] = useSearchParams();
  const vehicleIdFromUrl = searchParams.get('id');
  const tabFromUrl = searchParams.get('tab');

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicleIdFromUrl || '');
  const [activeTab, setActiveTab] = useState<'view' | 'download'>(tabFromUrl === 'download' ? 'download' : 'view');
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const isMounted = useRef(true);
  const lastAutoSyncedVehicle = useRef<string | null>(null);

  // Visibility state for the lines in the graph
  const [visibleLines, setVisibleLines] = useState<string[]>(['BatteryVoltage', 'Speed', 'StateofCharge', 'BattCurrent']);

  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() - 24);
    return d.toISOString();
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString());

  const getLogValue = (log: any, key: string) => {
    const src = log.rawTor || log;
    if (src[key] !== undefined && src[key] !== null) return src[key];
    const lowerKey = key.toLowerCase();
    const found = Object.keys(src).find(k => k.toLowerCase() === lowerKey);
    return found ? src[found] : null;
  };

  const parseTorDate = (str: any): number => {
    if (!str || typeof str !== 'string') return 0;
    const iso = new Date(str).getTime();
    if (!isNaN(iso)) return iso;
    // Handle DD-MM-YYYY
    const match = str.match(/^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/);
    if (match) {
      const [_, day, month, year, h, m, s] = match;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(h || '0'), parseInt(m || '0'), parseInt(s || '0')).getTime();
    }
    return 0;
  };

  const fetchData = useCallback(async (showLoading = false) => {
    if (!selectedVehicleId) return;
    if (showLoading) setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/telemetry/${selectedVehicleId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (isMounted.current && data) {
        setLogs(data.history || []);
      }
    } catch (e) {
      setLogs([]);
    } finally {
      if (showLoading && isMounted.current) setLoading(false);
    }
  }, [selectedVehicleId]);

  const handleCloudSync = useCallback(async (fDate?: string, tDate?: string) => {
    if (!selectedVehicleId || syncing) return;
    setSyncing(true);
    const from = fDate || fromDate;
    const to = tDate || toDate;
    try {
      const res = await axios.post(`http://localhost:5000/api/telemetry/${selectedVehicleId}/sync-history`, { from, to });
      const jobId = res.data.jobId;
      if (jobId) {
        const poll = setInterval(async () => {
          try {
            const prog = await axios.get(`http://localhost:5000/api/sync-progress/${jobId}`);
            if (!isMounted.current) return clearInterval(poll);
            if (prog.data.status === 'done' || prog.data.status === 'error') {
              clearInterval(poll);
              setSyncing(false);
              await fetchData(true);
            }
          } catch (e) {
            clearInterval(poll);
            setSyncing(false);
          }
        }, 1500);
      }
    } catch (err) {
      setSyncing(false);
    }
  }, [selectedVehicleId, syncing, fromDate, toDate, fetchData]);

  useEffect(() => {
    isMounted.current = true;
    apiService.getAllVehicles().then(data => {
      setVehicles(data || []);
      if (data?.length > 0 && !selectedVehicleId) setSelectedVehicleId(data[0].id);
    });
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [selectedVehicleId, fetchData]);

  // Automatic Cloud Sync on vehicle selection (Last 24H)
  useEffect(() => {
    if (selectedVehicleId && selectedVehicleId !== lastAutoSyncedVehicle.current) {
        lastAutoSyncedVehicle.current = selectedVehicleId;
        const now = new Date();
        const past = new Date();
        past.setHours(past.getHours() - 24);
        setFromDate(past.toISOString());
        setToDate(now.toISOString());
        handleCloudSync(past.toISOString(), now.toISOString());
    }
  }, [selectedVehicleId, handleCloudSync]);

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  const chartData = useMemo(() => {
    return [...logs].map(log => {
      const ts = getLogValue(log, 'ENTRYDATE') || getLogValue(log, 'DeviceDate') || '---';
      const row: any = { 
        timestampLabel: ts ? (String(ts).includes('-') ? ts.split(' ')[1] || ts : new Date(ts).toLocaleTimeString()) : '---',
        fullDate: ts 
      };
      GRAPH_PARAMS.forEach(p => {
        const val = getLogValue(log, p.id);
        row[p.id] = val !== null ? parseFloat(val) : 0;
      });
      return row;
    }).sort((a, b) => parseTorDate(a.fullDate) - parseTorDate(b.fullDate));
  }, [logs]);

  const handleDownloadCSV = () => {
    if (!logs.length) return;
    const headers = REPORT_COLUMNS.join(',');
    const rows = logs.map(log => REPORT_COLUMNS.map(key => {
      const val = getLogValue(log, key);
      return `"${String(val ?? '---').replace(/"/g, '""')}"`;
    }).join(',')).join('\n');
    const blob = new Blob(["\uFEFF" + headers + "\n" + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Report_${selectedVehicle?.displayDeviceId || selectedVehicleId}.csv`;
    link.click();
  };

  const toggleLine = (id: string) => {
    setVisibleLines(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="h-full flex flex-col bg-[#f0f2f5] font-sans overflow-hidden">
      <DateTimePicker 
        isOpen={isPickerOpen} 
        onClose={() => setIsPickerOpen(false)} 
        onSet={(f, t) => { 
          setFromDate(f); 
          setToDate(t); 
          setIsPickerOpen(false); 
          handleCloudSync(f, t); 
        }} 
        initialFrom={fromDate} 
        initialTo={toDate} 
      />

      {/* Asset Selector Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 shadow-sm z-50">
        <div className="relative flex-1 max-w-xl">
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
            className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 cursor-pointer hover:border-indigo-400 transition-all text-xs font-bold text-slate-700"
          >
            <span className="truncate">
              {selectedVehicle ? `${selectedVehicle.displayDeviceId} | ${selectedVehicle.chassisNumber} | ${selectedVehicle.registrationNo || ''}` : 'Select Asset Master...'}
            </span>
            <ChevronDown size={14} className="text-slate-400" />
          </div>
          {isDropdownOpen && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-[200] max-h-64 overflow-y-auto p-1 animate-in slide-in-from-top-2">
              <input type="text" placeholder="Search node..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 border-b outline-none mb-1 rounded font-medium" onClick={(e) => e.stopPropagation()}/>
              {vehicles.filter(v => v.id.toLowerCase().includes(searchQuery.toLowerCase()) || v.displayDeviceId.toLowerCase().includes(searchQuery.toLowerCase())).map(v => (
                <div key={v.id} onClick={() => { setSelectedVehicleId(v.id); setIsDropdownOpen(false); }} className="px-4 py-2.5 hover:bg-indigo-50 cursor-pointer text-[11px] font-bold text-slate-700 rounded-lg">
                  {v.displayDeviceId} | {v.chassisNumber}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View/Download Switcher & Controls */}
      <div className="bg-white px-6 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex gap-1 pt-1">
          <button onClick={() => setActiveTab('view')} className={`px-8 py-3 text-xs font-bold uppercase tracking-widest transition-all relative ${activeTab === 'view' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
            View {activeTab === 'view' && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-t-full"></div>}
          </button>
          <button onClick={() => setActiveTab('download')} className={`px-8 py-3 text-xs font-bold uppercase tracking-widest transition-all relative ${activeTab === 'download' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
            Download {activeTab === 'download' && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-t-full"></div>}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:border-indigo-300" onClick={() => setIsPickerOpen(true)}>
            <Calendar size={14} className="text-indigo-500" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Today</span>
            <ChevronDown size={12} className="text-slate-400" />
          </div>
          <button onClick={() => handleCloudSync()} disabled={syncing} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-md">
            {syncing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Search
          </button>
          <button onClick={handleDownloadCSV} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border border-indigo-100"><Download size={18} /></button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'view' ? (
          <div className="flex-1 flex flex-col bg-white overflow-hidden p-6 relative">
               {(loading || syncing) && <div className="absolute inset-0 bg-white/60 z-50 flex flex-col items-center justify-center backdrop-blur-[1px]">
                  <Loader2 className="animate-spin text-indigo-600 mb-2" size={32} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {syncing ? 'Loading...' : 'Loading...'}
                  </span>
               </div>}
               
               {chartData.length > 0 ? (
                 <div className="h-full flex flex-col">
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="timestampLabel" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }} />
                          {GRAPH_PARAMS.map(p => visibleLines.includes(p.id) && (
                            <Line key={p.id} type="monotone" dataKey={p.id} stroke={p.color} strokeWidth={1.5} dot={false} animationDuration={500} />
                          ))}
                          <Brush dataKey="timestampLabel" height={30} stroke="#cbd5e1" fill="#f8fafc" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Legend / Toggles exactly like Image 2 */}
                    <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-3 px-10 pb-4 border-t border-slate-50 pt-4">
                      {GRAPH_PARAMS.map(p => (
                        <button 
                          key={p.id} 
                          onClick={() => toggleLine(p.id)} 
                          className={`flex items-center gap-2 transition-all ${visibleLines.includes(p.id) ? 'opacity-100 scale-105' : 'opacity-30 grayscale'}`}
                        >
                           <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: p.color }}></div>
                           <span className="text-[9px] font-black uppercase text-slate-600 tracking-wider">{p.label}</span>
                        </button>
                      ))}
                    </div>
                 </div>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center opacity-30 text-slate-400">
                    <Activity size={64} className="mb-4" />
                    <p className="font-bold uppercase tracking-widest text-xs">No data for selected time period</p>
                 </div>
               )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            <div className="flex-1 overflow-auto custom-scrollbar relative">
              <table className="w-full text-left border-collapse min-w-[15000px]">
                <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">
                  <tr className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                    {REPORT_COLUMNS.map((key, idx) => (
                      <th key={idx} className={`px-5 py-4 border-r border-slate-100 ${idx === 0 ? 'sticky left-0 bg-slate-50 z-20 shadow-md' : ''}`}>
                        <div className="flex items-center gap-2">{key}<ChevronsUpDown size={10} className="opacity-20" /></div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[10px] font-mono">
                  {logs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      {REPORT_COLUMNS.map((key, cIdx) => {
                        const val = getLogValue(log, key);
                        return (
                          <td key={cIdx} className={`px-5 py-3 border-r border-slate-50 truncate max-w-[200px] ${cIdx === 0 ? 'sticky left-0 bg-white font-bold text-indigo-600' : 'text-slate-600'}`}>
                            {val !== null ? String(val) : '---'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {logs.length === 0 && !loading && !syncing && (
                <div className="p-20 text-center flex flex-col items-center justify-center gap-4 text-slate-300 h-full">
                  <FileSpreadsheet size={48} className="opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">No registry records found. Use Cloud Sync to populate history.</p>
                </div>
              )}
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0 flex items-center gap-4">
               <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /> Registry Verified</span>
               <span>Rows Loaded: {logs.length.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RawData;
