import React, { useState, useEffect, useMemo, useRef, useCallback, useContext } from 'react';
// @ts-ignore
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Vehicle } from '../types';
import axios from 'axios';
import { 
  ArrowLeft, Search, Loader2, Database, ChevronsUpDown, Calendar,
  FileSpreadsheet, Download, RefreshCw
} from 'lucide-react';
import DateTimePicker from '../components/UI/DateTimePicker';
import { AuthContext } from '../App';

/**
 * Optimized Registry Columns for TOR API
 */
const REPORT_COLUMNS = [
  "ENTRYDATE", "DeviceDate", "HWID", "ModelNumber", "Latitude", "Longitude", 
  "StateofCharge", "TimetoCharge", "DistancetoEmpty1", "KeyOnSignal", 
  "BattFaultlight", "BattTemp", "BatteryTemp", "BatteryFault", "BattHighTemp", "HighCutOffTemp", 
  "BattLowTemp", "BattLowCutoffTemp", "BattCutoffOverVoltage", "BattOverVoltage", 
  "BattLowVoltage", "BattCutoffLowVoltage", "OutputVoltageFailure", "BattInternalFailure", 
  "PositiveBusbarHighTemp", "NegativeBusbarHighTemp", "PositiveBusbarOverTemp", 
  "NegativeBusbarOverTemp", "LowSOCDuringKeyON", "LowSOCDuringDrive", "TCUCommFailure", 
  "DriveCurrentLimit", "BattCurrent", "RegenCurrentLimit", "Vehiclemoderequest", 
  "MinCellVoltage", "MaxCellVoltage", "BattCurrent1", "AmpHour", "KWattHour", 
  "kWh", "BatteryVoltage", "Odometer", "BatteryChargingIndication1", "MotorTem", 
  "MotorTemp", "Speed", "DriveMode", "VehicleMode", "RegenFlag", 
  "Battery_swapping_successful", "Battery_State", "SPEEDOVRGND", "InputSuppy", 
  "RSSI", "MachineStatus", "Sudden_acceleration", "Sudden_breaking", 
  "HarshDriving", "isCharging", "Immobilization_status", "sigChargingTime", "ControllerTemperature", "ControllerTemp"
];

