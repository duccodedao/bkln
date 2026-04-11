import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Activity, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  ClipboardCheck,
  Stethoscope,
  Wind,
  Heart,
  Scale,
  Ruler,
  Info,
  Download,
  RefreshCcw
} from 'lucide-react';

import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface ScreeningData {
  // Administrative
  investigator: string;
  workUnit: string;
  ward: string;
  executionDate: string;
  fullName: string;
  birthYear: string;
  gender: 'Nam' | 'Nữ' | '';
  address: string;
  phone: string;
  
  // Anthropometric
  height: string; // in m
  weight: string; // in kg
  waist: string; // in cm
  
  // Current diseases
  hasHypertension: boolean;
  hasDiabetes: boolean;
  hasCancer: boolean;
  
  // BP
  sbp1: string;
  dbp1: string;
  sbp2: string;
  dbp2: string;
  
  // Blood sugar
  bloodSugar: string;
  
  // Section A: Family History
  familyDiabetes: boolean;
  familyHypertension: boolean;
  familyCancer: boolean;
  
  // Section B: Risk Factors
  lowVeggie: boolean;
  highSalt: boolean;
  smoking: boolean;
  stress: boolean;
  lowPhysicalActivity: boolean;
  highAlcohol: boolean;
  gestationalDiabetes: boolean; // for women
  
  // Section C: Signs
  signHTN: boolean;
  signDiabetes: boolean;
  signCancer: boolean;
  
  // Appendix 3: COPD (GOLD)
  copd_q1: boolean; // Cough
  copd_q2: boolean; // Phlegm
  copd_q3: boolean; // Shortness of breath
  copd_q4: boolean; // Over 40 (calculated)
  copd_q5: boolean; // Smoking
  
  // Appendix 4: Asthma (IPCRG)
  asthma_q1: boolean;
  asthma_q2: boolean;
  asthma_q3: boolean;
  asthma_q4: boolean;
  asthma_q5: boolean;
  asthma_q6: boolean;
  asthma_q7: boolean;
}

const initialData: ScreeningData = {
  investigator: '',
  workUnit: 'Trạm Y tế Phường Hiệp Thành',
  ward: 'Phường Hiệp Thành',
  executionDate: new Date().toLocaleString('vi-VN'),
  fullName: '',
  birthYear: '',
  gender: '',
  address: '',
  phone: '',
  height: '',
  weight: '',
  waist: '',
  hasHypertension: false,
  hasDiabetes: false,
  hasCancer: false,
  sbp1: '',
  dbp1: '',
  sbp2: '',
  dbp2: '',
  bloodSugar: '',
  familyDiabetes: false,
  familyHypertension: false,
  familyCancer: false,
  lowVeggie: false,
  highSalt: false,
  smoking: false,
  stress: false,
  lowPhysicalActivity: false,
  highAlcohol: false,
  gestationalDiabetes: false,
  signHTN: false,
  signDiabetes: false,
  signCancer: false,
  copd_q1: false,
  copd_q2: false,
  copd_q3: false,
  copd_q4: false,
  copd_q5: false,
  asthma_q1: false,
  asthma_q2: false,
  asthma_q3: false,
  asthma_q4: false,
  asthma_q5: false,
  asthma_q6: false,
  asthma_q7: false,
};

