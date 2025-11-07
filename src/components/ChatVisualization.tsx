import { useState, useEffect } from "react";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

interface ChatVisualizationProps {
  data: any;
  compact?: boolean;
}

// Parse markdown tables from text
function parseMarkdownTables(text: string): any[] {
  const tables: any[] = [];
  // Match markdown table pattern: | Header1 | Header2 | ... |
  // More flexible regex that handles various table formats
  const tableRegex = /\|(.+)\|\s*\n\|[-\s|:]+\|\s*\n((?:\|.+\|\s*\n?)+)/g;
  let match;
  
  while ((match = tableRegex.exec(text)) !== null) {
    const headerRow = match[1];
    const dataRows = match[2].trim().split('\n').filter(row => row.trim());
    
    const headers = headerRow.split('|').map(h => h.trim()).filter(h => h);
    
    if (headers.length === 0) continue;
    
    const rows = dataRows.map(row => {
      const cells = row.split('|').map(c => c.trim()).filter(c => c);
      const rowData: any = {};
      headers.forEach((header, index) => {
        const cellValue = cells[index] || '';
        // Try to parse numbers
        const numValue = parseFloat(cellValue.replace(/[^0-9.-]/g, ''));
        rowData[header] = !isNaN(numValue) && cellValue.trim() !== '' ? numValue : cellValue;
      });
      return rowData;
    }).filter(row => Object.keys(row).length > 0);
    
    if (rows.length > 0) {
      tables.push({ headers, rows });
    }
  }
  
  return tables;
}

// Parse compliance checklists and regulations from text
function parseComplianceData(text: string): any {
  const complianceData: any = {
    checklists: [],
    regulations: [],
    statusBreakdown: {
      completed: 0,
      inProgress: 0,
      pending: 0
    }
  };
  
  // Parse checklists (format: - Checklist Name (ID): Status (Last completed/Due on date))
  const checklistRegex = /-\s*([^:]+)\s*\(([^)]+)\):\s*([^(]+)\s*\(([^)]+)\)/g;
  let match;
  
  while ((match = checklistRegex.exec(text)) !== null) {
    const name = match[1].trim();
    const id = match[2].trim();
    const status = match[3].trim();
    const dateInfo = match[4].trim();
    
    // Determine status type
    let statusType = 'pending';
    if (status.toLowerCase().includes('completed')) {
      statusType = 'completed';
      complianceData.statusBreakdown.completed++;
    } else if (status.toLowerCase().includes('in progress') || status.toLowerCase().includes('in-progress')) {
      statusType = 'inProgress';
      complianceData.statusBreakdown.inProgress++;
    } else {
      complianceData.statusBreakdown.pending++;
    }
    
    // Extract date
    const dateMatch = dateInfo.match(/(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : null;
    
    complianceData.checklists.push({
      id,
      name,
      status,
      statusType,
      date,
      dateInfo
    });
  }
  
  // Parse regulations (format: - Regulation Name (ID): Description)
  const regulationRegex = /-\s*([^:]+)\s*\(([^)]+)\):\s*(.+)/g;
  while ((match = regulationRegex.exec(text)) !== null) {
    const name = match[1].trim();
    const id = match[2].trim();
    const description = match[3].trim();
    
    complianceData.regulations.push({
      id,
      name,
      description
    });
  }
  
  return complianceData;
}

// Extract metrics and numerical data from text
function extractMetricsFromText(text: string): any {
  const metrics: any = {
    keyValuePairs: [],
    percentages: [],
    currencyValues: [],
    numbers: []
  };
  
  // Extract key-value pairs (e.g., "Total Revenue: $120,000" or "Revenue: 120000")
  // More flexible pattern that handles various formats
  const keyValuePatterns = [
    /([A-Za-z\s&]+):\s*\$?([\d,]+\.?\d*)\s*(?:%|dollars?|USD)?/gi,
    /([A-Za-z\s&]+)\s*[:\-]\s*\$?([\d,]+\.?\d*)/gi,
    /\*\*([A-Za-z\s&]+)\*\*:\s*\$?([\d,]+\.?\d*)/gi,
    /-\s*([A-Za-z\s&]+):\s*\$?([\d,]+\.?\d*)/gi, // Handle bullet points with dashes
    /([A-Za-z\s&]+)\s*[:\-]\s*\$?([\d,]+\.?\d*)\s*\(/gi // Handle values with parentheses
  ];
  
  keyValuePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const key = match[1].trim().replace(/\*\*/g, '');
      const valueStr = match[2].replace(/,/g, '');
      const value = parseFloat(valueStr);
      if (!isNaN(value) && value > 0 && key.length > 2) {
        // Avoid duplicates
        const exists = metrics.keyValuePairs.some((kv: any) => 
          kv.key.toLowerCase() === key.toLowerCase()
        );
        if (!exists) {
          metrics.keyValuePairs.push({ key, value });
        }
      }
    }
  });
  
  // Extract percentages with context (e.g., "91.5%" or "Compliance: 91.5%")
  const percentRegex = /([A-Za-z\s&]+)?\s*([\d,]+\.?\d*)\s*%/gi;
  let match;
  while ((match = percentRegex.exec(text)) !== null) {
    const context = match[1]?.trim() || 'Percentage';
    const value = parseFloat(match[2].replace(/,/g, ''));
    if (!isNaN(value) && value >= 0 && value <= 100) {
      metrics.percentages.push({ name: context, value });
    }
  }
  
  // Extract currency values with context
  const currencyRegex = /([A-Za-z\s&]+)?\s*\$([\d,]+\.?\d*)/gi;
  while ((match = currencyRegex.exec(text)) !== null) {
    const context = match[1]?.trim() || 'Amount';
    const value = parseFloat(match[2].replace(/,/g, ''));
    if (!isNaN(value) && value > 0) {
      // Check if we already have this as a key-value pair
      const exists = metrics.keyValuePairs.some((kv: any) => 
        kv.key.toLowerCase().includes(context.toLowerCase()) || 
        context.toLowerCase().includes(kv.key.toLowerCase())
      );
      if (!exists && context.length > 2) {
        metrics.keyValuePairs.push({ key: context, value });
      }
    }
  }
  
  // Limit to top 10 key-value pairs to avoid clutter
  metrics.keyValuePairs = metrics.keyValuePairs
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 10);
  
  return metrics;
}

