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

export function ChatVisualization({ data, compact = false }: ChatVisualizationProps) {
  const [enlargedChart, setEnlargedChart] = useState<string | null>(null); // Track which chart is enlarged
  const [processedData, setProcessedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const processData = async () => {
      if (!data) return;
      
      setIsLoading(true);
      try {
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

  // Determine which charts to show
  const hasTimeSeries = processedData.timeSeriesData || processedData.lineChartData;
  const hasBarData = processedData.barChartData;
  const hasPieData = processedData.pieChartData;

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

