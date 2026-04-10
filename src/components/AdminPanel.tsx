import React, { useEffect, useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc, orderBy, deleteDoc } from 'firebase/firestore';
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
  Info,
  ClipboardList,
  Trash2
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

const YesNoBadge = ({ value }: { value: boolean }) => (
  <span className={`px-1 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${value ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>
    {value ? 'Có' : 'K'}
  </span>
);

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [onlineScreenings, setOnlineScreenings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'screenings' | 'settings'>('dashboard');
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

    const qScreenings = query(collection(db, 'online_screenings'), orderBy('createdAt', 'desc'));
    const unsubScreenings = onSnapshot(qScreenings, (snap) => {
      const screeningsData: any[] = [];
      snap.forEach(doc => {
        screeningsData.push({ ...doc.data(), id: doc.id });
      });
      setOnlineScreenings(screeningsData);
    });

    return () => {
      unsubUsers();
      unsubScreenings();
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

  const filteredScreenings = onlineScreenings.filter(s => 
    (s.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.address || '').toLowerCase().includes(searchTerm.toLowerCase())
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

  const exportScreenings = () => {
    const exportData = onlineScreenings.map(s => {
      const sbp = Math.max(parseFloat(s.sbp1) || 0, parseFloat(s.sbp2) || 0);
      const dbp = Math.max(parseFloat(s.dbp1) || 0, parseFloat(s.dbp2) || 0);
      
      const dtdConclusion = s.diabetesRiskScore >= 6 ? 'Nguy cơ cao' : 'Nguy cơ thấp';
      const copdConclusion = s.copdCount >= 3 ? 'Nghi ngờ COPD' : 'Bình thường';
      const asthmaConclusion = s.asthmaCount >= 2 ? 'Nghi ngờ Hen' : 'Bình thường';
      const date = s.createdAt?.seconds ? new Date(s.createdAt.seconds * 1000).toLocaleString('vi-VN') : 'N/A';

      const yesNo = (val: any) => val === true ? 'Có' : 'Không';

      return {
        'Người điều tra': s.investigator || 'N/A',
        'Đơn vị công tác': s.workUnit || 'N/A',
        'Xã/Phường': s.ward || 'N/A',
        'Ngày thực hiện': s.executionDate || 'N/A',
        'Họ tên': s.fullName,
        'Năm sinh': s.birthYear,
        'Giới tính': s.gender,
        'Số điện thoại': s.phone,
        'Địa chỉ': s.address,
        'Chiều cao (m)': s.height,
        'Cân nặng (kg)': s.weight,
        'BMI': (s.bmi || 0).toFixed(1),
        'Vòng bụng (cm)': s.waist,
        'Đang mắc THA': yesNo(s.hasHypertension),
        'Đang mắc ĐTD': yesNo(s.hasDiabetes),
        'Đang mắc Ung thư': yesNo(s.hasCancer),
        'HA lần 1': `${s.sbp1}/${s.dbp1}`,
        'HA lần 2': `${s.sbp2}/${s.dbp2}`,
        'Đường huyết (mmol/L)': s.bloodSugar,
        'Gia đình ĐTD': yesNo(s.familyDiabetes),
        'Gia đình THA': yesNo(s.familyHypertension),
        'Gia đình Ung thư': yesNo(s.familyCancer),
        'Ăn thiếu rau': yesNo(s.lowVeggie),
        'Ăn mặn': yesNo(s.highSalt),
        'Hút thuốc': yesNo(s.smoking),
        'Stress': yesNo(s.stress),
        'Ít vận động': yesNo(s.lowPhysicalActivity),
        'Rượu bia': yesNo(s.highAlcohol),
        'ĐTD thai kỳ': yesNo(s.gestationalDiabetes),
        'Dấu hiệu THA': yesNo(s.signHTN),
        'Dấu hiệu ĐTD': yesNo(s.signDiabetes),
        'Dấu hiệu Ung thư': yesNo(s.signCancer),
        'COPD-C1 (Ho)': yesNo(s.copd_q1),
        'COPD-C2 (Đờm)': yesNo(s.copd_q2),
        'COPD-C3 (Khó thở)': yesNo(s.copd_q3),
        'COPD-C4 (>40 tuổi)': yesNo(s.age >= 40),
        'COPD-C5 (Hút thuốc)': yesNo(s.copd_q5),
        'Điểm COPD': s.copdCount,
        'Kết luận COPD': copdConclusion,
        'Hen-C1': yesNo(s.asthma_q1),
        'Hen-C2': yesNo(s.asthma_q2),
        'Hen-C3': yesNo(s.asthma_q3),
        'Hen-C4': yesNo(s.asthma_q4),
        'Hen-C5': yesNo(s.asthma_q5),
        'Hen-C6': yesNo(s.asthma_q6),
        'Hen-C7': yesNo(s.asthma_q7),
        'Điểm Hen': s.asthmaCount,
        'Kết luận Hen': asthmaConclusion,
        'Điểm ĐTD': s.diabetesRiskScore,
        'Kết luận ĐTD': dtdConclusion,
        'Ngày hệ thống': date
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sàng lọc Online");
    XLSX.writeFile(wb, "bmass_online_screenings.xlsx");
  };

  const deleteScreening = async (id: string) => {
    setConfirmModal({
      show: true,
      title: 'Xóa kết quả sàng lọc',
      message: 'Bạn có chắc chắn muốn xóa kết quả sàng lọc này không? Hành động này không thể hoàn tác.',
      type: 'danger',
      onConfirm: async () => {
        await deleteDoc(doc(db, 'online_screenings', id));
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
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
              onClick={() => setActiveTab('screenings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'screenings' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <ClipboardList size={18} />
              Sàng lọc Online
              <span className="ml-auto px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px]">{onlineScreenings.length}</span>
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

            {activeTab === 'screenings' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div className="relative w-full sm:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm theo tên, SĐT, địa chỉ..." 
                      className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={exportScreenings}
                      className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"
                      title="Xuất danh sách sàng lọc"
                    >
                      <Download size={18} />
                    </button>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">
                      {filteredScreenings.length} / {onlineScreenings.length} bản ghi
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[4000px]">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky left-0 bg-white z-20 border-r border-slate-100">Họ tên</th>
                          <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Người điều tra</th>
                          <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Đơn vị</th>
                          <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Xã/Phường</th>
                          <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày thực hiện</th>
                          <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Năm sinh</th>
                          <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Giới tính</th>
                          <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">SĐT</th>
                          <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Địa chỉ</th>
                          <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">BMI</th>
                          <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vòng bụng</th>
                          <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">HA Lần 1</th>
                          <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">HA Lần 2</th>
                          <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Đường huyết</th>
                          
                          {/* Tiền sử gia đình */}
                          <th className="px-2 py-4 text-[9px] font-black text-amber-600 uppercase tracking-tighter bg-amber-50/30">GĐ ĐTD</th>
                          <th className="px-2 py-4 text-[9px] font-black text-amber-600 uppercase tracking-tighter bg-amber-50/30">GĐ THA</th>
                          <th className="px-2 py-4 text-[9px] font-black text-amber-600 uppercase tracking-tighter bg-amber-50/30">GĐ UT</th>
                          
                          {/* Yếu tố nguy cơ */}
                          <th className="px-2 py-4 text-[9px] font-black text-blue-600 uppercase tracking-tighter bg-blue-50/30">Thiếu rau</th>
                          <th className="px-2 py-4 text-[9px] font-black text-blue-600 uppercase tracking-tighter bg-blue-50/30">Ăn mặn</th>
                          <th className="px-2 py-4 text-[9px] font-black text-blue-600 uppercase tracking-tighter bg-blue-50/30">Hút thuốc</th>
                          <th className="px-2 py-4 text-[9px] font-black text-blue-600 uppercase tracking-tighter bg-blue-50/30">Stress</th>
                          <th className="px-2 py-4 text-[9px] font-black text-blue-600 uppercase tracking-tighter bg-blue-50/30">Ít VĐ</th>
                          <th className="px-2 py-4 text-[9px] font-black text-blue-600 uppercase tracking-tighter bg-blue-50/30">Rượu bia</th>
                          <th className="px-2 py-4 text-[9px] font-black text-blue-600 uppercase tracking-tighter bg-blue-50/30">Thai kỳ</th>
                          
                          {/* Dấu hiệu nghi ngờ */}
                          <th className="px-2 py-4 text-[9px] font-black text-red-600 uppercase tracking-tighter bg-red-50/30">Nghi THA</th>
                          <th className="px-2 py-4 text-[9px] font-black text-red-600 uppercase tracking-tighter bg-red-50/30">Nghi ĐTD</th>
                          <th className="px-2 py-4 text-[9px] font-black text-red-600 uppercase tracking-tighter bg-red-50/30">Nghi UT</th>
                          
                          {/* COPD */}
                          <th className="px-2 py-4 text-[9px] font-black text-indigo-600 uppercase tracking-tighter bg-indigo-50/30">COPD-C1</th>
                          <th className="px-2 py-4 text-[9px] font-black text-indigo-600 uppercase tracking-tighter bg-indigo-50/30">COPD-C2</th>
                          <th className="px-2 py-4 text-[9px] font-black text-indigo-600 uppercase tracking-tighter bg-indigo-50/30">COPD-C3</th>
                          <th className="px-2 py-4 text-[9px] font-black text-indigo-600 uppercase tracking-tighter bg-indigo-50/30">COPD-C4</th>
                          <th className="px-2 py-4 text-[9px] font-black text-indigo-600 uppercase tracking-tighter bg-indigo-50/30">COPD-C5</th>
                          
                          {/* Hen */}
                          <th className="px-2 py-4 text-[9px] font-black text-violet-600 uppercase tracking-tighter bg-violet-50/30">Hen-C1</th>
                          <th className="px-2 py-4 text-[9px] font-black text-violet-600 uppercase tracking-tighter bg-violet-50/30">Hen-C2</th>
                          <th className="px-2 py-4 text-[9px] font-black text-violet-600 uppercase tracking-tighter bg-violet-50/30">Hen-C3</th>
                          <th className="px-2 py-4 text-[9px] font-black text-violet-600 uppercase tracking-tighter bg-violet-50/30">Hen-C4</th>
                          <th className="px-2 py-4 text-[9px] font-black text-violet-600 uppercase tracking-tighter bg-violet-50/30">Hen-C5</th>
                          <th className="px-2 py-4 text-[9px] font-black text-violet-600 uppercase tracking-tighter bg-violet-50/30">Hen-C6</th>
                          <th className="px-2 py-4 text-[9px] font-black text-violet-600 uppercase tracking-tighter bg-violet-50/30">Hen-C7</th>
                          
                          {/* Kết luận */}
                          <th className="px-4 py-4 text-[10px] font-black text-slate-900 uppercase tracking-widest bg-slate-100">KL ĐTD</th>
                          <th className="px-4 py-4 text-[10px] font-black text-slate-900 uppercase tracking-widest bg-slate-100">KL COPD</th>
                          <th className="px-4 py-4 text-[10px] font-black text-slate-900 uppercase tracking-widest bg-slate-100">KL Hen</th>
                          
                          <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right sticky right-0 bg-white z-20 border-l border-slate-100">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredScreenings.map(s => {
                          const sbp = Math.max(parseFloat(s.sbp1) || 0, parseFloat(s.sbp2) || 0);
                          const dbp = Math.max(parseFloat(s.dbp1) || 0, parseFloat(s.dbp2) || 0);
                          const isHighBP = sbp >= 140 || dbp >= 90;
                          
                          return (
                            <tr key={s.id} className="hover:bg-slate-50/30 transition-colors group">
                              <td className="px-4 py-4 sticky left-0 bg-white group-hover:bg-slate-50/30 z-10 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                <p className="text-sm font-bold text-slate-800 whitespace-nowrap">{s.fullName}</p>
                              </td>
                              <td className="px-4 py-4 text-xs text-slate-600 font-medium">{s.investigator || '-'}</td>
                              <td className="px-4 py-4 text-xs text-slate-600 font-medium">{s.workUnit || '-'}</td>
                              <td className="px-4 py-4 text-xs text-slate-600 font-medium">{s.ward || '-'}</td>
                              <td className="px-4 py-4 text-xs text-slate-600 font-medium">{s.executionDate || '-'}</td>
                              <td className="px-4 py-4 text-xs text-slate-600 font-medium">{s.birthYear}</td>
                              <td className="px-4 py-4 text-xs text-slate-600 font-medium">{s.gender}</td>
                              <td className="px-4 py-4 text-xs text-slate-600 font-medium">{s.phone}</td>
                              <td className="px-4 py-4 text-xs text-slate-400 truncate max-w-[200px]">{s.address}</td>
                              <td className="px-4 py-4 text-xs font-bold text-slate-700">{(s.bmi || 0).toFixed(1)}</td>
                              <td className="px-4 py-4 text-xs font-bold text-slate-700">{s.waist}cm</td>
                              <td className="px-4 py-4 text-xs font-bold text-slate-700">{s.sbp1}/{s.dbp1}</td>
                              <td className="px-4 py-4 text-xs font-bold text-slate-700">{s.sbp2}/{s.dbp2}</td>
                              <td className="px-4 py-4 text-xs font-bold text-slate-700">{s.bloodSugar || '-'}</td>
                              
                              {/* Tiền sử GĐ */}
                              <td className="px-2 py-4 text-center"><YesNoBadge value={s.familyDiabetes} /></td>
                              <td className="px-2 py-4 text-center"><YesNoBadge value={s.familyHypertension} /></td>
                              <td className="px-2 py-4 text-center"><YesNoBadge value={s.familyCancer} /></td>
                              
                              {/* Yếu tố nguy cơ */}
                              <td className="px-2 py-4 text-center"><YesNoBadge value={s.lowVeggie} /></td>
                              <td className="px-2 py-4 text-center"><YesNoBadge value={s.highSalt} /></td>
                              <td className="px-2 py-4 text-center"><YesNoBadge value={s.smoking} /></td>
                              <td className="px-2 py-4 text-center"><YesNoBadge value={s.stress} /></td>
                              <td className="px-2 py-4 text-center"><YesNoBadge value={s.lowPhysicalActivity} /></td>
                              <td className="px-2 py-4 text-center"><YesNoBadge value={s.highAlcohol} /></td>
                              <td className="px-2 py-4 text-center">{s.gender === 'Nữ' ? <YesNoBadge value={s.gestationalDiabetes} /> : '-'}</td>
                              
                              {/* Dấu hiệu nghi ngờ */}
                              <td className="px-2 py-4 text-center"><YesNoBadge value={s.signHTN} /></td>
                              <td className="px-2 py-4 text-center"><YesNoBadge value={s.signDiabetes} /></td>
                              <td className="px-2 py-4 text-center"><YesNoBadge value={s.signCancer} /></td>
                              
                              {/* COPD */}
                              <td className="px-2 py-4 text-center"><YesNoBadge value={s.copd_q1} /></td>
                              <td className="px-2 py-4 text-center"><YesNoBadge value={s.copd_q2} /></td>
                              <td className="px-2 py-4 text-center"><YesNoBadge value={s.copd_q3} /></td>
                              <td className="px-2 py-4 text-center"><YesNoBadge value={s.age >= 40} /></td>
                              <td className="px-2 py-4 text-center"><YesNoBadge value={s.copd_q5} /></td>
                              
                              {/* Hen */}
                              <td className="px-2 py-4 text-center"><YesNoBadge value={s.asthma_q1} /></td>
                              <td className="px-2 py-4 text-center"><YesNoBadge value={s.asthma_q2} /></td>
                              <td className="px-2 py-4 text-center"><YesNoBadge value={s.asthma_q3} /></td>
                              <td className="px-2 py-4 text-center"><YesNoBadge value={s.asthma_q4} /></td>
                              <td className="px-2 py-4 text-center"><YesNoBadge value={s.asthma_q5} /></td>
                              <td className="px-2 py-4 text-center"><YesNoBadge value={s.asthma_q6} /></td>
                              <td className="px-2 py-4 text-center"><YesNoBadge value={s.asthma_q7} /></td>
                              
                              {/* Kết luận riêng biệt */}
                              <td className="px-4 py-4">
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${s.diabetesRiskScore >= 6 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                  {s.diabetesRiskScore >= 6 ? 'Nguy cơ' : 'Bình thường'}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${s.copdCount >= 3 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                  {s.copdCount >= 3 ? 'Nghi ngờ' : 'Bình thường'}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${s.asthmaCount >= 2 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                  {s.asthmaCount >= 2 ? 'Nghi ngờ' : 'Bình thường'}
                                </span>
                              </td>
                              
                              <td className="px-4 py-4 text-right sticky right-0 bg-white group-hover:bg-slate-50/30 z-10 border-l border-slate-100 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                <button 
                                  onClick={() => deleteScreening(s.id)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
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