export default function OnlineScreeningForm() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ScreeningData>(initialData);
  const [showResult, setShowResult] = useState(false);
  const [addressMode, setAddressMode] = useState<'select' | 'manual'>('select');

  React.useEffect(() => {
    const savedInvestigator = localStorage.getItem('bmass_investigator');
    if (savedInvestigator) {
      setData(prev => ({ ...prev, investigator: savedInvestigator }));
    }
    
    // Update execution date every minute to keep it "realtime"
    const timer = setInterval(() => {
      setData(prev => ({ ...prev, executionDate: new Date().toLocaleString('vi-VN') }));
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  const handleChange = (field: keyof ScreeningData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    if (field === 'investigator') {
      localStorage.setItem('bmass_investigator', value);
    }
  };

  const bmi = useMemo(() => {
    const h = parseFloat(data.height);
    const w = parseFloat(data.weight);
    if (h > 0 && w > 0) {
      return w / (h * h);
    }
    return 0;
  }, [data.height, data.weight]);

  const age = useMemo(() => {
    if (!data.birthYear) return 0;
    return new Date().getFullYear() - parseInt(data.birthYear);
  }, [data.birthYear]);

  const diabetesRiskScore = useMemo(() => {
    let score = 0;
    
    // 1. BMI
    if (bmi < 23) score += 0;
    else if (bmi < 27.5) score += 3;
    else score += 5;
    
    // 2. Age
    if (age < 45) score += 0;
    else if (age <= 49) score += 1;
    else score += 2;
    
    // 3. Gender
    if (data.gender === 'Nam') score += 2;
    else score += 0;
    
    // 4. Waist
    const waist = parseFloat(data.waist);
    if (data.gender === 'Nam') {
      if (waist >= 90) score += 2;
    } else {
      if (waist >= 80) score += 2;
    }
    
    // 5. Family history
    if (data.familyDiabetes) score += 4;
    
    // 6. BP
    const sbp = Math.max(parseFloat(data.sbp1) || 0, parseFloat(data.sbp2) || 0);
    const dbp = Math.max(parseFloat(data.dbp1) || 0, parseFloat(data.dbp2) || 0);
    if (sbp >= 140 || dbp >= 90) score += 2;
    
    return score;
  }, [bmi, age, data.gender, data.waist, data.familyDiabetes, data.sbp1, data.sbp2, data.dbp1, data.dbp2]);

  const copdCount = [data.copd_q1, data.copd_q2, data.copd_q3, age >= 40, data.copd_q5].filter(Boolean).length;
  const asthmaCount = [data.asthma_q1, data.asthma_q2, data.asthma_q3, data.asthma_q4, data.asthma_q5, data.asthma_q6, data.asthma_q7].filter(Boolean).length;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitScreening = async () => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'online_screenings'), {
        ...data,
        diabetesRiskScore,
        copdCount,
        asthmaCount,
        bmi,
        age,
        createdAt: serverTimestamp()
      });
      setShowResult(true);
    } catch (error) {
      console.error('Error saving screening:', error);
      alert('Có lỗi xảy ra khi lưu dữ liệu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const renderStep = () => {
    switch(step) {
      case 1:
        const khoms = [
          "Khóm Biển Đông A", "Khóm Biển Đông B", "Khóm Biển Tây A", "Khóm Biển Tây B",
          "Khóm Giồng Giữa A", "Khóm Giồng Giữa B", "Khóm Giồng Giữa", "Khóm Xóm Lẩm",
          "Khóm Giồng Nhãn", "Khóm Giồng Nhãn A", "Khóm Đầu Lộ", "Khóm Đầu Lộ A",
          "Khóm Chòm Xoài", "Khóm Nhà Mát", "Khóm Bờ Tây", "Khóm Kinh Tế"
        ];
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <User size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Thông tin hành chính</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Người điều tra</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  value={data.investigator}
                  onChange={e => handleChange('investigator', e.target.value)}
                  placeholder="Nhập tên người điều tra..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Ngày thực hiện</label>
                <div className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium">
                  {data.executionDate}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Đơn vị công tác</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl outline-none text-slate-500"
                  value={data.workUnit}
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Xã/Phường</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl outline-none text-slate-500"
                  value={data.ward}
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Họ và tên đối tượng</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  value={data.fullName}
                  onChange={e => handleChange('fullName', e.target.value)}
                  placeholder="Nhập họ tên..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Năm sinh</label>
                <input 
                  type="number" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  value={data.birthYear}
                  onChange={e => handleChange('birthYear', e.target.value)}
                  placeholder="VD: 1980"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Giới tính</label>
                <div className="flex gap-4">
                  {['Nam', 'Nữ'].map(g => (
                    <button
                      key={g}
                      onClick={() => handleChange('gender', g)}
                      className={`flex-1 py-3 rounded-xl font-bold transition-all border ${
                        data.gender === g ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Số điện thoại</label>
                <input 
                  type="tel" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  value={data.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  placeholder="Nhập số điện thoại..."
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-600">Địa chỉ (Khóm)</label>
                  <button 
                    onClick={() => setAddressMode(addressMode === 'select' ? 'manual' : 'select')}
                    className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-widest"
                  >
                    {addressMode === 'select' ? 'Nhập tay địa chỉ khác' : 'Chọn từ danh sách'}
                  </button>
                </div>
                {addressMode === 'select' ? (
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    value={data.address}
                    onChange={e => handleChange('address', e.target.value)}
                  >
                    <option value="">-- Chọn Khóm --</option>
                    {khoms.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    value={data.address}
                    onChange={e => handleChange('address', e.target.value)}
                    placeholder="Nhập địa chỉ cụ thể..."
                  />
                )}
              </div>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                <Activity size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Chỉ số nhân trắc & Bệnh lý</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                  <Ruler size={14} /> Chiều cao (m)
                </label>
                <input 
                  type="number" step="0.01"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  value={data.height}
                  onChange={e => handleChange('height', e.target.value)}
                  placeholder="VD: 1.65"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                  <Scale size={14} /> Cân nặng (kg)
                </label>
                <input 
                  type="number" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  value={data.weight}
                  onChange={e => handleChange('weight', e.target.value)}
                  placeholder="VD: 60"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                  <Activity size={14} /> Vòng bụng (cm)
                </label>
                <input 
                  type="number" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  value={data.waist}
                  onChange={e => handleChange('waist', e.target.value)}
                  placeholder="VD: 80"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-sm font-bold text-slate-700 mb-3">Hiện đang mắc bệnh:</p>
              <div className="flex flex-wrap gap-4">
                {[
                  { id: 'hasHypertension', label: 'Tăng huyết áp' },
                  { id: 'hasDiabetes', label: 'Đái tháo đường' },
                  { id: 'hasCancer', label: 'Ung thư' }
                ].map(item => (
                  <label key={item.id} className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      checked={data[item.id as keyof ScreeningData] as boolean}
                      onChange={e => handleChange(item.id as keyof ScreeningData, e.target.checked)}
                    />
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <p className="text-sm font-bold text-slate-700">Chỉ số huyết áp (mmHg):</p>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="number" placeholder="Lần 1: Thu"
                    className="p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    value={data.sbp1} onChange={e => handleChange('sbp1', e.target.value)}
                  />
                  <input 
                    type="number" placeholder="Lần 1: Trương"
                    className="p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    value={data.dbp1} onChange={e => handleChange('dbp1', e.target.value)}
                  />
                  <input 
                    type="number" placeholder="Lần 2: Thu"
                    className="p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    value={data.sbp2} onChange={e => handleChange('sbp2', e.target.value)}
                  />
                  <input 
                    type="number" placeholder="Lần 2: Trương"
                    className="p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    value={data.dbp2} onChange={e => handleChange('dbp2', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-sm font-bold text-slate-700">Đường huyết mao mạch (mmol/L):</p>
                <input 
                  type="number" step="0.1"
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  value={data.bloodSugar}
                  onChange={e => handleChange('bloodSugar', e.target.value)}
                  placeholder="Nhập chỉ số đường huyết lúc đói..."
                />
              </div>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                <Users size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Yếu tố gia đình & Nguy cơ</h3>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border-l-4 border-amber-400">
                A. Yếu tố gia đình (Bao gồm cha/mẹ/anh/chị/em ruột)
              </p>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'familyDiabetes', label: 'Gia đình có người mắc Đái tháo đường' },
                  { id: 'familyHypertension', label: 'Gia đình có người mắc Tăng huyết áp' },
                  { id: 'familyCancer', label: 'Gia đình có người mắc Ung thư' }
                ].map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleChange(item.id as keyof ScreeningData, true)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${data[item.id as keyof ScreeningData] ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                      >Có</button>
                      <button 
                        onClick={() => handleChange(item.id as keyof ScreeningData, false)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${!data[item.id as keyof ScreeningData] ? 'bg-slate-400 text-white' : 'bg-slate-100 text-slate-500'}`}
                      >Không</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border-l-4 border-amber-400">
                B. Yếu tố nguy cơ cá nhân
              </p>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'lowVeggie', label: 'Ăn thiếu lượng rau xanh, trái cây (dưới 400gam/ngày)' },
                  { id: 'highSalt', label: 'Ăn nhiều muối > 5 gam/ngày' },
                  { id: 'smoking', label: 'Hiện đang hút thuốc lá hoặc thuốc lào' },
                  { id: 'stress', label: 'Thường xuyên căng thẳng (stress)' },
                  { id: 'lowPhysicalActivity', label: 'Ít vận động thể lực (< 30 phút/ngày)' },
                  { id: 'highAlcohol', label: 'Uống nhiều rượu, bia ở mức nguy hại' },
                  ...(data.gender === 'Nữ' ? [{ id: 'gestationalDiabetes', label: 'Có tiền sử đái tháo đường thai kỳ' }] : [])
                ].map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleChange(item.id as keyof ScreeningData, true)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${data[item.id as keyof ScreeningData] ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                      >Có</button>
                      <button 
                        onClick={() => handleChange(item.id as keyof ScreeningData, false)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${!data[item.id as keyof ScreeningData] ? 'bg-slate-400 text-white' : 'bg-slate-100 text-slate-500'}`}
                      >Không</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Dấu hiệu nghi ngờ</h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                { id: 'signHTN', label: 'Dấu hiệu nghi ngờ mắc Tăng huyết áp (Huyết áp ≥ 140/90 mmHg)' },
                { id: 'signDiabetes', label: 'Dấu hiệu nghi ngờ mắc Đái tháo đường (Tiểu nhiều, khát nước nhiều, sút cân...)' },
                { id: 'signCancer', label: 'Dấu hiệu nghi ngờ mắc một số bệnh ung thư thường gặp', subLabel: 'Vết loét lâu lành, ho dai dẳng, khó nuốt, thay đổi thói quen bài tiết, khối u ở vú/hạch, chảy máu/dịch bất thường, ù tai, nhìn đôi, gầy sút cân không rõ nguyên nhân...' }
              ].map(item => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors gap-4">
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-slate-700">{item.label}</span>
                    {item.subLabel && <p className="text-xs text-slate-400 italic">{item.subLabel}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={() => handleChange(item.id as keyof ScreeningData, true)}
                      className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${data[item.id as keyof ScreeningData] ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                    >Có</button>
                    <button 
                      onClick={() => handleChange(item.id as keyof ScreeningData, false)}
                      className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${!data[item.id as keyof ScreeningData] ? 'bg-slate-400 text-white' : 'bg-slate-100 text-slate-500'}`}
                    >Không</button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );
      case 5:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <Wind size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Tầm soát Bệnh phổi (COPD & Hen)</h3>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-bold text-slate-700 bg-indigo-50 p-3 rounded-xl border-l-4 border-indigo-400">
                Bộ câu hỏi tầm soát BPTNMT (COPD) - Theo GOLD
              </p>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'copd_q1', label: 'Ho vài lần trong ngày ở hầu hết các ngày' },
                  { id: 'copd_q2', label: 'Khạc đờm ở hầu hết các ngày' },
                  { id: 'copd_q3', label: 'Dễ bị khó thở hơn những người cùng tuổi' },
                  { id: 'copd_q5', label: 'Vẫn còn hút thuốc lá hoặc đã từng hút thuốc lá' }
                ].map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-slate-50 rounded-xl">
                    <span className="text-xs font-medium text-slate-600">{item.label}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleChange(item.id as keyof ScreeningData, true)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${data[item.id as keyof ScreeningData] ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                      >Có</button>
                      <button 
                        onClick={() => handleChange(item.id as keyof ScreeningData, false)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${!data[item.id as keyof ScreeningData] ? 'bg-slate-400 text-white' : 'bg-slate-100 text-slate-500'}`}
                      >Không</button>
                    </div>
                  </div>
                ))}
                <div className="p-3 bg-indigo-50/50 rounded-xl flex justify-between items-center">
                  <span className="text-xs font-bold text-indigo-700">Trên 40 tuổi</span>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-bold ${age >= 40 ? 'bg-green-500 text-white' : 'bg-slate-300 text-white'}`}>
                    {age >= 40 ? 'Có' : 'Không'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-bold text-slate-700 bg-indigo-50 p-3 rounded-xl border-l-4 border-indigo-400">
                Bộ câu hỏi tầm soát HEN - Theo IPCRG
              </p>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'asthma_q1', label: 'Bị khò khè trong lồng ngực bất cứ lúc nào trong 12 tháng qua?' },
                  { id: 'asthma_q2', label: 'Thức giấc giữa đêm vì cơn khó thở bất cứ lúc nào trong 12 tháng qua?' },
                  { id: 'asthma_q3', label: 'Thức giấc giữa đêm vì cơn ho bất kỳ lúc nào trong 12 tháng qua?' },
                  { id: 'asthma_q4', label: 'Thức giấc vì cảm giác nặng ngực bất kỳ lúc nào trong 12 tháng qua?' },
                  { id: 'asthma_q5', label: 'Bị khó thở sau hoạt động gắng sức không?' },
                  { id: 'asthma_q6', label: 'Bị khó thở cả ngày khi mà ông/bà nghi ngơi không?' },
                  { id: 'asthma_q7', label: 'Các triệu chứng trên có ít đi hay biến mất trong những ngày nghỉ làm việc hay trong kỳ nghỉ?' }
                ].map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-slate-50 rounded-xl">
                    <span className="text-xs font-medium text-slate-600">{item.label}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleChange(item.id as keyof ScreeningData, true)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${data[item.id as keyof ScreeningData] ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                      >Có</button>
                      <button 
                        onClick={() => handleChange(item.id as keyof ScreeningData, false)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${!data[item.id as keyof ScreeningData] ? 'bg-slate-400 text-white' : 'bg-slate-100 text-slate-500'}`}
                      >Không</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  if (showResult) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
      >
        <div className="bg-blue-600 p-8 text-white text-center">
          <CheckCircle2 size={64} className="mx-auto mb-4" />
          <h2 className="text-3xl font-black tracking-tight">KẾT QUẢ SÀNG LỌC ONLINE</h2>
          <p className="text-blue-100 mt-2 font-medium">Hệ thống đánh giá nguy cơ sức khỏe Bmass</p>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <Heart className="text-red-500" size={20} />
                Nguy cơ Đái tháo đường
              </h4>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-slate-900">{diabetesRiskScore}</span>
                <span className="text-slate-400 font-bold mb-1">/ 17 điểm</span>
              </div>
              <div className={`p-4 rounded-xl font-bold text-sm ${diabetesRiskScore >= 6 ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                {diabetesRiskScore >= 6 
                  ? 'KẾT LUẬN: Cần xét nghiệm đường huyết mao mạch ngay để tầm soát bệnh.' 
                  : 'KẾT LUẬN: Nguy cơ thấp. Hãy duy trì lối sống lành mạnh.'}
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <Stethoscope className="text-blue-500" size={20} />
                Tăng huyết áp
              </h4>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Huyết áp đo được: <span className="font-bold text-slate-900">{data.sbp1 || '0'}/{data.dbp1 || '0'} mmHg</span></p>
                <div className={`p-4 rounded-xl font-bold text-sm ${parseFloat(data.sbp1) >= 140 || parseFloat(data.dbp1) >= 90 ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                  {parseFloat(data.sbp1) >= 140 || parseFloat(data.dbp1) >= 90
                    ? 'KẾT LUẬN: Nghi ngờ Tăng huyết áp. Cần đến cơ sở y tế để khám xác định.'
                    : 'KẾT LUẬN: Chỉ số huyết áp trong ngưỡng bình thường.'}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <Wind className="text-indigo-500" size={20} />
                Bệnh phổi (COPD & Hen)
              </h4>
              <div className="space-y-4">
                <div className={`p-4 rounded-xl font-bold text-sm ${copdCount >= 3 ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                  COPD: {copdCount}/5 câu trả lời "Có".
                  {copdCount >= 3 
                    ? <p className="mt-1 text-xs">KẾT LUẬN: Nghi ngờ mắc BPTNMT. Cần đi khám để đo chức năng hô hấp.</p>
                    : <p className="mt-1 text-xs">KẾT LUẬN: Ít khả năng mắc BPTNMT.</p>}
                </div>
                <div className={`p-4 rounded-xl font-bold text-sm ${asthmaCount >= 2 ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                  HEN: {asthmaCount}/7 câu trả lời "Có".
                  {asthmaCount >= 2 
                    ? <p className="mt-1 text-xs">KẾT LUẬN: Nghi ngờ mắc Hen phế quản. Cần đi khám để chẩn đoán và điều trị.</p>
                    : <p className="mt-1 text-xs">KẾT LUẬN: Ít khả năng mắc Hen phế quản.</p>}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-900 rounded-2xl text-white space-y-4">
              <h4 className="font-bold flex items-center gap-2">
                <Info className="text-blue-400" size={20} />
                Lời khuyên sức khỏe
              </h4>
              <ul className="text-xs space-y-2 text-slate-300 list-disc pl-4">
                <li>Duy trì cân nặng hợp lý (BMI từ 18.5 - 22.9).</li>
                <li>Hạn chế ăn mặn (dưới 5g muối/ngày).</li>
                <li>Tăng cường rau xanh và trái cây.</li>
                <li>Vận động thể lực ít nhất 30 phút mỗi ngày.</li>
                <li>Không hút thuốc lá và hạn chế rượu bia.</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 no-print">
            <button 
              onClick={() => window.print()}
              className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-100 hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              <Download size={20} />
              IN KẾT QUẢ
            </button>
            <button 
              onClick={() => {
                setData(initialData);
                setStep(1);
                setShowResult(false);
              }}
              className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              <RefreshCcw size={20} />
              THỰC HIỆN LẠI
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Progress Bar */}
        <div className="h-2 bg-slate-100">
          <motion.div 
            className="h-full bg-blue-600"
            initial={{ width: '0%' }}
            animate={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">PHIẾU SÀNG LỌC ONLINE</h2>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Bước {step} / 5</p>
            </div>
            <div className="hidden sm:flex gap-2">
              {[1, 2, 3, 4, 5].map(s => (
                <div 
                  key={s} 
                  className={`w-3 h-3 rounded-full ${step >= s ? 'bg-blue-600' : 'bg-slate-200'}`}
                />
              ))}
            </div>
          </div>

          <div className="min-h-[400px]">
            {renderStep()}
          </div>

          <div className="flex justify-between mt-12 pt-8 border-t border-slate-50">
            <button 
              onClick={prevStep}
              disabled={step === 1}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-all"
            >
              <ChevronLeft size={20} />
              Quay lại
            </button>
            
            {step < 5 ? (
              <button 
                onClick={nextStep}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
              >
                Tiếp tục
                <ChevronRight size={20} />
              </button>
            ) : (
              <button 
                onClick={submitScreening}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ClipboardCheck size={20} />
                )}
                XEM KẾT QUẢ
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-xs text-slate-400 font-medium max-w-lg mx-auto leading-relaxed">
          * Lưu ý: Kết quả sàng lọc này chỉ mang tính chất tham khảo và đánh giá nguy cơ. 
          Không thay thế cho việc khám bệnh và chẩn đoán của bác sĩ chuyên khoa.
        </p>
      </div>
    </div>
  );
}
