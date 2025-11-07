import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { KPICard } from "@/components/KPICard";
import { CashFlowChart } from "@/components/CashFlowChart";
import { ExpandableChat } from "@/components/ExpandableChat";
import { DataVisualization } from "@/components/DataVisualization";
import { TrendingUp, DollarSign, AlertCircle, TrendingDown, Receipt, CreditCard, Wallet, BarChart3, Users, FileText, Activity, Percent, Calendar, Building2, ShoppingCart, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  kpiData, 
  monthlyData, 
  yearlyData, 
  categoryBreakdown, 
  topVendors, 
  topCustomers 
} from "@/data/hardcodedMetrics";

interface DashboardMetrics {
  cashOnHand: number | null;
  monthlyBurnRate: number | null;
  overdueInvoices: number | null;
  revenue: number | null;
  expenses: number | null;
  profit: number | null;
  accountsReceivable: number | null;
  accountsPayable: number | null;
}

interface Statistics {
  totalTransactions?: number | null;
  averageTransactionSize?: number | null;
  largestTransaction?: number | null;
  transactionCount?: number | null;
  invoiceCount?: number | null;
  expenseCount?: number | null;
}

interface TopEntity {
  name: string;
  amount: number;
  percentage?: number;
}

interface TopEntities {
  topVendors?: TopEntity[];
  topCustomers?: TopEntity[];
  topCategories?: TopEntity[];
}

interface FinancialHealth {
  profitMargin?: number | null;
  expenseRatio?: number | null;
  cashRunway?: number | null;
  arTurnover?: number | null;
}

