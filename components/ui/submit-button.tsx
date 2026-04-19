'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A submit button that disables and shows a spinner while a server action is
 * pending. Pass the server action via formAction just like a regular button.
 * Must be rendered inside a <form> element for useFormStatus to work.
 */
export function SubmitButton({
  children,
  className,
  disabled,
  ...props
}: React.ComponentProps<'button'>) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      type="submit"
      disabled={pending || disabled}
      className={cn(
        'inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2',
        'text-sm font-medium text-primary-foreground',
        'hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60',
        'transition-opacity',
        className,
      )}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Please wait…
        </>
      ) : (
        children
      )}
    </button>
  );
}
