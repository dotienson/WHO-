const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../node_modules/who-growth/resources/WHODocuments/heightForAge/hfa-boys-z-who-2007-exp.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log(data.slice(0, 5));
