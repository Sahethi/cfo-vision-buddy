import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Brain, User, Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect, type ChangeEvent } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Badge } from "@/components/ui/badge";
import { ChatVisualization } from "./ChatVisualization";

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

interface UploadedFile {
  id: string;
  name: string;
  file: File;
  preview?: string;
}

interface ChatMessage {
  type: "user" | "rationale" | "agent_call" | "agent_response" | "final_response";
  content: string;
  agentName?: string;
  timestamp?: string;
  visualizationData?: any; // JSON data for visualization
  files?: UploadedFile[]; // Files attached to user messages
}

function parseResponseForVisualization(response: string): any | null {
  try {
    // Try to parse JSON from the response
    // Look for JSON blocks in markdown code blocks
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      // Check if it has graphData (compliance report format)
      if (parsed.graphData) {
        return { type: "compliance", graphData: parsed.graphData };
      }
      // Check if it has data or type (standard format)
      if (parsed.data || parsed.type) {
        return parsed;
      }
    }

    // Try to parse if the entire response is JSON
    const parsed = JSON.parse(response);
    if (parsed.graphData) {
      return { type: "compliance", graphData: parsed.graphData };
    }
    if (parsed.data || parsed.type) {
      return parsed;
    }
  } catch (e) {
    // Not JSON, continue
  }

  // Try to find JSON-like structures in the response (including graphData)
  try {
    // Look for graphData structure - try to match the full JSON object
    // This regex looks for { ... "graphData": { ... } ... } with better matching
    // First try to find a complete JSON object that contains graphData
    const jsonStart = response.indexOf('{');
    if (jsonStart !== -1) {
      // Try to find the matching closing brace
      let braceCount = 0;
      let jsonEnd = -1;
      for (let i = jsonStart; i < response.length; i++) {
        if (response[i] === '{') braceCount++;
        if (response[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            jsonEnd = i + 1;
            break;
          }
        }
      }
      
      if (jsonEnd > jsonStart) {
        try {
          const jsonStr = response.substring(jsonStart, jsonEnd);
          const parsed = JSON.parse(jsonStr);
          if (parsed.graphData) {
            return { type: "compliance", graphData: parsed.graphData };
          }
        } catch (e) {
          // If that fails, try the regex approach
        }
      }
    }
    
    // Fallback to regex matching
    const graphDataMatch = response.match(/\{[\s\S]*?"graphData"[\s\S]*?\}/);
    if (graphDataMatch) {
      try {
        const parsed = JSON.parse(graphDataMatch[0]);
        if (parsed.graphData) {
          return { type: "compliance", graphData: parsed.graphData };
        }
      } catch (parseError) {
        // If parsing the matched string fails, try to extract just the graphData part
        const graphDataOnlyMatch = response.match(/"graphData"\s*:\s*(\{[\s\S]*?\})/);
        if (graphDataOnlyMatch) {
          try {
            const graphDataParsed = JSON.parse(graphDataOnlyMatch[1]);
            return { type: "compliance", graphData: graphDataParsed };
          } catch (e) {
            // Ignore
          }
        }
      }
    }
    
    // Look for standard data structure
    const jsonLikeMatch = response.match(/\{[\s\S]*"data"[\s\S]*\}/);
    if (jsonLikeMatch) {
      return JSON.parse(jsonLikeMatch[0]);
    }
  } catch (e) {
    // Ignore
  }

  return null;
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
      const responseText = orch.observation.finalResponse.text;
      const visualizationData = parseResponseForVisualization(responseText);
      
      messages.push({
        type: "final_response",
        content: responseText,
        visualizationData: visualizationData || undefined,
      });
    }
  }

  return messages;
}

interface CFOChatProps {
  hideHeader?: boolean;
  showLoadSample?: boolean;
  isExpanded?: boolean;
  messages?: ChatMessage[];
  setMessages?: Dispatch<SetStateAction<ChatMessage[]>>;
  inputValue?: string;
  setInputValue?: Dispatch<SetStateAction<string>>;
  isProcessing?: boolean;
  setIsProcessing?: Dispatch<SetStateAction<boolean>>;
  uploadedFiles?: UploadedFile[];
  setUploadedFiles?: Dispatch<SetStateAction<UploadedFile[]>>;
}

