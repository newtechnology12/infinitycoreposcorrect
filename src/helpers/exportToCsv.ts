import { download, generateCsv, mkConfig } from "export-to-csv";

const csvConfig = mkConfig({ useKeysAsHeaders: true });

const exportToCsv = (data: any[], fileName: string) => {
  const csv = generateCsv(csvConfig)(data);
  const csvBtn = document.querySelector("#csv");
  csvBtn.addEventListener("click", () => download(csvConfig)(csv));
};
export default exportToCsv;
