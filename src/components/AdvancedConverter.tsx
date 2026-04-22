import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileUp, Download, ArrowLeft, Building2, LayoutGrid, 
  Filter, Check, AlertCircle, ChevronDown, CheckCircle2,
  Table, FileSpreadsheet, Activity, Settings as SettingsIcon,
  X, Plus
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface AdvancedConverterProps {
  onBack: () => void;
}

type Unit = 'BV_DK_BL' | 'BV_DK_KV_BL' | 'TYT';
type PatientCategory = 'NGOAI_TRU' | 'NOI_TRU';
type Program = 'THA' | 'DTD' | 'COPD' | 'HEN' | 'IOD' | 'UNG_THU';

const DEFAULT_ICD_SETTINGS: { [key in Program]: string[] } = {
  THA: ['I10'],
  DTD: ['E11'],
  COPD: ['J44'],
  HEN: ['J45'],
  IOD: ['E01', 'E03', 'E04', 'E05'],
  UNG_THU: ['C']
};

export function AdvancedConverter({ onBack }: AdvancedConverterProps) {
  const [unit, setUnit] = useState<Unit>('BV_DK_BL');
  const [patientCategory, setPatientCategory] = useState<PatientCategory>('NGOAI_TRU');
  const [program, setProgram] = useState<Program>('THA');
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // ICD Settings
  const [showIcdSettings, setShowIcdSettings] = useState(false);
  const [icdSettings, setIcdSettings] = useState<{ [key in Program]: string[] }>(() => {
    const saved = localStorage.getItem('bmass_advanced_icd_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_ICD_SETTINGS, ...parsed };
      } catch (e) {
        return DEFAULT_ICD_SETTINGS;
      }
    }
    return DEFAULT_ICD_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('bmass_advanced_icd_settings', JSON.stringify(icdSettings));
  }, [icdSettings]);

  const addIcdCode = (prog: Program, code: string) => {
    if (!code) return;
    const cleanCode = code.toUpperCase().trim();
    if (icdSettings[prog]?.includes(cleanCode)) return;
    setIcdSettings(prev => ({
      ...prev,
      [prog]: [...(prev[prog] || []), cleanCode]
    }));
  };

  const removeIcdCode = (prog: Program, code: string) => {
    setIcdSettings(prev => ({
      ...prev,
      [prog]: (prev[prog] || []).filter(c => c !== code)
    }));
  };
  
  const [wardFilter, setWardFilter] = useState('Phường Hiệp Thành');
  const [provinceFilter, setProvinceFilter] = useState('Tỉnh Cà Mau');
  const [availableWards, setAvailableWards] = useState<string[]>([]);
  const [availableProvinces, setAvailableProvinces] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatExcelDate = (val: any) => {
    if (val === undefined || val === null || val === '') return '';
    if (typeof val === 'number') {
      if (val > 1900 && val < 2100) return `01/01/${val}`;
      try {
        const date = XLSX.SSF.parse_date_code(val);
        const day = String(date.d).padStart(2, '0');
        const month = String(date.m).padStart(2, '0');
        return `${day}/${month}/${date.y}`;
      } catch (e) {
        return String(val);
      }
    }
    const str = String(val).trim();
    if (/^\d{4}$/.test(str)) return `01/01/${str}`;
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      const parts = str.split('T')[0].split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return str;
  };

  const checkIcdMatch = (rowIcd: unknown, configList: string[]) => {
    if (!rowIcd || !configList || configList.length === 0) return false;
    const rowCodes = String(rowIcd).split(/[;, ]+/).map(c => c.trim().toUpperCase().replace(/\s/g, '')).filter(Boolean);
    return rowCodes.some(cleanRowIcd => {
      return configList.some(config => {
        const cleanConfig = config.trim().toUpperCase().replace(/\s/g, '');
        if (!cleanConfig) return false;
        if (cleanConfig.length === 1 && /^[A-Z]$/.test(cleanConfig)) {
          return cleanRowIcd.startsWith(cleanConfig);
        }
        if (cleanConfig.includes('-')) {
          const parts = cleanConfig.split('-');
          if (parts.length !== 2) return false;
          const start = parts[0].trim();
          const end = parts[1].trim();
          const rowBase = cleanRowIcd.split('.')[0];
          return rowBase >= start && rowBase <= end;
        }
        return cleanRowIcd.startsWith(cleanConfig);
      });
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const json = XLSX.utils.sheet_to_json(ws);
        setData(json);
        if (json.length > 0) {
          const hasNgayVK = json.some((r: any) => r.NGAYVK !== undefined && r.NGAYVK !== null && r.NGAYVK !== '');
          setPatientCategory(hasNgayVK ? 'NOI_TRU' : 'NGOAI_TRU');
        }
        if (unit === 'BV_DK_BL') {
          const wards = Array.from(new Set(json.map((r: any) => String(r.TENPXA || '').trim()).filter(Boolean)));
          const provinces = Array.from(new Set(json.map((r: any) => String(r.TENTT || '').trim()).filter(Boolean)));
          setAvailableWards(wards);
          setAvailableProvinces(provinces);
          if (wards.includes('Phường Hiệp Thành')) setWardFilter('Phường Hiệp Thành');
          else if (wards.length > 0) setWardFilter(wards[0]);
          if (provinces.includes('Tỉnh Cà Mau')) setProvinceFilter('Tỉnh Cà Mau');
          else if (provinces.length > 0) setProvinceFilter(provinces[0]);
        }
      };
      reader.readAsBinaryString(f);
    }
  };

  const processData = () => {
    if (data.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    const unitCodeMap: { [key in Unit]: string } = { 'BV_DK_BL': 'BVBL', 'BV_DK_KV_BL': 'TTYT', 'TYT': 'TYT' };
    setTimeout(() => {
      const result: any[] = [];
      const currentIcdList = icdSettings[program] || [];
      data.forEach((row, index) => {
        const rowWard = String(row.TENPXA || '').trim();
        const rowProvince = String(row.TENTT || '').trim();
        const rowICD = row.MAICD;
        if (unit === 'BV_DK_BL') {
          if (wardFilter && rowWard !== wardFilter) return;
          if (provinceFilter && rowProvince !== provinceFilter) return;
        }
        if (!checkIcdMatch(rowICD, currentIcdList)) return;
        const dateVK = (unit === 'BV_DK_BL' && patientCategory === 'NGOAI_TRU') ? row.NGAY : row.NGAYVK;
        const dateRK = (unit === 'BV_DK_BL' && patientCategory === 'NGOAI_TRU') ? row.NGAY : row.NGAYRK;
        const sothe = String(row.SOTHE || '');
        result.push({
          'HOTEN': row.HOTEN || '',
          'NAMSINH': formatExcelDate(row.NAMSINH),
          'THON': row.THON || '',
          'TENPXA': row.TENPXA || '',
          'TENTT': row.TENTT || '',
          'NGAYVK': formatExcelDate(dateVK),
          'CHANDOAN': row.CHANDOAN || '',
          'MAICD': row.MAICD || '',
          'KETQUA': row.KETQUA || '',
          'XUTRI': row.XUTRI || '',
          'TTLUCRK': row.TTLUCRK || '',
          'NGAYRK': formatExcelDate(dateRK),
          'SOTHE1': sothe.substring(0, 15),
          'SOTHE2': sothe.substring(5, 15),
          'PHAI': row.PHAI || '',
          'NOIKHAM': unitCodeMap[unit]
        });
        if (index % 100 === 0) setProgress(Math.round((index / data.length) * 100));
      });
      setProcessedData(result);
      setIsProcessing(false);
      setProgress(100);
    }, 500);
  };

  const downloadAllResults = () => {
    if (data.length === 0) return;
    const wb = XLSX.utils.book_new();
    const unitCodeMap: { [key in Unit]: string } = { 'BV_DK_BL': 'BVBL', 'BV_DK_KV_BL': 'TTYT', 'TYT': 'TYT' };
    (['THA', 'DTD', 'COPD', 'HEN', 'IOD', 'UNG_THU'] as Program[]).forEach(prog => {
      const currentIcdList = icdSettings[prog] || [];
      const result: any[] = [];
      data.forEach(row => {
        const rowWard = String(row.TENPXA || '').trim();
        const rowProvince = String(row.TENTT || '').trim();
        if (unit === 'BV_DK_BL') {
          if (wardFilter && rowWard !== wardFilter) return;
          if (provinceFilter && rowProvince !== provinceFilter) return;
        }
        if (!checkIcdMatch(row.MAICD, currentIcdList)) return;
        const dateVK = (unit === 'BV_DK_BL' && patientCategory === 'NGOAI_TRU') ? row.NGAY : row.NGAYVK;
        const dateRK = (unit === 'BV_DK_BL' && patientCategory === 'NGOAI_TRU') ? row.NGAY : row.NGAYRK;
        const sothe = String(row.SOTHE || '');
        result.push({
          'HOTEN': row.HOTEN || '',
          'NAMSINH': formatExcelDate(row.NAMSINH),
          'THON': row.THON || '',
          'TENPXA': row.TENPXA || '',
          'TENTT': row.TENTT || '',
          'NGAYVK': formatExcelDate(dateVK),
          'CHANDOAN': row.CHANDOAN || '',
          'MAICD': row.MAICD || '',
          'KETQUA': row.KETQUA || '',
          'XUTRI': row.XUTRI || '',
          'TTLUCRK': row.TTLUCRK || '',
          'NGAYRK': formatExcelDate(dateRK),
          'SOTHE1': sothe.substring(0, 15),
          'SOTHE2': sothe.substring(5, 15),
          'PHAI': row.PHAI || '',
          'NOIKHAM': unitCodeMap[unit]
        });
      });
      if (result.length > 0) {
        const ws = XLSX.utils.json_to_sheet(result);
        const catLabel = patientCategory === 'NOI_TRU' ? 'NOI' : 'NGOAI';
        XLSX.utils.book_append_sheet(wb, ws, `${catLabel}_${prog}`);
      }
    });
    XLSX.writeFile(wb, `BMASS_FullSheets_${unit}_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 md:px-8 select-none">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <button 
            onClick={onBack}
            className="group flex items-center gap-3 px-6 py-3 bg-white hover:bg-slate-900 hover:text-white rounded-2xl font-black text-xs transition-all shadow-sm border border-slate-100 active:scale-95"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            QUAY LẠI
          </button>
          
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Data Engine v2.0</p>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Bộ chuyển đổi nâng cao</h2>
             </div>
             <div className="w-14 h-14 bg-slate-900 text-indigo-400 rounded-2xl flex items-center justify-center shadow-2xl">
                <FileSpreadsheet size={28} />
             </div>
          </div>
        </div>

        {/* Tactical Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-8">
            {/* Selection Engine */}
            <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-[0_40px_100px_-20px_rgba(30,41,59,0.08)] border border-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] -mr-48 -mt-48" />
                
                <div className="relative z-10 space-y-12">
                   {/* Unit Selection */}
                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                          <Building2 size={14} className="text-indigo-500" />
                          Chọn Đơn vị Y tế
                        </label>
                        <div className="h-[1px] flex-1 bg-slate-50 ml-6" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {(['BV_DK_BL', 'BV_DK_KV_BL', 'TYT'] as Unit[]).map(u => (
                          <button
                            key={u}
                            onClick={() => setUnit(u)}
                            className={`p-6 rounded-3xl text-left transition-all duration-500 relative group overflow-hidden border ${unit === u ? 'bg-slate-900 border-slate-900 shadow-2xl shadow-slate-900/20 scale-105' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'}`}
                          >
                            <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${unit === u ? 'text-indigo-400' : 'text-slate-400'}`}>
                              {u === 'BV_DK_BL' ? 'Tuyến Tỉnh' : u === 'BV_DK_KV_BL' ? 'Tuyến Huyện' : 'Tuyến Cơ sở'}
                            </div>
                            <div className={`text-sm font-black uppercase tracking-tight ${unit === u ? 'text-white' : 'text-slate-700'}`}>
                               {u === 'BV_DK_BL' ? 'BV Đa khoa Bạc Liêu' : u === 'BV_DK_KV_BL' ? 'BV ĐKKV Bãi Cháy' : 'Trạm Y tế'}
                            </div>
                            {unit === u && <CheckCircle2 className="absolute top-4 right-4 text-indigo-400" size={24} />}
                          </button>
                        ))}
                      </div>
                   </div>

                   {/* Patient Category & Program */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-6">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                          <Activity size={14} className="text-indigo-500" />
                          Hình thức Khám
                        </label>
                        <div className="flex bg-slate-50 rounded-3xl p-2 h-16 shadow-inner">
                           {(['NGOAI_TRU', 'NOI_TRU'] as PatientCategory[]).map(cat => (
                             <button
                                key={cat}
                                onClick={() => setPatientCategory(cat)}
                                className={`flex-1 rounded-2xl text-[11px] font-black tracking-widest transition-all duration-500 ${patientCategory === cat ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400'}`}
                             >
                               {cat === 'NGOAI_TRU' ? 'NGOẠI TRÚ' : 'NỘI TRÚ'}
                             </button>
                           ))}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                          <LayoutGrid size={14} className="text-indigo-500" />
                          Danh mục Sàng lọc
                        </label>
                        <div className="relative">
                          <select 
                            value={program}
                            onChange={(e) => setProgram(e.target.value as Program)}
                            className="w-full h-16 pl-8 pr-12 bg-slate-900 text-white rounded-3xl font-black text-sm appearance-none cursor-pointer hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 uppercase tracking-widest"
                          >
                            <option value="THA">Tăng huyết áp (THA)</option>
                            <option value="DTD">Đái tháo đường (ĐTĐ)</option>
                            <option value="COPD">COPD</option>
                            <option value="HEN">Hen phế quản</option>
                            <option value="IOD">Các bệnh IOD</option>
                            <option value="UNG_THU">Ung thư các loại</option>
                          </select>
                          <ChevronDown size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
                        </div>
                      </div>
                   </div>

                   {/* File Dropper */}
                   <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative overflow-hidden group cursor-pointer border-2 border-dashed rounded-[2.5rem] p-12 text-center transition-all duration-700 ${file ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/30'}`}
                   >
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx,.xls" className="hidden" />
                      
                      <div className="relative z-10 space-y-4">
                        <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center transition-all duration-700 ${file ? 'bg-emerald-600 text-white shadow-2xl shadow-emerald-500/30 rotate-0' : 'bg-white text-slate-400 shadow-xl group-hover:scale-110 group-hover:rotate-6 group-hover:text-indigo-600'}`}>
                           {file ? <CheckCircle2 size={40} /> : <FileUp size={40} />}
                        </div>
                        <div>
                          <p className={`text-xl font-black uppercase tracking-tight ${file ? 'text-emerald-700' : 'text-slate-700'}`}>
                            {file ? file.name : 'Tải lên dữ liệu gốc'}
                          </p>
                          <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Kéo thả hoặc nhấn để chọn tệp .xlsx / .xls</p>
                        </div>
                        {file && (
                           <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-100/50 rounded-xl border border-emerald-100">
                             <Table size={14} className="text-emerald-600" />
                             <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">{data.length} bản ghi phát hiện</span>
                           </div>
                        )}
                      </div>
                   </div>
                </div>
            </div>

            {/* Runtime Actions */}
            {file && (
              <div className="flex flex-col sm:flex-row gap-6">
                <button 
                  onClick={processData}
                  disabled={isProcessing}
                  className="flex-1 group relative bg-slate-900 text-white px-10 py-6 rounded-[2rem] font-black text-sm tracking-widest overflow-hidden transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                   <div className="relative z-10 flex items-center justify-center gap-4">
                      {isProcessing ? <Activity className="animate-spin" size={24} /> : <Filter size={24} />}
                      {isProcessing ? 'ĐANG PHÂN TÍCH...' : 'CHẠY TÁC VỤ CHUYỂN ĐỔI'}
                   </div>
                   {isProcessing && (
                     <motion.div 
                        initial={{ x: '-100%' }}
                        animate={{ x: `${progress - 100}%` }}
                        className="absolute inset-0 bg-indigo-600"
                     />
                   )}
                </button>
                
                <button 
                  onClick={downloadAllResults}
                  className="group bg-indigo-600 text-white px-10 py-6 rounded-[2rem] font-black text-sm tracking-widest transition-all hover:bg-indigo-500 hover:scale-105 active:scale-95 flex items-center justify-center gap-4 shadow-xl shadow-indigo-500/20"
                >
                  <Download size={24} />
                  XUẤT TẤT CẢ SHEET
                </button>
              </div>
            )}
          </div>

          <aside className="lg:col-span-4 space-y-8">
             {/* Configuration Panel */}
             <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Cấu hình ICD-10</h3>
                  <button 
                    onClick={() => setShowIcdSettings(!showIcdSettings)}
                    className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all"
                  >
                    <SettingsIcon size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                   {showIcdSettings ? (
                     <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                        {(['THA', 'DTD', 'COPD', 'HEN', 'IOD', 'UNG_THU'] as Program[]).map(prog => (
                          <div key={prog} className="space-y-3">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{prog}</label>
                             <div className="flex flex-wrap gap-2">
                                {icdSettings[prog].map(code => (
                                  <div key={code} className="group/code flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 text-[11px] font-black">
                                    {code}
                                    <X size={12} className="cursor-pointer hover:scale-125 hover:text-rose-500 transition-all" onClick={() => removeIcdCode(prog, code)} />
                                  </div>
                                ))}
                                <button 
                                  onClick={() => {
                                    const code = prompt('Nhập mã ICD (Ví dụ: I10, C00-C97):');
                                    if (code) addIcdCode(prog, code);
                                  }}
                                  className="w-10 h-8 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl border border-slate-100 hover:border-indigo-400 hover:text-indigo-600 transition-all"
                                >
                                  <Plus size={16} />
                                </button>
                             </div>
                          </div>
                        ))}
                     </div>
                   ) : (
                     <div className="p-8 text-center space-y-4 bg-slate-50 rounded-3xl border border-slate-100 border-dashed">
                        <Filter className="mx-auto text-slate-200" size={32} />
                        <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">ICD Settings are locked. Click settings to modify.</p>
                     </div>
                   )}
                </div>
             </div>

             {/* Output Monitor */}
             {processedData.length > 0 && (
               <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-8 shadow-2xl relative overflow-hidden"
               >
                  <div className="absolute bottom-0 right-0 p-8 opacity-10">
                    <CheckCircle2 size={120} />
                  </div>

                  <div className="relative z-10 space-y-6">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20">
                           <Download size={24} />
                        </div>
                        <div>
                           <h4 className="text-base font-black uppercase tracking-tight">KẾT QUẢ SẴN SÀNG</h4>
                           <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{processedData.length} records processed</p>
                        </div>
                     </div>

                     <button 
                       onClick={() => {
                         const ws = XLSX.utils.json_to_sheet(processedData);
                         const wb = XLSX.utils.book_new();
                         XLSX.utils.book_append_sheet(wb, ws, "ChuyenDoi");
                         XLSX.writeFile(wb, `BMASS_${program}_${unit}_${new Date().toISOString().split('T')[0]}.xlsx`);
                       }}
                       className="w-full py-5 bg-white text-slate-900 rounded-[1.5rem] font-black text-xs tracking-widest uppercase hover:bg-slate-50 transition-all active:scale-95 shadow-xl"
                     >
                       Tải xuống Sheet {program}
                     </button>
                  </div>
               </motion.div>
             )}
          </aside>
        </div>

        {/* Data Mirror (Preview) */}
        {processedData.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[3rem] p-10 md:p-14 shadow-2xl border border-slate-100 overflow-hidden"
          >
             <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 text-indigo-400 rounded-2xl flex items-center justify-center">
                    <Table size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Gương dữ liệu chuyển đổi</h3>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Live Preview Engine</p>
                  </div>
                </div>
                <div className="px-6 py-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
                  Showing top 10 records
                </div>
             </div>

             <div className="overflow-x-auto custom-scrollbar -mx-10 px-10">
                <table className="w-full text-[11px] text-left border-collapse min-w-[1600px]">
                   <thead>
                      <tr className="border-b border-slate-100">
                         {['HOTEN', 'NAMSINH', 'THON', 'TENPXA', 'TENTT', 'NGAYVK', 'CHANDOAN', 'MAICD', 'XUTRI', 'SOTHE1', 'SOTHE2', 'PHAI', 'NOIKHAM'].map(k => (
                           <th key={k} className="py-6 px-4 font-black uppercase text-slate-400 tracking-[0.1em]">{k}</th>
                         ))}
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {processedData.slice(0, 10).map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors group">
                           {['HOTEN', 'NAMSINH', 'THON', 'TENPXA', 'TENTT', 'NGAYVK', 'CHANDOAN', 'MAICD', 'XUTRI', 'SOTHE1', 'SOTHE2', 'PHAI', 'NOIKHAM'].map((k) => (
                             <td key={k} className="py-5 px-4 font-bold text-slate-600 group-hover:text-slate-900">
                               {String(row[k] || '')}
                             </td>
                           ))}
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
             
             <div className="mt-10 pt-10 border-t border-slate-50 flex justify-center">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] animate-pulse">PREVIEW MODE ONLY • EXPORT FOR FULL SCALE</p>
             </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showIcdSettings && (
          <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <SettingsIcon size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 tracking-tight">Cấu hình mã ICD</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thiết lập bộ lọc cho từng chương trình</p>
                  </div>
                </div>
                <button onClick={() => setShowIcdSettings(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-8 no-scrollbar">
                {(['THA', 'DTD', 'COPD', 'HEN', 'IOD', 'UNG_THU'] as Program[]).map(prog => (
                  <div key={prog} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                        {prog === 'THA' ? 'Tăng huyết áp' : 
                         prog === 'DTD' ? 'Đái tháo đường' : 
                         prog === 'UNG_THU' ? 'Ung thư các loại' : 
                         prog === 'COPD' ? 'COPD' : 
                         prog === 'HEN' ? 'Hen phế quản' : 'Rối loạn do thiếu IOD'}
                      </h4>
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          placeholder="Thêm mã (VD: I10)" 
                          className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addIcdCode(prog, e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        <button className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {icdSettings[prog]?.map(code => (
                        <div key={code} className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-[11px] font-bold text-slate-600 group">
                          {code}
                          <button 
                            onClick={() => removeIcdCode(prog, code)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      {(icdSettings[prog]?.length === 0 || !icdSettings[prog]) && (
                        <p className="text-[10px] text-slate-400 italic">Chưa có mã nào được cấu hình</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button 
                  onClick={() => setShowIcdSettings(false)}
                  className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-slate-200"
                >
                  Hoàn tất
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
