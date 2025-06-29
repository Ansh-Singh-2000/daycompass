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
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ProposedTask } from "@/lib/types";
import { Loader2, Send, Wand2, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ProposedScheduleItem from "./ProposedScheduleItem";
import { v4 as uuidv4 } from 'uuid';
import { cn } from "@/lib/utils";

interface AdjustScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  proposedSchedule: ProposedTask[];
  reasoning: string | null;
  onAdjust: (userRequest: string) => Promise<void>;
  onApply: (finalSchedule: ProposedTask[]) => void;
  isAdjusting: boolean;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export default function AdjustScheduleDialog({
  isOpen,
  onClose,
  proposedSchedule,
  reasoning,
  onAdjust,
  onApply,
  isAdjusting,
}: AdjustScheduleDialogProps) {
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
        if (reasoning && chatHistory.length === 0) {
            setChatHistory([{ role: 'assistant', content: reasoning, id: 'initial-reasoning' }]);
        } else if (reasoning && chatHistory.length > 0 && chatHistory[chatHistory.length - 1]?.content !== reasoning) {
             setChatHistory(prev => [...prev, { role: 'assistant', content: reasoning, id: uuidv4() }]);
        }
    } else {
        // Reset history when dialog is closed to be ready for next time
        setChatHistory([]);
    }
  }, [reasoning, isOpen]);

  useEffect(() => {
    // Auto-scroll to bottom of chat
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatHistory]);


  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isAdjusting) return;
    
    const userMessage: ChatMessage = { role: 'user', content: chatInput, id: uuidv4() };
    setChatHistory(prev => [...prev, userMessage]);
    
    await onAdjust(chatInput);
    setChatInput("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-2xl">Adjust Schedule with AI</DialogTitle>
          <DialogDescription>
            Use natural language to make changes to your proposed schedule.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
          {/* Left: Chat Panel */}
          <div className="flex flex-col gap-4 min-h-0">
             <h3 className="text-lg font-semibold">Chat with AI</h3>
            <Card className="flex-1 bg-background/50 flex flex-col">
              <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
                <CardContent className="p-4 space-y-4">
                  {chatHistory.map((message) => (
                    <div key={message.id} className={cn(
                        "flex items-start gap-3 text-sm",
                        message.role === 'user' && "justify-end"
                    )}>
                        {message.role === 'assistant' && <Wand2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
                        <p className={cn(
                            "p-3 rounded-lg max-w-sm",
                            message.role === 'assistant' ? 'bg-muted' : 'bg-primary/20 text-primary-foreground'
                        )}>
                           {message.content}
                        </p>
                         {message.role === 'user' && <User className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
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
                </CardContent>
              </ScrollArea>
              <div className="p-4 border-t">
                <form onSubmit={handleChatSubmit} className="flex items-center gap-2">
                    <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="e.g., 'Move Physics to 7pm'"
                        className="flex-grow"
                        disabled={isAdjusting}
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
            <Card className="flex-1 flex flex-col relative bg-background/50">
                {isAdjusting && (
                     <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10 rounded-lg">
                        <div className="flex flex-col items-center gap-4">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                          <p className="text-muted-foreground">Adjusting schedule...</p>
                        </div>
                      </div>
                )}
                <ScrollArea className="flex-1 min-h-0">
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
