import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { KPICard } from "@/components/KPICard";
import { CashFlowChart } from "@/components/CashFlowChart";
import { ExpandableChat } from "@/components/ExpandableChat";
import { DataVisualization } from "@/components/DataVisualization";
import { TrendingUp, DollarSign, AlertCircle, TrendingDown, Receipt, CreditCard, Wallet, BarChart3 } from "lucide-react";

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

interface DashboardData {
  metrics: DashboardMetrics;
  dataTypes: string[];
  availableCategories: string[];
  timeRange: { start: string; end: string } | null;
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

  // Fetch dashboard metrics from knowledge base
  useEffect(() => {
    const fetchMetrics = async () => {
      if (activeView !== "dashboard") return;

      setMetricsLoading(true);
      setMetricsError(null);

      try {
        const sessionId = getSessionId();
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dashboard-metrics?sessionId=${sessionId}`;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            apikey: supabaseKey || "",
            Authorization: `Bearer ${supabaseKey || ""}`,
          },
        });

        const data = await response.json();
        
        // Log session ID from response headers for debugging
        const sessionIdFromHeader = response.headers.get("X-Session-Id");
        console.log("Response Headers - X-Session-Id:", sessionIdFromHeader);
        console.log("All Response Headers:", Object.fromEntries(response.headers.entries()));
        
        if (!response.ok || data.error) {
          const errorMessage = data.error || data.message || `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(errorMessage);
        }

        setDashboardData({
          metrics: data.metrics || {
            cashOnHand: null,
            monthlyBurnRate: null,
            overdueInvoices: null,
            revenue: null,
            expenses: null,
            profit: null,
            accountsReceivable: null,
            accountsPayable: null,
          },
          dataTypes: data.dataTypes || [],
          availableCategories: data.availableCategories || [],
          timeRange: data.timeRange || null,
        });
      } catch (error) {
        console.error("Error fetching dashboard metrics:", error);
        setMetricsError(error instanceof Error ? error.message : "Failed to load metrics");
        // Set default values on error
        setDashboardData({
          metrics: {
            cashOnHand: null,
            monthlyBurnRate: null,
            overdueInvoices: null,
            revenue: null,
            expenses: null,
            profit: null,
            accountsReceivable: null,
            accountsPayable: null,
          },
          dataTypes: [],
          availableCategories: [],
          timeRange: null,
        });
      } finally {
        setMetricsLoading(false);
      }
    };

    fetchMetrics();
  }, [activeView]);

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
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome, Business Owner</h1>
                  <p className="text-muted-foreground mt-1 text-sm sm:text-base">Here's your financial overview</p>
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

                    {/* Data Summary Section */}
                    {(dashboardData.dataTypes.length > 0 || dashboardData.availableCategories.length > 0 || dashboardData.timeRange) && (
                      <div className="bg-muted/30 border border-border/50 rounded-lg p-4 sm:p-6">
                        <h3 className="text-sm font-semibold mb-3">Data Overview</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                          {dashboardData.dataTypes.length > 0 && (
                            <div>
                              <p className="text-muted-foreground mb-1">Data Types</p>
                              <div className="flex flex-wrap gap-1">
                                {dashboardData.dataTypes.map((type, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-background rounded text-xs">
                                    {type}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {dashboardData.availableCategories.length > 0 && (
                            <div>
                              <p className="text-muted-foreground mb-1">Categories</p>
                              <div className="flex flex-wrap gap-1">
                                {dashboardData.availableCategories.slice(0, 5).map((cat, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-background rounded text-xs">
                                    {cat}
                                  </span>
                                ))}
                                {dashboardData.availableCategories.length > 5 && (
                                  <span className="px-2 py-1 bg-background rounded text-xs">
                                    +{dashboardData.availableCategories.length - 5} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          {dashboardData.timeRange && (
                            <div>
                              <p className="text-muted-foreground mb-1">Time Range</p>
                              <p className="text-xs">
                                {new Date(dashboardData.timeRange.start).toLocaleDateString()} - {new Date(dashboardData.timeRange.end).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

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

                {/* Cash Flow Chart */}
                <CashFlowChart />
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

        {/* Right Column - CFO Agent Chat (only on dashboard) */}
        {activeView === "dashboard" && (
          <div className="hidden lg:flex lg:w-96 border-l border-border/50 p-4 flex-col">
            <ExpandableChat className="h-[calc(100vh-2rem)]" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
