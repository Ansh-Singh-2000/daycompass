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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BlockedTime } from "@/lib/types";
import { Trash2, Plus } from "lucide-react";
import { useState } from "react";

let idCounter = 3;
const mockUuid = () => `mock-blocked-uuid-${idCounter++}`;

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  blockedTimes: BlockedTime[];
  setBlockedTimes: React.Dispatch<React.SetStateAction<BlockedTime[]>>;
  model: string;
  setModel: (model: string) => void;
}

export default function SettingsDialog({ 
  isOpen, 
  onClose, 
  blockedTimes, 
  setBlockedTimes,
  model,
  setModel
}: SettingsDialogProps) {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleAddBlockedTime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime || !endTime) {
      return;
    }
    const newBlockedTime: BlockedTime = {
      id: mockUuid(),
      title,
      startTime,
      endTime,
    };
    setBlockedTimes(prev => [...prev, newBlockedTime].sort((a,b) => a.startTime.localeCompare(b.startTime)));
    setTitle('');
    setStartTime('');
    setEndTime('');
  };

  const handleDeleteBlockedTime = (id: string) => {
    setBlockedTimes(blockedTimes.filter((bt) => bt.id !== id));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage AI settings and recurring busy times for scheduling.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          
           <div className="space-y-3">
            <Label>AI Settings</Label>
            <div className="space-y-2 rounded-md border p-4">
              <div>
                <Label htmlFor="ai-model">AI Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger id="ai-model">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="llama3-8b-8192">Llama 3 8B</SelectItem>
                    <SelectItem value="llama3-70b-8192">Llama 3 70B</SelectItem>
                    <SelectItem value="mixtral-8x7b-32768">Mixtral 8x7B</SelectItem>
                    <SelectItem value="gemma-7b-it">Gemma 7B</SelectItem>
                  </SelectContent>
                </Select>
                 <p className="text-sm text-muted-foreground pt-1">
                    Different models have different capabilities and speeds.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <Label>Recurring Busy Times</Label>
             <p className="text-sm text-muted-foreground -mt-2">
                The AI will avoid scheduling tasks during these daily blocks.
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto rounded-md border p-2">
              {blockedTimes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No blocked times added.</p>
              ) : (
                blockedTimes.map((bt) => (
                  <div key={bt.id} className="flex items-center justify-between p-2 bg-secondary rounded-md text-sm">
                    <div>
                      <p className="font-semibold">{bt.title}</p>
                      <p className="text-muted-foreground">{bt.startTime} - {bt.endTime}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteBlockedTime(bt.id)} aria-label={`Delete ${bt.title}`}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <form onSubmit={handleAddBlockedTime} className="space-y-3">
             <Label>Add New Block</Label>
            <div className="flex items-end gap-2">
              <div className="flex-grow">
                <Label htmlFor="block-title" className="sr-only">Title</Label>
                <Input
                  id="block-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Lunch"
                  required
                />
              </div>
              <div className="w-[130px]">
                <Label htmlFor="block-start" className="sr-only">Start Time</Label>
                <Input
                  id="block-start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="w-[130px]">
                <Label htmlFor="block-end" className="sr-only">End Time</Label>
                <Input
                  id="block-end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" aria-label="Add Blocked Time" className="px-3">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
          </form>

        </div>

        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
