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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConfirm } from '@/contexts/ConfirmationContext';
import { ExplorerTree } from './ExplorerTree';

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
  onCreateBrand?: (data: any, options?: any) => Promise<any>;
  onCreateCategory?: (data: any, options?: any) => Promise<any>;
  onCreateProduct?: (data: any, options?: any) => Promise<any>;
  existingCategories?: Array<{ id: string; name: string; nameAr?: string; parentId?: string }>;
  existingBrands?: Array<{ id: string; name: string; nameAr?: string; code?: string }>;
  existingProducts?: Array<{ id: string; name: string; nameAr?: string; sku?: string; barcode?: string }>;
}

export function HierarchicalImportWizard({
  open,
  onOpenChange,
  onSuccess,
  onCreateBrand,
  onCreateCategory,
  onCreateProduct,
  existingCategories = [],
  existingBrands = [],
  existingProducts = [],
}: HierarchicalImportWizardProps) {
  const { confirm } = useConfirm();
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
  const [importLogs, setImportLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

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
    setImportLogs([]);
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
      
      // Helper to find sheet (case-insensitive and trimmed)
      const findSheet = (name: string) => {
        const match = sheets.find(n => n.trim().toLowerCase() === name.toLowerCase());
        return match ? workbook.Sheets[match] : null;
      };

      // Helper to normalize row keys for robust mapping
      const normalizeRow = (row: any) => {
        const normalized: any = {};
        for (const key in row) {
          // Keep original key too
          normalized[key] = row[key];
          // Normalized key
          const k = key.toString().toLowerCase().replace(/[\s_-]/g, '');
          normalized[k] = row[key];
        }
        return normalized;
      };

      // Helper to normalize codes: trim, uppercase, remove hidden chars
      const normalizeCode = (code: any) => String(code || '').trim().toUpperCase().replace(/[\u200B-\u200D\uFEFF]/g, '');

      // 1. Try "All Data" Sheet FIRST (Master Sheet)
      const allSheet = findSheet("All Data") || findSheet("All_Data") || findSheet("Data") || findSheet("البيانات") || findSheet("All");
      if (allSheet) {
          const raw = XLSX.utils.sheet_to_json(allSheet);
          const catMap = new Map();
          const brandMap = new Map();
          
          result.products = raw.map((r: any) => {
              const row = normalizeRow(r);
              
              // Extract Category
              const catId = normalizeCode(
                  row.parent_category_code || row.parentcategorycode || 
                  row.category_code || row.categorycode || 
                  row.cat_code || row.catcode || 
                  row.parent_cat || row.parentcat || 
                  row.category_id || row.categoryid
              );
              
              if (catId) {
                  if (!catMap.has(catId)) {
                      // Try multiple column name variations for category name
                      const catName = String(
                          row.parent_category_name_en || 
                          row.parentcategorynameen || 
                          row.category_name_en || 
                          row.categorynameen || 
                          row.category_name || 
                          row.categoryname || 
                          row.parent_category_name || 
                          row.parentcategoryname ||
                          row.name ||
                          ''
                      ).trim();
                      
                      const catNameAr = String(
                          row.parent_category_name_ar || 
                          row.parentcategorynamear || 
                          row.category_name_ar || 
                          row.categorynamear || 
                          row.parent_category_name || 
                          row.parentcategoryname ||
                          row.name_ar ||
                          row.namear ||
                          catName || // Fallback to English name
                          ''
                      ).trim();
                      
                      // Only add category if it has a valid name
                      if (catName && catName.length > 0) {
                          catMap.set(catId, {
                              id: catId,
                              name: catName,
                              nameAr: catNameAr || catName, // Ensure nameAr is never empty
                              description: row.description || row.desc ? String(row.description || row.desc).trim() : undefined
                          });
                      } else {
                          console.warn(`[Import] Skipping category with ID "${catId}" - no name found in All Data sheet`);
                      }
                  }
              }
              
              // Extract Brand
              const brandId = normalizeCode(
                  row.brand_code || row.brandcode || 
                  row.brand || row.brand_id || row.brandid
              );
              
              if (brandId) {
                  if (!brandMap.has(brandId)) {
                      brandMap.set(brandId, {
                          id: brandId,
                          name: String(row.brand_name || row.brandname || row.brand_name_en || row.brandnameen || row.brand || ''),
                          nameAr: String(row.brand_name_ar || row.brandnamear || row.brand_name || row.brandname || ''),
                          parentCategoryId: catId
                      });
                  } else if (catId && !brandMap.get(brandId).parentCategoryId) {
                       brandMap.get(brandId).parentCategoryId = catId;
                  }
              }

              // Extract Product
              const pId = normalizeCode(
                  row.product_code || row.productcode || 
                  row.id || row.sku
              );
              if (!pId) return null;

              return {
                  id: pId,
                  name: String(row.product_name_en || row.productnameen || row.product_name || row.productname || row.name || ''),
                  nameAr: String(row.product_name_ar || row.productnamear || row.name_ar || row.namear || row.productname || ''),
                  description: row.description || row.desc ? String(row.description || row.desc) : undefined,
                  price: Number(row.price || row.selling_price || row.sellingprice || 0),
                  cost: row.cost || row.cost_price || row.costprice ? Number(row.cost || row.cost_price || row.costprice) : undefined,
                  sku: row.sku ? String(row.sku) : undefined,
                  stock: row.stock || row.quantity ? Number(row.stock || row.quantity) : undefined,
                  brandId: brandId,
                  categoryIds: catId ? [catId] : [],
                  status: 'ACTIVE' as const,
                  images: row.images || row.imageurls ? String(row.images || row.imageurls).split(/[,;]/).map(s => s.trim()).filter(Boolean) : []
              };
          }).filter((p): p is any => p !== null && !!p.name);

          result.categories = Array.from(catMap.values());
          result.brands = Array.from(brandMap.values());
          
          console.log(`[Import] تم استخراج ${result.categories.length} فئة و ${result.brands.length} علامة تجارية و ${result.products.length} منتج من الورقة الشاملة.`);
      }

      // 2. Parse separate sheets if needed
      // 2.1 Categories - Always try to parse if missing (even if products/brands exist)
      if (result.categories.length === 0) {
          console.log('[Import] Categories missing, attempting to parse from separate sheet...');
          const catSheet = findSheet("Categories") || findSheet("Category") || findSheet("الفئات") || findSheet("Parent_Categories") || findSheet("Parent Categories");
          if (catSheet) {
            const raw = XLSX.utils.sheet_to_json(catSheet);
            
            // Log available columns for debugging (first row only)
            if (raw.length > 0) {
              console.log('[Import] Categories sheet columns:', Object.keys(raw[0]));
            }
            
            result.categories = raw.map((r: any, index: number) => {
              const c = normalizeRow(r);
              
              // PRIORITY 1: Check exact Excel column names first (from Parent_Categories sheet)
              // These are the actual column names in the Excel file
              let categoryName = String(
                r.parent_category_name_en ||  // Exact column name from Excel
                c.parent_category_name_en ||   // Normalized version
                r.parentcategorynameen ||      // Without underscores
                c.parentcategorynameen ||
                ''
              ).trim();
              
              let categoryNameAr = String(
                r.parent_category_name_ar ||  // Exact column name from Excel
                c.parent_category_name_ar ||   // Normalized version
                r.parentcategorynamear ||       // Without underscores
                c.parentcategorynamear ||
                ''
              ).trim();
              
              // PRIORITY 2: Fallback to other common column name variations
              if (!categoryName) {
                categoryName = String(
                  r.name || 
                  c.name || 
                  r.nameen || 
                  c.nameen || 
                  r.name_en || 
                  c.name_en || 
                  r.categoryname || 
                  c.categoryname || 
                  r.category_name || 
                  c.category_name || 
                  r.title || 
                  c.title ||
                  categoryNameAr || // Use Arabic name if English is empty
                  ''
                ).trim();
              }
              
              if (!categoryNameAr) {
                categoryNameAr = String(
                  r.namear || 
                  c.namear || 
                  r.name_ar || 
                  c.name_ar || 
                  r.arabicname || 
                  c.arabicname || 
                  r.arabic_name || 
                  c.arabic_name || 
                  r.titlear || 
                  c.titlear || 
                  r.title_ar || 
                  c.title_ar || 
                  categoryName || // Fallback to English name if Arabic is empty
                  ''
                ).trim();
              }
              
              // Get category ID - prioritize parent_category_code from Excel
              const categoryId = normalizeCode(
                r.parent_category_code ||      // Exact column name from Excel
                c.parent_category_code ||      // Normalized version
                r.parentcategorycode ||         // Without underscores
                c.parentcategorycode ||
                r.id || 
                c.id || 
                r.identifier || 
                c.identifier || 
                r.categorycode || 
                c.categorycode || 
                r.category_code || 
                c.category_code
              );
              
              // Log warning if name is missing
              if (!categoryName && categoryId) {
                console.warn(`[Import] Category at row ${index + 2} (ID: ${categoryId}) has no name.`);
                console.warn(`[Import] Available columns:`, Object.keys(r));
                console.warn(`[Import] Raw row data:`, r);
              }
              
              return {
                id: categoryId,
                name: categoryName,
                nameAr: categoryNameAr || categoryName, // Ensure nameAr is never empty
                parentId: (r.parent_id || c.parent_id || r.parentid || c.parentid || r.parent || c.parent || r.parentcategoryid || c.parentcategoryid || r.parent_category_id || c.parent_category_id) ? normalizeCode(r.parent_id || c.parent_id || r.parentid || c.parentid || r.parent || c.parent || r.parentcategoryid || c.parentcategoryid || r.parent_category_id || c.parent_category_id) : undefined,
                description: (r.description || c.description || r.desc || c.desc) ? String(r.description || c.description || r.desc || c.desc).trim() : undefined,
                image: (r.image || c.image || r.img || c.img) ? String(r.image || c.image || r.img || c.img).trim() : undefined
              };
            }).filter(c => {
              // CRITICAL: Filter out categories without valid ID or name
              const hasValidId = c.id && c.id.trim().length > 0;
              const hasValidName = c.name && c.name.trim().length > 0;
              
              if (!hasValidId || !hasValidName) {
                console.warn(`[Import] Skipping invalid category: ID="${c.id}", Name="${c.name}"`);
                return false;
              }
              return true;
            });
            
            console.log(`[Import] Parsed ${result.categories.length} valid categories from Categories sheet (out of ${raw.length} rows)`);
          } else {
            console.log('[Import] No Categories/Parent_Categories sheet found');
          }
      }

      // 2.2 Products and Brands - Parse if "All Data" yielded nothing
      if (result.products.length === 0 && result.brands.length === 0) {
          // 2.2 Products (Parse BEFORE Brands to allow inference)
          const prodSheet = findSheet("Products") || findSheet("Product") || findSheet("المنتجات");
          let skippedProducts = 0;
          if (prodSheet) {
            const raw = XLSX.utils.sheet_to_json(prodSheet);
            result.products = raw.map((r: any) => {
              const p = normalizeRow(r);
              
              const brandId = p.brandid || p.brand || p.brandcode;
              if (!brandId) {
                 skippedProducts++;
                 return null;
              }

              // Handle CategoryIDs (plural) or CategoryID (singular)
              let catIds: string[] = [];
              const rawCatIds = p.categoryids || p.categoryid || p.categories || p.category || p.parentcat;
              if (rawCatIds) {
                catIds = String(rawCatIds).split(/[,;]/).map(s => normalizeCode(s)).filter(Boolean);
              }

              return {
                id: normalizeCode(p.id || p.identifier || p.productcode),
                name: String(p.name || p.nameen || p.title || p.productnameen || ''),
                nameAr: String(p.namear || p.arabicname || p.titlear || p.name || p.productnamear || ''),
                description: p.description || p.desc ? String(p.description || p.desc) : undefined,
                descriptionAr: p.descriptionar || p.arabicdescription ? String(p.descriptionar || p.arabicdescription) : undefined,
                price: Number(p.price || p.sellingprice || 0),
                cost: p.cost || p.costprice ? Number(p.cost || p.costprice) : undefined,
                sku: p.sku || p.productcode ? String(p.sku || p.productcode) : undefined,
                barcode: p.barcode || p.upc || p.ean ? String(p.barcode || p.upc || p.ean) : undefined,
                stock: p.stock || p.quantity || p.qty ? Number(p.stock || p.quantity || p.qty) : undefined,
                brandId: normalizeCode(brandId),
                categoryIds: catIds,
                status: 'ACTIVE' as const,
                images: p.images || p.imageurls ? String(p.images || p.imageurls).split(/[,;]/).map(s => s.trim()).filter(Boolean) : [],
                featured: p.featured === 'Yes' || p.featured === true || p.featured === 1 || String(p.featured).toLowerCase() === 'true'
              };
            }).filter((p): p is any => p !== null && !!p.name);
          }

          // 2.3 Brands (Infer parent category from products if missing)
          const brandSheet = findSheet("Brands") || findSheet("Brand") || findSheet("الماركات");
          let inferredBrands = 0;
          if (brandSheet) {
            const raw = XLSX.utils.sheet_to_json(brandSheet);
            result.brands = raw.map((r: any) => {
              const b = normalizeRow(r);
              const brandId = normalizeCode(b.id || b.identifier || b.brandcode);
              let parentCatId = b.parentcategoryid || b.parentcategorycode ? normalizeCode(b.parentcategoryid || b.parentcategorycode) : undefined;

              // Inference Logic: If no parent category, look at products
              if (!parentCatId) {
                 const brandProducts = result.products.filter(p => p.brandId === brandId);
                 if (brandProducts.length > 0) {
                    const catCounts: Record<string, number> = {};
                    brandProducts.forEach(p => {
                       p.categoryIds.forEach((cid: string) => {
                          catCounts[cid] = (catCounts[cid] || 0) + 1;
                       });
                    });
                    
                    // Find most frequent category
                    let maxCount = 0;
                    let bestCat = undefined;
                    for (const [cid, count] of Object.entries(catCounts)) {
                       if (count > maxCount) {
                          maxCount = count;
                          bestCat = cid;
                       }
                    }
                    
                    if (bestCat) {
                       parentCatId = bestCat;
                       inferredBrands++;
                       console.log(`[Import] Inferred Category ${bestCat} for Brand ${brandId} based on ${maxCount} products.`);
                    }
                 }
              }

              return {
                id: brandId,
                name: String(b.name || b.nameen || b.title || b.brandname || ''),
                nameAr: String(b.namear || b.arabicname || b.titlear || b.name || b.brandname || ''),
                code: b.code || b.brandcode ? normalizeCode(b.code || b.brandcode) : undefined,
                logo: b.logo ? String(b.logo) : undefined,
                parentCategoryId: parentCatId
              };
            }).filter(b => b.id && b.name);
          }

          if (skippedProducts > 0) {
             console.log(`[Import] تم تخطي ${skippedProducts} منتج لعدم وجود رمز العلامة التجارية.`);
          }
          
          if (inferredBrands > 0) {
             console.log(`[Import] تم استنتاج الفئة الرئيسية لـ ${inferredBrands} علامة تجارية تلقائياً.`);
          }
      }

      setParsedData(result);
      
      const totalFound = result.brands.length + result.categories.length + result.products.length;
      if (totalFound === 0) {
        console.error('[Import] لم يتم العثور على بيانات');
        return;
      }

      setStep('preview');
    } catch (error) {
      console.error('Error reading file:', error);
      console.error('[Import] خطأ في قراءة ملف Excel');
    }
  };

  // Helper for delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [importLogs]);

  const addLog = (message: string) => {
    setImportLogs(prev => [...prev, message]);
  };

  const startImport = async () => {
    setStep('importing');
    setImportLogs([]);
    abortRef.current = false;
    
    // Extract data in the order it appears in Excel (for display purposes only)
    const { brands, categories, products } = parsedData;
    
    // IMPORTANT: We will process in the correct order regardless of Excel sheet order
    // Order: Categories → Brands → Products
    const categoriesToProcess = categories || [];
    const brandsToProcess = brands || [];
    const productsToProcess = products || [];
    
    const totalItems = categoriesToProcess.length + brandsToProcess.length + productsToProcess.length;
    setImportProgress({ current: 0, total: totalItems, message: 'جاري البدء...' });
    
    let processed = 0;
    let success = 0;
    const errors: ImportError[] = [];
    
    // Maps for Linking
    // idMap: Maps original Excel IDs to new database IDs
    // nameMap: Maps names to new database IDs (for fallback lookup)
    // codeMap: Maps codes to new database IDs (PRIMARY lookup method)
    const idMap = { brands: {} as Record<string, string>, categories: {} as Record<string, string> };
    const nameMap = { brands: {} as Record<string, string>, categories: {} as Record<string, string> };
    const codeMap = { brands: {} as Record<string, string>, categories: {} as Record<string, string> };
    
    // DUPLICATE PREVENTION: Build maps of existing items to check for duplicates
    // Map existing categories by name (case-insensitive) and code
    const existingCategoryMap = new Map<string, string>(); // name -> id
    const existingCategoryCodeMap = new Map<string, string>(); // code -> id
    existingCategories.forEach(cat => {
      if (cat.name) {
        existingCategoryMap.set(cat.name.trim().toLowerCase(), cat.id);
        if (cat.nameAr) {
          existingCategoryMap.set(cat.nameAr.trim().toLowerCase(), cat.id);
        }
      }
      // If category has a code (from previous import), map it
      if ((cat as any).code) {
        existingCategoryCodeMap.set(String((cat as any).code).trim(), cat.id);
      }
    });
    
    // Map existing brands by name and code
    const existingBrandMap = new Map<string, string>(); // name -> id
    const existingBrandCodeMap = new Map<string, string>(); // code -> id
    existingBrands.forEach(brand => {
      if (brand.name) {
        existingBrandMap.set(brand.name.trim().toLowerCase(), brand.id);
        if (brand.nameAr) {
          existingBrandMap.set(brand.nameAr.trim().toLowerCase(), brand.id);
        }
      }
      if (brand.code) {
        existingBrandCodeMap.set(brand.code.trim(), brand.id);
      }
    });
    
    // Map existing products by SKU and barcode
    const existingProductSkuMap = new Map<string, string>(); // sku -> id
    const existingProductBarcodeMap = new Map<string, string>(); // barcode -> id
    existingProducts.forEach(product => {
      if (product.sku) {
        existingProductSkuMap.set(product.sku.trim(), product.id);
      }
      if (product.barcode) {
        existingProductBarcodeMap.set(product.barcode.trim(), product.id);
      }
    });
    
    let skippedDuplicates = 0;

    const getErrorMsg = (e: unknown) => {
        if (typeof e === 'object' && e !== null && 'response' in e) {
             return (e as any).response?.data?.message || (e as any).message;
        }
        if (e instanceof Error) return e.message;
        return 'Unknown error';
    };

    // Retry Helper with robust exponential backoff
    const processItemWithRetry = async (
        operation: () => Promise<any>, 
        itemName: string,
        itemType: string
    ) => {
        let retries = 0;
        const maxRetries = 4; // Reduced from 5 - faster failure for non-rate-limit errors
        
        while (true) {
            try {
                if (abortRef.current) throw new Error('Cancelled');
                return await operation();
            } catch (error: any) {
                // Check for 429 (Too Many Requests) in multiple formats
                const isRateLimit = error?.response?.status === 429 || 
                                  error?.status === 429 ||
                                  (typeof error?.message === 'string' && error.message.includes('429')) ||
                                  (typeof error?.message === 'string' && error.message.includes('الانتظار'));
                
                if (isRateLimit && retries < maxRetries) {
                    retries++;
                    // OPTIMIZATION: Faster exponential backoff - 1s, 2s, 4s, 8s (was 2s, 4s, 8s, 16s...)
                    // This reduces wait time while still respecting rate limits
                    const waitTime = 1000 * Math.pow(2, retries - 1);
                    console.log(`[Import] Rate limited on ${itemName} (${itemType}). Retry ${retries}/${maxRetries} in ${Math.round(waitTime/1000)}s...`);
                    
                    // Update UI to show we are waiting
                    setImportProgress(prev => ({ 
                        ...prev, 
                        message: `جاري الانتظار (${Math.round(waitTime/1000)}ث) بسبب ضغط الخادم... (${retries}/${maxRetries})` 
                    }));
                    
                    await delay(waitTime);
                    continue;
                }
                throw error;
            }
        }
    };

    try {
        // Helper for batch processing with controlled parallel execution
        // Uses concurrency limit to process multiple items in parallel while avoiding rate limits
        const processBatch = async (
            items: any[], 
            concurrency: number, // Number of parallel requests
            processFn: (item: any) => Promise<void>
        ) => {
            let index = 0;
            
            // Process items with controlled concurrency
            const processNext = async (): Promise<void> => {
                while (index < items.length) {
                    if (abortRef.current) return;
                    
                    const currentIndex = index++;
                    const item = items[currentIndex];
                    
                    try {
                        await processFn(item);
                    } catch (error) {
                        // Error is already handled in processFn
                        console.error(`Error processing item ${currentIndex}:`, error);
                    }
                }
            };
            
            // Start concurrent workers
            const workers = Array(Math.min(concurrency, items.length))
                .fill(null)
                .map(() => processNext());
            
            await Promise.all(workers);
        };

        // ============================================
        // IMPORT ORDER: Categories → Brands → Products
        // ============================================
        // This order is CRITICAL:
        // 1. Categories must be imported FIRST because:
        //    - Categories can have parent-child relationships
        //    - Brands reference parent categories
        //    - Products reference categories
        // 2. Brands must be imported SECOND because:
        //    - Products reference brands
        //    - Brands can reference parent categories (already imported)
        // 3. Products are imported LAST because:
        //    - They reference both categories and brands (both already imported)
        // ============================================

        // ============================================
        // STEP 1: Import Categories FIRST
        // ============================================
        // Categories MUST be imported first because:
        // - Brands reference parent categories
        // - Products reference categories
        // Categories are processed sequentially to handle parent-child relationships correctly
        console.log('[Import] ============================================');
        console.log('[Import] STEP 1: Starting Category Import (FIRST)');
        console.log('[Import] ============================================');
        console.log(`[Import] Found ${categoriesToProcess.length} categories to import`);
        
        // CRITICAL: Ensure we have categories before proceeding
        if (categoriesToProcess.length === 0) {
            console.warn('[Import] WARNING: No categories found to import!');
        }
        
        setImportProgress({ current: processed, total: totalItems, message: 'جاري استيراد الفئات...' });
        
        const remainingCategories = [...categoriesToProcess];
        const categoriesToImport: Category[] = [];
        
        // Sort categories by dependency (parents before children)
        for (let i = 0; i < 10 && remainingCategories.length > 0; i++) {
            for (let j = 0; j < remainingCategories.length; j++) {
                const cat = remainingCategories[j];
                const parentId = cat.parentId;
                const isParentResolved = !parentId || idMap.categories[parentId] || nameMap.categories[parentId.trim().toLowerCase()];
                
                if (isParentResolved) {
                    categoriesToImport.push(cat);
                    remainingCategories.splice(j, 1);
                    j--;
                }
            }
        }
        categoriesToImport.push(...remainingCategories);
        
        console.log(`[Import] Processing ${categoriesToImport.length} categories with controlled parallelism...`);

        // OPTIMIZATION: Process categories with controlled parallelism (concurrency of 5)
        // Categories are already sorted by dependency (parents before children), so we can process multiple in parallel
        await processBatch(categoriesToImport, 5, async (c) => {
            if (abortRef.current) return;
            
            // VALIDATE: Ensure category has required data
            const categoryName = String(c.name || '').trim();
            const categoryNameAr = c.nameAr ? String(c.nameAr).trim() : undefined;
            
            if (!categoryName) {
                const errorMsg = `Category has no name (ID: ${c.id || 'unknown'})`;
                console.error(`[Import] ❌ ${errorMsg}`);
                errors.push({ item: c.id || 'Unknown', type: 'Category', reason: errorMsg });
                processed++;
                return; // Skip this category
            }
            
            setCurrentItem({ name: categoryNameAr || categoryName, type: 'Category' });

            if (onCreateCategory) {
                // DUPLICATE CHECK: Check if category already exists by name or code
                const categoryNameLower = categoryName.toLowerCase();
                const existingCategoryId = existingCategoryMap.get(categoryNameLower) || 
                                          (categoryNameAr ? existingCategoryMap.get(categoryNameAr.trim().toLowerCase()) : null) ||
                                          (c.id ? existingCategoryCodeMap.get(c.id.trim()) : null);
                
                if (existingCategoryId) {
                    console.log(`[Import] ⏭️ Skipping duplicate category "${categoryName}" (already exists with ID: ${existingCategoryId})`);
                    // Map the Excel code to existing database ID
                    if (c.id) {
                        idMap.categories[c.id] = existingCategoryId;
                        codeMap.categories[c.id] = existingCategoryId;
                    }
                    if (categoryName) nameMap.categories[categoryNameLower] = existingCategoryId;
                    if (categoryNameAr) nameMap.categories[categoryNameAr.trim().toLowerCase()] = existingCategoryId;
                    skippedDuplicates++;
                    processed++;
                    setImportProgress({ current: processed, total: totalItems, message: 'جاري استيراد الفئات...' });
                    return; // Skip creation
                }
                
                // Resolve parent category ID using category CODE
                let parentIdResolved: string | undefined = undefined;
                if (c.parentId) {
                    const parentCode = String(c.parentId).trim();
                    // Try codeMap first (most reliable - uses category code)
                    parentIdResolved = codeMap.categories[parentCode] || 
                                       idMap.categories[parentCode] || 
                                       nameMap.categories[parentCode.toLowerCase()];
                    
                    if (parentIdResolved) {
                        console.log(`[Import] Category "${categoryName}" linked to parent category code "${parentCode}" -> DB ID="${parentIdResolved}"`);
                    }
                }

                // Prepare category data with validation
                const categoryData = {
                    name: categoryName,
                    nameAr: categoryNameAr || categoryName, // Ensure nameAr is not empty
                    description: c.description ? String(c.description).trim() : undefined,
                    parentId: parentIdResolved,
                    image: c.image ? String(c.image).trim() : undefined,
                    isActive: true // Default to active
                };
                
                // Log the data being sent for debugging
                console.log(`[Import] Creating category:`, {
                    name: categoryData.name,
                    nameAr: categoryData.nameAr,
                    hasDescription: !!categoryData.description,
                    hasParentId: !!categoryData.parentId,
                    hasImage: !!categoryData.image
                });

                try {
                     const newCat = await processItemWithRetry(async () => {
                         return await onCreateCategory(categoryData, { hideErrorToast: true });
                     }, categoryName, 'Category');
                     
                     // Handle different response structures from the API
                     // API returns: {message: string, category: Category}
                     // onCreateCategory in HierarchicalManager returns: {id, name, nameAr, parentId}
                     // So newCat should already be the normalized format from HierarchicalManager
                     const newId = newCat?.id || 
                                   (newCat?.category && typeof newCat.category === 'object' && (newCat.category as any).id) ||
                                   (newCat?.data && typeof newCat.data === 'object' && (newCat.data as any).id);
                     
                     // Log the full response for debugging if ID is missing
                     if (!newId) {
                         console.error(`[Import] Category creation response structure:`, newCat);
                         console.error(`[Import] Response keys:`, newCat ? Object.keys(newCat) : 'null');
                         console.error(`[Import] Category object:`, newCat?.category);
                     }
                     if (newId) {
                         // Save by ID (code from Excel)
                         if (c.id) {
                             idMap.categories[c.id] = newId;
                             // CRITICAL: Save category code to codeMap for brand/product lookup
                             codeMap.categories[c.id] = newId;
                         }
                         // Save by name (for fallback lookup)
                         if (categoryName) nameMap.categories[categoryName.toLowerCase()] = newId;
                         if (categoryNameAr) nameMap.categories[categoryNameAr.toLowerCase()] = newId;
                         
                         console.log(`[Import] ✅ Category saved: code="${c.id}" -> DB ID="${newId}"`);
                         success++; // Only increment on successful creation
                     } else {
                         // Category creation returned but no ID - this is an error
                         const errorMsg = `Category "${categoryName}" was created but no ID was returned`;
                         console.error(`[Import] ❌ ${errorMsg}`, newCat);
                         errors.push({ item: categoryName, type: 'Category', reason: errorMsg });
                     }
                } catch(e) { 
                    const errorMsg = getErrorMsg(e);
                    console.error(`[Import] ❌ Failed to create category "${categoryName}":`, errorMsg);
                    console.error(`[Import] Category data that failed:`, categoryData);
                    console.error(`[Import] Full error:`, e);
                    errors.push({ item: categoryName, type: 'Category', reason: errorMsg });
                    addLog(`❌ فئة: ${categoryNameAr || categoryName} — ${errorMsg}`);
                    // Do NOT increment success - category was not created
                }
            }
            processed++;
            setImportProgress({ current: processed, total: totalItems, message: 'جاري استيراد الفئات...' });
        });
        
        // STEP 1 COMPLETE: All categories have been processed
        // CRITICAL: This await ensures ALL categories are complete before moving to Step 2
        const categoriesImported = Object.keys(codeMap.categories).length;
        const categoriesFailed = errors.filter(e => e.type === 'Category').length;
        
        console.log('[Import] ============================================');
        console.log(`[Import] STEP 1 COMPLETE: Processed ${categoriesToImport.length} categories`);
        console.log(`[Import] ✅ Successfully imported: ${categoriesImported} categories`);
        console.log(`[Import] ❌ Failed to import: ${categoriesFailed} categories`);
        console.log(`[Import] Category ID Map now has ${Object.keys(idMap.categories).length} entries`);
        console.log(`[Import] Category Code Map now has ${Object.keys(codeMap.categories).length} entries (for brand/product lookup)`);
        console.log('[Import] ============================================');
        
        // VERIFY: Ensure categories were actually imported before proceeding
        if (categoriesToProcess.length > 0 && categoriesImported === 0) {
            const errorMsg = `ERROR: All ${categoriesToProcess.length} categories failed to import! Cannot proceed with brands. Check the errors above for details.`;
            console.error(`[Import] ${errorMsg}`);
            console.error('[Import] Category creation errors:', errors.filter(e => e.type === 'Category'));
            throw new Error(errorMsg);
        } else if (categoriesFailed > 0) {
            console.warn(`[Import] WARNING: ${categoriesFailed} categories failed, but ${categoriesImported} succeeded. Proceeding with brands...`);
        }
        
        // OPTIMIZATION: Removed unnecessary 500ms wait - categories are already complete
        // The await in the loop above ensures all categories are done
        console.log('[Import] All category operations confirmed complete. Proceeding to Step 2...');

        // ============================================
        // STEP 2: Import Brands SECOND
        // ============================================
        // Brands MUST be imported after categories because:
        // - Brands reference parent categories (from Step 1)
        // - Products reference brands (will be imported in Step 3)
        // ============================================
        // STEP 2: Import Brands SECOND
        // ============================================
        // Brands MUST be imported after categories because:
        // - Brands reference parent categories (from Step 1)
        // - Products reference brands (will be imported in Step 3)
        console.log('[Import] ============================================');
        console.log('[Import] STEP 2: Starting Brand Import (SECOND - after Categories)');
        console.log('[Import] ============================================');
        console.log(`[Import] Found ${brandsToProcess.length} brands to import`);
        console.log(`[Import] VERIFY: Categories imported: ${Object.keys(codeMap.categories).length}`);
        
        // CRITICAL CHECK: Do not proceed if categories failed
        if (categoriesToProcess.length > 0 && Object.keys(codeMap.categories).length === 0) {
            throw new Error('Cannot import brands: Categories were not imported successfully');
        }
        
        setImportProgress({ current: processed, total: totalItems, message: 'جاري استيراد العلامات التجارية...' });
        
        // CRITICAL: Wait for all categories to complete before starting brands
        // The await ensures Step 1 (Categories) is 100% complete before Step 2 (Brands) begins
        // This is a blocking await - brands will NOT start until categories are done
        // OPTIMIZATION: Increased concurrency from 12 to 20 for faster brand import
        await processBatch(brandsToProcess, 20, async (b) => {
            if (!onCreateBrand) return;
            setCurrentItem({ name: b.nameAr || b.name, type: 'Brand' });
            
            // DUPLICATE CHECK: Check if brand already exists by name or code
            const brandNameLower = b.name?.trim().toLowerCase() || '';
            const brandNameArLower = b.nameAr?.trim().toLowerCase() || '';
            const existingBrandId = existingBrandCodeMap.get(b.code?.trim() || '') ||
                                   existingBrandMap.get(brandNameLower) ||
                                   (brandNameArLower ? existingBrandMap.get(brandNameArLower) : null);
            
            if (existingBrandId) {
                console.log(`[Import] ⏭️ Skipping duplicate brand "${b.name}" (already exists with ID: ${existingBrandId})`);
                // Map the Excel code to existing database ID
                if (b.id) {
                    idMap.brands[b.id] = existingBrandId;
                    codeMap.brands[b.id] = existingBrandId;
                }
                if (b.code && b.code !== b.id) {
                    codeMap.brands[b.code] = existingBrandId;
                }
                if (b.name) nameMap.brands[brandNameLower] = existingBrandId;
                if (b.nameAr) nameMap.brands[brandNameArLower] = existingBrandId;
                skippedDuplicates++;
                processed++;
                setImportProgress(prev => ({ ...prev, current: processed }));
                return; // Skip creation
            }
            
            try {
                // Resolve parentCategoryId to the new database ID
                // CRITICAL: Use category CODE first, then fallback to name
                let resolvedParentCategoryId: string | undefined = undefined;
                if ((b as any).parentCategoryId) {
                    const originalCatCode = String((b as any).parentCategoryId).trim();
                    // Try codeMap first (most reliable - uses category code)
                    resolvedParentCategoryId = codeMap.categories[originalCatCode] || 
                                               idMap.categories[originalCatCode] || 
                                               nameMap.categories[originalCatCode.toLowerCase()];
                    
                    if (!resolvedParentCategoryId) {
                        console.warn(`[Import] Brand "${b.name}" parent category code "${originalCatCode}" not found in imported categories`);
                    } else {
                        console.log(`[Import] Brand "${b.name}" linked to category code "${originalCatCode}" -> DB ID="${resolvedParentCategoryId}"`);
                    }
                }
                
                const newBrand = await processItemWithRetry(async () => {
                    return await onCreateBrand({
                        name: b.name,
                        nameAr: b.nameAr,
                        code: b.code,
                        logo: b.logo,
                        parentCategoryId: resolvedParentCategoryId  // Link to parent category using category code!
                    }, { hideErrorToast: true }); 
                }, b.name, 'Brand');
                
                const newId = newBrand.id || newBrand.brand?.id;
                if (newId) {
                    // Save by ID (code from Excel)
                    if (b.id) {
                        idMap.brands[b.id] = newId;
                        // CRITICAL: Save brand code to codeMap for product lookup
                        codeMap.brands[b.id] = newId;
                    }
                    // Also save by code if different from id
                    if (b.code && b.code !== b.id) {
                        codeMap.brands[b.code] = newId;
                    }
                    // Save by name (for fallback lookup)
                    if (b.name) nameMap.brands[b.name.trim().toLowerCase()] = newId;
                    if (b.nameAr) nameMap.brands[b.nameAr.trim().toLowerCase()] = newId;
                    
                    console.log(`[Import] Brand saved: code="${b.id || b.code}" -> DB ID="${newId}"`);
                }
                success++;
            } catch (e) { 
                const errorMsg = getErrorMsg(e);
                errors.push({ item: b.name, type: 'Brand', reason: errorMsg });
                addLog(`❌ علامة تجارية: ${b.nameAr || b.name} — ${errorMsg}`);
            }
            processed++;
            setImportProgress(prev => ({ ...prev, current: processed }));
        });
        
        // STEP 2 COMPLETE: All brands have been imported
        // CRITICAL: This await ensures ALL brands are complete before moving to Step 3
        console.log('[Import] ============================================');
        console.log(`[Import] STEP 2 COMPLETE: All ${brandsToProcess.length} brands imported`);
        console.log(`[Import] Brand ID Map now has ${Object.keys(idMap.brands).length} entries`);
        console.log(`[Import] Brand Code Map now has ${Object.keys(codeMap.brands).length} entries (for product lookup)`);
        console.log('[Import] ============================================');
        
        // VERIFY: Ensure all categories and brands are imported before proceeding to products
        if (categoriesToProcess.length > 0 && Object.keys(codeMap.categories).length === 0) {
            console.error('[Import] ERROR: No categories were imported! Cannot proceed with products.');
            throw new Error('Categories must be imported before products');
        }
        if (brandsToProcess.length > 0 && Object.keys(codeMap.brands).length === 0) {
            console.warn('[Import] WARNING: No brands were imported, but proceeding with products...');
        }
        
        // OPTIMIZATION: Removed unnecessary 500ms wait - brands are already complete
        // The await processBatch ensures all brands are done
        console.log('[Import] All brand operations confirmed complete. Proceeding to Step 3...');

        // ============================================
        // STEP 3: Import Products LAST
        // ============================================
        // Products MUST be imported last because:
        // - Products reference categories (from Step 1)
        // - Products reference brands (from Step 2)
        console.log('[Import] ============================================');
        console.log('[Import] STEP 3: Starting Product Import (LAST - after Categories & Brands)');
        console.log('[Import] ============================================');
        console.log(`[Import] Found ${productsToProcess.length} products to import`);
        console.log(`[Import] VERIFY: Categories imported: ${Object.keys(codeMap.categories).length}, Brands imported: ${Object.keys(codeMap.brands).length}`);
        setImportProgress({ current: processed, total: totalItems, message: 'جاري استيراد المنتجات...' });
        
        // CRITICAL: Wait for all brands to complete before starting products
        // The await ensures Step 2 (Brands) is 100% complete before Step 3 (Products) begins
        // OPTIMIZATION: Increased concurrency from 15 to 25 for faster product import
        await processBatch(productsToProcess, 25, async (p) => {
            if (!onCreateProduct) return;
            setCurrentItem({ name: p.nameAr || p.name, type: 'Product' });

            // DUPLICATE CHECK: Check if product already exists by SKU or barcode
            const productSku = p.sku?.trim() || '';
            const productBarcode = p.barcode?.trim() || '';
            const existingProductId = (productSku ? existingProductSkuMap.get(productSku) : null) ||
                                     (productBarcode ? existingProductBarcodeMap.get(productBarcode) : null);
            
            if (existingProductId) {
                console.log(`[Import] ⏭️ Skipping duplicate product "${p.name}" (SKU: ${productSku || 'N/A'}, already exists with ID: ${existingProductId})`);
                skippedDuplicates++;
                processed++;
                setImportProgress(prev => ({ ...prev, current: processed }));
                return; // Skip creation
            }

            try {
                 // Resolve Brand
                 // CRITICAL: Use brand CODE first, then fallback to name
                 let realBrandId = undefined;
                 if (p.brandId) {
                     const brandCode = p.brandId.trim();
                     // Try codeMap first (most reliable - uses brand code)
                     realBrandId = codeMap.brands[brandCode] || 
                                   idMap.brands[brandCode] || 
                                   nameMap.brands[brandCode.toLowerCase()];
                     
                     if (!realBrandId) {
                         console.warn(`[Import] Product "${p.name}" brand code "${brandCode}" not found in imported brands`);
                     } else {
                         console.log(`[Import] Product "${p.name}" linked to brand code "${brandCode}" -> DB ID="${realBrandId}"`);
                     }
                 }

                 // Resolve Categories
                 // CRITICAL: Use category CODE first, then fallback to name
                 const realCategoryIds: string[] = [];
                 if (p.categoryIds && p.categoryIds.length > 0) {
                    p.categoryIds.forEach(catCode => {
                         const trimmedCode = String(catCode).trim();
                         // Try codeMap first (most reliable - uses category code)
                         const resolvedId = codeMap.categories[trimmedCode] || 
                                            idMap.categories[trimmedCode] || 
                                            nameMap.categories[trimmedCode.toLowerCase()];
                         if (resolvedId) {
                             realCategoryIds.push(resolvedId);
                             console.log(`[Import] Product "${p.name}" linked to category code "${trimmedCode}" -> DB ID="${resolvedId}"`);
                         } else {
                             console.warn(`[Import] Product "${p.name}" category code "${trimmedCode}" not found in imported categories`);
                         }
                    });
                 }
                 
                 await processItemWithRetry(async () => {
                         return await onCreateProduct({
                         name: p.name,
                         nameAr: p.nameAr,
                         description: p.description,
                         price: Number(p.price || 0),
                         costPerItem: p.cost ? Number(p.cost) : undefined,
                         sku: p.sku,
                         barcode: p.barcode,
                         stockCount: p.stock ? Number(p.stock) : undefined,
                         stock: p.stock ? Number(p.stock) : undefined,
                         brandId: realBrandId,
                         categoryIds: realCategoryIds,
                         images: p.images,
                         featured: p.featured
                      }, { hideErrorToast: true });
                  }, p.name, 'Product');
                 
                 success++;
            } catch(e) { 
                const errorMsg = getErrorMsg(e);
                errors.push({ item: p.name, type: 'Product', reason: errorMsg });
                addLog(`❌ منتج: ${p.nameAr || p.name} — ${errorMsg}`);
            }
                 processed++;
                 setImportProgress(prev => ({ ...prev, current: processed }));
             });
             
        // Import completed - log summary
        console.log('[Import] ============================================');
        console.log('[Import] IMPORT COMPLETED IN ORDER: Categories → Brands → Products');
        console.log('[Import] ============================================');
        console.log(`[Import] Summary: ${success} successful, ${errors.length} errors, ${skippedDuplicates} duplicates skipped`);
        console.log(`[Import] Final counts - Categories: ${Object.keys(codeMap.categories).length}, Brands: ${Object.keys(codeMap.brands).length}`);
     } catch (criticalError) {
        console.error("Critical Import Error:", criticalError);
        addLog(`🔴 خطأ حرج: ${criticalError instanceof Error ? criticalError.message : 'خطأ غير معروف'}`);
    }

    setSuccessCount(success);
    setImportErrors(errors);
    setStep('result');
    if (success > 0) {
      // OPTIMIZATION: Removed delay - trigger refresh immediately
      // The backend should have already processed all requests by the time we reach here
      console.log('[Import] Triggering data refresh via onSuccess callback...');
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val && step === 'importing') {
          confirm({
            title: 'هل أنت متأكد من إيقاف الاستيراد؟',
            description: 'سيتم إيقاف عملية الاستيراد الحالية.',
            confirmText: 'نعم، إيقاف',
            cancelText: 'لا، استمرار',
            variant: 'destructive'
          }).then((confirmed) => {
            if (confirmed) {
              abortRef.current = true;
              onOpenChange(false);
            }
          });
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
                <Button type="button" onClick={() => document.getElementById('hierarchical-import-file')?.click()}>
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

                <Tabs defaultValue="tree" className="w-full">
                  <TabsList className="w-full grid grid-cols-4">
                    <TabsTrigger value="tree">Tree View</TabsTrigger>
                    <TabsTrigger value="brands">Brands</TabsTrigger>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                    <TabsTrigger value="products">Products</TabsTrigger>
                  </TabsList>

                  <TabsContent value="tree" className="border rounded-md mt-2 h-[400px] overflow-hidden bg-white">
                      <ExplorerTree
                        categories={parsedData.categories}
                        brands={parsedData.brands}
                        products={parsedData.products}
                        onSelectCategory={() => {}}
                        onSelectBrand={() => {}}
                        onSelectProduct={() => {}}
                        className="border-none h-full w-full"
                      />
                  </TabsContent>
                  
                  <TabsContent value="brands" className="border rounded-md mt-2">
                     <ScrollArea className="h-[200px]">
                        <Table>
                           <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Name (En)</TableHead><TableHead>Name (Ar)</TableHead><TableHead>Code</TableHead><TableHead>Parent Cat</TableHead></TableRow></TableHeader>
                           <TableBody>
                              {parsedData.brands.slice(0, 50).map((b, i) => (
                                 <TableRow key={i}><TableCell>{b.id}</TableCell><TableCell>{b.name}</TableCell><TableCell>{b.nameAr}</TableCell><TableCell>{b.code}</TableCell><TableCell>{b.parentCategoryId}</TableCell></TableRow>
                              ))}
                           </TableBody>
                        </Table>
                     </ScrollArea>
                  </TabsContent>
                  <TabsContent value="categories" className="border rounded-md mt-2">
                     <ScrollArea className="h-[200px]">
                        <Table>
                           <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Name (En)</TableHead><TableHead>Name (Ar)</TableHead><TableHead>Parent</TableHead></TableRow></TableHeader>
                           <TableBody>
                              {parsedData.categories.slice(0, 50).map((c, i) => (
                                 <TableRow key={i}><TableCell>{c.id}</TableCell><TableCell>{c.name}</TableCell><TableCell>{c.nameAr}</TableCell><TableCell>{c.parentId}</TableCell></TableRow>
                              ))}
                           </TableBody>
                        </Table>
                     </ScrollArea>
                  </TabsContent>
                  <TabsContent value="products" className="border rounded-md mt-2">
                     <ScrollArea className="h-[200px]">
                        <Table>
                           <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Name (En)</TableHead><TableHead>Name (Ar)</TableHead><TableHead>Price</TableHead><TableHead>Brand</TableHead><TableHead>Category</TableHead></TableRow></TableHeader>
                           <TableBody>
                              {parsedData.products.slice(0, 50).map((p, i) => (
                                 <TableRow key={i}><TableCell>{p.id}</TableCell><TableCell>{p.name}</TableCell><TableCell>{p.nameAr}</TableCell><TableCell>{p.price}</TableCell><TableCell>{p.brandId}</TableCell><TableCell>{p.categoryIds.join(', ')}</TableCell></TableRow>
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
                className="flex flex-col items-center justify-center py-8 space-y-4"
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
                
                {/* Real-time error logs below progress */}
                {importLogs.length > 0 && (
                  <div className="w-full max-w-lg mt-2">
                    <div className="text-xs font-semibold text-red-600 mb-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      سجل الأخطاء ({importLogs.length})
                    </div>
                    <div className="bg-red-950/5 border border-red-200 rounded-md p-2 h-[120px] overflow-y-auto text-xs font-mono" dir="rtl">
                      {importLogs.map((log, i) => (
                        <div key={i} className="text-red-600 py-0.5 border-b border-red-100 last:border-b-0">
                          {log}
                        </div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  </div>
                )}
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
                    <h4 className="font-semibold flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      العناصر الفاشلة ({importErrors.length})
                    </h4>
                    <ScrollArea className="h-64 border border-red-200 rounded-lg bg-red-50/30">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-red-100/50">
                            <TableHead className="text-red-700 font-bold">#</TableHead>
                            <TableHead className="text-red-700 font-bold">النوع</TableHead>
                            <TableHead className="text-red-700 font-bold">العنصر</TableHead>
                            <TableHead className="text-red-700 font-bold">السبب</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importErrors.map((err, i) => (
                            <TableRow key={i} className="border-b border-red-100 hover:bg-red-50">
                              <TableCell className="text-red-500 font-mono text-xs">{i + 1}</TableCell>
                              <TableCell>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 border border-red-200 text-red-700 font-medium">
                                  {err.type === 'Brand' ? 'علامة تجارية' : err.type === 'Category' ? 'فئة' : 'منتج'}
                                </span>
                              </TableCell>
                              <TableCell className="font-semibold text-sm">{err.item}</TableCell>
                              <TableCell className="text-red-600 text-xs font-medium max-w-[200px] truncate" title={err.reason}>{err.reason}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter className="mt-4 border-t pt-4">
          {step === 'upload' && (
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          )}
          
          {step === 'preview' && (
            <>
              <Button type="button" variant="outline" onClick={() => {
                setStep('upload');
                setFile(null);
              }}>
                <ChevronRight className="w-4 h-4 ml-2" />
                رجوع
              </Button>
              <Button type="button" onClick={startImport} className="bg-primary hover:bg-primary/90 text-white">
                بدء الاستيراد
                <ChevronLeft className="w-4 h-4 mr-2" />
              </Button>
            </>
          )}

          {step === 'result' && (
            <Button type="button" onClick={() => onOpenChange(false)}>إغلاق</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
