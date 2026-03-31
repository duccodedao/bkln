import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { UserProfile, useAuth } from '../context/AuthContext';

export default function AdminPanel() {
  const { isGlobalPremium } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'payments' | 'settings'>('users');

  useEffect(() => {
    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      const usersData: UserProfile[] = [];
      snap.forEach(doc => usersData.push(doc.data() as UserProfile));
      setUsers(usersData);
    });

    const qPayments = query(collection(db, 'payments'));
    const unsubPayments = onSnapshot(qPayments, (snap) => {
      const paymentsData: any[] = [];
      snap.forEach(doc => paymentsData.push({ id: doc.id, ...doc.data() }));
      setPayments(paymentsData);
    });

    return () => {
      unsubUsers();
      unsubPayments();
    };
  }, []);

  const toggleBlock = async (uid: string, currentStatus: boolean) => {
    await updateDoc(doc(db, 'users', uid), { isBlocked: !currentStatus });
  };

  const togglePremium = async (uid: string, currentStatus: boolean) => {
    await updateDoc(doc(db, 'users', uid), { isPremium: !currentStatus });
  };

  const toggleGlobalPremium = async () => {
    await updateDoc(doc(db, 'settings', 'global'), { isGlobalPremium: !isGlobalPremium });
  };

  const approvePayment = async (paymentId: string, uid: string) => {
    await updateDoc(doc(db, 'payments', paymentId), { status: 'approved' });
    await updateDoc(doc(db, 'users', uid), { isPremium: true });
  };

  const rejectPayment = async (paymentId: string) => {
    await updateDoc(doc(db, 'payments', paymentId), { status: 'rejected' });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h2>
      
      <div className="flex space-x-4 mb-6 border-b border-gray-200">
        <button onClick={() => setActiveTab('users')} className={`pb-2 ${activeTab === 'users' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Người dùng</button>
        <button onClick={() => setActiveTab('payments')} className={`pb-2 ${activeTab === 'payments' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Thanh toán</button>
        <button onClick={() => setActiveTab('settings')} className={`pb-2 ${activeTab === 'settings' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Cài đặt chung</button>
      </div>

      {activeTab === 'users' && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Tên / Đơn vị</th>
                <th className="px-4 py-3 text-left">IP</th>
                <th className="px-4 py-3 text-left">Premium</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-left">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map(u => (
                <tr key={u.uid}>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.displayName} <br/><span className="text-gray-500">{u.organization}</span></td>
                  <td className="px-4 py-3">{u.lastIp}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => togglePremium(u.uid, u.isPremium)} className={`px-3 py-1 rounded-full ${u.isPremium ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {u.isPremium ? 'Đã mở khóa' : 'Khóa'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full ${u.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {u.isBlocked ? 'Bị cấm' : 'Hoạt động'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleBlock(u.uid, u.isBlocked)} className="text-red-600 hover:text-red-800">
                      {u.isBlocked ? 'Mở khóa tài khoản' : 'Cấm tài khoản'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Ngày tạo</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-left">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.map(p => (
                <tr key={p.id}>
                  <td className="px-4 py-3">{p.email}</td>
                  <td className="px-4 py-3">{new Date(p.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full ${p.status === 'approved' ? 'bg-green-100 text-green-700' : p.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    {p.status === 'pending' && (
                      <>
                        <button onClick={() => approvePayment(p.id, p.uid)} className="text-green-600 hover:text-green-800">Duyệt</button>
                        <button onClick={() => rejectPayment(p.id)} className="text-red-600 hover:text-red-800">Từ chối</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Mở khóa tính năng cho TẤT CẢ người dùng</h4>
              <p className="text-sm text-gray-500">Bật tùy chọn này sẽ cho phép mọi người dùng sử dụng tính năng nâng cao mà không cần thanh toán.</p>
            </div>
            <button 
              onClick={toggleGlobalPremium}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isGlobalPremium ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isGlobalPremium ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
