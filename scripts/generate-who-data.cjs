const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '../node_modules/who-growth/resources/WHODocuments');

const files = {
  boysHeight: [
    { file: 'heightForAge/lhfa_boys_0-to-2-years_zscores.xlsx', start: 0, end: 24 },
    { file: 'heightForAge/lhfa_boys_2-to-5-years_zscores.xlsx', start: 25, end: 60 },
    { file: 'heightForAge/hfa-boys-z-who-2007-exp.xlsx', start: 61, end: 228 }
  ],
  girlsHeight: [
    { file: 'heightForAge/lhfa_girls_0-to-2-years_zscores.xlsx', start: 0, end: 24 },
    { file: 'heightForAge/lhfa_girls_2-to-5-years_zscores.xlsx', start: 25, end: 60 },
    { file: 'heightForAge/hfa-girls-z-who-2007-exp.xlsx', start: 61, end: 228 }
  ],
  boysWeight: [
    { file: 'weightForAge/wfa_boys_0-to-5-years_zscores.xlsx', start: 0, end: 60 },
    { file: 'weightForAge/hfa-boys-z-who-2007-exp_0ff9c43c-8cc0-4c23-9fc6-81290675e08b.xlsx', start: 61, end: 120 }
  ],
  girlsWeight: [
    { file: 'weightForAge/wfa_girls_0-to-5-years_zscores.xlsx', start: 0, end: 60 },
    { file: 'weightForAge/hfa-girls-z-who-2007-exp_7ea58763-36a2-436d-bef0-7fcfbadd2820.xlsx', start: 61, end: 120 }
  ],
  boysBMI: [
    { file: 'bmiForAge/bmi_boys_0-to-2-years_zcores.xlsx', start: 0, end: 24 },
    { file: 'bmiForAge/bmi_boys_2-to-5-years_zscores.xlsx', start: 25, end: 60 },
    { file: 'bmiForAge/bmi-boys-z-who-2007-exp.xlsx', start: 61, end: 228 }
  ],
  girlsBMI: [
    { file: 'bmiForAge/bmi_girls_0-to-2-years_zscores.xlsx', start: 0, end: 24 },
    { file: 'bmiForAge/bmi_girls_2-to-5-years_zscores.xlsx', start: 25, end: 60 },
    { file: 'bmiForAge/bmi-girls-z-who-2007-exp.xlsx', start: 61, end: 228 }
  ]
};

function extractData(fileList) {
  const result = [];
  for (const item of fileList) {
    const filePath = path.join(baseDir, item.file);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Find column indices for Month, L, M, S
    const header = data[0].map(h => typeof h === 'string' ? h.trim() : h);
    const monthIdx = header.findIndex(h => h === 'Month');
    const lIdx = header.findIndex(h => h === 'L');
    const mIdx = header.findIndex(h => h === 'M');
    const sIdx = header.findIndex(h => h === 'S');
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row.length === 0 || row[monthIdx] === undefined) continue;
      const month = row[monthIdx];
      if (month >= item.start && month <= item.end) {
        result[month] = {
          l: row[lIdx],
          m: row[mIdx],
          s: row[sIdx]
        };
      }
    }
  }
  return result;
}

const allData = {};
for (const key in files) {
  allData[key] = extractData(files[key]);
}

let tsContent = `// Generated WHO Data (LMS values)\n\n`;

for (const key in allData) {
  const data = allData[key];
  const lArray = data.map(d => d ? d.l : 0);
  const mArray = data.map(d => d ? d.m : 0);
  const sArray = data.map(d => d ? d.s : 0);
  
  tsContent += `export const ${key}L = ${JSON.stringify(lArray)};\n`;
  tsContent += `export const ${key}M = ${JSON.stringify(mArray)};\n`;
  tsContent += `export const ${key}S = ${JSON.stringify(sArray)};\n\n`;
}

// Add the Z-score calculation function
tsContent += `
export function calculateZScoreLMS(value, l, m, s) {
  if (l === 0) {
    return Math.log(value / m) / s;
  }
  return (Math.pow(value / m, l) - 1) / (l * s);
}

export function zScoreToPercentile(z) {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  let sign = 1;
  if (z < 0) {
      sign = -1;
  }
  const absZ = Math.abs(z) / Math.SQRT2;

  const t = 1.0 / (1.0 + p * absZ);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ);

  return 0.5 * (1.0 + sign * y) * 100;
}

export function evaluateHeightZScore(z) {
  if (z < -3) return { label: 'Rất thấp còi', color: 'text-red-600', bg: 'bg-red-50' };
  if (z < -2) return { label: 'Thấp còi', color: 'text-orange-600', bg: 'bg-orange-50' };
  if (z <= 2) return { label: 'Bình thường', color: 'text-emerald-600', bg: 'bg-emerald-50' };
  return { label: 'Rất cao', color: 'text-blue-600', bg: 'bg-blue-50' };
}

export function evaluateWeightZScore(z) {
  if (z < -3) return { label: 'Rất nhẹ cân', color: 'text-red-600', bg: 'bg-red-50' };
  if (z < -2) return { label: 'Nhẹ cân', color: 'text-orange-600', bg: 'bg-orange-50' };
  if (z <= 1) return { label: 'Bình thường', color: 'text-emerald-600', bg: 'bg-emerald-50' };
  return { label: 'Nặng cân (Xem BMI)', color: 'text-blue-600', bg: 'bg-blue-50' };
}

export function evaluateBMIZScore(z) {
  if (z < -3) return { label: 'Rất gầy', color: 'text-red-600', bg: 'bg-red-50' };
  if (z < -2) return { label: 'Gầy', color: 'text-orange-600', bg: 'bg-orange-50' };
  if (z <= 1) return { label: 'Bình thường', color: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (z <= 2) return { label: 'Nguy cơ béo phì', color: 'text-orange-600', bg: 'bg-orange-50' };
  return { label: 'Béo phì', color: 'text-red-600', bg: 'bg-red-50' };
}
`;

fs.writeFileSync(path.join(__dirname, '../src/utils/whoData.ts'), tsContent);
console.log('Successfully generated src/utils/whoData.ts');
