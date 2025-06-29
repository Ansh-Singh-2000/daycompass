import { Sparkles, Settings, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

type HeaderProps = {
  onSettingsClick: () => void;
  points: { gains: number; losses: number };
};

export default function Header({ onSettingsClick, points }: HeaderProps) {
  const score = points.gains - points.losses;
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Day Weaver
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 font-semibold text-foreground" title={`${points.gains} points gained, ${points.losses} points lost`}>
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span>{score}</span>
        </div>
        <Button variant="outline" size="icon" onClick={onSettingsClick} aria-label="Settings">
            <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
