import { Sidebar } from "@/components/Sidebar";
import { KPICard } from "@/components/KPICard";
import { CashFlowChart } from "@/components/CashFlowChart";
import { CFOChat } from "@/components/CFOChat";
import { TrendingUp, DollarSign, AlertCircle } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar */}
      <Sidebar activeItem="dashboard" />

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Center Column - Dashboard */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Welcome Header */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome, Business Owner</h1>
              <p className="text-muted-foreground mt-1">Here's your financial overview</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <KPICard
                title="Cash on Hand"
                value="$42,150.80"
                icon={TrendingUp}
                trend="up"
                variant="success"
              />
              <KPICard
                title="Monthly Burn Rate"
                value="$8,200.00"
                icon={DollarSign}
              />
              <KPICard
                title="Overdue Invoices"
                value="$4,500.00"
                icon={AlertCircle}
                variant="destructive"
              />
            </div>

            {/* Cash Flow Chart */}
            <CashFlowChart />
          </div>
        </div>

        {/* Right Column - CFO Agent Chat */}
        <div className="w-96 border-l border-border/50 p-4">
          <CFOChat />
        </div>
      </div>
    </div>
  );
};

export default Index;
