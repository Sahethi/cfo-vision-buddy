import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "agent" | "user";
  content: string;
}

const sampleMessages: Message[] = [
  {
    role: "agent",
    content: "I've analyzed your Q3 data. Your primary expense driver was 'Inventory'. Would you like a full breakdown?",
  },
  {
    role: "user",
    content: "Yes, and also tell me if we can afford that new coffee machine.",
  },
];

export function CFOChat() {
  return (
    <Card className="border-border/50 h-full flex flex-col">
      <CardHeader className="border-b border-border/50">
        <CardTitle className="text-xl font-semibold">Autonomous CFO Agent</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {sampleMessages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-4 py-3 text-sm",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-border/50">
          <div className="flex gap-2">
            <Input 
              placeholder="Ask your CFO agent anything..."
              className="bg-background"
            />
            <Button size="icon" className="shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