export function CFOChat({
  hideHeader = false,
  showLoadSample = true,
  isExpanded = false,
  messages: externalMessages,
  setMessages: externalSetMessages,
  inputValue: externalInputValue,
  setInputValue: externalSetInputValue,
  isProcessing: externalIsProcessing,
  setIsProcessing: externalSetIsProcessing,
  uploadedFiles: externalUploadedFiles,
  setUploadedFiles: externalSetUploadedFiles,
}: CFOChatProps = {}) {
  // Get or create unified session ID (persisted in localStorage)
  // This session ID is shared across dashboard and chat for consistent context
  const getSessionId = (): string => {
    const storageKey = "cfo-unified-session-id";
    let sessionId = localStorage.getItem(storageKey);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem(storageKey, sessionId);
    }
    return sessionId;
  };
  // Use external state if provided, otherwise use internal state
  const [internalInputValue, setInternalInputValue] = useState("");
  const [internalMessages, setInternalMessages] = useState<ChatMessage[]>([]);
  const [internalIsProcessing, setInternalIsProcessing] = useState(false);
  const [internalUploadedFiles, setInternalUploadedFiles] = useState<UploadedFile[]>([]);
  
  const inputValue = externalInputValue !== undefined ? externalInputValue : internalInputValue;
  const setInputValue = externalSetInputValue || setInternalInputValue;
  const messages = externalMessages !== undefined ? externalMessages : internalMessages;
  const setMessages = externalSetMessages || setInternalMessages;
  const isProcessing = externalIsProcessing !== undefined ? externalIsProcessing : internalIsProcessing;
  const setIsProcessing = externalSetIsProcessing || setInternalIsProcessing;
  const uploadedFiles = externalUploadedFiles !== undefined ? externalUploadedFiles : internalUploadedFiles;
  const setUploadedFiles = externalSetUploadedFiles || setInternalUploadedFiles;
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing, isExpanded]);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    files.forEach((file) => {
      const fileId = `${Date.now()}-${Math.random()}`;
      const uploadedFile: UploadedFile = {
        id: fileId,
        name: file.name,
        file: file,
      };

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === fileId ? { ...f, preview: event.target?.result as string } : f
            )
          );
        };
        reader.readAsDataURL(file);
      }

      setUploadedFiles((prev) => [...prev, uploadedFile]);
    });
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };


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

  const handleSend = async () => {
    if (!inputValue.trim() && uploadedFiles.length === 0) return;
    
    const userInput = inputValue.trim();
    const filesToSend = [...uploadedFiles];
    
    // Add user message with files
    const userMessage: ChatMessage = {
      type: "user",
      content: userInput || `Uploaded ${uploadedFiles.length} file(s)`,
      files: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined,
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setUploadedFiles([]);
    setIsProcessing(true);
    
    try {
      // Get API URL from environment variable
      const apiUrl = import.meta.env.VITE_BEDROCK_API_URL || 
                     `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cfo-agent`;
      
      // Prepare FormData for file uploads
      const formData = new FormData();
      formData.append('message', userInput);
      formData.append('sessionId', getSessionId()); // Add session ID for conversation continuity
      
      // Add files if any
      filesToSend.forEach((file) => {
        formData.append('files', file.file);
      });
      
      // Make API call to Bedrock backend
      const headers: HeadersInit = {};
      
      // Add Supabase auth header if using Supabase function
      if (apiUrl.includes('supabase.co/functions')) {
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        if (supabaseKey) {
          headers['apikey'] = supabaseKey;
          headers['Authorization'] = `Bearer ${supabaseKey}`;
        }
      }
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary for FormData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Log session ID from response headers for debugging
      const sessionIdFromHeader = response.headers.get("X-Session-Id");
      console.log("Response Headers - X-Session-Id:", sessionIdFromHeader);
      console.log("All Response Headers:", Object.fromEntries(response.headers.entries()));
      
      // Parse Bedrock response - it might contain traces or direct response
      let parsedMessages: ChatMessage[] = [];
      let visualizationData: any = undefined;
      let responseText = "";
      
      // Check if response contains Bedrock traces
      if (result.traces && Array.isArray(result.traces)) {
        parsedMessages = parseBedrockTraces(result.traces);
        
        // Extract final response and visualization data from parsed messages
        const finalResponse = parsedMessages.find(m => m.type === "final_response");
        if (finalResponse) {
          responseText = finalResponse.content;
          visualizationData = finalResponse.visualizationData;
        }
      } 
      // If response is direct (not traces format)
      else if (result.response || result.message || result.text) {
        responseText = result.response || result.message || result.text;
        
        // Check for visualization data in response
        if (result.visualizationData) {
          visualizationData = result.visualizationData;
        } else if (result.data) {
          // If data is provided, it might be for visualization
          visualizationData = {
            type: result.type || "financial",
            data: result.data
          };
        }
        
        // Parse visualization from response text if present
        if (!visualizationData && responseText) {
          const parsed = parseResponseForVisualization(responseText);
          if (parsed) {
            visualizationData = parsed;
          }
        }
        
        // Also check if response contains graphData directly
        if (!visualizationData && result.graphData) {
          visualizationData = { type: "compliance", graphData: result.graphData };
        }
        
        // Add rationale and agent calls if present
        if (result.rationale) {
          parsedMessages.push({
            type: "rationale",
            content: result.rationale
          });
        }
        
        if (result.agentCalls && Array.isArray(result.agentCalls)) {
          result.agentCalls.forEach((call: any) => {
            parsedMessages.push({
              type: "agent_call",
              content: call.input || call.content,
              agentName: call.agentName || call.agent
            });
          });
        }
        
        if (result.agentResponses && Array.isArray(result.agentResponses)) {
          result.agentResponses.forEach((resp: any) => {
            parsedMessages.push({
              type: "agent_response",
              content: resp.output || resp.content,
              agentName: resp.agentName || resp.agent
            });
          });
        }
      }
      // Fallback: treat entire response as text
      else if (typeof result === 'string') {
        responseText = result;
        const parsed = parseResponseForVisualization(result);
        if (parsed) {
          visualizationData = parsed;
        }
      }
      else {
        // Try to extract meaningful data from response
        responseText = JSON.stringify(result, null, 2);
        const parsed = parseResponseForVisualization(responseText);
        if (parsed) {
          visualizationData = parsed;
        }
      }
      
      // Add all parsed messages (rationale, agent calls, etc.) except final response
      const nonFinalMessages = parsedMessages.filter(m => m.type !== "final_response");
      if (nonFinalMessages.length > 0) {
        setMessages(prev => [...prev, ...nonFinalMessages]);
      }
      
      // Add final response message
      const responseMessage: ChatMessage = {
        type: "final_response",
        content: responseText || "I've processed your request.",
        visualizationData: visualizationData,
      };

      setMessages(prev => [...prev, responseMessage]);
    } catch (error) {
      console.error('Error calling Bedrock API:', error);
      const errorMessage: ChatMessage = {
        type: "final_response", 
        content: error instanceof Error 
          ? `Sorry, I encountered an error: ${error.message}. Please check your API configuration and try again.`
          : "Sorry, I encountered an error processing your request. Please try again.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card
      className={cn(
        "border-border/50 h-full w-full flex flex-col overflow-hidden",
        isExpanded && "max-w-[90vw] w-full mx-auto"
      )}
    >
      {!hideHeader && (
        <CardHeader className="border-b border-border/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Autonomous CFO Agent</CardTitle>
            {showLoadSample && (
          <Button onClick={handleLoadSample} variant="outline" size="sm">
            Load Sample
          </Button>
            )}
        </div>
      </CardHeader>
      )}
      <CardContent
        className={cn(
          "flex-1 flex flex-col p-0 min-h-0",
          isExpanded && "bg-card/60"
        )}
      >
        {/* Messages area - scrollable */}
        <div
          className={cn(
            "flex-1 overflow-y-auto space-y-4 min-h-0",
            isExpanded ? "p-6" : "p-4"
          )}
        >
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Click "Load Sample" to see a sample conversation or ask a question below
            </div>
          )}
          {messages.map((message, index) => (
            <div key={index} className="space-y-2">
              {message.type === "user" && (
                <div className="flex justify-end">
                  <div
                    className={cn(
                      "bg-primary text-primary-foreground rounded-lg px-4 py-3 text-sm w-fit",
                      isExpanded ? "max-w-[50vw]" : "max-w-[85%]"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-3 h-3" />
                      <span className="text-xs font-medium">You</span>
                    </div>
                    {message.content}
                    {message.files && message.files.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.files.map((file) => (
                          <div key={file.id} className="flex items-center gap-2 text-xs bg-primary/20 rounded p-2">
                            <Paperclip className="w-3 h-3" />
                            <span className="truncate">{file.name}</span>
                            {file.preview && (
                              <img 
                                src={file.preview} 
                                alt={file.name}
                                className="max-w-[100px] max-h-[100px] object-contain rounded"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {message.type === "rationale" && (
                <div className="flex justify-start">
                  <div
                    className={cn(
                      "bg-muted/50 border border-border/50 rounded-lg px-4 py-3 text-sm w-fit",
                      isExpanded ? "max-w-[50vw]" : "max-w-[85%]"
                    )}
                  >
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
                  <div
                    className={cn(
                      "bg-accent/50 border border-accent rounded-lg px-4 py-3 text-sm w-fit",
                      isExpanded ? "max-w-[50vw]" : "max-w-[85%]"
                    )}
                  >
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
                  <div
                    className={cn(
                      "bg-secondary border border-border rounded-lg px-4 py-3 text-sm w-fit",
                      isExpanded ? "max-w-[50vw]" : "max-w-[85%]"
                    )}
                  >
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
                  <div
                    className={cn(
                      "bg-muted text-foreground rounded-lg px-4 py-3 text-sm",
                      isExpanded
                        ? "w-full max-w-[80vw]"
                        : "w-fit max-w-[85%]"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-3 h-3" />
                      <span className="text-xs font-medium">CFO Agent</span>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      {message.content.split('\n').map((line, i) => {
                        // Skip JSON code blocks in display (they're used for visualization)
                        if (line.trim().startsWith('```json') || line.trim() === '```') {
                          return null;
                        }
                        // Format markdown-style bold text
                        const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                        return line.trim() && (
                          <p 
                            key={i} 
                            className="mb-1"
                            dangerouslySetInnerHTML={{ __html: formattedLine }}
                          />
                        );
                      })}
                    </div>
                    {message.visualizationData && (
                      <ChatVisualization
                        data={message.visualizationData}
                        compact={!isExpanded}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
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

        {/* Input area - fixed at bottom */}
        <div
          className={cn(
            "border-t border-border/50 space-y-2 flex-shrink-0",
            isExpanded ? "p-6" : "p-4"
          )}
        >
          {/* File previews */}
          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-2">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 bg-muted rounded-lg px-2 py-1.5 text-xs"
                >
                  <Paperclip className="w-3 h-3" />
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4"
                    onClick={() => removeFile(file.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              className="hidden"
              accept=".csv,.json,.xlsx,.xls,.pdf,image/*"
            />
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Input 
              placeholder="Ask your CFO agent anything..."
              className={cn(
                "bg-background",
                isExpanded ? "min-h-[44px]" : ""
              )}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              disabled={isProcessing}
            />
            <Button 
              size="icon" 
              className="shrink-0"
              onClick={handleSend}
              disabled={isProcessing || (!inputValue.trim() && uploadedFiles.length === 0)}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
