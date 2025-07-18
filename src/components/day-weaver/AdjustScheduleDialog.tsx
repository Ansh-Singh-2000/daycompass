
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type { ProposedTask } from "@/lib/types";
import { Loader2, Send, Wand2, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ProposedScheduleItem from "./ProposedScheduleItem";
import { v4 as uuidv4 } from 'uuid';
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AdjustScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  proposedSchedule: ProposedTask[];
  reasoning: string | null;
  onAdjust: (userRequest: string) => Promise<void>;
  onApply: (finalSchedule: ProposedTask[]) => void;
  isAdjusting: boolean;
  modelUsed: string;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    model?: string;
}

export default function AdjustScheduleDialog({
  isOpen,
  onClose,
  proposedSchedule,
  reasoning,
  onAdjust,
  onApply,
  isAdjusting,
  modelUsed,
}: AdjustScheduleDialogProps) {
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        if (reasoning && chatHistory.length === 0) {
            setChatHistory([{ role: 'assistant', content: reasoning, id: 'initial-reasoning', model: modelUsed }]);
        } else if (reasoning && chatHistory.length > 0 && chatHistory[chatHistory.length - 1]?.content !== reasoning) {
             setChatHistory(prev => [...prev, { role: 'assistant', content: reasoning, id: uuidv4(), model: modelUsed }]);
        }
    } else {
        // Reset history when dialog is closed to be ready for next time
        setChatHistory([]);
    }
  }, [reasoning, isOpen, modelUsed]);

  useEffect(() => {
    // Auto-scroll to bottom of chat
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatHistory]);

  useEffect(() => {
    // When the dialog opens, or after an AI response cycle completes,
    // gracefully focus the input field. This prevents the whole dialog
    // from getting a focus ring.
    if (isOpen && !isAdjusting) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100); // Small delay allows for dialog/state changes to settle.
      return () => clearTimeout(timer);
    }
  }, [isOpen, isAdjusting]);


  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isAdjusting) return;
    
    const userMessage: ChatMessage = { role: 'user', content: chatInput, id: uuidv4() };
    setChatHistory(prev => [...prev, userMessage]);
    
    const currentInput = chatInput;
    setChatInput("");

    await onAdjust(currentInput);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-2xl">Adjust Schedule with AI</DialogTitle>
          <DialogDescription>
            Use natural language to make changes to your proposed schedule.
          </DialogDescription>
          <p className="text-sm text-muted-foreground pt-1">
            Generated with: <code className="font-mono bg-background/50 px-1 py-0.5 rounded text-xs">{modelUsed}</code>
          </p>
        </DialogHeader>
        
        <div className="grid grid-rows-[2fr_1fr] md:grid-rows-1 grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
          {/* Left: Chat Panel */}
          <div className="flex flex-col gap-4 min-h-0">
             <h3 className="text-lg font-semibold">Chat with AI</h3>
            <Card className="flex-1 bg-background/50 flex flex-col overflow-hidden">
               <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatHistory.map((message) => (
                    <div key={message.id}>
                        <div className={cn(
                            "flex items-start gap-3 text-sm",
                            message.role === 'user' && "justify-end"
                        )}>
                            {message.role === 'assistant' && <Wand2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
                            <div className={cn(
                                "p-3 rounded-lg max-w-sm",
                                message.role === 'assistant' ? 'bg-muted' : 'bg-primary/20 text-card-foreground'
                            )}>
                                <p className="leading-relaxed">{message.content}</p>
                            </div>
                            {message.role === 'user' && <User className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
                        </div>
                    </div>
                  ))}
                  {isAdjusting && chatHistory[chatHistory.length - 1]?.role === 'user' && (
                     <div className="flex items-start gap-3 text-sm">
                        <Wand2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                         <p className="p-3 rounded-lg max-w-sm bg-muted">
                           <Loader2 className="animate-spin h-4 w-4" />
                         </p>
                     </div>
                  )}
              </div>
              <div className="p-4 border-t">
                <form onSubmit={handleChatSubmit} className="flex items-center gap-2">
                    <Input
                        ref={inputRef}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="e.g., 'Move Physics to 7pm'"
                        className={cn("flex-grow", isAdjusting && "opacity-50 cursor-not-allowed")}
                        readOnly={isAdjusting}
                    />
                    <Button type="submit" size="icon" disabled={isAdjusting || !chatInput.trim()}>
                        {isAdjusting ? <Loader2 className="animate-spin" /> : <Send />}
                    </Button>
                </form>
              </div>
            </Card>
          </div>

          {/* Right: Proposed Schedule */}
          <div className="flex flex-col gap-4 min-h-0">
            <h3 className="text-lg font-semibold">Proposed Schedule</h3>
            <Card className="flex-1 bg-background/50 overflow-hidden">
              <ScrollArea className="h-full" type="always">
                <div className="space-y-2 p-4">
                {proposedSchedule.map(task => (
                    <ProposedScheduleItem key={task.id} task={task} />
                ))}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isAdjusting}>Cancel</Button>
          <Button onClick={() => onApply(proposedSchedule)} disabled={isAdjusting}>Apply Schedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