// Convert extracted metrics to chart data
function metricsToChartData(metrics: any): any {
  const chartData: any = {};
  
  // If we have key-value pairs, create bar chart data
  if (metrics.keyValuePairs.length > 0) {
    chartData.barChartData = metrics.keyValuePairs.map((kv: any) => ({
      name: kv.key,
      value: kv.value
    }));
  }
  
  // If we have percentages, create pie chart data
  if (metrics.percentages.length > 0) {
    chartData.pieChartData = metrics.percentages.map((val: number, idx: number) => ({
      name: `Metric ${idx + 1}`,
      value: val
    }));
  }
  
  return chartData;
}

// Transform compliance graphData into chart-friendly format
function transformComplianceData(graphData: any) {
  const result: any = {
    complianceData: true,
  };

  // Handle new format: compliantTransactions and nonCompliantTransactions as numbers
  if (typeof graphData.compliantTransactions === 'number' || typeof graphData.nonCompliantTransactions === 'number') {
    result.complianceBarData = [
      {
        name: 'Compliant',
        count: graphData.compliantTransactions || 0,
        value: graphData.compliantTransactions || 0
      },
      {
        name: 'Non-Compliant',
        count: graphData.nonCompliantTransactions || 0,
        value: graphData.nonCompliantTransactions || 0
      }
    ];
    
    // Create pie chart data
    result.compliancePieData = [
      { name: 'Compliant Transactions', value: graphData.compliantTransactions || 0 },
      { name: 'Non-Compliant Transactions', value: graphData.nonCompliantTransactions || 0 }
    ];
    return result;
  }

  // Legacy format: Transform compliant transactions (array of strings) into bar chart data
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

// Transform expense graphData into chart-friendly format
function transformExpenseData(graphData: any) {
  const result: any = {
    expenseData: true,
  };

  // Handle new format: expensesByCategory as object
  if (graphData.expensesByCategory && typeof graphData.expensesByCategory === 'object') {
    result.expenseCategoryData = Object.entries(graphData.expensesByCategory).map(([category, value]) => ({
      name: category,
      value: typeof value === 'number' ? value : 0,
      amount: typeof value === 'number' ? value : 0
    }));
  }

  // Handle total expenses
  if (graphData.totalExpenses !== undefined) {
    result.totalExpenses = graphData.totalExpenses;
  }

  // Legacy format: Handle expense categories as array
  if (graphData.categories && Array.isArray(graphData.categories)) {
    result.expenseCategoryData = graphData.categories.map((cat: any) => ({
      name: cat.name || cat.category || 'Unknown',
      value: cat.amount || cat.value || 0,
      amount: cat.amount || cat.value || 0
    }));
  }

  // Handle time series expense data
  if (graphData.timeSeries && Array.isArray(graphData.timeSeries)) {
    result.timeSeriesData = graphData.timeSeries.map((item: any) => ({
      date: item.date || item.month || item.period,
      expense: item.amount || item.expense || item.value || 0,
      category: item.category || 'Other'
    }));
  }

  // Handle top expenses
  if (graphData.topExpenses && Array.isArray(graphData.topExpenses)) {
    result.topExpensesData = graphData.topExpenses.map((exp: any) => ({
      name: exp.name || exp.description || 'Expense',
      value: exp.amount || exp.value || 0
    }));
  }

  return result;
}

// Transform income graphData into chart-friendly format
function transformIncomeData(graphData: any) {
  const result: any = {
    incomeData: true,
  };

  // Handle incomeByChannel as object (similar to expense format)
  if (graphData.incomeByChannel && typeof graphData.incomeByChannel === 'object') {
    result.revenueChannelData = Object.entries(graphData.incomeByChannel).map(([channel, value]) => ({
      name: channel,
      value: typeof value === 'number' ? value : 0,
      amount: typeof value === 'number' ? value : 0
    }));
  }

  // Handle incomeBySource as object
  if (graphData.incomeBySource && typeof graphData.incomeBySource === 'object') {
    result.incomeSourceData = Object.entries(graphData.incomeBySource).map(([source, value]) => ({
      name: source,
      value: typeof value === 'number' ? value : 0,
      amount: typeof value === 'number' ? value : 0
    }));
  }

  // Handle total income
  if (graphData.totalIncome !== undefined) {
    result.totalIncome = graphData.totalIncome;
  }

  // Legacy format: Handle income sources as array
  if (graphData.sources && Array.isArray(graphData.sources)) {
    result.incomeSourceData = graphData.sources.map((source: any) => ({
      name: source.name || source.source || 'Unknown',
      value: source.amount || source.value || 0,
      amount: source.amount || source.value || 0
    }));
  }

  // Handle time series income data
  if (graphData.timeSeries && Array.isArray(graphData.timeSeries)) {
    result.timeSeriesData = graphData.timeSeries.map((item: any) => ({
      date: item.date || item.month || item.period,
      income: item.amount || item.income || item.value || 0,
      source: item.source || 'Other'
    }));
  }

  // Legacy format: Handle revenue channels as array
  if (graphData.channels && Array.isArray(graphData.channels)) {
    result.revenueChannelData = graphData.channels.map((channel: any) => ({
      name: channel.name || channel.channel || 'Unknown',
      value: channel.amount || channel.value || 0
    }));
  }

  return result;
}

// Transform reporting graphData into chart-friendly format
function transformReportingData(graphData: any) {
  const result: any = {
    reportingData: true,
  };

  // Handle financial metrics
  if (graphData.metrics) {
    result.metrics = graphData.metrics;
  }

  // Handle time series data (monthly/yearly breakdown)
  if (graphData.timeSeries && Array.isArray(graphData.timeSeries)) {
    result.timeSeriesData = graphData.timeSeries.map((item: any) => ({
      date: item.date || item.month || item.period || item.year,
      income: item.income || item.revenue || 0,
      expense: item.expense || item.expenses || 0,
      net: item.net || item.profit || (item.income || item.revenue || 0) - (item.expense || item.expenses || 0)
    }));
  }

  // Handle monthlyData format
  if (graphData.monthlyData && Array.isArray(graphData.monthlyData)) {
    result.timeSeriesData = graphData.monthlyData.map((item: any) => ({
      date: item.month || item.date,
      income: item.income || item.revenue || 0,
      expense: item.expenses || item.expense || 0,
      net: item.net || item.cashFlow || (item.income || 0) - (item.expenses || 0)
    }));
  }

  // Handle yearlyData format
  if (graphData.yearlyData && Array.isArray(graphData.yearlyData)) {
    result.yearlyData = graphData.yearlyData.map((item: any) => ({
      date: item.year || item.date,
      income: item.income || item.revenue || 0,
      expense: item.expenses || item.expense || 0,
      net: item.net || item.cashFlow || (item.income || 0) - (item.expenses || 0)
    }));
  }

  // Handle category breakdowns as object
  if (graphData.categoriesByType && typeof graphData.categoriesByType === 'object') {
    result.categoryData = Object.entries(graphData.categoriesByType).map(([category, value]) => ({
      name: category,
      value: typeof value === 'number' ? value : 0
    }));
  }

  // Legacy format: Handle category breakdowns as array
  if (graphData.categories && Array.isArray(graphData.categories)) {
    result.categoryData = graphData.categories.map((cat: any) => ({
      name: cat.name || cat.category || 'Unknown',
      value: cat.amount || cat.value || 0
    }));
  }

  // Handle comparisons (e.g., month-over-month, year-over-year)
  if (graphData.comparison && Array.isArray(graphData.comparison)) {
    result.comparisonData = graphData.comparison;
  }

  // Handle key financial metrics
  if (graphData.totalRevenue !== undefined) {
    result.totalRevenue = graphData.totalRevenue;
  }
  if (graphData.totalExpenses !== undefined) {
    result.totalExpenses = graphData.totalExpenses;
  }
  if (graphData.netProfit !== undefined) {
    result.netProfit = graphData.netProfit;
  }

  return result;
}

export function ChatVisualization({ data, compact = false }: ChatVisualizationProps) {
  const [enlargedChart, setEnlargedChart] = useState<string | null>(null); // Track which chart is enlarged
  const [processedData, setProcessedData] = useState<any>(null);
  const [extractedTables, setExtractedTables] = useState<any[]>([]);
  const [extractedMetrics, setExtractedMetrics] = useState<any>(null);
  const [complianceData, setComplianceData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const processData = async () => {
      if (!data) return;
      
      setIsLoading(true);
      try {
        // Extract tables and metrics from chatOutput if available
        let tables: any[] = [];
        let metrics: any = null;
        let compliance: any = null;
        
        if (data.chatOutput) {
          tables = parseMarkdownTables(data.chatOutput);
          if (tables.length > 0) {
            setExtractedTables(tables);
          }
          
          metrics = extractMetricsFromText(data.chatOutput);
          if (metrics.keyValuePairs.length > 0 || metrics.percentages.length > 0 || metrics.currencyValues.length > 0) {
            setExtractedMetrics(metrics);
          }
          
          // Check if this is a compliance report with checklists/regulations
          if (data.chatOutput.toLowerCase().includes('compliance report') || 
              data.chatOutput.includes('CHK_') || 
              data.chatOutput.includes('REG_')) {
            compliance = parseComplianceData(data.chatOutput);
            if (compliance.checklists.length > 0 || compliance.regulations.length > 0) {
              setComplianceData(compliance);
            }
          }
        }

        // Handle new format with requestType
        if (data.requestType && data.graphData) {
          let transformedData;
          switch (data.requestType.toLowerCase()) {
            case 'compliance':
              transformedData = transformComplianceData(data.graphData);
              break;
            case 'expense':
              transformedData = transformExpenseData(data.graphData);
              break;
            case 'income':
              transformedData = transformIncomeData(data.graphData);
              break;
            case 'reporting':
              transformedData = transformReportingData(data.graphData);
              break;
            default:
              // Fallback to compliance if unknown type
              transformedData = transformComplianceData(data.graphData);
          }
          
          // Merge extracted metrics with graphData if no graphData charts exist
          if (metrics && (!transformedData.barChartData && !transformedData.pieChartData)) {
            const chartData = metricsToChartData(metrics);
            Object.assign(transformedData, chartData);
          }
          
          setProcessedData(transformedData);
            setIsLoading(false);
            return;
          }

        // Handle legacy compliance data (backward compatibility)
        if (data.type === "compliance" && data.graphData) {
          const complianceData = transformComplianceData(data.graphData);
          setProcessedData(complianceData);
          setIsLoading(false);
          return;
        }

        // If we only have chatOutput with tables/metrics/compliance but no graphData, still process it
        if (data.chatOutput && (!data.graphData && !data.data)) {
          if (tables.length > 0 || metrics || compliance) {
            const chartData = metrics ? metricsToChartData(metrics) : {};
            setProcessedData(chartData);
            setIsLoading(false);
            return;
          }
        }
        
        // If we have chatOutput but no processed data yet, still show extracted data
        if (data.chatOutput && !processedData && (tables.length > 0 || metrics || compliance)) {
          const chartData = metrics ? metricsToChartData(metrics) : {};
          setProcessedData(chartData);
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

  // Show extracted data even if no processedData
  if (!processedData && extractedTables.length === 0 && !extractedMetrics && !complianceData) {
    return null;
  }
  
  // If we only have extracted data (tables, metrics, compliance) but no processedData, show it
  if (!processedData && (extractedTables.length > 0 || extractedMetrics || complianceData)) {
    return (
      <>
        <div className="space-y-2">
          {renderExtractedData()}
        </div>
        
        {/* Dialogs for extracted metrics */}
        {extractedMetrics && (
          <Dialog open={enlargedChart === "extracted-metrics"} onOpenChange={(open) => !open && setEnlargedChart(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Key Metrics</h3>
                {renderExtractedMetricsChart(extractedMetrics, true)}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Dialogs for table category charts */}
        {extractedTables.map((table, idx) => {
          const tableChartData = tableToChartData(table);
          if (!tableChartData.categoryData || tableChartData.categoryData.length === 0) return null;
          
          return (
            <Dialog key={idx} open={enlargedChart === `table-${idx}-category`} onOpenChange={(open) => !open && setEnlargedChart(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Category Breakdown</h3>
                  <ResponsiveContainer width="100%" height={500}>
                    <PieChart>
                      <Pie
                        data={tableChartData.categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={180}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                      >
                        {tableChartData.categoryData.map((_: any, cellIdx: number) => (
                          <Cell key={`cell-${cellIdx}`} fill={COLORS[cellIdx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))'
                        }}
                        formatter={(value: number) => `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </DialogContent>
            </Dialog>
          );
        })}

        {/* Dialog for compliance status chart */}
        {complianceData && complianceData.statusBreakdown && (
          <Dialog open={enlargedChart === "compliance-status"} onOpenChange={(open) => !open && setEnlargedChart(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Compliance Status Breakdown</h3>
                <ResponsiveContainer width="100%" height={500}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Completed', value: complianceData.statusBreakdown.completed, color: 'hsl(var(--success))' },
                        { name: 'In Progress', value: complianceData.statusBreakdown.inProgress, color: 'hsl(var(--warning))' },
                        { name: 'Pending', value: complianceData.statusBreakdown.pending, color: 'hsl(var(--destructive))' }
                      ].filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={180}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {[
                        { name: 'Completed', value: complianceData.statusBreakdown.completed, color: 'hsl(var(--success))' },
                        { name: 'In Progress', value: complianceData.statusBreakdown.inProgress, color: 'hsl(var(--warning))' },
                        { name: 'Pending', value: complianceData.statusBreakdown.pending, color: 'hsl(var(--destructive))' }
                      ].filter(item => item.value > 0).map((item: any, idx: number) => (
                        <Cell key={`cell-${idx}`} fill={item.color} />
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
            </DialogContent>
          </Dialog>
        )}
      </>
    );
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

  // Convert table data to chart data if it contains financial information
  function tableToChartData(table: any): any {
    const chartData: any = {};
    
    if (!table.headers || !table.rows || table.rows.length === 0) return chartData;
    
    // Check if table has Category and Amount columns (expense breakdown)
    const categoryIdx = table.headers.findIndex((h: string) => 
      h.toLowerCase().includes('category') || h.toLowerCase().includes('type')
    );
    const amountIdx = table.headers.findIndex((h: string) => 
      h.toLowerCase().includes('amount') || h.toLowerCase().includes('value') || h.toLowerCase().includes('cost')
    );
    
    if (categoryIdx >= 0 && amountIdx >= 0) {
      // Group by category and sum amounts
      const categoryMap: Record<string, number> = {};
      table.rows.forEach((row: any) => {
        const category = row[table.headers[categoryIdx]] || 'Other';
        const amountStr = row[table.headers[amountIdx]] || '0';
        const amount = parseFloat(amountStr.toString().replace(/[^0-9.-]/g, ''));
        if (!isNaN(amount)) {
          categoryMap[category] = (categoryMap[category] || 0) + amount;
        }
      });
      
      if (Object.keys(categoryMap).length > 0) {
        chartData.categoryData = Object.entries(categoryMap).map(([name, value]) => ({
          name,
          value: value as number
        }));
      }
    }
    
    // Check if table has Date and Amount (time series)
    const dateIdx = table.headers.findIndex((h: string) => 
      h.toLowerCase().includes('date') || h.toLowerCase().includes('month') || h.toLowerCase().includes('period')
    );
    
    if (dateIdx >= 0 && amountIdx >= 0) {
      const timeSeriesData = table.rows.map((row: any) => {
        const date = row[table.headers[dateIdx]] || '';
        const amountStr = row[table.headers[amountIdx]] || '0';
        const amount = parseFloat(amountStr.toString().replace(/[^0-9.-]/g, ''));
        return {
          date: date.toString(),
          value: isNaN(amount) ? 0 : amount
        };
      }).filter((item: any) => item.date);
      
      if (timeSeriesData.length > 0) {
        chartData.timeSeriesData = timeSeriesData;
      }
    }
    
    return chartData;
  }

  // Render markdown table
  const renderTable = (table: any, index: number) => {
    if (!table.headers || !table.rows || table.rows.length === 0) return null;
    
    // Check if we can create charts from this table
    const tableChartData = tableToChartData(table);
    const hasCategoryChart = tableChartData.categoryData && tableChartData.categoryData.length > 0;
    
    return (
      <div key={index} className="space-y-2">
        <div
          className={cn(
            "relative border border-border/50 rounded-lg bg-card p-4 mt-2 overflow-x-auto",
            compact ? "max-w-md" : "w-full"
          )}
        >
          <h4 className="text-xs font-medium mb-3 text-muted-foreground">Data Table</h4>
          <Table>
            <TableHeader>
              <TableRow>
                {table.headers.map((header: string, idx: number) => (
                  <TableHead key={idx}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.rows.map((row: any, rowIdx: number) => (
                <TableRow key={rowIdx}>
                  {table.headers.map((header: string, colIdx: number) => {
                    const cellValue = row[header] || '';
                    // Check if value is a number and format it
                    const numValue = parseFloat(cellValue.toString().replace(/[^0-9.-]/g, ''));
                    const isNumber = !isNaN(numValue) && cellValue.toString().trim() !== '';
                    
                    return (
                      <TableCell key={colIdx}>
                        {isNumber && cellValue.toString().includes('$') 
                          ? cellValue 
                          : isNumber 
                          ? numValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : cellValue}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Render category breakdown chart if available */}
        {hasCategoryChart && (
          <div
            className={cn(
              "relative border border-border/50 rounded-lg bg-card p-3 mt-2",
              compact ? "max-w-md" : "w-full"
            )}
          >
            {enlargedChart !== `table-${index}-category` && (
              <div className="absolute top-2 right-2 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setEnlargedChart(`table-${index}-category`)}
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
              </div>
            )}
            <h4 className="text-xs font-medium mb-2 text-muted-foreground">Category Breakdown</h4>
            <ResponsiveContainer width="100%" height={enlargedChart === `table-${index}-category` ? 500 : (compact ? 220 : 360)}>
              <PieChart>
                <Pie
                  data={tableChartData.categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={enlargedChart === `table-${index}-category` ? 180 : compact ? 80 : 130}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {tableChartData.categoryData.map((_: any, idx: number) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))'
                  }}
                  formatter={(value: number) => `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  // Render metrics as bar chart if extracted from text
  const renderExtractedMetricsChart = (metrics: any, enlarged = false) => {
    if (!metrics || !metrics.keyValuePairs || metrics.keyValuePairs.length === 0) return null;
    
    const height = enlarged ? 500 : (compact ? 200 : 320);
    const chartData = metrics.keyValuePairs.map((kv: any) => ({
      name: kv.key,
      value: kv.value
    }));

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
              onClick={() => setEnlargedChart("extracted-metrics")}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          </div>
        )}
        <h4 className="text-xs font-medium mb-2 text-muted-foreground">Key Metrics</h4>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} />
            <YAxis 
              dataKey="name" 
              type="category" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              width={120}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))'
              }}
              formatter={(value: number) => `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            />
            <Bar dataKey="value" fill="hsl(var(--primary))" />
          </BarChart>
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
  const isExpenseData = processedData?.expenseData;
  const isIncomeData = processedData?.incomeData;
  const isReportingData = processedData?.reportingData;
  const hasTimeSeries = processedData?.timeSeriesData || processedData?.lineChartData;
  const hasBarData = processedData?.barChartData;
  const hasPieData = processedData?.pieChartData || processedData?.expenseCategoryData || processedData?.incomeSourceData || processedData?.revenueChannelData || processedData?.categoryData;

  // Render compliance checklists and regulations
  const renderComplianceReport = () => {
    if (!complianceData || (complianceData.checklists.length === 0 && complianceData.regulations.length === 0)) {
      return null;
    }
    
    const statusData = [
      { name: 'Completed', value: complianceData.statusBreakdown.completed, color: 'hsl(var(--success))' },
      { name: 'In Progress', value: complianceData.statusBreakdown.inProgress, color: 'hsl(var(--warning))' },
      { name: 'Pending', value: complianceData.statusBreakdown.pending, color: 'hsl(var(--destructive))' }
    ].filter(item => item.value > 0);

    return (
      <div className="space-y-4 mb-4">
        {/* Status Breakdown Chart */}
        {statusData.length > 0 && (
      <div
        className={cn(
          "relative border border-border/50 rounded-lg bg-card p-3 mt-2",
          compact ? "max-w-md" : "w-full"
        )}
      >
            {enlargedChart !== "compliance-status" && (
          <div className="absolute top-2 right-2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
                  onClick={() => setEnlargedChart("compliance-status")}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          </div>
        )}
            <h4 className="text-xs font-medium mb-2 text-muted-foreground">Compliance Status Breakdown</h4>
            <ResponsiveContainer width="100%" height={enlargedChart === "compliance-status" ? 500 : (compact ? 220 : 360)}>
          <PieChart>
            <Pie
                  data={statusData}
              cx="50%"
              cy="50%"
              labelLine={false}
                  label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={enlargedChart === "compliance-status" ? 180 : compact ? 80 : 130}
              fill="hsl(var(--primary))"
              dataKey="value"
            >
                  {statusData.map((item: any, idx: number) => (
                    <Cell key={`cell-${idx}`} fill={item.color} />
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
        )}
        
        {/* Checklists Table */}
        {complianceData.checklists.length > 0 && (
          <div
            className={cn(
              "relative border border-border/50 rounded-lg bg-card p-4 mt-2 overflow-x-auto",
              compact ? "max-w-md" : "w-full"
            )}
          >
            <h4 className="text-xs font-medium mb-3 text-muted-foreground">Compliance Checklists</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complianceData.checklists.map((item: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-xs">{item.id}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2 py-1 rounded text-xs",
                        item.statusType === 'completed' && "bg-green-500/20 text-green-600 dark:text-green-400",
                        item.statusType === 'inProgress' && "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
                        item.statusType === 'pending' && "bg-red-500/20 text-red-600 dark:text-red-400"
                      )}>
                        {item.status}
                    </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.dateInfo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </div>
        )}
        
        {/* Regulations Table */}
        {complianceData.regulations.length > 0 && (
          <div
            className={cn(
              "relative border border-border/50 rounded-lg bg-card p-4 mt-2 overflow-x-auto",
              compact ? "max-w-md" : "w-full"
            )}
          >
            <h4 className="text-xs font-medium mb-3 text-muted-foreground">Regulations</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Requirement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complianceData.regulations.map((item: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-xs">{item.id}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </div>
        )}
      </div>
    );
  };

  // Render extracted tables and metrics first (if available)
  const renderExtractedData = () => {
    if (extractedTables.length === 0 && !extractedMetrics && !complianceData) return null;
    
    // Collect all chart data from tables
    const allTableChartData: any = {
      categoryData: [],
      timeSeriesData: []
    };
    
    extractedTables.forEach((table) => {
      const chartData = tableToChartData(table);
      if (chartData.categoryData) {
        // Merge category data
        chartData.categoryData.forEach((item: any) => {
          const existing = allTableChartData.categoryData.find((c: any) => c.name === item.name);
          if (existing) {
            existing.value += item.value;
          } else {
            allTableChartData.categoryData.push({ ...item });
          }
        });
      }
      if (chartData.timeSeriesData) {
        allTableChartData.timeSeriesData.push(...chartData.timeSeriesData);
      }
    });
    
    return (
      <div className="space-y-2 mb-4">
        {/* Render compliance report first if available */}
        {renderComplianceReport()}
        
        {/* Render extracted tables */}
        {extractedTables.map((table, idx) => renderTable(table, idx))}
        
        {/* Render aggregated category chart if we have data from multiple tables */}
        {allTableChartData.categoryData.length > 0 && extractedTables.length > 1 && (
          <div
            className={cn(
              "relative border border-border/50 rounded-lg bg-card p-3 mt-2",
              compact ? "max-w-md" : "w-full"
            )}
          >
            {enlargedChart !== "aggregated-category" && (
              <div className="absolute top-2 right-2 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setEnlargedChart("aggregated-category")}
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
            </div>
          )}
            <h4 className="text-xs font-medium mb-2 text-muted-foreground">Aggregated Category Breakdown</h4>
            <ResponsiveContainer width="100%" height={enlargedChart === "aggregated-category" ? 500 : (compact ? 220 : 360)}>
              <PieChart>
                <Pie
                  data={allTableChartData.categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={enlargedChart === "aggregated-category" ? 180 : compact ? 80 : 130}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {allTableChartData.categoryData.map((_: any, idx: number) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))'
                  }}
                  formatter={(value: number) => `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
              </PieChart>
            </ResponsiveContainer>
        </div>
        )}
        
        {/* Render extracted metrics as chart */}
        {extractedMetrics && renderExtractedMetricsChart(extractedMetrics, enlargedChart === "extracted-metrics")}
              </div>
    );
  };

  // If compliance data, render compliance charts
  if (isComplianceData) {
    return (
      <>
        <div className="space-y-2">
          {/* Render extracted tables and metrics first */}
          {renderExtractedData()}
          
          {/* New format: Simple compliant vs non-compliant */}
          {processedData.complianceBarData && (
            <>
              {renderComplianceBarChart(
                processedData.complianceBarData,
                "Compliance Overview",
                "value",
                enlargedChart === "compliance-bar"
              )}
              {processedData.compliancePieData && (
      <div
        className={cn(
          "relative border border-border/50 rounded-lg bg-card p-3 mt-2",
          compact ? "max-w-md" : "w-full"
        )}
      >
                  {enlargedChart !== "compliance-pie" && (
          <div className="absolute top-2 right-2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
                        onClick={() => setEnlargedChart("compliance-pie")}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          </div>
        )}
                  <h4 className="text-xs font-medium mb-2 text-muted-foreground">Compliance Distribution</h4>
                  <ResponsiveContainer width="100%" height={enlargedChart === "compliance-pie" ? 500 : (compact ? 220 : 360)}>
          <PieChart>
            <Pie
                        data={processedData.compliancePieData}
              cx="50%"
              cy="50%"
              labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={enlargedChart === "compliance-pie" ? 180 : compact ? 80 : 130}
              fill="hsl(var(--primary))"
              dataKey="value"
            >
                        {processedData.compliancePieData.map((_: any, index: number) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index === 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"} 
                          />
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
          )}
            </>
          )}
          {/* Legacy format */}
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

        {/* Dialog for extracted metrics */}
        {extractedMetrics && (
          <Dialog open={enlargedChart === "extracted-metrics"} onOpenChange={(open) => !open && setEnlargedChart(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Key Metrics</h3>
                {renderExtractedMetricsChart(extractedMetrics, true)}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Dialogs for table category charts */}
        {extractedTables.map((table, idx) => {
          const tableChartData = tableToChartData(table);
          if (!tableChartData.categoryData || tableChartData.categoryData.length === 0) return null;
          
          return (
            <Dialog key={idx} open={enlargedChart === `table-${idx}-category`} onOpenChange={(open) => !open && setEnlargedChart(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Category Breakdown</h3>
                  <ResponsiveContainer width="100%" height={500}>
                    <PieChart>
                      <Pie
                        data={tableChartData.categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={180}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                      >
                        {tableChartData.categoryData.map((_: any, cellIdx: number) => (
                          <Cell key={`cell-${cellIdx}`} fill={COLORS[cellIdx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))'
                        }}
                        formatter={(value: number) => `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </DialogContent>
            </Dialog>
          );
        })}

        {/* Dialog for compliance status chart */}
        {complianceData && complianceData.statusBreakdown && (
          <Dialog open={enlargedChart === "compliance-status"} onOpenChange={(open) => !open && setEnlargedChart(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Compliance Status Breakdown</h3>
                <ResponsiveContainer width="100%" height={500}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Completed', value: complianceData.statusBreakdown.completed, color: 'hsl(var(--success))' },
                        { name: 'In Progress', value: complianceData.statusBreakdown.inProgress, color: 'hsl(var(--warning))' },
                        { name: 'Pending', value: complianceData.statusBreakdown.pending, color: 'hsl(var(--destructive))' }
                      ].filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={180}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {[
                        { name: 'Completed', value: complianceData.statusBreakdown.completed, color: 'hsl(var(--success))' },
                        { name: 'In Progress', value: complianceData.statusBreakdown.inProgress, color: 'hsl(var(--warning))' },
                        { name: 'Pending', value: complianceData.statusBreakdown.pending, color: 'hsl(var(--destructive))' }
                      ].filter(item => item.value > 0).map((item: any, idx: number) => (
                        <Cell key={`cell-${idx}`} fill={item.color} />
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
            </DialogContent>
          </Dialog>
        )}
      </>
    );
  }

  // If expense data, render expense charts
  if (isExpenseData) {
  return (
    <>
      <div className="space-y-2">
          {/* Render extracted tables and metrics first */}
          {renderExtractedData()}
          
          {/* Display total expenses if available */}
          {processedData.totalExpenses !== undefined && (
            <div className="border border-border/50 rounded-lg bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Expenses</p>
                  <p className="text-2xl font-bold">${processedData.totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          )}
          {processedData.timeSeriesData && renderLineChart(false)}
          {processedData.expenseCategoryData && (
            <div
              className={cn(
                "relative border border-border/50 rounded-lg bg-card p-3 mt-2",
                compact ? "max-w-md" : "w-full"
              )}
            >
              {enlargedChart !== "expense-pie" && (
                <div className="absolute top-2 right-2 z-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setEnlargedChart("expense-pie")}
                  >
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <h4 className="text-xs font-medium mb-2 text-muted-foreground">Expense by Category</h4>
              <ResponsiveContainer width="100%" height={enlargedChart === "expense-pie" ? 500 : (compact ? 220 : 360)}>
                <PieChart>
                  <Pie
                    data={processedData.expenseCategoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={enlargedChart === "expense-pie" ? 180 : compact ? 80 : 130}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {processedData.expenseCategoryData.map((_: any, index: number) => (
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
          )}
          {processedData.topExpensesData && renderComplianceBarChart(
            processedData.topExpensesData,
            "Top Expenses",
            "value",
            enlargedChart === "expense-bar"
          )}
        </div>
        {/* Dialogs */}
        {processedData.expenseCategoryData && (
          <Dialog open={enlargedChart === "expense-pie"} onOpenChange={(open) => !open && setEnlargedChart(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Expense by Category</h3>
                <ResponsiveContainer width="100%" height={500}>
                  <PieChart>
                    <Pie
                      data={processedData.expenseCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={180}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {processedData.expenseCategoryData.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Dialog for extracted metrics */}
        {extractedMetrics && (
          <Dialog open={enlargedChart === "extracted-metrics"} onOpenChange={(open) => !open && setEnlargedChart(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Key Metrics</h3>
                {renderExtractedMetricsChart(extractedMetrics, true)}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </>
    );
  }

  // If income data, render income charts
  if (isIncomeData) {
    return (
      <>
        <div className="space-y-2">
          {/* Render extracted tables and metrics first */}
          {renderExtractedData()}
          
          {/* Display total income if available */}
          {processedData.totalIncome !== undefined && (
            <div className="border border-border/50 rounded-lg bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Income</p>
                  <p className="text-2xl font-bold">${processedData.totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          )}
          {processedData.timeSeriesData && renderLineChart(false)}
          {processedData.incomeSourceData && (
            <div
              className={cn(
                "relative border border-border/50 rounded-lg bg-card p-3 mt-2",
                compact ? "max-w-md" : "w-full"
              )}
            >
              {enlargedChart !== "income-pie" && (
                <div className="absolute top-2 right-2 z-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setEnlargedChart("income-pie")}
                  >
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <h4 className="text-xs font-medium mb-2 text-muted-foreground">Income by Source</h4>
              <ResponsiveContainer width="100%" height={enlargedChart === "income-pie" ? 500 : (compact ? 220 : 360)}>
                <PieChart>
                  <Pie
                    data={processedData.incomeSourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={enlargedChart === "income-pie" ? 180 : compact ? 80 : 130}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {processedData.incomeSourceData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          {processedData.revenueChannelData && (
            <div
              className={cn(
                "relative border border-border/50 rounded-lg bg-card p-3 mt-2",
                compact ? "max-w-md" : "w-full"
              )}
            >
              {enlargedChart !== "revenue-pie" && (
                <div className="absolute top-2 right-2 z-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setEnlargedChart("revenue-pie")}
                  >
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <h4 className="text-xs font-medium mb-2 text-muted-foreground">Revenue by Channel</h4>
              <ResponsiveContainer width="100%" height={enlargedChart === "revenue-pie" ? 500 : (compact ? 220 : 360)}>
                <PieChart>
                  <Pie
                    data={processedData.revenueChannelData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={enlargedChart === "revenue-pie" ? 180 : compact ? 80 : 130}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {processedData.revenueChannelData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Dialog for extracted metrics */}
        {extractedMetrics && (
          <Dialog open={enlargedChart === "extracted-metrics"} onOpenChange={(open) => !open && setEnlargedChart(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Key Metrics</h3>
                {renderExtractedMetricsChart(extractedMetrics, true)}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </>
    );
  }

  // If reporting data, render reporting charts
  if (isReportingData) {
    return (
      <>
        <div className="space-y-2">
          {/* Render extracted tables and metrics first */}
          {renderExtractedData()}
          
          {/* Display key financial metrics if available */}
          {(processedData.totalRevenue !== undefined || processedData.totalExpenses !== undefined || processedData.netProfit !== undefined) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {processedData.totalRevenue !== undefined && (
                <div className="border border-border/50 rounded-lg bg-card p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
                  <p className="text-xl font-bold">${processedData.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              )}
              {processedData.totalExpenses !== undefined && (
                <div className="border border-border/50 rounded-lg bg-card p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total Expenses</p>
                  <p className="text-xl font-bold">${processedData.totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              )}
              {processedData.netProfit !== undefined && (
                <div className="border border-border/50 rounded-lg bg-card p-4">
                  <p className="text-xs text-muted-foreground mb-1">Net Profit</p>
                  <p className={`text-xl font-bold ${processedData.netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    ${processedData.netProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              )}
            </div>
          )}
          {processedData.timeSeriesData && renderLineChart(false)}
          {processedData.timeSeriesData && renderBarChart(false)}
          {processedData.categoryData && (
            <div
              className={cn(
                "relative border border-border/50 rounded-lg bg-card p-3 mt-2",
                compact ? "max-w-md" : "w-full"
              )}
            >
              {enlargedChart !== "reporting-pie" && (
                <div className="absolute top-2 right-2 z-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setEnlargedChart("reporting-pie")}
                  >
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <h4 className="text-xs font-medium mb-2 text-muted-foreground">Category Breakdown</h4>
              <ResponsiveContainer width="100%" height={enlargedChart === "reporting-pie" ? 500 : (compact ? 220 : 360)}>
                <PieChart>
                  <Pie
                    data={processedData.categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={enlargedChart === "reporting-pie" ? 180 : compact ? 80 : 130}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {processedData.categoryData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Dialog for extracted metrics */}
        {extractedMetrics && (
          <Dialog open={enlargedChart === "extracted-metrics"} onOpenChange={(open) => !open && setEnlargedChart(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Key Metrics</h3>
                {renderExtractedMetricsChart(extractedMetrics, true)}
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
        {/* Render extracted tables and metrics first */}
        {renderExtractedData()}
        
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

      {/* Dialog for extracted metrics */}
      {extractedMetrics && (
        <Dialog open={enlargedChart === "extracted-metrics"} onOpenChange={(open) => !open && setEnlargedChart(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Key Metrics</h3>
              {renderExtractedMetricsChart(extractedMetrics, true)}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

