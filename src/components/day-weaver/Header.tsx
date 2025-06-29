import { Sparkles } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex items-center gap-2">
      <Sparkles className="h-6 w-6 text-primary" />
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Day Weaver
      </h1>
    </header>
  );
}
