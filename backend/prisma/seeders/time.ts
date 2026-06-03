export const daysAgo = (days: number, hour = 8) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date;
};

export const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000);
