
import React from 'react';
import { BarChart3 } from 'lucide-react';

const Trends: React.FC = () => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-[#0f172a] text-white">
      <div className="p-8 bg-indigo-500/10 rounded-full border border-indigo-500/20 mb-6">
        <BarChart3 size={48} className="text-indigo-400" />
      </div>
      <h2 className="text-xl font-black uppercase tracking-widest">Predictive Trends</h2>
      <p className="text-slate-500 text-[10px] mt-4 uppercase font-black tracking-[0.3em]">Analyzing long-term fleet performance patterns</p>
    </div>
  );
};

export default Trends;
