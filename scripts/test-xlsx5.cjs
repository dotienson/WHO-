const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../node_modules/who-growth/resources/WHODocuments/heightForAge/lhfa_boys_2-to-5-years_zscores.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log(data.slice(0, 5));
