import * as React from "react";
import { Loader2, CheckCircle2, XCircle, FileSpreadsheet } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./dialog";
import { Progress } from "./progress";
import { cn } from "@/lib/utils";

export interface ImportProgress {
  current: number;
  total: number;
  currentItem: string;
}

interface ImportProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progress: ImportProgress;
  title?: string;
  description?: string;
  className?: string;
}

export function ImportProgressDialog({
  open,
  onOpenChange,
  progress,
  title = "جاري الاستيراد",
  description = "يرجى الانتظار أثناء استيراد البيانات من ملف Excel...",
  className
}: ImportProgressDialogProps) {
  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  const isComplete = progress.current > 0 && progress.current >= progress.total;
  const isProcessing = progress.total > 0 && progress.current < progress.total;
  const isInitializing = progress.total === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn("sm:max-w-lg", className)}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            {isComplete ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">
          {/* Progress Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">
                {isComplete ? "اكتمل الاستيراد" : isProcessing ? "جاري الاستيراد..." : "جاري تحضير البيانات..."}
              </span>
              {progress.total > 0 ? (
                <span className="text-muted-foreground font-semibold">
                  {progress.current.toLocaleString()} / {progress.total.toLocaleString()} ({percentage}%)
                </span>
              ) : (
                <span className="text-muted-foreground">جاري التحميل...</span>
              )}
            </div>

            {/* Progress Bar with Animation */}
            <div className="relative h-6 w-full overflow-hidden rounded-full bg-secondary border border-border">
              {progress.total > 0 ? (
                <>
                  <Progress 
                    value={percentage} 
                    className="h-full transition-all duration-500 ease-out"
                  />
                  {/* Animated shimmer effect when processing */}
                  {isProcessing && (
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"
                      style={{
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 2s linear infinite'
                      }}
                    />
                  )}
                  {/* Progress percentage text overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-foreground drop-shadow-sm">
                      {percentage}%
                    </span>
                  </div>
                </>
              ) : (
                <div className="h-full w-full bg-primary/20 animate-pulse" />
              )}
            </div>
          </div>

          {/* Current Item Status */}
          {progress.currentItem && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
              {isComplete ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
              )}
              <span className="truncate">{progress.currentItem}</span>
            </div>
          )}

          {/* Loading indicator when initializing */}
          {!progress.currentItem && isInitializing && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
              <FileSpreadsheet className="h-5 w-5 text-primary animate-pulse" />
              <span>جاري قراءة ملف Excel...</span>
            </div>
          )}

          {/* Completion message */}
          {isComplete && (
            <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 animate-in fade-in zoom-in duration-300 pt-4">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">تمت عملية الاستيراد!</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
