import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Download, AlertCircle, Trash2, FileOutput, Activity, Droplet, Settings, Calendar, LogOut, Shield, Lock, ShieldAlert, MapPin, CheckSquare, Square, CheckCircle, Users, Database, Filter, ChevronRight, Info, RefreshCcw, ShieldCheck, Check, LogIn, Menu, X, Search, Wind } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';

import { auth, db } from './firebase';
import { collection, doc, setDoc, getDocs, writeBatch, query, where, serverTimestamp, getDocFromServer } from 'firebase/firestore';

const THA_COLUMNS = [
  'Họ tên (*)', 'Giới tính (*)', 'Năm sinh (*)', 'Mã BHYT (*)', 'Số CMT/CCCD (*)',
  'Số điện thoại', 'Địa chỉ', 'Xã/Phường/Thị trấn (*)', 'Ngày phát hiện bệnh',
  'Nơi phát hiện', 'Ngày khám (*)', 'Phân loại BN (*)', 'HA tâm thu (*)',
  'HA tâm trương (*)', 'Cân nặng', 'Chiều cao', 'Vòng eo', 'Hút thuốc lá',
  'Mức độ uống rượu bia', 'Thực hành giảm ăn muối', 'Ăn đủ 400g rau và trái cây',
  'Hoạt động thể lực đủ theo khuyến nghị', 'Chẩn đoán', 'Thuốc điều trị',
  'Số ngày nhận thuốc', 'Biến chứng', 'Kết quả điều trị', 'Ngày tái khám'
];

const DTD_COLUMNS = [
  'Họ tên (*)', 'Giới tính (*)', 'Năm sinh (*)', 'Mã BHYT (*)', 'Số CMT/CCCD (*)',
  'Số điện thoại', 'Địa chỉ', 'Xã/Phường/Thị trấn (*)', 'Ngày phát hiện bệnh',
  'Nơi phát hiện', 'Ngày khám (*)', 'Phân loại BN (*)', 'Đường huyết (*)', 'HbA1C',
  'HA tâm thu (*)', 'HA tâm trương (*)', 'Rối loạn lipid máu (*)', 'Cân nặng',
  'Chiều cao', 'Vòng eo', 'Hút thuốc lá', 'Mức độ uống rượu bia',
  'Thực hành giảm ăn muối', 'Thực hành ăn uống hợp lý',
  'Hoạt động thể lực đủ theo khuyến nghị', 'Theo dõi biến chứng bàn chân',
  'Biết xử lý hạ đường huyết', 'Chẩn đoán', 'Thuốc điều trị', 'Số ngày nhận thuốc',
  'Biến chứng', 'Kết quả điều trị', 'Ngày tái khám'
];

const SCREENING_COLUMNS = [
  'Họ tên (*)', 'Giới tính (*)', 'Năm sinh (*)', 'Tuổi', 'Gia đình mắc ĐTD', 
  'Chiều cao', 'Cân nặng', 'BMI', 'Vòng eo', 'HA tâm thu (*)', 'HA tâm trương (*)',
  'Điểm Giới tính', 'Điểm Tuổi', 'Điểm Gia đình', 'Điểm BMI', 'Điểm Vòng eo', 'Điểm Huyết áp', 'Tổng điểm',
  'Nguy cơ Đái tháo đường', 'Nghi ngờ Tăng huyết áp'
];

const COPD_COLUMNS = [
  'Họ tên (*)', 'Giới tính (*)', 'Năm sinh (*)', 'Tuổi',
  'Hen-C1', 'Hen-C2', 'Hen-C3', 'Hen-C4', 'Hen-C5', 'Hen-C6', 'Hen-C7', 'Nghi ngờ Hen',
  'COPD-C1', 'COPD-C2', 'COPD-C3', 'COPD-C4', 'COPD-C5', 'Nghi ngờ COPD'
];

import { AdvancedConverter } from './components/AdvancedConverter';
import { 
  FileUp, LayoutGrid, ChevronDown, CheckCircle2,
  Table, Activity as ActivityIcon, ArrowLeft
} from 'lucide-react';

