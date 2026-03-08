/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Activity, Baby, Ruler, Scale, User, Calculator, Calendar, AlertTriangle, CheckSquare, ChevronDown } from 'lucide-react';
import {
  boysHeightL, boysHeightM, boysHeightS, girlsHeightL, girlsHeightM, girlsHeightS,
  boysWeightL, boysWeightM, boysWeightS, girlsWeightL, girlsWeightM, girlsWeightS,
  boysBMIL, boysBMIM, boysBMIS, girlsBMIL, girlsBMIM, girlsBMIS,
  boysHCL, boysHCM, boysHCS, girlsHCL, girlsHCM, girlsHCS,
  interpolateLMS, calculateZScoreLMS, zScoreToPercentile,
  evaluateHeightZScore, evaluateWeightZScore, evaluateBMIZScore, evaluateHCZScore
} from './utils/whoData';
import GrowthCharts from './components/GrowthCharts';

const getAverageGrowthVelocity = (ageInMonths: number, gender: 'boy' | 'girl') => {
  if (ageInMonths < 6) return '16-17 cm';
  if (ageInMonths < 12) return '8 cm';
  if (ageInMonths < 24) return '10 cm (khoảng 10-14 cm)';
  if (ageInMonths < 36) return '8 cm';
  if (ageInMonths < 48) return '7 cm';
  if (ageInMonths < 120) return '5-6 cm';
  
  if (gender === 'girl') {
    if (ageInMonths < 132) return '5.5 cm'; // 10 years old
    return '8-12 cm'; // Puberty
  } else {
    if (ageInMonths < 144) return '5-6 cm'; // 10-11 years
    if (ageInMonths < 156) return '4.9 cm'; // 12 years old
    return '10-14 cm'; // Puberty
  }
};

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [username, setUsername] = useState('');
  const [passcode, setPasscode] = useState('');
  const [unlockError, setUnlockError] = useState('');

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
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [headCircumference, setHeadCircumference] = useState<string>('');
  const [prevHeight, setPrevHeight] = useState<string>('');
  const [prevMonths, setPrevMonths] = useState<string>('');
  const [fatherHeight, setFatherHeight] = useState<string>('');
  const [motherHeight, setMotherHeight] = useState<string>('');
  const [dateError, setDateError] = useState<string>('');
  const [measurementError, setMeasurementError] = useState<string>('');
  const [showReferences, setShowReferences] = useState(false);

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
    ngungCao: false,
    caoBatThuong: false,
    tieuNhieu: false,
    veCushing: false,
    ramLong: false,
    caoHuyetAp: false,
    khac: false
  });

  const parseInput = (val: string | number): number | null => {
    if (val === '' || val === null || val === undefined) return null;
    const parsed = parseFloat(String(val).replace(',', '.'));
    return isNaN(parsed) ? null : parsed;
  };

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

        if (calcYears < 0 || calcYears > 19) {
          setDateError('Tuổi ngoài khoảng 0 đến 19 tuổi');
        }

        setYears(calcYears);
        setMonths(calcMonths);
      }
    }
  }, [dobD, dobM, dobY, doeD, doeM, doeY, ageMode]);

  useEffect(() => {
    const h = parseInput(height);
    const w = parseInput(weight);
    const hc = parseInput(headCircumference);
    const ph = parseInput(prevHeight);

    if (h !== null && (h < 30 || h > 200)) {
      setMeasurementError('Chiều cao phải từ 30cm đến 200cm');
    } else if (w !== null && (w < 1 || w > 200)) {
      setMeasurementError('Cân nặng phải từ 1kg đến 200kg');
    } else if (hc !== null && (hc < 30 || hc > 80)) {
      setMeasurementError('Vòng đầu phải từ 30cm đến 80cm');
    } else if (ph !== null && (ph < 30 || ph > 200)) {
      setMeasurementError('Chiều cao lần trước phải từ 30cm đến 200cm');
    } else if (h !== null && ph !== null && ph > h) {
      setMeasurementError('Chiều cao lần trước không thể lớn hơn chiều cao hiện tại');
    } else {
      setMeasurementError('');
    }
  }, [height, weight, headCircumference, prevHeight]);

  const ageInMonths = years * 12 + months;

  const calculateResults = () => {
    if (ageInMonths < 0 || ageInMonths > 228) return null; // WHO data up to 19 years
    
    const h = parseInput(height);
    const w = parseInput(weight);
    
    if (h === null || w === null) return null;
    if (measurementError) return null;

    const isBoy = gender === 'boy';

    // Height Z-Score
    const heightLArray = isBoy ? boysHeightL : girlsHeightL;
    const heightMArray = isBoy ? boysHeightM : girlsHeightM;
    const heightSArray = isBoy ? boysHeightS : girlsHeightS;
    const { l: hL, m: hM, s: hS } = interpolateLMS(ageInMonths, heightLArray, heightMArray, heightSArray);
    const heightZ = calculateZScoreLMS(h, hL, hM, hS);

    // Weight Z-Score (only up to 10 years / 120 months)
    let weightZ: number | null = null;
    if (ageInMonths <= 120) {
      const weightLArray = isBoy ? boysWeightL : girlsWeightL;
      const weightMArray = isBoy ? boysWeightM : girlsWeightM;
      const weightSArray = isBoy ? boysWeightS : girlsWeightS;
      const { l: wL, m: wM, s: wS } = interpolateLMS(ageInMonths, weightLArray, weightMArray, weightSArray);
      weightZ = calculateZScoreLMS(w, wL, wM, wS);
    }

    // BMI Z-Score
    const heightInMeters = h / 100;
    const bmi = w / (heightInMeters * heightInMeters);
    const bmiLArray = isBoy ? boysBMIL : girlsBMIL;
    const bmiMArray = isBoy ? boysBMIM : girlsBMIM;
    const bmiSArray = isBoy ? boysBMIS : girlsBMIS;
    const { l: bmiL, m: bmiM, s: bmiS } = interpolateLMS(ageInMonths, bmiLArray, bmiMArray, bmiSArray);
    const bmiZ = calculateZScoreLMS(bmi, bmiL, bmiM, bmiS);

    // Head Circumference Z-Score (only up to 5 years / 60 months)
    let hcZ: number | null = null;
    const hc = parseInput(headCircumference);
    if (ageInMonths <= 60 && hc !== null) {
      const hcLArray = isBoy ? boysHCL : girlsHCL;
      const hcMArray = isBoy ? boysHCM : girlsHCM;
      const hcSArray = isBoy ? boysHCS : girlsHCS;
      const { l: hcl, m: hcm, s: hcs } = interpolateLMS(ageInMonths, hcLArray, hcMArray, hcSArray);
      hcZ = calculateZScoreLMS(hc, hcl, hcm, hcs);
    }

    // MPH (Mid-Parental Height)
    let mph: number | null = null;
    let mphZ: number | null = null;
    const fH = parseInput(fatherHeight);
    const mH = parseInput(motherHeight);
    if (fH !== null && mH !== null) {
      mph = isBoy ? (fH + mH + 13) / 2 : (fH + mH - 13) / 2;
      
      // Calculate Z-Score for target adult height (at 19 years = 228 months)
      const adultL = isBoy ? boysHeightL[228] : girlsHeightL[228];
      const adultM = isBoy ? boysHeightM[228] : girlsHeightM[228];
      const adultS = isBoy ? boysHeightS[228] : girlsHeightS[228];
      mphZ = calculateZScoreLMS(mph, adultL, adultM, adultS);
    }

    const bsa = Math.sqrt((h * w) / 3600);

    return {
      heightZ,
      weightZ,
      bmi,
      bmiZ,
      hcZ,
      mph,
      mphZ,
      bsa
    };
  };

  const results = calculateResults();

  const hasClinicalSign = Object.values(clinicalSigns).some(val => val === true);
  const hasExtremeZ = results && (
    (results.heightZ > 1.5 || results.heightZ < -1.5) ||
    (results.weightZ !== null && (results.weightZ > 1.5 || results.weightZ < -1.5)) ||
    (results.bmiZ > 1.5 || results.bmiZ < -1.5) ||
    (results.hcZ !== null && (results.hcZ > 1.5 || results.hcZ < -1.5))
  );
  const isWarning = hasExtremeZ || hasClinicalSign;

  useEffect(() => {
    if (username.toLowerCase().includes('ta') && passcode.endsWith('8888')) {
      setIsUnlocked(true);
      setUnlockError('');
    }
  }, [username, passcode]);

  const handleUnlock = () => {
    if (username.toLowerCase().includes('ta') && passcode.endsWith('8888')) {
      setIsUnlocked(true);
      setUnlockError('');
    } else {
      setUnlockError('Thông tin đăng nhập không đúng');
    }
  };

  const handleUpdateClick = () => {
    setIsUpdating(true);
    setIsUpdated(false);
    setTimeout(() => {
      setIsUpdating(false);
      setIsUpdated(true);
    }, 1500);
  };

  const appBgColor = isWarning ? 'bg-[#FF9AA2]' : (gender === 'boy' ? 'bg-[#D1EAFF]' : 'bg-[#FFD1DC]');

  return (
    <div className={`min-h-screen transition-colors duration-500 ${appBgColor}`}>
      <div className="relative z-10">
        {!isUnlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-center text-indigo-900 mb-6">TAH EndoScreen</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên người dùng</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Vui lòng nhập username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Nhập mã"
                />
              </div>
              {unlockError && <p className="text-red-500 text-sm">{unlockError}</p>}
              <button
                onClick={handleUnlock}
                className="w-full bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Truy cập ứng dụng
              </button>
              <button
                onClick={handleUpdateClick}
                disabled={isUpdating}
                className={`w-full text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 ${
                  isUpdated ? 'bg-green-600 hover:bg-green-700' : 'bg-[#FF0000] hover:bg-[#CC0000]'
                }`}
              >
                {isUpdating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang kiểm tra...
                  </>
                ) : isUpdated ? (
                  'Đã cập nhật version mới'
                ) : (
                  'Cập nhật Version mới'
                )}
              </button>
              <p className="text-center text-sm text-slate-500 mt-4">
                Liên hệ BS.Sơn để đăng kí sử dụng
              </p>
            </div>
          </div>
        </div>
      )}
      <div className={`min-h-screen text-slate-900 font-sans py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-500 ${!isUnlocked ? 'blur-sm pointer-events-none' : ''}`}>
        <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center pt-4 pb-2">
          <h1 className="text-4xl font-normal tracking-tight text-[#000080] mb-2" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
            EndoScreen 2.2 - Dr.Sơn
          </h1>
          <p className="text-[#000080] text-lg font-medium">
            Dựa trên tham chiếu WHO
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
                      ? 'bg-[#D1EAFF] text-slate-800 shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Bé Trai
                </button>
                <button
                  onClick={() => setGender('girl')}
                  className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${
                    gender === 'girl' 
                      ? 'bg-[#FFD1DC] text-slate-800 shadow-sm' 
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
                      <span className="font-semibold">{years} tuổi {months} tháng</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min="0"
                      max="19"
                      value={years}
                      onChange={(e) => setYears(Number(e.target.value))}
                      className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">tuổi</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="numeric"
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
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9.,]*"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Ví dụ: 110,5"
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
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9.,]*"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Ví dụ: 18,5"
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
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9.,]*"
                    value={headCircumference}
                    onChange={(e) => setHeadCircumference(e.target.value)}
                    className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Ví dụ: 45,5"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">cm</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Chiều cao lần khám trước (Tùy chọn)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9.,]*"
                      value={prevHeight}
                      onChange={(e) => setPrevHeight(e.target.value)}
                      className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      placeholder="Ví dụ: 105,5"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">cm</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={prevMonths}
                      onChange={(e) => setPrevMonths(e.target.value)}
                      className="w-full pl-4 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      placeholder="Cách đây"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">tháng</span>
                  </div>
                </div>
                {prevMonths !== '' && (parseInput(prevMonths) !== null && (parseInput(prevMonths)! < 3 || parseInput(prevMonths)! > 48)) && (
                  <p className="text-xs text-amber-600 mt-2">
                    Ngoài khoảng so sánh có ý nghĩa và không hiển thị trên biểu đồ
                  </p>
                )}
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
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9.,]*"
                      value={fatherHeight}
                      onChange={(e) => setFatherHeight(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      placeholder="170,5"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">cm</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Chiều cao Mẹ</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9.,]*"
                      value={motherHeight}
                      onChange={(e) => setMotherHeight(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      placeholder="158,5"
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
                  { id: 'ngungCao', label: 'Ngừng cao' },
                  { id: 'caoBatThuong', label: 'Cao bất thường' },
                  { id: 'tieuNhieu', label: 'Tiểu nhiều' },
                  { id: 'veCushing', label: 'Vẻ Cushing' },
                  { id: 'ramLong', label: 'Rậm lông' },
                  { id: 'caoHuyetAp', label: 'Cao huyết áp' },
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
                  if (isWarning) {
                    return (
                      <div className="bg-white border-2 border-red-500 rounded-2xl p-4 flex items-start space-x-3 shadow-md">
                        <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <h3 className="text-red-800 font-semibold text-sm">CẢNH BÁO LÂM SÀNG</h3>
                          <p className="text-red-700 text-sm mt-1">
                            Hệ thống ghi nhận bất thường (phát hiện chỉ số nhân trắc bất thường hoặc có dấu hiệu lâm sàng nguy cơ).
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 items-center">
                            <div className="inline-block bg-red-200 text-red-800 text-sm font-medium px-3 py-1.5 rounded-lg border border-red-300">
                              Đề nghị Hội chẩn Nhóm lâm sàng về Nội tiết Nhi - Dinh dưỡng lâm sàng - Di truyền y học (BS. Đỗ Tiến Sơn - Ext. 8921)
                              {results && evaluateBMIZScore(results.bmiZ, ageInMonths).label.includes('Béo phì') && (
                                <span> và Hội chẩn Trung tâm Kiểm soát Cân nặng và Điều trị Béo phì</span>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                if (window.confirm('Sau đây, quý đồng nghiệp sẽ được chuyển tiếp cuộc gọi đến BS. Đỗ Tiến Sơn. Vui lòng không bật loa ngoài và không hội chẩn khi có khách hàng trong phòng khám.')) {
                                  window.location.href = 'tel:0984144492';
                                }
                              }}
                              className="inline-flex items-center px-4 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                            >
                              Hội chẩn
                            </button>
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

                {/* Growth Velocity Result */}
                {prevHeight !== '' && prevMonths !== '' && parseInput(prevMonths) !== null && parseInput(prevMonths)! >= 3 && parseInput(prevMonths)! <= 48 && parseInput(prevHeight) !== null && parseInput(height) !== null && parseInput(prevHeight)! <= parseInput(height)! && (
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-medium text-slate-500">Tốc độ tăng trưởng trung bình</h3>
                        <p className="text-xs text-slate-400 mt-1">Dựa trên lần khám trước</p>
                      </div>
                      <div className="text-xl font-semibold text-slate-900">
                        {(((parseInput(height)! - parseInput(prevHeight)!) / parseInput(prevMonths)!) * 6).toFixed(1)} cm / 6 tháng
                      </div>
                    </div>
                    <div className="text-xs text-indigo-700 bg-indigo-50 p-2.5 rounded-lg border border-indigo-100">
                      Tốc độ tăng trưởng cần được bác sĩ đánh giá riêng cho từng ca
                    </div>
                  </div>
                )}

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
                  note={ageInMonths < 24 ? "Nên sử dụng chỉ số cân nặng theo chiều cao (W/L)." : undefined}
                />

                {/* BSA Result */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md">
                  <div>
                    <h3 className="text-sm font-medium text-slate-500">Diện tích da (BSA)</h3>
                    <p className="text-xs text-slate-400 mt-1">Công thức Mosteller</p>
                  </div>
                  <div className="text-xl font-semibold text-slate-900">{results.bsa.toFixed(2)} m²</div>
                </div>

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

                {/* Percentile Visualizer */}
                <PercentileVisualizer percentile={zScoreToPercentile(results.heightZ)} gender={gender} />
              </div>
            )}
          </div>

        </div>

        {/* Growth Charts */}
        {results && (
          <div>
            <GrowthCharts 
              gender={gender}
              ageInMonths={ageInMonths}
              height={parseInput(height) ?? ''}
              weight={parseInput(weight) ?? ''}
              bmi={results.bmi}
              mph={results.mph}
              heightZ={results.heightZ}
              mphZ={results.mphZ}
              hc={parseInput(headCircumference) ?? ''}
              hcZ={results.hcZ}
              prevHeight={parseInput(prevHeight) ?? ''}
              prevMonths={parseInput(prevMonths) ?? ''}
            />
          </div>
        )}

        {/* References */}
        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-slate-100 mt-12">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Chú thích & Tài liệu tham khảo</h3>
            <button 
              onClick={() => setShowReferences(!showReferences)}
              className="flex items-center space-x-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors bg-indigo-50 px-3 py-1.5 rounded-xl"
            >
              <span>{showReferences ? 'Ẩn bớt' : 'Hiện thêm'}</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showReferences ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          {showReferences && (
            <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <ul className="list-disc list-inside text-xs text-slate-500 space-y-2">
                <li>Khoảng tham chiếu bình thường cho Chiều cao và Cân nặng được tính từ -1.5 SD đến +1.5 SD. Các trường hợp ngoài khoảng này cần được lưu ý và hội chẩn thêm.</li>
              </ul>
              <ol className="list-decimal list-inside text-xs text-slate-500 space-y-2">
                <li>World Health Organization. <em>WHO Child Growth Standards: Length/height-for-age, weight-for-age, weight-for-length, weight-for-height and body mass index-for-age: Methods and development</em>. Geneva, Switzerland: World Health Organization; 2006.</li>
                <li>de Onis M, Onyango AW, Borghi E, Siyam A, Nishida C, Siekmann J. Development of a WHO growth reference for school-aged children and adolescents. <em>Bull World Health Organ</em>. 2007;85(9):660-667. doi:10.2471/blt.07.043497</li>
                <li>Barstow C, Rerucha C. Evaluation of Short and Tall Stature in Children. <em>Am Fam Physician</em>. 2015;92(1):43-50.</li>
              </ol>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 pb-4 text-center mt-2 space-y-0.5">
          <p className="text-[10px] text-white/70">
            Ứng dụng đang thử nghiệm nội bộ. Góp ý: <a href="mailto:bs.dotienson@gmail.com" className="hover:underline">bs.dotienson@gmail.com</a>
          </p>
          <p className="text-[10px] text-white/50">
            Bản quyền thuộc về BS. Đỗ Tiến Sơn - Bệnh viện Đa khoa Tâm Anh
          </p>
        </div>

      </div>
    </div>
  </div>
</div>
  );
}

function PercentileVisualizer({ percentile, gender }: { percentile: number, gender: 'boy' | 'girl' }) {
  const p = Math.round(percentile);
  const color = gender === 'boy' ? 'bg-[#D1EAFF]' : 'bg-[#FFD1DC]';
  const inactiveColor = 'bg-slate-200';

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mt-4 transition-all hover:shadow-md">
      <h3 className="text-sm font-medium text-slate-700 mb-2">Mô phỏng bách phân vị (Percentile)</h3>
      <p className="text-xs text-slate-500 mb-4">
        Trong 100 trẻ cùng tuổi và giới tính xếp hàng theo chiều cao tăng dần, bé đứng ở vị trí thứ <span className="font-bold text-slate-700">{p}</span>.
      </p>
      <div className="flex items-end h-16 space-x-[1px] w-full overflow-hidden">
        {Array.from({ length: 100 }).map((_, i) => {
          const isCurrent = i + 1 === p;
          // Calculate height from 20% to 100%
          const h = 20 + (i / 99) * 80;
          return (
            <div
              key={i}
              className={`flex-1 rounded-t-sm ${isCurrent ? color : inactiveColor}`}
              style={{ height: `${h}%` }}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-mono">
        <span>1st</span>
        <span>50th</span>
        <span>100th</span>
      </div>
    </div>
  );
}

function ResultCard({ title, value, zScore, percentile, evaluation, note }: { 
  title: string; 
  value: string; 
  zScore: number; 
  percentile?: number;
  evaluation: { label: string, color: string, bg: string, note?: string };
  note?: string;
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
            <span className={`font-mono font-medium ${zScore < -2 || zScore > 2 ? 'text-[#E53E3E]' : 'text-slate-700'}`}>
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
          className={`h-full rounded-full ${zScore < -2 || zScore > 2 ? 'bg-[#FF9AA2]' : 'bg-[#B9FBC0]'}`}
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
      {note && (
        <div className="mt-3 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-100">
          {note}
        </div>
      )}
    </div>
  );
}

