import { Sparkles, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

type HeaderProps = {
  onSettingsClick: () => void;
};

export default function Header({ onSettingsClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Day Weaver
        </h1>
      </div>
      <Button variant="outline" size="icon" onClick={onSettingsClick} aria-label="Settings">
        <Settings className="h-5 w-5" />
      </Button>
    </header>
  );
}
