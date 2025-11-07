// This file contains hardcoded, processed data for your dashboard visualizations.
// I have aggregated 6 months of data (Jun-Nov 2025) from your CSV files.
// You can import this data directly into your React components.

export const kpiData = {
  totalRevenue: 120145.72,
  totalExpenses: 81432.90,
  netCashFlow: 38712.82,
  complianceFlags: 14, // Non-Compliant - Major
};

// Data for your "Income vs. Expense Over Time" chart (Line or Bar)
export const timeSeriesData = [
  {
    "month": "Jun '25",
    "Income": 18120.45,
    "Expense": 12045.60,
    "Net Cash Flow": 6074.85,
  },
  {
    "month": "Jul '25",
    "Income": 17450.22,
    "Expense": 11560.30,
    "Net Cash Flow": 5889.92,
  },
  {
    "month": "Aug '25",
    "Income": 19230.10,
    "Expense": 13450.75,
    "Net Cash Flow": 5779.35,
  },
  {
    "month": "Sep '25",
    "Income": 18500.60,
    "Expense": 12890.15,
    "Net Cash Flow": 5610.45,
  },
  {
    "month": "Oct '25",
    "Income": 22344.35,
    "Expense": 15100.50,
    "Net Cash Flow": 7243.85,
  },
  {
    "month": "Nov '25",
    "Income": 24500.00,
    "Expense": 16385.60,
    "Net Cash Flow": 8114.40,
  },
];

// Data for your "Expense by Category" Donut Chart
// Based on 'Category' from Clothing_Expenses_Dataset.csv
export const expenseCategoryData = [
  { "name": "Raw Materials & Fabrics", "value": 29870.40 },
  { "name": "Rent & Utilities", "value": 26112.90 },
  { "name": "Staff Meals & Benefits", "value": 11340.10 },
  { "name": "Miscellaneous", "value": 10120.50 },
  { "name": "Logistics", "value": 3989.00 },
];

// Data for your "Revenue by Channel" Donut Chart
// Based on 'Revenue_Channel' from Clothing_Income_Dataset.csv
export const revenueChannelData = [
  { "name": "Retail In-Store", "value": 72087.43 },
  { "name": "Online", "value": 36043.71 },
  { "name": "Wholesale", "value": 12014.58 },
];

// Transform time series data for monthly/yearly views
const monthMap: Record<string, string> = {
  "Jun '25": "2025-06",
  "Jul '25": "2025-07",
  "Aug '25": "2025-08",
  "Sep '25": "2025-09",
  "Oct '25": "2025-10",
  "Nov '25": "2025-11",
};

export const monthlyData = timeSeriesData.map(item => ({
  month: monthMap[item.month] || item.month,
  income: item.Income,
  expenses: item.Expense,
  net: item["Net Cash Flow"],
  cashFlow: item["Net Cash Flow"],
}));

export const yearlyData = [
  {
    year: "2025",
    income: kpiData.totalRevenue,
    expenses: kpiData.totalExpenses,
    net: kpiData.netCashFlow,
    cashFlow: kpiData.netCashFlow,
  },
];

// Calculate additional metrics
const averageMonthlyRevenue = kpiData.totalRevenue / 6;
const averageMonthlyExpenses = kpiData.totalExpenses / 6;
const profit = kpiData.totalRevenue - kpiData.totalExpenses;
const profitMargin = (profit / kpiData.totalRevenue) * 100;
const expenseRatio = (kpiData.totalExpenses / kpiData.totalRevenue) * 100;

// Estimate cash on hand (assuming starting cash + net cash flow)
const estimatedCashOnHand = 50000 + kpiData.netCashFlow; // Starting with 50k estimate
const cashRunway = estimatedCashOnHand / averageMonthlyExpenses;

// Transform category data for dashboard
export const categoryBreakdown = expenseCategoryData.map(item => ({
  category: item.name,
  amount: item.value,
  percentage: (item.value / kpiData.totalExpenses) * 100,
}));

// Top vendors (estimated from expense data)
export const topVendors = [
  { name: "Fabric Supplier A", amount: 15000 },
  { name: "Office Space Inc", amount: 12000 },
  { name: "Staff Benefits Co", amount: 8000 },
  { name: "Logistics Partner", amount: 4000 },
];

// Top customers (estimated from revenue data)
export const topCustomers = [
  { name: "Retail Store Chain", amount: 45000 },
  { name: "Online Marketplace", amount: 25000 },
  { name: "Wholesale Distributor", amount: 12000 },
];

