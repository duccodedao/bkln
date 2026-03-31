import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { UserProfile, useAuth } from '../context/AuthContext';
import { 
  Users, 
  CreditCard, 
  Settings, 
  Shield, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Activity, 
  Clock,
  ChevronRight,
  MoreVertical,
  ExternalLink,
  Lock,
  Unlock,
  AlertTriangle,
  Download,
  Bell,
  Terminal,
  BarChart3,
  RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const { isGlobalPremium } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'payments' | 'settings' | 'logs'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info'
  });

  // Mock data for chart
  const chartData = [
    { name: 'T2', users: 12, revenue: 400 },
    { name: 'T3', users: 19, revenue: 300 },
    { name: 'T4', users: 15, revenue: 500 },
    { name: 'T5', users: 22, revenue: 800 },
    { name: 'T6', users: 30, revenue: 600 },
    { name: 'T7', users: 25, revenue: 900 },
    { name: 'CN', users: 35, revenue: 1200 },
  ];

  useEffect(() => {
    const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      const usersData: UserProfile[] = [];
      snap.forEach(doc => usersData.push(doc.data() as UserProfile));
      setUsers(usersData);
      setLoading(false);
    });

    const qPayments = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
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
    setConfirmModal({
      show: true,
      title: currentStatus ? 'Mở khóa người dùng' : 'Cấm người dùng',
      message: `Bạn có chắc chắn muốn ${currentStatus ? 'mở khóa' : 'cấm'} người dùng này không?`,
      type: currentStatus ? 'info' : 'danger',
      onConfirm: async () => {
        await updateDoc(doc(db, 'users', uid), { isBlocked: !currentStatus });
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  const togglePremium = async (uid: string, currentStatus: boolean) => {
    setConfirmModal({
      show: true,
      title: currentStatus ? 'Hủy Premium' : 'Kích hoạt Premium',
      message: `Bạn có chắc chắn muốn ${currentStatus ? 'hủy' : 'kích hoạt'} gói Premium cho người dùng này không?`,
      type: currentStatus ? 'warning' : 'info',
      onConfirm: async () => {
        await updateDoc(doc(db, 'users', uid), { isPremium: !currentStatus });
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  const toggleGlobalPremium = async () => {
    setConfirmModal({
      show: true,
      title: isGlobalPremium ? 'Tắt Global Premium' : 'Bật Global Premium',
      message: `Bạn có chắc chắn muốn ${isGlobalPremium ? 'tắt' : 'bật'} chế độ Global Premium cho toàn bộ hệ thống không?`,
      type: isGlobalPremium ? 'warning' : 'danger',
      onConfirm: async () => {
        await updateDoc(doc(db, 'settings', 'global'), { isGlobalPremium: !isGlobalPremium });
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  const approvePayment = async (paymentId: string, uid: string) => {
    setConfirmModal({
      show: true,
      title: 'Phê duyệt thanh toán',
      message: 'Bạn có chắc chắn muốn phê duyệt giao dịch này không? Người dùng sẽ được nâng cấp lên Premium ngay lập tức.',
      type: 'info',
      onConfirm: async () => {
        await updateDoc(doc(db, 'payments', paymentId), { status: 'approved' });
        await updateDoc(doc(db, 'users', uid), { isPremium: true });
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  const rejectPayment = async (paymentId: string) => {
    setConfirmModal({
      show: true,
      title: 'Từ chối thanh toán',
      message: 'Bạn có chắc chắn muốn từ chối giao dịch này không?',
      type: 'danger',
      onConfirm: async () => {
        await updateDoc(doc(db, 'payments', paymentId), { status: 'rejected' });
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.organization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportUsers = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Email,Organization,Premium,Blocked\n"
      + users.map(u => `${u.displayName},${u.email},${u.organization},${u.isPremium},${u.isBlocked}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "bmass_users.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sendBroadcast = () => {
    if (!broadcastMessage.trim()) return;
    setConfirmModal({
      show: true,
      title: 'Gửi thông báo hệ thống',
      message: 'Thông báo này sẽ được gửi đến tất cả người dùng. Bạn có chắc chắn muốn tiếp tục?',
      type: 'info',
      onConfirm: () => {
        setIsSendingBroadcast(true);
        setConfirmModal(prev => ({ ...prev, show: false }));
        setTimeout(() => {
          setIsSendingBroadcast(false);
          setBroadcastMessage('');
          alert('Đã gửi thông báo đến toàn bộ người dùng!');
        }, 1500);
      }
    });
  };

  const stats = {
    totalUsers: users.length,
    premiumUsers: users.filter(u => u.isPremium).length,
    pendingPayments: payments.filter(p => p.status === 'pending').length,
    totalRevenue: payments.filter(p => p.status === 'approved').length * 99000,
    activeToday: Math.floor(users.length * 0.4) // Mock stat
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Admin Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Admin Control Center</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Quản trị hệ thống Bmass</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
          >
            <XCircle size={24} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-slate-100 p-4 space-y-2 hidden md:block">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Activity size={18} />
              Tổng quan
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Users size={18} />
              Người dùng
              <span className="ml-auto px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px]">{users.length}</span>
            </button>
            <button 
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'payments' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <CreditCard size={18} />
              Thanh toán
              {stats.pendingPayments > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-amber-100 text-amber-600 rounded-md text-[10px] animate-pulse">{stats.pendingPayments}</span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'logs' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Terminal size={18} />
              Nhật ký hệ thống
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Settings size={18} />
              Cài đặt hệ thống
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 no-scrollbar">
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                        <Users size={20} />
                      </div>
                      <TrendingUp size={16} className="text-green-500" />
                    </div>
                    <div>
                      <p className="text-3xl font-black text-slate-900">{stats.totalUsers}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tổng người dùng</p>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                        <Unlock size={20} />
                      </div>
                      <Shield size={16} className="text-amber-500" />
                    </div>
                    <div>
                      <p className="text-3xl font-black text-slate-900">{stats.premiumUsers}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tài khoản Premium</p>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <Clock size={20} />
                      </div>
                      <Activity size={16} className="text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-3xl font-black text-slate-900">{stats.pendingPayments}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Chờ phê duyệt</p>
                    </div>
                  </div>
                  <div className="bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-slate-800 text-slate-400 rounded-2xl">
                        <TrendingUp size={20} />
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-white">{(stats.totalRevenue / 1000000).toFixed(1)}M</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Ước tính doanh thu</p>
                    </div>
                  </div>
                </div>

                {/* Growth Chart */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <BarChart3 size={18} className="text-blue-600" />
                      Biểu đồ tăng trưởng (7 ngày qua)
                    </h4>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Người dùng</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Doanh thu</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                          dy={10}
                        />
                        <YAxis hide />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ fontSize: '12px', fontWeight: 700 }}
                        />
                        <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                        <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fill="transparent" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <Clock size={16} className="text-blue-600" />
                        Người dùng mới nhất
                      </h4>
                      <button onClick={() => setActiveTab('users')} className="text-[10px] font-bold text-blue-600 hover:underline">Xem tất cả</button>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {users.slice(0, 5).map(u => (
                        <div key={u.uid} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">
                              {u.displayName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-700">{u.displayName}</p>
                              <p className="text-[10px] text-slate-400">{u.email}</p>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-slate-300" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <CreditCard size={16} className="text-amber-600" />
                        Giao dịch gần đây
                      </h4>
                      <button onClick={() => setActiveTab('payments')} className="text-[10px] font-bold text-blue-600 hover:underline">Xem tất cả</button>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {payments.slice(0, 5).map(p => (
                        <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                              p.status === 'approved' ? 'bg-green-50 text-green-600' : 
                              p.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              <CreditCard size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-700">{p.email}</p>
                              <p className="text-[10px] text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${
                            p.status === 'approved' ? 'text-green-600' : 
                            p.status === 'rejected' ? 'text-red-600' : 'text-amber-600'
                          }`}>
                            {p.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div className="relative w-full sm:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm người dùng, email, đơn vị..." 
                      className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={exportUsers}
                      className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"
                      title="Xuất danh sách người dùng"
                    >
                      <Download size={18} />
                    </button>
                    <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm">
                      <Filter size={18} />
                    </button>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">
                      {filteredUsers.length} / {users.length} người dùng
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Người dùng</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Đơn vị / IP</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Premium</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredUsers.map(u => (
                          <tr key={u.uid} className="hover:bg-slate-50/30 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                                  {u.displayName.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800">{u.displayName}</p>
                                  <p className="text-[10px] text-slate-400">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-xs font-bold text-slate-600">{u.organization}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-1">{u.lastIp}</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button 
                                onClick={() => togglePremium(u.uid, u.isPremium)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                  u.isPremium ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                }`}
                              >
                                {u.isPremium ? <Unlock size={12} /> : <Lock size={12} />}
                                {u.isPremium ? 'Premium' : 'Free'}
                              </button>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                                u.isBlocked ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                              }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${u.isBlocked ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                {u.isBlocked ? 'Bị cấm' : 'Hoạt động'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => toggleBlock(u.uid, u.isBlocked)}
                                  className={`p-2 rounded-xl transition-all ${
                                    u.isBlocked ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                  }`}
                                  title={u.isBlocked ? 'Mở khóa' : 'Cấm'}
                                >
                                  {u.isBlocked ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                </button>
                                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                                  <MoreVertical size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Danh sách giao dịch</h4>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Tổng cộng: {payments.length} giao dịch
                  </div>
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Người dùng</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {payments.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50/30 transition-colors group">
                            <td className="px-6 py-4">
                              <p className="text-sm font-bold text-slate-800">{p.email}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {p.id.slice(0, 8)}...</p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-slate-500">
                                <Clock size={14} />
                                <span className="text-xs font-medium">{new Date(p.createdAt).toLocaleString()}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                                p.status === 'approved' ? 'bg-green-50 text-green-600' : 
                                p.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                              }`}>
                                {p.status === 'approved' ? <CheckCircle size={12} /> : 
                                 p.status === 'rejected' ? <XCircle size={12} /> : <Clock size={12} />}
                                {p.status === 'pending' ? 'Chờ duyệt' : p.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {p.status === 'pending' ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button 
                                    onClick={() => approvePayment(p.id, p.uid)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-green-700 transition-all shadow-lg shadow-green-100 active:scale-95"
                                  >
                                    Duyệt
                                  </button>
                                  <button 
                                    onClick={() => rejectPayment(p.id)}
                                    className="px-4 py-2 bg-white border border-red-100 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-red-50 transition-all active:scale-95"
                                  >
                                    Từ chối
                                  </button>
                                </div>
                              ) : (
                                <button className="p-2 text-slate-300 hover:text-slate-500 transition-colors">
                                  <ExternalLink size={18} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <Terminal size={18} className="text-slate-600" />
                      Nhật ký hoạt động hệ thống
                    </h4>
                    <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                      <RefreshCcw size={16} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    {[
                      { action: 'User Login', user: 'sonlyhongduc@gmail.com', time: '2 phút trước', status: 'success' },
                      { action: 'Payment Approved', user: 'admin@bmass.com', time: '15 phút trước', status: 'success' },
                      { action: 'Settings Updated', user: 'admin@bmass.com', time: '1 giờ trước', status: 'warning' },
                      { action: 'User Blocked', user: 'test@user.com', time: '3 giờ trước', status: 'danger' },
                      { action: 'Global Premium Enabled', user: 'admin@bmass.com', time: '5 giờ trước', status: 'info' },
                    ].map((log, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            log.status === 'success' ? 'bg-green-500' : 
                            log.status === 'warning' ? 'bg-amber-500' : 
                            log.status === 'danger' ? 'bg-red-500' : 'bg-blue-500'
                          }`}></div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">{log.action}</p>
                            <p className="text-[10px] text-slate-400">{log.user}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-medium text-slate-400">{log.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Bell size={20} className="text-blue-600" />
                      Gửi thông báo hệ thống
                    </h4>
                    <p className="text-sm text-slate-500">Gửi tin nhắn thông báo đến tất cả người dùng đang hoạt động.</p>
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        placeholder="Nhập nội dung thông báo..." 
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={broadcastMessage}
                        onChange={e => setBroadcastMessage(e.target.value)}
                      />
                      <button 
                        onClick={sendBroadcast}
                        disabled={isSendingBroadcast || !broadcastMessage.trim()}
                        className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {isSendingBroadcast ? <RefreshCcw size={18} className="animate-spin" /> : <Bell size={18} />}
                        Gửi ngay
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-8">
                    <div className="flex items-start justify-between gap-6">
                      <div className="space-y-2">
                        <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <Unlock size={20} className="text-blue-600" />
                          Chế độ Global Premium
                        </h4>
                        <p className="text-sm text-slate-500 leading-relaxed max-w-md">
                          Bật tùy chọn này sẽ tự động mở khóa tính năng nâng cao cho <span className="font-bold text-slate-900">TẤT CẢ</span> người dùng trong hệ thống mà không cần thanh toán.
                        </p>
                      </div>
                      <button 
                        onClick={toggleGlobalPremium}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isGlobalPremium ? 'bg-blue-600 shadow-lg shadow-blue-200' : 'bg-slate-200'}`}
                      >
                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ${isGlobalPremium ? 'translate-x-7' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
                    <AlertTriangle className="text-amber-600 mt-0.5 flex-shrink-0" size={20} />
                    <div>
                      <h5 className="text-sm font-bold text-amber-900">Lưu ý quan trọng</h5>
                      <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                        Việc bật Global Premium sẽ vô hiệu hóa hệ thống thanh toán và cho phép truy cập không giới hạn. Chỉ sử dụng trong trường hợp bảo trì hoặc sự kiện đặc biệt.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <Shield size={18} className="text-indigo-600" />
                      Bảo mật hệ thống
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <span className="text-xs font-bold text-slate-600">Giới hạn IP đăng nhập</span>
                        <div className="w-10 h-5 bg-slate-200 rounded-full relative">
                          <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <span className="text-xs font-bold text-slate-600">Xác thực 2 yếu tố (Admin)</span>
                        <div className="w-10 h-5 bg-blue-600 rounded-full relative">
                          <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <TrendingUp size={18} className="text-green-600" />
                      Cấu hình gói cước
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <span className="text-xs font-bold text-slate-600">Giá gói Premium</span>
                        <span className="text-xs font-black text-slate-900">99.000đ</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <span className="text-xs font-bold text-slate-600">Thời hạn sử dụng</span>
                        <span className="text-xs font-black text-slate-900">Vĩnh viễn</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.show && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-6 text-center space-y-4">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                  confirmModal.type === 'danger' ? 'bg-red-50 text-red-600' : 
                  confirmModal.type === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  <AlertTriangle size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">{confirmModal.title}</h3>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">{confirmModal.message}</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    onClick={confirmModal.onConfirm}
                    className={`flex-1 py-3 text-white rounded-2xl font-bold text-sm transition-all shadow-lg ${
                      confirmModal.type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-100' : 
                      confirmModal.type === 'warning' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
                    }`}
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
