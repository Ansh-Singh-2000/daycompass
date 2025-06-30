import { Compass, Settings, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '../ThemeToggle';

type HeaderProps = {
  onSettingsClick: () => void;
  points: { gains: number; losses: number };
};

export default function Header({ onSettingsClick, points }: HeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Compass className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Day Compass
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <div
          className="flex items-center gap-4 rounded-lg bg-muted px-3 py-1.5 text-sm font-semibold"
          title={`${points.gains} tasks completed, ${points.losses} tasks missed`}
        >
          <div className="flex items-center gap-1.5 text-green-600 dark:text-green-500">
            <TrendingUp className="h-5 w-5" />
            <span>{points.gains}</span>
          </div>
          <div className="flex items-center gap-1.5 text-destructive">
            <TrendingDown className="h-5 w-5" />
            <span>{points.losses}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="icon" onClick={onSettingsClick} aria-label="Settings">
                <Settings className="h-5 w-5" />
            </Button>
        </div>
      </div>
    </header>
  );
}
