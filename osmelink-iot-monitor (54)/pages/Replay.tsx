
import React from 'react';
import { RotateCcw } from 'lucide-react';

const Replay: React.FC = () => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-[#0f172a] text-white">
      <div className="p-8 bg-indigo-500/10 rounded-full border border-indigo-500/20 mb-6">
        <RotateCcw size={48} className="text-indigo-400 animate-spin-slow" />
      </div>
      <h2 className="text-xl font-black uppercase tracking-widest">Historical Replay</h2>
      <p className="text-slate-500 text-[10px] mt-4 uppercase font-black tracking-[0.3em]">Operational Node: Latent</p>
    </div>
  );
};

export default Replay;
