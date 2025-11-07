import { useState, useEffect } from "react";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

interface ChatVisualizationProps {
  data: any;
  compact?: boolean;
}

// Transform compliance graphData into chart-friendly format
function transformComplianceData(graphData: any) {
  const result: any = {
    complianceData: true,
  };

  // Transform compliant transactions (array of strings) into bar chart data
  if (graphData.compliantTransactions && Array.isArray(graphData.compliantTransactions)) {
    result.compliantTransactionsData = graphData.compliantTransactions.map((transactionId: string, index: number) => ({
      name: transactionId || `Transaction ${index + 1}`,
      count: 1
    }));
  }

  // Transform risks (array of strings) into bar chart data
  if (graphData.risks && Array.isArray(graphData.risks)) {
    result.risksData = graphData.risks.map((risk: string) => ({
      name: risk || 'Unknown Risk',
      count: 1
    }));
  }

  // Transform flagged transactions into bar chart data
  if (graphData.flaggedTransactions && Array.isArray(graphData.flaggedTransactions)) {
    result.flaggedTransactionsData = graphData.flaggedTransactions.map((item: any, index: number) => ({
      name: item.transactionId || `Transaction ${index + 1}`,
      count: 1,
      description: item.description || 'Flagged transaction'
    }));
  }

  // Transform non-compliant vendors into bar chart data
  if (graphData.nonCompliantVendors && Array.isArray(graphData.nonCompliantVendors)) {
    result.nonCompliantVendorsData = graphData.nonCompliantVendors.map((item: any) => ({
      name: item.vendorName || 'Unknown Vendor',
      count: item.transactionIds ? item.transactionIds.length : 1,
      transactionIds: item.transactionIds || []
    }));
  }

  // Transform missing documentation into bar chart data
  if (graphData.missingDocumentation && Array.isArray(graphData.missingDocumentation)) {
    result.missingDocumentationData = graphData.missingDocumentation.map((item: any, index: number) => ({
      name: item.transactionId || `Transaction ${index + 1}`,
      count: 1,
      missing: item.missing || 'Documentation'
    }));
  }

  // Transform manager verification required into bar chart data
  if (graphData.managerVerificationRequired && Array.isArray(graphData.managerVerificationRequired)) {
    result.managerVerificationData = graphData.managerVerificationRequired.map((item: any, index: number) => ({
      name: item.transactionId || `Transaction ${index + 1}`,
      count: 1,
      reason: item.reason || 'Verification required'
    }));
  }

  // Create summary pie chart data
  const summaryData = [];
  if (graphData.compliantTransactions?.length) {
    summaryData.push({ name: 'Compliant Transactions', value: graphData.compliantTransactions.length });
  }
  if (graphData.risks?.length) {
    summaryData.push({ name: 'Risks Detected', value: graphData.risks.length });
  }
  if (graphData.flaggedTransactions?.length) {
    summaryData.push({ name: 'Flagged Transactions', value: graphData.flaggedTransactions.length });
  }
  if (graphData.nonCompliantVendors?.length) {
    summaryData.push({ name: 'Non-Compliant Vendors', value: graphData.nonCompliantVendors.length });
  }
  if (graphData.missingDocumentation?.length) {
    summaryData.push({ name: 'Missing Documentation', value: graphData.missingDocumentation.length });
  }
  if (graphData.managerVerificationRequired?.length) {
    summaryData.push({ name: 'Needs Verification', value: graphData.managerVerificationRequired.length });
  }
  if (summaryData.length > 0) {
    result.complianceSummaryData = summaryData;
  }

  return result;
}

