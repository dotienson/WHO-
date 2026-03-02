const fs = require('fs');
const path = require('path');

let tsContent = fs.readFileSync(path.join(__dirname, '../src/utils/whoData.ts'), 'utf8');

const interpolateFunc = `
export function interpolateLMS(ageInMonths, lArray, mArray, sArray) {
  const maxMonth = mArray.length - 1;
  const exactMonth = ageInMonths;
  
  if (exactMonth <= 0) return { l: lArray[0], m: mArray[0], s: sArray[0] };
  if (exactMonth >= maxMonth) return { l: lArray[maxMonth], m: mArray[maxMonth], s: sArray[maxMonth] };
  
  const lowerMonth = Math.floor(exactMonth);
  const upperMonth = Math.ceil(exactMonth);
  
  if (lowerMonth === upperMonth) return { l: lArray[lowerMonth], m: mArray[lowerMonth], s: sArray[lowerMonth] };
  
  const fraction = exactMonth - lowerMonth;
  
  const l = lArray[lowerMonth] + fraction * (lArray[upperMonth] - lArray[lowerMonth]);
  const m = mArray[lowerMonth] + fraction * (mArray[upperMonth] - mArray[lowerMonth]);
  const s = sArray[lowerMonth] + fraction * (sArray[upperMonth] - sArray[lowerMonth]);
  
  return { l, m, s };
}
`;

tsContent += interpolateFunc;
fs.writeFileSync(path.join(__dirname, '../src/utils/whoData.ts'), tsContent);
console.log('Added interpolateLMS');
