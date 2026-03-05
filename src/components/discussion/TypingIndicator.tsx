interface TypingIndicatorProps {
  agentName: string;
  avatarColor?: string;
  avatarInitials?: string;
}

export function TypingIndicator({ agentName, avatarColor = "bg-slate-600", avatarInitials }: TypingIndicatorProps) {
  const initials = avatarInitials ?? agentName.slice(0, 2).toUpperCase();

  return (
    <div className="flex gap-3 py-3 animate-pulse">
      <div className={`flex-shrink-0 w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold`}>
        {initials}
      </div>
      <div className="flex items-center gap-1 mt-2">
        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" />
        <span className="ml-2 text-xs text-muted-foreground">{agentName} is analysing…</span>
      </div>
    </div>
  );
}