export function ChatVisualization({ data, compact = false }: ChatVisualizationProps) {
  const [enlargedChart, setEnlargedChart] = useState<string | null>(null); // Track which chart is enlarged
  const [processedData, setProcessedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const processData = async () => {
      if (!data) return;
      
      setIsLoading(true);
      try {
        // Handle compliance data directly (no need to call process-data endpoint)
        if (data.type === "compliance" && data.graphData) {
          const complianceData = transformComplianceData(data.graphData);
          setProcessedData(complianceData);
          setIsLoading(false);
          return;
        }

        // For other data types, use the process-data endpoint
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-data`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              data: data.data || data,
              type: data.type || "financial"
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to process data');
        }

        const result = await response.json();
        setProcessedData(result);
      } catch (error) {
        console.error('Error processing visualization data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    processData();
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 text-muted-foreground text-sm">
        Generating visualization...
      </div>
    );
  }

  if (!processedData) {
    return null;
  }

  // Render each chart type independently
  const renderLineChart = (enlarged = false) => {
    const height = enlarged ? 500 : (compact ? 200 : 320);
    const chartData = processedData.timeSeriesData || processedData.lineChartData;
    if (!chartData) return null;

    return (
      <div
        className={cn(
          "relative border border-border/50 rounded-lg bg-card p-3 mt-2",
          compact ? "max-w-md" : "w-full"
        )}
      >
        {!enlarged && (
          <div className="absolute top-2 right-2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setEnlargedChart("line")}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          </div>
        )}
        <h4 className="text-xs font-medium mb-2 text-muted-foreground">Time Series</h4>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={enlarged ? 12 : 10}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={enlarged ? 12 : 10}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))'
              }}
            />
            <Legend />
            {processedData.timeSeriesData && (
              <>
                <Line type="monotone" dataKey="income" stroke="hsl(var(--success))" strokeWidth={2} />
                <Line type="monotone" dataKey="expense" stroke="hsl(var(--destructive))" strokeWidth={2} />
                <Line type="monotone" dataKey="net" stroke="hsl(var(--primary))" strokeWidth={2} />
              </>
            )}
            {processedData.lineChartData && (
              <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderBarChart = (enlarged = false) => {
    const height = enlarged ? 500 : (compact ? 200 : 320);
    const chartData = processedData.barChartData || processedData.timeSeriesData;
    if (!chartData) return null;

    return (
      <div
        className={cn(
          "relative border border-border/50 rounded-lg bg-card p-3 mt-2",
          compact ? "max-w-md" : "w-full"
        )}
      >
        {!enlarged && (
          <div className="absolute top-2 right-2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setEnlargedChart("bar")}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          </div>
        )}
        <h4 className="text-xs font-medium mb-2 text-muted-foreground">Bar Chart</h4>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={enlarged ? 12 : 10}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={enlarged ? 12 : 10}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))'
              }}
            />
            <Legend />
            {processedData.barChartData && (
              <>
                <Bar dataKey="income" fill="hsl(var(--success))" />
                <Bar dataKey="expense" fill="hsl(var(--destructive))" />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderPieChart = (enlarged = false) => {
    const height = enlarged ? 500 : (compact ? 220 : 360);
    if (!processedData.pieChartData) return null;

    return (
      <div
        className={cn(
          "relative border border-border/50 rounded-lg bg-card p-3 mt-2",
          compact ? "max-w-md" : "w-full"
        )}
      >
        {!enlarged && (
          <div className="absolute top-2 right-2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setEnlargedChart("pie")}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          </div>
        )}
        <h4 className="text-xs font-medium mb-2 text-muted-foreground">Distribution</h4>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={processedData.pieChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={enlarged ? 180 : compact ? 80 : 130}
              fill="hsl(var(--primary))"
              dataKey="value"
            >
              {processedData.pieChartData.map((_: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Render compliance bar chart
  const renderComplianceBarChart = (chartData: any[], title: string, dataKey: string = "count", enlarged = false) => {
    if (!chartData || chartData.length === 0) return null;
    const height = enlarged ? 500 : (compact ? 200 : 320);

    return (
      <div
        className={cn(
          "relative border border-border/50 rounded-lg bg-card p-3 mt-2",
          compact ? "max-w-md" : "w-full"
        )}
      >
        {!enlarged && (
          <div className="absolute top-2 right-2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setEnlargedChart(`compliance-${title}`)}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          </div>
        )}
        <h4 className="text-xs font-medium mb-2 text-muted-foreground">{title}</h4>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={enlarged ? 12 : 10}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={enlarged ? 12 : 10}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))'
              }}
            />
            <Bar dataKey={dataKey} fill={title.includes("Compliant") ? "hsl(var(--success))" : "hsl(var(--destructive))"} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Render compliance summary pie chart
  const renderComplianceSummary = (enlarged = false) => {
    if (!processedData.complianceSummaryData) return null;
    const height = enlarged ? 500 : (compact ? 220 : 360);

    return (
      <div
        className={cn(
          "relative border border-border/50 rounded-lg bg-card p-3 mt-2",
          compact ? "max-w-md" : "w-full"
        )}
      >
        {!enlarged && (
          <div className="absolute top-2 right-2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setEnlargedChart("compliance-summary")}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          </div>
        )}
        <h4 className="text-xs font-medium mb-2 text-muted-foreground">Compliance Summary</h4>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={processedData.complianceSummaryData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={enlarged ? 180 : compact ? 80 : 130}
              fill="hsl(var(--primary))"
              dataKey="value"
            >
              {processedData.complianceSummaryData.map((_: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Determine which charts to show
  const isComplianceData = processedData?.complianceData;
  const hasTimeSeries = processedData?.timeSeriesData || processedData?.lineChartData;
  const hasBarData = processedData?.barChartData;
  const hasPieData = processedData?.pieChartData;

  // If compliance data, render compliance charts
  if (isComplianceData) {
    return (
      <>
        <div className="space-y-2">
          {processedData.complianceSummaryData && renderComplianceSummary(false)}
          {processedData.compliantTransactionsData && renderComplianceBarChart(
            processedData.compliantTransactionsData,
            "Compliant Transactions",
            "count",
            false
          )}
          {processedData.risksData && renderComplianceBarChart(
            processedData.risksData,
            "Risks Detected",
            "count",
            false
          )}
          {processedData.flaggedTransactionsData && renderComplianceBarChart(
            processedData.flaggedTransactionsData,
            "Flagged Transactions",
            "count",
            false
          )}
          {processedData.nonCompliantVendorsData && renderComplianceBarChart(
            processedData.nonCompliantVendorsData,
            "Non-Compliant Vendors",
            "count",
            false
          )}
          {processedData.missingDocumentationData && renderComplianceBarChart(
            processedData.missingDocumentationData,
            "Missing Documentation",
            "count",
            false
          )}
          {processedData.managerVerificationData && renderComplianceBarChart(
            processedData.managerVerificationData,
            "Manager Verification Required",
            "count",
            false
          )}
        </div>

        {/* Dialogs for enlarged compliance charts */}
        <Dialog open={enlargedChart === "compliance-summary"} onOpenChange={(open) => !open && setEnlargedChart(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Compliance Summary</h3>
              {renderComplianceSummary(true)}
            </div>
          </DialogContent>
        </Dialog>

        {processedData.flaggedTransactionsData && (
          <Dialog open={enlargedChart === "compliance-Flagged Transactions"} onOpenChange={(open) => !open && setEnlargedChart(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Flagged Transactions</h3>
                {renderComplianceBarChart(processedData.flaggedTransactionsData, "Flagged Transactions", "count", true)}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {processedData.nonCompliantVendorsData && (
          <Dialog open={enlargedChart === "compliance-Non-Compliant Vendors"} onOpenChange={(open) => !open && setEnlargedChart(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Non-Compliant Vendors</h3>
                {renderComplianceBarChart(processedData.nonCompliantVendorsData, "Non-Compliant Vendors", "count", true)}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {processedData.missingDocumentationData && (
          <Dialog open={enlargedChart === "compliance-Missing Documentation"} onOpenChange={(open) => !open && setEnlargedChart(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Missing Documentation</h3>
                {renderComplianceBarChart(processedData.missingDocumentationData, "Missing Documentation", "count", true)}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {processedData.managerVerificationData && (
          <Dialog open={enlargedChart === "compliance-Manager Verification Required"} onOpenChange={(open) => !open && setEnlargedChart(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Manager Verification Required</h3>
                {renderComplianceBarChart(processedData.managerVerificationData, "Manager Verification Required", "count", true)}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {processedData.compliantTransactionsData && (
          <Dialog open={enlargedChart === "compliance-Compliant Transactions"} onOpenChange={(open) => !open && setEnlargedChart(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Compliant Transactions</h3>
                {renderComplianceBarChart(processedData.compliantTransactionsData, "Compliant Transactions", "count", true)}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {processedData.risksData && (
          <Dialog open={enlargedChart === "compliance-Risks Detected"} onOpenChange={(open) => !open && setEnlargedChart(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Risks Detected</h3>
                {renderComplianceBarChart(processedData.risksData, "Risks Detected", "count", true)}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {hasTimeSeries && renderLineChart(false)}
        {hasBarData && renderBarChart(false)}
        {hasPieData && renderPieChart(false)}
      </div>

      {/* Individual dialogs for each chart type */}
      <Dialog open={enlargedChart === "line"} onOpenChange={(open) => !open && setEnlargedChart(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Time Series Chart</h3>
            {renderLineChart(true)}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={enlargedChart === "bar"} onOpenChange={(open) => !open && setEnlargedChart(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Bar Chart</h3>
            {renderBarChart(true)}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={enlargedChart === "pie"} onOpenChange={(open) => !open && setEnlargedChart(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Distribution Chart</h3>
            {renderPieChart(true)}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

