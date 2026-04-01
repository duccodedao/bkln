import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Download, AlertCircle, Trash2, FileOutput, Activity, Droplet, Settings, Calendar, LogOut, Shield, Lock, ShieldAlert, MapPin, CheckSquare, Square, CheckCircle, Users, Database, Filter, ChevronRight, Info, RefreshCcw, ShieldCheck, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminPanel from './components/AdminPanel';
import UpgradeModal from './components/UpgradeModal';
import Login from './components/Login';

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

function DownloadOptionsModal({ onConfirm, onClose }: { onConfirm: (tha: boolean, dtd: boolean) => void, onClose: () => void }) {
  const [tha, setTha] = useState(true);
  const [dtd, setDtd] = useState(true);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
        <h3 className="text-xl font-bold mb-4">Tùy chọn tải xuống</h3>
        <p className="text-sm text-gray-500 mb-6">Bạn chưa chọn khoảng ngày, hệ thống sẽ tải toàn bộ dữ liệu. Vui lòng chọn loại file muốn tải:</p>
        
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
        </div>

        <div className="flex space-x-3">
          <button onClick={onClose} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Hủy</button>
          <button 
            onClick={() => onConfirm(tha, dtd)} 
            disabled={!tha && !dtd}
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-sm max-w-md w-full">
        <div className="flex justify-center mb-6">
          <img src="https://hdd.io.vn/img/bmassloadings.png" alt="Logo" className="h-16 w-auto object-contain" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Thiết lập hồ sơ</h2>
        <p className="text-gray-500 mb-6 text-center text-sm">Vui lòng cung cấp thông tin để tiếp tục sử dụng hệ thống.</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên Cá nhân (*)</label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn A"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên Đơn vị (*)</label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              placeholder="Ví dụ: Trạm Y tế Xã A"
            />
          </div>
          <button 
            onClick={() => onSubmit(name, org)}
            disabled={!name || !org}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
}

