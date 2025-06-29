'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2 } from 'lucide-react';

type ScheduleControlsProps = {
  onGenerate: (startTime: string, endTime: string) => void;
  isLoading: boolean;
};

export default function ScheduleControls({ onGenerate, isLoading }: ScheduleControlsProps) {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(startTime, endTime);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start-time">Start Time</Label>
          <Input
            id="start-time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        <div>
          <Label htmlFor="end-time">End Time</Label>
          <Input
            id="end-time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
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
