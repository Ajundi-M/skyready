'use client';

import { Toast } from 'radix-ui';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <Toast.Provider swipeDirection="right" duration={4000}>
      {toasts.map((t) => (
        <Toast.Root
          key={t.id}
          open
          onOpenChange={(open) => {
            if (!open) dismiss(t.id);
          }}
          className={cn(
            'relative flex w-full flex-col gap-1 rounded-lg border p-4 pr-8 shadow-lg',
            'transition-all',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-80',
            'data-[swipe=cancel]:translate-x-0',
            'data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
            'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none',
            t.variant === 'destructive'
              ? 'border-destructive/40 bg-destructive/10 text-destructive'
              : 'bg-background text-foreground',
          )}
        >
          <Toast.Title className="text-sm font-semibold leading-snug">
            {t.title}
          </Toast.Title>
          {t.description && (
            <Toast.Description className="mt-0.5 text-xs text-muted-foreground">
              {t.description}
            </Toast.Description>
          )}
          <Toast.Close
            className="absolute right-2 top-2 rounded-md p-1 opacity-50 transition-opacity hover:opacity-100"
            aria-label="Dismiss"
          >
            <X className="size-3.5" />
          </Toast.Close>
        </Toast.Root>
      ))}
      <Toast.Viewport className="fixed bottom-4 right-4 z-[100] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2 outline-none" />
    </Toast.Provider>
  );
}