interface DashboardData {
  metrics: DashboardMetrics;
  statistics?: Statistics;
  topEntities?: TopEntities;
  financialHealth?: FinancialHealth;
  dataTypes: string[];
  availableCategories: string[];
  timeRange: { start: string; end: string } | null;
  monthlyData?: Array<{
    month: string;
    income: number;
    expenses: number;
    net: number;
    cashFlow?: number;
  }>;
  yearlyData?: Array<{
    year: string;
    income: number;
    expenses: number;
    net: number;
    cashFlow?: number;
  }>;
  categoryBreakdown?: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

const Index = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  // Get or create unified session ID (persisted in localStorage)
  // This session ID is shared across dashboard and chat for consistent context
  const getSessionId = (): string => {
    const storageKey = "cfo-unified-session-id";
    let sessionId = localStorage.getItem(storageKey);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem(storageKey, sessionId);
    }
    return sessionId;
  };

  // Use hardcoded data instead of API call
  useEffect(() => {
    const loadHardcodedData = () => {
      if (activeView !== "dashboard") return;

      setMetricsLoading(true);
      setMetricsError(null);

      try {
        // Calculate additional metrics from hardcoded data
        const profit = kpiData.totalRevenue - kpiData.totalExpenses;
        const averageMonthlyRevenue = kpiData.totalRevenue / 6;
        const averageMonthlyExpenses = kpiData.totalExpenses / 6;
        const estimatedCashOnHand = 50000 + kpiData.netCashFlow; // Starting with 50k estimate
        const cashRunway = estimatedCashOnHand / averageMonthlyExpenses;
        const profitMargin = (profit / kpiData.totalRevenue) * 100;
        const expenseRatio = (kpiData.totalExpenses / kpiData.totalRevenue) * 100;
        
        // Estimate transaction counts (assuming average transaction sizes)
        const avgTransactionSize = 500;
        const totalTransactions = Math.round(kpiData.totalRevenue / avgTransactionSize);
        const invoiceCount = Math.round(kpiData.totalRevenue / 2000); // Assuming avg invoice ~$2000
        const expenseCount = Math.round(kpiData.totalExpenses / 300); // Assuming avg expense ~$300

        // Transform hardcoded data to match DashboardData interface
        const data: DashboardData = {
          metrics: {
            cashOnHand: estimatedCashOnHand,
            monthlyBurnRate: averageMonthlyExpenses,
            overdueInvoices: kpiData.complianceFlags > 0 ? 5000 : null, // Estimate overdue based on compliance flags
            revenue: kpiData.totalRevenue,
            expenses: kpiData.totalExpenses,
            profit: profit,
            accountsReceivable: kpiData.totalRevenue * 0.3, // Estimate 30% of revenue as AR
            accountsPayable: kpiData.totalExpenses * 0.2, // Estimate 20% of expenses as AP
          },
          statistics: {
            totalTransactions: totalTransactions,
            averageTransactionSize: avgTransactionSize,
            invoiceCount: invoiceCount,
            expenseCount: expenseCount,
          },
          topEntities: {
            topVendors: topVendors,
            topCustomers: topCustomers,
            topCategories: categoryBreakdown.map(cat => ({
              name: cat.category,
              amount: cat.amount,
              percentage: cat.percentage,
            })),
          },
          financialHealth: {
            profitMargin: profitMargin,
            expenseRatio: expenseRatio,
            cashRunway: cashRunway,
          },
          dataTypes: ["Income", "Expenses", "Transactions", "Invoices"],
          availableCategories: categoryBreakdown.map(cat => cat.category),
          timeRange: {
            start: "2025-06-01",
            end: "2025-11-30",
          },
          monthlyData: monthlyData,
          yearlyData: yearlyData,
          categoryBreakdown: categoryBreakdown,
        };

        // Simulate a small delay for better UX
        setTimeout(() => {
          setDashboardData(data);
          setMetricsLoading(false);
        }, 300);
      } catch (error) {
        console.error("Error loading hardcoded data:", error);
        setMetricsError(error instanceof Error ? error.message : "Failed to load metrics");
        setMetricsLoading(false);
      }
    };

    loadHardcodedData();
  }, [activeView]);

  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [chatWidth, setChatWidth] = useState(384); // Default 384px (w-96)
  const [isResizing, setIsResizing] = useState(false);

  // Handle resize functionality
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      // Constrain between 64px (collapsed) and 800px (max)
      const constrainedWidth = Math.max(64, Math.min(800, newWidth));
      setChatWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar */}
      <Sidebar activeItem={activeView} onItemClick={setActiveView} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Center Column - Main Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
            {activeView === "dashboard" && (
              <>
                {/* Welcome Header */}
                <div className="space-y-2">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome, Business Owner</h1>
                  <p className="text-muted-foreground mt-1 text-sm sm:text-base">Here's your financial overview</p>
                  </div>
                  {/* Quick Insights Summary */}
                  {dashboardData && (dashboardData.metrics.revenue !== null || dashboardData.metrics.expenses !== null || dashboardData.metrics.profit !== null) && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {dashboardData.metrics.profit !== null && (
                        <Badge variant={dashboardData.metrics.profit > 0 ? "default" : "destructive"} className="text-xs px-3 py-1">
                          {dashboardData.metrics.profit > 0 ? "✓ Profitable" : "⚠ Operating at Loss"}
                        </Badge>
                      )}
                      {dashboardData.metrics.cashOnHand !== null && dashboardData.metrics.monthlyBurnRate !== null && dashboardData.metrics.monthlyBurnRate > 0 && (
                        <Badge variant="outline" className="text-xs px-3 py-1">
                          Runway: {Math.round((dashboardData.metrics.cashOnHand / dashboardData.metrics.monthlyBurnRate) * 10) / 10} months
                        </Badge>
                      )}
                      {dashboardData.metrics.overdueInvoices !== null && dashboardData.metrics.overdueInvoices > 0 && (
                        <Badge variant="destructive" className="text-xs px-3 py-1">
                          ⚠ ${dashboardData.metrics.overdueInvoices.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} Overdue
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Dynamic KPI Cards - Only show metrics that have values */}
                {metricsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border border-border/50 rounded-lg p-4 sm:p-6 animate-pulse">
                        <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                        <div className="h-8 bg-muted rounded w-32"></div>
                      </div>
                    ))}
                  </div>
                ) : dashboardData ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {dashboardData.metrics.cashOnHand !== null && (
                  <KPICard
                    title="Cash on Hand"
                          value={`$${dashboardData.metrics.cashOnHand.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`}
                          icon={Wallet}
                          trend="up"
                          variant="success"
                        />
                      )}
                      {dashboardData.metrics.revenue !== null && (
                        <KPICard
                          title="Revenue"
                          value={`$${dashboardData.metrics.revenue.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`}
                    icon={TrendingUp}
                    trend="up"
                    variant="success"
                  />
                      )}
                      {dashboardData.metrics.expenses !== null && (
                        <KPICard
                          title="Expenses"
                          value={`$${dashboardData.metrics.expenses.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`}
                          icon={TrendingDown}
                          variant="default"
                        />
                      )}
                      {dashboardData.metrics.profit !== null && (
                        <KPICard
                          title="Profit"
                          value={`$${dashboardData.metrics.profit.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`}
                          icon={BarChart3}
                          trend={dashboardData.metrics.profit > 0 ? "up" : "down"}
                          variant={dashboardData.metrics.profit > 0 ? "success" : "destructive"}
                        />
                      )}
                      {dashboardData.metrics.monthlyBurnRate !== null && (
                  <KPICard
                    title="Monthly Burn Rate"
                          value={`$${dashboardData.metrics.monthlyBurnRate.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`}
                    icon={DollarSign}
                          variant="warning"
                  />
                      )}
                      {dashboardData.metrics.overdueInvoices !== null && (
                  <KPICard
                    title="Overdue Invoices"
                          value={`$${dashboardData.metrics.overdueInvoices.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`}
                    icon={AlertCircle}
                    variant="destructive"
                  />
                      )}
                      {dashboardData.metrics.accountsReceivable !== null && (
                        <KPICard
                          title="Accounts Receivable"
                          value={`$${dashboardData.metrics.accountsReceivable.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`}
                          icon={Receipt}
                          variant="default"
                        />
                      )}
                      {dashboardData.metrics.accountsPayable !== null && (
                        <KPICard
                          title="Accounts Payable"
                          value={`$${dashboardData.metrics.accountsPayable.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`}
                          icon={CreditCard}
                          variant="default"
                        />
                      )}
                </div>

                    {/* Comprehensive Data Overview Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Statistics & Financial Health */}
                      <Card className="border-border/50 bg-card">
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            Statistics & Health
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Statistics Grid */}
                          <div className="grid grid-cols-2 gap-3">
                            {/* Show statistics if available, otherwise show key metrics */}
                            {dashboardData.statistics?.totalTransactions !== null && dashboardData.statistics?.totalTransactions !== undefined ? (
                              <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20 hover:border-primary/40 transition-colors">
                                <p className="text-xs text-muted-foreground mb-1">Total Transactions</p>
                                <p className="text-lg font-bold text-foreground">{dashboardData.statistics.totalTransactions.toLocaleString()}</p>
                              </div>
                            ) : dashboardData.metrics.revenue !== null && (
                              <div className="p-3 bg-gradient-to-br from-success/10 to-success/5 rounded-lg border border-success/20 hover:border-success/40 transition-colors">
                                <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
                                <p className="text-lg font-bold text-foreground">${dashboardData.metrics.revenue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                              </div>
                            )}
                            
                            {dashboardData.statistics?.averageTransactionSize !== null && dashboardData.statistics?.averageTransactionSize !== undefined ? (
                              <div className="p-3 bg-gradient-to-br from-success/10 to-success/5 rounded-lg border border-success/20 hover:border-success/40 transition-colors">
                                <p className="text-xs text-muted-foreground mb-1">Avg Transaction</p>
                                <p className="text-lg font-bold text-foreground">${dashboardData.statistics.averageTransactionSize.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                              </div>
                            ) : dashboardData.metrics.expenses !== null && (
                              <div className="p-3 bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-lg border border-destructive/20 hover:border-destructive/40 transition-colors">
                                <p className="text-xs text-muted-foreground mb-1">Total Expenses</p>
                                <p className="text-lg font-bold text-foreground">${dashboardData.metrics.expenses.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                              </div>
                            )}

                            {dashboardData.statistics?.invoiceCount !== null && dashboardData.statistics?.invoiceCount !== undefined ? (
                              <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20 hover:border-primary/40 transition-colors">
                                <p className="text-xs text-muted-foreground mb-1">Invoices</p>
                                <p className="text-lg font-bold text-foreground">{dashboardData.statistics.invoiceCount.toLocaleString()}</p>
                              </div>
                            ) : dashboardData.metrics.accountsReceivable !== null && dashboardData.metrics.accountsReceivable > 0 && (
                              <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20 hover:border-primary/40 transition-colors">
                                <p className="text-xs text-muted-foreground mb-1">Receivables</p>
                                <p className="text-lg font-bold text-foreground">${dashboardData.metrics.accountsReceivable.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                              </div>
                            )}

                            {dashboardData.statistics?.expenseCount !== null && dashboardData.statistics?.expenseCount !== undefined ? (
                              <div className="p-3 bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-lg border border-destructive/20 hover:border-destructive/40 transition-colors">
                                <p className="text-xs text-muted-foreground mb-1">Expense Records</p>
                                <p className="text-lg font-bold text-foreground">{dashboardData.statistics.expenseCount.toLocaleString()}</p>
                              </div>
                            ) : dashboardData.metrics.accountsPayable !== null && dashboardData.metrics.accountsPayable > 0 && (
                              <div className="p-3 bg-gradient-to-br from-warning/10 to-warning/5 rounded-lg border border-warning/20 hover:border-warning/40 transition-colors">
                                <p className="text-xs text-muted-foreground mb-1">Payables</p>
                                <p className="text-lg font-bold text-foreground">${dashboardData.metrics.accountsPayable.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                              </div>
                            )}

                            {/* Show empty state if no data at all */}
                            {!dashboardData.statistics?.totalTransactions && 
                             !dashboardData.metrics.revenue && 
                             !dashboardData.metrics.expenses && 
                             !dashboardData.metrics.accountsReceivable && 
                             !dashboardData.metrics.accountsPayable && (
                              <div className="col-span-2 text-center py-6 text-muted-foreground text-sm">
                                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>Statistics will appear here</p>
                                <p className="text-xs mt-1">once data is available</p>
                              </div>
                            )}
                          </div>

                          {/* Financial Health Indicators */}
                          <div className="pt-4 border-t border-border/50">
                            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Financial Health</p>
                            <div className="space-y-3">
                              {/* Calculate profit margin if we have revenue and profit */}
                              {(() => {
                                const profitMargin = dashboardData.financialHealth?.profitMargin ?? 
                                  (dashboardData.metrics.revenue && dashboardData.metrics.profit !== null && dashboardData.metrics.revenue > 0
                                    ? (dashboardData.metrics.profit / dashboardData.metrics.revenue) * 100
                                    : null);
                                return profitMargin !== null && (
                                  <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <Percent className="w-4 h-4 text-muted-foreground" />
                                      <span className="text-sm font-medium">Profit Margin</span>
                                    </div>
                                    <Badge variant={profitMargin > 0 ? "default" : "destructive"} className="font-semibold">
                                      {profitMargin > 0 ? "+" : ""}{profitMargin.toFixed(1)}%
                                    </Badge>
                                  </div>
                                );
                              })()}

                              {/* Calculate expense ratio */}
                              {(() => {
                                const expenseRatio = dashboardData.financialHealth?.expenseRatio ??
                                  (dashboardData.metrics.revenue && dashboardData.metrics.expenses && dashboardData.metrics.revenue > 0
                                    ? (dashboardData.metrics.expenses / dashboardData.metrics.revenue) * 100
                                    : null);
                                return expenseRatio !== null && (
                                  <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <TrendingDown className="w-4 h-4 text-muted-foreground" />
                                      <span className="text-sm font-medium">Expense Ratio</span>
                                    </div>
                                    <Badge variant="outline" className="font-semibold">
                                      {expenseRatio.toFixed(1)}%
                                    </Badge>
                                  </div>
                                );
                              })()}

                              {/* Calculate cash runway */}
                              {(() => {
                                const cashRunway = dashboardData.financialHealth?.cashRunway ??
                                  (dashboardData.metrics.cashOnHand && dashboardData.metrics.monthlyBurnRate && dashboardData.metrics.monthlyBurnRate > 0
                                    ? dashboardData.metrics.cashOnHand / dashboardData.metrics.monthlyBurnRate
                                    : null);
                                return cashRunway !== null && (
                                  <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-muted-foreground" />
                                      <span className="text-sm font-medium">Cash Runway</span>
                                    </div>
                                    <Badge variant={cashRunway > 6 ? "default" : cashRunway > 3 ? "secondary" : "destructive"} className="font-semibold">
                                      {cashRunway.toFixed(1)} months
                                    </Badge>
                                  </div>
                                );
                              })()}

                              {/* Show message if no health data */}
                              {!dashboardData.financialHealth?.profitMargin && 
                               !dashboardData.financialHealth?.expenseRatio && 
                               !dashboardData.financialHealth?.cashRunway &&
                               !dashboardData.metrics.revenue && 
                               !dashboardData.metrics.expenses && (
                                <div className="text-center py-4 text-muted-foreground text-sm">
                                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                  <p>Financial health data will appear here</p>
                                  <p className="text-xs mt-1">once metrics are available</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Top Entities & Data Types */}
                      <Card className="border-border/50 bg-card">
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-primary" />
                            Top Entities & Data
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Top Categories */}
                          {dashboardData.topEntities?.topCategories && dashboardData.topEntities.topCategories.length > 0 ? (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1 uppercase tracking-wide">
                                <ShoppingCart className="w-4 h-4" />
                                Top Categories
                              </p>
                              <div className="space-y-2">
                                {dashboardData.topEntities.topCategories.slice(0, 5).map((cat, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-3 bg-gradient-to-r from-muted/40 to-muted/20 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                      <div 
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: `hsl(var(--chart-${(idx % 5) + 1}))` }}
                                      />
                                      <span className="text-sm font-medium">{cat.name}</span>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-bold">${cat.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                      {cat.percentage && <p className="text-xs text-muted-foreground">{cat.percentage.toFixed(1)}%</p>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : dashboardData.availableCategories.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1 uppercase tracking-wide">
                                <ShoppingCart className="w-4 h-4" />
                                Categories
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {dashboardData.availableCategories.slice(0, 8).map((cat, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {cat}
                                  </Badge>
                                ))}
                                {dashboardData.availableCategories.length > 8 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{dashboardData.availableCategories.length - 8} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Top Vendors */}
                          {dashboardData.topEntities?.topVendors && dashboardData.topEntities.topVendors.length > 0 ? (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1 uppercase tracking-wide">
                                <Users className="w-4 h-4" />
                                Top Vendors
                              </p>
                              <div className="space-y-2">
                                {dashboardData.topEntities.topVendors.slice(0, 3).map((vendor, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-3 bg-gradient-to-r from-muted/40 to-muted/20 rounded-lg border border-border/50">
                                    <span className="text-sm font-medium truncate flex-1">{vendor.name}</span>
                                    <span className="text-sm font-bold ml-2 text-primary">${vendor.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : dashboardData.metrics.accountsPayable !== null && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1 uppercase tracking-wide">
                                <Users className="w-4 h-4" />
                                Key Metrics
                              </p>
                              <div className="space-y-2">
                                {dashboardData.metrics.accountsPayable > 0 && (
                                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-warning/10 to-warning/5 rounded-lg border border-warning/20">
                                    <span className="text-sm font-medium">Total Payables</span>
                                    <span className="text-sm font-bold">${dashboardData.metrics.accountsPayable.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                  </div>
                                )}
                                {dashboardData.metrics.accountsReceivable !== null && dashboardData.metrics.accountsReceivable > 0 && (
                                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-success/10 to-success/5 rounded-lg border border-success/20">
                                    <span className="text-sm font-medium">Total Receivables</span>
                                    <span className="text-sm font-bold">${dashboardData.metrics.accountsReceivable.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Data Types & Time Range */}
                          <div className="pt-4 border-t border-border/50 space-y-4">
                            {dashboardData.dataTypes.length > 0 ? (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1 uppercase tracking-wide">
                                  <FileText className="w-4 h-4" />
                                  Data Types
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {dashboardData.dataTypes.map((type, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs font-medium">
                                      {type}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1 uppercase tracking-wide">
                                  <FileText className="w-4 h-4" />
                                  Available Data
                                </p>
                                <div className="text-sm text-muted-foreground">
                                  {dashboardData.metrics.revenue !== null || dashboardData.metrics.expenses !== null ? (
                                    <p>Financial metrics available from knowledge base</p>
                                  ) : (
                                    <p>Upload financial data to see insights</p>
                          )}
                        </div>
                      </div>
                    )}
                            
                            {dashboardData.timeRange && dashboardData.timeRange.start && dashboardData.timeRange.end && (() => {
                              try {
                                const startDate = new Date(dashboardData.timeRange.start);
                                const endDate = new Date(dashboardData.timeRange.end);
                                // Check if dates are valid (not epoch 0 or invalid)
                                if (startDate.getTime() > 0 && endDate.getTime() > 0 && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                                  return (
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1 uppercase tracking-wide">
                                        <Calendar className="w-4 h-4" />
                                        Time Range
                                      </p>
                                      <p className="text-sm font-medium">
                                        {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} - {endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                      </p>
                                    </div>
                                  );
                                }
                              } catch (e) {
                                // Invalid date, don't show
                              }
                              return null;
                            })()}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {metricsError && (
                      <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium mb-1">Failed to load metrics</p>
                            <p className="text-xs text-muted-foreground">{metricsError}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Make sure the dashboard-metrics function is deployed and AWS credentials are configured.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No metrics available. Please ensure your knowledge base contains financial data.
                  </div>
                )}

                {/* Cash Flow Chart - Use real data if available */}
                {dashboardData && (
                  <CashFlowChart 
                    revenue={dashboardData.metrics.revenue}
                    expenses={dashboardData.metrics.expenses}
                    cashOnHand={dashboardData.metrics.cashOnHand}
                    monthlyData={dashboardData.monthlyData}
                  />
                )}
              </>
            )}

            {activeView === "data-analysis" && (
              <>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Data Analysis</h1>
                  <p className="text-muted-foreground mt-1">Process and visualize your financial data</p>
                </div>
                <DataVisualization />
              </>
            )}

            {activeView === "reports" && (
              <>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                  <p className="text-muted-foreground mt-1">Financial reports and analytics</p>
                </div>
              </>
            )}

            {activeView === "settings" && (
              <>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                  <p className="text-muted-foreground mt-1">Configure your dashboard</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column - CFO Agent Chat (resizable, only on dashboard) */}
        {activeView === "dashboard" && (
          <div className="hidden lg:flex relative h-screen">
            {/* Resize handle */}
            <div
              className={cn(
                "absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-20 hover:bg-primary/50 transition-colors",
                isResizing && "bg-primary"
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizing(true);
              }}
            />
            
            <div
              className={cn(
                "flex flex-col border-l border-border/50 transition-all duration-200 ease-out h-full",
                chatWidth <= 64 ? "w-16" : ""
              )}
              style={{ width: chatWidth > 64 ? `${chatWidth}px` : undefined }}
            >
              {chatWidth > 64 ? (
                <div className="p-4 h-full flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between mb-2 flex-shrink-0">
                    <h3 className="text-sm font-semibold">CFO Agent</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setChatWidth(64)}
                      title="Collapse chat"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <ExpandableChat className="h-full" />
                  </div>
                </div>
              ) : (
                <div className="p-2 flex flex-col items-center h-full">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 mb-2"
                    onClick={() => setChatWidth(384)}
                    title="Expand chat"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div className="flex-1 flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