const Report: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const isMounted = useRef(true);
  const autoSynced = useRef(false);
  
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  
  // Default range: Today (00:00 to current)
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString());

  const getLogValue = (log: any, key: string) => {
    const src = log.rawTor || log;
    if (src[key] !== undefined && src[key] !== null) return src[key];
    
    // Case-insensitive / Nested fallback
    const lowerKey = key.toLowerCase();
    const found = Object.keys(src).find(k => k.toLowerCase() === lowerKey);
    if (found) return src[found];

    // Deep nested metrics fallback
    if (log.metrics && log.metrics[key] !== undefined) return log.metrics[key];
    
    return '---';
  };

  const parseTorDate = (str: any): number => {
    if (!str || typeof str !== 'string' || str === '---') return 0;
    return new Date(str).getTime() || 0;
  };

  const fetchData = useCallback(async () => {
    if (!id || !isMounted.current) return;
    try {
      const data = await apiService.getVehicleDetails(id);
      if (isMounted.current && data) {
        setVehicle(data);
        setLogs(data.history || []);
      }
    } catch (e) {
      console.error("[REPORT] Fetch Error:", e);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [id]);

  const handleSyncRange = async (customFrom?: string, customTo?: string) => {
    if (!id || syncing) return;
    setSyncing(true);
    const from = customFrom || fromDate;
    const to = customTo || toDate;

    try {
      const res = await axios.post(`http://localhost:5000/api/telemetry/${id}/sync-history`, { from, to });
      const jobId = res.data.jobId;
      if (jobId) {
        const poll = setInterval(async () => {
          try {
            const prog = await axios.get(`http://localhost:5000/api/sync-progress/${jobId}`);
            if (!isMounted.current) return clearInterval(poll);
            
            if (prog.data.status === 'done' || prog.data.status === 'error') {
              clearInterval(poll);
              setSyncing(false);
              await fetchData();
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
  };

  useEffect(() => {
    isMounted.current = true;
    fetchData().then(() => {
        // Automatically sync initial 1-day data if local is sparse
        if (!autoSynced.current && id) {
            autoSynced.current = true;
            handleSyncRange();
        }
    });
    return () => { isMounted.current = false; };
  }, [id, fetchData]);

  const filteredLogs = useMemo(() => {
    let result = [...logs];
    if (filterText) {
      const q = filterText.toLowerCase();
      result = result.filter(log => JSON.stringify(log).toLowerCase().includes(q));
    }
    return result.sort((a, b) => {
        // Use ENTRYDATE or fall back to DeviceDate for sorting
        const tA = parseTorDate(getLogValue(a, "ENTRYDATE") !== '---' ? getLogValue(a, "ENTRYDATE") : getLogValue(a, "DeviceDate"));
        const tB = parseTorDate(getLogValue(b, "ENTRYDATE") !== '---' ? getLogValue(b, "ENTRYDATE") : getLogValue(b, "DeviceDate"));
        return tB - tA;
    });
  }, [logs, filterText]);

  const paginatedLogs = filteredLogs.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);
  const totalPages = Math.ceil(filteredLogs.length / entriesPerPage) || 1;

  const handleDownloadCSV = () => {
    if (!filteredLogs.length) return;
    const headers = REPORT_COLUMNS.join(',');
    const rows = filteredLogs.map(log => REPORT_COLUMNS.map(key => {
      const val = getLogValue(log, key);
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')).join('\n');
    const blob = new Blob(["\uFEFF" + headers + "\n" + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Full_Report_${vehicle?.displayDeviceId || id}.csv`;
    link.click();
  };

  return (
    <div className="h-screen w-full bg-[#020617] flex flex-col font-sans text-slate-200 overflow-hidden">
      <DateTimePicker 
        isOpen={isPickerOpen} 
        onClose={() => setIsPickerOpen(false)} 
        onSet={(f, t) => { 
            setFromDate(f); 
            setToDate(t); 
            setIsPickerOpen(false); 
            setCurrentPage(1); 
            handleSyncRange(f, t); 
        }} 
        initialFrom={fromDate} 
        initialTo={toDate} 
      />

      <header className="bg-[#0f172a] border-b border-white/5 px-8 py-5 flex items-center justify-between shadow-2xl z-50">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/dashboard')} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl border border-white/5 transition-all"><ArrowLeft size={18} /></button>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-white italic tracking-tight uppercase flex items-center gap-2.5">
               <FileSpreadsheet size={20} className="text-indigo-400" /> Information Report
            </h1>
            <div className="flex gap-4 items-center mt-1 text-[9px] font-black uppercase tracking-widest text-slate-500">
               <span className="text-indigo-400">CHASSIS: {vehicle?.chassisNumber || '---'}</span>
               <span className="text-indigo-400">REG: {vehicle?.registrationNo || '---'}</span>
               <span className="text-slate-400">NODE: {vehicle?.displayDeviceId || id}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
           {syncing && (
             <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-xl animate-in fade-in">
                <Loader2 size={14} className="animate-spin text-indigo-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Cloud Link Active...</span>
             </div>
           )}
           <button onClick={handleDownloadCSV} disabled={!filteredLogs.length} className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50">
              <Download size={20} />
           </button>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-hidden flex flex-col">
        <div className="bg-[#0f172a] rounded-[2rem] border border-white/5 flex flex-col flex-1 overflow-hidden shadow-2xl relative">
          
          <div className="p-5 flex items-center justify-between gap-4 border-b border-white/5 bg-[#1e293b]/20 backdrop-blur-md">
            <div className="flex items-center gap-6">
                <button onClick={() => setIsPickerOpen(true)} className="flex items-center gap-3 bg-[#020617] border border-white/10 px-4 py-2 rounded-lg text-[10px] font-black text-slate-300 uppercase tracking-widest hover:border-indigo-500/50 transition-all">
                  <Calendar size={14} className="text-indigo-400" />
                  <span>{new Date(fromDate).toLocaleString()} - {new Date(toDate).toLocaleString()}</span>
                </button>
                <div className="relative w-80">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                    <input type="text" placeholder="Filter parameters..." value={filterText} onChange={(e) => { setFilterText(e.target.value); setCurrentPage(1); }} className="bg-[#020617]/50 border border-white/10 rounded-xl px-4 pl-11 py-2.5 text-xs w-full text-slate-300 placeholder:text-slate-700 outline-none"/>
                </div>
            </div>
            <div className="flex items-center gap-4 text-[9px] font-bold uppercase text-slate-500">
               <span>Registry Records: {filteredLogs.length}</span>
               <RefreshCw size={14} onClick={() => handleSyncRange()} className={`cursor-pointer hover:text-white transition-all ${syncing ? 'animate-spin' : ''}`} />
            </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar relative">
            <table className="w-full text-left border-collapse min-w-[15000px]">
                <thead className="bg-[#020617]/90 backdrop-blur-md sticky top-0 z-30 border-b border-white/10">
                    <tr className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
                        {REPORT_COLUMNS.map((key, idx) => (
                            <th key={idx} className={`p-5 border-r border-white/5 whitespace-nowrap ${key === 'ENTRYDATE' || key === 'DeviceDate' ? 'sticky left-0 bg-[#020617] z-40 shadow-[2px_0_10px_rgba(0,0,0,0.8)]' : ''}`}>
                                <div className="flex items-center gap-2">{key}<ChevronsUpDown size={10} className="opacity-20" /></div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                    {paginatedLogs.map((log, idx) => (
                        <tr key={idx} className="hover:bg-indigo-500/[0.03] text-[10px] font-mono group transition-colors">
                            {REPORT_COLUMNS.map((key, cIdx) => (
                                <td key={cIdx} className={`p-4 px-6 border-r border-white/[0.01] truncate ${key === 'ENTRYDATE' || key === 'DeviceDate' ? 'sticky left-0 bg-[#0f172a] z-20 text-indigo-400 font-black' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                    {String(getLogValue(log, key))}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            {loading && !syncing && logs.length === 0 && (
                <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-xl flex flex-col items-center justify-center gap-6 z-40">
                    <Loader2 size={64} className="animate-spin text-indigo-500" />
                    <span className="text-[12px] font-black uppercase tracking-[0.4em] text-white">Contacting Cloud Node...</span>
                </div>
            )}
            
            {!loading && !syncing && filteredLogs.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30 gap-4">
                    <Database size={64} />
                    <span className="text-xs font-black uppercase tracking-widest">Registry empty. Adjust range and "Sync Cloud Range".</span>
                </div>
            )}
          </div>

          <footer className="p-6 border-t border-white/5 bg-[#020617]/50 flex items-center justify-between z-50">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                Showing {filteredLogs.length > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0} to {Math.min(currentPage * entriesPerPage, filteredLogs.length)} of {filteredLogs.length.toLocaleString()} entries
            </span>
            <div className="flex items-center gap-2">
               <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-2 bg-slate-800 rounded-lg text-[9px] font-black uppercase disabled:opacity-10 hover:bg-slate-700 transition-all">Prev</button>
               <div className="px-4 font-mono text-[11px] font-black text-indigo-400">{currentPage} / {totalPages}</div>
               <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 bg-slate-800 rounded-lg text-[9px] font-black uppercase disabled:opacity-10 hover:bg-slate-700 transition-all">Next</button>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Report;