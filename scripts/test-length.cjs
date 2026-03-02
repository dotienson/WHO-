const fs = require('fs');
const content = fs.readFileSync('src/utils/whoData.ts', 'utf8');
const lines = content.split('\n');
for (const line of lines) {
  if (line.startsWith('export const boysHeightM')) {
    const arr = JSON.parse(line.split('= ')[1].replace(';', ''));
    console.log('boysHeightM length:', arr.length);
  }
  if (line.startsWith('export const boysWeightM')) {
    const arr = JSON.parse(line.split('= ')[1].replace(';', ''));
    console.log('boysWeightM length:', arr.length);
  }
}
