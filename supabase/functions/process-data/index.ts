import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { data, type = "financial" } = await req.json();

    if (!data || !Array.isArray(data)) {
      return new Response(
        JSON.stringify({ error: "Invalid data format. Expected an array of records." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${data.length} records of type: ${type}`);

    // Perform aggregations and calculations
    const processed = processData(data, type);

    return new Response(
      JSON.stringify(processed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing data:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function processData(data: any[], type: string) {
  switch (type) {
    case "financial":
      return processFinancialData(data);
    case "timeseries":
      return processTimeSeriesData(data);
    default:
      return processGenericData(data);
  }
}

function processFinancialData(data: any[]) {
  // Expected format: { date, amount, category, type: 'income'|'expense' }
  
  // Calculate totals
  const totalIncome = data
    .filter(d => d.type === 'income')
    .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
  
  const totalExpense = data
    .filter(d => d.type === 'expense')
    .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
  
  const netCashFlow = totalIncome - totalExpense;

  // Group by category for pie chart
  const categoryTotals: Record<string, number> = {};
  data.forEach(d => {
    const category = d.category || 'Uncategorized';
    const amount = parseFloat(d.amount) || 0;
    categoryTotals[category] = (categoryTotals[category] || 0) + amount;
  });

  const pieChartData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value: Math.abs(value)
  }));

  // Group by date for line/bar chart
  const dateGroups: Record<string, { income: number; expense: number }> = {};
  data.forEach(d => {
    const date = d.date || new Date().toISOString().split('T')[0];
    if (!dateGroups[date]) {
      dateGroups[date] = { income: 0, expense: 0 };
    }
    const amount = parseFloat(d.amount) || 0;
    if (d.type === 'income') {
      dateGroups[date].income += amount;
    } else {
      dateGroups[date].expense += amount;
    }
  });

  const timeSeriesData = Object.entries(dateGroups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({
      date,
      income: values.income,
      expense: values.expense,
      net: values.income - values.expense
    }));

  return {
    summary: {
      totalIncome,
      totalExpense,
      netCashFlow,
      transactionCount: data.length
    },
    pieChartData,
    timeSeriesData,
    barChartData: timeSeriesData
  };
}

function processTimeSeriesData(data: any[]) {
  // Expected format: { timestamp, value, metric }
  const lineChartData = data
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(d => ({
      timestamp: d.timestamp,
      value: parseFloat(d.value) || 0,
      metric: d.metric || 'value'
    }));

  const average = data.reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0) / data.length;
  const max = Math.max(...data.map(d => parseFloat(d.value) || 0));
  const min = Math.min(...data.map(d => parseFloat(d.value) || 0));

  return {
    summary: { average, max, min, count: data.length },
    lineChartData
  };
}

function processGenericData(data: any[]) {
  // Generic processing for any data structure
  const summary = {
    count: data.length,
    firstRecord: data[0],
    lastRecord: data[data.length - 1]
  };

  return {
    summary,
    rawData: data
  };
}
