import * as React from "react";
import { AlertCircle, Download, X, FileWarning, ChevronDown, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Badge } from "./badge";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { cn } from "@/lib/utils";
import { utils, writeFile } from "xlsx";

export interface ImportError {
  row: number;
  column: string;
  productName?: string;
  itemName?: string; // Generic name for non-product imports
  error: string;
}

interface ImportErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errors: ImportError[];
  title?: string;
  description?: string;
  itemLabel?: string; // "المنتج" or "الفئة" etc.
  className?: string;
  onExport?: () => void;
}

export function ImportErrorDialog({
  open,
  onOpenChange,
  errors,
  title = "تقرير أخطاء الاستيراد",
  description = "حدثت الأخطاء التالية أثناء الاستيراد. يرجى مراجعة الصفوف التي فشلت وتصحيح البيانات في ملف Excel.",
  itemLabel = "العنصر",
  className
}: ImportErrorDialogProps) {
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set());

  const [showTechnical, setShowTechnical] = React.useState<Record<string, boolean>>({});

  const getFriendlyErrorMessage = (error: string) => {
    if (error.includes('Unique constraint failed') && (error.includes('slug') || error.includes('productTag'))) {
      return "هذا العنصر موجود بالفعل أو هناك تكرار في الروابط (Slug) أو الأوسمة.";
    }
    if (error.includes('Unique constraint failed') && error.includes('sku')) {
      return "كود المنتج (SKU) مكرر بالفعل. يرجى استخدام كود فريد لكل منتج.";
    }
    if (error.includes('Unique constraint failed') && error.includes('barcode')) {
      return "الباركود مكرر بالفعل. يرجى استخدام باركود فريد.";
    }
    if (error.includes('Foreign key constraint failed')) {
      return "فشل الربط مع بيانات أخرى. تأكد من أن الفئة أو العلامة التجارية المذكورة موجودة بالفعل.";
    }
    if (error.includes('is missing')) {
      return "هناك بيانات مطلوبة ناقصة في هذا الصف.";
    }
    if (error.includes('Invalid value') || error.includes('must be')) {
      return "القيمة المدخلة غير صالحة. يرجى التأكد من نوع البيانات (مثلاً الأرقام في حقول السعر).";
    }
    if (error.includes('prisma') || error.includes('invocation') || error.includes('constraint')) {
      return "حدث خطأ تقني أثناء معالجة البيانات. يرجى مراجعة صحة البيانات في هذا الصف.";
    }
    return error;
  };

  const toggleTechnical = (id: string) => {
    setShowTechnical(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Group errors by column
  const errorsByColumn = React.useMemo(() => {
    const groups: Record<string, ImportError[]> = {};
    errors.forEach(err => {
      const column = err.column || 'عام';
      if (!groups[column]) {
        groups[column] = [];
      }
      groups[column].push(err);
    });
    return groups;
  }, [errors]);

  const toggleGroup = (column: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(column)) {
        next.delete(column);
      } else {
        next.add(column);
      }
      return next;
    });
  };

  // Export errors to Excel
  const handleExportErrors = () => {
    const errorData = errors.map(err => ({
      'رقم الصف': err.row,
      'اسم العنصر': err.productName || err.itemName || '',
      'العمود': err.column || 'عام',
      'سبب الفشل': err.error
    }));
    
    const ws = utils.json_to_sheet(errorData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "أخطاء الاستيراد");
    writeFile(wb, `import_errors_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Get color class for column badge
  const getColumnColor = (column: string) => {
    const colors: Record<string, string> = {
      'Price': 'text-orange-700 border-orange-300 bg-orange-50 dark:text-orange-400 dark:border-orange-700 dark:bg-orange-950/30',
      'السعر': 'text-orange-700 border-orange-300 bg-orange-50 dark:text-orange-400 dark:border-orange-700 dark:bg-orange-950/30',
      'Category': 'text-purple-700 border-purple-300 bg-purple-50 dark:text-purple-400 dark:border-purple-700 dark:bg-purple-950/30',
      'الفئة': 'text-purple-700 border-purple-300 bg-purple-50 dark:text-purple-400 dark:border-purple-700 dark:bg-purple-950/30',
      'Brand': 'text-blue-700 border-blue-300 bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:bg-blue-950/30',
      'العلامة': 'text-blue-700 border-blue-300 bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:bg-blue-950/30',
      'SKU': 'text-cyan-700 border-cyan-300 bg-cyan-50 dark:text-cyan-400 dark:border-cyan-700 dark:bg-cyan-950/30',
      'Name': 'text-green-700 border-green-300 bg-green-50 dark:text-green-400 dark:border-green-700 dark:bg-green-950/30',
      'الاسم': 'text-green-700 border-green-300 bg-green-50 dark:text-green-400 dark:border-green-700 dark:bg-green-950/30',
      'General': 'text-gray-700 border-gray-300 bg-gray-50 dark:text-gray-400 dark:border-gray-700 dark:bg-gray-950/30',
      'عام': 'text-gray-700 border-gray-300 bg-gray-50 dark:text-gray-400 dark:border-gray-700 dark:bg-gray-950/30',
    };
    return colors[column] || 'text-blue-700 border-blue-300 bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:bg-blue-950/30';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-6xl max-h-[90vh]", className)}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="py-4 max-h-[70vh] overflow-y-auto space-y-4 text-right" dir="rtl">
          {/* Summary Card */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-2 border-red-200 dark:border-red-800 rounded-lg p-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-full">
                  <FileWarning className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-red-900 dark:text-red-300">
                    إجمالي الصفوف التي فشلت: {errors.length}
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                    يرجى مراجعة الأخطاء أدناه وإصلاحها في ملف Excel قبل المحاولة مرة أخرى
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* Column breakdown */}
                <div className="flex flex-wrap gap-2">
                  {Object.entries(errorsByColumn).slice(0, 3).map(([column, columnErrors]) => (
                    <Badge 
                      key={column} 
                      variant="outline"
                      className={cn("cursor-pointer", getColumnColor(column))}
                      onClick={() => toggleGroup(column)}
                    >
                      {column}: {columnErrors.length}
                    </Badge>
                  ))}
                  {Object.keys(errorsByColumn).length > 3 && (
                    <Badge variant="outline" className="text-gray-500">
                      +{Object.keys(errorsByColumn).length - 3} أعمدة أخرى
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Grouped Errors by Column */}
          {Object.entries(errorsByColumn).map(([column, columnErrors]) => (
            <Card key={column} className="border-2 border-red-200 dark:border-red-800">
              <CardHeader 
                className="bg-red-50 dark:bg-red-950/30 cursor-pointer hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
                onClick={() => toggleGroup(column)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Badge variant="outline" className={cn("font-semibold", getColumnColor(column))}>
                      {column}
                    </Badge>
                    <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                      {columnErrors.length} {columnErrors.length === 1 ? 'خطأ' : 'أخطاء'}
                    </span>
                  </CardTitle>
                  {expandedGroups.has(column) ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </CardHeader>
              
              {expandedGroups.has(column) && (
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-gray-900">
                          <TableHead className="w-24 font-bold text-center"># الصف</TableHead>
                          <TableHead className="font-bold min-w-[150px]">{itemLabel}</TableHead>
                          <TableHead className="font-bold">سبب الفشل</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {columnErrors.map((err, index) => {
                          const errorId = `${column}-${index}`;
                          const isTechnical = err.error.includes('prisma') || err.error.includes('invocation') || err.error.includes('constraint');
                          
                          return (
                            <TableRow 
                              key={index} 
                              className="hover:bg-red-50/50 dark:hover:bg-red-950/20 border-b border-red-100 dark:border-red-900/50"
                            >
                              <TableCell className="font-mono font-bold text-center text-lg bg-red-50 dark:bg-red-950/30">
                                {err.row}
                              </TableCell>
                              <TableCell className="font-medium">
                                <span className="font-semibold">{err.productName || err.itemName || '(لا يوجد اسم)'}</span>
                              </TableCell>
                              <TableCell className="text-red-700 dark:text-red-400 font-medium">
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <span>{getFriendlyErrorMessage(err.error)}</span>
                                  </div>
                                  
                                  {isTechnical && (
                                    <div className="mt-1">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 text-[10px] px-2 bg-red-100/50 hover:bg-red-200/50 dark:bg-red-900/30 dark:hover:bg-red-800/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
                                        onClick={() => toggleTechnical(errorId)}
                                      >
                                        {showTechnical[errorId] ? 'إخفاء التفاصيل التقنية' : 'Dev (تفاصيل تقنية)'}
                                      </Button>
                                      
                                      {showTechnical[errorId] && (
                                        <div className="mt-2 p-3 bg-gray-900 text-gray-100 rounded text-[10px] font-mono whitespace-pre-wrap border border-gray-700 overflow-x-auto text-left" dir="ltr">
                                          {err.error}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}

          {/* Full Errors Table (if no columns to group) */}
          {errors.length > 0 && Object.keys(errorsByColumn).length === 0 && (
            <Card className="border-2 border-red-200 dark:border-red-800">
              <CardHeader className="bg-red-50 dark:bg-red-950/30">
                <CardTitle className="text-lg flex items-center gap-2">
                  <X className="h-5 w-5 text-red-600" />
                  قائمة الصفوف التي فشل استيرادها
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-900">
                        <TableHead className="w-24 font-bold text-center"># الصف</TableHead>
                        <TableHead className="font-bold min-w-[150px]">{itemLabel}</TableHead>
                        <TableHead className="font-bold min-w-[120px]">العمود</TableHead>
                        <TableHead className="font-bold">سبب الفشل</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {errors.map((err, index) => {
                        const errorId = `full-${index}`;
                        const isTechnical = err.error.includes('prisma') || err.error.includes('invocation') || err.error.includes('constraint');

                        return (
                          <TableRow 
                            key={index} 
                            className="hover:bg-red-50/50 dark:hover:bg-red-950/20 border-b border-red-100 dark:border-red-900/50"
                          >
                            <TableCell className="font-mono font-bold text-center text-lg bg-red-50 dark:bg-red-950/30">
                              {err.row}
                            </TableCell>
                            <TableCell className="font-medium">
                              <span className="font-semibold">{err.productName || err.itemName || '(لا يوجد اسم)'}</span>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={cn("font-semibold", getColumnColor(err.column || 'عام'))}
                              >
                                {err.column || 'عام'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-red-700 dark:text-red-400 font-medium">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  <span>{getFriendlyErrorMessage(err.error)}</span>
                                </div>

                                {isTechnical && (
                                  <div className="mt-1">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 text-[10px] px-2 bg-red-100/50 hover:bg-red-200/50 dark:bg-red-900/30 dark:hover:bg-red-800/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
                                      onClick={() => toggleTechnical(errorId)}
                                    >
                                      {showTechnical[errorId] ? 'إخفاء التفاصيل التقنية' : 'Dev (تفاصيل تقنية)'}
                                    </Button>

                                    {showTechnical[errorId] && (
                                      <div className="mt-2 p-3 bg-gray-900 text-gray-100 rounded text-[10px] font-mono whitespace-pre-wrap border border-gray-700 overflow-x-auto text-left" dir="ltr">
                                        {err.error}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="min-w-[100px]"
          >
            إغلاق
          </Button>
          <Button 
            onClick={handleExportErrors}
            variant="secondary"
            className="min-w-[150px]"
          >
            <Download className="h-4 w-4 ml-2" />
            تصدير تقرير الأخطاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