function MainApp() {
  const { 
    user, profile, isGlobalPremium, 
    filterDateRangePremium, filterGenderFormatPremium, filterAdminUnitPremium, filterDuplicatePremium,
    logout, needsProfileSetup, setupProfile, loading: authLoading 
  } = useAuth();
  const [showAdmin, setShowAdmin] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showAdminUnit, setShowAdminUnit] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);

  const [inputData, setInputData] = useState<any[]>([]);
  const [outputDataTHA, setOutputDataTHA] = useState<any[]>([]);
  const [outputDataDTD, setOutputDataDTD] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'THA' | 'DTD'>('THA');
  const [processProgress, setProcessProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [genderFormat, setGenderFormat] = useState<'text' | 'number'>('text');
  const [bsMin, setBsMin] = useState<string>('');
  const [bsMax, setBsMax] = useState<string>('');
  const [showBsConfig, setShowBsConfig] = useState(false);
  const [adminUnitCode, setAdminUnitCode] = useState('');
  const [removeDuplicates, setRemoveDuplicates] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <img src="https://hdd.io.vn/img/bmassloadings.png" alt="Loading" className="h-20 w-auto object-contain mb-4 animate-pulse" />
        <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 animate-progress"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
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

  const hasPremiumAccess = profile?.role === 'admin' || profile?.isPremium || isGlobalPremium;

  const transformData = (data: any[], currentGenderFormat: 'text' | 'number', currentAdminUnit: string) => {
    const currentYear = new Date().getFullYear();
    const thaData: any[] = [];
    const dtdData: any[] = [];

    const getVal = (row: any, keys: string[]) => {
      for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
      }
      return '';
    };

    data.forEach((row) => {
      let gender = '';
      let birthYear = '';
      
      // Try to find gender and age/birth year
      const namVal = getVal(row, ['NAM', 'Nam', 'Male']);
      const nuVal = getVal(row, ['NU', 'Nữ', 'Female']);
      const gioiTinhVal = getVal(row, ['GIOI_TINH', 'Giới tính', 'Gender']);
      const namSinhVal = getVal(row, ['NAM_SINH', 'Năm sinh', 'BirthYear', 'YearOfBirth']);
      const tuoiVal = getVal(row, ['TUOI', 'Tuổi', 'Age']);

      if (namVal !== '') {
        gender = currentGenderFormat === 'number' ? '01' : 'Nam';
        const age = parseInt(namVal, 10);
        if (!isNaN(age) && age < 150) birthYear = String(currentYear - age);
        else birthYear = String(namVal);
      } else if (nuVal !== '') {
        gender = currentGenderFormat === 'number' ? '02' : 'Nữ';
        const age = parseInt(nuVal, 10);
        if (!isNaN(age) && age < 150) birthYear = String(currentYear - age);
        else birthYear = String(nuVal);
      } else if (gioiTinhVal !== '') {
        const gt = String(gioiTinhVal).toLowerCase();
        if (gt.includes('nam') || gt === '1' || gt === 'm' || gt === 'male') {
          gender = currentGenderFormat === 'number' ? '01' : 'Nam';
        } else if (gt.includes('nữ') || gt.includes('nu') || gt === '2' || gt === 'f' || gt === 'female') {
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

      // Ensure birthYear is just the year
      if (birthYear.length > 4) {
        const match = birthYear.match(/\d{4}/);
        if (match) birthYear = match[0];
      }

      const diagnosis = getVal(row, ['CHAN_DOAN', 'Chẩn đoán', 'MA_BENH', 'ICD10']) || '';
      const hasTHA = diagnosis.includes('I10') || diagnosis.includes('I11') || diagnosis.includes('I12') || diagnosis.includes('I13') || diagnosis.includes('I15');
      const hasDTD = diagnosis.includes('E10') || diagnosis.includes('E11') || diagnosis.includes('E12') || diagnosis.includes('E13') || diagnosis.includes('E14');

      const commonFields = {
        'Họ tên (*)': getVal(row, ['TEN_BENH_NHAN', 'HO_TEN', 'Họ tên', 'Tên bệnh nhân']),
        'Giới tính (*)': gender,
        'Năm sinh (*)': birthYear,
        'Mã BHYT (*)': getVal(row, ['SO_THE_BHYT', 'MA_THE', 'Mã BHYT', 'Số thẻ BHYT']),
        'Số CMT/CCCD (*)': getVal(row, ['SO_CMT', 'CMND', 'CCCD', 'Số CMT/CCCD']),
        'Số điện thoại': getVal(row, ['DIEN_THOAI', 'Số điện thoại', 'SDT', 'Phone']),
        'Địa chỉ': getVal(row, ['DIA_CHI', 'Địa chỉ']),
        'Xã/Phường/Thị trấn (*)': currentAdminUnit || '',
        'Ngày phát hiện bệnh': getVal(row, ['NGAY_PHAT_HIEN', 'Ngày phát hiện']),
        'Nơi phát hiện': getVal(row, ['NOI_PHAT_HIEN', 'Nơi phát hiện']),
        'Ngày khám (*)': getVal(row, ['NGAYRA', 'NGAY_KHAM', 'Ngày khám', 'Ngày ra']),
        'Phân loại BN (*)': '',
        'HA tâm thu (*)': getVal(row, ['HUYET_AP_CAO', 'HA_TAM_THU', 'Huyết áp cao', 'HA tâm thu']),
        'HA tâm trương (*)': getVal(row, ['HUYET_AP_THAP', 'HA_TAM_TRUONG', 'Huyết áp thấp', 'HA tâm trương']),
        'Cân nặng': getVal(row, ['CAN_NANG', 'Cân nặng', 'Weight']),
        'Chiều cao': getVal(row, ['CHIEU_CAO', 'Chiều cao', 'Height']),
        'Vòng eo': getVal(row, ['VONG_EO', 'Vòng eo']),
        'Hút thuốc lá': getVal(row, ['HUT_THUOC', 'Hút thuốc lá']),
        'Mức độ uống rượu bia': getVal(row, ['RUOU_BIA', 'Mức độ uống rượu bia']),
        'Thực hành giảm ăn muối': getVal(row, ['GIAM_AN_MUOI', 'Thực hành giảm ăn muối']),
        'Hoạt động thể lực đủ theo khuyến nghị': getVal(row, ['HOAT_DONG_THE_LUC', 'Hoạt động thể lực']),
        'Chẩn đoán': diagnosis,
        'Thuốc điều trị': getVal(row, ['CHAN_DOAN_KKB', 'THUOC', 'Thuốc điều trị', 'Đơn thuốc']),
        'Số ngày nhận thuốc': getVal(row, ['SO_NGAY_CAP', 'Số ngày nhận thuốc', 'Số ngày']),
        'Biến chứng': getVal(row, ['BIEN_CHUNG', 'Biến chứng']),
        'Kết quả điều trị': getVal(row, ['KET_QUA_DIEU_TRI', 'Kết quả điều trị']) || '',
        'Ngày tái khám': getVal(row, ['NGAY_TAI_KHAM', 'Ngày tái khám'])
      };

      if (hasTHA) {
        thaData.push({
          ...commonFields,
          'Ăn đủ 400g rau và trái cây': getVal(row, ['AN_RAU_TRAI_CAY', 'Ăn đủ 400g rau']),
        });
      }

      if (hasDTD) {
        dtdData.push({
          ...commonFields,
          'Đường huyết (*)': getVal(row, ['DUONG_HUYET', 'Đường huyết', 'BloodSugar']),
          'HbA1C': getVal(row, ['HBA1C', 'HbA1C']),
          'Rối loạn lipid máu (*)': getVal(row, ['ROI_LOAN_LIPID', 'Rối loạn lipid máu']),
          'Thực hành ăn uống hợp lý': getVal(row, ['AN_UONG_HOP_LY', 'Thực hành ăn uống hợp lý']),
          'Theo dõi biến chứng bàn chân': getVal(row, ['BIEN_CHUNG_BAN_CHAN', 'Theo dõi biến chứng bàn chân']),
          'Biết xử lý hạ đường huyết': getVal(row, ['XU_LY_HA_DUONG_HUYET', 'Biết xử lý hạ đường huyết']),
        });
      }
    });

    return { thaData, dtdData };
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
        const { thaData, dtdData } = transformData(jsonData, genderFormat, adminUnitCode);
        setOutputDataTHA(thaData);
        setOutputDataDTD(dtdData);
        
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

  const handleApplyAdminUnit = (code?: string) => {
    if (!hasPremiumAccess) return setShowUpgrade(true);
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
  };

  const handleApplyFilters = () => {
    if (!hasPremiumAccess) return setShowUpgrade(true);
    handleApplyAdminUnit();
    // Gender format is already applied immediately in handleGenderFormatChange, 
    // but we can ensure everything is synced here if needed.
    setError('Đã áp dụng bộ lọc thành công.');
    setTimeout(() => setError(''), 3000);
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setAdminUnitCode('');
    setBsMin('');
    setBsMax('');
    setGenderFormat('text');
    
    // Re-transform data to original state
    if (inputData.length > 0) {
      const { thaData, dtdData } = transformData(inputData, 'text', '');
      setOutputDataTHA(thaData);
      setOutputDataDTD(dtdData);
    }
    
    setError('Đã xóa tất cả bộ lọc.');
    setTimeout(() => setError(''), 3000);
  };

  const handleGenderFormatChange = (format: 'text' | 'number') => {
    if (!hasPremiumAccess) return setShowUpgrade(true);
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
  };

  const handleApplyBloodSugar = () => {
    if (!hasPremiumAccess) return setShowUpgrade(true);
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

  const getFilteredData = (data: any[]) => {
    let filtered = data;
    
    if (startDate && endDate && hasPremiumAccess) {
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

    if (removeDuplicates && hasPremiumAccess) {
      const uniqueMap = new Map<string, any>();
      
      filtered.forEach(row => {
        const bhyt = String(row['Mã BHYT (*)'] || '').trim();
        if (!bhyt) return;
        
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
      
      filtered = Array.from(uniqueMap.values());
    }

    return filtered;
  };

  const filteredTHA = getFilteredData(outputDataTHA);
  const filteredDTD = getFilteredData(outputDataDTD);

  const handleDownload = () => {
    if (!startDate || !endDate) {
      setShowDownloadOptions(true);
      return;
    }
    executeDownload(true, true);
  };

  const executeDownload = (downloadTHA: boolean, downloadDTD: boolean) => {
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

  const currentData = activeTab === 'THA' ? filteredTHA : filteredDTD;
  const currentColumns = activeTab === 'THA' ? THA_COLUMNS : DTD_COLUMNS;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 lg:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-50 rounded-xl">
              <img src="https://hdd.io.vn/img/bmassloadings.png" alt="Logo" className="h-10 w-auto object-contain" />
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
            
            <div className="flex items-center gap-2">
              {profile?.role === 'admin' && (
                <button 
                  onClick={() => setShowAdmin(true)} 
                  className="p-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100"
                  title="Admin Panel"
                >
                  <Shield size={20} />
                </button>
              )}
              <button 
                onClick={logout} 
                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                title="Đăng xuất"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Upload & Stats */}
          <div className="lg:col-span-4 space-y-6">
            {/* Upload Card */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Upload size={18} className="text-blue-600" />
                  Tải lên dữ liệu
                </h3>
                {inputData.length > 0 && (
                  <button 
                    onClick={handleReset}
                    className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={14} />
                    Làm mới
                  </button>
                )}
              </div>
              
              <div className="p-5">
                <div 
                  className={`relative group border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer
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
                  
                  <div className="flex flex-col items-center space-y-3">
                    <div className={`p-4 rounded-2xl transition-colors ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                      <FileSpreadsheet size={32} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-700">
                        {fileName ? (
                          <div className="space-y-1">
                            <span className="text-blue-600 truncate max-w-[200px] block">{fileName}</span>
                            {inputData.length > 0 && (
                              <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                                {inputData.length.toLocaleString()} dòng dữ liệu
                              </span>
                            )}
                          </div>
                        ) : 'Chọn file Excel hoặc CSV'}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Kéo thả file vào vùng này</p>
                    </div>
                  </div>
                </div>

                {isProcessing && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 space-y-3"
                  >
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Đang xử lý...</span>
                      <span className="text-lg font-black text-blue-600">{processProgress}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-blue-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${processProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
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

            {/* Stats Section */}
            <AnimatePresence>
              {inputData.length > 0 && (
                <motion.section 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Activity size={18} />
                      </div>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">THA</span>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-slate-900 leading-none">{filteredTHA.length}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Bệnh nhân</p>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Droplet size={18} />
                      </div>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">ĐTĐ</span>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-slate-900 leading-none">{filteredDTD.length}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Bệnh nhân</p>
                    </div>
                  </div>
                  <div className="col-span-2 bg-slate-900 p-5 rounded-2xl shadow-lg shadow-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-slate-800 text-slate-400 rounded-lg">
                        <Users size={18} />
                      </div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tổng cộng</span>
                    </div>
                    <div>
                      <p className="text-3xl font-black text-white leading-none">{filteredTHA.length + filteredDTD.length}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Dữ liệu đã lọc</p>
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Filters & Preview */}
          <div className="lg:col-span-8 space-y-6">
            {inputData.length > 0 ? (
              <>
                {/* Filters Card */}
                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
                  {!hasPremiumAccess && (
                    <div className="absolute inset-0 bg-slate-50/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6 text-center">
                      <div className="p-4 bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center max-w-xs">
                        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                          <Lock size={24} />
                        </div>
                        <h4 className="font-bold text-slate-900 mb-2">Tính năng Premium</h4>
                        <p className="text-xs text-slate-500 mb-6 leading-relaxed">Nâng cấp để sử dụng bộ lọc ngày, định dạng giới tính và mã đơn vị hành chính.</p>
                        <button 
                          onClick={() => setShowUpgrade(true)} 
                          className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
                        >
                          Mở khóa ngay
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Filter size={18} className="text-blue-600" />
                      Bộ lọc dữ liệu
                    </h3>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <Info size={12} />
                      Cấu hình xuất
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Date Range */}
                      <div className="space-y-4">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Calendar size={14} />
                          Khoảng thời gian khám
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 ml-1 flex items-center gap-1">
                              <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                              Từ ngày
                            </label>
                            <div className="relative group">
                              <input 
                                type="date" 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-3 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer group-hover:bg-white" 
                                value={startDate} 
                                onChange={e => setStartDate(e.target.value)} 
                                disabled={filterDateRangePremium && !hasPremiumAccess}
                              />
                              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-hover:text-blue-400 transition-colors" size={16} />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 ml-1 flex items-center gap-1">
                              <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                              Đến ngày
                            </label>
                            <div className="relative group">
                              <input 
                                type="date" 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-3 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer group-hover:bg-white" 
                                value={endDate} 
                                onChange={e => setEndDate(e.target.value)} 
                                disabled={filterDateRangePremium && !hasPremiumAccess}
                              />
                              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-hover:text-blue-400 transition-colors" size={16} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Gender & Admin Unit */}
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Users size={14} />
                            Định dạng giới tính
                          </label>
                          <div className="flex p-1 bg-slate-100 rounded-xl">
                            <button 
                              onClick={() => handleGenderFormatChange('text')}
                              disabled={filterGenderFormatPremium && !hasPremiumAccess}
                              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${genderFormat === 'text' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'} ${filterGenderFormatPremium && !hasPremiumAccess ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              Nam / Nữ
                            </button>
                            <button 
                              onClick={() => handleGenderFormatChange('number')}
                              disabled={filterGenderFormatPremium && !hasPremiumAccess}
                              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${genderFormat === 'number' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'} ${filterGenderFormatPremium && !hasPremiumAccess ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              01 / 02
                            </button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck size={14} />
                            Tùy chọn nâng cao
                          </label>
                          <button 
                            onClick={() => setRemoveDuplicates(!removeDuplicates)}
                            disabled={filterDuplicatePremium && !hasPremiumAccess}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${removeDuplicates ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'} ${filterDuplicatePremium && !hasPremiumAccess ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${removeDuplicates ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'}`}>
                                {removeDuplicates && <Check size={10} strokeWidth={4} />}
                              </div>
                              <span className="text-xs font-bold">Lọc trùng (10 số cuối BHYT)</span>
                            </div>
                            <Info size={14} className="opacity-40" />
                          </button>
                        </div>
                      </div>

                      {/* Admin Unit Code */}
                      <div className="space-y-4">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <MapPin size={14} />
                          Mã đơn vị hành chính (*)
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input 
                              type="text"
                              value={adminUnitCode}
                              onChange={(e) => setAdminUnitCode(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleApplyAdminUnit()}
                              placeholder="Nhập mã xã/phường..."
                              disabled={filterAdminUnitPremium && !hasPremiumAccess}
                              className={`w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all ${filterAdminUnitPremium && !hasPremiumAccess ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                            <button 
                              onClick={() => setShowAdminUnit(true)}
                              disabled={filterAdminUnitPremium && !hasPremiumAccess}
                              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-blue-600 transition-colors ${filterAdminUnitPremium && !hasPremiumAccess ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <ChevronRight size={18} />
                            </button>
                          </div>
                          <button 
                            onClick={() => handleApplyAdminUnit()}
                            disabled={filterAdminUnitPremium && !hasPremiumAccess}
                            className={`px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all active:scale-95 ${filterAdminUnitPremium && !hasPremiumAccess ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            Xác nhận
                          </button>
                        </div>
                      </div>

                      {/* Blood Sugar Config */}
                      <div className="space-y-4">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Database size={14} />
                          Cấu hình đường huyết
                        </label>
                        {profile?.role !== 'admin' ? (
                          <div className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-400 flex items-center justify-center gap-2">
                            <Lock size={12} />
                            CHỈ DÀNH CHO ADMIN
                          </div>
                        ) : !showBsConfig ? (
                          <button 
                            onClick={() => setShowBsConfig(true)} 
                            className="w-full py-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all"
                          >
                            Tự động điền kết quả
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              placeholder="Min" 
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none" 
                              value={bsMin} 
                              onChange={e => setBsMin(e.target.value)} 
                            />
                            <span className="text-slate-300">-</span>
                            <input 
                              type="number" 
                              placeholder="Max" 
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none" 
                              value={bsMax} 
                              onChange={e => setBsMax(e.target.value)} 
                            />
                            <button 
                              onClick={handleApplyBloodSugar} 
                              className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
                            >
                              <CheckCircle size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
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
                  </div>
                </section>

                {/* Data Preview Card */}
                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/30">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="flex p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <button 
                          onClick={() => setActiveTab('THA')}
                          className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
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
                          className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'DTD' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          <Droplet size={14} />
                          Đái tháo đường
                          <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'DTD' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                            {filteredDTD.length}
                          </span>
                        </button>
                      </div>
                      <div className="hidden md:flex flex-col">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Tổng số dòng</span>
                        <span className="text-sm font-black text-slate-900">{currentData.length}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={handleDownload}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                    >
                      <Download size={18} />
                      Xuất file Excel
                    </button>
                  </div>

                  <div className="relative">
                    {currentData.length > 0 ? (
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
                              {currentData.slice(0, 50).map((row, rowIndex) => (
                                <tr key={rowIndex} className="hover:bg-slate-50/50 transition-colors group">
                                  {currentColumns.map((col, colIndex) => (
                                    <td key={colIndex} className="px-4 py-3 text-xs font-medium text-slate-600 whitespace-nowrap">
                                      {row[col] || <span className="text-slate-300 italic">Trống</span>}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Hiển thị 50 / {currentData.length} bản ghi
                          </p>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                            <CheckCircle size={12} />
                            Dữ liệu đã sẵn sàng
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                        <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-4">
                          <Database size={32} />
                        </div>
                        <h4 className="font-bold text-slate-900 mb-1">Không có dữ liệu</h4>
                        <p className="text-xs text-slate-400 max-w-[200px]">Vui lòng kiểm tra lại bộ lọc hoặc file tải lên của bạn.</p>
                      </div>
                    )}
                  </div>
                </section>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 p-12 text-center">
                <div className="w-20 h-20 bg-blue-50 text-blue-200 rounded-full flex items-center justify-center mb-6">
                  <FileSpreadsheet size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Chưa có dữ liệu xử lý</h3>
                <p className="text-sm text-slate-500 max-w-sm leading-relaxed">Tải lên file danh sách khám bệnh để hệ thống tự động phân loại và chuyển đổi định dạng chuẩn.</p>
              </div>
            )}
          </div>
        </main>
      </div>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
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
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
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
