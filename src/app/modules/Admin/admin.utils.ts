export const companySearch = ["name", "address", "workType", "description"];

export const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const formatChartData = (
  aggregateResult: { _id: number; count?: number; total?: number }[],
  valueKey: "count" | "total",
) => {
  const map = new Map(
    aggregateResult.map((item) => [item._id, item[valueKey] || 0]),
  );
  return months.map((month, index) => ({
    month,
    amount: map.get(index + 1) || 0,
  }));
};
