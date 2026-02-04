import React, { useContext, useState } from 'react';
import { AuthContext } from '../App';
import { apiService } from '../services/api';
import { Truck, Lock, User, ArrowRight, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await apiService.login(formData);
      if (response && response.success) {
        login(response.user);
      } else {
        setError("Invalid credentials. Please verify your username and password.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Authentication service unavailable.");
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-indigo-200 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 -right-20 w-[600px] h-[600px] bg-sky-100 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-10 relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-indigo-600 p-3.5 rounded-2xl shadow-xl shadow-indigo-100 mb-5 text-white">
            <Truck className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tighter">OSM <span className="text-indigo-600">eLink</span></h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Fleet Management Platform</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-500 text-[11px] font-medium animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={14} className="flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-widest">Username</label>
            <div className="relative group">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input
                name="username"
                type="text"
                required
                autoFocus
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300 text-sm"
                placeholder="Enter Username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-widest">Password</label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-12 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300 text-sm"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-xl shadow-indigo-200/50 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed uppercase text-[11px] tracking-widest"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                Sign In
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-slate-100 text-center">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
              © 2025 OsmeLink Systems • v2.9.6
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;