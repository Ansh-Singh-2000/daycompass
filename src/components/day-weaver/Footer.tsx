
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Instagram, Send, Mail } from 'lucide-react';

const SocialLink = ({ href, icon, text }: { href: string; icon: React.ReactNode; text: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-3 rounded-md p-2 text-sm text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
  >
    {icon}
    <span>{text}</span>
  </a>
);

export default function Footer() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [emailText, setEmailText] = useState('Email');
  const emailAddress = 'boom10052006@gmail.com';

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const handleCopyEmail = () => {
    if (!navigator.clipboard) {
      // Fallback for older browsers or insecure contexts
      setEmailText(emailAddress);
      setTimeout(() => setEmailText('Email'), 3000);
      return;
    }

    navigator.clipboard.writeText(emailAddress).then(() => {
      setEmailText('Copied!');
      setTimeout(() => setEmailText('Email'), 2000); // Revert back after 2 seconds
    }).catch(err => {
      console.error('Failed to copy: ', err);
      // If copy fails for any reason, display the email as a fallback
      setEmailText(emailAddress);
      setTimeout(() => setEmailText('Email'), 3000);
    });
  };

  return (
    <footer className="shrink-0 border-t">
      <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-3 sm:flex-row sm:gap-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Made with</span>
          <span className="inline-block animate-beat" style={{ animationDuration: '1.5s' }}>❤️</span>
          <span>by Ansh Singh © {currentYear ?? ''}</span>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">Reach Out</Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" side="top" align="end">
            <div className="flex flex-col gap-1">
              <SocialLink
                href="https://www.instagram.com/a.n.s.h_chauhan_/"
                icon={<Instagram className="h-4 w-4" />}
                text="Instagram"
              />
              <SocialLink
                href="https://t.me/A_n_s_h_Chauhan"
                icon={<Send className="h-4 w-4" />}
                text="Telegram"
              />
              <button
                onClick={handleCopyEmail}
                className="flex w-full items-center gap-3 rounded-md p-2 text-left text-sm text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Mail className="h-4 w-4" />
                <span>{emailText}</span>
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </footer>
  );
}
