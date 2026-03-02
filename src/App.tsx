/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Activity, Baby, Ruler, Scale, User, Calculator, Calendar, AlertTriangle, CheckSquare } from 'lucide-react';
import {
  boysHeightL, boysHeightM, boysHeightS, girlsHeightL, girlsHeightM, girlsHeightS,
  boysWeightL, boysWeightM, boysWeightS, girlsWeightL, girlsWeightM, girlsWeightS,
  boysBMIL, boysBMIM, boysBMIS, girlsBMIL, girlsBMIM, girlsBMIS,
  boysHCL, boysHCM, boysHCS, girlsHCL, girlsHCM, girlsHCS,
  interpolateLMS, calculateZScoreLMS, zScoreToPercentile,
  evaluateHeightZScore, evaluateWeightZScore, evaluateBMIZScore, evaluateHCZScore
} from './utils/whoData';
import GrowthCharts from './components/GrowthCharts';

export default function App() {
  const [gender, setGender] = useState<'boy' | 'girl'>('boy');
  const [ageMode, setAgeMode] = useState<'manual' | 'date'>('date');
  const [dobD, setDobD] = useState<string>('');
  const [dobM, setDobM] = useState<string>('');
  const [dobY, setDobY] = useState<string>('');
  
  const today = new Date();
  const [doeD, setDoeD] = useState<string>(today.getDate().toString());
  const [doeM, setDoeM] = useState<string>((today.getMonth() + 1).toString().padStart(2, '0'));
  const [doeY, setDoeY] = useState<string>(today.getFullYear().toString());
  const [years, setYears] = useState<number>(0);
  const [months, setMonths] = useState<number>(0);
  const [height, setHeight] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  const [headCircumference, setHeadCircumference] = useState<number | ''>('');
  const [fatherHeight, setFatherHeight] = useState<number | ''>('');
  const [motherHeight, setMotherHeight] = useState<number | ''>('');
  const [dateError, setDateError] = useState<string>('');
  const [measurementError, setMeasurementError] = useState<string>('');

  const dobDRef = useRef<HTMLInputElement>(null);
  const dobMRef = useRef<HTMLInputElement>(null);
  const dobYRef = useRef<HTMLInputElement>(null);
  const doeDRef = useRef<HTMLInputElement>(null);
  const doeMRef = useRef<HTMLInputElement>(null);
  const doeYRef = useRef<HTMLInputElement>(null);

  const handleDateChange = (
    val: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
    maxLength: number,
    nextRef: React.RefObject<HTMLInputElement | null> | null
  ) => {
    const cleanVal = val.replace(/\D/g, '').slice(0, maxLength);
    setter(cleanVal);
    if (cleanVal.length === maxLength && nextRef?.current) {
      nextRef.current.focus();
    }
  };
  const [clinicalSigns, setClinicalSigns] = useState({
    buouCo: false,
    gaiDen: false,
    beoPhi: false,
    sutCan: false,
    uongNhieu: false,
    vuPhiDai: false,
    dayThiNam: false,
    roiLoanXN: false,
    diHinh: false,
    chamDayThi: false,
    supMi: false,
    tienSuGiaDinh: false,
    kinhNguyetNu: false,
    khac: false
  });

  useEffect(() => {
    if (ageMode === 'date') {
      setDateError('');
      if (dobD && dobM && dobY && doeD && doeM && doeY) {
        const dD = parseInt(dobD);
        const dM = parseInt(dobM);
        const dY = parseInt(dobY);
        
        const eD = parseInt(doeD);
        const eM = parseInt(doeM);
        const eY = parseInt(doeY);

        const isValidDate = (d: number, m: number, y: number) => {
          if (m < 1 || m > 12 || d < 1 || d > 31) return false;
          const date = new Date(y, m - 1, d);
          return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
        };

        if (!isValidDate(dD, dM, dY)) {
          setDateError('Ngày sinh không hợp lệ');
          return;
        }
        if (!isValidDate(eD, eM, eY)) {
          setDateError('Ngày khám không hợp lệ');
          return;
        }

        const d1 = new Date(dY, dM - 1, dD);
        const d2 = new Date(eY, eM - 1, eD);
        
        if (d2 < d1) {
          setDateError('Ngày khám phải sau ngày sinh');
          return;
        }

        let y = d2.getFullYear() - d1.getFullYear();
        let m = d2.getMonth() - d1.getMonth();
        let d = d2.getDate() - d1.getDate();
        if (d < 0) {
          m -= 1;
        }
        if (m < 0) {
          y -= 1;
          m += 12;
        }
        
        const calcYears = Math.max(0, y);
        const calcMonths = Math.max(0, m);

        if (calcYears < 1 || calcYears > 19) {
          setDateError('Tuổi ngoài khoảng 1 đến 19 tuổi');
        }

        setYears(calcYears);
        setMonths(calcMonths);
      }
    }
  }, [dobD, dobM, dobY, doeD, doeM, doeY, ageMode]);

  useEffect(() => {
    if (height !== '' && (height < 50 || height > 200)) {
      setMeasurementError('Chiều cao phải từ 50cm đến 200cm');
    } else if (weight !== '' && (weight < 3 || weight > 200)) {
      setMeasurementError('Cân nặng phải từ 3kg đến 200kg');
    } else if (headCircumference !== '' && (headCircumference < 30 || headCircumference > 80)) {
      setMeasurementError('Vòng đầu phải từ 30cm đến 80cm');
    } else {
      setMeasurementError('');
    }
  }, [height, weight, headCircumference]);

  const ageInMonths = years * 12 + months;

  const calculateResults = () => {
    if (ageInMonths < 0 || ageInMonths > 228) return null; // WHO data up to 19 years
    if (!height || !weight) return null;
    if (measurementError) return null;

    const isBoy = gender === 'boy';

    // Height Z-Score
    const heightLArray = isBoy ? boysHeightL : girlsHeightL;
    const heightMArray = isBoy ? boysHeightM : girlsHeightM;
    const heightSArray = isBoy ? boysHeightS : girlsHeightS;
    const { l: hL, m: hM, s: hS } = interpolateLMS(ageInMonths, heightLArray, heightMArray, heightSArray);
    const heightZ = calculateZScoreLMS(Number(height), hL, hM, hS);

    // Weight Z-Score (only up to 10 years / 120 months)
    let weightZ: number | null = null;
    if (ageInMonths <= 120) {
      const weightLArray = isBoy ? boysWeightL : girlsWeightL;
      const weightMArray = isBoy ? boysWeightM : girlsWeightM;
      const weightSArray = isBoy ? boysWeightS : girlsWeightS;
      const { l: wL, m: wM, s: wS } = interpolateLMS(ageInMonths, weightLArray, weightMArray, weightSArray);
      weightZ = calculateZScoreLMS(Number(weight), wL, wM, wS);
    }

    // BMI Z-Score
    const heightInMeters = Number(height) / 100;
    const bmi = Number(weight) / (heightInMeters * heightInMeters);
    const bmiLArray = isBoy ? boysBMIL : girlsBMIL;
    const bmiMArray = isBoy ? boysBMIM : girlsBMIM;
    const bmiSArray = isBoy ? boysBMIS : girlsBMIS;
    const { l: bmiL, m: bmiM, s: bmiS } = interpolateLMS(ageInMonths, bmiLArray, bmiMArray, bmiSArray);
    const bmiZ = calculateZScoreLMS(bmi, bmiL, bmiM, bmiS);

    // Head Circumference Z-Score (only up to 5 years / 60 months)
    let hcZ: number | null = null;
    if (ageInMonths <= 60 && headCircumference) {
      const hcLArray = isBoy ? boysHCL : girlsHCL;
      const hcMArray = isBoy ? boysHCM : girlsHCM;
      const hcSArray = isBoy ? boysHCS : girlsHCS;
      const { l: hcl, m: hcm, s: hcs } = interpolateLMS(ageInMonths, hcLArray, hcMArray, hcSArray);
      hcZ = calculateZScoreLMS(Number(headCircumference), hcl, hcm, hcs);
    }

    // MPH (Mid-Parental Height)
    let mph: number | null = null;
    let mphZ: number | null = null;
    if (fatherHeight && motherHeight) {
      const fH = Number(fatherHeight);
      const mH = Number(motherHeight);
      mph = isBoy ? (fH + mH + 13) / 2 : (fH + mH - 13) / 2;
      
      // Calculate Z-Score for target adult height (at 19 years = 228 months)
      const adultL = isBoy ? boysHeightL[228] : girlsHeightL[228];
      const adultM = isBoy ? boysHeightM[228] : girlsHeightM[228];
      const adultS = isBoy ? boysHeightS[228] : girlsHeightS[228];
      mphZ = calculateZScoreLMS(mph, adultL, adultM, adultS);
    }

    return {
      heightZ,
      weightZ,
      bmi,
      bmiZ,
      hcZ,
      mph,
      mphZ
    };
  };

  const results = calculateResults();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-[#000080]" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
            TAH EndoScreen 2.0
          </h1>
          <p className="text-slate-600 max-w-xl mx-auto font-medium">
            Công cụ hỗ trợ bác sĩ phòng khám sàng lọc về nội tiết - tăng trưởng trẻ em
          </p>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            &copy; Đỗ Tiến Sơn 2026
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Input Form */}
          <div className="md:col-span-5 space-y-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center space-x-2 pb-4 border-b border-slate-100">
              <Baby className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-medium">Thông tin của bé</h2>
            </div>

            {/* Gender */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Giới tính</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setGender('boy')}
                  className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${
                    gender === 'boy' 
                      ? 'bg-blue-500 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Bé Trai
                </button>
                <button
                  onClick={() => setGender('girl')}
                  className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${
                    gender === 'girl' 
                      ? 'bg-pink-500 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Bé Gái
                </button>
              </div>
            </div>

            {/* Age */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">Tuổi của bé</label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setAgeMode('date')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${ageMode === 'date' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    Ngày sinh
                  </button>
                  <button
                    onClick={() => setAgeMode('manual')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${ageMode === 'manual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    Nhập tay
                  </button>
                </div>
              </div>

              {ageMode === 'date' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Ngày sinh (DD / MM / YYYY)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        ref={dobDRef}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="DD"
                        value={dobD}
                        onChange={(e) => handleDateChange(e.target.value, setDobD, 2, dobMRef)}
                        className="w-full text-center py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                      />
                      <input
                        ref={dobMRef}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="MM"
                        value={dobM}
                        onChange={(e) => handleDateChange(e.target.value, setDobM, 2, dobYRef)}
                        className="w-full text-center py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                      />
                      <input
                        ref={dobYRef}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="YYYY"
                        value={dobY}
                        onChange={(e) => handleDateChange(e.target.value, setDobY, 4, doeDRef)}
                        className="w-full text-center py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Ngày khám (DD / MM / YYYY)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        ref={doeDRef}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="DD"
                        value={doeD}
                        onChange={(e) => handleDateChange(e.target.value, setDoeD, 2, doeMRef)}
                        className="w-full text-center py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                      />
                      <input
                        ref={doeMRef}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="MM"
                        value={doeM}
                        onChange={(e) => handleDateChange(e.target.value, setDoeM, 2, doeYRef)}
                        className="w-full text-center py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                      />
                      <input
                        ref={doeYRef}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="YYYY"
                        value={doeY}
                        onChange={(e) => handleDateChange(e.target.value, setDoeY, 4, null)}
                        className="w-full text-center py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>
                  {dateError ? (
                    <div className="bg-red-50 text-red-600 text-sm py-2 px-3 rounded-lg border border-red-100">
                      {dateError}
                    </div>
                  ) : (
                    <div className="bg-indigo-50 text-indigo-700 text-sm py-2 px-3 rounded-lg flex justify-between items-center border border-indigo-100">
                      <span>Tuổi tính được:</span>
                      <span className="font-semibold">{years} năm {months} tháng</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="decimal"
                      pattern="[0-9]*"
                      min="0"
                      max="19"
                      value={years}
                      onChange={(e) => setYears(Number(e.target.value))}
                      className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">năm</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="decimal"
                      pattern="[0-9]*"
                      min="0"
                      max="11"
                      value={months}
                      onChange={(e) => setMonths(Number(e.target.value))}
                      className="w-full pl-4 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">tháng</span>
                  </div>
                </div>
              )}
            </div>

            {/* Measurements */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Chiều cao hiện tại</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Ruler className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    value={height}
                    onChange={(e) => setHeight(e.target.value ? Number(e.target.value) : '')}
                    className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Ví dụ: 110"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">cm</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Cân nặng hiện tại</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Scale className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : '')}
                    className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Ví dụ: 18.5"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">kg</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Vòng đầu hiện tại (Tùy chọn)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Activity className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    value={headCircumference}
                    onChange={(e) => setHeadCircumference(e.target.value ? Number(e.target.value) : '')}
                    className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Ví dụ: 45"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">cm</span>
                </div>
              </div>
              
              {measurementError && (
                <div className="bg-red-50 text-red-600 text-sm py-2 px-3 rounded-lg border border-red-100">
                  {measurementError}
                </div>
              )}
            </div>

            {/* Parents */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex items-center space-x-2 mb-2">
                <User className="w-5 h-5 text-slate-400" />
                <h2 className="text-sm font-medium text-slate-700">Di truyền (Tùy chọn)</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Chiều cao Bố</label>
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="decimal"
                      pattern="[0-9]*"
                      value={fatherHeight}
                      onChange={(e) => setFatherHeight(e.target.value ? Number(e.target.value) : '')}
                      className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      placeholder="170"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">cm</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Chiều cao Mẹ</label>
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="decimal"
                      pattern="[0-9]*"
                      value={motherHeight}
                      onChange={(e) => setMotherHeight(e.target.value ? Number(e.target.value) : '')}
                      className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      placeholder="158"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">cm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Clinical Signs */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center space-x-2 mb-2">
                <CheckSquare className="w-5 h-5 text-slate-400" />
                <h2 className="text-sm font-medium text-slate-700">Dấu hiệu lâm sàng (Tùy chọn)</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'buouCo', label: 'Bướu cổ' },
                  { id: 'gaiDen', label: 'Gai đen' },
                  { id: 'beoPhi', label: 'Béo phì' },
                  { id: 'sutCan', label: 'Sụt cân bất thường' },
                  { id: 'uongNhieu', label: 'Uống nhiều, tiểu nhiều' },
                  { id: 'vuPhiDai', label: 'Vú phì đại trước 8 tuổi (nữ)' },
                  { id: 'kinhNguyetNu', label: 'Kinh nguyệt trước 9 tuổi (nữ)' },
                  { id: 'dayThiNam', label: 'Dấu hiệu dậy thì trước 9 tuổi (nam)' },
                  { id: 'chamDayThi', label: 'Chậm dậy thì' },
                  { id: 'supMi', label: 'Sụp mi' },
                  { id: 'tienSuGiaDinh', label: 'Tiền sử gia đình bất thường' },
                  { id: 'roiLoanXN', label: 'Rối loạn trên xét nghiệm' },
                  { id: 'diHinh', label: 'Dị hình bất thường' },
                  { id: 'khac', label: 'Khác' },
                ].map((sign) => (
                  <label key={sign.id} className="flex items-start space-x-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={clinicalSigns[sign.id as keyof typeof clinicalSigns]}
                      onChange={(e) => setClinicalSigns({...clinicalSigns, [sign.id]: e.target.checked})}
                      className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900">{sign.label}</span>
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* Results Panel */}
          <div className="md:col-span-7 space-y-4">
            {!results ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-3xl border border-slate-200 border-dashed">
                <Calculator className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">Nhập chiều cao và cân nặng để xem kết quả</p>
                <p className="text-sm text-slate-400 mt-1">Dữ liệu áp dụng cho trẻ từ 0 đến 19 tuổi</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Warning Alert */}
                {(() => {
                  const hasExtremeZ = 
                    (results.heightZ > 1.5 || results.heightZ < -1.5) ||
                    (results.weightZ !== null && (results.weightZ > 1.5 || results.weightZ < -1.5)) ||
                    (results.bmiZ > 1.5 || results.bmiZ < -1.5);
                  
                  const hasClinicalSign = Object.values(clinicalSigns).some(val => val === true);

                  if (hasExtremeZ || hasClinicalSign) {
                    return (
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start space-x-3 shadow-sm">
                        <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <h3 className="text-red-800 font-semibold text-sm">CẢNH BÁO LÂM SÀNG</h3>
                          <p className="text-red-700 text-sm mt-1">
                            Hệ thống ghi nhận bất thường (phát hiện chỉ số nhân trắc bất thường hoặc có dấu hiệu lâm sàng nguy cơ).
                          </p>
                          <div className="mt-2 inline-block bg-red-100 text-red-800 text-sm font-medium px-3 py-1.5 rounded-lg border border-red-200">
                            Cần hội chẩn Nhóm lâm sàng về Nội tiết - Tăng trưởng - Di truyền Nhi khoa (ThS.BS. Đỗ Tiến Sơn hỗ trợ oncall và trực tiếp)
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Height Result */}
                <ResultCard 
                  title="Chiều cao theo tuổi" 
                  value={`${height} cm`}
                  zScore={results.heightZ}
                  percentile={zScoreToPercentile(results.heightZ)}
                  evaluation={evaluateHeightZScore(results.heightZ)}
                />

                {/* Weight Result */}
                {results.weightZ !== null ? (
                  <ResultCard 
                    title="Cân nặng theo tuổi" 
                    value={`${weight} kg`}
                    zScore={results.weightZ}
                    evaluation={evaluateWeightZScore(results.weightZ)}
                  />
                ) : (
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between opacity-75">
                    <div>
                      <h3 className="text-sm font-medium text-slate-500">Cân nặng theo tuổi</h3>
                      <p className="text-xs text-slate-400 mt-1">Chỉ áp dụng cho trẻ dưới 10 tuổi (WHO)</p>
                    </div>
                  </div>
                )}

                {/* BMI Result */}
                <ResultCard 
                  title="BMI theo tuổi" 
                  value={`${results.bmi.toFixed(1)}`}
                  zScore={results.bmiZ}
                  percentile={zScoreToPercentile(results.bmiZ)}
                  evaluation={evaluateBMIZScore(results.bmiZ, ageInMonths)}
                />

                {/* Head Circumference Result */}
                {results.hcZ !== null ? (
                  <ResultCard 
                    title="Vòng đầu theo tuổi" 
                    value={`${headCircumference} cm`}
                    zScore={results.hcZ}
                    percentile={zScoreToPercentile(results.hcZ)}
                    evaluation={evaluateHCZScore(results.hcZ)}
                  />
                ) : ageInMonths <= 60 && headCircumference === '' ? (
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between opacity-75">
                    <div>
                      <h3 className="text-sm font-medium text-slate-500">Vòng đầu theo tuổi</h3>
                      <p className="text-xs text-slate-400 mt-1">Chưa nhập dữ liệu vòng đầu</p>
                    </div>
                  </div>
                ) : ageInMonths > 60 ? (
                   <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between opacity-75">
                    <div>
                      <h3 className="text-sm font-medium text-slate-500">Vòng đầu theo tuổi</h3>
                      <p className="text-xs text-slate-400 mt-1">Chỉ áp dụng cho trẻ dưới 5 tuổi (WHO)</p>
                    </div>
                  </div>
                ) : null}

                {/* MPH Result */}
                {results.mph !== null && results.mphZ !== null && (
                  <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-sm font-medium text-indigo-900">Chiều cao dự kiến (Di truyền)</h3>
                        <p className="text-xs text-indigo-400 mt-0.5">Dựa trên chiều cao của bố mẹ</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-semibold text-indigo-700">{results.mph.toFixed(1)} ± 5 cm</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-indigo-100">
                      <div className="text-sm text-indigo-800">
                        Z-Score: <span className="font-mono font-medium">{results.mphZ > 0 ? '+' : ''}{results.mphZ.toFixed(2)}</span>
                      </div>
                      <div className="text-sm font-medium text-indigo-700">
                        {evaluateHeightZScore(results.mphZ).label}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Growth Charts */}
        {results && (
          <GrowthCharts 
            gender={gender}
            ageInMonths={ageInMonths}
            height={height}
            weight={weight}
            bmi={results.bmi}
            mph={results.mph}
            heightZ={results.heightZ}
            mphZ={results.mphZ}
            hc={headCircumference}
            hcZ={results.hcZ}
          />
        )}

        {/* References */}
        <div className="mt-12 pt-6 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Chú thích & Tài liệu tham khảo:</h3>
          <ul className="list-disc list-inside text-xs text-slate-500 space-y-2 mb-4">
            <li>Khoảng tham chiếu bình thường cho Chiều cao và Cân nặng được tính từ -1.5 SD đến +1.5 SD. Các trường hợp ngoài khoảng này cần được lưu ý và hội chẩn thêm.</li>
          </ul>
          <ol className="list-decimal list-inside text-xs text-slate-500 space-y-2">
            <li>World Health Organization. <em>WHO Child Growth Standards: Length/height-for-age, weight-for-age, weight-for-length, weight-for-height and body mass index-for-age: Methods and development</em>. Geneva, Switzerland: World Health Organization; 2006.</li>
            <li>de Onis M, Onyango AW, Borghi E, Siyam A, Nishida C, Siekmann J. Development of a WHO growth reference for school-aged children and adolescents. <em>Bull World Health Organ</em>. 2007;85(9):660-667. doi:10.2471/blt.07.043497</li>
          </ol>
        </div>

        {/* Footer */}
        <div className="pt-8 pb-4 text-center mt-4">
          <p className="text-sm text-slate-500 font-medium">
            ThS.BS. Đỗ Tiến Sơn phát triển năm 2026 - Đang giai đoạn thử nghiệm
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Thông báo lỗi, góp ý: <a href="mailto:bs.dotienson@gmail.com" className="text-indigo-500 hover:underline">bs.dotienson@gmail.com</a>
          </p>
        </div>

      </div>
    </div>
  );
}

function ResultCard({ title, value, zScore, percentile, evaluation }: { 
  title: string; 
  value: string; 
  zScore: number; 
  percentile?: number;
  evaluation: { label: string, color: string, bg: string, note?: string } 
}) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <div className="text-xl font-semibold text-slate-900">{value}</div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-500">Z-Score:</span>
            <span className={`font-mono font-medium ${zScore < -2 || zScore > 2 ? 'text-red-600' : 'text-slate-700'}`}>
              {zScore > 0 ? '+' : ''}{zScore.toFixed(2)}
            </span>
          </div>
          {percentile !== undefined && (
            <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
              <span className="text-sm text-slate-500">Percentile:</span>
              <span className="font-mono font-medium text-slate-700">
                {percentile.toFixed(1)}th
              </span>
            </div>
          )}
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${evaluation.bg} ${evaluation.color}`}>
          {evaluation.label}
        </div>
      </div>
      
      {/* Visual Indicator */}
      <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex relative">
        {/* -3 to +3 scale roughly maps to 0-100% */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300 z-10"></div>
        <div 
          className={`h-full rounded-full ${zScore < -2 || zScore > 2 ? 'bg-red-400' : 'bg-emerald-400'}`}
          style={{ 
            width: '4px',
            position: 'absolute',
            left: `calc(50% + ${Math.max(-50, Math.min(50, zScore * 16.66))}%)`,
            transform: 'translateX(-50%)'
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
        <span>-3</span>
        <span>-2</span>
        <span>0</span>
        <span>+2</span>
        <span>+3</span>
      </div>
      {evaluation.note && (
        <div className="mt-3 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
          {evaluation.note}
        </div>
      )}
    </div>
  );
}

