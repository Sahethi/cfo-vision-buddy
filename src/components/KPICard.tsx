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
    <Card className={cn("border-border/50 overflow-hidden", variantStyles[variant])}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 sm:space-y-2 flex-1 min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight break-words">{value}</p>
          </div>
          {Icon && (
            <div className={cn("p-2 sm:p-2.5 rounded-lg bg-card-foreground/5 flex-shrink-0", trend && trendColors[trend])}>
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
