import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
  BarChart,
  Bar,
  Cell,
  ReferenceLine
} from 'recharts';
import {
  boysHeightL, boysHeightM, boysHeightS, girlsHeightL, girlsHeightM, girlsHeightS,
  boysWeightL, boysWeightM, boysWeightS, girlsWeightL, girlsWeightM, girlsWeightS,
  boysBMIL, boysBMIM, boysBMIS, girlsBMIL, girlsBMIM, girlsBMIS,
  boysHCL, boysHCM, boysHCS, girlsHCL, girlsHCM, girlsHCS,
  calculateValueFromZScore
} from '../utils/whoData';

interface GrowthChartsProps {
  gender: 'boy' | 'girl';
  ageInMonths: number;
  height: number | '';
  weight: number | '';
  bmi: number | null;
  mph: number | null;
  heightZ: number | null;
  mphZ: number | null;
  hc: number | '';
  hcZ: number | null;
  prevHeight: number | '';
  prevMonths: number | '';
}

export default function GrowthCharts({ gender, ageInMonths, height, weight, bmi, mph, heightZ, mphZ, hc, hcZ, prevHeight, prevMonths }: GrowthChartsProps) {
  const isBoy = gender === 'boy';
  const ageInYears = ageInMonths / 12;

  // Generate data for Height Chart
  const heightLArray = isBoy ? boysHeightL : girlsHeightL;
  const heightMArray = isBoy ? boysHeightM : girlsHeightM;
  const heightSArray = isBoy ? boysHeightS : girlsHeightS;
  const heightData = heightMArray.map((m, i) => {
    const l = heightLArray[i];
    const s = heightSArray[i];
    return {
      age: i / 12,
      '+3 SD': Number(calculateValueFromZScore(3, l, m, s).toFixed(1)),
      '+2 SD': Number(calculateValueFromZScore(2, l, m, s).toFixed(1)),
      'Mean': Number(m.toFixed(1)),
      '-2 SD': Number(calculateValueFromZScore(-2, l, m, s).toFixed(1)),
      '-3 SD': Number(calculateValueFromZScore(-3, l, m, s).toFixed(1)),
    };
  });

  // Generate data for Weight Chart
  const weightLArray = isBoy ? boysWeightL : girlsWeightL;
  const weightMArray = isBoy ? boysWeightM : girlsWeightM;
  const weightSArray = isBoy ? boysWeightS : girlsWeightS;
  const weightData = weightMArray.map((m, i) => {
    const l = weightLArray[i];
    const s = weightSArray[i];
    return {
      age: i / 12,
      '+3 SD': Number(calculateValueFromZScore(3, l, m, s).toFixed(1)),
      '+2 SD': Number(calculateValueFromZScore(2, l, m, s).toFixed(1)),
      'Mean': Number(m.toFixed(1)),
      '-2 SD': Number(calculateValueFromZScore(-2, l, m, s).toFixed(1)),
      '-3 SD': Number(calculateValueFromZScore(-3, l, m, s).toFixed(1)),
    };
  });

  // Generate data for BMI Chart
  const bmiLArray = isBoy ? boysBMIL : girlsBMIL;
  const bmiMArray = isBoy ? boysBMIM : girlsBMIM;
  const bmiSArray = isBoy ? boysBMIS : girlsBMIS;
  const bmiData = bmiMArray.map((m, i) => {
    const l = bmiLArray[i];
    const s = bmiSArray[i];
    return {
      age: i / 12,
      '+3 SD': Number(calculateValueFromZScore(3, l, m, s).toFixed(1)),
      '+2 SD': Number(calculateValueFromZScore(2, l, m, s).toFixed(1)),
      'Mean': Number(m.toFixed(1)),
      '-2 SD': Number(calculateValueFromZScore(-2, l, m, s).toFixed(1)),
      '-3 SD': Number(calculateValueFromZScore(-3, l, m, s).toFixed(1)),
    };
  });

  // Generate data for Head Circumference Chart
  const hcLArray = isBoy ? boysHCL : girlsHCL;
  const hcMArray = isBoy ? boysHCM : girlsHCM;
  const hcSArray = isBoy ? boysHCS : girlsHCS;
  const hcData = hcMArray.map((m, i) => {
    const l = hcLArray[i];
    const s = hcSArray[i];
    return {
      age: i / 12,
      '+3 SD': Number(calculateValueFromZScore(3, l, m, s).toFixed(1)),
      '+2 SD': Number(calculateValueFromZScore(2, l, m, s).toFixed(1)),
      'Mean': Number(m.toFixed(1)),
      '-2 SD': Number(calculateValueFromZScore(-2, l, m, s).toFixed(1)),
      '-3 SD': Number(calculateValueFromZScore(-3, l, m, s).toFixed(1)),
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-xl text-sm">
          <p className="font-medium text-slate-700 mb-2">{label.toFixed(1)} tuổi</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-600">{entry.name}:</span>
              <span className="font-medium text-slate-900">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 mt-8 print:break-inside-avoid">
      {/* Z-Score Comparison Chart */}
      {heightZ !== null && mphZ !== null && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 print:break-inside-avoid">
          <h3 className="text-lg font-medium text-slate-800 mb-6 text-center">So sánh Z-Score Chiều cao</h3>
          <div className="h-[300px] w-full max-w-md mx-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Hiện tại', ZScore: Number(heightZ.toFixed(2)) },
                { name: 'Di truyền (MPH)', ZScore: Number(mphZ.toFixed(2)) }
              ]} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#475569', fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis domain={[-3, 3]} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={2} />
                <Bar dataKey="ZScore" radius={[6, 6, 6, 6]} barSize={60}>
                  {
                    [
                      { name: 'Hiện tại', ZScore: Number(heightZ.toFixed(2)) },
                      { name: 'Di truyền (MPH)', ZScore: Number(mphZ.toFixed(2)) }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#9333ea' : '#ec4899'} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-sm text-slate-500 mt-4">
            So sánh tiềm năng di truyền và sự phát triển thực tế của trẻ.
          </p>
        </div>
      )}

      {/* Height Chart */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 print:break-inside-avoid">
        <h3 className="text-lg font-medium text-slate-800 mb-6">Biểu đồ Chiều cao theo Tuổi (cm)</h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={heightData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="age" type="number" domain={[0, 'dataMax']} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
              <Line type="monotone" dataKey="+3 SD" stroke="#f87171" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="+2 SD" stroke="#fbbf24" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="Mean" stroke="#34d399" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="-2 SD" stroke="#fbbf24" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="-3 SD" stroke="#f87171" strokeWidth={1.5} dot={false} />
              
              {height && (
                <ReferenceDot x={ageInYears} y={Number(height)} r={8} fill="#9333ea" stroke="#fff" strokeWidth={2} />
              )}
              {prevHeight && prevMonths && Number(prevMonths) >= 3 && Number(prevMonths) <= 48 && (
                <ReferenceDot x={(ageInMonths - Number(prevMonths)) / 12} y={Number(prevHeight)} r={6} fill="#3b82f6" stroke="#fff" strokeWidth={2} />
              )}
              {prevHeight && prevMonths && height && Number(prevMonths) >= 3 && Number(prevMonths) <= 48 && (
                <ReferenceLine segment={[{ x: (ageInMonths - Number(prevMonths)) / 12, y: Number(prevHeight) }, { x: ageInYears, y: Number(height) }]} stroke="#3b82f6" strokeWidth={2} strokeDasharray="3 3" />
              )}
              {mph && (
                <ReferenceDot x={19} y={mph} r={8} fill="#ec4899" stroke="#fff" strokeWidth={2} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-slate-500">
          {height && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-purple-600 border-2 border-white shadow-sm" />
              <span>Chiều cao hiện tại</span>
            </div>
          )}
          {prevHeight && prevMonths && Number(prevMonths) >= 3 && Number(prevMonths) <= 48 && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
              <span>Chiều cao lần trước</span>
            </div>
          )}
          {mph && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-pink-500 border-2 border-white shadow-sm" />
              <span>Chiều cao dự kiến (MPH)</span>
            </div>
          )}
        </div>
      </div>

      {/* Weight Chart */}
      {ageInMonths <= 120 && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 print:break-inside-avoid">
          <h3 className="text-lg font-medium text-slate-800 mb-6">Biểu đồ Cân nặng theo Tuổi (kg)</h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="age" type="number" domain={[0, 'dataMax']} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Line type="monotone" dataKey="+3 SD" stroke="#f87171" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="+2 SD" stroke="#fbbf24" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="Mean" stroke="#34d399" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="-2 SD" stroke="#fbbf24" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="-3 SD" stroke="#f87171" strokeWidth={1.5} dot={false} />
                
                {weight && (
                  <ReferenceDot x={ageInYears} y={Number(weight)} r={8} fill="#9333ea" stroke="#fff" strokeWidth={2} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center space-x-6 mt-4 text-xs text-slate-500">
            {weight && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-purple-600 border-2 border-white shadow-sm" />
                <span>Cân nặng hiện tại</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BMI Chart */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 print:break-inside-avoid">
        <h3 className="text-lg font-medium text-slate-800 mb-6">Biểu đồ BMI theo Tuổi</h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={bmiData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="age" type="number" domain={[0, 'dataMax']} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
              <Line type="monotone" dataKey="+3 SD" stroke="#f87171" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="+2 SD" stroke="#fbbf24" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="Mean" stroke="#34d399" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="-2 SD" stroke="#fbbf24" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="-3 SD" stroke="#f87171" strokeWidth={1.5} dot={false} />
              
              {bmi && (
                <ReferenceDot x={ageInYears} y={bmi} r={8} fill="#9333ea" stroke="#fff" strokeWidth={2} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center space-x-6 mt-4 text-xs text-slate-500">
          {bmi && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-purple-600 border-2 border-white shadow-sm" />
              <span>BMI hiện tại</span>
            </div>
          )}
        </div>
      </div>

      {/* Head Circumference Chart */}
      {ageInMonths <= 60 && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 print:break-inside-avoid">
          <h3 className="text-lg font-medium text-slate-800 mb-6">Biểu đồ Vòng đầu theo Tuổi (cm)</h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hcData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="age" type="number" domain={[0, 5]} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Line type="monotone" dataKey="+3 SD" stroke="#f87171" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="+2 SD" stroke="#fbbf24" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="Mean" stroke="#34d399" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="-2 SD" stroke="#fbbf24" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="-3 SD" stroke="#f87171" strokeWidth={1.5} dot={false} />
                
                {hc && (
                  <ReferenceDot x={ageInYears} y={Number(hc)} r={8} fill="#9333ea" stroke="#fff" strokeWidth={2} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center space-x-6 mt-4 text-xs text-slate-500">
            {hc && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-purple-600 border-2 border-white shadow-sm" />
                <span>Vòng đầu hiện tại</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
