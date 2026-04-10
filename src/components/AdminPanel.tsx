import React, { useEffect, useState, useMemo } from 'react';
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
  RefreshCcw,
  Info
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
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'settings'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
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

  // Calculate real chart data for the last 7 days
  const chartData = useMemo(() => {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const now = new Date();
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dayStart = d.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      
      const dayUsers = users.filter(u => u.createdAt >= dayStart && u.createdAt < dayEnd).length;
      
      last7Days.push({
        name: days[d.getDay()],
        users: dayUsers
      });
    }
    return last7Days;
  }, [users]);

  useEffect(() => {
    const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      const usersData: UserProfile[] = [];
      snap.forEach(doc => {
        const data = doc.data() as UserProfile;
        usersData.push({ ...data, uid: doc.id });
      });
      setUsers(usersData);
      setLoading(false);
    });

    return () => {
      unsubUsers();
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

  const filteredUsers = users.filter(u => 
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.organization || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportUsers = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Email,Organization,Premium,Blocked\n"
      + users.map(u => `${u.displayName || ''},${u.email || ''},${u.organization || ''},${u.isPremium},${u.isBlocked}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "bmass_users.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayStart = now.getTime();
    
    return {
      totalUsers: users.length,
      premiumUsers: users.filter(u => u.isPremium).length,
      activeToday: users.filter(u => u.createdAt >= todayStart).length
    };
  }, [users]);

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
                      <p className="text-3xl font-black text-slate-900">{stats.activeToday}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Người dùng mới hôm nay</p>
                    </div>
                  </div>
                  <div className="bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-slate-800 text-slate-400 rounded-2xl">
                        <Shield size={20} />
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-white">System Active</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Trạng thái hệ thống</p>
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
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Người dùng mới</span>
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
                          formatter={(value: number) => [value, 'Người dùng mới']}
                        />
                        <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <Clock size={16} className="text-blue-600" />
                        Người dùng mới nhất
                      </h4>
                      <button onClick={() => setActiveTab('users')} className="text-[10px] font-bold text-blue-600 hover:underline">Xem tất cả</button>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {users.slice(0, 10).map(u => (
                        <div key={u.uid} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">
                              {(u.displayName || 'U').charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-700">{u.displayName || 'Người dùng'}</p>
                              <p className="text-[10px] text-slate-400">{u.email || 'No email'}</p>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-slate-300" />
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
                                  {(u.displayName || 'U').charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800">{u.displayName || 'Người dùng'}</p>
                                  <p className="text-[10px] text-slate-400">{u.email || 'No email'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-xs font-bold text-slate-600">{u.organization || 'N/A'}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-1">{u.lastIp || 'No IP'}</p>
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
                                    u.isBlocked ? 'text-blue-600 hover:bg-blue-50' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                  }`}
                                  title={u.isBlocked ? 'Mở khóa' : 'Khóa tài khoản'}
                                >
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

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
                  <div className="space-y-6">
                    <div className="flex items-start justify-between gap-6">
                      <div className="space-y-2">
                        <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <Shield size={20} className="text-blue-600" />
                          Quản lý tính năng nâng cao
                        </h4>
                        <p className="text-sm text-slate-500 leading-relaxed max-w-md">
                          Hiện tại tất cả tính năng lọc dữ liệu đã được mở khóa cho mọi người dùng. Tính năng <span className="font-bold text-slate-900">Cấu hình đường huyết</span> vẫn được giới hạn cho Admin và người dùng được cấp quyền.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-4">
                    <Info className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
                    <div>
                      <h5 className="text-sm font-bold text-blue-900">Thông tin hệ thống</h5>
                      <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                        Hệ thống thanh toán đã được gỡ bỏ. Bạn có thể cấp quyền "Premium" thủ công cho người dùng trong tab "Người dùng" để họ sử dụng được tính năng Cấu hình đường huyết.
                      </p>
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
