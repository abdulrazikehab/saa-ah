import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileSpreadsheet, Check, AlertCircle, 
  Loader2, X, ChevronRight, ChevronLeft, Download,
  Tag, FolderTree, Package, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Reuse types from HierarchicalExplorer
export interface Brand {
  id: string;
  name: string;
  nameAr?: string;
  code?: string;
  logo?: string;
}

export interface Category {
  id: string;
  name: string;
  nameAr?: string;
  parentId?: string;
  description?: string;
  image?: string;
}

export interface Product {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price?: number;
  cost?: number;
  sku?: string;
  barcode?: string;
  stock?: number;
  brandId?: string;
  categoryIds?: string[];
  status?: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  images?: string[];
  featured?: boolean;
}

interface ImportData {
  brands: Brand[];
  categories: Category[];
  products: Product[];
}

interface ImportError {
  item: string;
  type: 'Brand' | 'Category' | 'Product';
  reason: string;
}

interface HierarchicalImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onCreateBrand?: (data: any) => Promise<any>;
  onCreateCategory?: (data: any) => Promise<any>;
  onCreateProduct?: (data: any) => Promise<any>;
}

export function HierarchicalImportWizard({
  open,
  onOpenChange,
  onSuccess,
  onCreateBrand,
  onCreateCategory,
  onCreateProduct,
}: HierarchicalImportWizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'result'>('upload');
  const [file, setFile] = useState<File | null>(null);
  
  // Data State
  const [parsedData, setParsedData] = useState<ImportData>({ brands: [], categories: [], products: [] });
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  
  // Progress State
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, message: '' });
  const [currentItem, setCurrentItem] = useState<{ name: string, type: string } | null>(null);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const abortRef = useRef(false);

  const resetWizard = () => {
    setStep('upload');
    setFile(null);
    setParsedData({ brands: [], categories: [], products: [] });
    setSheetNames([]);
    setImportProgress({ current: 0, total: 0, message: '' });
    setImportErrors([]);
    setSuccessCount(0);
    setCurrentItem(null);
    abortRef.current = false;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    
    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheets = workbook.SheetNames;
      setSheetNames(sheets);
      
      const result: ImportData = { brands: [], categories: [], products: [] };
      
      // Helper to find sheet
      const findSheet = (name: string) => {
        const match = sheets.find(n => n.toLowerCase() === name.toLowerCase());
        return match ? workbook.Sheets[match] : null;
      };

      // 1. Brands
      const brandSheet = findSheet("Brands");
      if (brandSheet) {
        const raw = XLSX.utils.sheet_to_json(brandSheet);
        result.brands = raw.map((b: any) => ({
          id: String(b.ID || ''),
          name: String(b.Name || ''),
          nameAr: String(b.NameAr || ''),
          code: b.Code ? String(b.Code) : undefined,
          logo: b.Logo ? String(b.Logo) : undefined
        }));
      }

      // 2. Categories
      const catSheet = findSheet("Categories");
      if (catSheet) {
        const raw = XLSX.utils.sheet_to_json(catSheet);
        result.categories = raw.map((c: any) => ({
          id: String(c.ID || ''),
          name: String(c.Name || ''),
          nameAr: String(c.NameAr || ''),
          parentId: c.ParentID ? String(c.ParentID) : undefined,
          description: c.Description ? String(c.Description) : undefined,
          image: c.Image ? String(c.Image) : undefined
        }));
      }

      // 3. Products
      const prodSheet = findSheet("Products");
      if (prodSheet) {
        const raw = XLSX.utils.sheet_to_json(prodSheet);
        result.products = raw.map((p: any) => ({
          id: String(p.ID || ''),
          name: String(p.Name || ''),
          nameAr: String(p.NameAr || ''),
          description: p.Description ? String(p.Description) : undefined,
          descriptionAr: p.DescriptionAr ? String(p.DescriptionAr) : undefined,
          price: Number(p.Price || 0),
          cost: p.Cost ? Number(p.Cost) : undefined,
          sku: p.SKU ? String(p.SKU) : undefined,
          barcode: p.Barcode ? String(p.Barcode) : undefined,
          stock: p.Stock ? Number(p.Stock) : undefined,
          brandId: p.BrandID ? String(p.BrandID) : undefined,
          categoryIds: p.CategoryIDs ? String(p.CategoryIDs).split(',') : [],
          status: 'ACTIVE',
          images: p.Images ? String(p.Images).split(',') : [],
          featured: p.Featured === 'Yes'
        }));
      }

      setParsedData(result);
      
      const totalFound = result.brands.length + result.categories.length + result.products.length;
      if (totalFound === 0) {
        toast({
          title: 'لم يتم العثور على بيانات',
          description: 'تأكد من وجود الصفحات: Brands, Categories, Products',
          variant: 'destructive',
        });
        return;
      }

      setStep('preview');
    } catch (error) {
      console.error('Error reading file:', error);
      toast({
        title: 'خطأ في قراءة ملف Excel',
        description: 'تأكد من أن الملف سليم وغير محمي بكلمة مرور',
        variant: 'destructive',
      });
    }
  };

  const startImport = async () => {
    setStep('importing');
    abortRef.current = false;
    
    const totalItems = parsedData.brands.length + parsedData.categories.length + parsedData.products.length;
    setImportProgress({ current: 0, total: totalItems, message: 'جاري البدء...' });
    
    let processed = 0;
    let success = 0;
    const errors: ImportError[] = [];
    const idMap = { brands: {} as Record<string, string>, categories: {} as Record<string, string> };
    const getErrorMsg = (e: any) => e?.response?.data?.message || e?.message || 'Unknown error';

    // 1. Brands
    setImportProgress({ current: processed, total: totalItems, message: 'جاري استيراد العلامات التجارية...' });
    for (const b of parsedData.brands) {
        if (abortRef.current) break;
        setCurrentItem({ name: b.nameAr || b.name, type: 'Brand' });
        
        if (onCreateBrand) {
            try {
                const newBrand = await onCreateBrand({
                    name: b.name,
                    nameAr: b.nameAr,
                    code: b.code,
                    logo: b.logo
                });
                idMap.brands[b.id] = newBrand.id;
                success++;
            } catch (e) { 
                errors.push({ item: b.name, type: 'Brand', reason: getErrorMsg(e) });
            }
        }
        processed++;
        setImportProgress({ current: processed, total: totalItems, message: 'جاري استيراد العلامات التجارية...' });
        if (processed % 5 === 0) await new Promise(resolve => setTimeout(resolve, 0));
    }

    // 2. Categories
    setImportProgress({ current: processed, total: totalItems, message: 'جاري استيراد الفئات...' });
    for (const c of parsedData.categories) {
        if (abortRef.current) break;
        setCurrentItem({ name: c.nameAr || c.name, type: 'Category' });

        if (onCreateCategory) {
            try {
                 const newCat = await onCreateCategory({
                     name: c.name,
                     nameAr: c.nameAr,
                     description: c.description,
                     parentId: c.parentId ? idMap.categories[c.parentId] : undefined,
                     image: c.image
                 });
                 idMap.categories[c.id] = newCat.id;
                 success++;
            } catch(e) { 
                errors.push({ item: c.name, type: 'Category', reason: getErrorMsg(e) });
            }
        }
        processed++;
        setImportProgress({ current: processed, total: totalItems, message: 'جاري استيراد الفئات...' });
        if (processed % 5 === 0) await new Promise(resolve => setTimeout(resolve, 0));
    }

    // 3. Products
    setImportProgress({ current: processed, total: totalItems, message: 'جاري استيراد المنتجات...' });
    for (const p of parsedData.products) {
        if (abortRef.current) break;
        setCurrentItem({ name: p.nameAr || p.name, type: 'Product' });

        if (onCreateProduct) {
            try {
                 const prevBrandId = p.brandId || '';
                 const realBrandId = prevBrandId && idMap.brands[prevBrandId] ? idMap.brands[prevBrandId] : undefined;
                 const firstCatId = p.categoryIds?.[0];
                 const realCatId = firstCatId ? idMap.categories[firstCatId] : undefined;
                 
                 await onCreateProduct({
                     name: p.name,
                     nameAr: p.nameAr,
                     description: p.description,
                     price: p.price || 0,
                     brandId: realBrandId,
                     categoryId: realCatId
                 });
                 success++;
            } catch(e) { 
                errors.push({ item: p.name, type: 'Product', reason: getErrorMsg(e) });
            }
        }
        processed++;
        setImportProgress({ current: processed, total: totalItems, message: 'جاري استيراد المنتجات...' });
        if (processed % 5 === 0) await new Promise(resolve => setTimeout(resolve, 0));
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>استيراد البيانات الهرمية</DialogTitle>
          <DialogDescription>
            استيراد العلامات التجارية، الفئات، والمنتجات دفعة واحدة
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-2">
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
                  <h3 className="font-semibold text-lg">اختر ملف Excel الهرمي</h3>
                  <p className="text-sm text-muted-foreground">يجب أن يحتوي على أوراق: Brands, Categories, Products</p>
                </div>
                <Input
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  id="hierarchical-import-file"
                  onChange={handleFileSelect}
                />
                <Button onClick={() => document.getElementById('hierarchical-import-file')?.click()}>
                  <Upload className="w-4 h-4 ml-2" />
                  اختيار ملف
                </Button>
              </motion.div>
            )}

            {step === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 text-center">
                     <Tag className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                     <div className="text-2xl font-bold text-purple-700">{parsedData.brands.length}</div>
                     <div className="text-sm text-purple-600">علامات تجارية</div>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 text-center">
                     <FolderTree className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                     <div className="text-2xl font-bold text-amber-700">{parsedData.categories.length}</div>
                     <div className="text-sm text-amber-600">فئات</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-center">
                     <Package className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                     <div className="text-2xl font-bold text-blue-700">{parsedData.products.length}</div>
                     <div className="text-sm text-blue-600">منتجات</div>
                  </div>
                </div>

                <Tabs defaultValue="brands" className="w-full">
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="brands">Brands</TabsTrigger>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                    <TabsTrigger value="products">Products</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="brands" className="border rounded-md mt-2">
                     <ScrollArea className="h-[200px]">
                        <Table>
                           <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Code</TableHead></TableRow></TableHeader>
                           <TableBody>
                              {parsedData.brands.slice(0, 50).map((b, i) => (
                                 <TableRow key={i}><TableCell>{b.id}</TableCell><TableCell>{b.name}</TableCell><TableCell>{b.code}</TableCell></TableRow>
                              ))}
                           </TableBody>
                        </Table>
                     </ScrollArea>
                  </TabsContent>
                  <TabsContent value="categories" className="border rounded-md mt-2">
                     <ScrollArea className="h-[200px]">
                        <Table>
                           <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Parent</TableHead></TableRow></TableHeader>
                           <TableBody>
                              {parsedData.categories.slice(0, 50).map((c, i) => (
                                 <TableRow key={i}><TableCell>{c.id}</TableCell><TableCell>{c.name}</TableCell><TableCell>{c.parentId}</TableCell></TableRow>
                              ))}
                           </TableBody>
                        </Table>
                     </ScrollArea>
                  </TabsContent>
                  <TabsContent value="products" className="border rounded-md mt-2">
                     <ScrollArea className="h-[200px]">
                        <Table>
                           <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Price</TableHead></TableRow></TableHeader>
                           <TableBody>
                              {parsedData.products.slice(0, 50).map((p, i) => (
                                 <TableRow key={i}><TableCell>{p.id}</TableCell><TableCell>{p.name}</TableCell><TableCell>{p.price}</TableCell></TableRow>
                              ))}
                           </TableBody>
                        </Table>
                     </ScrollArea>
                  </TabsContent>
                </Tabs>
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
                  <Loader2 className="w-20 h-20 text-primary animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                    {Math.round((importProgress.current / Math.max(importProgress.total, 1)) * 100)}%
                  </div>
                </div>
                
                <div className="text-center space-y-2 w-full max-w-md">
                  <h3 className="text-xl font-semibold">جاري الاستيراد...</h3>
                  <p className="text-muted-foreground">{importProgress.message}</p>
                  
                  {currentItem && (
                     <div className="bg-muted p-2 rounded-md flex items-center justify-center gap-2 text-sm mt-4">
                        {currentItem.type === 'Brand' && <Tag className="w-4 h-4 text-purple-500" />}
                        {currentItem.type === 'Category' && <FolderTree className="w-4 h-4 text-amber-500" />}
                        {currentItem.type === 'Product' && <Package className="w-4 h-4 text-blue-500" />}
                        <span className="font-medium truncate max-w-[200px]">{currentItem.name}</span>
                     </div>
                  )}
                </div>
                
                <Progress value={(importProgress.current / Math.max(importProgress.total, 1)) * 100} className="w-full max-w-md h-3" />
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
                    <ScrollArea className="h-64 border rounded-lg p-2 bg-muted/20">
                      <div className="space-y-2">
                        {importErrors.map((err, i) => (
                          <div key={i} className="text-sm p-3 bg-white rounded border flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                 <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 border font-medium">
                                    {err.type}
                                 </span>
                                 <span className="font-semibold">{err.item}</span>
                              </div>
                            </div>
                            <div className="text-destructive text-xs font-medium">{err.reason}</div>
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

        <DialogFooter className="mt-4 border-t pt-4">
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
              <Button onClick={startImport} className="bg-primary hover:bg-primary/90 text-white">
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
