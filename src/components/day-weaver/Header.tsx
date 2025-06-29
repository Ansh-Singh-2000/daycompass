import { Sparkles } from 'lucide-react';

export default function Header() {
  return (
    <header className="text-center my-8 md:my-12">
      <div className="inline-flex items-center justify-center gap-2">
        <Sparkles className="h-8 w-8 text-primary" />
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          Day Weaver
        </h1>
      </div>
      <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
        Your personal AI assistant to help you craft a productive and balanced day.
      </p>
    </header>
  );
}
