module.exports.getDateFormat = (date = new Date()) => {
  return `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${(
    "0" + date.getDate()
  ).slice(-2)}`;
};

// [{ start_time: '08:00', end_time: '08:30' }]
module.exports.getRangeTime = () => {
  const startDate = new Date("2001/1/1 08:00");
  const endDate = new Date("2001/1/1 23:00");
  const durationMinute = 30;
  const duration = span(startDate, endDate, durationMinute);
  const results = [];
  for (let i = 0; i < duration; i++) {
    const startHHMM = `${("0" + startDate.getHours()).slice(-2)}:${(
      "0" + startDate.getMinutes()
    ).slice(-2)}`;
    startDate.setMinutes(startDate.getMinutes() + durationMinute);
    const endHHMM = `${("0" + startDate.getHours()).slice(-2)}:${(
      "0" + startDate.getMinutes()
    ).slice(-2)}`;
    results.push({
      start_time: startHHMM,
      end_time: endHHMM
    });
  }
  return results;
};

function span(start, end, duration) {
  return (end - start) / (1000 * 60 * duration);
}

module.exports.span = span;

module.exports.plusTime = (time, minute) => {
  const date = new Date("2001/1/1 " + time);
  date.setMinutes(date.getMinutes() + minute);
  return `${("0" + date.getHours()).slice(-2)}:${(
    "0" + date.getMinutes()
  ).slice(-2)}`;
}
