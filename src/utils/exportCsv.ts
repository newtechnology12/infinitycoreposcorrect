import { download, generateCsv, mkConfig } from "export-to-csv";

const exportCsv = ({ data, name }) => {
  const csvConfig = mkConfig({
    useKeysAsHeaders: true,
    filename: name,
  });

  const csv = generateCsv(csvConfig)(data);
  download(csvConfig)(csv);
  return;
};

export default exportCsv;
