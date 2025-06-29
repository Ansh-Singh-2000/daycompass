'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2 } from 'lucide-react';

type ScheduleControlsProps = {
  onGenerate: () => void;
  isLoading: boolean;
  startTime: string;
  endTime: string;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
};

export default function ScheduleControls({ 
  onGenerate, 
  isLoading, 
  startTime, 
  endTime,
  onStartTimeChange,
  onEndTimeChange
}: ScheduleControlsProps) {
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Label htmlFor="start-time">Start Time</Label>
          <Input
            id="start-time"
            type="time"
            value={startTime}
            onChange={(e) => onStartTimeChange(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="end-time">End Time</Label>
          <Input
            id="end-time"
            type="time"
            value={endTime}
            onChange={(e) => onEndTimeChange(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Weaving...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Schedule
          </>
        )}
      </Button>
    </form>
  );
}
