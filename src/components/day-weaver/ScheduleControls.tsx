'use client';

import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';

type ScheduleControlsProps = {
  onGenerate: () => void;
  isLoading: boolean;
};

export default function ScheduleControls({ 
  onGenerate, 
  isLoading, 
}: ScheduleControlsProps) {
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
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
