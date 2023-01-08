export const getActionTimeDuration = (singleThreadActionTime: number) => {
  const totalSeconds = Math.round(singleThreadActionTime / 1000);
  const totalMinutes = Math.round(totalSeconds / 60);
  const totalHours = Math.round(totalMinutes / 60);

  return {
    s: totalSeconds,
    m: totalMinutes,
    h: totalHours,
  };
};
