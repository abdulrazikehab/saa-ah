import { APP_VERSION, GIT_COMMIT } from '@/version';

interface VersionFooterProps {
  className?: string;
  showCommit?: boolean;
}

export function VersionFooter({ className = '', showCommit = true }: VersionFooterProps) {
  return (
    <div className={`text-center text-xs text-muted-foreground py-2 ${className}`}>
      <div className="flex items-center justify-center gap-2">
        <span>v{APP_VERSION}</span>
        {showCommit && GIT_COMMIT !== 'dev' && (
          <>
            <span className="opacity-50">•</span>
            <span className="opacity-70 font-mono">{GIT_COMMIT.substring(0, 7)}</span>
          </>
        )}
      </div>
    </div>
  );
}

