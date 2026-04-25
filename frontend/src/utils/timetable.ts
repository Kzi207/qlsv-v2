export const PERIODS = [
  { id: 1, start: '07:00', end: '07:50' },
  { id: 2, start: '07:50', end: '08:40' },
  { id: 3, start: '08:40', end: '09:30' },
  // Break 15m
  { id: 4, start: '09:45', end: '10:35' },
  { id: 5, start: '10:35', end: '11:25' },
  // Lunch
  { id: 6, start: '13:00', end: '13:50' },
  { id: 7, start: '13:50', end: '14:40' },
  { id: 8, start: '14:40', end: '15:30' },
  // Break 15m
  { id: 9, start: '15:45', end: '16:35' },
  { id: 10, start: '16:35', end: '17:25' },
];

export const getPeriodTimes = (startP: number, endP: number) => {
  const start = PERIODS.find(p => p.id === startP)?.start || '07:00';
  const end = PERIODS.find(p => p.id === endP)?.end || '07:50';
  return { start, end };
};
