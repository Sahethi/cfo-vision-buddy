import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Brain, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface BedrockTrace {
  trace?: {
    orchestrationTrace?: {
      rationale?: { text: string };
      invocationInput?: {
        agentCollaboratorInvocationInput?: {
          agentCollaboratorName: string;
          input: { text: string };
        };
      };
      observation?: {
        agentCollaboratorInvocationOutput?: {
          agentCollaboratorName: string;
          output: { text: string };
        };
        finalResponse?: { text: string };
      };
      modelInvocationInput?: any;
    };
  };
}

interface ChatMessage {
  type: "user" | "rationale" | "agent_call" | "agent_response" | "final_response";
  content: string;
  agentName?: string;
  timestamp?: string;
}

function parseBedrockTraces(traces: BedrockTrace[]): ChatMessage[] {
  const messages: ChatMessage[] = [];
  
  for (const trace of traces) {
    const orch = trace.trace?.orchestrationTrace;
    if (!orch) continue;

    // Extract user message from modelInvocationInput
    if (orch.modelInvocationInput) {
      try {
        const text = orch.modelInvocationInput.text;
        if (typeof text === 'string') {
          const parsed = JSON.parse(text);
          const userMessages = parsed.messages?.filter((m: any) => m.role === 'user');
          if (userMessages && userMessages.length > 0) {
            const lastUserMsg = userMessages[userMessages.length - 1];
            const content = lastUserMsg.content;
            if (typeof content === 'string') {
              const textMatch = content.match(/text=([^}]+)/);
              if (textMatch) {
                messages.push({ type: "user", content: textMatch[1].trim() });
              }
            }
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Agent thinking/rationale
    if (orch.rationale?.text) {
      messages.push({ type: "rationale", content: orch.rationale.text });
    }

    // Agent calling another agent
    if (orch.invocationInput?.agentCollaboratorInvocationInput) {
      const invocation = orch.invocationInput.agentCollaboratorInvocationInput;
      messages.push({
        type: "agent_call",
        content: invocation.input.text,
        agentName: invocation.agentCollaboratorName,
      });
    }

    // Agent response from collaborator
    if (orch.observation?.agentCollaboratorInvocationOutput) {
      const output = orch.observation.agentCollaboratorInvocationOutput;
      messages.push({
        type: "agent_response",
        content: output.output.text,
        agentName: output.agentCollaboratorName,
      });
    }

    // Final response to user
    if (orch.observation?.finalResponse?.text) {
      messages.push({
        type: "final_response",
        content: orch.observation.finalResponse.text,
      });
    }
  }

  return messages;
}

export function CFOChat() {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLoadSample = () => {
    // Sample trace data for demonstration
    const sampleTraces: BedrockTrace[] = [
      {
        trace: {
          orchestrationTrace: {
            modelInvocationInput: {
              text: JSON.stringify({
                messages: [
                  { role: "user", content: "[{text=Provide an overview on my expenditure during the month of October 2025}]" }
                ]
              })
            }
          }
        }
      },
      {
        trace: {
          orchestrationTrace: {
            rationale: {
              text: "To provide an overview of the expenditure during the month of October 2025, I need to request the Expense Tracker Agent to provide a breakdown of expenses for that month."
            }
          }
        }
      },
      {
        trace: {
          orchestrationTrace: {
            invocationInput: {
              agentCollaboratorInvocationInput: {
                agentCollaboratorName: "fmo-expense-agent-tracker",
                input: {
                  text: "Please provide a breakdown of expenses for the month of October 2025, categorizing them and identifying any anomalies or trends."
                }
              }
            }
          }
        }
      },
      {
        trace: {
          orchestrationTrace: {
            observation: {
              agentCollaboratorInvocationOutput: {
                agentCollaboratorName: "fmo-expense-agent-tracker",
                output: {
                  text: "**October 2025:**\n- **Logistics:** Ground transportation for inventory to warehouse and packaging materials were within budget. However, there was a seasonal surge in demand requiring over-budget expenditure for ground transportation.\n- **Staff Meals & Benefits:** Team building event catering and break room refreshments were within budget.\n- **Raw Materials & Fabrics:** Merino wool purchase for sweaters was within budget.\n- **Rent & Utilities:** HVAC system maintenance was within budget.\n\n**Anomalies and Trends:**\n- Seasonal surges in demand requiring over-budget expenditure for ground transportation."
                }
              }
            }
          }
        }
      },
      {
        trace: {
          orchestrationTrace: {
            observation: {
              finalResponse: {
                text: "Here is an overview of the expenditure during the month of October 2025:\n\n**October 2025:**\n- **Logistics:** Ground transportation for inventory to warehouse was within budget, but showed over-budget expenditure due to seasonal surge.\n- **Staff Meals & Benefits:** Team building and refreshments remained within budget.\n- **Raw Materials & Fabrics:** Merino wool purchases were within budget.\n- **Rent & Utilities:** HVAC maintenance within budget.\n\n**Key Insight:** Seasonal demand surge in logistics is a normal business pattern requiring cash flow planning."
              }
            }
          }
        }
      }
    ];

    const parsedMessages = parseBedrockTraces(sampleTraces);
    setMessages(parsedMessages);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { type: "user", content: inputValue }]);
    setInputValue("");
    setIsProcessing(true);
    
    // Simulate processing (in real implementation, this would call your edge function)
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        type: "final_response", 
        content: "I've received your query. In a production environment, this would process your request through the financial analysis agents." 
      }]);
      setIsProcessing(false);
    }, 1000);
  };

  return (
    <Card className="border-border/50 h-full flex flex-col">
      <CardHeader className="border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Autonomous CFO Agent</CardTitle>
          <Button onClick={handleLoadSample} variant="outline" size="sm">
            Load Sample
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Click "Load Sample" to see a sample conversation or ask a question below
            </div>
          )}
          {messages.map((message, index) => (
            <div key={index} className="space-y-2">
              {message.type === "user" && (
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-lg px-4 py-3 text-sm max-w-[85%]">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-3 h-3" />
                      <span className="text-xs font-medium">You</span>
                    </div>
                    {message.content}
                  </div>
                </div>
              )}
              
              {message.type === "rationale" && (
                <div className="flex justify-start">
                  <div className="bg-muted/50 border border-border/50 rounded-lg px-4 py-3 text-sm max-w-[85%]">
                    <div className="flex items-center gap-2 mb-1">
                      <Brain className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">CFO Agent Thinking</span>
                    </div>
                    <p className="text-muted-foreground italic">{message.content}</p>
                  </div>
                </div>
              )}

              {message.type === "agent_call" && (
                <div className="flex justify-start">
                  <div className="bg-accent/50 border border-accent rounded-lg px-4 py-3 text-sm max-w-[85%]">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        Calling: {message.agentName?.replace('fmo-', '').replace(/-/g, ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{message.content}</p>
                  </div>
                </div>
              )}

              {message.type === "agent_response" && (
                <div className="flex justify-start">
                  <div className="bg-secondary border border-border rounded-lg px-4 py-3 text-sm max-w-[85%]">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        Response from: {message.agentName?.replace('fmo-', '').replace(/-/g, ' ')}
                      </Badge>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      {message.content.split('\n').map((line, i) => (
                        <p key={i} className="text-xs mb-1">{line}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {message.type === "final_response" && (
                <div className="flex justify-start">
                  <div className="bg-muted text-foreground rounded-lg px-4 py-3 text-sm max-w-[85%]">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-3 h-3" />
                      <span className="text-xs font-medium">CFO Agent</span>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      {message.content.split('\n').map((line, i) => (
                        line.trim() && <p key={i} className="mb-1">{line}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-muted/50 rounded-lg px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-muted-foreground">Processing...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-border/50">
          <div className="flex gap-2">
            <Input 
              placeholder="Ask your CFO agent anything..."
              className="bg-background"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isProcessing}
            />
            <Button 
              size="icon" 
              className="shrink-0"
              onClick={handleSend}
              disabled={isProcessing || !inputValue.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