function AdministrativeUnitModal({ onSelect, onClose }: { onSelect: (code: string) => void, onClose: () => void }) {
  const [manualCode, setManualCode] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <MapPin className="mr-2 text-blue-600" />
          Chọn Đơn vị hành chính
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã hành chính</label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ví dụ: 31831"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
            />
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Hủy</button>
          <button 
            onClick={() => onSelect(manualCode)} 
            disabled={!manualCode}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

function DownloadOptionsModal({ onConfirm, onClose }: { onConfirm: (tha: boolean, dtd: boolean, over40: boolean, over50: boolean, screening: boolean, copd: boolean) => void, onClose: () => void }) {
  const [tha, setTha] = useState(true);
  const [dtd, setDtd] = useState(true);
  const [over40, setOver40] = useState(false);
  const [over50, setOver50] = useState(false);
  const [screening, setScreening] = useState(false);
  const [copd, setCopd] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl overflow-y-auto max-h-[90vh]">
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <FileOutput className="mr-2 text-blue-600" />
          Tùy chọn tải xuống
        </h3>
        <p className="text-sm text-gray-500 mb-6">Vui lòng chọn các loại file muốn tải:</p>
        
        <div className="space-y-3 mb-8">
          <button 
            onClick={() => setTha(!tha)}
            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${tha ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'}`}
          >
            <div className="flex items-center">
              <Activity size={18} className="mr-2" />
              <span className="font-medium">Tăng Huyết Áp</span>
            </div>
            {tha ? <CheckSquare size={20} /> : <Square size={20} />}
          </button>

          <button 
            onClick={() => setDtd(!dtd)}
            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${dtd ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'}`}
          >
            <div className="flex items-center">
              <Droplet size={18} className="mr-2" />
              <span className="font-medium">Đái Tháo Đường</span>
            </div>
            {dtd ? <CheckSquare size={20} /> : <Square size={20} />}
          </button>

          <button 
            onClick={() => setOver40(!over40)}
            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${over40 ? 'border-amber-600 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-600'}`}
          >
            <div className="flex items-center">
              <Users size={18} className="mr-2" />
              <span className="font-medium">Trên 40 tuổi</span>
            </div>
            {over40 ? <CheckSquare size={20} /> : <Square size={20} />}
          </button>

          <button 
            onClick={() => setOver50(!over50)}
            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${over50 ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600'}`}
          >
            <div className="flex items-center">
              <Users size={18} className="mr-2" />
              <span className="font-medium">Trên 50 tuổi</span>
            </div>
            {over50 ? <CheckSquare size={20} /> : <Square size={20} />}
          </button>

          <button 
            onClick={() => setScreening(!screening)}
            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${screening ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600'}`}
          >
            <div className="flex items-center">
              <Search size={18} className="mr-2" />
              <span className="font-medium">Sàng lọc THA & ĐTĐ</span>
            </div>
            {screening ? <CheckSquare size={20} /> : <Square size={20} />}
          </button>

          <button 
            onClick={() => setCopd(!copd)}
            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${copd ? 'border-violet-600 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-600'}`}
          >
            <div className="flex items-center">
              <Wind size={18} className="mr-2" />
              <span className="font-medium">Sàng lọc COPD & Hen</span>
            </div>
            {copd ? <CheckSquare size={20} /> : <Square size={20} />}
          </button>
        </div>

        <div className="flex space-x-3">
          <button onClick={onClose} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Hủy</button>
          <button 
            onClick={() => onConfirm(tha, dtd, over40, over50, screening, copd)} 
            disabled={!tha && !dtd && !over40 && !over50 && !screening && !copd}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Tải xuống
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileSetupForm({ onSubmit }: { onSubmit: (name: string, org: string) => void }) {
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-50 rounded-full blur-[100px] opacity-50" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-50 rounded-full blur-[100px] opacity-50" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white p-10 rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-100">
          <div className="flex flex-col items-center mb-10">
            <div className="p-4 bg-blue-50 rounded-3xl mb-4 shadow-inner">
              <img src="https://tytpht.hdd.io.vn/img/bmassloadings.png" alt="Logo" className="h-12 w-auto object-contain" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Thiết lập <span className="text-blue-600">Hồ sơ</span></h2>
            <div className="h-1 w-12 bg-blue-600 rounded-full mt-2" />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-4">Kích hoạt tài khoản định danh</p>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên Cá nhân <span className="text-blue-600">(*)</span></label>
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-600/5 rounded-2xl scale-105 opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <input 
                  type="text" 
                  className="relative w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all shadow-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên Đơn vị <span className="text-blue-600">(*)</span></label>
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-600/5 rounded-2xl scale-105 opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <input 
                  type="text" 
                  className="relative w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all shadow-sm"
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  placeholder="Ví dụ: Trạm Y tế Xã A"
                />
              </div>
            </div>

            <motion.button 
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSubmit(name, org)}
              disabled={!name || !org}
              className="w-full py-5 bg-slate-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-slate-200 hover:bg-slate-800 disabled:opacity-20 disabled:cursor-not-allowed transition-all mt-8"
            >
              HOÀN TẤT KÍCH HOẠT
            </motion.button>
          </div>

          <div className="mt-12 flex items-center justify-center gap-4 opacity-20 grayscale">
             <img src="https://tytpht.hdd.io.vn/img/bmassloadings.png" alt="BMASS" className="h-6 w-auto" />
             <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
             <span className="text-[8px] font-black uppercase tracking-[0.4em]">Powered by BMASS Cloud</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Toggle({ enabled, onChange, label, description, icon: Icon, disabled = false }: { enabled: boolean, onChange: (val: boolean) => void, label: string, description?: string, icon?: any, disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`group flex items-center justify-between p-4 rounded-2xl border transition-all ${
        disabled 
          ? 'opacity-50 cursor-not-allowed border-slate-100 bg-slate-50' 
          : enabled 
            ? 'bg-blue-50 border-blue-200 shadow-sm' 
            : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`p-2 rounded-xl transition-colors ${enabled ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
            <Icon size={18} />
          </div>
        )}
        <div className="text-left">
          <p className={`text-sm font-bold ${enabled ? 'text-blue-900' : 'text-slate-700'}`}>{label}</p>
          {description && <p className="text-[10px] text-slate-400 font-medium mt-0.5">{description}</p>}
        </div>
      </div>
      <div className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${enabled ? 'bg-blue-600' : 'bg-slate-200'}`}>
        <motion.div 
          animate={{ x: enabled ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
        />
      </div>
    </button>
  );
}

function MainApp() {
  const { 
    user, profile, 
    logout, needsProfileSetup, setupProfile, loading: authLoading 
  } = useAuth();
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAdminUnit, setShowAdminUnit] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAdvancedConverter, setShowAdvancedConverter] = useState(false);
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});

  const [inputData, setInputData] = useState<any[]>([]);
  const [outputDataTHA, setOutputDataTHA] = useState<any[]>([]);
  const [outputDataDTD, setOutputDataDTD] = useState<any[]>([]);
  const [outputDataScreening, setOutputDataScreening] = useState<any[]>([]);
  const [outputDataCOPD, setOutputDataCOPD] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'THA' | 'DTD' | 'OVER40' | 'OVER50' | 'SCREENING' | 'COPD' | 'MANIFEST'>('THA');
  const [displayLimit, setDisplayLimit] = useState(50);
  const [displayLimitPatient, setDisplayLimitPatient] = useState(50);
  const [processProgress, setProcessProgress] = useState(0);
  const [patientStats, setPatientStats] = useState<any[]>([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [genderFormat, setGenderFormat] = useState<'text' | 'number'>('text');
  const [bsMin, setBsMin] = useState<string>('');
  const [bsMax, setBsMax] = useState<string>('');
  const [showBsConfig, setShowBsConfig] = useState(false);
  const [adminUnitCode, setAdminUnitCode] = useState('');
  const [removeDuplicates, setRemoveDuplicates] = useState(false);
  const [randomFamilyHistory, setRandomFamilyHistory] = useState(false);
  const [randomHeightWeight, setRandomHeightWeight] = useState(false);
  const [randomBP, setRandomBP] = useState(false);
  const [randomCOPD, setRandomCOPD] = useState(false);

  useEffect(() => {
    setDisplayLimit(50);
    setDisplayLimitPatient(50);
  }, [activeTab, inputData]);

  useEffect(() => {
    if (inputData.length > 0) {
      const visitMap = new Map();
      const currentYear = new Date().getFullYear();

      const getVal = (row: any, keys: string[]) => {
        for (const key of keys) {
          if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
        }
        return '';
      };

      inputData.forEach(row => {
        const maBN = getVal(row, ['MA_BENH_NHAN', 'Mã bệnh nhân']);
        const tenBN = getVal(row, ['TEN_BENH_NHAN', 'Họ tên', 'HO_TEN', 'Tên bệnh nhân']);
        const ngayRaStr = getVal(row, ['NGAYRA', 'Ngày ra', 'Ngày khám']);
        const bhyt = getVal(row, ['SO_THE_BHYT', 'Số thẻ BHYT']);
        const diag = getVal(row, ['CHAN_DOAN', 'Chẩn đoán', 'ICD10']);
        const diaChi = getVal(row, ['DIA_CHI', 'Địa chỉ', 'Address']);
        
        const namVal = getVal(row, ['NAM', 'Nam', 'Male']);
        const nuVal = getVal(row, ['NU', 'Nữ', 'Female']);
        const namSinhVal = getVal(row, ['NAM_SINH', 'Năm sinh', 'BirthYear']);
        const tuoiVal = getVal(row, ['TUOI', 'Tuổi', 'Age']);
        
        const cccd = getVal(row, ['CCCD', 'CMND', 'Số căn cước', 'SO_CMND']);
        const sdt = getVal(row, ['DIEN_THOAI', 'Số điện thoại', 'SO_DIEN_THOAI', 'SĐT']);
        const weightRaw = getVal(row, ['CAN_NANG', 'Cân nặng', 'Weight']);
        const heightRaw = getVal(row, ['CHIEU_CAO', 'Chiều cao', 'Height']);
        const haCaoExtract = getVal(row, ['Huyết áp cao', 'HA_CAO', 'HA_TAM_THU', 'HA tâm thu']);
        const haThapExtract = getVal(row, ['Huyết áp thấp', 'HA_THAP', 'HA_TAM_TRUONG', 'HA tâm trương']);

        if (!maBN) return; // Skip if no ID

        // Age calculation
        let birthYear = '';
        let gender = 'Không rõ';
        if (namVal !== '') { gender = 'Nam'; birthYear = String(namVal); }
        else if (nuVal !== '') { gender = 'Nữ'; birthYear = String(nuVal); }
        else if (namSinhVal !== '') { birthYear = String(namSinhVal); }
        
        if (birthYear && birthYear.length > 4) {
           const match = birthYear.match(/\d{4}/);
           if (match) birthYear = match[0];
        }
        const age = birthYear ? currentYear - parseInt(birthYear, 10) : (tuoiVal ? parseInt(String(tuoiVal), 10) : 0);

        let ageGroup = 'Không rõ';
        if (age > 0) {
           if (age < 40) ageGroup = '< 40 tuổi';
           else if (age <= 49) ageGroup = '40-49 tuổi';
           else if (age <= 59) ageGroup = '50-59 tuổi';
           else ageGroup = '>= 60 tuổi';
        }

        const diagStr = String(diag).toUpperCase();
        const hasTHA = diagStr.includes('I10') || diagStr.includes('I11') || diagStr.includes('I12') || diagStr.includes('I13') || diagStr.includes('I15');
        const hasDTD = diagStr.includes('E10') || diagStr.includes('E11') || diagStr.includes('E12') || diagStr.includes('E13') || diagStr.includes('E14');
        
        let dateVal = 0;
        let isCurrentYear = false;
        
        if (ngayRaStr) {
          const str = String(ngayRaStr).trim();
          const parts = str.split(/[-/]/);
          if (parts.length >= 3) {
            const y = parseInt(parts[2], 10);
            if (y === currentYear || y === 2026) isCurrentYear = true;
            dateVal = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
          } else {
             const d = new Date(str);
             dateVal = d.getTime();
             if (d.getFullYear() === currentYear || d.getFullYear() === 2026) isCurrentYear = true;
          }
        }
        if (isNaN(dateVal)) dateVal = 0;

        if (visitMap.has(maBN)) {
          const existing = visitMap.get(maBN);
          existing.count += 1;
          if (isCurrentYear) existing.countCurrentYear += 1;
          
          if (hasTHA) existing.hasTHA = true;
          if (hasDTD) existing.hasDTD = true;
          if (!existing.diaChi && diaChi) existing.diaChi = diaChi;
          if (!existing.age && age) {
             existing.age = age;
             existing.gender = gender;
             existing.ageGroup = ageGroup;
          }
          
          if (dateVal >= existing.latestDateVal) {
            existing.latestDateVal = dateVal;
            existing.latestDateStr = ngayRaStr;
            existing.diag = diag;
            if (diaChi) existing.diaChi = diaChi; // latest address
            if (cccd) existing.cccd = cccd;
            if (sdt) existing.sdt = sdt;
            if (weightRaw) existing.weight = weightRaw;
            if (heightRaw) existing.height = heightRaw;
            if (haCaoExtract) existing.haCao = haCaoExtract;
            if (haThapExtract) existing.haThap = haThapExtract;
          }
        } else {
          visitMap.set(maBN, {
            maBN,
            tenBN,
            bhyt,
            count: 1,
            countCurrentYear: isCurrentYear ? 1 : 0,
            latestDateVal: dateVal,
            latestDateStr: ngayRaStr,
            diag,
            diaChi,
            age,
            birthYear,
            gender,
            ageGroup,
            hasTHA,
            hasDTD,
            cccd,
            sdt,
            weight: weightRaw,
            height: heightRaw,
            haCao: haCaoExtract,
            haThap: haThapExtract
          });
        }
      });

      const sorted = Array.from(visitMap.values()).sort((a, b) => b.count - a.count);
      setPatientStats(sorted);
    } else {
      setPatientStats([]);
    }
  }, [inputData]);

  const formattedPatientData = useMemo(() => {
    if (patientStats.length === 0) return [];
    
    return patientStats.map((p, index) => {
      let gioiTinh = p.gender;
      if (genderFormat === 'number') {
        gioiTinh = p.gender === 'Nam' ? '1' : (p.gender === 'Nữ' ? '2' : '');
      }
      
      let phanLoai = 'Khác';
      if (p.hasTHA && p.hasDTD) phanLoai = 'Tăng huyết áp, Đái tháo đường';
      else if (p.hasTHA) phanLoai = 'Tăng huyết áp';
      else if (p.hasDTD) phanLoai = 'Đái tháo đường';
      
      return {
        'Stt': index + 1,
        'Mã BN': p.maBN,
        'Họ tên (*)': p.tenBN,
        'Giới tính (*)': gioiTinh,
        'Năm sinh (*)': p.birthYear || '', // If no birth year, it's blank
        'Mã BHYT (*)': p.bhyt,
        'Số CMT/CCCD (*)': p.cccd || '',
        'Số điện thoại': p.sdt || '',
        'Địa chỉ': p.diaChi,
        'Xã/Phường/Thị trấn (*)': adminUnitCode || '',
        'Ngày phát hiện bệnh': '',
        'Nơi phát hiện': '',
        'Ngày khám (*)': p.latestDateStr,
        'Phân loại BN (*)': phanLoai,
        'HA tâm thu (*)': p.haCao || '',
        'HA tâm trương (*)': p.haThap || '',
        'Cân nặng': p.weight || '',
        'Chiều cao': p.height || '',
        'Vòng eo': '',
        'Hút thuốc lá': '',
        'Mức độ uống rượu bia': '',
        'Thực hành giảm ăn muối': '',
        'Ăn đủ 400g rau và trái cây': '',
        'Hoạt động thể lực đủ theo khuyến nghị': '',
        'Chẩn đoán': p.diag,
        'Thuốc điều trị': '',
        'Số ngày nhận thuốc': '',
        'Biến chứng': '',
        'Kết quả điều trị': '',
        'Ngày tái khám': '',
        'Số lượt khám trong năm': p.countCurrentYear,
        'Tổng số lượt khám': p.count
      };
    });
  }, [patientStats, genderFormat, adminUnitCode]);

  const exportPatientStats = () => {
    if (formattedPatientData.length === 0) return;
    
    const ws = XLSX.utils.json_to_sheet(formattedPatientData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "QuanLyLuotKham");
    XLSX.writeFile(wb, "Danh_sach_benh_nhan_den_kham.xlsx");
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sectionFileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = profile?.role === 'admin' || profile?.email === 'sonlyhongduc@gmail.com';
  const isSubAdmin = profile?.role === 'subadmin';
  const isAuthorized = isAdmin || isSubAdmin;
  const hasPremiumAccess = true; 
  const hasAdvancedAccess = isAdmin; 

  const transformData = (data: any[], currentGenderFormat: 'text' | 'number', currentAdminUnit: string) => {
    const currentYear = new Date().getFullYear();
    const thaData: any[] = [];
    const dtdData: any[] = [];
    const screeningData: any[] = [];
    const copdData: any[] = [];

    const getVal = (row: any, keys: string[]) => {
      for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
      }
      return '';
    };

    // Helper for stable random values based on row content
    const getStableRandom = (row: any, seed: string, offset: number) => {
      const bhyt = String(getVal(row, ['SO_THE_BHYT', 'MA_THE', 'Mã BHYT', 'Số thẻ BHYT']) || '');
      const name = String(getVal(row, ['TEN_BENH_NHAN', 'HO_TEN', 'Họ tên', 'Tên bệnh nhân']) || '');
      const source = bhyt + name + seed + offset;
      let hash = 0;
      for (let i = 0; i < source.length; i++) {
        hash = ((hash << 5) - hash) + source.charCodeAt(i);
        hash |= 0;
      }
      return (Math.abs(hash) % 1000) / 1000;
    };

    data.forEach((row, index) => {
      let gender = '';
      let birthYear = '';
      
      const namVal = getVal(row, ['NAM', 'Nam', 'Male']);
      const nuVal = getVal(row, ['NU', 'Nữ', 'Female']);
      const gioiTinhVal = getVal(row, ['GIOI_TINH', 'Giới tính', 'Gender']);
      const namSinhVal = getVal(row, ['NAM_SINH', 'Năm sinh', 'BirthYear', 'YearOfBirth']);
      const tuoiVal = getVal(row, ['TUOI', 'Tuổi', 'Age']);

      let isMale = false;
      if (namVal !== '') {
        isMale = true;
        gender = currentGenderFormat === 'number' ? '01' : 'Nam';
        const age = parseInt(namVal, 10);
        if (!isNaN(age) && age < 150) birthYear = String(currentYear - age);
        else birthYear = String(namVal);
      } else if (nuVal !== '') {
        isMale = false;
        gender = currentGenderFormat === 'number' ? '02' : 'Nữ';
        const age = parseInt(nuVal, 10);
        if (!isNaN(age) && age < 150) birthYear = String(currentYear - age);
        else birthYear = String(nuVal);
      } else if (gioiTinhVal !== '') {
        const gt = String(gioiTinhVal).toLowerCase();
        if (gt.includes('nam') || gt === '1' || gt === 'm' || gt === 'male') {
          isMale = true;
          gender = currentGenderFormat === 'number' ? '01' : 'Nam';
        } else if (gt.includes('nữ') || gt.includes('nu') || gt === '2' || gt === 'f' || gt === 'female') {
          isMale = false;
          gender = currentGenderFormat === 'number' ? '02' : 'Nữ';
        }
      }

      if (birthYear === '') {
        if (namSinhVal !== '') {
          birthYear = String(namSinhVal);
        } else if (tuoiVal !== '') {
          const age = parseInt(tuoiVal, 10);
          if (!isNaN(age)) birthYear = String(currentYear - age);
        }
      }

      if (birthYear.length > 4) {
        const match = birthYear.match(/\d{4}/);
        if (match) birthYear = match[0];
      }

      const formattedBirthYear = birthYear && birthYear.length === 4 ? `01/01/${birthYear}` : birthYear;
      const age = birthYear ? currentYear - parseInt(birthYear, 10) : 0;

      const diagnosis = getVal(row, ['CHAN_DOAN', 'Chẩn đoán', 'MA_BENH', 'ICD10']) || '';
      const hasTHA = diagnosis.includes('I10') || diagnosis.includes('I11') || diagnosis.includes('I12') || diagnosis.includes('I13') || diagnosis.includes('I15');
      const hasDTD = diagnosis.includes('E10') || diagnosis.includes('E11') || diagnosis.includes('E12') || diagnosis.includes('E13') || diagnosis.includes('E14');

      // 1. Original Values
      let weightRaw = getVal(row, ['CAN_NANG', 'Cân nặng', 'Weight']);
      let heightRaw = getVal(row, ['CHIEU_CAO', 'Chiều cao', 'Height']);
      let weight = parseFloat(weightRaw);
      let height = parseFloat(heightRaw);
      const isMissingWeight = isNaN(weight) || weight <= 0 || String(weightRaw).toLowerCase().includes('không');
      const isMissingHeight = isNaN(height) || height <= 0 || String(heightRaw).toLowerCase().includes('không');

      let familyHistory = getVal(row, ['TIEN_SU_GIA_DINH', 'Gia đình mắc ĐTD']);
      const isMissingFamily = !familyHistory || familyHistory.toLowerCase().includes('không') || familyHistory.toLowerCase().includes('trống');

      let sbpRaw = getVal(row, ['HUYET_AP_CAO', 'HA_TAM_THU', 'Huyết áp cao', 'HA tâm thu']);
      let dbpRaw = getVal(row, ['HUYET_AP_THAP', 'HA_TAM_TRUONG', 'Huyết áp thấp', 'HA tâm trương']);
      let sbp = parseFloat(sbpRaw);
      let dbp = parseFloat(dbpRaw);
      const isMissingBP = (isNaN(sbp) || sbp <= 0) && (isNaN(dbp) || dbp <= 0);

      let waistRaw = getVal(row, ['VONG_EO', 'Vòng eo']);
      let waist = parseFloat(waistRaw);
      const isMissingWaist = isNaN(waist) || waist <= 0 || String(waistRaw).toLowerCase().includes('không');

      // 2. Randomized Values (Calculated once per row, but stable)
      let randWeight = weight;
      let randHeight = height;
      let randWaist = waist;
      if (randomHeightWeight && isAdmin) {
        if (isMissingWeight) randWeight = Math.floor(getStableRandom(row, 'weight', 0) * (75 - 50 + 1)) + 50;
        if (isMissingHeight) randHeight = Math.floor(getStableRandom(row, 'height', 1) * (170 - 158 + 1)) + 158;
        if (isMissingWaist) {
          if (isMale) {
            randWaist = Math.floor(getStableRandom(row, 'waist', 3) * (100 - 75 + 1)) + 75;
          } else {
            randWaist = Math.floor(getStableRandom(row, 'waist', 3) * (90 - 65 + 1)) + 65;
          }
        }
      }

      let randFamily = familyHistory;
      if (randomFamilyHistory && isAdmin && isMissingFamily) {
        randFamily = getStableRandom(row, 'family', 2) > 0.8 ? 'Có' : 'Không';
      } else if (!familyHistory) {
        randFamily = 'Không';
      }

      let randSBP = sbp;
      let randDBP = dbp;
      if (randomBP && isAdmin && isMissingBP) {
        randSBP = 120;
        randDBP = 80;
      }

      const commonFields = {
        'Họ tên (*)': getVal(row, ['TEN_BENH_NHAN', 'HO_TEN', 'Họ tên', 'Tên bệnh nhân']),
        'Giới tính (*)': gender,
        'Năm sinh (*)': formattedBirthYear,
        'Mã BHYT (*)': getVal(row, ['SO_THE_BHYT', 'MA_THE', 'Mã BHYT', 'Số thẻ BHYT']),
        'Số CMT/CCCD (*)': getVal(row, ['SO_CMT', 'CMND', 'CCCD', 'Số CMT/CCCD']),
        'Số điện thoại': getVal(row, ['DIEN_THOAI', 'Số điện thoại', 'SDT', 'Phone']),
        'Địa chỉ': getVal(row, ['DIA_CHI', 'Địa chỉ']),
        'Xã/Phường/Thị trấn (*)': currentAdminUnit || '',
        'Ngày khám (*)': getVal(row, ['NGAYRA', 'NGAY_KHAM', 'Ngày khám', 'Ngày ra']),
        'Chẩn đoán': diagnosis,
        'Thuốc điều trị': getVal(row, ['CHAN_DOAN_KKB', 'THUOC', 'Thuốc điều trị', 'Đơn thuốc']),
        'Số ngày nhận thuốc': getVal(row, ['SO_NGAY_CAP', 'Số ngày nhận thuốc', 'Số ngày']),
        'Kết quả điều trị': getVal(row, ['KET_QUA_DIEU_TRI', 'Kết quả điều trị']) || '',
        'Ngày tái khám': getVal(row, ['NGAY_TAI_KHAM', 'Ngày tái khám'])
      };

      if (hasTHA) {
        thaData.push({
          ...commonFields,
          'HA tâm thu (*)': randSBP || '',
          'HA tâm trương (*)': randDBP || '',
          'Cân nặng': randWeight || '',
          'Chiều cao': randHeight || '',
          'Ăn đủ 400g rau và trái cây': getVal(row, ['AN_RAU_TRAI_CAY', 'Ăn đủ 400g rau']),
        });
      }

      if (hasDTD) {
        dtdData.push({
          ...commonFields,
          'Cân nặng': randWeight || '',
          'Chiều cao': randHeight || '',
          'Đường huyết (*)': getVal(row, ['DUONG_HUYET', 'DUONG_HUYET', 'BloodSugar']),
          'HbA1C': getVal(row, ['HBA1C', 'HbA1C']),
          'Rối loạn lipid máu (*)': getVal(row, ['ROI_LOAN_LIPID', 'Rối loạn lipid máu']),
          'Thực hành ăn uống hợp lý': getVal(row, ['AN_UONG_HOP_LY', 'Thực hành ăn uống hợp lý']),
        });
      }

      // Screening Logic
      if (age >= 40) {
        let bmi = 0;
        if (randWeight > 0 && randHeight > 0) {
          const hMeter = randHeight / 100;
          bmi = parseFloat((randWeight / (hMeter * hMeter)).toFixed(1));
        }

        const ptsGender = isMale ? 2 : 0;
        const ptsAge = age < 45 ? 0 : (age <= 49 ? 1 : 2);
        const ptsFamily = randFamily === 'Có' ? 4 : 0;
        const ptsBMI = bmi < 23 ? 0 : (bmi < 27.5 ? 3 : 5);
        
        let ptsWaist = 0;
        if (isMale) ptsWaist = randWaist >= 90 ? 2 : 0;
        else ptsWaist = randWaist >= 80 ? 2 : 0;

        const ptsBP = (randSBP >= 140 || randDBP >= 90) ? 2 : 0;
        const totalPts = ptsGender + ptsAge + ptsFamily + ptsBMI + ptsWaist + ptsBP;

        screeningData.push({
          ...commonFields,
          'Tuổi': age,
          'Gia đình mắc ĐTD': randFamily,
          'Chiều cao': randHeight || '',
          'Cân nặng': randWeight || '',
          'BMI': bmi || '',
          'Vòng eo': randWaist || '',
          'HA tâm thu (*)': randSBP || '',
          'HA tâm trương (*)': randDBP || '',
          'Điểm Giới tính': ptsGender,
          'Điểm Tuổi': ptsAge,
          'Điểm Gia đình': ptsFamily,
          'Điểm BMI': ptsBMI,
          'Điểm Vòng eo': ptsWaist,
          'Điểm Huyết áp': ptsBP,
          'Tổng điểm': totalPts,
          'Nguy cơ Đái tháo đường': totalPts >= 6 ? 'Có' : 'Không',
          'Nghi ngờ Tăng huyết áp': ptsBP > 0 ? 'Có' : 'Không'
        });
      }

      // COPD & Hen logic
      if (age >= 50) {
        const henFields: any = {};
        const henKeys = ['Hen-C1', 'Hen-C2', 'Hen-C3', 'Hen-C4', 'Hen-C5', 'Hen-C6', 'Hen-C7'];
        henKeys.forEach(k => { henFields[k] = getVal(row, [k, k.replace('-', '_')]) || 'Không'; });

        const copdFields: any = {};
        const copdKeys = ['COPD-C1', 'COPD-C2', 'COPD-C3', 'COPD-C4', 'COPD-C5'];
        copdKeys.forEach(k => {
          let val = getVal(row, [k, k.replace('-', '_')]) || 'Không';
          if (k === 'COPD-C4' && (val === '' || val === 'Không')) val = 'Có';
          copdFields[k] = val;
        });

        if (randomCOPD && isAdmin) {
          const addSymptoms = (fields: any, keys: string[], seedPrefix: string) => {
            // Determine if this person should have symptoms at all (approx 10% chance)
            if (getStableRandom(row, seedPrefix + 'DiseaseProb', 999) > 0.1) return;

            // Pick 1-2 symptoms for this person
            const numToPick = Math.floor(getStableRandom(row, seedPrefix + 'Count', 777) * 2) + 1; // 1 or 2
            
            // Shuffle keys slightly using stable random
            const shuffledKeys = [...keys].sort((a,b) => getStableRandom(row, seedPrefix + a, 1) - getStableRandom(row, seedPrefix + b, 2));

            for (let i = 0; i < numToPick; i++) {
              fields[shuffledKeys[i]] = 'Có';
            }
          };
          addSymptoms(henFields, henKeys, 'hen');
          addSymptoms(copdFields, copdKeys, 'copd');
        }

        const henCount = Object.values(henFields).filter(v => v === 'Có').length;
        const copdCount = Object.values(copdFields).filter(v => v === 'Có').length;
        
        copdData.push({
          'Mã BHYT (*)': commonFields['Mã BHYT (*)'],
          'Ngày khám (*)': commonFields['Ngày khám (*)'],
          'Họ tên (*)': commonFields['Họ tên (*)'],
          'Giới tính (*)': commonFields['Giới tính (*)'],
          'Năm sinh (*)': commonFields['Năm sinh (*)'],
          'Tuổi': age,
          ...henFields,
          'Nghi ngờ Hen': henCount >= 2 ? 'Có' : 'Không',
          ...copdFields,
          'Nghi ngờ COPD': copdCount >= 3 ? 'Có' : 'Không'
        });
      }
    });

    return { thaData, dtdData, screeningData, copdData };
  };

  const processFile = (file: File) => {
    setError('');
    setFileName(file.name);
    setIsProcessing(true);
    setProcessProgress(0);
    
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        setProcessProgress(Math.round((e.loaded / e.total) * 50));
      }
    };

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          setError('File không có dữ liệu.');
          setIsProcessing(false);
          return;
        }

        setInputData(jsonData);
        setProcessProgress(75);
        const { thaData, dtdData, screeningData, copdData } = transformData(jsonData, genderFormat, adminUnitCode);
        setOutputDataTHA(thaData);
        setOutputDataDTD(dtdData);
        setOutputDataScreening(screeningData);
        setOutputDataCOPD(copdData);
        
        if (thaData.length > 0) setActiveTab('THA');
        else if (dtdData.length > 0) setActiveTab('DTD');
        
        setProcessProgress(100);
        setTimeout(() => setIsProcessing(false), 500);
      } catch (err) {
        setError('Lỗi khi đọc file. Vui lòng đảm bảo đây là file Excel hợp lệ (.xlsx, .xls, .csv).');
        setIsProcessing(false);
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDownloadSample = () => {
    const sampleHeaders = [
      {
        'STT': '1',
        'NGAYRA': '15/10/2023',
        'MA_BENH_NHAN': 'BN00123',
        'SOPHIEUTHANHTOAN': 'PTT001',
        'TEN_BENH_NHAN': 'Nguyễn Văn A',
        'NAM': '1980',
        'NU': '',
        'DIA_CHI': 'Hà Nội',
        'SO_THE_BHYT': 'DN4010123456789',
        'NOI_GIOI_THIEU': '',
        'TRIEUCHUNGLS': 'Đau đầu, nhức mỏi',
        'CD_TUYEN_DUOI': '',
        'CHAN_DOAN': 'I10 - Tăng huyết áp vô căn',
        'CHAN_DOAN_KKB': '',
        'VAO_VIEN': '0',
        'TUYEN_TREN': '0',
        'TUYENDUOI': '0',
        'NGOAI_TRU': '1',
        'VE_NHA': '0',
        'TT': '1',
        'CK': 'Nội khoa',
        'TEN_BAC_SI': 'BS Trần B',
        'Mạch': '80',
        'Huyết áp thấp': '85',
        'Huyết áp cao': '140',
        'Nhịp thở': '20',
        'Nhiệt độ': '37',
        'Chiều cao': '165',
        'Cân nặng': '65'
      },
      {
        'STT': '2',
        'NGAYRA': '16/10/2023',
        'MA_BENH_NHAN': 'BN00124',
        'SOPHIEUTHANHTOAN': 'PTT002',
        'TEN_BENH_NHAN': 'Trần Thị B',
        'NAM': '',
        'NU': '1975',
        'DIA_CHI': 'Hồ Chí Minh',
        'SO_THE_BHYT': 'HC4010123456780',
        'NOI_GIOI_THIEU': '',
        'TRIEUCHUNGLS': 'Đường huyết cao',
        'CD_TUYEN_DUOI': '',
        'CHAN_DOAN': 'E11 - Đái tháo đường không phụ thuộc insulin',
        'CHAN_DOAN_KKB': '',
        'VAO_VIEN': '0',
        'TUYEN_TREN': '0',
        'TUYENDUOI': '0',
        'NGOAI_TRU': '1',
        'VE_NHA': '0',
        'TT': '1',
        'CK': 'Nội tiết',
        'TEN_BAC_SI': 'BS Lê C',
        'Mạch': '75',
        'Huyết áp thấp': '80',
        'Huyết áp cao': '120',
        'Nhịp thở': '18',
        'Nhiệt độ': '36.5',
        'Chiều cao': '155',
        'Cân nặng': '58'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleHeaders);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mau_Du_Lieu");
    XLSX.writeFile(wb, "Mau_Du_Lieu_Bmass.xlsx");
  };

  const handleApplyAdminUnit = (code?: string) => {
    const targetCode = code || adminUnitCode;
    if (!targetCode) {
      setError('Vui lòng nhập mã đơn vị hành chính.');
      return;
    }
    setError('');
    const updateUnit = (data: any[]) => data.map(row => ({
      ...row,
      'Xã/Phường/Thị trấn (*)': targetCode
    }));
    
    setOutputDataTHA(updateUnit(outputDataTHA));
    setOutputDataDTD(updateUnit(outputDataDTD));
    setOutputDataScreening(updateUnit(outputDataScreening));
    setOutputDataCOPD(updateUnit(outputDataCOPD));
  };

  const handleApplyFilters = () => {
    handleApplyAdminUnit();
    setError('Đã áp dụng bộ lọc thành công.');
    setTimeout(() => setError(''), 3000);
  };

  useEffect(() => {
    if (inputData.length > 0) {
      const { thaData, dtdData, screeningData, copdData } = transformData(inputData, genderFormat, adminUnitCode);
      setOutputDataTHA(thaData);
      setOutputDataDTD(dtdData);
      setOutputDataScreening(screeningData);
      setOutputDataCOPD(copdData);
    }
  }, [genderFormat, adminUnitCode, randomFamilyHistory, randomHeightWeight, randomBP, randomCOPD, inputData]);

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setAdminUnitCode('');
    setBsMin('');
    setBsMax('');
    setGenderFormat('text');
    
    // Re-transform data to original state
    if (inputData.length > 0) {
      const { thaData, dtdData, screeningData, copdData } = transformData(inputData, 'text', '');
      setOutputDataTHA(thaData);
      setOutputDataDTD(dtdData);
      setOutputDataScreening(screeningData);
      setOutputDataCOPD(copdData);
    }
    
    setError('Đã xóa tất cả bộ lọc.');
    setTimeout(() => setError(''), 3000);
  };

  const handleGenderFormatChange = (format: 'text' | 'number') => {
    setGenderFormat(format);
    const updateGender = (data: any[]) => data.map(row => {
      let current = row['Giới tính (*)'];
      let newGender = current;
      if (format === 'number') {
        if (current === 'Nam') newGender = '01';
        if (current === 'Nữ') newGender = '02';
      } else {
        if (current === '01') newGender = 'Nam';
        if (current === '02') newGender = 'Nữ';
      }
      return { ...row, 'Giới tính (*)': newGender };
    });
    
    setOutputDataTHA(updateGender(outputDataTHA));
    setOutputDataDTD(updateGender(outputDataDTD));
    setOutputDataScreening(updateGender(outputDataScreening));
    setOutputDataCOPD(updateGender(outputDataCOPD));
  };

  const handleApplyBloodSugar = () => {
    if (!hasAdvancedAccess) {
      setError('Tính năng cấu hình đường huyết yêu cầu quyền nâng cao. Vui lòng liên hệ Admin.');
      return;
    }
    const min = parseFloat(bsMin);
    const max = parseFloat(bsMax);
    if (isNaN(min) || isNaN(max) || min > max) {
      setError('Vui lòng nhập khoảng đường huyết hợp lệ (Min <= Max).');
      return;
    }
    setError('');
    const updatedDTD = outputDataDTD.map(row => {
      const randomBs = (Math.random() * (max - min) + min).toFixed(1);
      return { ...row, 'Đường huyết (*)': randomBs };
    });
    setOutputDataDTD(updatedDTD);
    setShowBsConfig(false);
  };

  const parseDate = (dateStr: any) => {
    if (dateStr === undefined || dateStr === null || dateStr === '') return null;
    if (typeof dateStr === 'number') {
      // Excel serial date
      if (dateStr > 10000 && dateStr < 100000) {
        return new Date(Math.round((dateStr - 25569) * 86400 * 1000));
      }
      dateStr = String(dateStr);
    }
    const str = String(dateStr).trim();
    
    // DD/MM/YYYY or DD-MM-YYYY
    const dmy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (dmy) {
      return new Date(parseInt(dmy[3], 10), parseInt(dmy[2], 10) - 1, parseInt(dmy[1], 10));
    }

    // YYYY-MM-DD
    const ymd = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
    if (ymd) {
      return new Date(parseInt(ymd[1], 10), parseInt(ymd[2], 10) - 1, parseInt(ymd[3], 10));
    }

    // YYYYMMDD or DDMMYYYY
    if (str.length === 8 && /^\d{8}$/.test(str)) {
      const y1 = parseInt(str.substring(0, 4), 10);
      const m1 = parseInt(str.substring(4, 6), 10) - 1;
      const d1 = parseInt(str.substring(6, 8), 10);
      if (y1 > 1900 && y1 < 2100 && m1 >= 0 && m1 < 12 && d1 > 0 && d1 <= 31) {
        return new Date(y1, m1, d1);
      }
      const d2 = parseInt(str.substring(0, 2), 10);
      const m2 = parseInt(str.substring(2, 4), 10) - 1;
      const y2 = parseInt(str.substring(4, 8), 10);
      if (y2 > 1900 && y2 < 2100 && m2 >= 0 && m2 < 12 && d2 > 0 && d2 <= 31) {
        return new Date(y2, m2, d2);
      }
    }

    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  };

  const getBaseFilteredData = (data: any[]) => {
    let filtered = data;
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      filtered = filtered.filter(row => {
        const rowDate = parseDate(row['Ngày khám (*)']);
        if (!rowDate) return false;
        return rowDate >= start && rowDate <= end;
      });
    }

    return filtered;
  };

  const applyDuplicateRemoval = (filtered: any[]) => {
    if (!removeDuplicates) return filtered;

    const uniqueMap = new Map<string, any>();
    const noBhytRows: any[] = [];
    
    filtered.forEach(row => {
      const bhyt = String(row['Mã BHYT (*)'] || '').trim();
      if (!bhyt) {
        noBhytRows.push(row);
        return;
      }
      
      // Lấy 10 số cuối
      const key = bhyt.length >= 10 ? bhyt.slice(-10) : bhyt;
      const currentDate = parseDate(row['Ngày khám (*)']);
      
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, row);
      } else {
        const existingRow = uniqueMap.get(key);
        const existingDate = parseDate(existingRow['Ngày khám (*)']);
        
        if (currentDate && existingDate && currentDate > existingDate) {
          uniqueMap.set(key, row);
        }
      }
    });
    
    return [...noBhytRows, ...Array.from(uniqueMap.values())];
  };

  const getDuplicateStats = (data: any[]) => {
    const counts = new Map<string, { count: number, name: string, rows: any[] }>();
    data.forEach(row => {
      const rawBhyt = String(row['Mã BHYT (*)'] || '').trim();
      if (!rawBhyt) return;
      const key = rawBhyt.length >= 10 ? rawBhyt.slice(-10) : rawBhyt;
      
      if (!counts.has(key)) {
        counts.set(key, { count: 1, name: row['Họ tên (*)'], rows: [row] });
      } else {
        const existing = counts.get(key)!;
        existing.count += 1;
        existing.rows.push(row);
      }
    });
    
    return Array.from(counts.entries())
      .filter(([_, info]) => info.count > 1)
      .map(([key, info]) => ({
        bhyt: key,
        name: info.name,
        count: info.count,
        dates: info.rows.map(r => r['Ngày khám (*)']).join(', ')
      }))
      .sort((a, b) => b.count - a.count);
  };

  const baseFilteredTHA = getBaseFilteredData(outputDataTHA);
  const baseFilteredDTD = getBaseFilteredData(outputDataDTD);
  const baseFilteredScreening = getBaseFilteredData(outputDataScreening);
  const baseFilteredCOPD = getBaseFilteredData(outputDataCOPD);

  const filteredTHA = applyDuplicateRemoval(baseFilteredTHA);
  const filteredDTD = applyDuplicateRemoval(baseFilteredDTD);
  const filteredScreening = applyDuplicateRemoval(baseFilteredScreening);
  const filteredCOPD = applyDuplicateRemoval(baseFilteredCOPD);

  const currentYear = new Date().getFullYear();
  const over40List = useMemo(() => {
    const allData = [...filteredTHA, ...filteredDTD];
    const uniqueMap = new Map<string, any>();
    allData.forEach(row => {
      const bhyt = String(row['Mã BHYT (*)'] || '').trim();
      const namSinhStr = String(row['Năm sinh (*)'] || '');
      const match = namSinhStr.match(/\d{4}/);
      const birthYear = match ? parseInt(match[0], 10) : NaN;
      if (bhyt && !isNaN(birthYear) && (currentYear - birthYear) >= 40) {
        uniqueMap.set(bhyt, row);
      }
    });
    return Array.from(uniqueMap.values());
  }, [filteredTHA, filteredDTD, currentYear]);

  const over50List = useMemo(() => {
    const allData = [...filteredTHA, ...filteredDTD];
    const uniqueMap = new Map<string, any>();
    allData.forEach(row => {
      const bhyt = String(row['Mã BHYT (*)'] || '').trim();
      const namSinhStr = String(row['Năm sinh (*)'] || '');
      const match = namSinhStr.match(/\d{4}/);
      const birthYear = match ? parseInt(match[0], 10) : NaN;
      if (bhyt && !isNaN(birthYear) && (currentYear - birthYear) >= 50) {
        uniqueMap.set(bhyt, row);
      }
    });
    return Array.from(uniqueMap.values());
  }, [filteredTHA, filteredDTD, currentYear]);

  const currentBaseData = activeTab === 'THA' ? baseFilteredTHA : 
                          activeTab === 'DTD' ? baseFilteredDTD : 
                          activeTab === 'SCREENING' ? baseFilteredScreening : 
                          activeTab === 'COPD' ? baseFilteredCOPD : 
                          baseFilteredTHA; // fallback
  const duplicateStats = getDuplicateStats(currentBaseData);

  const exportScreeningToExcel = (data: any[], fileName: string) => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data, { header: SCREENING_COLUMNS });
    XLSX.utils.book_append_sheet(wb, ws, "Screening_Results");
    XLSX.writeFile(wb, `${fileName}_Screening.xlsx`);
  };

  const exportCOPDToExcel = (data: any[], fileName: string) => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data, { header: COPD_COLUMNS });
    XLSX.utils.book_append_sheet(wb, ws, "COPD_Hen_Results");
    XLSX.writeFile(wb, `${fileName}_COPD_Hen.xlsx`);
  };

  const handleDownload = () => {
    if (activeTab === 'MANIFEST') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(inputData);
      XLSX.utils.book_append_sheet(wb, ws, "Full_Manifest");
      XLSX.writeFile(wb, `${fileName}_Full_Manifest.xlsx`);
      return;
    }
    if (activeTab === 'OVER40') {
      executeDownload(false, false, true, false, false, false);
      return;
    }
    if (activeTab === 'OVER50') {
      executeDownload(false, false, false, true, false, false);
      return;
    }
    if (activeTab === 'SCREENING') {
      executeDownload(false, false, false, false, true, false);
      return;
    }
    if (activeTab === 'COPD') {
      executeDownload(false, false, false, false, false, true);
      return;
    }
    if (!startDate || !endDate) {
      setShowDownloadOptions(true);
      return;
    }
    executeDownload(true, true, false, false, false, false);
  };

  const executeDownload = (downloadTHA: boolean, downloadDTD: boolean, downloadOver40: boolean = false, downloadOver50: boolean = false, downloadScreening: boolean = false, downloadCOPD: boolean = false) => {
    setError('');
    const originalName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;

    if (downloadTHA && filteredTHA.length > 0) {
      const wbTHA = XLSX.utils.book_new();
      const wsTHA = XLSX.utils.json_to_sheet(filteredTHA, { header: THA_COLUMNS });
      XLSX.utils.book_append_sheet(wbTHA, wsTHA, "Tăng Huyết Áp");
      XLSX.writeFile(wbTHA, `${originalName}_THA.xlsx`);
    }

    if (downloadDTD && filteredDTD.length > 0) {
      const wbDTD = XLSX.utils.book_new();
      const wsDTD = XLSX.utils.json_to_sheet(filteredDTD, { header: DTD_COLUMNS });
      XLSX.utils.book_append_sheet(wbDTD, wsDTD, "Đái Tháo Đường");
      XLSX.writeFile(wbDTD, `${originalName}_DTD.xlsx`);
    }

    if (downloadOver40 && over40List.length > 0) {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(over40List, { header: Array.from(new Set([...THA_COLUMNS, ...DTD_COLUMNS])) });
      XLSX.utils.book_append_sheet(wb, ws, "Trên 40 tuổi");
      XLSX.writeFile(wb, `${originalName}_Tren40.xlsx`);
    }

    if (downloadOver50 && over50List.length > 0) {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(over50List, { header: Array.from(new Set([...THA_COLUMNS, ...DTD_COLUMNS])) });
      XLSX.utils.book_append_sheet(wb, ws, "Trên 50 tuổi");
      XLSX.writeFile(wb, `${originalName}_Tren50.xlsx`);
    }

    if (downloadScreening && filteredScreening.length > 0) {
      exportScreeningToExcel(filteredScreening, originalName);
    }

    if (downloadCOPD && filteredCOPD.length > 0) {
      exportCOPDToExcel(filteredCOPD, originalName);
    }
    setShowDownloadOptions(false);
  };

  const handleReset = () => {
    setInputData([]);
    setOutputDataTHA([]);
    setOutputDataDTD([]);
    setFileName('');
    setError('');
    setStartDate('');
    setEndDate('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const currentData = useMemo(() => {
    if (activeTab === 'MANIFEST') return inputData;
    if (activeTab === 'THA') return filteredTHA;
    if (activeTab === 'DTD') return filteredDTD;
    if (activeTab === 'OVER40') return over40List;
    if (activeTab === 'OVER50') return over50List;
    if (activeTab === 'SCREENING') return filteredScreening;
    if (activeTab === 'COPD') return filteredCOPD;
    return [];
  }, [activeTab, inputData, filteredTHA, filteredDTD, over40List, over50List, filteredScreening, filteredCOPD]);

  const duplicateKeys = useMemo(() => {
    if (removeDuplicates) return new Set<string>();
    
    const counts = new Map<string, number>();
    currentData.forEach(row => {
      if (!row) return;
      const bhyt = String(row['Mã BHYT (*)'] || '').trim();
      if (bhyt) {
        const key = bhyt.length >= 10 ? bhyt.slice(-10) : bhyt;
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    });
    
    const duplicates = new Set<string>();
    for (const [key, count] of counts.entries()) {
      if (count > 1) {
        duplicates.add(key);
      }
    }
    return duplicates;
  }, [currentData, removeDuplicates]);

  const currentColumns = activeTab === 'MANIFEST' 
    ? (inputData.length > 0 && inputData[0] ? Object.keys(inputData[0]) : []) 
    : (activeTab === 'DTD' ? DTD_COLUMNS : (activeTab === 'SCREENING' ? SCREENING_COLUMNS : (activeTab === 'COPD' ? COPD_COLUMNS : THA_COLUMNS)));

  const searchedData = useMemo(() => {
    const q = (searchQueries[activeTab] || '').toLowerCase().trim();
    if (!q) return currentData;
    return currentData.filter(row => {
      if (!row) return false;
      return Object.values(row).some(v => String(v).toLowerCase().includes(q));
    });
  }, [currentData, activeTab, searchQueries]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white relative overflow-hidden">
        {/* Architectural Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3],
              rotate: [0, 45, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[20%] -left-[20%] w-[60%] h-[60%] bg-blue-50 rounded-full blur-[120px]"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.5, 0.2],
              rotate: [0, -45, 0]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear", delay: 2 }}
            className="absolute -bottom-[20%] -right-[20%] w-[60%] h-[60%] bg-indigo-50 rounded-full blur-[120px]"
          />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="relative mb-12 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute w-40 h-40 border-2 border-blue-100 rounded-full border-dashed"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute w-32 h-32 border border-blue-50 rounded-full opacity-50"
            />
            <motion.img 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 1 }}
              src="https://tytpht.hdd.io.vn/img/bmassloadings.png" 
              alt="Loading" 
              className="h-28 w-auto object-contain relative z-20 drop-shadow-2xl" 
            />
          </div>
          
          <div className="space-y-6 text-center max-w-xs">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-2"
            >
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">BMASS <span className="text-blue-600">HEALTH</span></h2>
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            </motion.div>
            
            <div className="flex flex-col items-center gap-3">
              <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute h-full w-1/2 bg-gradient-to-r from-transparent via-blue-600 to-transparent"
                />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] animate-pulse">Initializing Security Layer</p>
            </div>
          </div>
        </motion.div>

        {/* Technical Detail Elements */}
        <div className="absolute bottom-12 left-12 opacity-10 hidden sm:block">
           <div className="font-mono text-[10px] text-slate-900 space-y-1">
             <p>SYSTEM_BOOT_SEQUENCE: 100%</p>
             <p>DATABASE_SYNC: ENABLED</p>
             <p>SECURITY_PROTOCOL_v4: ACTIVE</p>
           </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
        {/* Advanced Grid & Radial Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#f8fbff_0%,#ffffff_100%)]" />
          <div className="absolute inset-0 opacity-[0.4]" style={{ 
            backgroundImage: 'linear-gradient(rgba(59,130,246,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.1) 1px, transparent 1px)', 
            backgroundSize: '80px 80px'
          }} />
          <div className="absolute inset-0 opacity-[0.2]" style={{ 
            backgroundImage: 'linear-gradient(rgba(59,130,246,0.1) 0.5px, transparent 0.5px), linear-gradient(90deg, rgba(59,130,246,0.1) 0.5px, transparent 0.5px)', 
            backgroundSize: '20px 20px'
          }} />
        </div>

        {/* Premium Transparent Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/40 backdrop-blur-2xl border-b border-slate-100/50 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-blue-600 rounded-[1.25rem] shadow-xl shadow-blue-200">
                <img src="https://tytpht.hdd.io.vn/img/bmassloadings.png" alt="Logo" className="h-8 w-auto brightness-0 invert" />
              </div>
              <div>
                <span className="block font-black text-slate-900 tracking-tight text-xl leading-none uppercase">BMASS</span>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mt-1 block">Healthcare</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <nav className="hidden lg:flex items-center gap-8">
                {['Giải pháp', 'Công nghệ', 'Bảo mật', 'Liên hệ'].map(item => (
                  <a key={item} href="#" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest">{item}</a>
                ))}
              </nav>
              <div className="h-8 w-[1px] bg-slate-200 hidden sm:block" />
              <button 
                onClick={() => setShowLogin(true)}
                className="group relative px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-2xl shadow-slate-200"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-white/5 to-blue-600/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="relative z-10 flex items-center gap-2">
                  <LogIn size={16} />
                  Khởi động
                </span>
              </button>
            </div>
          </div>
        </header>

        <main className="relative pt-44 pb-32 px-6 overflow-hidden">
          <div className="max-w-6xl mx-auto text-center flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full mb-4 shadow-xl shadow-slate-200">
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-ping" />
                <span className="text-[9px] font-black uppercase tracking-[0.4em]">Enterprise Grade Core v2.0</span>
              </div>
              
              <h1 className="text-6xl sm:text-8xl lg:text-9xl font-black text-slate-900 tracking-tighter leading-[0.85] italic uppercase">
                SỐ HÓA <br/>
                <span className="text-blue-600 relative inline-block">
                  Y TẾ 
                  <motion.div 
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 1, duration: 1.5 }}
                    className="absolute -bottom-2 left-0 w-full h-4 bg-blue-50 -z-10 origin-left"
                  />
                </span>
                <span className="text-slate-300">.</span>
              </h1>
              
              <p className="text-xl sm:text-2xl text-slate-500 font-medium max-w-3xl mx-auto leading-relaxed">
                Nền tảng kiến trúc dữ liệu thông minh, tự động hóa quy trình chuẩn hóa danh mục kỹ thuật và hồ sơ bệnh án theo tiêu chuẩn HL7-BMASS.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-8">
                <button 
                  onClick={() => setShowLogin(true)}
                  className="w-full sm:w-auto group relative px-12 py-6 bg-blue-600 text-white rounded-[2.5rem] text-lg font-black uppercase tracking-tight hover:bg-blue-700 transition-all shadow-[0_20px_50px_rgba(59,130,246,0.4)] active:scale-95 flex items-center justify-center gap-4"
                >
                  BẮT ĐẦU NGAY LẬP TỨC
                  <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="flex -space-x-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center shadow-lg">
                      <Users size={16} className="text-slate-400" />
                    </div>
                  ))}
                  <div className="pl-6 flex flex-col items-start justify-center">
                    <span className="text-xs font-black text-slate-900 leading-none text-left">2,400+</span>
                    <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Người dùng tin tưởng</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* High-End Tech Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.4, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="mt-32 w-full max-w-7xl relative"
            >
              <div className="relative z-10 bg-white/50 backdrop-blur-md rounded-[3rem] p-4 sm:p-8 border border-slate-200/60 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] group">
                <div className="aspect-[16/10] bg-slate-50 border border-slate-100 rounded-[2rem] overflow-hidden relative shadow-inner">
                  {/* Decorative Dashboard Elements */}
                  <div className="absolute top-0 left-0 w-full h-full p-12 flex flex-col items-center justify-center opacity-10">
                     <Database size={200} strokeWidth={0.5} />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5" />
                  
                  {/* Center UI Preview */}
                  <div className="absolute inset-0 flex items-center justify-center p-12">
                     <div className="w-full max-w-3xl bg-white rounded-3xl shadow-3xl border border-slate-200/50 p-8 space-y-6">
                        <div className="flex items-center justify-between">
                           <div className="flex gap-2">
                             <div className="w-3 h-3 rounded-full bg-red-100" />
                             <div className="w-3 h-3 rounded-full bg-amber-100" />
                             <div className="w-3 h-3 rounded-full bg-emerald-100" />
                           </div>
                           <div className="h-4 w-32 bg-slate-50 rounded-full" />
                        </div>
                        <div className="grid grid-cols-12 gap-4">
                           <div className="col-span-8 space-y-4">
                             <div className="h-20 w-full bg-blue-50 rounded-2xl" />
                             <div className="h-40 w-full bg-slate-50 rounded-2xl" />
                           </div>
                           <div className="col-span-4 space-y-4">
                             <div className="h-64 w-full bg-slate-50/50 rounded-2xl" />
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
              
              {/* Background Floating Nodes */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl animate-pulse delay-700" />
            </motion.div>
          </div>
        </main>

        <section className="bg-slate-900 py-32 px-6 relative overflow-hidden">
           <div className="absolute inset-0 opacity-5" style={{ 
             backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
             backgroundSize: '40px 40px'
           }} />
           <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                 <h2 className="text-4xl sm:text-6xl font-black text-white leading-tight italic">
                   Bảo mật dữ liệu <br/>
                   <span className="text-blue-500">là ưu tiên hàng đầu. </span>
                 </h2>
                 <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-xl">
                   Mọi thông tin bệnh án đều được mã hóa theo tiêu chuẩn AES-256 quân đội và lưu trữ trên hệ thống máy chủ chuyên dụng của BMASS.
                 </p>
                 <div className="flex gap-4">
                   <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-3xl flex-1">
                      <Shield size={32} className="text-blue-500 mb-4" />
                      <h4 className="font-black text-white text-sm uppercase mb-2">Endpoint Security</h4>
                      <p className="text-xs text-slate-500 font-bold leading-relaxed">Xác thực đa yếu tố và quét mã độc thời gian thực cho mọi tệp tin tải lên.</p>
                   </div>
                   <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-3xl flex-1">
                      <Lock size={32} className="text-indigo-500 mb-4" />
                      <h4 className="font-black text-white text-sm uppercase mb-2">Data Privacy</h4>
                      <p className="text-xs text-slate-500 font-bold leading-relaxed">Tuân thủ nghiêm ngặt các quy định về bảo mật thông tin cá nhân y tế.</p>
                   </div>
                 </div>
              </div>
              <div className="relative">
                 <motion.div 
                   animate={{ rotateY: [0, 10, 0], rotateX: [0, 5, 0] }}
                   transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                   className="relative z-10 p-12 bg-white/5 border border-white/10 rounded-[3rem] backdrop-blur-3xl aspect-square flex items-center justify-center transform perspective-1000"
                 >
                    <ShieldAlert size={200} strokeWidth={0.5} className="text-white opacity-20" />
                    <div className="absolute flex flex-col items-center gap-4">
                       <CheckCircle size={80} className="text-emerald-500 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
                       <span className="text-xs font-black text-white tracking-[1em] uppercase ml-4">Encrypted</span>
                    </div>
                 </motion.div>
              </div>
           </div>
        </section>

        {/* Login Modal */}
        <AnimatePresence>
          {showLogin && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowLogin(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-lg"
              >
                <div className="absolute -top-12 right-0">
                  <button 
                    onClick={() => setShowLogin(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-[10px] font-black text-slate-900 uppercase tracking-widest shadow-xl hover:bg-slate-50 transition-all"
                  >
                    <X size={14} />
                    Hủy thao tác
                  </button>
                </div>
                <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden p-2">
                  <Login />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (needsProfileSetup) {
    return <ProfileSetupForm onSubmit={setupProfile} />;
  }

  if (profile?.isBlocked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm max-w-md w-full text-center">
          <ShieldAlert size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tài khoản bị khóa</h2>
          <p className="text-gray-500 mb-6">Tài khoản của bạn đã bị quản trị viên khóa. Vui lòng liên hệ để biết thêm chi tiết.</p>
          <button onClick={logout} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Đăng xuất</button>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#050608] flex items-center justify-center p-4 sm:p-6 overflow-hidden relative font-sans text-slate-200">
        {/* Advanced Architectural Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Subtle Dynamic Gradients */}
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_40%,#131a2b_0%,#050608_100%)] opacity-80" />
          
          {/* Refined Grid Pattern */}
          <div className="absolute inset-0" style={{ 
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', 
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse at 50% 50%, black 20%, transparent 80%)'
          }} />

          {/* Floating Security Orbs */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.05, 0.1, 0.05],
              x: [-20, 20, -20],
              y: [-20, 20, -20]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/4 left-1/3 w-[50vh] h-[50vh] bg-blue-500/20 rounded-full blur-[120px]"
          />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-[540px] z-10"
        >
          {/* Main Security Frame */}
          <div className="relative bg-slate-950/40 backdrop-blur-3xl border border-white/10 rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]">
            
            {/* Top Status Bar */}
            <div className="h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent w-full absolute top-0" />
            
            <div className="px-6 py-10 sm:px-14 sm:py-16 flex flex-col items-center">
              
              {/* Refined Authorized Tag */}
              <div className="mb-10 flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Security Protocol 403-B</span>
              </div>

              {/* Core Security Visual */}
              <div className="relative mb-12 group">
                <div className="absolute inset-[-20px] rounded-full border border-white/5 animate-[spin_20s_linear_infinite]" />
                <div className="absolute inset-[-40px] rounded-full border border-white/[0.02] animate-[spin_30s_linear_infinite_reverse]" />
                
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-slate-900 border border-white/10 rounded-full flex items-center justify-center overflow-hidden shadow-inner">
                  {/* Digital Scan Layer */}
                  <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(245,158,11,0.05)_50%,transparent_100%)] bg-[length:100%_200%] animate-[scan_4s_ease-in-out_infinite]" />
                  
                  {/* Subtle Radar Pulse */}
                  <div className="absolute inset-0 border-2 border-amber-500/10 rounded-full animate-ping opacity-20" />
                  
                  <ShieldAlert size={40} className="text-amber-500 sm:size-48 relative z-10 drop-shadow-[0_0_12px_rgba(245,158,11,0.3)]" strokeWidth={1} />
                </div>
              </div>

              {/* Authoritative Information Unit */}
              <div className="text-center space-y-3 mb-10 w-full">
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
                  Xác Thực <span className="text-slate-500">Bất Thành</span>
                </h2>
                <div className="flex items-center justify-center gap-3">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Unauthorized Access Attempt</p>
                  <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
                </div>
              </div>

              {/* Structured Clearance Report */}
              <div className="w-full bg-slate-900/50 rounded-2xl border border-white/5 p-6 mb-10 text-left">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Cấp độ bảo mật</label>
                    <p className="text-xs font-bold text-slate-200">RESTRICTED_ACCESS</p>
                  </div>
                  <div className="text-right">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Mã tham chiếu</label>
                    <p className="text-xs font-mono text-amber-500">AUTH-FAIL-LOG-X01</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                  <h3 className="text-sm font-black text-slate-200 tracking-tight flex items-center gap-2 italic uppercase">
                    <Lock size={12} className="text-amber-500" />
                    Không phận sự miễn vào
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-400 font-medium">
                    Hệ thống đã nhận diện nỗ lực truy cập từ địa chỉ IP của bạn. Mọi hành vi xâm nhập trái phép đều được ghi nhận vào cơ sở dữ liệu an ninh quốc gia. Vui lòng liên hệ cán bộ Ban Quản trị để được xác thực danh tính.
                  </p>
                </div>
              </div>

              {/* Verified Return Action */}
              <button 
                onClick={logout} 
                className="group relative w-full overflow-hidden rounded-[1.25rem] bg-white text-black py-4 font-black text-sm tracking-tight transition-all active:scale-[0.98] hover:bg-slate-200"
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  <LogOut size={18} />
                  XÁC NHẬN RỜI HỆ THỐNG
                </div>
              </button>

              {/* Platform Footer Branding */}
              <div className="mt-12 w-full flex items-center justify-between opacity-20 grayscale">
                <img src="https://tytpht.hdd.io.vn/img/bmassloadings.png" alt="BMASS" className="h-6 w-auto" />
                <div className="text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                  <span>Secured by BMASS Cloud</span>
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  <span>2024</span>
                </div>
              </div>

            </div>
          </div>
          
          {/* Subtle Architectural Sub-text */}
          <div className="mt-10 text-center opacity-30">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white">Advanced Security Layer Enforcement</p>
          </div>
        </motion.div>
        
        {/* High-end Visual Finish */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />
      </div>
    );
  }

  if (showAdmin && profile?.role === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 p-8 font-sans">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Quản trị hệ thống</h1>
            <button onClick={() => setShowAdmin(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Quay lại App</button>
          </div>
          <AdminPanel onClose={() => setShowAdmin(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-x-hidden">
      <div className="w-full h-full px-2 sm:px-3 lg:px-4 py-3 sm:py-4 space-y-4 sm:space-y-6">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowSidebar(true)}
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            >
              <Menu size={24} />
            </button>
            <div className="p-2 bg-blue-50 rounded-xl hidden sm:block">
              <img src="https://tytpht.hdd.io.vn/img/bmassloadings.png" alt="Logo" className="h-10 w-auto object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Bmass Data Converter</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Hệ thống chuyển đổi dữ liệu THA-ĐTĐ chuyên nghiệp</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 flex-1 md:flex-none hover:bg-slate-100 transition-colors group cursor-default shadow-sm">
              <div className="relative">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md border-2 border-white">
                    {profile?.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-black text-slate-800 leading-none tracking-tight">{profile?.displayName || 'User'}</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1.5 flex items-center gap-1.5">
                  <span className="truncate max-w-[140px] opacity-80">{profile?.email}</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span className="truncate max-w-[100px] text-blue-600/70">{profile?.organization || 'Trạm Y tế'}</span>
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSidebar(false)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 left-0 bottom-0 w-64 bg-white z-50 shadow-2xl flex flex-col"
              >
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src="https://tytpht.hdd.io.vn/img/bmassloadings.png" alt="Logo" className="h-6 w-auto" />
                    <span className="font-black text-slate-900 tracking-tight text-sm">BMASS</span>
                  </div>
                  <button 
                    onClick={() => setShowSidebar(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                  {isAdmin && (
                    <button 
                      onClick={() => {
                        setShowSidebar(false);
                        setShowAdmin(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-bold text-xs"
                    >
                      <Shield size={16} />
                       Quản trị hệ thống
                    </button>
                  )}

                  <button 
                    onClick={() => {
                      setShowSidebar(false);
                      setShowAdvancedConverter(true);
                      setShowAdmin(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-bold text-xs"
                  >
                    <RefreshCcw size={16} />
                    Chuyển đổi nâng cao
                  </button>
                </div>
                
                <div className="p-3 border-t border-slate-100">
                  <button 
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all font-bold text-xs"
                  >
                    <LogOut size={16} />
                    Đăng xuất
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <main className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-5 gap-4 sm:gap-6">
            {/* Top Row: Upload & Stats */}
            <div className="lg:col-span-4 xl:col-span-1">
              {/* Upload Card */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
                <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                    <Upload size={16} className="text-blue-600" />
                    Tải lên dữ liệu
                  </h3>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleDownloadSample}
                      className="text-[11px] font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                    >
                      <Download size={14} />
                      Tải file mẫu
                    </button>
                    {inputData.length > 0 && (
                      <button 
                        onClick={handleReset}
                        className="text-[11px] font-bold text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 size={12} />
                        Làm mới
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="p-3 flex-1 flex flex-col justify-center gap-3">
                  <div 
                    className={`relative group border-2 border-dashed rounded-xl p-3 text-center transition-all duration-300 cursor-pointer
                      ${isDragging ? 'border-blue-500 bg-blue-50/50 scale-[0.98]' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/50'}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      accept=".xlsx, .xls, .csv" 
                      className="hidden" 
                    />
                    
                    <div className="flex flex-col items-center space-y-2">
                       <div className={`p-3 rounded-xl transition-colors ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                        <FileSpreadsheet size={24} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-700">
                          {fileName ? (
                            <div className="space-y-1">
                              <span className="text-blue-600 truncate max-w-[200px] block">{fileName}</span>
                              {inputData.length > 0 && (
                                <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                                  {inputData.length.toLocaleString()} dòng
                                </span>
                              )}
                            </div>
                          ) : 'Chọn file Excel hoặc CSV'}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Kéo thả file vào vùng này</p>
                      </div>
                    </div>
                  </div>

                  {isProcessing && (
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-6 bg-slate-900 rounded-3xl shadow-2xl relative overflow-hidden group"
                    >
                      {/* Technical Grid Overlay */}
                      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ 
                        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                        backgroundSize: '20px 20px'
                      }} />
                      
                      {/* Scanning Line Effect */}
                      <motion.div 
                        animate={{ top: ['0%', '100%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-[2px] bg-blue-500/30 blur-[2px] z-10 pointer-events-none"
                      />

                      <div className="relative z-20 space-y-5">
                        <div className="flex justify-between items-center">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                               <RefreshCcw size={16} className="text-blue-500 animate-[spin_3s_linear_infinite]" />
                               <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Engine Protocol Active</span>
                            </div>
                            <p className="text-[9px] font-bold text-slate-500 tracking-wider">SECURE_DATA_SYNCHRONIZATION_MODULE_v2.0</p>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-3xl font-black text-white italic">{processProgress}<span className="text-blue-500 text-sm ml-0.5 not-italic">%</span></span>
                            <div className="h-1 w-8 bg-blue-500 rounded-full mt-1" />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="h-3 bg-slate-800 rounded-full overflow-hidden p-[2px]">
                            <motion.div 
                              className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                              initial={{ width: 0 }}
                              animate={{ width: `${processProgress}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                          </div>
                          <div className="flex justify-between items-center px-1">
                             <div className="flex gap-1.5 items-center">
                               {[1,2,3].map(i => (
                                 <motion.div 
                                   key={i}
                                   animate={{ opacity: [0.3, 1, 0.3] }}
                                   transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                                   className="w-1 h-1 bg-blue-400 rounded-full"
                                 />
                               ))}
                             </div>
                             <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] italic">Architectural Compliance Check...</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600"
                    >
                      <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                      <p className="text-xs font-bold leading-relaxed">{error}</p>
                    </motion.div>
                  )}
                </div>
              </section>
            </div>

            <div className="lg:col-span-8 xl:col-span-4">
              {/* Stats Section */}
              <AnimatePresence>
                {(inputData.length > 0) ? (
                  <motion.section 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 h-full"
                  >
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-center hover:shadow-md transition-shadow relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Activity size={80} />
                      </div>
                      <div className="flex items-center justify-between relative z-10">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shadow-sm">
                          <Activity size={24} />
                        </div>
                        <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">THA</span>
                      </div>
                      <div className="relative z-10 pt-2">
                        <p className="text-4xl font-black text-slate-900 leading-none">
                          {filteredTHA.length}
                        </p>
                        <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-wide">Bệnh nhân Tăng huyết áp</p>
                      </div>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-center hover:shadow-md transition-shadow relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Droplet size={80} />
                      </div>
                      <div className="flex items-center justify-between relative z-10">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shadow-sm">
                          <Droplet size={24} />
                        </div>
                        <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">ĐTĐ</span>
                      </div>
                      <div className="relative z-10 pt-2">
                        <p className="text-4xl font-black text-slate-900 leading-none">
                          {filteredDTD.length}
                        </p>
                        <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-wide">Bệnh nhân Đái tháo đường</p>
                      </div>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-1 bg-slate-900 p-5 rounded-3xl shadow-xl shadow-slate-200/50 space-y-3 flex flex-col justify-center relative overflow-hidden group">
                      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users size={80} className="text-white" />
                      </div>
                      <div className="flex items-center justify-between relative z-10">
                        <div className="p-3 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl">
                          <Users size={24} />
                        </div>
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest bg-slate-800/50 border border-slate-700 px-2 py-1 rounded-md">Tổng cộng</span>
                      </div>
                      <div className="relative z-10 pt-2">
                        <p className="text-5xl font-black text-white leading-none">
                          {filteredTHA.length + filteredDTD.length}
                        </p>
                        <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-wide">
                          Dữ liệu đã lọc thành công
                        </p>
                      </div>
                    </div>
                  </motion.section>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="h-full min-h-[300px] bg-white border border-slate-100 rounded-[3rem] flex flex-col items-center justify-center p-12 text-center relative overflow-hidden group shadow-sm transition-shadow hover:shadow-md"
                  >
                    {/* Architectural Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ 
                      backgroundImage: 'radial-gradient(circle at 10px 10px, black 1px, transparent 0)',
                      backgroundSize: '40px 40px'
                    }} />
                    
                    {/* High-End Decor Elements */}
                    <motion.div 
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.2, 0.1],
                      }}
                      transition={{ duration: 10, repeat: Infinity }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-100 rounded-full blur-[100px]" 
                    />
                    
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="relative mb-10 group-hover:scale-105 transition-transform duration-700">
                        <div className="absolute inset-0 bg-blue-600/5 rounded-[2.5rem] scale-125 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-24 h-24 bg-white border border-slate-200 text-slate-300 rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] flex items-center justify-center relative z-10 rotate-6 transition-transform group-hover:rotate-0 duration-500">
                          <Database size={40} className="text-slate-900 drop-shadow-sm" />
                        </div>
                        {/* Decorative Badge */}
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-900 border-4 border-white rounded-2xl flex items-center justify-center text-white shadow-xl">
                           <Lock size={16} />
                        </div>
                      </div>
                      
                      <div className="space-y-4 max-w-sm">
                        <h4 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                          Kiến Trúc <span className="text-blue-600">Dữ Liệu</span>
                        </h4>
                        <div className="h-[1px] w-12 bg-slate-200 mx-auto" />
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] leading-relaxed">
                          Hệ thống đã sẵn sàng. <br/>
                          Vui lòng nạp hồ sơ nguồn để khởi tạo báo cáo.
                        </p>
                      </div>

                      <motion.button 
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-10 px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all"
                      >
                        <Upload size={14} />
                        Nạp dữ liệu ngay
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Section: Filters & Preview (Full Width) */}
          {inputData.length > 0 && (
            <div className="space-y-6">
                {/* Filters Card */}
                <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden relative">
                  <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
                        <Filter size={20} />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 uppercase tracking-tight">Cấu hình Bộ lọc</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Tinh chỉnh dữ liệu đầu ra</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-sm">
                        <Database size={12} className="text-blue-600" />
                        {inputData.length.toLocaleString()} dòng nạp hồ sơ
                      </div>
                    </div>
                  </div>

                  <div className="p-8 sm:p-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                      {/* 1. Date Range */}
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                          <Calendar size={14} className="text-blue-600" />
                          KHOẢNG THỜI GIAN
                        </label>
                        <div className="grid grid-cols-1 gap-3">
                          <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase pointer-events-none group-focus-within:text-blue-500 transition-colors">TỪ</div>
                            <input 
                              type="date" 
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 outline-none transition-all cursor-pointer shadow-sm" 
                              value={startDate} 
                              onChange={e => setStartDate(e.target.value)} 
                            />
                          </div>
                          <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase pointer-events-none group-focus-within:text-blue-500 transition-colors">ĐẾN</div>
                            <input 
                              type="date" 
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 outline-none transition-all cursor-pointer shadow-sm" 
                              value={endDate} 
                              onChange={e => setEndDate(e.target.value)} 
                            />
                          </div>
                        </div>
                      </div>

                      {/* 2. Gender Format */}
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                          <Users size={14} className="text-blue-600" />
                          ĐỊNH DẠNG GIỚI TÍNH
                        </label>
                        <div className="flex p-1.5 bg-slate-100 rounded-2xl">
                          <button 
                            onClick={() => handleGenderFormatChange('text')}
                            className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${genderFormat === 'text' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                            Nam / Nữ
                          </button>
                          <button 
                            onClick={() => handleGenderFormatChange('number')}
                            className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${genderFormat === 'number' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                            01 / 02
                          </button>
                        </div>
                      </div>

                      {/* 3. Admin Unit */}
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                          <MapPin size={14} className="text-blue-600" />
                          ĐƠN VỊ HÀNH CHÍNH
                        </label>
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-1 flex gap-1 shadow-sm">
                          <input 
                            type="text"
                            value={adminUnitCode}
                            onChange={(e) => setAdminUnitCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyAdminUnit()}
                            placeholder="Mã xã/phường..."
                            className="flex-1 bg-transparent px-4 py-2.5 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-300"
                          />
                          <button 
                            onClick={() => handleApplyAdminUnit()}
                            className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
                          >
                            XÁC NHẬN
                          </button>
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic flex items-center gap-1 mt-1">
                          <Info size={10} /> (*) Bắt buộc để xác định đơn vị
                        </p>
                      </div>

                      {/* 4. Advanced Status View */}
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                          <Settings size={14} className="text-blue-600" />
                          TRẠNG THÁI NÂNG CAO
                        </label>
                        <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-colors ${hasAdvancedAccess ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                          <div className={`p-2 rounded-xl scale-90 ${hasAdvancedAccess ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-200 text-slate-400'}`}>
                            <ShieldCheck size={18} />
                          </div>
                          <div>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${hasAdvancedAccess ? 'text-indigo-900' : 'text-slate-400'}`}>
                              Quyền: {hasAdvancedAccess ? 'Admin' : 'Hạn chế'}
                            </p>
                            <p className="text-[9px] font-bold text-slate-400 mt-0.5 whitespace-nowrap">
                              {hasAdvancedAccess ? 'Cho phép truy cập cấu hình AI' : 'Vui lòng nâng cấp tài khoản'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Blood Sugar Config */}
                      <div className="space-y-6 pt-10 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Settings size={14} className="text-blue-600" />
                            Cấu hình Thuật toán Nâng cao
                          </label>
                          {hasAdvancedAccess && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100 text-[9px] font-black uppercase tracking-widest">
                              <ShieldCheck size={10} />
                              Admin Verified
                            </div>
                          )}
                        </div>

                        {hasAdvancedAccess ? (
                          <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <Toggle 
                                enabled={removeDuplicates}
                                onChange={setRemoveDuplicates}
                                label="Loại bỏ Trùng lặp"
                                description="Tự động xóa hồ sơ trùng BHYT"
                                icon={Users}
                              />
                              
                              <div className="flex flex-col gap-2">
                                <Toggle 
                                  enabled={showBsConfig}
                                  onChange={setShowBsConfig}
                                  label="Ngẫu nhiên Đường huyết"
                                  description="Tự động điền theo chỉ số y khoa"
                                  icon={Droplet}
                                />
                                {showBsConfig && (
                                  <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-3 overflow-hidden"
                                  >
                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                      <input 
                                        type="number" 
                                        placeholder="Min" 
                                        className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none" 
                                        value={bsMin} 
                                        onChange={e => setBsMin(e.target.value)} 
                                      />
                                      <input 
                                        type="number" 
                                        placeholder="Max" 
                                        className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none" 
                                        value={bsMax} 
                                        onChange={e => setBsMax(e.target.value)} 
                                      />
                                    </div>
                                    <button 
                                      onClick={handleApplyBloodSugar} 
                                      className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                                    >
                                      <CheckCircle size={18} />
                                    </button>
                                  </motion.div>
                                )}
                              </div>

                              <Toggle 
                                enabled={randomFamilyHistory}
                                onChange={setRandomFamilyHistory}
                                label="Ngẫu nhiên Tiền sử"
                                description="Tạo dữ liệu gia đình mắc ĐTD"
                                icon={ActivityIcon}
                              />
                              <Toggle 
                                enabled={randomHeightWeight}
                                onChange={setRandomHeightWeight}
                                label="Ngẫu nhiên BMI"
                                description="Cân đối Chiều cao/Cân nặng chuẩn"
                                icon={LayoutGrid}
                              />
                              <Toggle 
                                enabled={randomBP}
                                onChange={setRandomBP}
                                label="Ngẫu nhiên Huyết áp"
                                description="Gán chỉ số mặc định (120/80)"
                                icon={ActivityIcon}
                              />
                              <Toggle 
                                enabled={randomCOPD}
                                onChange={setRandomCOPD}
                                label="Sàng lọc COPD/Hen"
                                description="Điền triệu chứng theo độ tuổi"
                                icon={Wind}
                              />
                            </div>

                            <div className="pt-2 border-t border-slate-100 mt-2">
                              {/* Empty space as requested */}
                            </div>
                          </div>
                        ) : (
                          <div className="p-10 bg-slate-50 border border-slate-100 border-dashed rounded-[2.5rem] text-center space-y-3">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                              <Lock size={24} className="text-slate-300" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Quyền truy cập bị hạn chế</p>
                              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em] mt-1">Vui lòng nâng cấp tài khoản Admin để mở khóa cấu hình AI</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3 px-2 pb-2">
                      <button 
                        onClick={handleClearFilters}
                        disabled={!startDate && !endDate && !adminUnitCode && !bsMin && !bsMax && genderFormat === 'text'}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-sm ${
                          (startDate || endDate || adminUnitCode || bsMin || bsMax || genderFormat !== 'text')
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95' 
                            : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                        }`}
                      >
                        <RefreshCcw size={18} />
                        Xoá bộ lọc
                      </button>
                      <button 
                        onClick={handleApplyFilters}
                        className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
                      >
                        <CheckCircle size={18} />
                        Áp dụng tất cả bộ lọc
                      </button>
                    </div>
                </section>

                {/* Statistical Summary section */}
                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-blue-50/30">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <LayoutGrid size={18} className="text-blue-600" />
                      Kết quả Sàng lọc & Chẩn đoán
                    </h3>
                    <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-blue-100 shadow-sm">
                      Dữ liệu tóm tắt
                    </div>
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Total Screening */}
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-slate-200 text-slate-600 rounded-lg">
                          <Users size={16} />
                        </div>
                        <span className="text-xs font-bold text-slate-600">Tổng Sàng lọc THA-ĐTĐ</span>
                      </div>
                      <div className="flex items-end justify-between">
                        <div className="text-2xl font-black text-slate-900">
                          {filteredScreening.length}
                        </div>
                        <div className="text-[10px] font-medium text-slate-500 space-y-0.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span>Nam:</span>
                            <span className="font-black text-slate-700">{filteredScreening.filter(r => (String(r['Giới tính (*)']).includes('Nam') || r['Giới tính (*)'] === '01')).length}</span>
                          </div>
                          <div className="flex items-center justify-end gap-1">
                            <span>Nữ:</span>
                            <span className="font-black text-slate-700">{filteredScreening.filter(r => (String(r['Giới tính (*)']).includes('Nữ') || r['Giới tính (*)'] === '02')).length}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Diabetes Risk */}
                    <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/20">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                          <Droplet size={16} />
                        </div>
                        <span className="text-xs font-bold text-slate-600">Nguy cơ Đái tháo đường</span>
                      </div>
                      <div className="flex items-end justify-between">
                        <div className="text-2xl font-black text-emerald-600">
                          {filteredScreening.filter(r => r['Nguy cơ Đái tháo đường'] === 'Có').length}
                        </div>
                        <div className="text-[10px] font-medium text-slate-500 space-y-0.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span>Nam:</span>
                            <span className="font-black text-slate-700">{filteredScreening.filter(r => r['Nguy cơ Đái tháo đường'] === 'Có' && (String(r['Giới tính (*)']).includes('Nam') || r['Giới tính (*)'] === '01')).length}</span>
                          </div>
                          <div className="flex items-center justify-end gap-1">
                            <span>Nữ:</span>
                            <span className="font-black text-slate-700">{filteredScreening.filter(r => r['Nguy cơ Đái tháo đường'] === 'Có' && (String(r['Giới tính (*)']).includes('Nữ') || r['Giới tính (*)'] === '02')).length}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hypertension Suspicion */}
                    <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/20">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                          <Activity size={16} />
                        </div>
                        <span className="text-xs font-bold text-slate-600">Nghi ngờ Tăng huyết áp</span>
                      </div>
                      <div className="flex items-end justify-between">
                        <div className="text-2xl font-black text-blue-600">
                          {filteredScreening.filter(r => r['Nghi ngờ Tăng huyết áp'] === 'Có').length}
                        </div>
                        <div className="text-[10px] font-medium text-slate-500 space-y-0.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span>Nam:</span>
                            <span className="font-black text-slate-700">{filteredScreening.filter(r => r['Nghi ngờ Tăng huyết áp'] === 'Có' && (String(r['Giới tính (*)']).includes('Nam') || r['Giới tính (*)'] === '01')).length}</span>
                          </div>
                          <div className="flex items-center justify-end gap-1">
                            <span>Nữ:</span>
                            <span className="font-black text-slate-700">{filteredScreening.filter(r => r['Nghi ngờ Tăng huyết áp'] === 'Có' && (String(r['Giới tính (*)']).includes('Nữ') || r['Giới tính (*)'] === '02')).length}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Asthma Suspicion */}
                    <div className="p-4 rounded-xl border border-violet-100 bg-violet-50/20">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-violet-100 text-violet-600 rounded-lg">
                          <Wind size={16} />
                        </div>
                        <span className="text-xs font-bold text-slate-600">Nghi ngờ Hen</span>
                      </div>
                      <div className="flex items-end justify-between">
                        <div className="text-2xl font-black text-violet-600">
                          {filteredCOPD.filter(r => r['Nghi ngờ Hen'] === 'Có').length}
                        </div>
                        <div className="text-[10px] font-medium text-slate-500 space-y-0.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span>Nam:</span>
                            <span className="font-black text-slate-700">{filteredCOPD.filter(r => r['Nghi ngờ Hen'] === 'Có' && (String(r['Giới tính (*)']).includes('Nam') || r['Giới tính (*)'] === '01')).length}</span>
                          </div>
                          <div className="flex items-center justify-end gap-1">
                            <span>Nữ:</span>
                            <span className="font-black text-slate-700">{filteredCOPD.filter(r => r['Nghi ngờ Hen'] === 'Có' && (String(r['Giới tính (*)']).includes('Nữ') || r['Giới tính (*)'] === '02')).length}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* COPD Suspicion */}
                    <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/20">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                          <Shield size={16} />
                        </div>
                        <span className="text-xs font-bold text-slate-600">Nghi ngờ COPD</span>
                      </div>
                      <div className="flex items-end justify-between">
                        <div className="text-2xl font-black text-indigo-600">
                          {filteredCOPD.filter(r => r['Nghi ngờ COPD'] === 'Có').length}
                        </div>
                        <div className="text-[10px] font-medium text-slate-500 space-y-0.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span>Nam:</span>
                            <span className="font-black text-slate-700">{filteredCOPD.filter(r => r['Nghi ngờ COPD'] === 'Có' && (String(r['Giới tính (*)']).includes('Nam') || r['Giới tính (*)'] === '01')).length}</span>
                          </div>
                          <div className="flex items-center justify-end gap-1">
                            <span>Nữ:</span>
                            <span className="font-black text-slate-700">{filteredCOPD.filter(r => r['Nghi ngờ COPD'] === 'Có' && (String(r['Giới tính (*)']).includes('Nữ') || r['Giới tính (*)'] === '02')).length}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Data Preview Card */}
                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {activeTab === 'COPD' && (
                    <div className="bg-slate-50 border-b border-slate-100 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[10px] text-slate-500">
                        <div>
                          <h4 className="font-bold text-slate-700 mb-2 uppercase tracking-wider">Tầm soát Hen (IPCRG)</h4>
                          <ul className="space-y-1">
                            <li>C1: Khò khè trong lồng ngực (12 tháng qua)</li>
                            <li>C2: Thức giấc giữa đêm vì khó thở</li>
                            <li>C3: Thức giấc giữa đêm vì ho</li>
                            <li>C4: Thức giấc vì cảm giác nặng ngực</li>
                            <li>C5: Khó thở sau hoạt động gắng sức</li>
                            <li>C6: Khó thở cả ngày khi nghỉ ngơi</li>
                            <li>C7: Triệu chứng ít đi/biến mất khi nghỉ làm/nghỉ lễ</li>
                            <li className="text-blue-600 font-bold mt-1">{"=>"} Nghi ngờ nếu có {">="} 2 câu trả lời "Có"</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-700 mb-2 uppercase tracking-wider">Tầm soát COPD (GOLD)</h4>
                          <ul className="space-y-1">
                            <li>C1: Ho vài lần trong ngày ở hầu hết các ngày</li>
                            <li>C2: Khạc đờm ở hầu hết các ngày</li>
                            <li>C3: Dễ bị khó thở hơn những người cùng tuổi</li>
                            <li>C4: Trên 40 tuổi (Mặc định: Có)</li>
                            <li>C5: Vẫn còn hút thuốc lá hoặc đã từng hút thuốc lá</li>
                            <li className="text-blue-600 font-bold mt-1">{"=>"} Nghi ngờ nếu có {">="} 3 câu trả lời "Có"</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="p-5 border-b border-slate-100 flex flex-col gap-4 bg-slate-50/30">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
                        <div className="flex p-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto max-w-full">
                          <button 
                            onClick={() => setActiveTab('MANIFEST')}
                            className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                              activeTab === 'MANIFEST' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            <LayoutGrid size={14} />
                            MANIFEST FULL
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'MANIFEST' ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-400'}`}>
                              {inputData.length}
                            </span>
                          </button>
                          <button 
                            onClick={() => setActiveTab('THA')}
                            className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                              activeTab === 'THA' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            <Activity size={14} />
                            Tăng huyết áp
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'THA' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
                              {filteredTHA.length}
                            </span>
                          </button>
                          <button 
                            onClick={() => setActiveTab('DTD')}
                            className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                              activeTab === 'DTD' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            <Droplet size={14} />
                            Đái tháo đường
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'DTD' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                              {filteredDTD.length}
                            </span>
                          </button>
                          <button 
                            onClick={() => setActiveTab('OVER40')}
                            disabled={!isAdmin && !isSubAdmin}
                            className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                              activeTab === 'OVER40' ? 'bg-amber-600 text-white shadow-md' : (!isAdmin && !isSubAdmin) ? 'text-slate-300 cursor-not-allowed bg-slate-50' : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            <Users size={14} />
                            Trên 40 tuổi
                            {(!isAdmin && !isSubAdmin) && <Lock size={12} className="ml-1 opacity-50" />}
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'OVER40' ? 'bg-white/20 text-white' : (!isAdmin && !isSubAdmin) ? 'bg-slate-100 text-slate-400' : 'bg-amber-50 text-amber-600'}`}>
                              {over40List.length}
                            </span>
                          </button>
                          <button 
                            onClick={() => setActiveTab('OVER50')}
                            disabled={!isAdmin && !isSubAdmin}
                            className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                              activeTab === 'OVER50' ? 'bg-red-600 text-white shadow-md' : (!isAdmin && !isSubAdmin) ? 'text-slate-300 cursor-not-allowed bg-slate-50' : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            <Users size={14} />
                            Trên 50 tuổi
                            {(!isAdmin && !isSubAdmin) && <Lock size={12} className="ml-1 opacity-50" />}
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'OVER50' ? 'bg-white/20 text-white' : (!isAdmin && !isSubAdmin) ? 'bg-slate-100 text-slate-400' : 'bg-red-50 text-red-600'}`}>
                              {over50List.length}
                            </span>
                          </button>
                          <button 
                            onClick={() => setActiveTab('SCREENING')}
                            className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                              activeTab === 'SCREENING' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            <Search size={14} />
                            Sàng lọc THA & ĐTĐ
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'SCREENING' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                              {filteredScreening.length}
                            </span>
                          </button>
                          <button 
                            onClick={() => setActiveTab('COPD')}
                            className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                              activeTab === 'COPD' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            <Wind size={14} />
                            Sàng lọc COPD & Hen
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'COPD' ? 'bg-white/20 text-white' : 'bg-violet-50 text-violet-600'}`}>
                              {filteredCOPD.length}
                            </span>
                          </button>
                        </div>
                      </div>
                      
                      <button 
                        onClick={handleDownload}
                        className="w-full xl:w-auto flex-shrink-0 flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                      >
                        <Download size={18} />
                        Xuất file Excel
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                      <div className="relative flex-1 w-full">
                        <input
                          type="text"
                          placeholder={`Tìm kiếm trong ${activeTab === 'MANIFEST' ? 'hồ sơ gốc' : (activeTab === 'THA' ? 'danh sách THA' : (activeTab === 'DTD' ? 'danh sách ĐTĐ' : 'danh sách sàng lọc'))}...`}
                          value={searchQueries[activeTab] || ''}
                          onChange={e => setSearchQueries(prev => ({...prev, [activeTab]: e.target.value}))}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium text-slate-700 shadow-sm"
                        />
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                      <div className="flex flex-col flex-shrink-0 bg-white px-4 py-2 border border-slate-200 rounded-2xl shadow-sm min-w-[120px]">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Tổng số dòng</span>
                        <span className="text-sm font-black text-slate-900">{searchedData.length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    {searchedData.length > 0 ? (
                      <>
                        <div className="overflow-x-auto max-h-[500px]">
                          <table className="min-w-[1200px] text-left border-collapse">
                            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                              <tr>
                                {currentColumns.map((col, idx) => (
                                  <th key={idx} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {searchedData.slice(0, displayLimit).map((row, rowIndex) => {
                                const bhyt = String(row['Mã BHYT (*)'] || '').trim();
                                const key = bhyt.length >= 10 ? bhyt.slice(-10) : bhyt;
                                const isDuplicate = !removeDuplicates && bhyt && duplicateKeys.has(key);

                                return (
                                  <tr key={rowIndex} className={`hover:bg-slate-50/50 transition-colors group ${isDuplicate ? 'bg-red-50/30' : ''}`}>
                                    {currentColumns.map((col, colIndex) => {
                                      const isCheckable = activeTab === 'COPD' && (col.startsWith('Hen-') || col.startsWith('COPD-'));
                                      
                                      if (isCheckable) {
                                        const isChecked = row[col] === 'Có';
                                        return (
                                          <td key={colIndex} className="px-4 py-3">
                                            <button 
                                              onClick={() => {
                                                const newData = [...outputDataCOPD];
                                                const itemIndex = outputDataCOPD.indexOf(row);
                                                if (itemIndex > -1) {
                                                  newData[itemIndex] = {
                                                    ...row,
                                                    [col]: isChecked ? 'Không' : 'Có'
                                                  };
                                                  
                                                  // Recalculate suspected status
                                                  const r = newData[itemIndex];
                                                  const henCount = ['Hen-C1', 'Hen-C2', 'Hen-C3', 'Hen-C4', 'Hen-C5', 'Hen-C6', 'Hen-C7'].filter(k => r[k] === 'Có').length;
                                                  r['Nghi ngờ Hen'] = henCount >= 2 ? 'Có' : 'Không';
                                                  
                                                  const copdCount = ['COPD-C1', 'COPD-C2', 'COPD-C3', 'COPD-C4', 'COPD-C5'].filter(k => r[k] === 'Có').length;
                                                  r['Nghi ngờ COPD'] = copdCount >= 3 ? 'Có' : 'Không';
                                                  
                                                  setOutputDataCOPD(newData);
                                                }
                                              }}
                                              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                                                isChecked ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                              }`}
                                            >
                                              {isChecked ? <CheckCircle2 size={12} /> : <div className="w-3 h-3 border border-slate-300 rounded-sm" />}
                                              {isChecked ? 'CÓ' : 'KHÔNG'}
                                            </button>
                                          </td>
                                        );
                                      }

                                      return (
                                        <td key={colIndex} className={`px-4 py-3 text-xs font-medium whitespace-nowrap ${
                                          isDuplicate ? 'text-red-600' : 'text-slate-600'
                                        }`}>
                                          {row[col] === undefined || row[col] === null || row[col] === '' ? <span className={`italic ${isDuplicate ? 'text-red-400' : 'text-slate-300'}`}>Không</span> : row[col]}
                                        </td>
                                      );
                                  })}
                                </tr>
                              );
                            })}
                            </tbody>
                          </table>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Hiển thị {Math.min(displayLimit, searchedData.length)} / {searchedData.length} bản ghi
                          </p>
                          <div className="flex items-center gap-3">
                            {displayLimit < searchedData.length && (
                              <>
                                <button 
                                  onClick={() => setDisplayLimit(prev => prev + 50)}
                                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
                                >
                                  Xem thêm 50
                                </button>
                                <button 
                                  onClick={() => setDisplayLimit(searchedData.length)}
                                  className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                                >
                                  Xem tất cả
                                </button>
                              </>
                            )}
                            <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase tracking-widest ml-2">
                              <CheckCircle size={12} />
                              Dữ liệu sẵn sàng
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-24 px-6 text-center h-full">
                        <div className="relative mb-6 group cursor-default">
                          <div className="absolute inset-0 bg-blue-100 rounded-full scale-150 blur-xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
                          <div className="w-20 h-20 bg-white border border-slate-100 text-slate-300 rounded-[2rem] shadow-sm flex items-center justify-center relative z-10 rotate-3 group-hover:rotate-6 transition-transform">
                            <Database size={36} className="text-blue-400/50" />
                          </div>
                        </div>
                        <h4 className="font-black text-slate-800 mb-2 mt-4 text-lg tracking-tight">Không có dữ liệu</h4>
                        <p className="text-sm text-slate-500 max-w-[240px] font-medium leading-relaxed">Bộ lọc hiện tại không tìm thấy bản ghi nào. Vui lòng kiểm tra lại tải file lên của bạn.</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Duplicate Stats Card */}
                {duplicateStats.length > 0 && (
                  <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
                    <div className="p-5 border-b border-slate-100">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Users size={18} className="text-amber-600" />
                        Thống kê trùng lặp BHYT
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Phát hiện {duplicateStats.length} người có mã BHYT trùng lặp (tổng cộng {duplicateStats.reduce((sum, d) => sum + d.count, 0)} lượt khám).
                      </p>
                    </div>
                    <div className="overflow-x-auto max-h-[300px] no-scrollbar">
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã BHYT (10 số cuối)</th>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Họ tên</th>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Số lần xuất hiện</th>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Các ngày khám</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {duplicateStats.map((stat, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 text-xs font-bold text-blue-600">{stat.bhyt}</td>
                              <td className="px-4 py-3 text-xs font-medium text-slate-700">{stat.name}</td>
                              <td className="px-4 py-3 text-xs font-black text-amber-600 text-center">{stat.count}</td>
                              <td className="px-4 py-3 text-xs text-slate-500">{stat.dates}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}



            </div>
          )}
        </main>


      </div>
      {showAdminUnit && (
        <AdministrativeUnitModal 
          onSelect={(code) => { 
            setAdminUnitCode(code); 
            handleApplyAdminUnit(code);
            setShowAdminUnit(false); 
          }} 
          onClose={() => setShowAdminUnit(false)} 
        />
      )}
      {showDownloadOptions && (
        <DownloadOptionsModal 
          onConfirm={executeDownload} 
          onClose={() => setShowDownloadOptions(false)} 
        />
      )}
      {showAdmin && isAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
      {showAdvancedConverter && <div className="fixed inset-0 z-[100] bg-white overflow-y-auto p-4 md:p-8"><AdvancedConverter onBack={() => setShowAdvancedConverter(false)} /></div>}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
