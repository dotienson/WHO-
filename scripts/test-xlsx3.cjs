const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../node_modules/who-growth/resources/WHODocuments/weightForAge/hfa-boys-z-who-2007-exp_0ff9c43c-8cc0-4c23-9fc6-81290675e08b.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log(data.slice(0, 5));
