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
  const [isEnlarged, setIsEnlarged] = useState(false);
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

  const renderChart = (enlarged = false) => {
    const height = enlarged ? 500 : (compact ? 200 : 300);
    const containerClass = enlarged ? "w-full" : "w-full";

    // Determine which chart to show based on available data
    const hasTimeSeries = processedData.timeSeriesData || processedData.lineChartData;
    const hasBarData = processedData.barChartData;
    const hasPieData = processedData.pieChartData;

    return (
      <div className={cn("space-y-4", enlarged && "p-4")}>
        {hasTimeSeries && (
          <div>
            {!enlarged && <h4 className="text-xs font-medium mb-2 text-muted-foreground">Time Series</h4>}
            <ResponsiveContainer width="100%" height={height}>
              <LineChart data={processedData.timeSeriesData || processedData.lineChartData}>
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
        )}

        {hasBarData && (
          <div>
            {!enlarged && <h4 className="text-xs font-medium mb-2 text-muted-foreground">Bar Chart</h4>}
            <ResponsiveContainer width="100%" height={height}>
              <BarChart data={processedData.barChartData || processedData.timeSeriesData}>
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
        )}

        {hasPieData && (
          <div>
            {!enlarged && <h4 className="text-xs font-medium mb-2 text-muted-foreground">Distribution</h4>}
            <ResponsiveContainer width="100%" height={height}>
              <PieChart>
                <Pie
                  data={processedData.pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={enlarged ? 150 : 80}
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
        )}
      </div>
    );
  };

  return (
    <>
      <div className="relative border border-border/50 rounded-lg bg-card p-3 mt-2">
        <div className="absolute top-2 right-2 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsEnlarged(true)}
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
        </div>
        {renderChart(false)}
      </div>

      <Dialog open={isEnlarged} onOpenChange={setIsEnlarged}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Visualization</h3>
            {renderChart(true)}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

