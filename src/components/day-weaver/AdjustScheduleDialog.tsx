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
import { Loader2, Send, Wand2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ProposedScheduleItem from "./ProposedScheduleItem";

interface AdjustScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  proposedSchedule: ProposedTask[];
  reasoning: string | null;
  onAdjust: (userRequest: string) => Promise<void>;
  onApply: (finalSchedule: ProposedTask[]) => void;
  isAdjusting: boolean;
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

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isAdjusting) return;
    await onAdjust(chatInput);
    setChatInput("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-2xl">Adjust Schedule with AI</DialogTitle>
          <DialogDescription>
            Use natural language to make changes to your current schedule.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
          {/* Left: Chat Panel */}
          <div className="flex flex-col gap-4">
             <h3 className="text-lg font-semibold">Chat with AI</h3>
            <Card className="flex-1 bg-background/50">
              <CardContent className="p-4">
                 <div className="flex items-start gap-3 text-sm">
                    <Wand2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="bg-muted p-3 rounded-lg">
                       Tell me what you'd like to change. For example: 'Schedule my Chemistry revision for tomorrow at 10 AM'.
                       {reasoning && <><br/><br/><strong className="font-semibold">Reasoning for current proposal:</strong> {reasoning}</>}
                    </p>
                 </div>
              </CardContent>
            </Card>
            <form onSubmit={handleChatSubmit} className="flex items-center gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="e.g., 'Move Physics to 7pm'"
                className="flex-grow"
                disabled={isAdjusting}
              />
              <Button type="submit" size="icon" disabled={isAdjusting}>
                {isAdjusting ? <Loader2 className="animate-spin" /> : <Send />}
              </Button>
            </form>
          </div>

          {/* Right: Proposed Schedule */}
          <div className="flex flex-col gap-4 min-h-0">
            <h3 className="text-lg font-semibold">Proposed Schedule</h3>
            <div className="relative flex-1">
                {isAdjusting && (
                     <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10 rounded-lg">
                        <div className="flex flex-col items-center gap-4">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                          <p className="text-muted-foreground">Adjusting schedule...</p>
                        </div>
                      </div>
                )}
                <ScrollArea className="h-full pr-4">
                    <div className="space-y-2">
                    {proposedSchedule.map(task => (
                        <ProposedScheduleItem key={task.id} task={task} />
                    ))}
                    </div>
                </ScrollArea>
            </div>
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
