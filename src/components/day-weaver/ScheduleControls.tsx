
'use client';

import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';

type ScheduleControlsProps = {
  onGenerate: () => void;
  onAdjust: () => void;
  isLoading: boolean;
  isAdjustDisabled: boolean;
};

export default function ScheduleControls({ 
  onGenerate,
  onAdjust,
  isLoading,
  isAdjustDisabled,
}: ScheduleControlsProps) {
  
  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate();
  };

  return (
    <form onSubmit={handleGenerateSubmit} className="w-full">
      <div className="flex w-full gap-2">
        <Button 
          type="button" 
          onClick={onAdjust} 
          disabled={isLoading || isAdjustDisabled} 
          className="w-full" 
          variant="secondary"
        >
          <Wand2 className="mr-2 h-4 w-4" />
          Adjust
        </Button>
        <Button type="submit" disabled={isLoading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Charting...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
