import pocketbase from "@/lib/pocketbase";

const recordActivtyLog = async ({
  title,
  event_type,
  log_level,
  details,
  user,
}) => {
  console.log("Recording activity log --> " + title);

  await pocketbase.collection("activity_logs").create({
    title,
    event_type,
    log_level,
    details,
    user,
  });
};

export default recordActivtyLog;
