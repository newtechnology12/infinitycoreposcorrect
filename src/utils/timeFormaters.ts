function formatDateToStartOfDay(inputDate) {
  let beginTime: any = new Date(inputDate);
  beginTime.setHours(0, 0, 0, 0);
  beginTime = beginTime.toISOString().replace("T", " ");
  return beginTime;
}

function formatDateToEndOfDay(inputDate) {
  let stopTime: any = new Date(inputDate);
  stopTime.setHours(23, 59, 59, 999);
  stopTime = stopTime.toISOString().replace("T", " ");
  return stopTime;
}

export { formatDateToEndOfDay, formatDateToStartOfDay };
