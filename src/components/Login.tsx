import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { RecaptchaVerifier } from 'firebase/auth';
import { LogIn, Mail, Phone, Lock, UserPlus, ArrowRight, Chrome } from 'lucide-react';

export default function Login() {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, loginWithPhone } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'phone'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  useEffect(() => {
    if (mode === 'phone' && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });
    }
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password, remember);
      } else if (mode === 'register') {
        await registerWithEmail(email, password);
      } else if (mode === 'phone') {
        if (!confirmationResult) {
          const result = await loginWithPhone(phone, window.recaptchaVerifier);
          setConfirmationResult(result);
        } else {
          await confirmationResult.confirm(otp);
        }
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-auto">
      <div className="text-center mb-8">
          <img src="https://hdd.io.vn/img/bmassloadings.png" alt="Logo" className="h-16 w-auto object-contain mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Chào mừng trở lại</h2>
          <p className="text-gray-500">Đăng nhập để tiếp tục sử dụng hệ thống</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode !== 'phone' ? (
            <>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  required
                  type="email"
                  placeholder="Email"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  required
                  type="password"
                  placeholder="Mật khẩu"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {mode === 'login' && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    className="rounded text-blue-600"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <label htmlFor="remember" className="ml-2 text-sm text-gray-600">Ghi nhớ đăng nhập</label>
                </div>
              )}
            </>
          ) : (
            <>
              {!confirmationResult ? (
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    required
                    type="tel"
                    placeholder="Số điện thoại (+84...)"
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              ) : (
                <div className="relative">
                  <ArrowRight className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    required
                    type="text"
                    placeholder="Mã OTP"
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>
              )}
              <div id="recaptcha-container"></div>
            </>
          )}

          <button
            disabled={loading}
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : mode === 'register' ? 'Đăng ký' : confirmationResult ? 'Xác nhận OTP' : 'Gửi mã OTP'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative flex items-center justify-center">
            <div className="border-t border-gray-200 w-full"></div>
            <span className="bg-white px-4 text-sm text-gray-400 absolute">Hoặc</span>
          </div>

          <div className="grid grid-cols-1 gap-3 mt-6">
            <button
              onClick={() => loginWithGoogle()}
              className="flex items-center justify-center space-x-2 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Chrome size={18} className="text-red-500" />
              <span className="text-sm font-medium">Tiếp tục với Google</span>
            </button>
          </div>
        </div>

        <div className="mt-8 text-center space-y-2">
          {mode === 'login' ? (
            <>
              <p className="text-sm text-gray-500">
                Chưa có tài khoản?{' '}
                <button onClick={() => setMode('register')} className="text-blue-600 font-medium hover:underline">Đăng ký ngay</button>
              </p>
              <button onClick={() => setMode('phone')} className="text-sm text-gray-500 hover:text-blue-600">Đăng nhập bằng số điện thoại</button>
            </>
          ) : (
            <button onClick={() => { setMode('login'); setConfirmationResult(null); }} className="text-sm text-blue-600 font-medium hover:underline">Quay lại đăng nhập</button>
          )}
        </div>
    </div>
  );
}

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}
