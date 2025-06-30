import { Settings, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '../ThemeToggle';
import Image from 'next/image';

type HeaderProps = {
  onSettingsClick: () => void;
  points: { gains: number; losses: number };
};

export default function Header({ onSettingsClick, points }: HeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-2 sm:gap-3">
        <Image
          src="/compass-logo.png?v=2"
          alt="Day Compass Logo"
          width={500}
          height={500}
          className="h-14 w-14 sm:h-20 sm:w-20"
        />
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Day Compass
        </h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <div
          className="hidden sm:flex items-center gap-4 rounded-lg bg-muted px-3 py-1.5 text-sm font-semibold"
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
