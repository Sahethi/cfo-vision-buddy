import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp } from "lucide-react";

interface CashFlowChartProps {
  revenue?: number | null;
  expenses?: number | null;
  cashOnHand?: number | null;
  monthlyData?: Array<{
    month: string;
    income: number;
    expenses: number;
    net: number;
    cashFlow?: number;
  }>;
}

export function CashFlowChart({ revenue, expenses, cashOnHand, monthlyData }: CashFlowChartProps = {}) {
  // Use real monthly data if available, otherwise generate projection
  const generateData = () => {
    // If we have real monthly data, use it
    if (monthlyData && monthlyData.length > 0) {
      let runningCash = cashOnHand || 50000; // Starting cash
      return monthlyData.map((item) => {
        runningCash += item.net || item.cashFlow || 0;
        // Format month for display (e.g., "2025-06" -> "Jun '25")
        const monthDate = new Date(item.month + "-01");
        const monthLabel = monthDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        return {
          month: monthLabel,
          cash: Math.max(0, runningCash),
          revenue: item.income,
          expenses: item.expenses
        };
      });
    }
    
    // Fallback: Generate 6-month projection based on totals
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    
    if (revenue !== null && expenses !== null) {
      const monthlyRevenue = revenue / 6;
      const monthlyExpenses = expenses / 6;
      const startingCash = cashOnHand || (revenue - expenses);
      
      return months.map((month, index) => {
        const monthRevenue = monthlyRevenue * (index + 1);
        const monthExpenses = monthlyExpenses * (index + 1);
        const projectedCash = startingCash + (monthRevenue - monthExpenses);
        return {
          month,
          cash: Math.max(0, projectedCash),
          revenue: monthRevenue,
          expenses: monthExpenses
        };
      });
    }
    
    // Final fallback to sample data
    return [
      { month: "Jan", cash: 35000, revenue: 10000, expenses: 6500 },
      { month: "Feb", cash: 38000, revenue: 12000, expenses: 7000 },
      { month: "Mar", cash: 42150, revenue: 14000, expenses: 7850 },
      { month: "Apr", cash: 45000, revenue: 15000, expenses: 8150 },
      { month: "May", cash: 48000, revenue: 16000, expenses: 8000 },
      { month: "Jun", cash: 52000, revenue: 18000, expenses: 8000 },
    ];
  };

  const data = generateData();
  const hasRealData = monthlyData && monthlyData.length > 0 || (revenue !== null && expenses !== null);

  return (
    <Card className="border-border/50 bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          {hasRealData ? "Cash Flow Projection" : "Cash Flow Forecast (6-Month Projection)"}
        </CardTitle>
        {hasRealData && (
          <p className="text-xs text-muted-foreground mt-1">
            Based on current revenue and expense trends
          </p>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: 12 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))", 
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
              }}
              formatter={(value: number) => [`$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, "Cash"]}
              labelStyle={{ fontWeight: 600, marginBottom: 4 }}
            />
            <Area 
              type="monotone" 
              dataKey="cash" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              fill="url(#cashGradient)"
              dot={{ fill: "hsl(var(--primary))", r: 5, strokeWidth: 2, stroke: "hsl(var(--background))" }}
              activeDot={{ r: 7, strokeWidth: 2, stroke: "hsl(var(--background))" }}
            />
          </AreaChart>
        </ResponsiveContainer>
        {hasRealData && (
          <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span>Projected Cash Flow</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
