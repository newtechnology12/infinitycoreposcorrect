import getApiUrl from "./getApiUrl";

const POCKETBASE_URL = getApiUrl();

const getFileUrl = ({ file, collection, record }) => {
  return file
    ? `${POCKETBASE_URL}/api/files/${collection}/${record}/${file}`
    : undefined;
};

export default getFileUrl;
