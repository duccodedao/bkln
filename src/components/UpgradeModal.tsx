import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { X } from 'lucide-react';

export default function UpgradeModal({ onClose }: { onClose: () => void }) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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

  const qrUrl = `https://img.vietqr.io/image/VCB-0891000650891-compact2.jpg?amount=100000&addInfo=${encodeURIComponent(profile?.email || '')}&accountName=SON%20LY%20HONG%20DUC`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Nâng cấp tính năng</h2>
        <p className="text-gray-500 text-center mb-6">Mở khóa Cài đặt & Bộ lọc (Lọc ngày, Đường huyết, Giới tính...)</p>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Đã gửi yêu cầu!</h3>
            <p className="text-gray-500 mt-2">Vui lòng chờ Admin duyệt hóa đơn của bạn.</p>
            <button onClick={onClose} className="mt-6 w-full py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Đóng</button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg flex justify-center">
              <img src={qrUrl} alt="QR Code" className="max-w-[250px] rounded-lg shadow-sm" />
            </div>
            
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Số tiền:</strong> 100,000 VNĐ</p>
              <p><strong>Nội dung CK:</strong> <span className="font-mono bg-gray-100 px-1 rounded">{profile?.email}</span></p>
            </div>

            <button 
              onClick={handleConfirmPayment}
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : 'Tôi đã thanh toán'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
