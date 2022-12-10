export function truncate(
  address: string,
  startCharsCount: number = 14,
  endChartCounts: number = 3
) {
  const start = address.slice(0, startCharsCount);
  const end = address.slice(-endChartCounts);
  return address.length > startCharsCount + endChartCounts
    ? [start, end].join("…")
    : address;
}
