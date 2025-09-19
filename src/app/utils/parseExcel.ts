import xlsx from "xlsx";

export const parseExcel = (filePath: string) => {
  return new Promise((resolve, reject) => {
    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);
      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
};
