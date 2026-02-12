import * as React from "react";
import { Progress } from "./progress";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadProgressProps {
  current: number;
  total: number;
  currentItem?: string;
  isComplete?: boolean;
  hasError?: boolean;
  className?: string;
}

export function UploadProgress({
  current,
  total,
  currentItem,
  isComplete = false,
  hasError = false,
  className
}: UploadProgressProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const isAnimating = !isComplete && !hasError && current > 0;

  return (
    <div className={cn("w-full space-y-3 p-4 bg-card rounded-lg border", className)}>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            {isComplete ? "Completed" : hasError ? "Error" : "Uploading..."}
          </span>
          <span className="text-muted-foreground">
            {current} / {total} ({percentage}%)
          </span>
        </div>
        
        {/* Animated Progress Bar */}
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
          <Progress 
            value={percentage} 
            className="h-full"
          />
          {/* Animated shimmer effect */}
          {isAnimating && (
            <div 
              className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"
              style={{
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s linear infinite'
              }}
            />
          )}
        </div>
      </div>

      {/* Current Item Status */}
      {currentItem && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isComplete ? (
            <CheckCircle2 className="h-4 w-4 text-green-500 animate-in fade-in" />
          ) : hasError ? (
            <XCircle className="h-4 w-4 text-red-500 animate-in fade-in" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}
          <span className="truncate">{currentItem}</span>
        </div>
      )}

      {/* Success/Error Animation */}
      {isComplete && (
        <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 animate-in fade-in zoom-in duration-300">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-medium">Upload completed successfully!</span>
        </div>
      )}

      {hasError && (
        <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 animate-in fade-in zoom-in duration-300">
          <XCircle className="h-5 w-5" />
          <span className="font-medium">Upload failed. Please try again.</span>
        </div>
      )}
    </div>
  );
}

// Add shimmer animation to global CSS or tailwind config
// @keyframes shimmer {
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(100%); }
// }

