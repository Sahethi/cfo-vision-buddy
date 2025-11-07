import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { LineChartComponent } from "./charts/LineChartComponent";
import { BarChartComponent } from "./charts/BarChartComponent";
import { PieChartComponent } from "./charts/PieChartComponent";

export const DataVisualization = () => {
  const [jsonInput, setJsonInput] = useState("");
  const [processedData, setProcessedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const processData = async () => {
    setIsLoading(true);
    try {
      const parsedJson = JSON.parse(jsonInput);
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            data: parsedJson.data || parsedJson,
            type: parsedJson.type || "financial"
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process data');
      }

      const result = await response.json();
      setProcessedData(result);
      
      toast({
        title: "Data processed successfully",
        description: `Analyzed ${result.summary?.transactionCount || result.summary?.count || 0} records`,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error processing data",
        description: error instanceof Error ? error.message : "Invalid JSON format",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSampleData = () => {
    const sample = {
      type: "financial",
      data: [
        { date: "2025-01-01", amount: 5000, category: "Sales", type: "income" },
        { date: "2025-01-01", amount: 1200, category: "Rent", type: "expense" },
        { date: "2025-01-02", amount: 3500, category: "Sales", type: "income" },
        { date: "2025-01-02", amount: 800, category: "Supplies", type: "expense" },
        { date: "2025-01-03", amount: 4200, category: "Sales", type: "income" },
        { date: "2025-01-03", amount: 600, category: "Utilities", type: "expense" },
        { date: "2025-01-04", amount: 6000, category: "Sales", type: "income" },
        { date: "2025-01-04", amount: 2000, category: "Payroll", type: "expense" },
      ]
    };
    setJsonInput(JSON.stringify(sample, null, 2));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Input</CardTitle>
          <CardDescription>
            Paste your JSON data or load sample data to visualize
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder='{"type": "financial", "data": [...]}'
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
          <div className="flex gap-2">
            <Button onClick={processData} disabled={isLoading || !jsonInput}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Process Data
            </Button>
            <Button variant="outline" onClick={loadSampleData}>
              Load Sample Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {processedData && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(processedData.summary).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <p className="text-sm text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-2xl font-bold">
                      {typeof value === 'number' 
                        ? new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          }).format(value)
                        : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="line" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="line">Line Chart</TabsTrigger>
              <TabsTrigger value="bar">Bar Chart</TabsTrigger>
              <TabsTrigger value="pie">Pie Chart</TabsTrigger>
            </TabsList>

            <TabsContent value="line">
              <LineChartComponent
                data={processedData.timeSeriesData || processedData.lineChartData}
                xAxisKey="date"
                title="Time Series Analysis"
                height={400}
                lines={
                  processedData.timeSeriesData
                    ? [
                        { dataKey: "income", stroke: "hsl(var(--success))", name: "Income" },
                        { dataKey: "expense", stroke: "hsl(var(--destructive))", name: "Expense" },
                        { dataKey: "net", stroke: "hsl(var(--primary))", name: "Net" },
                      ]
                    : [{ dataKey: "value", stroke: "hsl(var(--primary))" }]
                }
              />
            </TabsContent>

            <TabsContent value="bar">
              <BarChartComponent
                data={processedData.barChartData || processedData.timeSeriesData}
                xAxisKey="date"
                title="Bar Chart Analysis"
                height={400}
                bars={
                  processedData.barChartData
                    ? [
                        { dataKey: "income", fill: "hsl(var(--success))", name: "Income" },
                        { dataKey: "expense", fill: "hsl(var(--destructive))", name: "Expense" },
                      ]
                    : undefined
                }
              />
            </TabsContent>

            <TabsContent value="pie">
              <PieChartComponent
                data={processedData.pieChartData}
                title="Category Distribution"
                height={400}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};
