import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, limit } from 'firebase/firestore';
import { X, Clock, QrCode, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function UpgradeModal({ onClose }: { onClose: () => void }) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [existingPayment, setExistingPayment] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [showQRForce, setShowQRForce] = useState(false);

  useEffect(() => {
    const checkPayment = async () => {
      if (!profile) return;
      try {
        const q = query(
          collection(db, 'payments'),
          where('uid', '==', profile.uid),
          where('status', '==', 'pending'),
          limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setExistingPayment({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
        }
      } catch (error) {
        console.error("Error checking payment:", error);
      } finally {
        setChecking(false);
      }
    };
    checkPayment();
  }, [profile]);

  const handleConfirmPayment = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'payments'), {
        uid: profile.uid,
        email: profile.email,
        status: 'pending',
        createdAt: Date.now()
      });
      setSuccess(true);
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi gửi yêu cầu.');
    }
    setLoading(false);
  };

  const emailPrefix = profile?.email?.split('@')[0] || '';
  const qrUrl = `https://img.vietqr.io/image/VCB-0891000650891-compact2.jpg?amount=100000&addInfo=${encodeURIComponent(emailPrefix)}&accountName=SON%20LY%20HONG%20DUC`;

  const renderContent = () => {
    if (checking) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm text-gray-500">Đang kiểm tra trạng thái...</p>
        </div>
      );
    }

    if (success || (existingPayment && !showQRForce)) {
      return (
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Clock size={40} className="animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Đang chờ phê duyệt</h3>
          <p className="text-gray-500 text-sm leading-relaxed px-4">
            Yêu cầu nâng cấp của bạn đã được gửi. Vui lòng chờ Admin kiểm tra và kích hoạt tính năng Premium.
          </p>
          
          <div className="flex flex-col gap-3 mt-8">
            <button 
              onClick={() => setShowQRForce(true)}
              className="flex items-center justify-center gap-2 w-full py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all active:scale-95"
            >
              <QrCode size={18} />
              Thanh toán lại (Hiện mã QR)
            </button>
            <button 
              onClick={onClose}
              className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
            >
              Đóng
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {showQRForce && (
          <button 
            onClick={() => setShowQRForce(false)}
            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors mb-2"
          >
            <ArrowLeft size={14} />
            Quay lại
          </button>
        )}
        
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col items-center shadow-inner">
          <img src={qrUrl} alt="QR Code" className="max-w-[220px] rounded-xl shadow-lg border-4 border-white" />
          <div className="mt-4 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Quét mã để thanh toán</p>
            <p className="text-xs font-medium text-slate-500 italic">Vietcombank - SON LY HONG DUC</p>
          </div>
        </div>
        
        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-medium">Số tiền:</span>
            <span className="font-black text-slate-900">100,000 VNĐ</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-medium">Nội dung CK:</span>
            <span className="font-mono bg-white px-3 py-1 rounded-lg border border-blue-100 text-blue-700 font-bold shadow-sm">
              {emailPrefix}
            </span>
          </div>
        </div>

        {!existingPayment ? (
          <button 
            onClick={handleConfirmPayment}
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50 disabled:scale-100"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang xử lý...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 size={18} />
                Tôi đã thanh toán
              </div>
            )}
          </button>
        ) : (
          <button 
            onClick={onClose}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all active:scale-95"
          >
            Đã hiểu
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative border border-white/20">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
        >
          <X size={20} />
        </button>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Nâng cấp Premium</h2>
          <p className="text-sm text-slate-500 font-medium">Mở khóa toàn bộ tính năng chuyên nghiệp</p>
        </div>

        {renderContent()}
      </div>
    </div>
  );
}
