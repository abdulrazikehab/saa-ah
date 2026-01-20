import { useState, useRef } from 'react';
import { read, utils } from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileSpreadsheet, Check, AlertCircle, 
  Loader2, X, ChevronRight, ChevronLeft, Download 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { coreApi } from '@/lib/api';

// Interfaces
interface Category {
  id: string;
  name: string;
  nameAr?: string;
}

interface Brand {
  id: string;
  name: string;
  nameAr?: string;
  code?: string;
}

interface Unit {
  id: string;
  name: string;
  nameAr?: string;
  code: string;
  cost: number;
}

interface Supplier {
  id: string;
  name: string;
  nameAr?: string;
  discountRate: number;
}

interface ExcelRow {
  Name?: string;
  NameAr?: string;
  Price?: string | number;
  SKU?: string;
  ProductId?: string;
  Category?: string;
  Brand?: string;
  BrandCode?: string;
  Description?: string;
  DescriptionAr?: string;
  Barcode?: string;
  Stock?: string | number;
  [key: string]: string | number | undefined;
}

interface ImportError {
  row: number;
  product: string;
  error: string;
}

interface ProductImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  brands: Brand[];
  units: Unit[];
  suppliers: Supplier[];
  onSuccess: () => void;
}

export function ProductImportWizard({
  open,
  onOpenChange,
  categories,
  brands,
  units,
  suppliers,
  onSuccess
}: ProductImportWizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'result'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ExcelRow[]>([]);
  const [allData, setAllData] = useState<ExcelRow[]>([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, message: '' });
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const abortRef = useRef(false);

  const resetWizard = () => {
    setStep('upload');
    setFile(null);
    setPreviewData([]);
    setAllData([]);
    setImportProgress({ current: 0, total: 0, message: '' });
    setImportErrors([]);
    setSuccessCount(0);
    abortRef.current = false;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    
    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json<ExcelRow>(worksheet);
      
      if (jsonData.length === 0) {
        toast({
          title: 'ملف فارغ',
          description: 'الملف المختار لا يحتوي على بيانات',
          variant: 'destructive',
        });
        return;
      }

      setAllData(jsonData);
      setPreviewData(jsonData.slice(0, 5));
      setStep('preview');
    } catch (error) {
      console.error('Error reading file:', error);
      toast({
        title: 'خطأ في قراءة الملف',
        description: 'تأكد من أن الملف بتنسيق Excel صحيح (.xlsx, .xls)',
        variant: 'destructive',
      });
    }
  };

  const cleanString = (str: string | number | undefined): string => {
    if (str === null || str === undefined) return '';
    return String(str).trim();
  };

  const startImport = async () => {
    setStep('importing');
    setImportProgress({ current: 0, total: allData.length, message: 'جاري البدء...' });
    abortRef.current = false;
    
    let success = 0;
    const errors: ImportError[] = [];
    const BATCH_SIZE = 5;

    for (let i = 0; i < allData.length; i += BATCH_SIZE) {
      if (abortRef.current) break;

      const batch = allData.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (row, index) => {
        const rowNum = i + index + 2; // +2 for header and 0-index
        try {
          // Validation Logic
          const name = cleanString(row.Name);
          const nameAr = cleanString(row.NameAr);
          const price = row.Price;
          const sku = cleanString(row.SKU);
          const productId = cleanString(row.ProductId);

          if (!name && !nameAr) throw new Error('اسم المنتج مطلوب (Name or NameAr)');
          if (!price) throw new Error('السعر مطلوب (Price)');

          // Map Category
          let categoryId: string | undefined;
          if (row.Category) {
            const category = categories.find(c => 
              c.name.toLowerCase() === row.Category.toLowerCase() || 
              c.nameAr?.toLowerCase() === row.Category.toLowerCase()
            );
            categoryId = category?.id;
          }

          // Map Brand
          let brandId: string | undefined;
          if (row.Brand || row.BrandCode) {
            const brand = brands.find(b => 
              (row.Brand && b.name.toLowerCase() === row.Brand.toLowerCase()) ||
              (row.Brand && b.nameAr?.toLowerCase() === row.Brand.toLowerCase()) ||
              (row.BrandCode && b.code?.toLowerCase() === row.BrandCode.toLowerCase())
            );
            brandId = brand?.id;
          }

          // Construct Product Data
          const productData = {
            name: name || nameAr || 'Product',
            nameAr: nameAr || name,
            description: cleanString(row.Description),
            descriptionAr: cleanString(row.DescriptionAr),
            price: Number(price),
            sku: sku || undefined,
            productId: productId || undefined,
            barcode: cleanString(row.Barcode) || undefined,
            stock: Number(row.Stock) || 0,
            categoryId: categoryId,
            brandId: brandId,
            isAvailable: true,
            isPublished: true,
            variants: [{
              name: 'Default',
              price: Number(price),
              inventoryQuantity: Number(row.Stock) || 0,
              sku: sku || undefined
            }]
          };

          await coreApi.createProduct(productData, true);
          success++;
        } catch (error: unknown) {
          console.error(`Error row ${rowNum}:`, error);
          const err = error as { message?: string; response?: { data?: { message?: string | string[] } } };
          let errorMessage = err.message || 'خطأ غير معروف';
          if (err.response?.data?.message) {
            errorMessage = Array.isArray(err.response.data.message) 
              ? err.response.data.message.join(', ') 
              : err.response.data.message;
          }
          errors.push({
            row: rowNum,
            product: row.Name || row.NameAr || 'Unknown',
            error: errorMessage
          });
        }
      }));

      setImportProgress({
        current: Math.min(i + BATCH_SIZE, allData.length),
        total: allData.length,
        message: `تم معالجة ${Math.min(i + BATCH_SIZE, allData.length)} من ${allData.length}`
      });
    }

    setSuccessCount(success);
    setImportErrors(errors);
    setStep('result');
    if (success > 0) {
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val && step === 'importing') {
        if (confirm('هل أنت متأكد من إيقاف الاستيراد؟')) {
          abortRef.current = true;
          onOpenChange(false);
        }
      } else {
        onOpenChange(val);
        if (!val) setTimeout(resetWizard, 300);
      }
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>استيراد المنتجات</DialogTitle>
          <DialogDescription>
            استيراد المنتجات من ملف Excel بخطوات بسيطة
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-1">
          <AnimatePresence mode="wait">
            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg bg-muted/30 gap-4"
              >
                <div className="p-4 rounded-full bg-primary/10">
                  <FileSpreadsheet className="w-10 h-10 text-primary" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="font-semibold text-lg">اختر ملف Excel</h3>
                  <p className="text-sm text-muted-foreground">اسحب الملف هنا أو اضغط للاختيار</p>
                </div>
                <Input
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  id="import-file"
                  onChange={handleFileSelect}
                />
                <Button onClick={() => document.getElementById('import-file')?.click()}>
                  <Upload className="w-4 h-4 ml-2" />
                  اختيار ملف
                </Button>
                <a href="/template.xlsx" className="text-xs text-primary hover:underline mt-2">
                  تحميل نموذج الاستيراد
                </a>
              </motion.div>
            )}

            {step === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertTitle>تم قراءة الملف بنجاح</AlertTitle>
                  <AlertDescription>
                    تم العثور على {allData.length} صف. هذه معاينة لأول 5 صفوف.
                  </AlertDescription>
                </Alert>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {previewData.length > 0 && Object.keys(previewData[0]).slice(0, 5).map((header) => (
                          <TableHead key={header}>{header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, i) => (
                        <TableRow key={i}>
                          {Object.values(row).slice(0, 5).map((cell, j) => (
                            <TableCell key={j}>{String(cell)}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </motion.div>
            )}

            {step === 'importing' && (
              <motion.div
                key="importing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 space-y-6"
              >
                <div className="relative">
                  <Loader2 className="w-16 h-16 text-primary animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                    {Math.round((importProgress.current / importProgress.total) * 100)}%
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold">جاري الاستيراد...</h3>
                  <p className="text-muted-foreground">{importProgress.message}</p>
                </div>
                <Progress value={(importProgress.current / importProgress.total) * 100} className="w-full max-w-md" />
              </motion.div>
            )}

            {step === 'result' && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-center">
                    <div className="text-3xl font-bold text-green-600">{successCount}</div>
                    <div className="text-sm text-green-800">تم بنجاح</div>
                  </div>
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-center">
                    <div className="text-3xl font-bold text-red-600">{importErrors.length}</div>
                    <div className="text-sm text-red-800">فشل</div>
                  </div>
                </div>

                {importErrors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      تفاصيل الأخطاء
                    </h4>
                    <ScrollArea className="h-48 border rounded-lg p-2 bg-muted/20">
                      <div className="space-y-2">
                        {importErrors.map((err, i) => (
                          <div key={i} className="text-sm p-2 bg-white rounded border flex justify-between items-start">
                            <div>
                              <span className="font-semibold">صف {err.row}:</span> {err.product}
                            </div>
                            <div className="text-destructive text-xs">{err.error}</div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter className="mt-4">
          {step === 'upload' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          )}
          
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => {
                setStep('upload');
                setFile(null);
              }}>
                <ChevronRight className="w-4 h-4 ml-2" />
                رجوع
              </Button>
              <Button onClick={startImport}>
                بدء الاستيراد
                <ChevronLeft className="w-4 h-4 mr-2" />
              </Button>
            </>
          )}

          {step === 'result' && (
            <Button onClick={() => onOpenChange(false)}>إغلاق</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
