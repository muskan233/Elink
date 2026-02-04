
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Calendar as CalendarIcon, Clock, X } from 'lucide-react';

interface DateTimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSet: (from: string, to: string) => void;
  initialFrom: string;
  initialTo: string;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({ isOpen, onClose, onSet, initialFrom, initialTo }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [fromDateTime, setFromDateTime] = useState(new Date(initialFrom));
  const [toDateTime, setToDateTime] = useState(new Date(initialTo));
  const [activeSide, setActiveSide] = useState<'from' | 'to'>('from');

  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    return { firstDay, days };
  }, [viewDate]);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const handleDateClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    if (activeSide === 'from') {
      newDate.setHours(fromDateTime.getHours(), fromDateTime.getMinutes());
      setFromDateTime(newDate);
      setActiveSide('to');
    } else {
      newDate.setHours(toDateTime.getHours(), toDateTime.getMinutes());
      setToDateTime(newDate);
    }
  };

  const adjustTime = (type: 'h' | 'm', amount: number, side: 'from' | 'to') => {
    const target = side === 'from' ? new Date(fromDateTime) : new Date(toDateTime);
    if (type === 'h') {
      target.setHours((target.getHours() + amount + 24) % 24);
    } else {
      target.setMinutes((target.getMinutes() + amount + 60) % 60);
    }
    side === 'from' ? setFromDateTime(target) : setToDateTime(target);
  };

  const formatDisplay = (date: Date) => {
    return date.toLocaleString('en-US', { 
      month: 'numeric', day: 'numeric', year: 'numeric', 
      hour: 'numeric', minute: '2-digit', hour12: true 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
      <div className="bg-[#ffffff] text-[#334155] w-full max-w-[280px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 rounded-none">
        
        {/* Compact Calendar Header */}
        <div className="p-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-1 hover:bg-slate-100 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-1 font-bold text-sm">
            <span>{monthNames[viewDate.getMonth()]}</span>
            <span>{viewDate.getFullYear()}</span>
            <ChevronDown size={12} className="mt-0.5" />
          </div>
          <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-1 hover:bg-slate-100 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Compact Days of week */}
        <div className="grid grid-cols-7 px-2 pt-1 text-center text-[9px] font-bold text-slate-400">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="py-1">{d}</div>)}
        </div>

        {/* Compact Calendar Grid */}
        <div className="grid grid-cols-7 px-2 pb-2 text-center">
          {Array.from({ length: daysInMonth.firstDay }).map((_, i) => <div key={`empty-${i}`} className="py-1 opacity-10 text-[10px]">28</div>)}
          {Array.from({ length: daysInMonth.days }).map((_, i) => {
            const day = i + 1;
            const currentDayDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
            
            const isFrom = fromDateTime.toDateString() === currentDayDate.toDateString();
            const isTo = toDateTime.toDateString() === currentDayDate.toDateString();
            const isInRange = currentDayDate > fromDateTime && currentDayDate < toDateTime;

            return (
              <button 
                key={day} 
                onClick={() => handleDateClick(day)}
                className={`py-1 text-[10px] relative group ${isInRange ? 'bg-slate-50' : ''}`}
              >
                <div className={`
                  w-6 h-6 mx-auto flex items-center justify-center rounded-full transition-all relative z-10
                  ${isFrom || isTo ? 'bg-slate-600 text-white shadow-md' : 'hover:bg-slate-100'}
                  ${isFrom && isTo ? 'bg-indigo-600' : ''}
                `}>
                  {day}
                </div>
              </button>
            );
          })}
        </div>

        {/* Compact Time Selector */}
        <div className="border-t border-slate-100 p-3 flex flex-col items-center bg-slate-50/30">
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <button onClick={() => adjustTime('h', 1, activeSide)} className="p-0.5 hover:text-indigo-600"><ChevronUp size={16} /></button>
              <div className="text-xl font-mono border border-slate-200 bg-white px-2 py-1 shadow-inner min-w-[40px] text-center">
                {(activeSide === 'from' ? fromDateTime : toDateTime).getHours().toString().padStart(2, '0')}
              </div>
              <button onClick={() => adjustTime('h', -1, activeSide)} className="p-0.5 hover:text-indigo-600"><ChevronDown size={16} /></button>
            </div>
            <div className="text-xl font-black mb-1">:</div>
            <div className="flex flex-col items-center">
              <button onClick={() => adjustTime('m', 1, activeSide)} className="p-0.5 hover:text-indigo-600"><ChevronUp size={16} /></button>
              <div className="text-xl font-mono border border-slate-200 bg-white px-2 py-1 shadow-inner min-w-[40px] text-center">
                {(activeSide === 'from' ? fromDateTime : toDateTime).getMinutes().toString().padStart(2, '0')}
              </div>
              <button onClick={() => adjustTime('m', -1, activeSide)} className="p-0.5 hover:text-indigo-600"><ChevronDown size={16} /></button>
            </div>
          </div>
          <div className="mt-1 text-[8px] font-black uppercase text-indigo-500 tracking-widest">
            Adjusting {activeSide}
          </div>
        </div>

        {/* Compact Range Summary */}
        <div className="p-3 border-t border-slate-100 text-[9px] space-y-1 bg-white">
          <div className="flex justify-between items-center group cursor-pointer" onClick={() => setActiveSide('from')}>
            <span className="text-slate-400 font-bold uppercase tracking-tighter">From:</span>
            <span className={`font-mono font-bold ${activeSide === 'from' ? 'text-indigo-600' : 'text-slate-700'}`}>
              {formatDisplay(fromDateTime)}
            </span>
          </div>
          <div className="flex justify-between items-center group cursor-pointer" onClick={() => setActiveSide('to')}>
            <span className="text-slate-400 font-bold uppercase tracking-tighter">To:</span>
            <span className={`font-mono font-bold ${activeSide === 'to' ? 'text-indigo-600' : 'text-slate-700'}`}>
              {formatDisplay(toDateTime)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex border-t border-slate-100 bg-white">
          <button 
            onClick={onClose}
            className="flex-1 py-2 text-[11px] font-bold text-sky-500 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <div className="w-px bg-slate-100"></div>
          <button 
            onClick={() => onSet(fromDateTime.toISOString(), toDateTime.toISOString())}
            className="flex-1 py-2 text-[11px] font-bold text-sky-500 hover:bg-slate-50 transition-colors"
          >
            Set
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateTimePicker;
