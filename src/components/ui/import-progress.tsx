import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  FileSpreadsheet,
  Package,
  FolderTree,
  Tag,
  X,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ImportError {
  item: string;
  type: 'Brand' | 'Category' | 'Product' | 'Other';
  reason: string;
  row?: number;
}

export interface ImportResult {
  total: number;
  success: number;
  errors: ImportError[];
}

interface ImportProgressProps {
  isOpen: boolean;
  onClose: () => void;
  progress: number;
  total: number;
  currentItem?: string;
  currentType?: 'Brand' | 'Category' | 'Product';
  onCancel?: () => void;
}

interface ImportResultsProps {
  isOpen: boolean;
  onClose: () => void;
  result: ImportResult | null;
  onExportErrors?: () => void;
}

// ============================================================================
// Import Progress Dialog
// ============================================================================

export function ImportProgressDialog({
  isOpen,
  onClose,
  progress,
  total,
  currentItem,
  currentType,
  onCancel,
}: ImportProgressProps) {
  const [dots, setDots] = useState('');
  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;

  // Animated dots for loading effect
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);
    return () => clearInterval(interval);
  }, [isOpen]);

  const getTypeIcon = () => {
    switch (currentType) {
      case 'Brand': return <Tag className="h-5 w-5 text-purple-500" />;
      case 'Category': return <FolderTree className="h-5 w-5 text-amber-500" />;
      case 'Product': return <Package className="h-5 w-5 text-blue-500" />;
      default: return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    }
  };

  const getTypeLabel = () => {
    switch (currentType) {
      case 'Brand': return 'علامة تجارية';
      case 'Category': return 'فئة';
      case 'Product': return 'منتج';
      default: return 'عنصر';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-[480px] p-0 overflow-hidden border-0 shadow-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-bold">جاري استيراد البيانات{dots}</h2>
              <p className="text-white/80 text-sm mt-0.5">يرجى عدم إغلاق هذه النافذة</p>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="p-6 space-y-6">
          {/* Main Progress Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">التقدم الكلي</span>
              <span className="font-bold text-lg text-primary">{percentage}%</span>
            </div>
            <div className="relative">
              <Progress value={percentage} className="h-4 bg-secondary/50" />
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                style={{ backgroundSize: '200% 100%' }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>تم معالجة {progress} من {total}</span>
              <span>{total - progress} متبقي</span>
            </div>
          </div>

          {/* Current Item */}
          {currentItem && (
            <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg shadow-sm">
                  {getTypeIcon()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">
                    جاري إضافة {getTypeLabel()}
                  </p>
                  <p className="font-medium truncate">{currentItem}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-3 text-center border border-purple-100 dark:border-purple-900/50">
              <Tag className="h-4 w-4 text-purple-500 mx-auto mb-1" />
              <p className="text-xs text-purple-600 dark:text-purple-400">العلامات</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3 text-center border border-amber-100 dark:border-amber-900/50">
              <FolderTree className="h-4 w-4 text-amber-500 mx-auto mb-1" />
              <p className="text-xs text-amber-600 dark:text-amber-400">الفئات</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 text-center border border-blue-100 dark:border-blue-900/50">
              <Package className="h-4 w-4 text-blue-500 mx-auto mb-1" />
              <p className="text-xs text-blue-600 dark:text-blue-400">المنتجات</p>
            </div>
          </div>

          {/* Cancel Button */}
          {onCancel && (
            <Button 
              variant="outline" 
              className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onCancel}
            >
              <X className="h-4 w-4 mr-2" />
              إلغاء الاستيراد
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Import Results Dialog
// ============================================================================

export function ImportResultsDialog({
  isOpen,
  onClose,
  result,
  onExportErrors,
}: ImportResultsProps) {
  if (!result) return null;

  const hasErrors = result.errors.length > 0;
  const successRate = result.total > 0 ? Math.round((result.success / result.total) * 100) : 0;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Brand': return <Tag className="h-4 w-4 text-purple-500" />;
      case 'Category': return <FolderTree className="h-4 w-4 text-amber-500" />;
      case 'Product': return <Package className="h-4 w-4 text-blue-500" />;
      default: return <FileSpreadsheet className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'Brand': return 'علامة تجارية';
      case 'Category': return 'فئة';
      case 'Product': return 'منتج';
      default: return 'عنصر';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-0 shadow-2xl max-h-[90vh]">
        {/* Header */}
        <div className={cn(
          "p-6 text-white",
          hasErrors 
            ? "bg-gradient-to-br from-amber-500 via-orange-500 to-red-500"
            : "bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500"
        )}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              {hasErrors ? (
                <AlertTriangle className="h-6 w-6" />
              ) : (
                <CheckCircle2 className="h-6 w-6" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {hasErrors ? 'اكتمل الاستيراد مع بعض الأخطاء' : 'تم الاستيراد بنجاح!'}
              </h2>
              <p className="text-white/80 text-sm mt-0.5">
                {hasErrors 
                  ? `تم استيراد ${result.success} من ${result.total} عنصر`
                  : `تم استيراد جميع العناصر (${result.total}) بنجاح`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="p-6 space-y-6">
          {/* Success/Failure Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-900/50 text-center">
              <div className="inline-flex items-center justify-center p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl mb-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{result.success}</p>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">ناجح</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 rounded-2xl p-5 border border-red-100 dark:border-red-900/50 text-center">
              <div className="inline-flex items-center justify-center p-3 bg-red-100 dark:bg-red-900/50 rounded-xl mb-3">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">{result.errors.length}</p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">فشل</p>
            </div>
          </div>

          {/* Success Rate Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">نسبة النجاح</span>
              <span className={cn(
                "font-bold",
                successRate >= 80 ? "text-emerald-600" : successRate >= 50 ? "text-amber-600" : "text-red-600"
              )}>
                {successRate}%
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-500",
                  successRate >= 80 ? "bg-emerald-500" : successRate >= 50 ? "bg-amber-500" : "bg-red-500"
                )}
                style={{ width: `${successRate}%` }}
              />
            </div>
          </div>

          {/* Error Log */}
          {hasErrors && (
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="font-medium text-sm">سجل الأخطاء ({result.errors.length})</span>
                </div>
                {onExportErrors && (
                  <Button variant="ghost" size="sm" onClick={onExportErrors} className="h-8 text-xs">
                    <Download className="h-3 w-3 mr-1" />
                    تصدير
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[250px]">
                <div className="divide-y divide-border">
                  {result.errors.map((error, index) => (
                    <div key={index} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-muted rounded-lg shrink-0">
                          {getTypeIcon(error.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium">
                              {getTypeLabel(error.type)}
                            </span>
                            {error.row && (
                              <span className="text-xs text-muted-foreground">
                                صف #{error.row}
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-sm truncate">{error.item}</p>
                          <p className="text-xs text-red-500 mt-1 line-clamp-2">{error.reason}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Close Button */}
          <Button 
            className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg" 
            onClick={onClose}
          >
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// CSS Animation (add to your global CSS if not using Tailwind animate plugin)
// ============================================================================
// @keyframes shimmer {
//   0% { background-position: 200% 0; }
//   100% { background-position: -200% 0; }
// }
// .animate-shimmer {
//   animation: shimmer 2s infinite linear;
// }
