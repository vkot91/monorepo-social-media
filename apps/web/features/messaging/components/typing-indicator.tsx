"use client";

type TypingIndicatorProps = {
  isTyping: boolean;
};

export const TypingIndicator = ({ isTyping }: TypingIndicatorProps) => {
  if (!isTyping) return null;

  return (
    <p aria-live="polite" className="px-1 py-1.5">
      <span className="inline-flex items-center gap-1.5 rounded-2xl bg-subtle-surface px-3.5 py-2.5">
        <span className="sr-only">typing…</span>
        <span aria-hidden className="h-2 w-2 rounded-full bg-muted-text animate-typing-dot [animation-delay:0ms]" />
        <span aria-hidden className="h-2 w-2 rounded-full bg-muted-text animate-typing-dot [animation-delay:160ms]" />
        <span aria-hidden className="h-2 w-2 rounded-full bg-muted-text animate-typing-dot [animation-delay:320ms]" />
      </span>
    </p>
  );
};
