interface TypingIndicatorProps {
  agentName: string;
  agentTitle?: string;
  avatarColor?: string;
  avatarInitials?: string;
  avatarEmoji?: string;
}

export function TypingIndicator({ agentName, agentTitle, avatarColor = "bg-slate-600", avatarInitials, avatarEmoji }: TypingIndicatorProps) {
  const display = avatarEmoji ?? (avatarInitials ?? agentName.slice(0, 2).toUpperCase());

  return (
    <div className="flex gap-3 py-3">
      <div className="relative flex-shrink-0 w-12 h-12">
        <div className={`absolute inset-0 rounded-full ${avatarColor} opacity-30 animate-ping`} />
        <div className={`absolute inset-0 rounded-full ${avatarColor} opacity-20 animate-ping [animation-delay:0.3s]`} />
        <div
          className={`relative w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold ${avatarEmoji ? "text-xl" : "text-xs"}`}
        >
          {display}
        </div>
      </div>
      <div className="flex flex-col justify-center gap-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-foreground">{agentName}</span>
          <span className="text-xs text-muted-foreground animate-pulse">is thinking…</span>
        </div>
        {agentTitle && (
          <span className="text-xs text-muted-foreground/60">{agentTitle}</span>
        )}
      </div>
    </div>
  );
}
