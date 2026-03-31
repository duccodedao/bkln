import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Download, AlertCircle, Trash2, FileOutput, Activity, Droplet, Settings, Calendar } from 'lucide-react';

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

export default function App() {
  const [inputData, setInputData] = useState<any[]>([]);
  const [outputDataTHA, setOutputDataTHA] = useState<any[]>([]);
  const [outputDataDTD, setOutputDataDTD] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'THA' | 'DTD'>('THA');
  
  // New states for features
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [genderFormat, setGenderFormat] = useState<'text' | 'number'>('text');
  const [bsMin, setBsMin] = useState<string>('');
  const [bsMax, setBsMax] = useState<string>('');
  const [showBsConfig, setShowBsConfig] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const transformData = (data: any[], currentGenderFormat: 'text' | 'number') => {
    const currentYear = new Date().getFullYear();
    const thaData: any[] = [];
    const dtdData: any[] = [];

    data.forEach(row => {
      let gender = '';
      let birthDate = '';
      
      if (row['NAM'] !== undefined && row['NAM'] !== '') {
        gender = currentGenderFormat === 'number' ? '01' : 'Nam';
        const age = parseInt(row['NAM'], 10);
        if (!isNaN(age)) {
          birthDate = `01/01/${currentYear - age}`;
        }
      } else if (row['NU'] !== undefined && row['NU'] !== '') {
        gender = currentGenderFormat === 'number' ? '02' : 'Nữ';
        const age = parseInt(row['NU'], 10);
        if (!isNaN(age)) {
          birthDate = `01/01/${currentYear - age}`;
        }
      }

      const diagnosis = row['CHAN_DOAN'] || '';
      const hasTHA = diagnosis.includes('I10');
      const hasDTD = diagnosis.includes('E11.9');

      const commonFields = {
        'Họ tên (*)': row['TEN_BENH_NHAN'] || '',
        'Giới tính (*)': gender,
        'Năm sinh (*)': birthDate,
        'Mã BHYT (*)': row['SO_THE_BHYT'] || '',
        'Số CMT/CCCD (*)': '',
        'Số điện thoại': '',
        'Địa chỉ': row['DIA_CHI'] || '',
        'Xã/Phường/Thị trấn (*)': '31831', // Auto-fill
        'Ngày phát hiện bệnh': '',
        'Nơi phát hiện': '',
        'Ngày khám (*)': row['NGAYRA'] || '',
        'Phân loại BN (*)': '',
        'HA tâm thu (*)': row['Huyết áp cao'] || '',
        'HA tâm trương (*)': row['Huyết áp thấp'] || '',
        'Cân nặng': row['Cân nặng'] || '',
        'Chiều cao': row['Chiều cao'] || '',
        'Vòng eo': '',
        'Hút thuốc lá': '',
        'Mức độ uống rượu bia': '',
        'Thực hành giảm ăn muối': '',
        'Hoạt động thể lực đủ theo khuyến nghị': '',
        'Chẩn đoán': diagnosis,
        'Thuốc điều trị': row['CHAN_DOAN_KKB'] || '',
        'Số ngày nhận thuốc': '',
        'Biến chứng': '',
        'Kết quả điều trị': '',
        'Ngày tái khám': ''
      };

      if (hasTHA) {
        thaData.push({
          ...commonFields,
          'Ăn đủ 400g rau và trái cây': '',
        });
      }

      if (hasDTD) {
        dtdData.push({
          ...commonFields,
          'Đường huyết (*)': '',
          'HbA1C': '',
          'Rối loạn lipid máu (*)': '',
          'Thực hành ăn uống hợp lý': '',
          'Theo dõi biến chứng bàn chân': '',
          'Biết xử lý hạ đường huyết': '',
        });
      }
    });

    return { thaData, dtdData };
  };

  const processFile = (file: File) => {
    setError('');
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          setError('File không có dữ liệu.');
          return;
        }

        setInputData(jsonData);
        const { thaData, dtdData } = transformData(jsonData, genderFormat);
        setOutputDataTHA(thaData);
        setOutputDataDTD(dtdData);
        
        if (thaData.length > 0) setActiveTab('THA');
        else if (dtdData.length > 0) setActiveTab('DTD');
        
      } catch (err) {
        setError('Lỗi khi đọc file. Vui lòng đảm bảo đây là file Excel hợp lệ (.xlsx, .xls, .csv).');
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
  };

  const handleApplyBloodSugar = () => {
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
      return new Date(Math.round((dateStr - 25569) * 86400 * 1000));
    }
    const str = String(dateStr).trim();
    const parts = str.split(/[ /:-]/);
    if (parts.length >= 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1900) {
        return new Date(year, month, day);
      }
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  };

  const getFilteredData = (data: any[]) => {
    if (!startDate || !endDate) return data;
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return data.filter(row => {
      const rowDate = parseDate(row['Ngày khám (*)']);
      if (!rowDate) return false;
      return rowDate >= start && rowDate <= end;
    });
  };

  const filteredTHA = getFilteredData(outputDataTHA);
  const filteredDTD = getFilteredData(outputDataDTD);

  const handleDownload = () => {
    if (!startDate || !endDate) {
      setError('Bắt buộc phải chọn "Từ ngày" và "Đến ngày" trước khi tải xuống.');
      return;
    }
    setError('');

    if (filteredTHA.length === 0 && filteredDTD.length === 0) {
      setError('Không có dữ liệu nào trong khoảng thời gian đã chọn.');
      return;
    }

    const originalName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;

    // Download THA
    if (filteredTHA.length > 0) {
      const wbTHA = XLSX.utils.book_new();
      const wsTHA = XLSX.utils.json_to_sheet(filteredTHA, { header: THA_COLUMNS });
      XLSX.utils.book_append_sheet(wbTHA, wsTHA, "Tăng Huyết Áp");
      XLSX.writeFile(wbTHA, `${originalName}_THA.xlsx`);
    }

    // Download DTD
    if (filteredDTD.length > 0) {
      const wbDTD = XLSX.utils.book_new();
      const wsDTD = XLSX.utils.json_to_sheet(filteredDTD, { header: DTD_COLUMNS });
      XLSX.utils.book_append_sheet(wbDTD, wsDTD, "Đái Tháo Đường");
      XLSX.writeFile(wbDTD, `${originalName}_DTD.xlsx`);
    }
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
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Chuyển Đổi Dữ Liệu Bệnh Nhân</h1>
          <p className="text-gray-500">Tự động phân loại Tăng Huyết Áp (I10) và Đái Tháo Đường (E11.9).</p>
        </div>

        {/* Upload Area */}
        {!outputDataTHA.length && !outputDataDTD.length && (
          <div 
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer
              ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-white'}`}
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
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-blue-100 rounded-full text-blue-600">
                <Upload size={32} />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-700">Kéo thả file vào đây hoặc click để chọn file</p>
                <p className="text-sm text-gray-500 mt-1">Hỗ trợ .xlsx, .xls, .csv</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-3">
            <AlertCircle size={20} className="flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Results Area */}
        {(outputDataTHA.length > 0 || outputDataDTD.length > 0) && (
          <div className="space-y-6">
            
            {/* Settings & Filters Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings size={20} className="mr-2 text-gray-500" />
                Cài đặt & Bộ lọc
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Date Filter */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <Calendar size={16} className="mr-1.5" />
                    Lọc theo Ngày khám (*)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="date" 
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                      value={startDate} 
                      onChange={e => setStartDate(e.target.value)} 
                    />
                    <span className="text-gray-500">-</span>
                    <input 
                      type="date" 
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                      value={endDate} 
                      onChange={e => setEndDate(e.target.value)} 
                    />
                  </div>
                </div>

                {/* Gender Format */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Định dạng Giới tính</label>
                  <div className="flex items-center space-x-4 mt-2 h-10">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="genderFormat" 
                        value="text" 
                        checked={genderFormat === 'text'} 
                        onChange={() => handleGenderFormatChange('text')} 
                        className="text-blue-600 focus:ring-blue-500" 
                      />
                      <span className="text-sm text-gray-700">Nam / Nữ</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="genderFormat" 
                        value="number" 
                        checked={genderFormat === 'number'} 
                        onChange={() => handleGenderFormatChange('number')} 
                        className="text-blue-600 focus:ring-blue-500" 
                      />
                      <span className="text-sm text-gray-700">01 / 02</span>
                    </label>
                  </div>
                </div>

                {/* Auto-fill Blood Sugar */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Đường huyết (Đái tháo đường)</label>
                  {!showBsConfig ? (
                    <button 
                      onClick={() => setShowBsConfig(true)} 
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors w-full h-10"
                    >
                      Điền tự động Đường huyết
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2 h-10">
                      <input 
                        type="number" 
                        placeholder="Min" 
                        className="border border-gray-300 rounded-lg px-2 py-2 text-sm w-full focus:ring-2 focus:ring-indigo-500 outline-none" 
                        value={bsMin} 
                        onChange={e => setBsMin(e.target.value)} 
                      />
                      <span className="text-gray-500">-</span>
                      <input 
                        type="number" 
                        placeholder="Max" 
                        className="border border-gray-300 rounded-lg px-2 py-2 text-sm w-full focus:ring-2 focus:ring-indigo-500 outline-none" 
                        value={bsMax} 
                        onChange={e => setBsMax(e.target.value)} 
                      />
                      <button 
                        onClick={handleApplyBloodSugar} 
                        className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                      >
                        Áp dụng
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                    <FileSpreadsheet size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{fileName}</h3>
                    <p className="text-sm text-gray-500">
                      Tổng cộng: {inputData.length} dòng | THA: {filteredTHA.length} | ĐTĐ: {filteredDTD.length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={handleReset}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                  >
                    <Trash2 size={18} />
                    <span>Tải file khác</span>
                  </button>
                  <button 
                    onClick={handleDownload}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm"
                  >
                    <Download size={18} />
                    <span>Tải xuống Excel</span>
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 border-b border-gray-200 mb-6">
                <button
                  onClick={() => setActiveTab('THA')}
                  className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'THA' 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Activity size={18} />
                  <span>Tăng Huyết Áp ({filteredTHA.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('DTD')}
                  className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'DTD' 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Droplet size={18} />
                  <span>Đái Tháo Đường ({filteredDTD.length})</span>
                </button>
              </div>

              {/* Preview Table */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <FileOutput size={16} className="mr-2" />
                  Xem trước dữ liệu (5 dòng đầu)
                </h4>
                {currentData.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {currentColumns.map((col, i) => (
                            <th key={i} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentData.slice(0, 5).map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-gray-50">
                            {currentColumns.map((col, colIndex) => (
                              <td key={colIndex} className="px-4 py-2 whitespace-nowrap text-gray-700">
                                {row[col] || <span className="text-gray-300 italic">Trống</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                    <p className="text-gray-500">Không có dữ liệu phù hợp với phân loại này.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
