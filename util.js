function getToday() {
  const date = new Date();
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const yyyy = y.toString();
  const mm = ("00" + m).slice(-2);
  const dd = ("00" + d).slice(-2);
  const yyyymmdd = `${yyyy}${mm}${dd}`;
  return yyyymmdd;
}
