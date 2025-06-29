import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Combobox } from "@/components/ui/combobox";
import type { BlockedTime } from "@/lib/types";
import { Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

let idCounter = 3;
const mockUuid = () => `mock-blocked-uuid-${idCounter++}`;

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  blockedTimes: BlockedTime[];
  setBlockedTimes: React.Dispatch<React.SetStateAction<BlockedTime[]>>;
  model: string;
  setModel: (model: string) => void;
  startTime: string;
  onStartTimeChange: (value: string) => void;
  endTime: string;
  onEndTimeChange: (value: string) => void;
  wakeTime: string;
  onWakeTimeChange: (value: string) => void;
  sleepTime: string;
  onSleepTimeChange: (value: string) => void;
}

const aiModels = [
    { value: 'llama3-8b-8192', label: 'llama3-8b-8192' },
    { value: 'llama3-70b-8192', label: 'llama3-70b-8192', recommended: true },
    { value: 'mixtral-8x7b-32768', label: 'mixtral-8x7b-32768' },
    { value: 'gemma2-9b-it', label: 'gemma2-9b-it' },
    { value: 'deepseek-r1-distill-llama-70b', label: 'deepseek-r1-distill-llama-70b', recommended: true },
    { value: 'qwen-qwq-32b', label: 'qwen-qwq-32b' },
];

export default function SettingsDialog({ 
  isOpen, 
  onClose, 
  blockedTimes, 
  setBlockedTimes,
  model,
  setModel,
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
  wakeTime,
  onWakeTimeChange,
  sleepTime,
  onSleepTimeChange,
}: SettingsDialogProps) {
  const [newBlockTitle, setNewBlockTitle] = useState('');
  const [newBlockStartTime, setNewBlockStartTime] = useState('');
  const [newBlockEndTime, setNewBlockEndTime] = useState('');

  const handleAddBlockedTime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockTitle || !newBlockStartTime || !newBlockEndTime) {
      return;
    }
    const newBlockedTime: BlockedTime = {
      id: mockUuid(),
      title: newBlockTitle,
      startTime: newBlockStartTime,
      endTime: newBlockEndTime,
    };
    setBlockedTimes(prev => [...prev, newBlockedTime].sort((a,b) => a.startTime.localeCompare(b.startTime)));
    setNewBlockTitle('');
    setNewBlockStartTime('');
    setNewBlockEndTime('');
  };

  const handleDeleteBlockedTime = (id: string) => {
    setBlockedTimes(blockedTimes.filter((bt) => bt.id !== id));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl flex flex-col h-[90vh] md:h-[70vh]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your daily schedule and AI preferences for better suggestions.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="w-full flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="blocked">Blocked Times</TabsTrigger>
                <TabsTrigger value="ai">AI</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="py-4 overflow-y-auto">
              <div className="space-y-6 px-1">
                <div className="space-y-4 rounded-md border p-4">
                    <h3 className="font-semibold text-foreground">Working Hours</h3>
                    <p className="text-sm text-muted-foreground -mt-2">
                        Set your typical daily start and end times. The AI will only schedule tasks within this window.
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                        <div className="flex-1">
                            <Label htmlFor="start-time">Daily Start Time</Label>
                            <Input
                                id="start-time"
                                type="time"
                                value={startTime}
                                onChange={(e) => onStartTimeChange(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex-1">
                            <Label htmlFor="end-time">Daily End Time</Label>
                            <Input
                                id="end-time"
                                type="time"
                                value={endTime}
                                onChange={(e) => onEndTimeChange(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </div>
                <div className="space-y-4 rounded-md border p-4">
                    <h3 className="font-semibold text-foreground">Calendar Display</h3>
                    <p className="text-sm text-muted-foreground -mt-2">
                        Set your typical wake and sleep times to adjust the visible range on the calendar.
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                        <div className="flex-1">
                            <Label htmlFor="wake-time">Wake Up Time</Label>
                            <Input
                                id="wake-time"
                                type="time"
                                value={wakeTime}
                                onChange={(e) => onWakeTimeChange(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex-1">
                            <Label htmlFor="sleep-time">Sleep Time</Label>
                            <Input
                                id="sleep-time"
                                type="time"
                                value={sleepTime}
                                onChange={(e) => onSleepTimeChange(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="blocked" className="flex-1 flex flex-col gap-4 py-4 min-h-0">
                <div className="space-y-3 flex-1 flex flex-col min-h-0">
                    <Label>Recurring Busy Times</Label>
                    <p className="text-sm text-muted-foreground -mt-2">
                        The AI will avoid scheduling tasks during these daily blocks.
                    </p>
                    <ScrollArea className="flex-1 rounded-md border">
                      <div className="p-2 space-y-2">
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
                    </ScrollArea>
                </div>

                <form onSubmit={handleAddBlockedTime} className="space-y-3 shrink-0">
                    <Label>Add New Block</Label>
                    <div className="space-y-2">
                      <div>
                          <Label htmlFor="block-title" className="sr-only">Title</Label>
                          <Input
                          id="block-title"
                          value={newBlockTitle}
                          onChange={(e) => setNewBlockTitle(e.target.value)}
                          placeholder="e.g. Lunch"
                          required
                          />
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
                          <div className="flex-1">
                              <Label htmlFor="block-start">Start Time</Label>
                              <Input
                              id="block-start"
                              type="time"
                              value={newBlockStartTime}
                              onChange={(e) => setNewBlockStartTime(e.target.value)}
                              required
                              />
                          </div>
                          <div className="flex-1">
                              <Label htmlFor="block-end">End Time</Label>
                              <Input
                              id="block-end"
                              type="time"
                              value={newBlockEndTime}
                              onChange={(e) => setNewBlockEndTime(e.target.value)}
                              required
                              />
                          </div>
                          <Button type="submit" aria-label="Add Blocked Time" className="px-3">
                              <Plus className="h-4 w-4 mr-1" /> Add
                          </Button>
                      </div>
                    </div>
                </form>
            </TabsContent>
            <TabsContent value="ai" className="py-4 overflow-y-auto">
              <div className="space-y-2 rounded-md border p-4">
                  <div>
                      <Label htmlFor="ai-model">AI Model</Label>
                      <Combobox
                          options={aiModels}
                          value={model}
                          onChange={setModel}
                          placeholder="Select a model..."
                          notFoundMessage="No model found."
                          inputPlaceholder="Search or enter model..."
                      />
                      <p className="text-sm text-muted-foreground pt-1">
                          Choose a preset or type a custom model name from Groq.
                      </p>
                  </div>
              </div>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
