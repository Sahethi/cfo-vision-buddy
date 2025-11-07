import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface LineChartComponentProps {
  data: any[];
  dataKey?: string;
  xAxisKey?: string;
  lines?: Array<{
    dataKey: string;
    stroke?: string;
    strokeWidth?: number;
    name?: string;
  }>;
  title?: string;
  height?: number;
}

export function LineChartComponent({
  data,
  dataKey = "value",
  xAxisKey = "date",
  lines,
  title,
  height = 300,
}: LineChartComponentProps) {
  // If lines prop is provided, use it; otherwise use default single line
  const chartLines = lines || [{ dataKey, stroke: "hsl(var(--primary))", strokeWidth: 2 }];

  return (
    <Card className="border-border/50">
      {title && (
        <CardHeader>
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data}>
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
            {chartLines.map((line, index) => (
              <Line
                key={index}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.stroke || `hsl(var(--chart-${(index % 5) + 1}))`}
                strokeWidth={line.strokeWidth || 2}
                name={line.name || line.dataKey}
                dot={{ fill: line.stroke || `hsl(var(--chart-${(index % 5) + 1}))`, r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

