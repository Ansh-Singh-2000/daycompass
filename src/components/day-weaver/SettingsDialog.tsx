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
import type { BlockedTime } from "@/lib/types";
import { Trash2 } from "lucide-react";
import { useState } from "react";

let idCounter = 0;
const mockUuid = () => `mock-blocked-uuid-${idCounter++}`;

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  blockedTimes: BlockedTime[];
  setBlockedTimes: React.Dispatch<React.SetStateAction<BlockedTime[]>>;
}

export default function SettingsDialog({ isOpen, onClose, blockedTimes, setBlockedTimes }: SettingsDialogProps) {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleAddBlockedTime = () => {
    if (!title || !startTime || !endTime) {
      // Basic validation
      return;
    }
    const newBlockedTime: BlockedTime = {
      id: mockUuid(),
      title,
      startTime,
      endTime,
    };
    setBlockedTimes([...blockedTimes, newBlockedTime]);
    // Reset form
    setTitle('');
    setStartTime('');
    setEndTime('');
  };

  const handleDeleteBlockedTime = (id: string) => {
    setBlockedTimes(blockedTimes.filter((bt) => bt.id !== id));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Recurring Busy Times</DialogTitle>
          <DialogDescription>
            Add recurring times you are unavailable, like lunch or meetings. The AI will avoid scheduling tasks during these times.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium">Add New Block</h4>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="title" className="text-right">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-2" placeholder="e.g. Lunch Break" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
               <Label htmlFor="start-time" className="text-right">Start Time</Label>
               <Input id="start-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="col-span-2" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
               <Label htmlFor="end-time" className="text-right">End Time</Label>
               <Input id="end-time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="col-span-2" />
            </div>
             <div className="flex justify-end">
                <Button onClick={handleAddBlockedTime}>Add Time</Button>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Current Blocks</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {blockedTimes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">No blocked times added.</p>
              ) : (
                blockedTimes.map((bt) => (
                  <div key={bt.id} className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg">
                    <div>
                      <p className="font-semibold">{bt.title}</p>
                      <p className="text-sm text-muted-foreground">{bt.startTime} - {bt.endTime}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteBlockedTime(bt.id)} aria-label={`Delete ${bt.title}`}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
