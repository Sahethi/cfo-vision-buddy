import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  icon?: LucideIcon;
  trend?: "up" | "down";
  variant?: "default" | "success" | "warning" | "destructive";
}

export function KPICard({ title, value, icon: Icon, trend, variant = "default" }: KPICardProps) {
  const variantStyles = {
    default: "",
    success: "border-success/50",
    warning: "border-warning/50",
    destructive: "border-destructive/50",
  };

  const trendColors = {
    up: "text-success",
    down: "text-destructive",
  };

  return (
    <Card className={cn("border-border/50", variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
          </div>
          {Icon && (
            <div className={cn("p-2.5 rounded-lg bg-card-foreground/5", trend && trendColors[trend])}>
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
