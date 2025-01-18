// import getApiUrl from "@/utils/getApiUrl";
import PocketBase from "pocketbase";

// const POCKETBASE_URL = getApiUrl();

// const pocketbase = new PocketBase(POCKETBASE_URL).autoCancellation(false);

// export default pocketbase;

const pocketbase = new PocketBase(
    "https://pocketbase-production-251b.up.railway.app"
  ).autoCancellation(false);
  
  export default pocketbase;
  
