import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, ArrowRight, Chrome, Check, ShieldCheck } from 'lucide-react';

export default function Login() {
  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password, remember);
      } else if (mode === 'register') {
        await registerWithEmail(email, password);
      }
    } catch (err: any) {
      if (err.message && err.message.includes('auth/invalid-credential')) {
        setError('Sai email hoặc mật khẩu.');
      } else if (err.message && err.message.includes('auth/email-already-in-use')) {
        setError('Email này đã được đăng ký sử dụng.');
      } else {
        setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(15,23,42,0.08)] border border-slate-100/80 max-w-md w-full mx-auto relative overflow-hidden p-8 sm:p-10">
      {/* Top Professional Accent Bar */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500" />
      
      {/* Header Block */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="relative mb-5 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm">
          <img 
            src="https://raw.githubusercontent.com/duccodedao/Img/main/system/logo-1781680259856.png" 
            onError={(e) => {
              e.currentTarget.src = "/icon.png";
            }}
            alt="BMASS Logo" 
            className="h-12 w-auto object-contain" 
          />
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          </div>
        </div>

        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase italic">
          BMASS <span className="text-blue-600">HEALTH</span>
        </h2>
        
        <div className="flex items-center gap-1.5 mt-2.5 px-3 py-1 bg-blue-50/60 rounded-full border border-blue-100/40">
          <ShieldCheck size={12} className="text-blue-600" />
          <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">Hệ thống chuẩn hóa danh mục y tế</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-xs font-semibold mb-6 border border-red-100/60 flex items-center gap-2.5 shadow-sm">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0 animate-ping" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Authentication Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Địa chỉ Email</label>
            <span className="text-[9px] font-bold text-slate-300 uppercase">HL7 Standard</span>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
              <Mail size={16} />
            </div>
            <input
              required
              type="email"
              placeholder="tennhanvien@bmass.com"
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl outline-none focus:ring-4 focus:ring-blue-100/50 focus:border-blue-500 focus:bg-white transition-all text-xs font-bold text-slate-700"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mật khẩu bảo mật</label>
            <span className="text-[9px] font-bold text-slate-300 uppercase">AES-256 Key</span>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
              <Lock size={16} />
            </div>
            <input
              required
              type="password"
              placeholder="••••••••••••"
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl outline-none focus:ring-4 focus:ring-blue-100/50 focus:border-blue-500 focus:bg-white transition-all text-xs font-bold text-slate-700"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {mode === 'login' && (
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                id="remember"
                className="sr-only"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 transition-all ${
                remember ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white group-hover:border-blue-400'
              }`}>
                {remember && <Check size={10} strokeWidth={4} />}
              </div>
              <span className="text-[11px] font-bold text-slate-500 select-none group-hover:text-slate-700 transition-colors">Ghi nhớ đăng nhập</span>
            </label>
          </div>
        )}

        <button
          disabled={loading}
          type="submit"
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl font-bold uppercase text-xs tracking-widest transition-all shadow-[0_8px_20px_-6px_rgba(59,130,246,0.45)] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>{mode === 'login' ? 'Đăng nhập hệ thống' : 'Đăng ký tài khoản'}</span>
              <ArrowRight size={13} />
            </>
          )}
        </button>
      </form>

      {/* Alternative Social Sign In */}
      <div className="relative flex items-center justify-center my-6">
        <div className="border-t border-slate-100 w-full" />
        <span className="bg-white px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest absolute">Hoặc liên kết</span>
      </div>

      <button
        type="button"
        onClick={() => loginWithGoogle()}
        className="w-full flex items-center justify-center space-x-2.5 py-3 border border-slate-200/80 rounded-xl hover:bg-slate-50 active:scale-[0.99] transition-all bg-white hover:border-slate-300 shadow-sm"
      >
        <Chrome size={16} className="text-red-500" />
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tiếp tục với Google</span>
      </button>

      {/* Mode Toggle Button */}
      <div className="mt-6 text-center">
        {mode === 'login' ? (
          <button 
            type="button" 
            onClick={() => setMode('register')} 
            className="text-xs text-blue-600 font-bold hover:text-blue-800 hover:underline transition-colors uppercase tracking-wider"
          >
            Chưa có tài khoản? Đăng ký ngay
          </button>
        ) : (
          <button 
            type="button" 
            onClick={() => setMode('login')} 
            className="text-xs text-slate-500 font-bold hover:text-slate-700 hover:underline transition-colors uppercase tracking-wider"
          >
            Quay lại màn hình đăng nhập
          </button>
        )}
      </div>

      {/* Admin Footer & Compliance Label */}
      <div className="pt-6 mt-6 border-t border-slate-100/80 text-center">
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Hệ thống được quản trị bởi</span>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Sơn Lý Hồng Đức</span>
          </div>
          <div className="flex items-center gap-2 mt-1 opacity-45">
            <span className="text-[8px] font-bold text-slate-400 uppercase">AES-256 Bit</span>
            <span className="text-[8px] font-bold text-slate-400">•</span>
            <span className="text-[8px] font-bold text-slate-400">HL7 compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}
