import { useState } from "react";
import { CFOChat } from "./CFOChat";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ChatMessage {
  type: "user" | "rationale" | "agent_call" | "agent_response" | "final_response";
  content: string;
  agentName?: string;
  timestamp?: string;
  visualizationData?: any;
  files?: Array<{
    id: string;
    name: string;
    file: File;
    preview?: string;
  }>;
}

interface UploadedFile {
  id: string;
  name: string;
  file: File;
  preview?: string;
}

interface ExpandableChatProps {
  className?: string;
}

export function ExpandableChat({ className }: ExpandableChatProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Shared state for both views
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  return (
    <>
      {/* Collapsed/Default View */}
      <div className={cn("relative h-full flex flex-col", className)}>
        <div className="absolute top-2 right-2 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsExpanded(true)}
            title="Expand to fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
        <CFOChat
          showLoadSample={false}
          isExpanded={false}
          messages={messages}
          setMessages={setMessages}
          inputValue={inputValue}
          setInputValue={setInputValue}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
          uploadedFiles={uploadedFiles}
          setUploadedFiles={setUploadedFiles}
        />
      </div>

      {/* Expanded/Fullscreen Dialog */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 flex flex-col [&>button]:hidden">
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0 lg:p-6">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Autonomous CFO Agent</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsExpanded(false)}
                title="Minimize"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsExpanded(false)}
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden min-h-0 bg-muted/10">
            <CFOChat
              hideHeader={true}
              showLoadSample={true}
              isExpanded={true}
              messages={messages}
              setMessages={setMessages}
              inputValue={inputValue}
              setInputValue={setInputValue}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              uploadedFiles={uploadedFiles}
              setUploadedFiles={setUploadedFiles}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

