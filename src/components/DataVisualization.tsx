import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { Loader2 } from "lucide-react";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

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
              <Card>
                <CardHeader>
                  <CardTitle>Time Series Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={processedData.timeSeriesData || processedData.lineChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bar">
              <Card>
                <CardHeader>
                  <CardTitle>Bar Chart Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={processedData.barChartData || processedData.timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pie">
              <Card>
                <CardHeader>
                  <CardTitle>Category Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={processedData.pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
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
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};
