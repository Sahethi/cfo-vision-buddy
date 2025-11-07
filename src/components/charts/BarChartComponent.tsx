import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface BarChartComponentProps {
  data: any[];
  xAxisKey?: string;
  bars?: Array<{
    dataKey: string;
    fill?: string;
    name?: string;
  }>;
  title?: string;
  height?: number;
}

export function BarChartComponent({
  data,
  xAxisKey = "date",
  bars,
  title,
  height = 300,
}: BarChartComponentProps) {
  // If bars prop is provided, use it; otherwise use default single bar
  const chartBars = bars || [{ dataKey: "value", fill: "hsl(var(--primary))" }];

  return (
    <Card className="border-border/50">
      {title && (
        <CardHeader>
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey={xAxisKey} 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))", 
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)"
              }}
            />
            <Legend />
            {chartBars.map((bar, index) => (
              <Bar
                key={index}
                dataKey={bar.dataKey}
                fill={bar.fill || `hsl(var(--chart-${(index % 5) + 1}))`}
                name={bar.name || bar.dataKey}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

